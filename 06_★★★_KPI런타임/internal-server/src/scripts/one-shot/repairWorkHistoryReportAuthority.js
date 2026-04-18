import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';
import { closePool } from '../../db/pool.js';
import { ensureDir } from '../../lib/fs.js';
import { PERMISSION_KEYS } from '../../lib/permission-registry.js';
import { findLatestDocumentByOwner } from '../../repositories/documents.js';
import { deleteModuleRecord, findModuleRecord, upsertModuleRecord } from '../../repositories/modules.js';
import { deleteDocument, getDocumentFile, initializeFileStorage, saveBase64Document } from '../../services/files.js';

const MODULE_KEY = 'portal_data';
const WORK_RECORD_KEY = 'work_history_records';
const AUDIT_RECORD_KEY = 'audit_monthly_report';
const REPORT_TEAM_KEY = 'team4';
const REPORT_CATEGORY_GROUP = 'report';
const WORK_ATTACHMENT_TYPE = 'report';
const WORK_OWNER_DOMAIN = 'work.history';
const WORK_FILE_CATEGORY = 'report_pdf';
const backupDir = path.join(config.storageRoot, 'migration-backups');

function normalizeText(value) {
  return String(value || '').trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function parseArgs(argv) {
  return {
    write: argv.includes('--write')
  };
}

function parseDateKey(value) {
  const direct = normalizeText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
    return direct;
  }

  const match = normalizeText(value).match(/(\d{4})(\d{2})(\d{2})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function getAttachmentFileName(attachment) {
  const direct = normalizeText(
    attachment?.originalName
    || attachment?.name
    || attachment?.fileName
  );
  if (direct) return direct;

  const sourcePath = normalizeText(
    attachment?.downloadUrl
    || attachment?.previewUrl
    || attachment?.url
    || attachment?.path
  );
  if (!sourcePath) return '';
  const normalizedPath = sourcePath.replace(/\\/g, '/');
  return normalizeText(normalizedPath.split('/').pop());
}

function normalizeAuditEntry(entry) {
  if (!isPlainObject(entry)) return null;
  const originalName = normalizeText(entry.originalName || entry.fileName || entry.name);
  const dateKey = parseDateKey(entry.dateKey || entry.dateLabel || originalName || entry.title);
  const documentId = normalizeText(entry.documentId || entry.fileId);
  if (!originalName || !dateKey || !documentId) {
    return null;
  }

  return {
    originalName,
    dateKey,
    documentId,
    mimeType: normalizeText(entry.mimeType) || 'application/octet-stream',
    byteSize: Number(entry.byteSize) || 0,
    workContent: normalizeText(entry.name || originalName) || originalName
  };
}

function getAuditEntries(record) {
  const entries = Array.isArray(record?.payload?.entries) ? record.payload.entries : [];
  return entries
    .map((entry) => normalizeAuditEntry(entry))
    .filter(Boolean)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}

function createEmptyAttachmentSlots() {
  return {
    billing: null,
    report: null
  };
}

function buildWorkOwnerKey(entry) {
  return [
    WORK_RECORD_KEY,
    REPORT_TEAM_KEY,
    WORK_ATTACHMENT_TYPE,
    entry.dateKey,
    entry.originalName
  ].filter(Boolean).join(':');
}

function buildDocumentViewUrl(documentId) {
  return `/api/files/${encodeURIComponent(documentId)}/view`;
}

function buildDocumentDownloadUrl(documentId) {
  return `/api/files/${encodeURIComponent(documentId)}/download`;
}

function buildManagedAttachment(documentRecord) {
  return {
    attachmentType: WORK_ATTACHMENT_TYPE,
    originalName: normalizeText(documentRecord.original_name),
    storedName: normalizeText(documentRecord.stored_name),
    url: buildDocumentViewUrl(documentRecord.id),
    previewUrl: buildDocumentViewUrl(documentRecord.id),
    downloadUrl: buildDocumentDownloadUrl(documentRecord.id),
    size: Number(documentRecord.byte_size) || 0,
    mimeType: normalizeText(documentRecord.mime_type) || 'application/octet-stream',
    documentId: normalizeText(documentRecord.id),
    storageRelPath: normalizeText(documentRecord.storage_rel_path),
    fileCategory: normalizeText(documentRecord.file_category) || WORK_FILE_CATEGORY
  };
}

function getExistingReportIdentity(record) {
  const reportAttachment = isPlainObject(record?.attachmentSlots?.report)
    ? record.attachmentSlots.report
    : (isPlainObject(record?.reportAttachment) ? record.reportAttachment : null);
  const fileName = getAttachmentFileName(reportAttachment) || normalizeText(record?.workContent);
  const dateKey = parseDateKey(record?.startDate || record?.endDate || fileName);
  return {
    fileName: normalizeText(fileName).toLowerCase(),
    dateKey
  };
}

function findMatchingReportRecordIndex(records, entry) {
  const entryFileName = normalizeText(entry.originalName).toLowerCase();
  return records.findIndex((record) => {
    if (!isPlainObject(record)) return false;
    if (normalizeText(record.team) !== REPORT_TEAM_KEY) return false;
    if (normalizeText(record.categoryGroup) !== REPORT_CATEGORY_GROUP) return false;

    const identity = getExistingReportIdentity(record);
    return identity.dateKey === entry.dateKey && identity.fileName === entryFileName;
  });
}

function compareRecordsDesc(left, right) {
  const endDiff = normalizeText(right?.endDate).localeCompare(normalizeText(left?.endDate));
  if (endDiff !== 0) return endDiff;

  const startDiff = normalizeText(right?.startDate).localeCompare(normalizeText(left?.startDate));
  if (startDiff !== 0) return startDiff;

  return normalizeText(left?.workContent).localeCompare(normalizeText(right?.workContent), 'ko');
}

function buildNextReportRecord(existingRecord, entry, attachment) {
  const nextRecord = isPlainObject(existingRecord) ? cloneJson(existingRecord) : {};
  const existingSlots = isPlainObject(nextRecord.attachmentSlots)
    ? cloneJson(nextRecord.attachmentSlots)
    : createEmptyAttachmentSlots();
  const billingAttachment = existingSlots.billing && isPlainObject(existingSlots.billing)
    ? cloneJson(existingSlots.billing)
    : (isPlainObject(nextRecord.billingAttachment) ? cloneJson(nextRecord.billingAttachment) : null);

  nextRecord.team = REPORT_TEAM_KEY;
  nextRecord.startDate = entry.dateKey;
  nextRecord.endDate = entry.dateKey;
  nextRecord.categoryGroup = REPORT_CATEGORY_GROUP;
  nextRecord.category = normalizeText(nextRecord.category);
  nextRecord.kpi = false;
  nextRecord.assignees = Array.isArray(nextRecord.assignees) && nextRecord.assignees.length
    ? nextRecord.assignees.map((item) => normalizeText(item)).filter(Boolean)
    : ['미정'];
  nextRecord.assignee = normalizeText(nextRecord.assignee) || nextRecord.assignees.join(', ');
  nextRecord.workContent = normalizeText(nextRecord.workContent) || entry.workContent || entry.originalName;
  nextRecord.remarks = normalizeText(nextRecord.remarks);
  nextRecord.attachmentSlots = {
    billing: billingAttachment,
    report: cloneJson(attachment)
  };
  nextRecord.billingAttachment = billingAttachment ? cloneJson(billingAttachment) : null;
  nextRecord.reportAttachment = cloneJson(attachment);
  nextRecord.attachments = [billingAttachment, attachment]
    .filter(Boolean)
    .map((item) => cloneJson(item));
  return nextRecord;
}

function createSummary({ workRecord, auditRecord, auditEntries }) {
  return {
    workRecordVersion: Number(workRecord?.version) || 0,
    auditRecordVersion: Number(auditRecord?.version) || 0,
    auditEntryCount: auditEntries.length,
    reusedWorkDocumentCount: 0,
    copiedWorkDocumentCount: 0,
    updatedExistingRecordCount: 0,
    createdRecordCount: 0,
    deletedAuditDocumentCount: 0,
    deletedAuditRecord: false,
    unresolvedCount: 0,
    backupPath: '',
    items: []
  };
}

async function writeBackupSnapshot(workRecord, auditRecord) {
  await ensureDir(backupDir);
  const filePath = path.join(
    backupDir,
    `work-history-report-authority-${Date.now()}.json`
  );
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        workHistoryRecord: workRecord
          ? {
              moduleKey: workRecord.module_key,
              recordKey: workRecord.record_key,
              version: workRecord.version,
              updatedAt: workRecord.updated_at,
              payload: workRecord.payload
            }
          : null,
        auditMonthlyReportRecord: auditRecord
          ? {
              moduleKey: auditRecord.module_key,
              recordKey: auditRecord.record_key,
              version: auditRecord.version,
              updatedAt: auditRecord.updated_at,
              payload: auditRecord.payload
            }
          : null
      },
      null,
      2
    ),
    'utf8'
  );
  return filePath;
}

