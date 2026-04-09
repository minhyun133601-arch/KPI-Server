import { sendJson } from '../lib/http.js';
import { findModuleRecord, upsertModuleRecord } from '../repositories/modules.js';
import {
  assertOpenPermission,
  normalizeExpectedVersion,
  parseBody,
  serializePermissionKey
} from './route-context.js';

function getModuleRecordMeta(record) {
  if (!record) return null;
  return {
    moduleKey: record.module_key,
    recordKey: record.record_key,
    permissionKey: record.permission_key,
    version: record.version,
    updatedAt: record.updated_at
  };
}

export async function handleGetModuleRecord(context, moduleKey, recordKey) {
  const { res, auth, url } = context;
  const permissionKey = serializePermissionKey(url.searchParams.get('permissionKey'));
  await assertOpenPermission(permissionKey, auth, 'read');
  const record = await findModuleRecord(moduleKey, recordKey);
  if (!record) {
    sendJson(res, 404, { ok: false, error: 'not_found' });
    return;
  }
  sendJson(res, 200, {
    ok: true,
    record
  });
}

export async function handleUpsertModuleRecord(context, moduleKey, recordKey) {
  const { req, res, auth } = context;
  const body = await parseBody(req);
  const permissionKey = serializePermissionKey(body.permissionKey);
  await assertOpenPermission(permissionKey, auth, 'write');

  let record;
  try {
    record = await upsertModuleRecord({
      moduleKey,
      recordKey,
      permissionKey,
      payload: body.payload ?? {},
      updatedByUserId: auth?.user?.id || null,
      expectedVersion: normalizeExpectedVersion(body.expectedVersion)
    });
  } catch (error) {
    if (error?.message === 'version_conflict') {
      sendJson(res, 409, {
        ok: false,
        error: 'version_conflict',
        currentRecord: getModuleRecordMeta(error.currentRecord)
      });
      return;
    }
    throw error;
  }

  sendJson(res, 200, {
    ok: true,
    record
  });
}
