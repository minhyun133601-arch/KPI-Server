import fs from 'node:fs/promises';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { config } from '../config.js';
import { closePool, withTransaction } from '../db/pool.js';
import { hashPassword, randomToken } from '../lib/crypto.js';

const SKIPPED_SHEETS = new Set(['export_summary', 'app_schema_migrations']);

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

function decodeXml(value) {
  return String(value || '').replace(/&#x([0-9a-fA-F]+);|&#(\d+);|&(amp|lt|gt|quot|apos);/g, (_, hex, dec, named) => {
    if (hex) {
      return String.fromCodePoint(Number.parseInt(hex, 16));
    }
    if (dec) {
      return String.fromCodePoint(Number.parseInt(dec, 10));
    }
    return {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'"
    }[named] || _;
  });
}

function getAttr(attrs, name) {
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const direct = new RegExp(`(?:^|\\s)${safeName}="([^"]*)"`).exec(attrs);
  if (direct) {
    return decodeXml(direct[1]);
  }
  const namespaced = new RegExp(`(?:^|\\s)[^\\s=]+:${safeName}="([^"]*)"`).exec(attrs);
  return namespaced ? decodeXml(namespaced[1]) : '';
}

function getTextNodes(xml) {
  return [...String(xml || '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1]))
    .join('');
}

function getValueNode(xml) {
  const match = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(String(xml || ''));
  return match ? decodeXml(match[1]) : '';
}

function colIndex(cellRef) {
  const match = /^([A-Z]+)/.exec(String(cellRef || ''));
  if (!match) {
    return 0;
  }

  let index = 0;
  for (const char of match[1]) {
    index = index * 26 + char.charCodeAt(0) - 64;
  }
  return index - 1;
}

function readCellValue(attrs, innerXml, sharedStrings) {
  const type = getAttr(attrs, 't');
  if (type === 'inlineStr') {
    return getTextNodes(innerXml);
  }

  const rawValue = getValueNode(innerXml);
  if (type === 's') {
    return sharedStrings[Number.parseInt(rawValue, 10)] || '';
  }
  if (type === 'b') {
    return rawValue === '1' ? 't' : 'f';
  }
  return rawValue;
}

function readRowsFromWorksheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of String(xml || '').matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const index = colIndex(getAttr(attrs, 'r'));
      while (cells.length <= index) {
        cells.push('');
      }
      cells[index] = readCellValue(attrs, cellMatch[2], sharedStrings);
    }
    while (cells.length > 0 && cells[cells.length - 1] === '') {
      cells.pop();
    }
    rows.push(cells);
  }
  return rows;
}

function rowsToObjects(rows) {
  const headers = rows[0] || [];
  const objects = [];
  for (const row of rows.slice(1)) {
    if (!row.some((value) => String(value || '').trim() !== '')) {
      continue;
    }

    const object = {};
    headers.forEach((header, index) => {
      const key = String(header || '').trim();
      if (key) {
        object[key] = row[index] === undefined ? '' : row[index];
      }
    });
    objects.push(object);
  }
  return objects;
}

async function readXlsxWorkbook(sourcePath) {
  const buffer = await fs.readFile(sourcePath);
  const entries = parseZipEntries(buffer);
  const entriesByName = new Map(entries.map((entry) => [entry.normalizedName, entry]));

  function readText(name) {
    const normalized = normalizeRelPath(name);
    const entry = entriesByName.get(normalized);
    if (!entry) {
      return '';
    }
    return extractZipEntry(buffer, entry).toString('utf8');
  }

  const sharedStringsXml = readText('xl/sharedStrings.xml');
  const sharedStrings = sharedStringsXml
    ? [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) => getTextNodes(match[1]))
    : [];

  const relationships = new Map();
  const relsXml = readText('xl/_rels/workbook.xml.rels');
  for (const match of relsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    relationships.set(getAttr(match[1], 'Id'), getAttr(match[1], 'Target'));
  }

  const sheets = [];
  const workbookXml = readText('xl/workbook.xml');
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const name = getAttr(match[1], 'name');
    const relId = getAttr(match[1], 'id');
    const target = relationships.get(relId);
    if (!name || !target) {
      continue;
    }

    const normalizedTarget = target.startsWith('/')
      ? normalizeRelPath(target.slice(1))
      : normalizeRelPath(path.posix.normalize(`xl/${target}`));
    sheets.push({
      name,
      rows: readRowsFromWorksheet(readText(normalizedTarget), sharedStrings)
    });
  }

  return {
    sourcePath,
    sheets,
    sharedStringCount: sharedStrings.length
  };
}

