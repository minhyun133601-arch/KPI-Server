import {
  PORTAL_DATA_MODULE_KEY,
  WORK_RUNTIME_BOOTSTRAP_RECORDS,
  WORK_RUNTIME_MODULE_KEY
} from '../lib/portal-data-registry.js';
import { closePool } from '../db/pool.js';
import { findModuleRecord, listModuleRecordsByModuleKey } from '../repositories/modules.js';

const METERING_SHARED_STORE_MODULE_KEY = 'util_metering';
const METERING_SHARED_STORE_RECORD_KEY = 'shared_store_v1';

function normalizeText(value) {
  return String(value || '').trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getBillingDocumentContainers(store) {
  if (!isPlainObject(store)) {
    return [];
  }

  const resourceDatasets = isPlainObject(store.resourceDatasets) ? store.resourceDatasets : null;
  if (resourceDatasets) {
    return Object.entries(resourceDatasets)
      .filter(([, dataset]) => isPlainObject(dataset) && isPlainObject(dataset.billingDocuments))
      .map(([resourceType, dataset]) => ({
        resourceType: normalizeText(resourceType) || 'electric',
        billingDocuments: dataset.billingDocuments
      }));
  }

  if (!isPlainObject(store.billingDocuments)) {
    return [];
  }

  return [
    {
      resourceType: normalizeText(store.resourceType) || 'electric',
      billingDocuments: store.billingDocuments
    }
  ];
}

function isBillingDocumentLeafRecord(rawDocument) {
  if (!isPlainObject(rawDocument)) {
    return false;
  }

  return Boolean(
    normalizeText(rawDocument.fileName) ||
    normalizeText(rawDocument.relativePath) ||
    normalizeText(rawDocument.mimeType) ||
    normalizeText(rawDocument.base64Data) ||
    normalizeText(rawDocument.documentId)
  );
}

function getBillingDocumentScopeMap(rawDocument) {
  if (!isPlainObject(rawDocument)) {
    return {};
  }

  const scopeSource = isPlainObject(rawDocument.scopes) ? rawDocument.scopes : rawDocument;
  const scopeMap = {};
  for (const [scopeKey, value] of Object.entries(scopeSource)) {
    if (isPlainObject(value)) {
      scopeMap[normalizeText(scopeKey) || 'default'] = value;
    }
  }

  if (Object.keys(scopeMap).length > 0) {
    return scopeMap;
  }

  if (isBillingDocumentLeafRecord(rawDocument)) {
    return { default: rawDocument };
  }

  return {};
}

function scanMeteringBillingDocuments(store) {
  const result = {
    legacyBase64Count: 0,
    localOnlyDocumentCount: 0,
    serverDocumentCount: 0,
    sample: []
  };

  for (const container of getBillingDocumentContainers(store)) {
    for (const [monthValue, rawMonthRecord] of Object.entries(container.billingDocuments)) {
      const scopeMap = getBillingDocumentScopeMap(rawMonthRecord);
      for (const [scopeKey, rawDocument] of Object.entries(scopeMap)) {
        const hasServerDocument = Boolean(
          normalizeText(rawDocument.documentId) ||
          normalizeText(rawDocument.previewUrl) ||
          normalizeText(rawDocument.downloadUrl)
        );
        const hasBase64 = Boolean(normalizeText(rawDocument.base64Data));
        if (hasServerDocument) {
          result.serverDocumentCount += 1;
          continue;
        }
        if (!hasBase64) {
          if (normalizeText(rawDocument.fileName) || normalizeText(rawDocument.relativePath)) {
            result.localOnlyDocumentCount += 1;
          }
          continue;
        }
        result.legacyBase64Count += 1;
        if (result.sample.length < 10) {
          result.sample.push({
            resourceType: container.resourceType,
            monthValue,
            scopeKey,
            fileName: normalizeText(rawDocument.fileName)
          });
        }
      }
    }
  }

  return result;
}

function walkWorkLegacyAttachments(value, pathParts = [], found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkWorkLegacyAttachments(item, [...pathParts, `[${index}]`], found));
    return found;
  }

  if (!isPlainObject(value)) {
    return found;
  }

  if (Array.isArray(value.attachments)) {
    value.attachments.forEach((attachment, index) => {
      const fileName = normalizeText(attachment?.fileName || attachment?.name);
      const isLegacyDirectoryAttachment =
        !normalizeText(attachment?.documentId) &&
        !normalizeText(attachment?.assetId) &&
        !!fileName;
      if (isLegacyDirectoryAttachment) {
        found.push({
          path: [...pathParts, 'attachments', `[${index}]`].join('.'),
          fileName,
          storage: normalizeText(attachment?.storage) || 'directory',
          relativePath: normalizeText(attachment?.relativePath)
        });
      }
    });
  }

  Object.entries(value).forEach(([key, child]) => {
    if (key === 'attachments') return;
    walkWorkLegacyAttachments(child, [...pathParts, key], found);
  });
  return found;
}

