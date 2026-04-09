import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';
import { closePool } from '../db/pool.js';
import { ensureDir } from '../lib/fs.js';
import { findModuleRecord, upsertModuleRecord } from '../repositories/modules.js';
import { initializeFileStorage, saveBase64Document } from '../services/files.js';

const METERING_SHARED_STORE_MODULE_KEY = 'util_metering';
const METERING_SHARED_STORE_RECORD_KEY = 'shared_store_v1';
const METERING_SHARED_STORE_PERMISSION_KEY = 'util.metering.app';
const METERING_BILLING_DOCUMENT_OWNER_DOMAIN = 'metering.billing_document';
const METERING_BILLING_DOCUMENT_FILE_CATEGORY = 'billing_document';
const DEFAULT_SCOPE_KEY = 'default';
const backupDir = path.join(config.storageRoot, 'migration-backups');
const meteringAppRoot = path.join(
  config.repoRoot,
  '02_★★★★_유틸리티',
  'apps',
  'metering'
);

function normalizeText(value) {
  return String(value || '').trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseArgs(argv) {
  return {
    write: argv.includes('--write'),
    keepBase64: argv.includes('--keep-base64')
  };
}

function normalizeMonthValue(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(normalizeText(value));
  return match ? `${match[1]}-${match[2]}` : '';
}

function normalizeScopeKey(value) {
  return normalizeText(value) || DEFAULT_SCOPE_KEY;
}

function buildBillingOwnerKey(resourceType, monthValue, scopeKey) {
  return [
    normalizeText(resourceType || 'electric') || 'electric',
    normalizeMonthValue(monthValue),
    normalizeScopeKey(scopeKey)
  ].filter(Boolean).join(':');
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
      scopeMap[normalizeScopeKey(scopeKey)] = value;
    }
  }

  if (Object.keys(scopeMap).length > 0) {
    return scopeMap;
  }

  if (isBillingDocumentLeafRecord(rawDocument)) {
    return {
      [DEFAULT_SCOPE_KEY]: rawDocument
    };
  }

  return {};
}

function buildBillingDocumentMonthRecord(monthValue, scopeDocuments) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth || !isPlainObject(scopeDocuments)) {
    return null;
  }

  const validScopes = Object.fromEntries(
    Object.entries(scopeDocuments).filter(([, document]) => isPlainObject(document))
  );
  const scopeKeys = Object.keys(validScopes);
  if (!scopeKeys.length) {
    return null;
  }

  if (scopeKeys.length === 1 && scopeKeys[0] === DEFAULT_SCOPE_KEY) {
    return validScopes[DEFAULT_SCOPE_KEY];
  }

  return {
    monthValue: normalizedMonth,
    scopes: validScopes
  };
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function getBillingDocumentContainers(store) {
  if (!isPlainObject(store)) {
    return [];
  }

  const resourceDatasets = isPlainObject(store.resourceDatasets) ? store.resourceDatasets : null;
  if (resourceDatasets) {
    return Object.entries(resourceDatasets)
      .filter(([, dataset]) => isPlainObject(dataset))
      .map(([resourceType, dataset]) => {
        if (!isPlainObject(dataset.billingDocuments)) {
          dataset.billingDocuments = {};
        }
        return {
          resourceType: normalizeText(resourceType) || 'electric',
          billingDocuments: dataset.billingDocuments
        };
      });
  }

  if (!isPlainObject(store.billingDocuments)) {
    store.billingDocuments = {};
  }
  return [
    {
      resourceType: normalizeText(store.resourceType) || 'electric',
      billingDocuments: store.billingDocuments
    }
  ];
}

function syncRootBillingDocumentsFromActiveDataset(store) {
  if (!isPlainObject(store?.resourceDatasets)) {
    return;
  }

  const resourceType = normalizeText(store.resourceType) || 'electric';
  const activeDataset = isPlainObject(store.resourceDatasets[resourceType])
    ? store.resourceDatasets[resourceType]
    : null;
  if (!activeDataset) {
    return;
  }

  store.billingDocuments = isPlainObject(activeDataset.billingDocuments) ? activeDataset.billingDocuments : {};
}

function createSummary() {
  return {
    containerCount: 0,
    monthCount: 0,
    scopeCount: 0,
    localOnlyCount: 0,
    resolvedFromRelativePathCount: 0,
    resolvedFromFileNameCount: 0,
    unresolvedLocalOnlyCount: 0,
    migratableCount: 0,
    migratedCount: 0,
    skippedExistingServerCount: 0,
    skippedNoBase64Count: 0
  };
}

