import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const FINGERPRINT_VERSION = 'kpi-db-export-compatible-v1';

const TABLES = [
  {
    name: 'app_users',
    columns: ['id', 'username', 'display_name', 'is_active', 'created_at', 'updated_at'],
    excludedColumns: ['password_hash'],
    orderBy: ['id'],
  },
  {
    name: 'app_user_roles',
    columns: ['user_id', 'role_key', 'created_at'],
    orderBy: ['user_id', 'role_key'],
  },
  {
    name: 'app_user_sheet_permissions',
    columns: ['id', 'user_id', 'permission_key', 'can_read', 'can_write', 'expires_at', 'created_at', 'updated_at'],
    orderBy: ['user_id', 'permission_key'],
  },
  {
    name: 'app_module_records',
    columns: [
      'id',
      'module_key',
      'record_key',
      'permission_key',
      'payload',
      'version',
      'updated_by_user_id',
      'created_at',
      'updated_at',
    ],
    orderBy: ['module_key', 'record_key'],
  },
  {
    name: 'app_documents',
    columns: [
      'id',
      'permission_key',
      'owner_domain',
      'owner_key',
      'file_category',
      'original_name',
      'stored_name',
      'mime_type',
      'byte_size',
      'storage_rel_path',
      'metadata',
      'uploaded_by_user_id',
      'created_at',
    ],
    orderBy: ['id'],
  },
  {
    name: 'util_production_daily_state',
    columns: ['state_key', 'period_start_day', 'version', 'updated_by_user_id', 'created_at', 'updated_at'],
    orderBy: ['state_key'],
  },
  {
    name: 'util_production_daily_archives',
    columns: [
      'id',
      'file_name',
      'byte_size',
      'mime_type',
      'last_modified',
      'saved_at',
      'folder_name',
      'fingerprint',
      'document_id',
      'storage',
      'preview_url',
      'download_url',
      'created_at',
      'updated_at',
    ],
    orderBy: ['id'],
  },
  {
    name: 'util_production_daily_entries',
    columns: [
      'id',
      'dedupe_key',
      'production_date',
      'team_name',
      'line_name',
      'product_name',
      'amount',
      'moisture_excluded_yield',
      'work_time',
      'operation_time',
      'equipment_capa',
      'equipment_utilization',
      'source_archive_id',
      'source_fingerprint',
      'source_file_name',
      'created_at',
      'updated_at',
    ],
    orderBy: ['dedupe_key'],
  },
];

function readArg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : '';
}

function resolveDefaultServerDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sourceTreeCandidate = path.resolve(__dirname, '..', '..');
  if (fsSync.existsSync(path.join(sourceTreeCandidate, 'package.json'))) {
    return sourceTreeCandidate;
  }

  const cwdCandidate = process.cwd();
  if (fsSync.existsSync(path.join(cwdCandidate, 'package.json'))) {
    return cwdCandidate;
  }

  throw new Error('server_dir_required: pass --server-dir=<kpi-runtime/internal-server>');
}

function resolveServerDir() {
  const explicit = readArg('server-dir');
  const candidate = explicit
    ? path.isAbsolute(explicit)
      ? explicit
      : path.resolve(process.cwd(), explicit)
    : resolveDefaultServerDir();
  return path.resolve(candidate);
}

function normalizeRuntimeEnvironment(raw) {
  const normalized = String(raw || '')
    .trim()
    .toLowerCase();
  if (normalized === 'prod' || normalized === 'production') return 'production';
  if (normalized === 'dev' || normalized === 'development') return 'development';
  if (normalized === 'local-experiment' || normalized === 'local_experiment' || normalized === 'experiment') {
    return 'local-experiment';
  }
  return '';
}

function getEnvFilePaths(serverDir) {
  const runtimeEnvironment = normalizeRuntimeEnvironment(process.env.KPI_RUNTIME_ENV || process.env.NODE_ENV);
  if (runtimeEnvironment === 'production') {
    return [path.join(serverDir, '.env.production.local'), path.join(serverDir, '.env')];
  }
  if (runtimeEnvironment === 'development') {
    return [path.join(serverDir, '.env.development.local'), path.join(serverDir, '.env')];
  }
  if (runtimeEnvironment === 'local-experiment') {
    return [path.join(serverDir, '.env.local-experiment'), path.join(serverDir, '.env')];
  }
  return [
    path.join(serverDir, '.env.local-experiment'),
    path.join(serverDir, '.env.production.local'),
    path.join(serverDir, '.env.development.local'),
    path.join(serverDir, '.env'),
  ];
}

function loadDotEnv(serverDir) {
  for (const filePath of getEnvFilePaths(serverDir)) {
    if (!fsSync.existsSync(filePath)) continue;

    const lines = fsSync.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = String(line || '').trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) continue;

      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      process.env[key] = rawValue.replace(/^"(.*)"$/, '$1');
    }
    return filePath;
  }
  return '';
}

function redactDatabaseUrl(value) {
  return String(value || '').replace(/:\/\/([^:/@]+):([^@]+)@/, '://$1:***@');
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function normalizeValue(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeValue(value[key])])
    );
  }
  return value === undefined ? null : value;
}

