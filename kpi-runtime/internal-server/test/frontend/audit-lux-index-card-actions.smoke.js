import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditWorkspaceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);

test('audit lux index card opens originals through media and keeps replace download actions', () => {
  assert.match(auditWorkspaceSource, /function renderAuditLuxAttachmentMedia/);
  assert.match(
    auditWorkspaceSource,
    /class="audit-lux-index-card-media audit-lux-index-card-media-link" href="\$\{escapeHtml\(openUrl\)\}" target="_blank" rel="noopener"/
  );
  assert.match(
    auditWorkspaceSource,
    /renderAuditLuxAttachmentMedia\(dataKey, year, team, selectedQuarter, attachmentItem, openUrl\)/
  );
  assert.match(auditWorkspaceSource, /escapeHtml\('\\uBBF8\\uB4F1\\uB85D'\)/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-card-status/);
  assert.doesNotMatch(auditWorkspaceSource, /statusLabel/);

  const actionBlock = auditWorkspaceSource.match(/<div class="audit-lux-index-card-actions">[\s\S]*?<input/);
  assert.ok(actionBlock, 'lux file card action block must render');
  assert.match(actionBlock[0], /audit-lux-index-replace/);
  assert.match(actionBlock[0], /audit-ref-download/);
  assert.match(actionBlock[0], /\\uB2E4\\uC6B4\\uB85C\\uB4DC/);
  assert.doesNotMatch(actionBlock[0], /audit-ref-open/);
  assert.doesNotMatch(actionBlock[0], /fa-up-right-from-square/);
});