async function buildMeteringFileNameIndex(rootDir) {
  const index = new Map();

  async function walk(targetDir) {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const bucket = index.get(entry.name) || [];
      bucket.push(fullPath);
      index.set(entry.name, bucket);
    }
  }

  await walk(rootDir);
  return index;
}

async function resolveLocalBillingDocumentFile(rawDocument, fileNameIndex) {
  const relativePath = normalizeText(rawDocument.relativePath).replace(/[\\/]+/g, path.sep);
  if (relativePath) {
    const directPath = path.resolve(meteringAppRoot, relativePath);
    try {
      const stat = await fs.stat(directPath);
      if (stat.isFile()) {
        return {
          fullPath: directPath,
          resolvedBy: 'relativePath'
        };
      }
    } catch {
      // Fall through to file-name search.
    }
  }

  const fileName = normalizeText(rawDocument.fileName);
  if (!fileName) {
    return null;
  }

  const matches = fileNameIndex.get(fileName) || [];
  if (!matches.length) {
    return null;
  }

  return {
    fullPath: matches[0],
    resolvedBy: 'fileName'
  };
}

function buildMigratedDocument(monthValue, rawDocument, savedDocument, keepBase64) {
  return {
    monthValue: normalizeMonthValue(monthValue),
    fileName: normalizeText(rawDocument.fileName) || normalizeText(savedDocument.original_name),
    relativePath: normalizeText(rawDocument.relativePath),
    mimeType: normalizeText(rawDocument.mimeType) || normalizeText(savedDocument.mime_type),
    savedAt: normalizeText(savedDocument.created_at),
    base64Data: keepBase64 ? normalizeText(rawDocument.base64Data) : '',
    documentId: normalizeText(savedDocument.id),
    previewUrl: `/api/files/${savedDocument.id}/view`,
    downloadUrl: `/api/files/${savedDocument.id}/download`,
    savedToLocalDirectory: false
  };
}

async function writeBackupSnapshot(record) {
  await ensureDir(backupDir);
  const filePath = path.join(
    backupDir,
    `metering-shared-store-v${record.version}-${Date.now()}.json`
  );
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        moduleKey: record.module_key,
        recordKey: record.record_key,
        version: record.version,
        updatedAt: record.updated_at,
        payload: record.payload
      },
      null,
      2
    ),
    'utf8'
  );
  return filePath;
}