async function resolveOrCreateWorkDocument(entry, permissionKey, options, summary) {
  const ownerKey = buildWorkOwnerKey(entry);
  let workDocument = await findLatestDocumentByOwner({
    ownerDomain: WORK_OWNER_DOMAIN,
    ownerKey,
    fileCategory: WORK_FILE_CATEGORY
  });
  if (workDocument) {
    summary.reusedWorkDocumentCount += 1;
    return { workDocument, ownerKey, sourceDocumentId: entry.documentId, status: 'reused' };
  }

  const auditLoaded = await getDocumentFile(entry.documentId);
  if (!auditLoaded?.record?.id) {
    summary.unresolvedCount += 1;
    return { workDocument: null, ownerKey, sourceDocumentId: entry.documentId, status: 'missing_audit_document' };
  }

  if (!options.write) {
    return { workDocument: null, ownerKey, sourceDocumentId: entry.documentId, status: 'pending_copy' };
  }

  const binary = await fs.readFile(auditLoaded.fullPath);
  workDocument = await saveBase64Document({
    actorUserId: null,
    permissionKey,
    ownerDomain: WORK_OWNER_DOMAIN,
    ownerKey,
    fileCategory: WORK_FILE_CATEGORY,
    originalName: entry.originalName,
    mimeType: entry.mimeType,
    base64Data: binary.toString('base64'),
    metadata: {
      dataKey: WORK_RECORD_KEY,
      team: REPORT_TEAM_KEY,
      startDate: entry.dateKey,
      endDate: entry.dateKey,
      attachmentType: WORK_ATTACHMENT_TYPE,
      sourceDocumentId: entry.documentId,
      sourceOwnerDomain: 'audit.monthly_report'
    }
  });
  summary.copiedWorkDocumentCount += 1;
  return { workDocument, ownerKey, sourceDocumentId: entry.documentId, status: 'copied' };
}

