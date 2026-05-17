import fs from 'node:fs/promises';
import path from 'node:path';
import { config, runtimePaths } from '../config.js';
import { closePool, query } from '../db/pool.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : '';
}

function normalizeRelPath(value) {
  return String(value || '').trim().replace(/[\\/]+/g, '/');
}

function redactDatabaseUrl(value) {
  return String(value || '').replace(/:\/\/([^:/@]+):([^@]+)@/, '://$1:***@');
}

function resolveStoragePath(storageRelPath) {
  return path.join(runtimePaths.filesRoot, ...normalizeRelPath(storageRelPath).split('/'));
}

async function getFileState(documentRecord) {
  const fullPath = resolveStoragePath(documentRecord.storage_rel_path);
  try {
    const stat = await fs.stat(fullPath);
    return {
      ok: stat.isFile() && stat.size === Number(documentRecord.byte_size),
      exists: stat.isFile(),
      sizeMatches: stat.size === Number(documentRecord.byte_size),
      actualBytes: stat.size,
      fullPath
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        ok: false,
        exists: false,
        sizeMatches: false,
        actualBytes: 0,
        fullPath
      };
    }
    throw error;
  }
}

async function main() {
  const manifestPathArg = readArg('manifest');
  const manifestPath = manifestPathArg
    ? path.resolve(config.projectRoot, manifestPathArg)
    : '';
  const result = await query(
    `select id, owner_domain, owner_key, file_category, original_name, stored_name,
            mime_type, byte_size, storage_rel_path, metadata, created_at
       from app_documents
      order by created_at asc, id asc`
  );

  const missing = [];
  const badSize = [];
  let presentCount = 0;
  let expectedBytes = 0;
  let presentBytes = 0;
  let missingBytes = 0;

  for (const record of result.rows) {
    const expected = Number(record.byte_size) || 0;
    expectedBytes += expected;
    const state = await getFileState(record);
    if (state.ok) {
      presentCount += 1;
      presentBytes += state.actualBytes;
      continue;
    }

    const item = {
      id: record.id,
      ownerDomain: record.owner_domain,
      ownerKey: record.owner_key,
      fileCategory: record.file_category,
      originalName: record.original_name,
      storedName: record.stored_name,
      mimeType: record.mime_type,
      expectedBytes: expected,
      actualBytes: state.actualBytes,
      storageRelPath: normalizeRelPath(record.storage_rel_path),
      metadata: record.metadata || {},
      expectedFullPath: state.fullPath,
      createdAt: record.created_at
    };

    if (!state.exists) {
      missing.push(item);
      missingBytes += expected;
    } else {
      badSize.push(item);
      presentBytes += state.actualBytes;
    }
  }

  const payload = {
    ok: missing.length === 0 && badSize.length === 0,
    databaseUrl: redactDatabaseUrl(config.databaseUrl),
    filesRoot: runtimePaths.filesRoot,
    summary: {
      documentCount: result.rows.length,
      presentCount,
      missingCount: missing.length,
      badSizeCount: badSize.length,
      expectedBytes,
      presentBytes,
      missingBytes
    },
    missing,
    badSize
  };

  if (manifestPath) {
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
    payload.manifestPath = manifestPath;
  }

  console.log(JSON.stringify(payload, null, 2));
  if (!payload.ok) {
    process.exitCode = 2;
  }
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