function asText(row, key, fallback = '') {
  const value = getJoinedField(row, key);
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function asNullableText(row, key) {
  const value = getJoinedField(row, key);
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }
  return String(value);
}

function asBool(row, key, fallback = false) {
  const value = String(getJoinedField(row, key) ?? '').trim().toLowerCase();
  if (!value) {
    return fallback;
  }
  return value === 't' || value === 'true' || value === '1' || value === 'yes';
}

function asInt(row, key, fallback = null) {
  const value = String(getJoinedField(row, key) ?? '').trim();
  return value ? Number.parseInt(value, 10) : fallback;
}

function asNumeric(row, key) {
  const value = String(getJoinedField(row, key) ?? '').trim();
  return value ? value : null;
}

function asFirstNumeric(row, keys) {
  for (const key of keys) {
    const value = asNumeric(row, key);
    if (value !== null) return value;
  }
  return null;
}

function asJson(row, key, fallback = {}) {
  const value = String(getJoinedField(row, key) ?? '').trim();
  if (!value) {
    return fallback;
  }
  return JSON.parse(value);
}

function getJoinedField(row, key) {
  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const prefix = `${key}__part`;
  const parts = Object.keys(row)
    .filter((candidate) => candidate.startsWith(prefix))
    .sort((left, right) => Number(left.slice(prefix.length)) - Number(right.slice(prefix.length)))
    .map((candidate) => row[candidate] || '');

  return parts.length > 0 ? parts.join('') : undefined;
}

function exportedUpdatedAt(row) {
  return Date.parse(asText(row, 'updated_at', '')) || 0;
}

function existingUpdatedAt(row) {
  const value = row?.updated_at;
  if (!value) {
    return 0;
  }
  return Date.parse(value instanceof Date ? value.toISOString() : String(value)) || 0;
}

function isExportNewer(row, existingRow) {
  return exportedUpdatedAt(row) > existingUpdatedAt(existingRow);
}

function createStats() {
  return {
    rows: 0,
    inserted: 0,
    updated: 0,
    skippedExisting: 0,
    skippedOlderOrEqual: 0,
    skippedConflict: 0,
    placeholderUsers: 0
  };
}

function increment(stats, key) {
  stats[key] = (stats[key] || 0) + 1;
}

async function maybeQuery(client, force, stats, action, sql, params) {
  increment(stats, action);
  if (force) {
    await client.query(sql, params);
  }
}

function rowKey(...parts) {
  return parts.map((part) => String(part ?? '')).join('\u001f');
}

async function loadCurrentMaps(client) {
  const users = await client.query('select id, username, password_hash, updated_at from app_users');
  const roles = await client.query('select user_id, role_key from app_user_roles');
  const permissions = await client.query('select id, user_id, permission_key, updated_at from app_user_sheet_permissions');
  const moduleRecords = await client.query('select id, module_key, record_key, updated_at from app_module_records');
  const documents = await client.query('select id, storage_rel_path from app_documents');
  const audits = await client.query('select id from app_audit_log');
  const states = await client.query('select state_key, updated_at from util_production_daily_state');
  const archives = await client.query('select id, updated_at from util_production_daily_archives');
  const entries = await client.query('select id, dedupe_key, updated_at from util_production_daily_entries');

  return {
    usersById: new Map(users.rows.map((row) => [row.id, row])),
    usersByUsername: new Map(users.rows.map((row) => [row.username, row])),
    roles: new Set(roles.rows.map((row) => rowKey(row.user_id, row.role_key))),
    permissionsByKey: new Map(permissions.rows.map((row) => [rowKey(row.user_id, row.permission_key), row])),
    moduleRecordsByKey: new Map(moduleRecords.rows.map((row) => [rowKey(row.module_key, row.record_key), row])),
    documentsById: new Map(documents.rows.map((row) => [row.id, row])),
    documentsByPath: new Map(documents.rows.map((row) => [normalizeRelPath(row.storage_rel_path), row])),
    auditsById: new Map(audits.rows.map((row) => [row.id, row])),
    statesByKey: new Map(states.rows.map((row) => [row.state_key, row])),
    archivesById: new Map(archives.rows.map((row) => [row.id, row])),
    entriesByDedupeKey: new Map(entries.rows.map((row) => [row.dedupe_key, row]))
  };
}

