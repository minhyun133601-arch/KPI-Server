import { query, withTransaction } from '../db/pool.js';
import { normalizeEntry, normalizeText } from '../services/util-production-daily/normalizers.js';

export const UTIL_PRODUCTION_STATE_TABLE = 'util_production_daily_state';
export const UTIL_PRODUCTION_ENTRY_TABLE = 'util_production_daily_entries';
export const UTIL_PRODUCTION_ARCHIVE_TABLE = 'util_production_daily_archives';
export const UTIL_PRODUCTION_STATE_KEY = 'default';

export async function listUtilProductionDailyEntries() {
  const result = await query(
    `select
        id,
        dedupe_key,
        production_date,
        team_name,
        line_name,
        production_kind,
        product_code,
        product_name,
        amount,
        regular_workers,
        contract_workers,
        moisture_excluded_yield,
        work_time,
        operation_time,
        equipment_capa,
        equipment_utilization,
        material_standard,
        material_actual,
        total_work_time,
        stick_ea,
        labor_productivity_ea,
        source_archive_id,
        source_fingerprint,
        source_file_name,
        created_at,
        updated_at
      from ${UTIL_PRODUCTION_ENTRY_TABLE}
      order by production_date asc, team_name asc, line_name asc, production_kind asc, product_name asc, product_code asc, amount asc`
  );
  return result.rows;
}

export async function listUtilProductionDailyArchives() {
  const result = await query(
    `select
        id,
        file_name,
        byte_size,
        mime_type,
        last_modified,
        saved_at,
        folder_name,
        fingerprint,
        document_id,
        storage,
        preview_url,
        download_url,
        created_at,
        updated_at
      from ${UTIL_PRODUCTION_ARCHIVE_TABLE}
      order by saved_at desc, file_name asc`
  );
  return result.rows;
}

export async function findUtilProductionDailyStateRow() {
  const result = await query(
    `select
        state_key,
        period_start_day,
        version,
        updated_by_user_id,
        created_at,
        updated_at
      from ${UTIL_PRODUCTION_STATE_TABLE}
      where state_key = $1`,
    [UTIL_PRODUCTION_STATE_KEY]
  );
  return result.rows[0] || null;
}

function buildEntryRowNormalizationInput(row) {
  return {
    date: row.production_date,
    teamName: row.team_name,
    productionKind: row.production_kind,
    lineName: row.line_name,
    productCode: row.product_code,
    productName: row.product_name,
    amount: row.amount,
    regularWorkers: row.regular_workers,
    contractWorkers: row.contract_workers,
    moistureExcludedYield: row.moisture_excluded_yield,
    workTime: row.work_time ?? row.input_time,
    operationTime: row.operation_time,
    equipmentCapa: row.equipment_capa,
    equipmentUtilization: row.equipment_utilization,
    materialStandard: row.material_standard,
    materialActual: row.material_actual,
    totalWorkTime: row.total_work_time,
    stickEa: row.stick_ea,
    laborProductivityEa: row.labor_productivity_ea,
    sourceArchiveId: row.source_archive_id,
    sourceFingerprint: row.source_fingerprint,
    sourceFileName: row.source_file_name,
  };
}

function buildNormalizedEntryKey(row) {
  const normalizedEntry = normalizeEntry(buildEntryRowNormalizationInput(row));
  return normalizedEntry?.dedupeKey || normalizeText(row.dedupe_key);
}

function normalizeDedupeKeyList(keys) {
  const set = new Set();
  (Array.isArray(keys) ? keys : []).forEach((key) => {
    const normalized = normalizeText(key);
    if (normalized) {
      set.add(normalized);
    }
  });
  return set;
}

