import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { config, runtimePaths } from '../config.js';
import { closePool, query } from '../db/pool.js';

const SKIPPED_DIRECTORY_NAMES = new Set([
  '.git',
  'node_modules',
  'postgres',
  'tools',
  'backups'
]);

function readFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

function readArg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : '';
}

function normalizeRelPath(value) {
  return String(value || '').trim().replace(/[\\/]+/g, '/');
}

function resolveProjectPath(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }
  return path.isAbsolute(trimmed) ? trimmed : path.resolve(config.projectRoot, trimmed);
}

function resolveStoragePath(storageRelPath) {
  return path.join(runtimePaths.filesRoot, ...normalizeRelPath(storageRelPath).split('/'));
}

function assertInsideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`refusing_path_outside_root:${candidate}`);
  }
}

async function getFileState(fullPath) {
  try {
    const stat = await fs.stat(fullPath);
    return {
      exists: stat.isFile(),
      bytes: stat.size
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        exists: false,
        bytes: 0
      };
    }
    throw error;
  }
}

async function getPathKind(fullPath) {
  try {
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      return 'directory';
    }
    if (stat.isFile() && path.extname(fullPath).toLowerCase() === '.zip') {
      return 'zip';
    }
    return '';
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

async function getDocumentRecords() {
  const result = await query(
    `select id, owner_domain, owner_key, file_category, original_name, stored_name,
            mime_type, byte_size, storage_rel_path, created_at
       from app_documents
      order by created_at asc, id asc`
  );
  return result.rows;
}

async function collectWantedFiles(sourceRoot, wantedNames) {
  const matchesByName = new Map();

  async function walk(directory) {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT' || error?.code === 'EACCES') {
        return;
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORY_NAMES.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }

      if (!entry.isFile() || !wantedNames.has(entry.name)) {
        continue;
      }

      const stat = await fs.stat(fullPath);
      const list = matchesByName.get(entry.name) || [];
      list.push({
        fullPath,
        bytes: stat.size
      });
      matchesByName.set(entry.name, list);
    }
  }

  await walk(sourceRoot);
  return matchesByName;
}

function decodeZipFileName(buffer, start, end, flags) {
  return buffer.toString((flags & 0x0800) === 0x0800 ? 'utf8' : 'latin1', start, end);
}

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const minimumOffset = Math.max(0, buffer.length - 22 - 0xffff);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) {
      return offset;
    }
  }
  throw new Error('zip_end_of_central_directory_not_found');
}

function parseZipEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let offset = centralDirectoryOffset;
  const directoryEnd = centralDirectoryOffset + centralDirectorySize;

  while (offset < directoryEnd && entries.length < entryCount) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`zip_central_directory_header_invalid:${offset}`);
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const name = decodeZipFileName(buffer, fileNameStart, fileNameEnd, flags);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      throw new Error('zip64_not_supported');
    }

    entries.push({
      name,
      normalizedName: normalizeRelPath(name),
      baseName: normalizeRelPath(name).split('/').filter(Boolean).pop() || '',
      flags,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset
    });

    offset = fileNameEnd + extraLength + commentLength;
  }

  return entries;
}

function extractZipEntry(buffer, entry) {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== 0x04034b50) {
    throw new Error(`zip_local_file_header_invalid:${offset}`);
  }

  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedData;
  }
  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressedData);
  }
  throw new Error(`zip_compression_method_not_supported:${entry.compressionMethod}`);
}

async function collectWantedZipFiles(sourcePath, wantedNames) {
  const buffer = await fs.readFile(sourcePath);
  const entries = parseZipEntries(buffer);
  const matchesByName = new Map();

  for (const entry of entries) {
    if (!entry.baseName || !wantedNames.has(entry.baseName)) {
      continue;
    }

    const list = matchesByName.get(entry.baseName) || [];
    list.push({
      kind: 'zipEntry',
      sourcePath: `${sourcePath}::${entry.name}`,
      bytes: entry.uncompressedSize,
      entry
    });
    matchesByName.set(entry.baseName, list);
  }

  return {
    buffer,
    entries,
    matchesByName
  };
}

