import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withClient } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

export async function runMigrations() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const migrationFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();

  return withClient(async (client) => {
    await client.query(`
      create table if not exists app_schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const applied = [];
    for (const fileName of migrationFiles) {
      const exists = await client.query(
        'select 1 from app_schema_migrations where id = $1',
        [fileName]
      );
      if (exists.rowCount > 0) continue;

      const sql = await fs.readFile(path.join(migrationsDir, fileName), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into app_schema_migrations (id) values ($1)', [fileName]);
        await client.query('commit');
        applied.push(fileName);
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }

    return { applied };
  });
}
