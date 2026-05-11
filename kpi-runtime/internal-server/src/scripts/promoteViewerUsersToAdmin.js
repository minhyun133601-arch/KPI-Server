import { closePool } from '../db/pool.js';
import { promoteViewerUsersToAdmin } from '../services/user-role-promotion.js';

function hasFlag(name) {
  return process.argv.slice(2).includes(`--${name}`);
}

async function main() {
  const write = hasFlag('write');
  const result = await promoteViewerUsersToAdmin({
    actorUserId: null,
    dryRun: !write
  });

  console.log(JSON.stringify({
    ok: true,
    dryRun: !write,
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
