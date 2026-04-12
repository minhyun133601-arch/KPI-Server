import {
  CURRENT_PORTAL_DATA_RECORDS,
  getModuleRecordPermissionKey,
  PORTAL_DATA_MODULE_KEY,
  WORK_RUNTIME_BOOTSTRAP_RECORDS,
  WORK_RUNTIME_MODULE_KEY
} from './portal-data-registry.js';
import { PERMISSION_KEYS, getWorkPermissionKey } from './permission-registry.js';
import { listModuleRecordsByModuleKey } from '../repositories/modules.js';

export const PORTAL_DATA_BOOTSTRAP_PATH = '/bootstrap/portal-data.js';

const PORTAL_DATA_SCRIPT_SOURCES = Object.freeze([]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeJsonForScript(value) {
  return JSON.stringify(value ?? {})
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function resolveRecordPermissionKey(record) {
  const knownPermissionKey = getModuleRecordPermissionKey(record?.module_key, record?.record_key);
  return String(knownPermissionKey || record?.permission_key || '').trim();
}

async function splitReadableModuleRecords(records, auth, canAccessPermission) {
  const source = Array.isArray(records) ? records : [];
  const permissionProbe = typeof canAccessPermission === 'function'
    ? canAccessPermission
    : async () => true;

  const readable = [];
  const blocked = [];

  for (const record of source) {
    const permissionKey = resolveRecordPermissionKey(record);
    if (!permissionKey) {
      blocked.push({
        moduleKey: record?.module_key || '',
        recordKey: record?.record_key || '',
        reason: 'permission_key_unresolved'
      });
      continue;
    }

    const canRead = await permissionProbe(auth?.user, permissionKey, 'read');
    if (!canRead) {
      blocked.push({
        moduleKey: record?.module_key || '',
        recordKey: record?.record_key || '',
        permissionKey
      });
      continue;
    }

    readable.push(
      permissionKey === record?.permission_key
        ? record
        : {
            ...record,
            permission_key: permissionKey
          }
    );
  }

  return { readable, blocked };
}

function buildPortalDataBootstrapTag() {
  return `    <script src="${PORTAL_DATA_BOOTSTRAP_PATH}"></script>\n`;
}

export function injectPortalDataBootstrap(html) {
  let nextHtml = String(html || '');
  let inserted = false;

  for (const src of PORTAL_DATA_SCRIPT_SOURCES) {
    const regex = new RegExp(
      `^[ \\t]*<script\\s+src="${escapeRegExp(src)}(?:\\?[^"]*)?"><\\/script>\\s*\\r?\\n?`,
      'm'
    );
    if (!inserted && regex.test(nextHtml)) {
      nextHtml = nextHtml.replace(regex, buildPortalDataBootstrapTag());
      inserted = true;
      continue;
    }

    nextHtml = nextHtml.replace(regex, '');
  }

  if (!inserted) {
    const xlsxTag = '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>';
    if (nextHtml.includes(xlsxTag)) {
      nextHtml = nextHtml.replace(xlsxTag, `${buildPortalDataBootstrapTag()}    ${xlsxTag}`);
    }
  }

  return {
    html: nextHtml,
    inserted
  };
}

function buildPortalDataBootstrapPayload(records, workRuntimeRecords = [], options = {}) {
  const recordMap = new Map(records.map((record) => [record.record_key, record]));
  const workRuntimeRecordMap = new Map(workRuntimeRecords.map((record) => [record.record_key, record]));
  const knownPortalRecordKeys = options.knownPortalRecordKeys instanceof Set
    ? options.knownPortalRecordKeys
    : new Set(records.map((record) => record.record_key));
  const knownWorkRuntimeRecordKeys = options.knownWorkRuntimeRecordKeys instanceof Set
    ? options.knownWorkRuntimeRecordKeys
    : new Set(workRuntimeRecords.map((record) => record.record_key));
  const portalData = {};
  const areaMapData = {};
  const importedMeta = [];
  const missing = [];

  for (const recordDef of CURRENT_PORTAL_DATA_RECORDS) {
    const loaded = recordMap.get(recordDef.recordKey);
    if (!loaded) {
      if (!knownPortalRecordKeys.has(recordDef.recordKey)) {
        missing.push(recordDef.recordKey);
      }
      continue;
    }

    if (recordDef.sourceRoot === 'AreaMapData') {
      if (Array.isArray(recordDef.sourceKeys) && recordDef.sourceKeys.length) {
        for (const sourceKey of recordDef.sourceKeys) {
          areaMapData[sourceKey] = loaded.payload?.[sourceKey] ?? null;
        }
      } else {
        areaMapData[recordDef.sourceKey] = loaded.payload ?? null;
      }
    } else {
      portalData[recordDef.sourceKey] = loaded.payload ?? null;
    }

    importedMeta.push({
      moduleKey: loaded.module_key,
      recordKey: loaded.record_key,
      permissionKey: loaded.permission_key,
      version: loaded.version,
      updatedAt: loaded.updated_at
    });
  }

  for (const recordDef of WORK_RUNTIME_BOOTSTRAP_RECORDS) {
    const loaded = workRuntimeRecordMap.get(recordDef.recordKey);
    if (!loaded) {
      if (!knownWorkRuntimeRecordKeys.has(recordDef.recordKey)) {
        missing.push(recordDef.recordKey);
      }
      continue;
    }

    portalData[recordDef.sourceKey] = loaded.payload ?? null;
    importedMeta.push({
      moduleKey: loaded.module_key,
      recordKey: loaded.record_key,
      permissionKey: loaded.permission_key,
      version: loaded.version,
      updatedAt: loaded.updated_at
    });
  }

  if (portalData.audit_regulation && !portalData.audit_legal_facility) {
    portalData.audit_legal_facility = portalData.audit_regulation;
  }

  return {
    portalData,
    areaMapData,
    importedMeta,
    missing
  };
}

export async function buildPortalDataBootstrapScript(auth, canAccessPermission) {
  const [allRecords, allWorkRuntimeRecords] = await Promise.all([
    listModuleRecordsByModuleKey(PORTAL_DATA_MODULE_KEY),
    listModuleRecordsByModuleKey(WORK_RUNTIME_MODULE_KEY)
  ]);
  const [
    { readable: records, blocked: blockedPortalRecords },
    { readable: workRuntimeRecords, blocked: blockedWorkRuntimeRecords }
  ] = await Promise.all([
    splitReadableModuleRecords(allRecords, auth, canAccessPermission),
    splitReadableModuleRecords(allWorkRuntimeRecords, auth, canAccessPermission)
  ]);
  const payload = buildPortalDataBootstrapPayload(records, workRuntimeRecords, {
    knownPortalRecordKeys: new Set(allRecords.map((record) => record.record_key)),
    knownWorkRuntimeRecordKeys: new Set(allWorkRuntimeRecords.map((record) => record.record_key))
  });
  const permissionProbe = typeof canAccessPermission === 'function'
    ? canAccessPermission
    : async () => true;

  const workRecordConfigs = {};
  for (const recordDef of CURRENT_PORTAL_DATA_RECORDS) {
    if (!String(recordDef.recordKey || '').startsWith('work_')) continue;
    workRecordConfigs[recordDef.sourceKey] = {
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: recordDef.recordKey,
      permissionKey: recordDef.permissionKey,
      readEnabled: await permissionProbe(auth?.user, recordDef.permissionKey, 'read'),
      writeEnabled: await permissionProbe(auth?.user, recordDef.permissionKey, 'write')
    };
  }
  for (const recordDef of WORK_RUNTIME_BOOTSTRAP_RECORDS) {
    const permissionKey = getWorkPermissionKey(recordDef.recordKey);
    workRecordConfigs[recordDef.sourceKey] = {
      moduleKey: WORK_RUNTIME_MODULE_KEY,
      recordKey: recordDef.recordKey,
      permissionKey,
      readEnabled: await permissionProbe(auth?.user, permissionKey, 'read'),
      writeEnabled: await permissionProbe(auth?.user, permissionKey, 'write')
    };
  }

  const areaRecordConfigs = {
    team3: {
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: 'area_map_team3',
      permissionKey: PERMISSION_KEYS.EQUIP_AREA_TEAM3,
      bundleKeys: ['team3'],
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_TEAM3, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_TEAM3, 'write')
    },
    team1_part1: {
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: 'area_map_existing_teams',
      permissionKey: PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS,
      bundleKeys: ['team1_part1', 'team1_part2', 'team2'],
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'write')
    },
    team1_part2: {
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: 'area_map_existing_teams',
      permissionKey: PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS,
      bundleKeys: ['team1_part1', 'team1_part2', 'team2'],
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'write')
    },
    team2: {
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: 'area_map_existing_teams',
      permissionKey: PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS,
      bundleKeys: ['team1_part1', 'team1_part2', 'team2'],
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_EXISTING_TEAMS, 'write')
    }
  };

  const runtimeConfig = {
    source: 'internal_server',
    enabled: true,
    apiBase: '/api',
    metering: {
      enabled: true,
      apiBase: '/api',
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_METERING_APP, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_METERING_APP, 'write')
    },
    utilData: {
      enabled: true,
      apiBase: '/api',
      moduleKey: PORTAL_DATA_MODULE_KEY,
      records: {
        util_electric_data: {
          moduleKey: PORTAL_DATA_MODULE_KEY,
          recordKey: 'util_electric_data',
          permissionKey: PERMISSION_KEYS.UTIL_ENERGY_ELECTRIC,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_ELECTRIC, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_ELECTRIC, 'write')
        },
        util_gas_data: {
          moduleKey: PORTAL_DATA_MODULE_KEY,
          recordKey: 'util_gas_data',
          permissionKey: PERMISSION_KEYS.UTIL_ENERGY_GAS,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_GAS, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_GAS, 'write')
        },
        util_wastewater_data: {
          moduleKey: PORTAL_DATA_MODULE_KEY,
          recordKey: 'util_wastewater_data',
          permissionKey: PERMISSION_KEYS.UTIL_ENERGY_WASTEWATER,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_WASTEWATER, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_ENERGY_WASTEWATER, 'write')
        }
      }
    },
    utilProduction: {
      enabled: true,
      apiBase: '/api',
      moduleKey: PORTAL_DATA_MODULE_KEY,
      recordKey: 'util_production_daily',
      permissionKey: PERMISSION_KEYS.UTIL_PRODUCTION_DAILY,
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_PRODUCTION_DAILY, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_PRODUCTION_DAILY, 'write'),
      archive: {
        enabled: true,
        apiBase: '/api',
        permissionKey: PERMISSION_KEYS.UTIL_PRODUCTION_ARCHIVE,
        readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_PRODUCTION_ARCHIVE, 'read'),
        writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.UTIL_PRODUCTION_ARCHIVE, 'write'),
        ownerDomain: 'util.production.archive',
        fileCategory: 'source_archive'
      }
    },
    audit: {
      enabled: true,
      apiBase: '/api',
      moduleKey: PORTAL_DATA_MODULE_KEY,
      records: {
        audit_lux: {
          recordKey: 'audit_lux',
          permissionKey: PERMISSION_KEYS.AUDIT_LUX,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_LUX, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_LUX, 'write')
        },
        audit_legal_facility: {
          recordKey: 'audit_regulation',
          permissionKey: PERMISSION_KEYS.AUDIT_REGULATION,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_REGULATION, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_REGULATION, 'write')
        },
        audit_regulation: {
          recordKey: 'audit_regulation',
          permissionKey: PERMISSION_KEYS.AUDIT_REGULATION,
          readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_REGULATION, 'read'),
          writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.AUDIT_REGULATION, 'write')
        }
      }
    },
    work: {
      enabled: true,
      apiBase: '/api',
      moduleKey: WORK_RUNTIME_MODULE_KEY,
      defaultPermissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
      records: workRecordConfigs,
      permissionKeyByDataKey: Object.fromEntries(
        WORK_RUNTIME_BOOTSTRAP_RECORDS.map((record) => [record.recordKey, getWorkPermissionKey(record.recordKey)])
      ),
      readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.WORK_TEAM_CALENDAR, 'read'),
      writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.WORK_TEAM_CALENDAR, 'write'),
      assets: {
        permissionKey: PERMISSION_KEYS.WORK_TEAM_CALENDAR,
        readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.WORK_TEAM_CALENDAR, 'read'),
        writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.WORK_TEAM_CALENDAR, 'write'),
        ownerDomain: 'work',
        fileCategory: 'attachment'
      }
    },
    area: {
      enabled: true,
      apiBase: '/api',
      moduleKey: PORTAL_DATA_MODULE_KEY,
      records: areaRecordConfigs,
      assets: {
        permissionKey: PERMISSION_KEYS.EQUIP_AREA_ASSETS,
        readEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_ASSETS, 'read'),
        writeEnabled: await permissionProbe(auth?.user, PERMISSION_KEYS.EQUIP_AREA_ASSETS, 'write')
      }
    }
  };

  const serializedPortalData = serializeJsonForScript(payload.portalData);
  const serializedAreaMapData = serializeJsonForScript(payload.areaMapData);
  const serializedMeta = serializeJsonForScript({
    moduleKey: PORTAL_DATA_MODULE_KEY,
    importedCount: payload.importedMeta.length,
    importedMeta: payload.importedMeta,
    missing: payload.missing,
    blocked: [...blockedPortalRecords, ...blockedWorkRuntimeRecords],
    generatedAt: new Date().toISOString()
  });
  const serializedRuntimeConfig = serializeJsonForScript(runtimeConfig);

  const warningLine = payload.missing.length
    ? `console.warn('[kpi] portal_data bootstrap missing records:', ${serializeJsonForScript(payload.missing)});\n`
    : '';

  return [
    `window.__KPI_SERVER_RUNTIME_CONFIG__ = ${serializedRuntimeConfig};`,
    'window.PortalData = window.PortalData || {};',
    `Object.assign(window.PortalData, ${serializedPortalData});`,
    'window.AreaMapData = window.AreaMapData || {};',
    `Object.assign(window.AreaMapData, ${serializedAreaMapData});`,
    `window.__KPI_PORTAL_DATA_BOOTSTRAP__ = ${serializedMeta};`,
    warningLine,
    ''
  ].join('\n');
}