async function migrateBillingDocuments(store, options) {
  const nextStore = cloneJson(store);
  const summary = createSummary();
  const containers = getBillingDocumentContainers(nextStore);
  const fileNameIndex = await buildMeteringFileNameIndex(meteringAppRoot);
  summary.containerCount = containers.length;

  for (const container of containers) {
    for (const [monthValue, rawMonthRecord] of Object.entries(container.billingDocuments)) {
      const scopeMap = getBillingDocumentScopeMap(rawMonthRecord);
      const scopeKeys = Object.keys(scopeMap);
      if (!scopeKeys.length) {
        continue;
      }

      summary.monthCount += 1;
      const nextScopeMap = { ...scopeMap };

      for (const scopeKey of scopeKeys) {
        const rawDocument = scopeMap[scopeKey];
        summary.scopeCount += 1;

        const documentId = normalizeText(rawDocument.documentId);
        const previewUrl = normalizeText(rawDocument.previewUrl);
        const downloadUrl = normalizeText(rawDocument.downloadUrl);
        const base64Data = normalizeText(rawDocument.base64Data);
        if (documentId || previewUrl || downloadUrl) {
          summary.skippedExistingServerCount += 1;
          continue;
        }

        if (!base64Data) {
          if (normalizeText(rawDocument.fileName) || normalizeText(rawDocument.relativePath)) {
            summary.localOnlyCount += 1;
          }
          const resolvedLocalFile = await resolveLocalBillingDocumentFile(rawDocument, fileNameIndex);
          if (!resolvedLocalFile) {
            summary.unresolvedLocalOnlyCount += 1;
            summary.skippedNoBase64Count += 1;
            continue;
          }
          if (resolvedLocalFile.resolvedBy === 'relativePath') {
            summary.resolvedFromRelativePathCount += 1;
          } else {
            summary.resolvedFromFileNameCount += 1;
          }
          const localFileBuffer = await fs.readFile(resolvedLocalFile.fullPath);
          const localFileBase64 = localFileBuffer.toString('base64');
          summary.migratableCount += 1;
          if (!options.write) {
            continue;
          }

          const savedDocument = await saveBase64Document({
            actorUserId: null,
            permissionKey: METERING_SHARED_STORE_PERMISSION_KEY,
            ownerDomain: METERING_BILLING_DOCUMENT_OWNER_DOMAIN,
            ownerKey: buildBillingOwnerKey(
              container.resourceType,
              monthValue,
              scopeKey
            ),
            fileCategory: METERING_BILLING_DOCUMENT_FILE_CATEGORY,
            originalName: normalizeText(rawDocument.fileName) || path.basename(resolvedLocalFile.fullPath),
            mimeType: normalizeText(rawDocument.mimeType) || 'application/octet-stream',
            base64Data: localFileBase64,
            metadata: {
              migratedFrom: 'local_relative_path',
              sourceRelativePath: normalizeText(rawDocument.relativePath),
              sourceFilePath: resolvedLocalFile.fullPath,
              resolvedBy: resolvedLocalFile.resolvedBy,
              moduleKey: METERING_SHARED_STORE_MODULE_KEY,
              recordKey: METERING_SHARED_STORE_RECORD_KEY,
              resourceType: container.resourceType,
              monthValue: normalizeMonthValue(monthValue),
              scopeKey: normalizeScopeKey(scopeKey)
            }
          });

          nextScopeMap[scopeKey] = buildMigratedDocument(monthValue, rawDocument, savedDocument, options.keepBase64);
          summary.migratedCount += 1;
          continue;
        }

        summary.migratableCount += 1;
        if (!options.write) {
          continue;
        }

        const savedDocument = await saveBase64Document({
          actorUserId: null,
          permissionKey: METERING_SHARED_STORE_PERMISSION_KEY,
          ownerDomain: METERING_BILLING_DOCUMENT_OWNER_DOMAIN,
          ownerKey: buildBillingOwnerKey(
            container.resourceType,
            monthValue,
            scopeKey
          ),
          fileCategory: METERING_BILLING_DOCUMENT_FILE_CATEGORY,
          originalName: normalizeText(rawDocument.fileName) || 'billing-document.bin',
          mimeType: normalizeText(rawDocument.mimeType) || 'application/octet-stream',
          base64Data,
          metadata: {
            migratedFrom: 'shared_store_base64',
            moduleKey: METERING_SHARED_STORE_MODULE_KEY,
            recordKey: METERING_SHARED_STORE_RECORD_KEY,
            resourceType: container.resourceType,
            monthValue: normalizeMonthValue(monthValue),
            scopeKey: normalizeScopeKey(scopeKey)
          }
        });

        nextScopeMap[scopeKey] = buildMigratedDocument(monthValue, rawDocument, savedDocument, options.keepBase64);
        summary.migratedCount += 1;
      }

      if (options.write) {
        const nextMonthRecord = buildBillingDocumentMonthRecord(monthValue, nextScopeMap);
        if (nextMonthRecord) {
          container.billingDocuments[monthValue] = nextMonthRecord;
        } else {
          delete container.billingDocuments[monthValue];
        }
      }
    }
  }

  if (options.write) {
    syncRootBillingDocumentsFromActiveDataset(nextStore);
  }

  return {
    nextStore,
    summary
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const record = await findModuleRecord(
    METERING_SHARED_STORE_MODULE_KEY,
    METERING_SHARED_STORE_RECORD_KEY
  );

  if (!record) {
    throw new Error('metering_shared_store_not_found');
  }

  const payload = isPlainObject(record.payload) ? record.payload : {};
  const preview = await migrateBillingDocuments(payload, {
    ...options,
    write: false
  });

  if (!options.write) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          keepBase64: options.keepBase64,
          summary: preview.summary,
          backupPath: '',
          nextVersion: record.version
        },
        null,
        2
      )
    );
    return;
  }

  if (preview.summary.migratableCount < 1) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'write',
          keepBase64: options.keepBase64,
          summary: preview.summary,
          backupPath: '',
          nextVersion: record.version
        },
        null,
        2
      )
    );
    return;
  }

  await initializeFileStorage();
  const backupPath = await writeBackupSnapshot(record);
  const result = await migrateBillingDocuments(payload, options);
  let nextRecord = null;
  if (result.summary.migratedCount > 0) {
    nextRecord = await upsertModuleRecord({
      moduleKey: record.module_key,
      recordKey: record.record_key,
      permissionKey: record.permission_key || METERING_SHARED_STORE_PERMISSION_KEY,
      payload: result.nextStore,
      updatedByUserId: null,
      expectedVersion: record.version
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: options.write ? 'write' : 'dry-run',
        keepBase64: options.keepBase64,
        summary: result.summary,
        backupPath,
        nextVersion: nextRecord?.version || record.version
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
