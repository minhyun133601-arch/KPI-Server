import fs from 'node:fs/promises';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

import { runtimePaths } from '../../config.js';
import { closePool, query } from '../../db/pool.js';
import { resolveDocumentStorage } from '../../lib/document-storage.js';
import { ensureDir } from '../../lib/fs.js';
import { PERMISSION_KEYS } from '../../lib/permission-registry.js';
import { findModuleRecord, upsertModuleRecord } from '../../repositories/modules.js';

const MODULE_KEY = 'portal_data';
const WORK_RECORD_KEY = 'work_history_records';
const WORK_OWNER_DOMAIN = 'work.history';
const SLOT_KEYS = Object.freeze(['report', 'estimate', 'other']);
const FILE_CATEGORY_BY_SLOT = Object.freeze({
  report: 'report_document',
  estimate: 'estimate_document',
  other: 'other_document'
});
const LEGACY_SLOT_MAP = Object.freeze({
  billing: 'other'
});
const LEGACY_FILE_CATEGORY_MAP = Object.freeze({
  billing_pdf: 'other_document',
  report_pdf: 'report_document'
});

function normalizeText(value) {
  return String(value || '').trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function parseArgs(argv) {
  return {
    write: argv.includes('--write')
  };
}

function sanitizeFileName(value) {
  return normalizeText(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_') || 'file';
}

function sanitizeStorageFolderSegments(raw) {
  const joined = Array.isArray(raw)
    ? raw.map((segment) => normalizeText(segment)).join('/')
    : normalizeText(raw);
  if (!joined) return [];
  return joined
    .split(/[\\/]+/)
    .map((segment) => sanitizeFileName(segment))
    .filter((segment) => segment && segment !== '.' && segment !== '..');
}

function normalizeAttachmentSlotKey(value) {
  const rawValue = normalizeText(value);
  if (SLOT_KEYS.includes(rawValue)) return rawValue;
  return normalizeText(LEGACY_SLOT_MAP[rawValue]);
}

function normalizeAttachmentFileCategory(fileCategory, slotKey) {
  const rawCategory = normalizeText(fileCategory);
  if (LEGACY_FILE_CATEGORY_MAP[rawCategory]) {
    return LEGACY_FILE_CATEGORY_MAP[rawCategory];
  }
  return normalizeText(FILE_CATEGORY_BY_SLOT[slotKey]) || rawCategory;
}

function normalizeAttachmentForSlot(attachment, slotKey) {
  if (!isPlainObject(attachment)) return null;
  const normalizedSlotKey = normalizeAttachmentSlotKey(slotKey) || normalizeAttachmentSlotKey(attachment.attachmentType);
  if (!normalizedSlotKey) return null;
  return {
    ...cloneJson(attachment),
    attachmentType: normalizedSlotKey,
    fileCategory: normalizeAttachmentFileCategory(attachment.fileCategory || attachment.file_category, normalizedSlotKey)
  };
}

function assignAttachment(slots, attachment, preferredSlotKey) {
  const normalizedSlotKey = normalizeAttachmentSlotKey(preferredSlotKey) || normalizeAttachmentSlotKey(attachment?.attachmentType);
  const targetSlotKey = normalizedSlotKey || SLOT_KEYS.find((slotKey) => !slots[slotKey]);
  if (!targetSlotKey || slots[targetSlotKey]) return false;
  const normalizedAttachment = normalizeAttachmentForSlot(attachment, targetSlotKey);
  if (!normalizedAttachment) return false;
  slots[targetSlotKey] = normalizedAttachment;
  return true;
}

function flattenAttachmentSlots(slots) {
  return SLOT_KEYS.map((slotKey) => slots[slotKey]).filter(Boolean);
}

function normalizeWorkHistoryRecord(record, summary) {
  const nextRecord = isPlainObject(record) ? cloneJson(record) : {};
  const sourceSlots = isPlainObject(nextRecord.attachmentSlots) ? nextRecord.attachmentSlots : {};
  const slots = Object.fromEntries(SLOT_KEYS.map((slotKey) => [slotKey, null]));

  SLOT_KEYS.forEach((slotKey) => {
    if (assignAttachment(slots, sourceSlots[slotKey], slotKey)) {
      summary.slotAttachmentCount += 1;
    }
  });

  Object.entries(LEGACY_SLOT_MAP).forEach(([legacySlotKey, mappedSlotKey]) => {
    if (assignAttachment(slots, sourceSlots[legacySlotKey], mappedSlotKey)) {
      summary.legacySlotMovedCount += 1;
    }
  });

  if (assignAttachment(slots, nextRecord.reportAttachment || nextRecord.reportDocument, 'report')) {
    summary.propertyAttachmentCount += 1;
  }
  if (assignAttachment(slots, nextRecord.estimateAttachment || nextRecord.estimateDocument, 'estimate')) {
    summary.propertyAttachmentCount += 1;
  }
  if (assignAttachment(slots, nextRecord.otherAttachment || nextRecord.otherDocument, 'other')) {
    summary.propertyAttachmentCount += 1;
  }
  if (assignAttachment(slots, nextRecord.billingAttachment || nextRecord.billingDocument, 'other')) {
    summary.legacyPropertyMovedCount += 1;
  }

  const attachments = Array.isArray(nextRecord.attachments) ? nextRecord.attachments : [];
  attachments.forEach((attachment) => {
    if (assignAttachment(slots, attachment, attachment?.attachmentType)) {
      summary.arrayAttachmentCount += 1;
    }
  });

  nextRecord.attachmentSlots = slots;
  nextRecord.reportAttachment = slots.report ? cloneJson(slots.report) : null;
  nextRecord.estimateAttachment = slots.estimate ? cloneJson(slots.estimate) : null;
  nextRecord.otherAttachment = slots.other ? cloneJson(slots.other) : null;
  nextRecord.attachments = flattenAttachmentSlots(slots).map((attachment) => cloneJson(attachment));
  delete nextRecord.billingAttachment;
  delete nextRecord.billingDocument;
  return nextRecord;
}

export function normalizeWorkHistoryPayload(payload) {
  const summary = {
    teamCount: 0,
    recordCount: 0,
    slotAttachmentCount: 0,
    propertyAttachmentCount: 0,
    arrayAttachmentCount: 0,
    legacySlotMovedCount: 0,
    legacyPropertyMovedCount: 0
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
      return normalizeWorkHistoryRecord(record, summary);
    });
  });
  return {
    payload: nextPayload,
    changed: !isDeepStrictEqual(payload ?? {}, nextPayload),
    summary
  };
}

