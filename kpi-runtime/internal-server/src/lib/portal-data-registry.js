import { PERMISSION_KEYS } from './permission-registry.js';

export const PORTAL_DATA_MODULE_KEY = 'portal_data';
export const WORK_RUNTIME_MODULE_KEY = 'work_runtime';
export const REPORT_RUNTIME_MODULE_KEY = 'report_runtime';

export const CURRENT_PORTAL_DATA_RECORDS = Object.freeze([
  {
    recordKey: 'audit_lux',
    permissionKey: PERMISSION_KEYS.AUDIT_LUX,
    sourceKey: 'audit_lux',
  },
  {
    recordKey: 'data_equipment_history_card',
    permissionKey: PERMISSION_KEYS.DATA_EQUIPMENT_HISTORY,
    sourceKey: 'data_equipment_history_card',
  },
  {
    recordKey: 'work_kim_mingyu',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_KIM_MINGYU,
    sourceKey: 'work_kim_mingyu',
  },
  {
    recordKey: 'work_shin_taeseob',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_SHIN_TAESEOB,
    sourceKey: 'work_shin_taeseob',
  },
  {
    recordKey: 'work_ahn_junsoo',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_AHN_JUNSOO,
    sourceKey: 'work_ahn_junsoo',
  },
  {
    recordKey: 'work_shin_jungrae',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_SHIN_JUNGRAE,
    sourceKey: 'work_shin_jungrae',
  },
  {
    recordKey: 'work_lee_hyoseok',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_LEE_HYOSEOK,
    sourceKey: 'work_lee_hyoseok',
  },
  {
    recordKey: 'work_kim_minhyun',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_KIM_MINHYUN,
    sourceKey: 'work_kim_minhyun',
  },
  {
    recordKey: 'work_monthly_plan',
    permissionKey: PERMISSION_KEYS.WORK_MONTHLY_PLAN,
    sourceKey: 'work_monthly_plan',
  },
  {
    recordKey: 'work_history_records',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceKey: 'work_history_records',
  },
]);

export const WORK_RUNTIME_BOOTSTRAP_RECORDS = Object.freeze([
  {
    recordKey: 'work_team_calendar_team1_part1',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceKey: 'work_team_calendar_team1_part1',
  },
  {
    recordKey: 'work_team_calendar_team1_part2',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceKey: 'work_team_calendar_team1_part2',
  },
  {
    recordKey: 'work_team_calendar_team2',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceKey: 'work_team_calendar_team2',
  },
  {
    recordKey: 'work_team_calendar_team3',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceKey: 'work_team_calendar_team3',
  },
]);

export const REPORT_RUNTIME_RECORDS = Object.freeze([
  {
    recordKey: 'cover',
    permissionKey: PERMISSION_KEYS.UTIL_METERING_APP,
    sourceKey: 'report_cover',
  },
]);

const KNOWN_MODULE_RECORD_DEFINITIONS = Object.freeze([
  ...CURRENT_PORTAL_DATA_RECORDS.map((record) => ({
    ...record,
    moduleKey: PORTAL_DATA_MODULE_KEY,
  })),
  ...WORK_RUNTIME_BOOTSTRAP_RECORDS.map((record) => ({
    ...record,
    moduleKey: WORK_RUNTIME_MODULE_KEY,
  })),
  ...REPORT_RUNTIME_RECORDS.map((record) => ({
    ...record,
    moduleKey: REPORT_RUNTIME_MODULE_KEY,
  })),
]);

export function findModuleRecordDefinition(moduleKey, recordKey) {
  const normalizedModuleKey = String(moduleKey || '').trim();
  const normalizedRecordKey = String(recordKey || '').trim();
  if (!normalizedModuleKey || !normalizedRecordKey) return null;

  return (
    KNOWN_MODULE_RECORD_DEFINITIONS.find(
      (record) => record.moduleKey === normalizedModuleKey && record.recordKey === normalizedRecordKey
    ) || null
  );
}

export function isReportRuntimeMonthRecordKey(recordKey) {
  return /^report_\d{4}_\d{2}$/.test(String(recordKey || '').trim());
}

export function getModuleRecordPermissionKey(moduleKey, recordKey) {
  const definition = findModuleRecordDefinition(moduleKey, recordKey);
  if (definition?.permissionKey) return definition.permissionKey;
  if (String(moduleKey || '').trim() === REPORT_RUNTIME_MODULE_KEY && isReportRuntimeMonthRecordKey(recordKey)) {
    return PERMISSION_KEYS.UTIL_METERING_APP;
  }
  return '';
}
