import { sendJson } from '../lib/http.js';
import { resolveManagedDocumentStorageFolder } from '../lib/document-storage.js';
import { PERMISSION_KEYS } from '../lib/permission-registry.js';
import { findModuleRecord } from '../repositories/modules.js';
import { saveBase64Document } from '../services/files.js';
import { saveModuleRecord } from '../services/module-records.js';
import {
  assertOpenPermission,
  normalizeExpectedVersion,
  normalizeText,
  parseBody,
  serializeServerUrlPath
} from './route-context.js';

const METERING_SHARED_STORE_MODULE_KEY = 'util_metering';
const METERING_SHARED_STORE_RECORD_KEY = 'shared_store_v1';
const METERING_SHARED_STORE_PERMISSION_KEY = PERMISSION_KEYS.UTIL_METERING_APP;
const METERING_BILLING_DOCUMENT_OWNER_DOMAIN = 'metering.billing_document';
const METERING_BILLING_DOCUMENT_FILE_CATEGORY = 'billing_document';

function getMeteringSharedStoreMeta(record) {
  return {
    moduleKey: record.module_key,
    recordKey: record.record_key,
    permissionKey: record.permission_key,
    version: record.version,
    updatedAt: record.updated_at
  };
}

function buildMeteringBillingOwnerKey(resourceType, monthValue, scopeKey) {
  return [normalizeText(resourceType || 'electric'), normalizeText(monthValue), normalizeText(scopeKey || 'default')]
    .filter(Boolean)
    .join(':');
}

function getMeteringBillingStorageFolder(resourceType) {
  const storageFolder = resolveManagedDocumentStorageFolder({
    ownerDomain: METERING_BILLING_DOCUMENT_OWNER_DOMAIN,
    ownerKey: buildMeteringBillingOwnerKey(resourceType, '', 'default'),
    fileCategory: METERING_BILLING_DOCUMENT_FILE_CATEGORY,
    metadata: {
      resourceType: normalizeText(resourceType || 'electric')
    }
  });
  if (!storageFolder) {
    throw new Error('billing_document_resource_unsupported');
  }
  return storageFolder;
}

export async function handleBillingDocumentUpload(context) {
  const { req, res, auth } = context;
  await assertOpenPermission(METERING_SHARED_STORE_PERMISSION_KEY, auth, 'write');

  const body = await parseBody(req);
  const monthValue = normalizeText(body.monthValue);
  const resourceType = normalizeText(body.resourceType || 'electric');
  const scopeKey = normalizeText(body.scopeKey || 'default');
  const originalName = normalizeText(body.fileName || 'billing-document.pdf');
  const mimeType = normalizeText(body.mimeType || 'application/pdf');
  const base64Data = normalizeText(body.base64Data);

  if (!monthValue) {
    throw new Error('month_value_required');
  }

  const document = await saveBase64Document({
    actorUserId: auth?.user?.id || null,
    permissionKey: METERING_SHARED_STORE_PERMISSION_KEY,
    ownerDomain: METERING_BILLING_DOCUMENT_OWNER_DOMAIN,
    ownerKey: buildMeteringBillingOwnerKey(resourceType, monthValue, scopeKey),
    fileCategory: METERING_BILLING_DOCUMENT_FILE_CATEGORY,
    originalName,
    mimeType,
    base64Data,
    metadata: {
      moduleKey: METERING_SHARED_STORE_MODULE_KEY,
      monthValue,
      resourceType,
      scopeKey,
      storageFolder: getMeteringBillingStorageFolder(resourceType)
    }
  });

  sendJson(res, 201, {
    ok: true,
    document: {
      monthValue,
      resourceType,
      scopeKey,
      documentId: document.id,
      fileName: document.original_name,
      mimeType: document.mime_type,
      savedAt: document.created_at,
      savedToLocalDirectory: false,
      previewUrl: serializeServerUrlPath(`/api/files/${document.id}/view`),
      downloadUrl: serializeServerUrlPath(`/api/files/${document.id}/download`)
    }
  });
}

export async function handleSharedStoreGet(context) {
  const { res, auth } = context;
  await assertOpenPermission(METERING_SHARED_STORE_PERMISSION_KEY, auth, 'read');

  const record = await findModuleRecord(
    METERING_SHARED_STORE_MODULE_KEY,
    METERING_SHARED_STORE_RECORD_KEY
  );
  if (!record) {
    sendJson(res, 404, {
      ok: false,
      error: 'not_found'
    });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    store: record.payload || {},
    meta: getMeteringSharedStoreMeta(record)
  });
}

export async function handleSharedStorePut(context) {
  const { req, res, auth } = context;
  await assertOpenPermission(METERING_SHARED_STORE_PERMISSION_KEY, auth, 'write');

  const body = await parseBody(req);
  let nextRecord;
  try {
    nextRecord = await saveModuleRecord({
      moduleKey: METERING_SHARED_STORE_MODULE_KEY,
      recordKey: METERING_SHARED_STORE_RECORD_KEY,
      permissionKey: METERING_SHARED_STORE_PERMISSION_KEY,
      payload: body.store ?? {},
      updatedByUserId: auth?.user?.id || null,
      expectedVersion: normalizeExpectedVersion(body.expectedVersion)
    });
  } catch (error) {
    if (error?.message === 'version_conflict') {
      sendJson(res, 409, {
        ok: false,
        error: 'version_conflict',
        currentMeta: getMeteringSharedStoreMeta(error.currentRecord || {
          module_key: METERING_SHARED_STORE_MODULE_KEY,
          record_key: METERING_SHARED_STORE_RECORD_KEY,
          permission_key: METERING_SHARED_STORE_PERMISSION_KEY,
          version: error.currentVersion || 0,
          updated_at: null
        })
      });
      return;
    }
    throw error;
  }

  sendJson(res, 200, {
    ok: true,
    meta: getMeteringSharedStoreMeta(nextRecord)
  });
}
