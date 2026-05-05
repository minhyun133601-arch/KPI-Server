import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const detachedPreviewSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js'),
  'utf8'
);
const previewActionsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-preview-actions.js'),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(['global', 'This'].join('') + '|window' + '\\.');

function createPopup() {
  const popup = {
    closed: false,
    focused: false,
    html: '',
    document: {
      open() {
        popup.html = '';
      },
      write(html) {
        popup.html += html;
      },
      close() {},
    },
    focus() {
      popup.focused = true;
    },
  };
  return popup;
}

function createPreviewActionsContext({ blockedPopup = false } = {}) {
  const openCalls = [];
  const popup = createPopup();
  let openCount = 0;
  const context = {
    console,
    Number,
    String,
    Object,
    parseFloat,
    open(...args) {
      openCalls.push(args);
      openCount += 1;
      return blockedPopup && openCount === 1 ? null : popup;
    },
    escapeHtml(value) {
      return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    isAuditLuxDataKey(dataKey) {
      return dataKey === 'audit_lux';
    },
    getAuditLuxWorkspaceState() {
      return {
        entryForm: {
          year: '2026',
          team: 'A team',
        },
      };
    },
    getAuditLuxYearEvidenceItem() {
      return {
        fileName: 'scan.png',
        rotate: '90',
      };
    },
    getAuditEvidenceViewUrl() {
      return '/files/scan.png?x=1&y=2';
    },
    getAuditEvidenceDownloadUrl() {
      return '/download/scan.png';
    },
    getAuditEvidenceFileLabel(item) {
      return item.fileName;
    },
    isAuditEvidencePdf() {
      return false;
    },
    showToast(message) {
      context.toast = message;
    },
    openCalls,
    popup,
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(detachedPreviewSource, context, {
    filename: 'KPI.audit.records.lux-detached-preview.js',
  });
  vm.runInContext(previewActionsSource, context, {
    filename: 'KPI.audit.records.lux-preview-actions.js',
  });
  return context;
}

test('audit lux preview actions open and sync detached preview through the browser adapter', () => {
  const context = createPreviewActionsContext();

  context.openAuditLuxDetachedPreview('audit_lux');

  assert.deepEqual(context.openCalls[0], [
    '',
    'kpi_audit_lux_detached_preview',
    'popup=yes,width=1280,height=920,left=120,top=80,resizable=yes,scrollbars=yes',
  ]);
  assert.equal(context.popup.focused, true);
  assert.match(context.popup.html, /audit-lux-popout-image/);
  assert.match(context.popup.html, /rotate\(90deg\)/);
  assert.match(context.popup.html, /\/files\/scan\.png\?x=1&amp;y=2/);

  const state = context.KpiAuditRecordsBrowserAdapter.getRootState('__auditLuxDetachedPreviewState');
  assert.equal(state.popup, context.popup);
  assert.equal(state.dataKey, 'audit_lux');
  assert.equal(state.year, 2026);
  assert.equal(state.team, 'A team');
});

test('audit lux preview actions use adapter popout fallback when the popup is blocked', () => {
  const context = createPreviewActionsContext({ blockedPopup: true });

  context.openAuditLuxDetachedPreview('audit_lux');

  assert.equal(context.openCalls.length, 2);
  assert.deepEqual(context.openCalls[1], ['/files/scan.png?x=1&y=2', '_blank', 'noopener']);
  assert.match(context.toast, /./);
});

test('audit lux preview actions load after detached preview and avoid direct browser globals', () => {
  const adapterScript = 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js';
  const detachedScript = 'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js';
  const previewActionsScript = 'audit/runtime/audit/records/KPI.audit.records.lux-preview-actions.js';
  const adapterHtmlIndex = kpiHtmlSource.indexOf(adapterScript);
  const detachedHtmlIndex = kpiHtmlSource.indexOf(detachedScript);
  const previewActionsHtmlIndex = kpiHtmlSource.indexOf(previewActionsScript);
  const adapterManifestIndex = manifestSource.indexOf(adapterScript);
  const detachedManifestIndex = manifestSource.indexOf(detachedScript);
  const previewActionsManifestIndex = manifestSource.indexOf(previewActionsScript);

  assert.ok(adapterHtmlIndex >= 0, 'audit records browser adapter loader is missing');
  assert.ok(detachedHtmlIndex > adapterHtmlIndex, 'detached preview must load after the browser adapter');
  assert.ok(previewActionsHtmlIndex > detachedHtmlIndex, 'preview actions must load after detached preview');
  assert.ok(adapterManifestIndex >= 0, 'audit records browser adapter is missing from boot manifest');
  assert.ok(detachedManifestIndex > adapterManifestIndex, 'manifest must load detached preview after adapter');
  assert.ok(previewActionsManifestIndex > detachedManifestIndex, 'manifest must load preview actions after detached preview');
  assert.doesNotMatch(detachedPreviewSource, directBrowserGlobalPattern);
  assert.doesNotMatch(previewActionsSource, directBrowserGlobalPattern);
});
