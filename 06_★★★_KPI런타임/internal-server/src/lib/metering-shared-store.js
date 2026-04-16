import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { config } from '../config.js';
import { PERMISSION_KEYS } from './permission-registry.js';

export const METERING_SHARED_STORE_MODULE_KEY = 'util_metering';
export const METERING_SHARED_STORE_RECORD_KEY = 'shared_store_v1';
export const METERING_SHARED_STORE_PERMISSION_KEY = PERMISSION_KEYS.UTIL_METERING_APP;
export const METERING_PRESET_SOURCE_PATH = path.join(
  config.localSourceRoot,
  '02_★★★★_유틸리티',
  'apps',
  'metering',
  'preset-entry-data.js'
);

export function getMeteringSharedStoreMeta(record) {
  if (!record) return null;
  return {
    moduleKey: record.module_key,
    recordKey: record.record_key,
    permissionKey: record.permission_key,
    version: record.version,
    updatedAt: record.updated_at
  };
}

export function buildMeteringSharedStoreSummary(store) {
  const resourceDatasets = store?.resourceDatasets && typeof store.resourceDatasets === 'object'
    ? store.resourceDatasets
    : {};
  const resourceDatasetBillingDocumentCount = Object.values(resourceDatasets).reduce((count, dataset) => {
    if (!dataset || typeof dataset !== 'object') return count;
    const documents = dataset.billingDocuments && typeof dataset.billingDocuments === 'object'
      ? dataset.billingDocuments
      : {};
    return count + Object.keys(documents).length;
  }, 0);

  return {
    equipmentItemCount: Array.isArray(store?.equipmentItems) ? store.equipmentItems.length : 0,
    electricMonthCount:
      store?.electricEntries && typeof store.electricEntries === 'object'
        ? Object.keys(store.electricEntries).length
        : 0,
    gasMonthCount:
      store?.gasEntries && typeof store.gasEntries === 'object'
        ? Object.keys(store.gasEntries).length
        : 0,
    billingDocumentCount:
      store?.billingDocuments && typeof store.billingDocuments === 'object'
        ? Object.keys(store.billingDocuments).length
        : 0,
    resourceDatasetCount: Object.keys(resourceDatasets).length,
    resourceDatasetBillingDocumentCount
  };
}

export async function loadMeteringPresetStore() {
  const source = await fs.readFile(METERING_PRESET_SOURCE_PATH, 'utf8');
  const sandbox = {
    console,
    window: {}
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, {
    filename: METERING_PRESET_SOURCE_PATH,
    timeout: 5000
  });

  const store = sandbox.window.__LOCAL_APP_STORE__;
  if (!store || typeof store !== 'object') {
    throw new Error('preset_store_not_found');
  }

  return store;
}
