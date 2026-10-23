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

function createAttachmentTargetRuntime() {
  const entryForm = { year: 2026, quarter: 3, team: '3팀' };
  const events = [];
  const context = {
    console: { error() {} },
    AUDIT_LUX_BASE_YEAR: 2023,
    AppData: { audit: { categories: [{ dataKey: 'audit_lux', title: '조도' }] } },
    getAuditCurrentQuarterInfo: () => ({ year: 2026, quarter: 3 }),
    getAuditEntryFormState: () => entryForm,
    getAuditFilterTeams: () => ['2팀', '3팀'],
    isAuditLuxDataKey: (dataKey) => dataKey === 'audit_lux',
    normalizeAuditZone: (value) => String(value || '').trim(),
    replaceAuditLuxEvidenceForYear: async (...args) => events.push(['replace', ...args]),
    renderAuditContent: () => events.push(['render']),
    setLastModified: (label) => events.push(['modified', label]),
    alert: (message) => events.push(['alert', message]),
  };
  vm.createContext(context);
  vm.runInContext(auditAttachmentsSource, context);
  vm.runInContext(auditWorkspaceSource, context);
  return { context, entryForm, events };
}

test('audit lux attachment upload retains its explicit year team and quarter target', async () => {
  const { context, entryForm, events } = createAttachmentTargetRuntime();
  const file = { name: 'measurement.pdf' };
  const input = { files: [file], value: 'measurement.pdf', dataset: { quarter: '1' } };

  await context.handleAuditLuxAttachmentChangeForTarget('audit_lux', 2025, '2팀', 1, input);

  assert.deepEqual(events, [
    ['replace', 'audit_lux', 2025, '2팀', 1, file],
    ['render'],
    ['modified', '조도'],
  ]);
  assert.equal(entryForm.year, 2025);
  assert.equal(entryForm.team, '2팀');
  assert.equal(entryForm.quarter, 1);
  assert.equal(input.value, '', 'a completed picker must allow choosing the same file again');
});

test('audit lux failed attachment save reports the rollback and clears the file picker', async () => {
  const { context, events } = createAttachmentTargetRuntime();
  context.replaceAuditLuxEvidenceForYear = async () => {
    throw new Error('audit_lux_evidence_record_save_failed');
  };
  const input = { files: [{ name: 'measurement.pdf' }], value: 'measurement.pdf' };

  await context.handleAuditLuxAttachmentChangeForTarget('audit_lux', 2026, '2팀', 2, input);

  assert.equal(events.length, 1);
  assert.equal(events[0][0], 'alert');
  assert.match(events[0][1], /조도 기록 저장이 실패해 교체를 취소했습니다/);
  assert.equal(input.value, '');
});