function walkAreaLegacyAssets(value, pathParts = [], found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkAreaLegacyAssets(item, [...pathParts, `[${index}]`], found));
    return found;
  }

  if (!isPlainObject(value)) {
    return found;
  }

  const assetId = normalizeText(value.assetId);
  const storage = normalizeText(value.storage);
  const isLegacyLocalAsset = assetId.startsWith('area-asset-') || (storage === 'local' && !!assetId);
  if (isLegacyLocalAsset) {
    found.push({
      path: pathParts.join('.'),
      assetId,
      storage: storage || 'local',
      name: normalizeText(value.name)
    });
  }

  Object.entries(value).forEach(([key, child]) => {
    walkAreaLegacyAssets(child, [...pathParts, key], found);
  });
  return found;
}

async function main() {
  const [meteringRecord, workRecords, portalRecords] = await Promise.all([
    findModuleRecord(METERING_SHARED_STORE_MODULE_KEY, METERING_SHARED_STORE_RECORD_KEY),
    listModuleRecordsByModuleKey(WORK_RUNTIME_MODULE_KEY),
    listModuleRecordsByModuleKey(PORTAL_DATA_MODULE_KEY)
  ]);

  const workSummary = workRecords.map((record) => {
    const legacyAttachments = walkWorkLegacyAttachments(record.payload, [record.record_key]);
    return {
      recordKey: record.record_key,
      legacyDirectoryAttachmentCount: legacyAttachments.length,
      sample: legacyAttachments.slice(0, 5)
    };
  }).filter((item) => item.legacyDirectoryAttachmentCount > 0);

  const areaSummary = portalRecords
    .filter((record) => normalizeText(record.record_key).startsWith('area_map_'))
    .map((record) => {
      const legacyAssets = walkAreaLegacyAssets(record.payload, [record.record_key]);
      return {
        recordKey: record.record_key,
        legacyLocalAssetRefCount: legacyAssets.length,
        sample: legacyAssets.slice(0, 5)
      };
    })
    .filter((item) => item.legacyLocalAssetRefCount > 0);

  console.log(
    JSON.stringify(
      {
        ok: true,
        metering: meteringRecord
          ? {
              recordVersion: meteringRecord.version,
              ...scanMeteringBillingDocuments(meteringRecord.payload)
            }
          : { missing: true },
        workRuntime: {
          expectedRecordCount: WORK_RUNTIME_BOOTSTRAP_RECORDS.length,
          recordCount: workRecords.length,
          recordKeys: workRecords.map((record) => record.record_key),
          missingRecordKeys: WORK_RUNTIME_BOOTSTRAP_RECORDS
            .map((record) => record.recordKey)
            .filter((recordKey) => !workRecords.some((record) => record.record_key === recordKey)),
          legacyRecordCount: workSummary.length,
          records: workSummary
        },
        area: {
          recordCount: portalRecords.filter((record) => normalizeText(record.record_key).startsWith('area_map_')).length,
          legacyRecordCount: areaSummary.length,
          records: areaSummary
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
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
}).finally(async () => {
  await closePool().catch(() => {});
});