export function resolveNextDocumentLocation(documentRecord) {
  const currentFileCategory = normalizeText(documentRecord?.file_category);
  const nextFileCategory = normalizeText(LEGACY_FILE_CATEGORY_MAP[currentFileCategory] || currentFileCategory);
  const metadata = isPlainObject(documentRecord?.metadata) ? cloneJson(documentRecord.metadata) : {};
  const resolvedStorage = resolveDocumentStorage({
    ownerDomain: WORK_OWNER_DOMAIN,
    ownerKey: normalizeText(documentRecord?.owner_key),
    fileCategory: nextFileCategory,
    metadata
  });
  const folderParts = sanitizeStorageFolderSegments(resolvedStorage.storageFolder);
  const storedName = sanitizeFileName(documentRecord?.stored_name);
  return {
    fileCategory: nextFileCategory,
    storageRelPath: path.posix.join(...folderParts, storedName),
    metadata: resolvedStorage.metadata
  };
}

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function copyDocumentFileIfNeeded(currentRelPath, nextRelPath, options, summary) {
  const currentPath = path.join(runtimePaths.filesRoot, ...normalizeText(currentRelPath).split('/'));
  const nextPath = path.join(runtimePaths.filesRoot, ...normalizeText(nextRelPath).split('/'));
  if (currentPath === nextPath) {
    summary.alreadyLocatedFileCount += 1;
    return true;
  }
  if (await pathExists(nextPath)) {
    summary.reusedTargetFileCount += 1;
    return true;
  }
  if (!(await pathExists(currentPath))) {
    summary.skippedMissingFileCount += 1;
    return false;
  }
  if (!options.write) {
    summary.pendingFileCopyCount += 1;
    return true;
  }
  await ensureDir(path.dirname(nextPath));
  await fs.copyFile(currentPath, nextPath);
  summary.copiedFileCount += 1;
  return true;
}

