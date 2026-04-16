import {
  CURRENT_PORTAL_DATA_RECORDS,
  PORTAL_DATA_MODULE_KEY,
  WORK_RUNTIME_BOOTSTRAP_RECORDS,
  WORK_RUNTIME_MODULE_KEY
} from './portal-data-registry.js';
import { loadCurrentPortalDataRecord } from './portal-data-current-loader.js';
import {
  buildMeteringSharedStoreSummary,
  getMeteringSharedStoreMeta,
  loadMeteringPresetStore,
  METERING_PRESET_SOURCE_PATH,
  METERING_SHARED_STORE_MODULE_KEY,
  METERING_SHARED_STORE_PERMISSION_KEY,
  METERING_SHARED_STORE_RECORD_KEY
} from './metering-shared-store.js';
import { findModuleRecord, upsertModuleRecord } from '../repositories/modules.js';

const WORK_RUNTIME_MODULE_NAME_BY_RECORD_KEY = Object.freeze({
  work_team_calendar_team1_part1: 'team1_part1_calendar',
  work_team_calendar_team1_part2: 'team1_part2_calendar',
  work_team_calendar_team2: 'team2_calendar',
  work_team_calendar_team3: 'team3_calendar'
});

function normalizeRequestedRecordKeys(rawRecordKeys = []) {
  const requested = new Set();
  for (const raw of Array.isArray(rawRecordKeys) ? rawRecordKeys : []) {
    const value = String(raw || '').trim();
    if (!value || value === '--dry-run') continue;
    if (value === '--all') {
      requested.clear();
      return requested;
    }
    requested.add(value);
  }
  return requested;
}

function buildDefaultWorkRuntimePayload(recordKey) {
  const now = new Date().toISOString();
  return {
    meta: {
      moduleKey: recordKey,
      moduleName: WORK_RUNTIME_MODULE_NAME_BY_RECORD_KEY[recordKey] || recordKey,
      version: 1,
      updatedAt: now
    },
    weeks: [],
    teamCalendar: {
      entries: {}
    }
  };
}

function buildPortalImportTargets(requestedKeySet) {
  const knownRecordKeySet = new Set(CURRENT_PORTAL_DATA_RECORDS.map((record) => record.recordKey));
  const importableRecords = CURRENT_PORTAL_DATA_RECORDS.filter((record) => String(record.filePath || '').trim());
  const importableRecordKeySet = new Set(importableRecords.map((record) => record.recordKey));

  if (!requestedKeySet.size) {
    return {
      targetRecords: importableRecords,
      missingRecordKeys: [],
      nonImportableRecordKeys: []
    };
  }

  return {
    targetRecords: importableRecords.filter((record) => requestedKeySet.has(record.recordKey)),
    missingRecordKeys: [...requestedKeySet].filter((recordKey) => !knownRecordKeySet.has(recordKey)),
    nonImportableRecordKeys: [...requestedKeySet].filter((recordKey) => (
      knownRecordKeySet.has(recordKey) && !importableRecordKeySet.has(recordKey)
    ))
  };
}