function stableStringify(value) {
  return JSON.stringify(normalizeValue(value));
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function describeSourceFile(sourceFileArg, serverDir) {
  if (!sourceFileArg) return null;
  const sourcePath = path.isAbsolute(sourceFileArg) ? sourceFileArg : path.resolve(serverDir, sourceFileArg);
  try {
    const stat = await fs.stat(sourcePath);
    if (!stat.isFile()) {
      return {
        path: sourcePath,
        exists: false,
        reason: 'not_a_file',
      };
    }
    const buffer = await fs.readFile(sourcePath);
    return {
      path: sourcePath,
      exists: true,
      bytes: stat.size,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      lastModified: stat.mtime.toISOString(),
    };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        path: sourcePath,
        exists: false,
        reason: 'not_found',
      };
    }
    throw error;
  }
}

async function tableExists(client, tableName) {
  const result = await client.query('select to_regclass($1) as table_name', [tableName]);
  return Boolean(result.rows[0]?.table_name);
}

async function getExistingColumns(client, tableName) {
  const result = await client.query(
    `select column_name
       from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1`,
    [tableName]
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function fingerprintTable(client, tableSpec) {
  const exists = await tableExists(client, tableSpec.name);
  if (!exists) {
    return {
      name: tableSpec.name,
      exists: false,
      ok: false,
      rowCount: 0,
      sha256: null,
      columns: tableSpec.columns,
      excludedColumns: tableSpec.excludedColumns || [],
      missingColumns: tableSpec.columns,
    };
  }

  const existingColumns = await getExistingColumns(client, tableSpec.name);
  const missingColumns = tableSpec.columns.filter((column) => !existingColumns.has(column));
  if (missingColumns.length > 0) {
    return {
      name: tableSpec.name,
      exists: true,
      ok: false,
      rowCount: 0,
      sha256: null,
      columns: tableSpec.columns,
      excludedColumns: tableSpec.excludedColumns || [],
      missingColumns,
    };
  }

  const selectColumns = tableSpec.columns.map((column) => quoteIdentifier(column)).join(', ');
  const orderBy = tableSpec.orderBy.map((column) => quoteIdentifier(column)).join(', ');
  const result = await client.query(
    `select ${selectColumns}
       from ${quoteIdentifier(tableSpec.name)}
      order by ${orderBy}`
  );

  const hash = crypto.createHash('sha256');
  for (const row of result.rows) {
    const orderedRow = {};
    for (const column of tableSpec.columns) {
      orderedRow[column] = row[column];
    }
    hash.update(stableStringify(orderedRow));
    hash.update('\n');
  }

  return {
    name: tableSpec.name,
    exists: true,
    ok: true,
    rowCount: result.rows.length,
    sha256: hash.digest('hex'),
    columns: tableSpec.columns,
    excludedColumns: tableSpec.excludedColumns || [],
    missingColumns: [],
  };
}

function buildSummary(tables) {
  const comparableTables = tables.map((table) => ({
    name: table.name,
    ok: table.ok,
    rowCount: table.rowCount,
    sha256: table.sha256,
    columns: table.columns,
    excludedColumns: table.excludedColumns,
  }));
  return {
    tableCount: tables.length,
    okTableCount: tables.filter((table) => table.ok).length,
    totalRows: tables.reduce((sum, table) => sum + (Number(table.rowCount) || 0), 0),
    sha256: sha256Text(
      stableStringify({
        fingerprintVersion: FINGERPRINT_VERSION,
        tables: comparableTables,
      })
    ),
  };
}

async function writeOutput(outputArg, serverDir, payload) {
  if (!outputArg) return '';
  const outputPath = path.isAbsolute(outputArg) ? outputArg : path.resolve(serverDir, outputArg);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return outputPath;
}

async function main() {
  const serverDir = resolveServerDir();
  const envFilePath = loadDotEnv(serverDir);
  const databaseUrl = process.env.KPI_DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres';
  const label = readArg('label') || 'database-fingerprint';
  const sourceFile = await describeSourceFile(readArg('source-file'), serverDir);
  const requireFromServer = createRequire(path.join(serverDir, 'package.json'));
  const pg = requireFromServer('pg');
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 30000,
  });

  let payload;
  try {
    const client = await pool.connect();
    try {
      await client.query(`set time zone 'UTC'`);
      const database = await client.query(
        'select current_database() as database_name, current_user as user_name, current_schema() as schema_name, now() as server_time'
      );
      const tables = [];
      for (const tableSpec of TABLES) {
        tables.push(await fingerprintTable(client, tableSpec));
      }
      payload = {
        ok: tables.every((table) => table.ok),
        label,
        fingerprintVersion: FINGERPRINT_VERSION,
        createdAt: new Date().toISOString(),
        serverDir,
        envFilePath,
        databaseUrl: redactDatabaseUrl(databaseUrl),
        database: {
          name: database.rows[0]?.database_name || '',
          user: database.rows[0]?.user_name || '',
          schema: database.rows[0]?.schema_name || '',
          serverTime:
            database.rows[0]?.server_time instanceof Date
              ? database.rows[0].server_time.toISOString()
              : String(database.rows[0]?.server_time || ''),
        },
        policy: {
          purpose: 'Compare export-compatible KPI business data between the office DB and the home working DB.',
          ignoredState: ['app_sessions', 'app_audit_log'],
          excludedColumnsByTable: Object.fromEntries(
            TABLES.filter((table) => table.excludedColumns?.length).map((table) => [table.name, table.excludedColumns])
          ),
        },
        sourceFile,
        summary: buildSummary(tables),
        tables,
      };
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }

  const outputPath = await writeOutput(readArg('output'), serverDir, payload);
  if (outputPath) {
    payload.outputPath = outputPath;
  }

  console.log(JSON.stringify(payload, null, 2));
  if (!payload.ok) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
