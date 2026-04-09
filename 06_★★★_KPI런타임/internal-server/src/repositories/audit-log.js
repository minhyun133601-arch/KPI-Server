import { query } from '../db/pool.js';

export async function appendAuditLog({ actorUserId, actionKey, targetType, targetKey, detail }) {
  await query(
    `insert into app_audit_log (actor_user_id, action_key, target_type, target_key, detail)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [actorUserId || null, actionKey, targetType, targetKey, JSON.stringify(detail ?? {})]
  );
}
