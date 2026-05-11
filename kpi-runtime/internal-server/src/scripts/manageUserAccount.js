import { closePool } from '../db/pool.js';
import { manageUserAccount } from '../services/user-account-management.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return entry ? entry.slice(prefix.length).trim() : '';
}

async function main() {
  const result = await manageUserAccount({
    actorUserId: null,
    username: readArg('username'),
    operation: readArg('operation')
  });

  console.log(JSON.stringify({
    ok: true,
    ...result
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: error.message
  }, null, 2));
  process.exitCode = 1;
}).finally(async () => {
  await closePool().catch(() => {});
});
