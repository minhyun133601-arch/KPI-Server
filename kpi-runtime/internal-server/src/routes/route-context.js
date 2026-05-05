import { config } from '../config.js';
import { buildCookie, readJsonBody } from '../lib/http.js';
import { assertCanAccessPermission, isAdminRole, isOwnerRole } from '../services/auth.js';

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeExpectedVersion(value) {
  if (value === null || typeof value === 'undefined' || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Parses JSON request bodies under the global body-size guard.
 *
 * Keep request parsing here so route handlers receive plain data and services do
 * not need to know about Node stream details.
 */
export async function parseBody(req) {
  return readJsonBody(req, config.maxJsonBodyBytes);
}

export function requireAuth(auth) {
  if (!config.authEnabled) return true;
  if (!auth?.user) {
    throw new Error('unauthorized');
  }
  return true;
}

export function requireAdmin(auth) {
  if (!config.authEnabled) return true;
  requireAuth(auth);
  if (!isAdminRole(auth.user)) {
    throw new Error('forbidden');
  }
  return true;
}

export function requireOwner(auth) {
  if (!config.authEnabled) return true;
  requireAuth(auth);
  if (!isOwnerRole(auth.user)) {
    throw new Error('forbidden');
  }
  return true;
}

export function serializePermissionKey(input) {
  const value = normalizeText(input);
  if (!value) {
    throw new Error('permission_key_required');
  }
  return value;
}

export async function canAccessPermission(user, permissionKey, accessType) {
  const normalizedPermissionKey = serializePermissionKey(permissionKey);
  if (!config.authEnabled) return true;
  try {
    await assertCanAccessPermission(user, normalizedPermissionKey, accessType);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shared object-level permission gate for module, file, and authority routes.
 *
 * UI visibility is never treated as authorization; every sensitive read/write
 * should pass a permission key through this server-side check.
 */
export async function assertOpenPermission(permissionKey, auth, accessType = 'read') {
  const normalizedPermissionKey = serializePermissionKey(permissionKey);
  if (!config.authEnabled) return true;
  await assertCanAccessPermission(auth?.user, normalizedPermissionKey, accessType);
  return true;
}

/**
 * Writes the session cookie using the runtime security flags.
 *
 * SameSite=Lax is the baseline CSRF guard for this first-party app; Secure is
 * enabled only when the deployment confirms an HTTPS front door.
 */
export function writeAuthCookie(res, rawToken, expiresAt) {
  res.setHeader(
    'Set-Cookie',
    buildCookie(config.cookieName, rawToken, {
      path: '/',
      sameSite: 'Lax',
      secure: config.cookieSecure,
      maxAge: Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    })
  );
}

export function clearAuthCookie(res) {
  res.setHeader(
    'Set-Cookie',
    buildCookie(config.cookieName, '', {
      path: '/',
      sameSite: 'Lax',
      secure: config.cookieSecure,
      maxAge: 0
    })
  );
}

export function sendRedirect(res, location) {
  res.writeHead(302, {
    Location: location
  });
  res.end();
}

export function normalizeNextPath(input) {
  const value = normalizeText(input);
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

export function serializeServerUrlPath(pathname) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}
