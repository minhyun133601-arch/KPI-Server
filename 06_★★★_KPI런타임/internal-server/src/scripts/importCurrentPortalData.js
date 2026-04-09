import fs from 'node:fs/promises';
import vm from 'node:vm';
import { closePool } from '../db/pool.js';
import { CURRENT_PORTAL_DATA_RECORDS, PORTAL_DATA_MODULE_KEY } from '../lib/portal-data-registry.js';
import { upsertModuleRecord } from '../repositories/modules.js';

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadPortalDataPayload(filePath, recordKey) {
  const source = await fs.readFile(filePath, 'utf8');
  const context = {
    console,
    window: { PortalData: {}, AreaMapData: {} }
  };
  context.globalThis = context;
  context.self = context.window;

  vm.createContext(context);
  vm.runInContext(source, context, { filename: filePath });

  return context.window;
}

function extractPayload(loadedWindow, record) {
  const sourceRoot = String(record.sourceRoot || 'PortalData');
  const sourceBag = loadedWindow?.[sourceRoot];
  if (!sourceBag || typeof sourceBag !== 'object') {
    throw new Error(`source_root_missing:${record.recordKey}`);
  }

  if (Array.isArray(record.sourceKeys) && record.sourceKeys.length) {
    const payload = {};
    for (const key of record.sourceKeys) {
      if (sourceBag[key] === undefined) {
        throw new Error(`source_key_missing:${record.recordKey}:${key}`);
      }
      payload[key] = cloneJson(sourceBag[key]);
    }
    return payload;
  }

  const sourceKey = String(record.sourceKey || record.recordKey);
  if (sourceBag[sourceKey] === undefined) {
    throw new Error(`source_key_missing:${record.recordKey}:${sourceKey}`);
  }
  return cloneJson(sourceBag[sourceKey]);
}

function parseRequestedRecordKeys(argv) {
  const requested = new Set();
  for (const raw of Array.isArray(argv) ? argv : []) {
    const value = String(raw || '').trim();
    if (!value) continue;
    if (value === '--all') {
      requested.clear();
      return requested;
    }
    requested.add(value);
  }
  return requested;
}

async function main() {
  const requestedRecordKeys = parseRequestedRecordKeys(process.argv.slice(2));
  const targetRecords = requestedRecordKeys.size
    ? CURRENT_PORTAL_DATA_RECORDS.filter((record) => requestedRecordKeys.has(record.recordKey))
    : CURRENT_PORTAL_DATA_RECORDS;
  const imported = [];
  const missingRecordKeys = requestedRecordKeys.size
    ? [...requestedRecordKeys].filter((recordKey) => !CURRENT_PORTAL_DATA_RECORDS.some((record) => record.recordKey === recordKey))
    : [];

  if (!targetRecords.length) {
    throw new Error(missingRecordKeys.length
      ? `record_keys_not_found:${missingRecordKeys.join(',')}`
      : 'no_target_records');
  }

  for (const record of targetRecords) {
    const loadedWindow = await loadPortalDataPayload(record.filePath, record.recordKey);
    const payload = extractPayload(loadedWindow, record);
    const nextRecord = await upsertModuleRecord({
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: record.recordKey,
      permissionKey: record.permissionKey,
      payload,
      updatedByUserId: null
    });

    imported.push({
      recordKey: nextRecord.record_key,
      permissionKey: nextRecord.permission_key,
      version: nextRecord.version,
      sourceFile: record.filePath
    });
  }

  console.log(JSON.stringify({
    ok: true,
    moduleKey: PORTAL_DATA_MODULE_KEY,
    requestedRecordKeys: requestedRecordKeys.size ? [...requestedRecordKeys] : null,
    missingRecordKeys,
    importedCount: imported.length,
    imported
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message
  }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  await closePool().catch(() => {});
});
