import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditRecordsDir = path.join(repoRoot, 'audit/runtime/audit/records');
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

const splitFiles = [
  'KPI.audit.records.data.js',
  'KPI.audit.records.quarter.js',
  'KPI.audit.records.options.js',
  'KPI.audit.records.ui-actions.js',
  'KPI.audit.records.lux-data.js',
  'KPI.audit.records.evidence.js',
  'KPI.audit.records.lux-detached-preview.js',
  'KPI.audit.records.lux-preview-actions.js',
  'KPI.audit.records.lux-alerts.js',
  'KPI.audit.records.lux-fullscreen.js',
  'KPI.audit.records.lux-attachments.js',
  'KPI.audit.records.lux-pdf-thumbnails.js',
  'KPI.audit.records.lux-workspace.js',
  'KPI.audit.records.batch-actions.js',
  'KPI.audit.records.standard-actions.js',
  'KPI.audit.records.util-format.js',
  'KPI.audit.records.render.js',
];

async function readAuditFile(fileName) {
  return fs.readFile(path.join(auditRecordsDir, fileName), 'utf8');
}

test('kpi html loads split audit records files in dependency order', () => {
  let previousIndex = -1;
  for (const fileName of splitFiles) {
    const scriptPath = `audit/runtime/audit/records/${fileName}`;
    const currentIndex = kpiHtmlSource.indexOf(scriptPath);
    assert.ok(currentIndex > previousIndex, `${scriptPath} should load after the previous audit record script`);
    previousIndex = currentIndex;
  }
});

test('split audit records files stay below the active maintenance threshold', async () => {
  for (const fileName of splitFiles) {
    const source = await readAuditFile(fileName);
    const lineCount = source.split(/\r?\n/).length;
    assert.ok(lineCount < 800, `${fileName} has ${lineCount} lines`);
  }
});

test('audit record behavior was moved out of the former large files', async () => {
  const dataSource = await readAuditFile('KPI.audit.records.data.js');
  const renderSource = await readAuditFile('KPI.audit.records.render.js');
  const luxWorkspaceSource = await readAuditFile('KPI.audit.records.lux-workspace.js');

  assert.doesNotMatch(dataSource, /async function replaceAuditLuxEvidenceForYear/);
  assert.doesNotMatch(renderSource, /async function saveAuditLuxBatchEntries/);
  assert.doesNotMatch(luxWorkspaceSource, /function getAuditLuxWorkspaceAlertSummary/);

  assert.match(await readAuditFile('KPI.audit.records.evidence.js'), /async function replaceAuditLuxEvidenceForYear/);
  assert.match(await readAuditFile('KPI.audit.records.batch-actions.js'), /async function saveAuditLuxBatchEntries/);
  assert.match(await readAuditFile('KPI.audit.records.lux-alerts.js'), /function getAuditLuxWorkspaceAlertSummary/);
});
