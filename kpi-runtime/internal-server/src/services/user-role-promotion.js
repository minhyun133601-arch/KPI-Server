import { appendAuditLog } from '../repositories/audit-log.js';
import { listUsers, replaceUserRoles } from '../repositories/users.js';

const ADMIN_ROLES = new Set(['owner', 'admin']);
const ALLOWED_ROLES = new Set(['owner', 'admin', 'sheet_editor', 'viewer']);

function normalizeRoles(inputRoles) {
  const roles = Array.isArray(inputRoles) ? inputRoles : [];
  const cleaned = roles
    .map((role) => String(role || '').trim().toLowerCase())
    .filter((role) => ALLOWED_ROLES.has(role));
  return [...new Set(cleaned)];
}

function isViewerPromotionCandidate(user) {
  const roles = normalizeRoles(user?.roles);
  return roles.includes('viewer') && !roles.some((role) => ADMIN_ROLES.has(role));
}

function toPromotionTarget(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    previousRoles: normalizeRoles(user.roles),
    roles: ['admin']
  };
}

export async function promoteViewerUsersToAdmin({ actorUserId = null, dryRun = false } = {}) {
  const users = await listUsers();
  const targets = users.filter(isViewerPromotionCandidate).map(toPromotionTarget);

  if (!dryRun) {
    for (const target of targets) {
      await replaceUserRoles(target.id, target.roles);
      await appendAuditLog({
        actorUserId,
        actionKey: 'user.promote_viewer_to_admin',
        targetType: 'user',
        targetKey: target.id,
        detail: {
          username: target.username,
          previousRoles: target.previousRoles,
          roles: target.roles
        }
      });
    }
  }

  return {
    promotedCount: targets.length,
    skippedCount: users.length - targets.length,
    users: targets
  };
}
