import fs from 'node:fs/promises';
import { sendJson } from '../lib/http.js';
import { deleteDocument, getDocumentFile, saveBase64Document } from '../services/files.js';
import {
  assertOpenPermission,
  normalizeText,
  parseBody,
  serializePermissionKey,
  serializeServerUrlPath
} from './route-context.js';

const SERVER_MANAGED_STORAGE_FOLDER_BY_OWNER_DOMAIN = Object.freeze({
  'audit.lux.evidence': ['오디트', '조도']
});

function normalizeUploadMetadata(metadata, ownerDomain) {
  const normalizedMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...metadata }
      : {};
  const storageFolder = SERVER_MANAGED_STORAGE_FOLDER_BY_OWNER_DOMAIN[ownerDomain];
  if (storageFolder) {
    return {
      ...normalizedMetadata,
      storageFolder
    };
  }
  return metadata ?? {};
}

async function loadDocumentOr404(res, documentId) {
  const loaded = await getDocumentFile(documentId);
  if (!loaded) {
    sendJson(res, 404, { ok: false, error: 'not_found' });
    return null;
  }
  return loaded;
}

async function sendDocumentBinary(res, loaded, disposition = 'attachment') {
  const data = await fs.readFile(loaded.fullPath);
  const headers = {
    'Content-Type': loaded.record.mime_type || 'application/octet-stream',
    'Content-Length': data.length
  };

  if (disposition === 'attachment') {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(loaded.record.original_name)}"`;
  } else if (disposition === 'inline') {
    headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(loaded.record.original_name)}"`;
  }

  res.writeHead(200, headers);
  res.end(data);
}

function serializeDocumentRecord(record) {
  return {
    ...record,
    file_size_bytes: record.byte_size,
    preview_url: serializeServerUrlPath(`/api/files/${record.id}/view`),
    download_url: serializeServerUrlPath(`/api/files/${record.id}/download`)
  };
}

export async function handleUploadBase64File(context) {
  const { req, res, auth } = context;
  const body = await parseBody(req);
  const permissionKey = serializePermissionKey(body.permissionKey);
  const ownerDomain = normalizeText(body.ownerDomain || 'generic');
  await assertOpenPermission(permissionKey, auth, 'write');

  const document = await saveBase64Document({
    actorUserId: auth?.user?.id || null,
    permissionKey,
    ownerDomain,
    ownerKey: normalizeText(body.ownerKey || 'unassigned'),
    fileCategory: normalizeText(body.fileCategory || 'attachment'),
    originalName: normalizeText(body.originalName || 'file.bin'),
    mimeType: normalizeText(body.mimeType || 'application/octet-stream'),
    base64Data: normalizeText(body.base64Data),
    metadata: normalizeUploadMetadata(body.metadata, ownerDomain)
  });

  sendJson(res, 201, {
    ok: true,
    document: serializeDocumentRecord(document)
  });
}

export async function handleDocumentMeta(context, documentId) {
  const { req, res, auth } = context;
  void req;
  const loaded = await loadDocumentOr404(res, documentId);
  if (!loaded) return;

  await assertOpenPermission(loaded.record.permission_key, auth, 'read');
  sendJson(res, 200, {
    ok: true,
    document: loaded.record
  });
}

export async function handleDocumentDownload(context, documentId) {
  const { req, res, auth } = context;
  void req;
  const loaded = await loadDocumentOr404(res, documentId);
  if (!loaded) return;

  await assertOpenPermission(loaded.record.permission_key, auth, 'read');
  await sendDocumentBinary(res, loaded, 'attachment');
}

export async function handleDocumentView(context, documentId) {
  const { req, res, auth } = context;
  void req;
  const loaded = await loadDocumentOr404(res, documentId);
  if (!loaded) return;

  await assertOpenPermission(loaded.record.permission_key, auth, 'read');
  await sendDocumentBinary(res, loaded, 'inline');
}

export async function handleDocumentDelete(context, documentId) {
  const { res, auth } = context;
  const loaded = await loadDocumentOr404(res, documentId);
  if (!loaded) return;

  await assertOpenPermission(loaded.record.permission_key, auth, 'write');
  const deleted = await deleteDocument({
    actorUserId: auth?.user?.id || null,
    documentId
  });

  sendJson(res, 200, {
    ok: true,
    document: deleted
  });
}
