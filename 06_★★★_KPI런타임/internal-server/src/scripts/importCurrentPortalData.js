import { closePool } from '../db/pool.js';
import { importCurrentPortalData } from '../lib/local-db-baseline.js';

function parseArgs(argv = []) {
  const requestedRecordKeys = [];
  let dryRun = false;

  for (const value of Array.isArray(argv) ? argv : []) {
    const normalized = String(value || '').trim();
    if (!normalized) continue;
    if (normalized === '--dry-run') {
      dryRun = true;
      continue;
    }
    requestedRecordKeys.push(normalized);
  }

  return {
    requestedRecordKeys,
    dryRun
  };
}

async function main() {
  const { requestedRecordKeys, dryRun } = parseArgs(process.argv.slice(2));
  const result = await importCurrentPortalData({
    requestedRecordKeys,
    dryRun
  });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      error: error.message
    }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool().catch(() => {});
  });