async function deleteScopedDuplicateEntries(client, deleteDedupeKeys, upsertDedupeKeys) {
  const incomingKeySet = normalizeDedupeKeyList(upsertDedupeKeys);
  const explicitDeleteKeySet = normalizeDedupeKeyList(deleteDedupeKeys);
  const scopedKeySet = new Set([...incomingKeySet, ...explicitDeleteKeySet]);
  if (scopedKeySet.size === 0) {
    return 0;
  }

  const existingResult = await client.query(
    `select
        id,
        dedupe_key,
        production_date,
        team_name,
        line_name,
        production_kind,
        product_code,
        product_name,
        amount,
        regular_workers,
        contract_workers,
        moisture_excluded_yield,
        work_time,
        operation_time,
        equipment_capa,
        equipment_utilization,
        material_standard,
        material_actual,
        total_work_time,
        stick_ea,
        labor_productivity_ea,
        source_archive_id,
        source_fingerprint,
        source_file_name
      from ${UTIL_PRODUCTION_ENTRY_TABLE}`
  );

  const idsToDelete = [];
  existingResult.rows.forEach((row) => {
    const storedKey = normalizeText(row.dedupe_key);
    const normalizedKey = buildNormalizedEntryKey(row);
    const explicitlyDeleted = explicitDeleteKeySet.has(storedKey) || explicitDeleteKeySet.has(normalizedKey);
    const duplicateInIncomingScope =
      incomingKeySet.has(normalizedKey) && storedKey !== normalizedKey;
    if (explicitlyDeleted || duplicateInIncomingScope) {
      idsToDelete.push(row.id);
    }
  });

  if (!idsToDelete.length) {
    return 0;
  }

  const deleteResult = await client.query(
    `delete from ${UTIL_PRODUCTION_ENTRY_TABLE}
      where id = any($1::uuid[])`,
    [idsToDelete]
  );
  return deleteResult.rowCount || 0;
}

