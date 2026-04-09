import fs from 'node:fs/promises';
import { sendJson } from '../lib/http.js';
import { deleteDocument, getDocumentFile, saveBase64Document } from '../services/files.js';
import { assertOpenPermission, normalizeText, parseBody, serializePermissionKey } from './route-context.js';

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

export async function handleUploadBase64File(context) {
  const { req, res, auth } = context;
  const body = await parseBody(req);
  const permissionKey = serializePermissionKey(body.permissionKey);
  await assertOpenPermission(permissionKey, auth, 'write');

  const document = await saveBase64Document({
    actorUserId: auth?.user?.id || null,
    permissionKey,
    ownerDomain: normalizeText(body.ownerDomain || 'generic'),
    ownerKey: normalizeText(body.ownerKey || 'unassigned'),
    fileCategory: normalizeText(body.fileCategory || 'attachment'),
    originalName: normalizeText(body.originalName || 'file.bin'),
    mimeType: normalizeText(body.mimeType || 'application/octet-stream'),
    base64Data: normalizeText(body.base64Data),
    metadata: body.metadata ?? {}
  });

  sendJson(res, 201, {
    ok: true,
    document
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