export async function importCurrentPortalData({
  requestedRecordKeys = [],
  dryRun = false
} = {}) {
  const requestedKeySet = normalizeRequestedRecordKeys(requestedRecordKeys);
  const {
    targetRecords,
    missingRecordKeys,
    nonImportableRecordKeys
  } = buildPortalImportTargets(requestedKeySet);

  if (!targetRecords.length) {
    if (missingRecordKeys.length) {
      throw new Error(`record_keys_not_found:${missingRecordKeys.join(',')}`);
    }
    if (nonImportableRecordKeys.length) {
      throw new Error(`record_keys_not_importable:${nonImportableRecordKeys.join(',')}`);
    }
    throw new Error('no_target_records');
  }

  const imported = [];
  for (const record of targetRecords) {
    const payload = await loadCurrentPortalDataRecord(record);
    if (dryRun) {
      imported.push({
        recordKey: record.recordKey,
        permissionKey: record.permissionKey,
        sourceFile: record.filePath,
        sourceRoot: record.sourceRoot,
        payloadType: Array.isArray(payload) ? 'array' : typeof payload
      });
      continue;
    }

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

  return {
    ok: true,
    dryRun,
    moduleKey: PORTAL_DATA_MODULE_KEY,
    requestedRecordKeys: requestedKeySet.size ? [...requestedKeySet] : null,
    missingRecordKeys,
    nonImportableRecordKeys,
    importedCount: imported.length,
    imported
  };
}

export async function seedWorkRuntimeBootstrap({ dryRun = false } = {}) {
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      moduleKey: WORK_RUNTIME_MODULE_KEY,
      expectedRecordCount: WORK_RUNTIME_BOOTSTRAP_RECORDS.length,
      existingCount: 0,
      createdCount: WORK_RUNTIME_BOOTSTRAP_RECORDS.length,
      existing: [],
      created: WORK_RUNTIME_BOOTSTRAP_RECORDS.map((recordDef) => ({
        recordKey: recordDef.recordKey,
        permissionKey: recordDef.permissionKey,
        version: null
      }))
    };
  }

  const created = [];
  const existing = [];

  for (const recordDef of WORK_RUNTIME_BOOTSTRAP_RECORDS) {
    const currentRecord = await findModuleRecord(WORK_RUNTIME_MODULE_KEY, recordDef.recordKey);
    if (currentRecord) {
      existing.push({
        recordKey: currentRecord.record_key,
        permissionKey: currentRecord.permission_key,
        version: currentRecord.version
      });
      continue;
    }

    const nextRecord = await upsertModuleRecord({
      moduleKey: WORK_RUNTIME_MODULE_KEY,
      recordKey: recordDef.recordKey,
      permissionKey: recordDef.permissionKey,
      payload: buildDefaultWorkRuntimePayload(recordDef.recordKey),
      updatedByUserId: null
    });

    created.push({
      recordKey: nextRecord.record_key,
      permissionKey: nextRecord.permission_key,
      version: nextRecord.version
    });
  }

  return {
    ok: true,
    dryRun: false,
    moduleKey: WORK_RUNTIME_MODULE_KEY,
    expectedRecordCount: WORK_RUNTIME_BOOTSTRAP_RECORDS.length,
    existingCount: existing.length,
    createdCount: created.length,
    existing,
    created
  };
}

export async function seedMeteringSharedStore({ dryRun = false } = {}) {
  const store = await loadMeteringPresetStore();
  const summary = buildMeteringSharedStoreSummary(store);

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      moduleKey: METERING_SHARED_STORE_MODULE_KEY,
      recordKey: METERING_SHARED_STORE_RECORD_KEY,
      presetPath: METERING_PRESET_SOURCE_PATH,
      summary,
      meta: null
    };
  }

  const nextRecord = await upsertModuleRecord({
    moduleKey: METERING_SHARED_STORE_MODULE_KEY,
    recordKey: METERING_SHARED_STORE_RECORD_KEY,
    permissionKey: METERING_SHARED_STORE_PERMISSION_KEY,
    payload: store,
    updatedByUserId: null
  });

  return {
    ok: true,
    dryRun: false,
    moduleKey: METERING_SHARED_STORE_MODULE_KEY,
    recordKey: METERING_SHARED_STORE_RECORD_KEY,
    presetPath: METERING_PRESET_SOURCE_PATH,
    summary,
    meta: getMeteringSharedStoreMeta(nextRecord)
  };
}

export async function syncLocalBaselineToDb({
  requestedRecordKeys = [],
  dryRun = false
} = {}) {
  const portalData = await importCurrentPortalData({ requestedRecordKeys, dryRun });
  const workRuntime = await seedWorkRuntimeBootstrap({ dryRun });
  const metering = await seedMeteringSharedStore({ dryRun });

  return {
    ok: true,
    dryRun,
    summary: {
      portalDataRecords: portalData.importedCount,
      workRuntimeCreated: workRuntime.createdCount,
      workRuntimeExisting: workRuntime.existingCount,
      meteringEquipmentItems: metering.summary.equipmentItemCount
    },
    portalData,
    workRuntime,
    metering
  };
}