async function importUsers(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const id = asText(row, 'id');
    const username = asText(row, 'username');
    const existing = maps.usersById.get(id);
    const usernameConflict = maps.usersByUsername.get(username);

    if (usernameConflict && usernameConflict.id !== id) {
      increment(stats, 'skippedConflict');
      continue;
    }

    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    const passwordHash = existing?.password_hash || await hashPassword(randomToken(48));
    if (!existing) {
      increment(stats, 'placeholderUsers');
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into app_users
        (id, username, display_name, password_hash, is_active, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (id) do update set
        username = excluded.username,
        display_name = excluded.display_name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at`,
      [
        id,
        username,
        asText(row, 'display_name', username),
        passwordHash,
        asBool(row, 'is_active', true),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );

    maps.usersById.set(id, {
      id,
      username,
      password_hash: passwordHash,
      updated_at: asText(row, 'updated_at')
    });
    maps.usersByUsername.set(username, maps.usersById.get(id));
  }
  return stats;
}

async function importUserRoles(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const key = rowKey(asText(row, 'user_id'), asText(row, 'role_key'));
    if (maps.roles.has(key)) {
      increment(stats, 'skippedExisting');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      'inserted',
      `insert into app_user_roles (user_id, role_key, created_at)
       values ($1, $2, $3)
       on conflict (user_id, role_key) do nothing`,
      [asText(row, 'user_id'), asText(row, 'role_key'), asText(row, 'created_at')]
    );
    maps.roles.add(key);
  }
  return stats;
}

async function importUserPermissions(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const key = rowKey(asText(row, 'user_id'), asText(row, 'permission_key'));
    const existing = maps.permissionsByKey.get(key);
    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into app_user_sheet_permissions
        (id, user_id, permission_key, can_read, can_write, expires_at, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       on conflict (user_id, permission_key) do update set
        can_read = excluded.can_read,
        can_write = excluded.can_write,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at`,
      [
        asText(row, 'id'),
        asText(row, 'user_id'),
        asText(row, 'permission_key'),
        asBool(row, 'can_read', true),
        asBool(row, 'can_write', false),
        asNullableText(row, 'expires_at'),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );
    maps.permissionsByKey.set(key, { updated_at: asText(row, 'updated_at') });
  }
  return stats;
}

async function importModuleRecords(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const key = rowKey(asText(row, 'module_key'), asText(row, 'record_key'));
    const existing = maps.moduleRecordsByKey.get(key);
    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into app_module_records
        (id, module_key, record_key, permission_key, payload, version, updated_by_user_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
       on conflict (module_key, record_key) do update set
        permission_key = excluded.permission_key,
        payload = excluded.payload,
        version = excluded.version,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = excluded.updated_at`,
      [
        asText(row, 'id'),
        asText(row, 'module_key'),
        asText(row, 'record_key'),
        asText(row, 'permission_key'),
        JSON.stringify(asJson(row, 'payload', {})),
        asInt(row, 'version', 1),
        asNullableText(row, 'updated_by_user_id'),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );
    maps.moduleRecordsByKey.set(key, { updated_at: asText(row, 'updated_at') });
  }
  return stats;
}

async function importDocuments(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const id = asText(row, 'id');
    const storagePath = normalizeRelPath(asText(row, 'storage_rel_path'));
    if (maps.documentsById.has(id)) {
      increment(stats, 'skippedExisting');
      continue;
    }
    if (maps.documentsByPath.has(storagePath)) {
      increment(stats, 'skippedConflict');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      'inserted',
      `insert into app_documents
        (id, permission_key, owner_domain, owner_key, file_category, original_name, stored_name,
         mime_type, byte_size, storage_rel_path, metadata, uploaded_by_user_id, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
       on conflict (id) do nothing`,
      [
        id,
        asText(row, 'permission_key'),
        asText(row, 'owner_domain'),
        asText(row, 'owner_key'),
        asText(row, 'file_category'),
        asText(row, 'original_name'),
        asText(row, 'stored_name'),
        asText(row, 'mime_type'),
        asInt(row, 'byte_size', 0),
        storagePath,
        JSON.stringify(asJson(row, 'metadata', {})),
        asNullableText(row, 'uploaded_by_user_id'),
        asText(row, 'created_at')
      ]
    );
    maps.documentsById.set(id, { id, storage_rel_path: storagePath });
    maps.documentsByPath.set(storagePath, { id, storage_rel_path: storagePath });
  }
  return stats;
}

async function importAuditLog(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const id = asText(row, 'id');
    if (maps.auditsById.has(id)) {
      increment(stats, 'skippedExisting');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      'inserted',
      `insert into app_audit_log
        (id, actor_user_id, action_key, target_type, target_key, detail, created_at)
       values ($1, $2, $3, $4, $5, $6::jsonb, $7)
       on conflict (id) do nothing`,
      [
        id,
        asNullableText(row, 'actor_user_id'),
        asText(row, 'action_key'),
        asText(row, 'target_type'),
        asText(row, 'target_key'),
        JSON.stringify(asJson(row, 'detail', {})),
        asText(row, 'created_at')
      ]
    );
    maps.auditsById.set(id, { id });
  }
  return stats;
}

async function importUtilState(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const key = asText(row, 'state_key');
    const existing = maps.statesByKey.get(key);
    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into util_production_daily_state
        (state_key, period_start_day, version, updated_by_user_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (state_key) do update set
        period_start_day = excluded.period_start_day,
        version = excluded.version,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = excluded.updated_at`,
      [
        key,
        asInt(row, 'period_start_day', 1),
        asInt(row, 'version', 1),
        asNullableText(row, 'updated_by_user_id'),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );
    maps.statesByKey.set(key, { updated_at: asText(row, 'updated_at') });
  }
  return stats;
}

async function importUtilArchives(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const id = asText(row, 'id');
    const existing = maps.archivesById.get(id);
    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into util_production_daily_archives
        (id, file_name, byte_size, mime_type, last_modified, saved_at, folder_name,
         fingerprint, document_id, storage, preview_url, download_url, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        updated_at = excluded.updated_at`,
      [
        id,
        asText(row, 'file_name'),
        asInt(row, 'byte_size', 0),
        asText(row, 'mime_type', 'application/octet-stream'),
        asInt(row, 'last_modified', 0),
        asText(row, 'saved_at'),
        asText(row, 'folder_name', 'default'),
        asText(row, 'fingerprint'),
        asText(row, 'document_id'),
        asText(row, 'storage', 'server'),
        asText(row, 'preview_url'),
        asText(row, 'download_url'),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );
    maps.archivesById.set(id, { updated_at: asText(row, 'updated_at') });
  }
  return stats;
}

async function importUtilEntries(client, rows, maps, force) {
  const stats = createStats();
  for (const row of rows) {
    stats.rows += 1;
    const dedupeKey = asText(row, 'dedupe_key');
    const existing = maps.entriesByDedupeKey.get(dedupeKey);
    if (existing && !isExportNewer(row, existing)) {
      increment(stats, 'skippedOlderOrEqual');
      continue;
    }

    await maybeQuery(
      client,
      force,
      stats,
      existing ? 'updated' : 'inserted',
      `insert into util_production_daily_entries
        (id, dedupe_key, production_date, team_name, line_name, production_kind, product_code, product_name,
         amount, moisture_excluded_yield, work_time, operation_time, equipment_capa, equipment_utilization,
         source_archive_id, source_fingerprint, source_file_name, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       on conflict (dedupe_key) do update set
        production_date = excluded.production_date,
        team_name = excluded.team_name,
        line_name = excluded.line_name,
        production_kind = excluded.production_kind,
        product_code = excluded.product_code,
        product_name = excluded.product_name,
        amount = excluded.amount,
        moisture_excluded_yield = excluded.moisture_excluded_yield,
        work_time = excluded.work_time,
        operation_time = excluded.operation_time,
        equipment_capa = excluded.equipment_capa,
        equipment_utilization = excluded.equipment_utilization,
        source_archive_id = excluded.source_archive_id,
        source_fingerprint = excluded.source_fingerprint,
        source_file_name = excluded.source_file_name,
        updated_at = excluded.updated_at`,
      [
        asText(row, 'id'),
        dedupeKey,
        asText(row, 'production_date'),
        asText(row, 'team_name'),
        asText(row, 'line_name'),
        asText(row, 'production_kind') || 'normal',
        asText(row, 'product_code'),
        asText(row, 'product_name'),
        asNumeric(row, 'amount'),
        asNumeric(row, 'moisture_excluded_yield'),
        asFirstNumeric(row, ['work_time', 'input_time']),
        asNumeric(row, 'operation_time'),
        asNumeric(row, 'equipment_capa'),
        asNumeric(row, 'equipment_utilization'),
        asNullableText(row, 'source_archive_id'),
        asNullableText(row, 'source_fingerprint'),
        asNullableText(row, 'source_file_name'),
        asText(row, 'created_at'),
        asText(row, 'updated_at')
      ]
    );
    maps.entriesByDedupeKey.set(dedupeKey, { updated_at: asText(row, 'updated_at') });
  }
  return stats;
}

const IMPORTERS = [
  ['app_users', importUsers],
  ['app_user_roles', importUserRoles],
  ['app_user_sheet_permissions', importUserPermissions],
  ['app_module_records', importModuleRecords],
  ['app_documents', importDocuments],
  ['app_audit_log', importAuditLog],
  ['util_production_daily_state', importUtilState],
  ['util_production_daily_archives', importUtilArchives],
  ['util_production_daily_entries', importUtilEntries]
];

async function getCounts(client) {
  const tables = [
    'app_users',
    'app_user_roles',
    'app_user_sheet_permissions',
    'app_module_records',
    'app_documents',
    'app_audit_log',
    'util_production_daily_state',
    'util_production_daily_archives',
    'util_production_daily_entries'
  ];
  const result = {};
  for (const table of tables) {
    const count = await client.query(`select count(*)::int as count from ${table}`);
    result[table] = count.rows[0].count;
  }
  return result;
}

async function run() {
  const sourceArg = readArg('source') || readArg('file') || '../../KPI-DB-export.xlsx';
  const sourcePath = path.isAbsolute(sourceArg) ? sourceArg : path.resolve(config.projectRoot, sourceArg);
  const force = readFlag('force');

  const workbook = await readXlsxWorkbook(sourcePath);
  const rowsBySheet = new Map(workbook.sheets.map((sheet) => [sheet.name, rowsToObjects(sheet.rows)]));
  const workbookSummary = workbook.sheets.map((sheet) => ({
    sheet: sheet.name,
    rows: Math.max(0, sheet.rows.length - 1),
    skipped: SKIPPED_SHEETS.has(sheet.name)
  }));

  const result = await withTransaction(async (client) => {
    const beforeCounts = await getCounts(client);
    const maps = await loadCurrentMaps(client);
    const importStats = {};

    for (const [sheetName, importer] of IMPORTERS) {
      importStats[sheetName] = await importer(client, rowsBySheet.get(sheetName) || [], maps, force);
    }

    const afterCounts = force ? await getCounts(client) : beforeCounts;
    return {
      ok: true,
      mode: force ? 'apply' : 'preview',
      sourcePath,
      databaseUrl: config.databaseUrl.replace(/:[^:@/]+@/, ':***@'),
      workbookSummary,
      skippedSheets: [...SKIPPED_SHEETS],
      importStats,
      beforeCounts,
      afterCounts
    };
  });

  console.log(JSON.stringify(result, null, 2));
}

try {
  await run();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error.message,
    stack: error.stack
  }, null, 2));
  process.exitCode = 1;
} finally {
  await closePool();
}