export async function upsertUtilProductionDailyState({
  periodStartDay,
  entries,
  archives,
  updatedByUserId,
  deleteDedupeKeys = [],
  upsertDedupeKeys,
}) {
  return withTransaction(async (client) => {
    const hasScopedUpsertKeys = Array.isArray(upsertDedupeKeys);
    const scopedUpsertKeySet = hasScopedUpsertKeys ? normalizeDedupeKeyList(upsertDedupeKeys) : null;

    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [
      'util_production_daily:state_bundle_v1',
    ]);

    const currentStateResult = await client.query(
      `select state_key, period_start_day, version, updated_by_user_id, created_at, updated_at
         from ${UTIL_PRODUCTION_STATE_TABLE}
        where state_key = $1
        for update`,
      [UTIL_PRODUCTION_STATE_KEY]
    );
    const currentStateRow = currentStateResult.rows[0] || null;

    const nextStateResult = currentStateRow
      ? await client.query(
          `update ${UTIL_PRODUCTION_STATE_TABLE}
              set period_start_day = $2,
                  updated_by_user_id = $3,
                  version = version + 1,
                  updated_at = now()
            where state_key = $1
            returning state_key, period_start_day, version, updated_by_user_id, created_at, updated_at`,
          [UTIL_PRODUCTION_STATE_KEY, periodStartDay, updatedByUserId || null]
        )
      : await client.query(
          `insert into ${UTIL_PRODUCTION_STATE_TABLE}
              (state_key, period_start_day, updated_by_user_id)
           values ($1, $2, $3)
           returning state_key, period_start_day, version, updated_by_user_id, created_at, updated_at`,
          [UTIL_PRODUCTION_STATE_KEY, periodStartDay, updatedByUserId || null]
        );

    await deleteScopedDuplicateEntries(
      client,
      deleteDedupeKeys,
      scopedUpsertKeySet ? [...scopedUpsertKeySet] : []
    );

    const entriesToUpsert = (Array.isArray(entries) ? entries : []).filter(
      (entry) => !hasScopedUpsertKeys || scopedUpsertKeySet.has(normalizeText(entry?.dedupeKey))
    );
    for (const entry of entriesToUpsert) {
      await client.query(
        `insert into ${UTIL_PRODUCTION_ENTRY_TABLE}
            (dedupe_key, production_date, team_name, line_name, production_kind, product_code, product_name, amount, regular_workers,
             contract_workers, moisture_excluded_yield, work_time, operation_time, equipment_capa, equipment_utilization,
             material_standard, material_actual, total_work_time, stick_ea, labor_productivity_ea,
             source_archive_id, source_fingerprint, source_file_name)
         values
            ($1, $2, $3, $4, $5, $6, $7, $8::numeric, $9::numeric, $10::numeric, $11::numeric, $12::numeric,
             $13::numeric, $14::numeric, $15::numeric, $16::numeric, $17::numeric, $18::numeric, $19::numeric, $20::numeric,
             $21, $22, $23)
         on conflict (dedupe_key) do update set
            production_date = excluded.production_date,
            team_name = excluded.team_name,
            line_name = excluded.line_name,
            production_kind = excluded.production_kind,
            product_code = excluded.product_code,
            product_name = excluded.product_name,
            amount = excluded.amount,
            regular_workers = excluded.regular_workers,
            contract_workers = excluded.contract_workers,
            moisture_excluded_yield = excluded.moisture_excluded_yield,
            work_time = excluded.work_time,
            operation_time = excluded.operation_time,
            equipment_capa = excluded.equipment_capa,
            equipment_utilization = excluded.equipment_utilization,
            material_standard = excluded.material_standard,
            material_actual = excluded.material_actual,
            total_work_time = excluded.total_work_time,
            stick_ea = excluded.stick_ea,
            labor_productivity_ea = excluded.labor_productivity_ea,
            source_archive_id = excluded.source_archive_id,
            source_fingerprint = excluded.source_fingerprint,
            source_file_name = excluded.source_file_name,
            updated_at = now()`,
        [
          entry.dedupeKey,
          entry.date,
          entry.teamName,
          entry.lineName,
          entry.productionKind,
          entry.productCode,
          entry.productName,
          entry.amount,
          entry.regularWorkers,
          entry.contractWorkers,
          entry.moistureExcludedYield,
          entry.workTime,
          entry.operationTime,
          entry.equipmentCapa,
          entry.equipmentUtilization,
          entry.materialStandard,
          entry.materialActual,
          entry.totalWorkTime,
          entry.stickEa,
          entry.laborProductivityEa,
          entry.sourceArchiveId,
          entry.sourceFingerprint,
          entry.sourceFileName,
        ]
      );
    }

    for (const archive of Array.isArray(archives) ? archives : []) {
      await client.query(
        `insert into ${UTIL_PRODUCTION_ARCHIVE_TABLE}
            (id, file_name, byte_size, mime_type, last_modified, saved_at, folder_name,
             fingerprint, document_id, storage, preview_url, download_url)
         values
            ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10, $11, $12)
         on conflict (id) do update set
            file_name = excluded.file_name,
            byte_size = excluded.byte_size,
            mime_type = excluded.mime_type,
            last_modified = excluded.last_modified,
            saved_at = excluded.saved_at,
            folder_name = excluded.folder_name,
            fingerprint = excluded.fingerprint,
            document_id = excluded.document_id,
            storage = excluded.storage,
            preview_url = excluded.preview_url,
            download_url = excluded.download_url,
            updated_at = now()`,
        [
          archive.id,
          archive.fileName,
          archive.size,
          archive.mimeType,
          archive.lastModified,
          archive.savedAt,
          archive.folderName,
          archive.fingerprint,
          archive.documentId,
          archive.storage,
          archive.previewUrl,
          archive.downloadUrl,
        ]
      );
    }

    const entryResult = await client.query(
      `select
          id,
          dedupe_key,
          production_date,
          team_name,
          line_name,
          production_kind,
          product_code,
          product_name,
          amount,
          regular_workers,
          contract_workers,
          moisture_excluded_yield,
          work_time,
          operation_time,
          equipment_capa,
          equipment_utilization,
          material_standard,
          material_actual,
          total_work_time,
          stick_ea,
          labor_productivity_ea,
          source_archive_id,
          source_fingerprint,
          source_file_name,
          created_at,
          updated_at
        from ${UTIL_PRODUCTION_ENTRY_TABLE}
        order by production_date asc, team_name asc, line_name asc, production_kind asc, product_name asc, product_code asc, amount asc`
    );
    const archiveResult = await client.query(
      `select
          id,
          file_name,
          byte_size,
          mime_type,
          last_modified,
          saved_at,
          folder_name,
          fingerprint,
          document_id,
          storage,
          preview_url,
          download_url,
          created_at,
          updated_at
        from ${UTIL_PRODUCTION_ARCHIVE_TABLE}
        order by saved_at desc, file_name asc`
    );

    return {
      stateRow: nextStateResult.rows[0] || null,
      entryRows: entryResult.rows,
      archiveRows: archiveResult.rows,
    };
  });
}

export const replaceUtilProductionDailyState = upsertUtilProductionDailyState;
