import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditRenderSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.render.js'),
  'utf8'
);
const auditBatchActionsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.batch-actions.js'),
  'utf8'
);
const auditDataSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.data.js'),
  'utf8'
);
const auditEvidenceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.evidence.js'),
  'utf8'
);
const auditWorkspaceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);
const auditAttachmentsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-attachments.js'),
  'utf8'
);
const auditDetachedPreviewSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js'),
  'utf8'
);
const auditPreviewActionsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-preview-actions.js'),
  'utf8'
);
const uploadPolicySource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/internal-server/src/lib/document-upload-policy.js'),
  'utf8'
);
const filesServiceSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/internal-server/src/services/files.js'),
  'utf8'
);

test('audit lux batch entry waits for the server save before rendering success', () => {
  assert.match(auditBatchActionsSource, /async function saveAuditLuxBatchEntries/);
  assert.match(auditBatchActionsSource, /saved = await Promise\.resolve\(saveAuditData\(dataKey, data\)\)/);
  assert.match(auditBatchActionsSource, /조도 일괄 입력을 서버에 저장하지 못했습니다/);
  assert.match(auditBatchActionsSource, /Object\.assign\(data, previousData\)/);
  assert.doesNotMatch(auditRenderSource, /async function saveAuditLuxBatchEntries/);
});

test('audit lux evidence validates at the server boundary and avoids deleting old files after a failed record save', () => {
  assert.match(uploadPolicySource, /'audit\.lux\.evidence'/);
  assert.match(uploadPolicySource, /function isAuditLuxEvidenceUpload/);
  assert.match(filesServiceSource, /validateDocumentUploadPolicy\(\{/);
  assert.match(filesServiceSource, /const binary = Buffer\.from/);
  assert.match(auditEvidenceSource, /saved = await Promise\.resolve\(saveAuditData\(dataKey, data\)\)/);
  assert.match(auditEvidenceSource, /ownerKey: `\$\{String\(dataKey \|\| ''\)\.trim\(\)\}:\$\{Number\(year\)\}:Q\$\{targetQuarter\}:\$\{String\(team \|\| ''\)\.trim\(\)\}`/);
  assert.match(auditEvidenceSource, /quarter: targetQuarter/);
  assert.match(auditEvidenceSource, /normalizeAuditLuxEvidenceQuarter\(item\) === targetQuarter/);
  assert.match(auditEvidenceSource, /deleteAuditEvidenceFromServer\(uploaded\)/);
  assert.match(auditEvidenceSource, /throw new Error\('audit_lux_evidence_record_save_failed'\)/);
  assert.doesNotMatch(auditDataSource, /async function replaceAuditLuxEvidenceForYear/);
  assert.match(auditWorkspaceSource, /첨부 파일은 올라갔지만 조도 기록 저장이 실패해 교체를 취소했습니다/);
});

test('audit lux evidence keeps attachments quarter-aware in labels filters and workspace replacement', () => {
  assert.match(auditEvidenceSource, /function normalizeAuditLuxEvidenceQuarter/);
  assert.match(auditEvidenceSource, /const legacyQuarter = targetYear === 2026 \? 2 : 4/);
  assert.match(auditEvidenceSource, /function getAuditLuxEvidencePeriodLabel/);
  assert.match(auditEvidenceSource, /quarterIndex\(makeQuarterKey\(year, normalizeAuditLuxEvidenceQuarter\(item\)\)\)/);
  assert.match(auditRenderSource, /getAuditLuxEvidencePeriodLabel\(item\)/);
  assert.match(auditAttachmentsSource, /setAuditLuxAttachmentQuarterForTarget/);
  assert.match(auditAttachmentsSource, /getAuditLuxQuarterSelectOptionsForYear/);
  assert.match(auditWorkspaceSource, /audit-lux-index-card-quarter-select/);
  assert.match(auditWorkspaceSource, /replaceAuditLuxEvidenceForYear\(dataKey, targetYear, targetTeam, targetQuarter, file\)/);
});

test('audit lux workspace loads detached preview template before workspace behavior', () => {
  assert.match(auditDetachedPreviewSource, /KPIAuditLuxDetachedPreview/);
  assert.match(auditDetachedPreviewSource, /function buildAuditLuxDetachedPreviewHtml/);
  assert.match(auditPreviewActionsSource, /KPIAuditLuxDetachedPreview must load before KPI\.audit\.records\.lux-preview-actions\.js/);
  assert.doesNotMatch(auditWorkspaceSource, /function buildAuditLuxDetachedPreviewHtml/);
});
