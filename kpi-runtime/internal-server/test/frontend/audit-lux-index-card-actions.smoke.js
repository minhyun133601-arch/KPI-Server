import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditWorkspaceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);
const auditAttachmentsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-attachments.js'),
  'utf8'
);
const auditPdfThumbnailSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-pdf-thumbnails.js'),
  'utf8'
);

test('audit lux keeps the standard team labels and storage keys unchanged', () => {
  const context = {
    getAuditFilterTeams() {
      return ['2팀', '3팀'];
    },
  };
  vm.createContext(context);
  vm.runInContext(auditWorkspaceSource, context);

  const teams = context.getAuditLuxWorkspaceTeams('audit_lux');
  assert.deepEqual(Array.from(teams), ['1팀 1파트', '1팀 2파트', '2팀', '3팀']);
  assert.equal(context.getAuditLuxTeamKey('1팀 1파트'), 'team1part1');
  assert.equal(context.getAuditLuxTeamKey('공무환경팀'), 'team4');
  assert.equal(context.getAuditLuxTeamKey('북정'), 'team1part1');
  assert.equal(context.getAuditLuxTeamKey('유산 2팀'), 'team4');
  assert.equal(context.getAuditLuxTeamClassName('3팀'), 'is-team3');
  assert.match(context.getAuditLuxTeamIconSvg('1팀 1파트'), /M4\.5 15\.5L15\.7 6\.1/);
  assert.match(context.getAuditLuxTeamIconSvg('2팀'), /M5 9\.2L12 12\.8L19 9\.2/);
  assert.match(context.getAuditLuxTeamIconSvg('3팀'), /M10 3\.5H14/);
  assert.match(context.getAuditLuxTeamIconSvg('공무환경팀'), /M6 18L14\.8 9\.2/);
  assert.match(auditWorkspaceSource, /const teamLabel = team \|\| '팀 없음';/);
  assert.doesNotMatch(auditWorkspaceSource, /1팀 1파트 CIP/);
  assert.match(auditWorkspaceSource, /data-team="\$\{escapeHtml\(team\)\}"/);
});

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

  const rowBlock = auditWorkspaceSource.match(/<article class="audit-lux-index-card[\s\S]*?<\/article>/);
  assert.ok(rowBlock, 'lux file sheet row must render');
  assert.match(rowBlock[0], /audit-lux-index-team-cell/);
  assert.match(rowBlock[0], /audit-lux-index-team-label \$\{escapeHtml\(teamClassName\)\}/);
  assert.doesNotMatch(rowBlock[0], /audit-lux-team-mark/);
  assert.match(rowBlock[0], /audit-lux-index-team-tools/);
  assert.match(rowBlock[0], /audit-lux-index-preview-cell/);
  assert.match(rowBlock[0], /audit-lux-progress-select/);
  assert.match(rowBlock[0], /audit-lux-progress-select \$\{progressStatusClass\}/);
  assert.match(
    auditWorkspaceSource,
    /progressStatus === 'complete'\s*\? 'is-complete'\s*:\s*\(progressStatus \? 'is-progress' : 'is-incomplete'\)/
  );
  assert.match(rowBlock[0], /classList\.toggle\('is-complete', this\.value === 'complete'\)/);
  assert.match(rowBlock[0], /classList\.toggle\('is-progress', this\.value !== '' && this\.value !== 'complete'\)/);
  assert.match(rowBlock[0], /classList\.toggle\('is-incomplete', this\.value === ''\)/);
  assert.match(rowBlock[0], /setAuditLuxProgressStatusForTarget/);
  assert.match(rowBlock[0], /audit-lux-index-replace/);
  assert.match(rowBlock[0], /audit-ref-download/);
  assert.match(rowBlock[0], /fa-arrow-rotate-right/);
  assert.match(rowBlock[0], /fa-download/);
  assert.doesNotMatch(rowBlock[0], /\\uAD50\\uCCB4/);
  assert.doesNotMatch(rowBlock[0], /\\uB2E4\\uC6B4\\uB85C\\uB4DC/);
  assert.doesNotMatch(rowBlock[0], /audit-ref-open/);
  assert.doesNotMatch(rowBlock[0], /fa-up-right-from-square/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-grid-head/);
  assert.doesNotMatch(auditWorkspaceSource, />팀<\/span>/);
  assert.doesNotMatch(auditWorkspaceSource, />첨부<\/span>/);
  assert.doesNotMatch(auditWorkspaceSource, />진행<\/span>/);
  assert.doesNotMatch(auditWorkspaceSource, />첨부 미리보기<\/span>/);
  assert.doesNotMatch(auditWorkspaceSource, />작업<\/span>/);
  assert.doesNotMatch(rowBlock[0], /audit-lux-index-progress-cell/);
  assert.doesNotMatch(rowBlock[0], /audit-lux-index-inline-actions/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-card-head/);
  assert.match(rowBlock[0], /audit-lux-index-card \$\{escapeHtml\(teamClassName\)\}/);
  assert.match(rowBlock[0], /audit-lux-index-team-icon kpi-team-display-icon" aria-hidden="true">\$\{getAuditLuxTeamIconSvg\(team\)\}/);
  assert.match(rowBlock[0], /kpi-team-display-name">\$\{escapeHtml\(teamLabel\)\}<\/span>/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-card-actions/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-year-badge/);
  assert.doesNotMatch(auditWorkspaceSource, /renderAuditLuxIndexSummary/);
  assert.doesNotMatch(auditWorkspaceSource, /audit-lux-index-summary/);
  assert.doesNotMatch(auditWorkspaceSource, /분기 완료/);
  assert.doesNotMatch(auditWorkspaceSource, /관리 분기|완료 분기|남은 분기/);
});

test('audit lux progress select is display-only and does not change attachment quarter', () => {
  assert.match(auditAttachmentsSource, /function getAuditLuxProgressStatus/);
  assert.match(auditAttachmentsSource, /function getAuditLuxProgressMaxStatusForYear/);
  assert.match(auditAttachmentsSource, /function normalizeAuditLuxProgressStatusForYear/);
  assert.match(auditAttachmentsSource, /function setAuditLuxProgressStatusForTarget/);
  assert.match(auditAttachmentsSource, /luxProgressStatus/);
  assert.match(auditAttachmentsSource, /data\.luxProgress = nextProgress/);
  assert.match(auditAttachmentsSource, /\['', '미완료'\]/);
  assert.match(auditAttachmentsSource, /\['1', '1분기'\]/);
  assert.match(auditAttachmentsSource, /\['2', '2분기'\]/);
  assert.match(auditAttachmentsSource, /\['3', '3분기'\]/);
  assert.match(auditAttachmentsSource, /\['complete', '완료'\]/);
  assert.match(auditWorkspaceSource, /const selectedQuarter = getAuditLuxSelectedAttachmentQuarter\(dataKey, year, team\)/);
  assert.match(
    auditWorkspaceSource,
    /renderAuditLuxAttachmentMedia\(dataKey, year, team, selectedQuarter, attachmentItem, openUrl\)/
  );
  assert.match(auditWorkspaceSource, /getAuditLuxProgressStatusOptions\(progressStatus, year\)/);
  assert.doesNotMatch(auditAttachmentsSource, /setAuditLuxWorkspaceTarget\(dataKey, year, team/);
  assert.doesNotMatch(auditWorkspaceSource, /setAuditLuxAttachmentQuarterForTarget/);
});

test('audit lux progress select caps options by the current date', () => {
  const savedData = {};
  const context = {
    AuditState: {},
    console,
    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>"]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      })[char]);
    },
    getAuditCurrentQuarterInfo() {
      return { year: 2026, quarter: 3 };
    },
    getQuarterInfo() {
      return { year: 2026, quarter: 3 };
    },
    getAuditData() {
      return savedData;
    },
    isAuditLuxDataKey(dataKey) {
      return dataKey === 'audit-lux';
    },
    normalizeAuditZone(value) {
      return String(value || '').trim();
    },
    saveAuditData(_dataKey, data) {
      Object.assign(savedData, data);
      return true;
    }
  };
  vm.createContext(context);
  vm.runInContext(auditAttachmentsSource, context);

  const currentYearOptions = context.getAuditLuxProgressStatusOptions('complete', 2026);
  assert.match(currentYearOptions, /value="3" selected/);
  assert.doesNotMatch(currentYearOptions, /value="complete"/);

  const previousYearOptions = context.getAuditLuxProgressStatusOptions('complete', 2025);
  assert.match(previousYearOptions, /value="complete" selected/);

  context.getAuditCurrentQuarterInfo = () => ({ year: 2026, quarter: 1 });
  const firstQuarterOptions = context.getAuditLuxProgressStatusOptions('3', 2026);
  assert.match(firstQuarterOptions, /value="1" selected/);
  assert.doesNotMatch(firstQuarterOptions, /value="2"/);
  assert.doesNotMatch(firstQuarterOptions, /value="3"/);
  assert.doesNotMatch(firstQuarterOptions, /value="complete"/);

  context.getAuditCurrentQuarterInfo = () => ({ year: 2026, quarter: 3 });
  assert.equal(context.setAuditLuxProgressStatusForTarget('audit-lux', 2026, '1팀 1파트', 'complete'), true);
  assert.equal(
    JSON.stringify(savedData.luxProgress),
    JSON.stringify([{
      year: 2026,
      team: '1팀 1파트',
      status: '3'
    }])
  );
});

test('audit lux pdf cards render first-page thumbnails with icon fallback', () => {
  assert.match(auditPdfThumbnailSource, /AUDIT_LUX_PDFJS_MODULE_URL/);
  assert.match(auditPdfThumbnailSource, /AUDIT_LUX_PDFJS_WORKER_URL/);
  assert.match(auditPdfThumbnailSource, /function loadAuditLuxPdfJs/);
  assert.match(auditPdfThumbnailSource, /pdfjs\.getDocument\(\{ url: pdfUrl, withCredentials: true \}\)/);
  assert.match(auditPdfThumbnailSource, /page\.render\(\{ canvasContext: context, viewport \}\)\.promise/);
  assert.match(auditWorkspaceSource, /data-audit-lux-pdf-thumb="\$\{escapeHtml\(dataKey\)\}"/);
  assert.match(auditWorkspaceSource, /data-audit-lux-pdf-url="\$\{escapeHtml\(viewUrl\)\}"/);
  assert.match(auditPdfThumbnailSource, /element\.replaceWith\(image\)/);
  assert.match(auditWorkspaceSource, /audit-lux-index-file-thumb is-pdf/);
  assert.match(auditPdfThumbnailSource, /audit lux pdf thumbnail fallback/);
  assert.match(auditWorkspaceSource, /initAuditLuxPdfThumbnails\(dataKey\)/);
});