async function findRelativeCandidate(sourceRoot, record, expectedBytes) {
  const relativeSegments = normalizeRelPath(record.storage_rel_path).split('/').filter(Boolean);
  const candidates = [
    path.join(sourceRoot, ...relativeSegments),
    path.join(sourceRoot, 'files', ...relativeSegments)
  ];

  for (const candidate of candidates) {
    const state = await getFileState(candidate);
    if (state.exists && state.bytes === expectedBytes) {
      return {
        strategy: 'relativePath',
        sourcePath: candidate,
        sourceBytes: state.bytes
      };
    }
  }

  return null;
}

function findZipRelativeCandidate(zipEntries, sourcePath, record, expectedBytes) {
  const storageRelPath = normalizeRelPath(record.storage_rel_path);
  const matches = zipEntries
    .filter((entry) => entry.uncompressedSize === expectedBytes && entry.normalizedName.endsWith(storageRelPath))
    .map((entry) => ({
      kind: 'zipEntry',
      strategy: 'relativePath',
      sourcePath: `${sourcePath}::${entry.name}`,
      sourceBytes: entry.uncompressedSize,
      entry
    }));

  if (matches.length === 1) {
    return matches[0];
  }
  if (matches.length > 1) {
    return {
      strategy: 'ambiguous',
      candidates: matches.map((match) => match.sourcePath)
    };
  }
  return null;
}

function findIndexedCandidate(matchesByName, record, expectedBytes, candidateKind = 'file') {
  const names = [
    { strategy: 'storedName', value: record.stored_name },
    { strategy: 'originalName', value: record.original_name }
  ];

  const exactMatches = [];
  for (const name of names) {
    const matches = matchesByName.get(name.value) || [];
    for (const match of matches) {
      if (match.bytes === expectedBytes) {
        exactMatches.push({
          kind: candidateKind,
          strategy: name.strategy,
          sourcePath: match.sourcePath || match.fullPath,
          sourceBytes: match.bytes,
          entry: match.entry
        });
      }
    }
  }

  const uniqueByPath = new Map(exactMatches.map((match) => [match.sourcePath, match]));
  const uniqueMatches = [...uniqueByPath.values()];
  if (uniqueMatches.length === 1) {
    return uniqueMatches[0];
  }
  if (uniqueMatches.length > 1) {
    return {
      strategy: 'ambiguous',
      candidates: uniqueMatches.map((match) => match.sourcePath)
    };
  }
  return null;
}

