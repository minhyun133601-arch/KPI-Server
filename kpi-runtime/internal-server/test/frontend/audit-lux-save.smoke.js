import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
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

test('audit lux Ctrl+S saves the file index even when sheet inputs are not rendered', async () => {
  const savedPayloads = [];
  const modifiedLabels = [];
  const payload = { entries: [], standards: [], evidence: [] };
  const context = {
    console,
    document: {
      querySelectorAll: () => [],
    },
    HTMLElement: class HTMLElement {},
    HTMLInputElement: class HTMLInputElement {},
    AppData: {
      data: {
        categories: [{ dataKey: 'audit_lux', title: '조도' }],
      },
    },
    AUDIT_LUX_BASE_YEAR: 2023,
    getAuditCurrentQuarterInfo: () => ({ year: 2026, quarter: 3 }),
    getAuditLuxAttachmentMaxQuarterForYear: () => 3,
    normalizeAuditLuxAttachmentQuarter: (_year, quarter) => quarter,
    getAuditFilterTeams: () => ['2팀'],
    getAuditEntryFormState: () => ({ year: 2026, quarter: 3, team: '2팀' }),
    isAuditLuxDataKey: (dataKey) => dataKey === 'audit_lux',
    getAuditData: () => payload,
    saveAuditData: async (dataKey, data) => {
      savedPayloads.push({ dataKey, data });
      return true;
    },
    setLastModified: (label) => modifiedLabels.push(label),
  };
  vm.createContext(context);
  vm.runInContext(auditWorkspaceSource, context, {
    filename: 'KPI.audit.records.lux-workspace.js',
  });

  const saved = await context.saveAuditLuxWorkspace('audit_lux', { silent: true });

  assert.equal(saved, true);
  assert.deepEqual(savedPayloads, [{ dataKey: 'audit_lux', data: payload }]);
  assert.deepEqual(modifiedLabels, ['조도']);

  context.saveAuditData = async () => false;
  const rejected = await context.saveAuditLuxWorkspace('audit_lux', { silent: true });

  assert.equal(rejected, false);
  assert.deepEqual(modifiedLabels, ['조도']);
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

test('audit lux evidence keeps attachments quarter-aware in labels and workspace replacement', () => {
  assert.match(auditEvidenceSource, /function normalizeAuditLuxEvidenceQuarter/);
  assert.match(auditEvidenceSource, /const legacyQuarter = targetYear === 2026 \? 2 : 4/);
  assert.match(auditEvidenceSource, /function getAuditLuxEvidencePeriodLabel/);
  assert.match(auditEvidenceSource, /quarterIndex\(makeQuarterKey\(year, normalizeAuditLuxEvidenceQuarter\(item\)\)\)/);
  assert.match(auditRenderSource, /getAuditLuxEvidencePeriodLabel\(item\)/);
  assert.doesNotMatch(auditAttachmentsSource, /setAuditLuxAttachmentQuarterForTarget/);
  assert.doesNotMatch(auditAttachmentsSource, /getAuditLuxQuarterSelectOptionsForYear/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-card-quarter-select/);
  assert.match(auditWorkspaceSource, /replaceAuditLuxEvidenceForYear\(dataKey, targetYear, targetTeam, targetQuarter, file\)/);
});

test('audit lux workspace loads detached preview template before workspace behavior', () => {
  assert.match(auditDetachedPreviewSource, /KPIAuditLuxDetachedPreview/);
  assert.match(auditDetachedPreviewSource, /function buildAuditLuxDetachedPreviewHtml/);
  assert.match(auditPreviewActionsSource, /KPIAuditLuxDetachedPreview must load before KPI\.audit\.records\.lux-preview-actions\.js/);
  assert.doesNotMatch(auditWorkspaceSource, /function buildAuditLuxDetachedPreviewHtml/);
});

test('audit lux workspace keeps a compact title-only file header', () => {
  assert.match(auditWorkspaceSource, /<div class="audit-lux-window-brand" aria-hidden="true">/);
  assert.match(auditWorkspaceSource, /<span class="audit-lux-window-icon"><i class="fa-solid fa-lightbulb"><\/i><\/span>/);
  assert.match(auditWorkspaceSource, /<h2 class="audit-lux-window-title">조도<\/h2>/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-window-kicker/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-window-desc/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-window-actions/);
  assert.doesNotMatch(auditWorkspaceSource, /getAuditLuxWorkspaceFullscreenButtonHtml/);
  assert.doesNotMatch(auditWorkspaceSource, /조도 파일/);
  assert.doesNotMatch(auditWorkspaceSource, /팀별 연도 조도본을 보관합니다/);
});

test('audit lux file index uses compact sheet rows with colored team names and no redundant status chrome', () => {
  assert.match(auditWorkspaceSource, /audit-lux-index-team-cell/);
  assert.match(auditWorkspaceSource, /audit-lux-index-team-label \$\{escapeHtml\(teamClassName\)\}/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-team-mark/);
  assert.match(auditWorkspaceSource, /audit-lux-index-team-tools/);
  assert.match(auditWorkspaceSource, /audit-lux-index-preview-cell/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-grid-head/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-inline-actions/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-progress-cell/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-team-icon/);
  assert.doesNotMatch(auditWorkspaceSource, /getAuditLuxTeamIconSvg/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-card-status/);
  assert.doesNotMatch(auditWorkspaceSource, /statusLabel/);
  assert.doesNotMatch(auditWorkspaceSource, /`\$\{teamLabel\} 미첨부`/);
});
