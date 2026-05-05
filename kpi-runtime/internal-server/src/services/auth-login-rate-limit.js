import { config } from '../config.js';

const failureBuckets = new Map();

function normalizeRateLimitPart(value, fallback) {
  const normalized = String(value || '').trim().normalize('NFC').toLowerCase();
  return normalized || fallback;
}

export function buildLoginRateLimitKey({ username, ipAddress }) {
  const userKey = normalizeRateLimitPart(username, 'unknown-user');
  const ipKey = normalizeRateLimitPart(ipAddress, 'unknown-ip');
  return `${ipKey}:${userKey}`;
}

function pruneExpiredBuckets(state, now, windowMs) {
  for (const [key, bucket] of state.entries()) {
    if (now - bucket.firstAttemptAt >= windowMs) {
      state.delete(key);
    }
  }
}

export function assertLoginRateLimit({
  username,
  ipAddress,
  now = Date.now(),
  runtimeConfig = config,
  state = failureBuckets,
}) {
  if (!runtimeConfig.loginRateLimitEnabled) return true;

  const windowMs = runtimeConfig.loginRateLimitWindowMs;
  const maxAttempts = runtimeConfig.loginRateLimitMaxAttempts;
  pruneExpiredBuckets(state, now, windowMs);

  const key = buildLoginRateLimitKey({ username, ipAddress });
  const bucket = state.get(key);
  if (bucket && bucket.count >= maxAttempts) {
    const error = new Error('login_rate_limited');
    error.retryAfterMs = Math.max(0, bucket.firstAttemptAt + windowMs - now);
    throw error;
  }

  return true;
}

export function recordFailedLoginAttempt({
  username,
  ipAddress,
  now = Date.now(),
  runtimeConfig = config,
  state = failureBuckets,
}) {
  if (!runtimeConfig.loginRateLimitEnabled) return null;

  const windowMs = runtimeConfig.loginRateLimitWindowMs;
  pruneExpiredBuckets(state, now, windowMs);

  const key = buildLoginRateLimitKey({ username, ipAddress });
  const current = state.get(key);
  const bucket = current || { count: 0, firstAttemptAt: now };
  bucket.count += 1;
  state.set(key, bucket);
  return { ...bucket, key };
}

export function clearLoginRateLimit({ username, ipAddress, state = failureBuckets }) {
  state.delete(buildLoginRateLimitKey({ username, ipAddress }));
}