async function repairAuthority(workRecord, auditRecord, options) {
  const auditEntries = getAuditEntries(auditRecord);
  const summary = createSummary({ workRecord, auditRecord, auditEntries });
  if (!auditEntries.length) {
    return {
      nextPayload: cloneJson(workRecord?.payload ?? {}),
      payloadChanged: false,
      summary
    };
  }

  const workPayload = cloneJson(isPlainObject(workRecord?.payload) ? workRecord.payload : {});
  workPayload.meta = isPlainObject(workPayload.meta) ? workPayload.meta : {};
  workPayload.teams = isPlainObject(workPayload.teams) ? workPayload.teams : {};
  const team4Records = Array.isArray(workPayload.teams[REPORT_TEAM_KEY])
    ? workPayload.teams[REPORT_TEAM_KEY].map((record) => cloneJson(record))
    : [];
  const permissionKey = normalizeText(workRecord?.permission_key) || PERMISSION_KEYS.WORK_TEAM_CALENDAR;

  if (options.write) {
    await initializeFileStorage();
  }

  const auditDocumentIdsToDelete = [];
  for (const entry of auditEntries) {
    const resolved = await resolveOrCreateWorkDocument(entry, permissionKey, options, summary);
    const itemSummary = {
      originalName: entry.originalName,
      dateKey: entry.dateKey,
      sourceDocumentId: resolved.sourceDocumentId,
      workOwnerKey: resolved.ownerKey,
      status: resolved.status,
      workDocumentId: normalizeText(resolved.workDocument?.id)
    };

    if (!resolved.workDocument) {
      summary.items.push(itemSummary);
      continue;
    }

    const attachment = buildManagedAttachment(resolved.workDocument);
    const recordIndex = findMatchingReportRecordIndex(team4Records, entry);
    if (recordIndex >= 0) {
      team4Records[recordIndex] = buildNextReportRecord(team4Records[recordIndex], entry, attachment);
      summary.updatedExistingRecordCount += 1;
      itemSummary.recordAction = 'updated';
    } else {
      team4Records.push(buildNextReportRecord(null, entry, attachment));
      summary.createdRecordCount += 1;
      itemSummary.recordAction = 'created';
    }

    auditDocumentIdsToDelete.push(entry.documentId);
    summary.items.push(itemSummary);
  }

  team4Records.sort(compareRecordsDesc);
  workPayload.teams[REPORT_TEAM_KEY] = team4Records;
  if (summary.updatedExistingRecordCount > 0 || summary.createdRecordCount > 0) {
    workPayload.meta.updatedAt = new Date().toISOString();
  }

  return {
    nextPayload: workPayload,
    payloadChanged: JSON.stringify(workRecord?.payload ?? {}) !== JSON.stringify(workPayload),
    summary,
    auditDocumentIdsToDelete
  };
}

