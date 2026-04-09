import { closePool } from '../db/pool.js';
import { WORK_RUNTIME_BOOTSTRAP_RECORDS, WORK_RUNTIME_MODULE_KEY } from '../lib/portal-data-registry.js';
import { findModuleRecord, upsertModuleRecord } from '../repositories/modules.js';

const WORK_RUNTIME_MODULE_NAME_BY_RECORD_KEY = Object.freeze({
  work_team_calendar_team1_part1: '1팀 1파트 작업내역서',
  work_team_calendar_team1_part2: '1팀 2파트 작업내역서',
  work_team_calendar_team2: '2팀 작업내역서',
  work_team_calendar_team3: '3팀 작업내역서'
});

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

async function main() {
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

  console.log(
    JSON.stringify(
      {
        ok: true,
        moduleKey: WORK_RUNTIME_MODULE_KEY,
        expectedRecordCount: WORK_RUNTIME_BOOTSTRAP_RECORDS.length,
        existingCount: existing.length,
        createdCount: created.length,
        existing,
        created
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
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
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