async function repairDocumentRows(options) {
  const result = await query(
    `select id, owner_key, file_category, stored_name, storage_rel_path, metadata
       from app_documents
      where owner_domain = $1
        and file_category in ('billing_pdf', 'report_pdf')
      order by created_at asc`,
    [WORK_OWNER_DOMAIN]
  );
  const summary = {
    legacyDocumentCount: result.rows.length,
    changedDocumentCount: 0,
    updatedDocumentCount: 0,
    copiedFileCount: 0,
    pendingFileCopyCount: 0,
    reusedTargetFileCount: 0,
    alreadyLocatedFileCount: 0,
    skippedMissingFileCount: 0,
    items: []
  };

  for (const row of result.rows) {
    const nextLocation = resolveNextDocumentLocation(row);
    const currentRelPath = normalizeText(row.storage_rel_path).replace(/[\\/]+/g, '/');
    const changed = nextLocation.fileCategory !== normalizeText(row.file_category)
      || nextLocation.storageRelPath !== currentRelPath;
    if (!changed) continue;
    summary.changedDocumentCount += 1;

    const fileReady = await copyDocumentFileIfNeeded(currentRelPath, nextLocation.storageRelPath, options, summary);
    summary.items.push({
      documentId: row.id,
      fromCategory: row.file_category,
      toCategory: nextLocation.fileCategory,
      fromPath: currentRelPath,
      toPath: nextLocation.storageRelPath,
      status: fileReady ? (options.write ? 'updated' : 'pending') : 'missing_file'
    });
    if (!fileReady || !options.write) continue;

    const metadata = {
      ...nextLocation.metadata,
      legacyFileCategory: row.file_category,
      legacyStorageRelPath: currentRelPath
    };
    await query(
      `update app_documents
          set file_category = $2,
              storage_rel_path = $3,
              metadata = $4::jsonb
        where id = $1`,
      [row.id, nextLocation.fileCategory, nextLocation.storageRelPath, JSON.stringify(metadata)]
    );
    summary.updatedDocumentCount += 1;
  }

  return summary;
}

async function repairWorkHistoryPayload(options) {
  const workRecord = await findModuleRecord(MODULE_KEY, WORK_RECORD_KEY);
  if (!workRecord) {
    return {
      found: false,
      changed: false
    };
  }

  const normalized = normalizeWorkHistoryPayload(workRecord.payload);
  const summary = {
    found: true,
    version: Number(workRecord.version) || 0,
    changed: normalized.changed,
    ...normalized.summary
  };
  if (options.write && normalized.changed) {
    normalized.payload.meta.updatedAt = new Date().toISOString();
    const savedRecord = await upsertModuleRecord({
      moduleKey: workRecord.module_key,
      recordKey: workRecord.record_key,
      permissionKey: normalizeText(workRecord.permission_key) || PERMISSION_KEYS.WORK_TEAM_CALENDAR,
      payload: normalized.payload,
      updatedByUserId: null,
      expectedVersion: workRecord.version
    });
    summary.nextVersion = savedRecord.version;
  }
  return summary;
}

export async function repairWorkHistoryAttachmentCategories(options = {}) {
  const normalizedOptions = { write: options.write === true };
  const [documents, payload] = await Promise.all([
    repairDocumentRows(normalizedOptions),
    repairWorkHistoryPayload(normalizedOptions)
  ]);
  return {
    ok: true,
    mode: normalizedOptions.write ? 'write' : 'preview',
    summary: {
      documents,
      payload
    }
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await repairWorkHistoryAttachmentCategories(options);
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
