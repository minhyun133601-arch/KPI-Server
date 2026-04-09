import path from 'node:path';
import { config } from '../config.js';
import { PERMISSION_KEYS } from './permission-registry.js';

export const PORTAL_DATA_MODULE_KEY = 'portal_data';
export const WORK_RUNTIME_MODULE_KEY = 'work_runtime';

export const CURRENT_PORTAL_DATA_RECORDS = Object.freeze([
  {
    recordKey: 'util_electric_data',
    permissionKey: PERMISSION_KEYS.UTIL_ENERGY_ELECTRIC,
    filePath: path.join(config.repoRoot, '02_★★★★_유틸리티', 'data', 'current', 'data_util_electric.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'util_electric_data'
  },
  {
    recordKey: 'util_gas_data',
    permissionKey: PERMISSION_KEYS.UTIL_ENERGY_GAS,
    filePath: path.join(config.repoRoot, '02_★★★★_유틸리티', 'data', 'current', 'data_util_gas.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'util_gas_data'
  },
  {
    recordKey: 'util_wastewater_data',
    permissionKey: PERMISSION_KEYS.UTIL_ENERGY_WASTEWATER,
    filePath: path.join(config.repoRoot, '02_★★★★_유틸리티', 'data', 'current', 'data_util_wastewater.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'util_wastewater_data'
  },
  {
    recordKey: 'util_production_daily',
    permissionKey: PERMISSION_KEYS.UTIL_PRODUCTION_DAILY,
    filePath: path.join(config.repoRoot, '02_★★★★_유틸리티', 'data', 'current', 'data_util_production_daily.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'util_production_daily'
  },
  {
    recordKey: 'audit_lux',
    permissionKey: PERMISSION_KEYS.AUDIT_LUX,
    filePath: path.join(config.repoRoot, '04_★★★_오디트', 'data', 'current', 'data_audit_lux.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'audit_lux'
  },
  {
    recordKey: 'audit_regulation',
    permissionKey: PERMISSION_KEYS.AUDIT_REGULATION,
    filePath: path.join(config.repoRoot, '04_★★★_오디트', 'data', 'current', 'data_audit_regulation.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'audit_regulation'
  },
  {
    recordKey: 'work_kim_mingyu',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_KIM_MINGYU,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_kim_mingyu.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_kim_mingyu'
  },
  {
    recordKey: 'work_shin_taeseob',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_SHIN_TAESEOB,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_shin_taeseob.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_shin_taeseob'
  },
  {
    recordKey: 'work_ahn_junsoo',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_AHN_JUNSOO,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_ahn_junsoo.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_ahn_junsoo'
  },
  {
    recordKey: 'work_shin_jungrae',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_SHIN_JUNGRAE,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_shin_jungrae.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_shin_jungrae'
  },
  {
    recordKey: 'work_lee_hyoseok',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_LEE_HYOSEOK,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_lee_hyoseok.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_lee_hyoseok'
  },
  {
    recordKey: 'work_kim_minhyun',
    permissionKey: PERMISSION_KEYS.WORK_PERSON_KIM_MINHYUN,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'people', 'data_work_kim_minhyun.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_kim_minhyun'
  },
  {
    recordKey: 'work_monthly_plan',
    permissionKey: PERMISSION_KEYS.WORK_MONTHLY_PLAN,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'plans', 'data_work_monthly_plan.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_monthly_plan'
  },
  {
    recordKey: 'work_history_records',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    filePath: path.join(config.repoRoot, '01_★★★_팀별내역서', 'data', 'current', 'data_work_history_records.js'),
    sourceRoot: 'PortalData',
    sourceKey: 'work_history_records'
  },
  {
    recordKey: 'area_map_team3',
    permissionKey: PERMISSION_KEYS.EQUIP_AREA_TEAM3,
    filePath: path.join(config.repoRoot, '03_★★★★_설비이력카드', 'data', 'area', 'area_map_team3.js'),
    sourceRoot: 'AreaMapData',
    sourceKey: 'team3'
  },
  {
    recordKey: 'area_map_existing_teams',
    permissionKey: PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS,
    filePath: path.join(config.repoRoot, '03_★★★★_설비이력카드', 'data', 'area', 'area_map_existing_teams.js'),
    sourceRoot: 'AreaMapData',
    sourceKeys: ['team1_part1', 'team1_part2', 'team2']
  }
]);

export const WORK_RUNTIME_BOOTSTRAP_RECORDS = Object.freeze([
  {
    recordKey: 'work_team_calendar_team1_part1',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceRoot: 'PortalData',
    sourceKey: 'work_team_calendar_team1_part1'
  },
  {
    recordKey: 'work_team_calendar_team1_part2',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceRoot: 'PortalData',
    sourceKey: 'work_team_calendar_team1_part2'
  },
  {
    recordKey: 'work_team_calendar_team2',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceRoot: 'PortalData',
    sourceKey: 'work_team_calendar_team2'
  },
  {
    recordKey: 'work_team_calendar_team3',
    permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
    sourceRoot: 'PortalData',
    sourceKey: 'work_team_calendar_team3'
  }
]);
