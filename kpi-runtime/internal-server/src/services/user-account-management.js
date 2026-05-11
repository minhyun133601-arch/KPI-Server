import { PERMISSION_KEYS } from '../lib/permission-registry.js';
import { appendAuditLog } from '../repositories/audit-log.js';
import {
  deleteUserById,
  findUserByUsername,
  getUserRoles,
  replaceUserRoles,
  upsertUserPermission
} from '../repositories/users.js';
import { normalizeUsername } from './auth.js';

const ACCOUNT_MANAGEMENT_OPERATIONS = new Set(['viewer', 'admin', 'delete']);

function normalizeAccountOperation(value) {
  const operation = String(value || '').trim().toLowerCase();
  if (!ACCOUNT_MANAGEMENT_OPERATIONS.has(operation)) {
    throw new Error('invalid_account_management_operation');
  }
  return operation;
}

async function grantViewerReadPermissions(userId) {
  for (const permissionKey of Object.values(PERMISSION_KEYS)) {
    await upsertUserPermission(userId, {
      permissionKey,
      canRead: true,
      canWrite: false,
      expiresAt: null
    });
  }
}

function assertManageableUser(user, roles) {
  if (!user) {
    throw new Error('user_not_found');
  }
  if (roles.includes('owner')) {
    throw new Error('owner_manage_forbidden');
  }
}

export async function manageUserAccount({ actorUserId = null, username, operation }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedOperation = normalizeAccountOperation(operation);
  const user = await findUserByUsername(normalizedUsername);
  const previousRoles = user ? await getUserRoles(user.id) : [];
  assertManageableUser(user, previousRoles);

  if (normalizedOperation === 'delete') {
    const deleted = await deleteUserById(user.id);
    if (!deleted) {
      throw new Error('user_delete_failed');
    }
    await appendAuditLog({
      actorUserId,
      actionKey: 'user.manage_delete',
      targetType: 'user',
      targetKey: deleted.id,
      detail: { username: deleted.username, previousRoles }
    });
    return {
      operation: normalizedOperation,
      userId: deleted.id,
      username: deleted.username,
      displayName: deleted.display_name,
      previousRoles,
      roles: []
    };
  }

  const roles = [normalizedOperation];
  await replaceUserRoles(user.id, roles);
  if (normalizedOperation === 'viewer') {
    await grantViewerReadPermissions(user.id);
  }
  await appendAuditLog({
    actorUserId,
    actionKey: 'user.manage_role',
    targetType: 'user',
    targetKey: user.id,
    detail: { username: user.username, previousRoles, roles }
  });

  return {
    operation: normalizedOperation,
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    previousRoles,
    roles
  };
}