async function cleanupAuditAuthority(auditRecord, auditDocumentIds, summary, options) {
  if (!options.write || summary.unresolvedCount > 0) {
    return;
  }

  const uniqueDocumentIds = [...new Set(auditDocumentIds.map((value) => normalizeText(value)).filter(Boolean))];
  for (const documentId of uniqueDocumentIds) {
    const deleted = await deleteDocument({
      actorUserId: null,
      documentId
    });
    if (deleted?.id) {
      summary.deletedAuditDocumentCount += 1;
    }
  }

  if (auditRecord?.id) {
    const deletedRecord = await deleteModuleRecord({
      moduleKey: auditRecord.module_key,
      recordKey: auditRecord.record_key,
      expectedVersion: auditRecord.version
    });
    summary.deletedAuditRecord = Boolean(deletedRecord?.id);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [workRecord, auditRecord] = await Promise.all([
    findModuleRecord(MODULE_KEY, WORK_RECORD_KEY),
    findModuleRecord(MODULE_KEY, AUDIT_RECORD_KEY)
  ]);

  if (!workRecord) {
    throw new Error('work_history_record_not_found');
  }

  const {
    nextPayload,
    payloadChanged,
    summary,
    auditDocumentIdsToDelete = []
  } = await repairAuthority(workRecord, auditRecord, options);

  if (!summary.auditEntryCount) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: options.write ? 'write' : 'preview',
          summary
        },
        null,
        2
      )
    );
    return;
  }

  if (options.write) {
    summary.backupPath = await writeBackupSnapshot(workRecord, auditRecord);
    if (payloadChanged) {
      const savedRecord = await upsertModuleRecord({
        moduleKey: workRecord.module_key,
        recordKey: workRecord.record_key,
        permissionKey: normalizeText(workRecord.permission_key) || PERMISSION_KEYS.WORK_TEAM_CALENDAR,
        payload: nextPayload,
        updatedByUserId: null,
        expectedVersion: workRecord.version
      });
      summary.workRecordVersion = savedRecord.version;
    }
    await cleanupAuditAuthority(auditRecord, auditDocumentIdsToDelete, summary, options);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: options.write ? 'write' : 'preview',
        summary
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}).finally(async () => {
  await closePool().catch(() => {});
});
