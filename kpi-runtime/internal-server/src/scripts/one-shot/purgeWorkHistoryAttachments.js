import { fileURLToPath } from 'node:url';

import { closePool, query } from '../../db/pool.js';
import { PERMISSION_KEYS } from '../../lib/permission-registry.js';
import { deleteDocument } from '../../services/files.js';
import { findModuleRecord, upsertModuleRecord } from '../../repositories/modules.js';

const MODULE_KEY = 'portal_data';
const WORK_RECORD_KEY = 'work_history_records';
const WORK_OWNER_DOMAIN = 'work.history';
const ATTACHMENT_FIELD_KEYS = Object.freeze([
  'attachmentSlots',
  'attachments',
  'reportAttachment',
  'reportDocument',
  'estimateAttachment',
  'estimateDocument',
  'otherAttachment',
  'otherDocument',
  'billingAttachment',
  'billingDocument'
]);

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function parseArgs(argv) {
  return {
    write: argv.includes('--write')
  };
}

function stripAttachmentFieldsFromRecord(record, summary) {
  const nextRecord = isPlainObject(record) ? cloneJson(record) : {};
  let removedFromRecord = false;
  ATTACHMENT_FIELD_KEYS.forEach((fieldKey) => {
    if (!Object.prototype.hasOwnProperty.call(nextRecord, fieldKey)) return;
    delete nextRecord[fieldKey];
    removedFromRecord = true;
    summary.removedFieldCount += 1;
  });
  if (removedFromRecord) {
    summary.changedRecordCount += 1;
  }
  return nextRecord;
}

export function stripWorkHistoryAttachmentsFromPayload(payload) {
  const summary = {
    teamCount: 0,
    recordCount: 0,
    changedRecordCount: 0,
    removedFieldCount: 0
  };
  const nextPayload = isPlainObject(payload) ? cloneJson(payload) : {};
  nextPayload.meta = isPlainObject(nextPayload.meta) ? nextPayload.meta : {};
  nextPayload.teams = isPlainObject(nextPayload.teams) ? nextPayload.teams : {};
  Object.entries(nextPayload.teams).forEach(([teamKey, records]) => {
    if (!Array.isArray(records)) {
      nextPayload.teams[teamKey] = [];
      return;
    }
    summary.teamCount += 1;
    nextPayload.teams[teamKey] = records.map((record) => {
      summary.recordCount += 1;
      return stripAttachmentFieldsFromRecord(record, summary);
    });
  });
  return {
    payload: nextPayload,
    changed: summary.removedFieldCount > 0,
    summary
  };
}

async function listWorkHistoryDocuments() {
  const result = await query(
    `select id, owner_key, file_category, original_name, stored_name, byte_size, storage_rel_path
       from app_documents
      where owner_domain = $1
      order by created_at asc`,
    [WORK_OWNER_DOMAIN]
  );
  return result.rows;
}

async function purgePayloadAttachments(options) {
  const workRecord = await findModuleRecord(MODULE_KEY, WORK_RECORD_KEY);
  if (!workRecord) {
    return {
      found: false,
      changed: false
    };
  }

  const stripped = stripWorkHistoryAttachmentsFromPayload(workRecord.payload);
  const summary = {
    found: true,
    version: Number(workRecord.version) || 0,
    changed: stripped.changed,
    ...stripped.summary
  };

  if (options.write && stripped.changed) {
    stripped.payload.meta.updatedAt = new Date().toISOString();
    const savedRecord = await upsertModuleRecord({
      moduleKey: workRecord.module_key,
      recordKey: workRecord.record_key,
      permissionKey: normalizeText(workRecord.permission_key) || PERMISSION_KEYS.WORK_TEAM_CALENDAR,
      payload: stripped.payload,
      updatedByUserId: null,
      expectedVersion: workRecord.version
    });
    summary.nextVersion = savedRecord.version;
  }

  return summary;
}

async function purgeDocumentRows(options) {
  const documents = await listWorkHistoryDocuments();
  const summary = {
    documentCount: documents.length,
    deletedDocumentCount: 0,
    totalBytes: documents.reduce((sum, row) => sum + (Number(row.byte_size) || 0), 0),
    items: documents.map((row) => ({
      id: row.id,
      ownerKey: row.owner_key,
      fileCategory: row.file_category,
      originalName: row.original_name,
      storageRelPath: row.storage_rel_path
    }))
  };

  if (!options.write) return summary;

  for (const row of documents) {
    const deleted = await deleteDocument({ actorUserId: null, documentId: row.id });
    if (deleted) {
      summary.deletedDocumentCount += 1;
    }
  }

  return summary;
}

export async function purgeWorkHistoryAttachments(options = {}) {
  const normalizedOptions = { write: options.write === true };
  const [payload, documents] = await Promise.all([
    purgePayloadAttachments(normalizedOptions),
    purgeDocumentRows(normalizedOptions)
  ]);
  return {
    ok: true,
    mode: normalizedOptions.write ? 'write' : 'preview',
    summary: {
      payload,
      documents
    }
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await purgeWorkHistoryAttachments(options);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
    .catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool().catch(() => {});
    });
}