async function copyWithBackup({ candidate, targetPath, backupRoot, zipBuffer }) {
  const existingState = await getFileState(targetPath);
  if (existingState.exists) {
    const relativeTarget = path.relative(runtimePaths.filesRoot, targetPath);
    const backupPath = path.join(backupRoot, relativeTarget);
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.copyFile(targetPath, backupPath);
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  if (candidate.kind === 'zipEntry') {
    const extracted = extractZipEntry(zipBuffer, candidate.entry);
    if (extracted.length !== candidate.sourceBytes) {
      throw new Error(`zip_entry_size_mismatch:${candidate.sourcePath}`);
    }
    await fs.writeFile(targetPath, extracted);
    return;
  }

  await fs.copyFile(candidate.sourcePath, targetPath);
}

async function main() {
  const sourceArg = readArg('source');
  const manifestArg = readArg('manifest');
  const force = readFlag('force');
  const details = readFlag('details');
  const sourcePath = resolveProjectPath(sourceArg);
  const manifestPath = manifestArg ? resolveProjectPath(manifestArg) : '';

  if (!sourcePath) {
    throw new Error('missing_required_argument:--source=<folder-or-zip>');
  }

  const sourceKind = await getPathKind(sourcePath);
  if (!sourceKind) {
    throw new Error(`source_folder_or_zip_not_found:${sourcePath}`);
  }

  const records = await getDocumentRecords();
  const wantedNames = new Set();
  for (const record of records) {
    if (record.stored_name) wantedNames.add(record.stored_name);
    if (record.original_name) wantedNames.add(record.original_name);
  }

  const sourceIndex = sourceKind === 'zip'
    ? await collectWantedZipFiles(sourcePath, wantedNames)
    : {
        buffer: null,
        entries: [],
        matchesByName: await collectWantedFiles(sourcePath, wantedNames)
      };
  const backupRoot = path.join(
    config.storageRoot,
    'backups',
    'pre-document-storage-restore',
    new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z')
  );

  const items = [];
  let alreadyPresent = 0;
  let needsRestore = 0;
  let restorable = 0;
  let restored = 0;
  let missingSource = 0;
  let ambiguous = 0;
  let badTargetSize = 0;

  for (const record of records) {
    const expectedBytes = Number(record.byte_size) || 0;
    const targetPath = resolveStoragePath(record.storage_rel_path);
    assertInsideRoot(runtimePaths.filesRoot, targetPath);
    const targetState = await getFileState(targetPath);

    if (targetState.exists && targetState.bytes === expectedBytes) {
      alreadyPresent += 1;
      continue;
    }

    needsRestore += 1;
    if (targetState.exists) {
      badTargetSize += 1;
    }

    const relativeCandidate = sourceKind === 'zip'
      ? findZipRelativeCandidate(sourceIndex.entries, sourcePath, record, expectedBytes)
      : await findRelativeCandidate(sourcePath, record, expectedBytes);
    const candidate = relativeCandidate || findIndexedCandidate(
      sourceIndex.matchesByName,
      record,
      expectedBytes,
      sourceKind === 'zip' ? 'zipEntry' : 'file'
    );
    const item = {
      id: record.id,
      ownerDomain: record.owner_domain,
      ownerKey: record.owner_key,
      fileCategory: record.file_category,
      originalName: record.original_name,
      storedName: record.stored_name,
      expectedBytes,
      targetBytes: targetState.bytes,
      storageRelPath: normalizeRelPath(record.storage_rel_path),
      targetPath
    };

    if (!candidate) {
      missingSource += 1;
      item.status = 'sourceMissing';
      items.push(item);
      continue;
    }

    if (candidate.strategy === 'ambiguous') {
      ambiguous += 1;
      item.status = 'ambiguousSource';
      item.candidates = candidate.candidates;
      items.push(item);
      continue;
    }

    restorable += 1;
    item.status = force ? 'restored' : 'restorable';
    item.matchStrategy = candidate.strategy;
    item.sourcePath = candidate.sourcePath;

    if (force) {
      await copyWithBackup({
        candidate,
        targetPath,
        backupRoot,
        zipBuffer: sourceIndex.buffer
      });
      restored += 1;
    }

    items.push(item);
  }

  const payload = {
    ok: missingSource === 0 && ambiguous === 0 && (!force || restored === needsRestore),
    mode: force ? 'restore' : 'preview',
    sourceKind,
    sourcePath,
    targetRoot: runtimePaths.filesRoot,
    backupRoot: force && restored > 0 ? backupRoot : null,
    summary: {
      documentCount: records.length,
      alreadyPresent,
      needsRestore,
      restorable,
      restored,
      missingSource,
      ambiguous,
      badTargetSize
    },
    items
  };

  if (manifestPath) {
    await fs.mkdir(path.dirname(manifestPath), { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(payload, null, 2), 'utf8');
    payload.manifestPath = manifestPath;
  }

  const consolePayload = details ? payload : { ...payload };
  if (!details) {
    delete consolePayload.items;
  }
  console.log(JSON.stringify(consolePayload, null, 2));
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
