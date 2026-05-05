import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertLoginRateLimit,
  buildLoginRateLimitKey,
  clearLoginRateLimit,
  recordFailedLoginAttempt,
} from '../../src/services/auth-login-rate-limit.js';

const runtimeConfig = {
  loginRateLimitEnabled: true,
  loginRateLimitMaxAttempts: 3,
  loginRateLimitWindowMs: 60_000,
};

test('login rate limit keys normalize username and ip together', () => {
  assert.equal(
    buildLoginRateLimitKey({ username: ' Admin ', ipAddress: ' 127.0.0.1 ' }),
    '127.0.0.1:admin'
  );
});

test('login rate limit blocks after the configured failed attempt count', () => {
  const state = new Map();
  const params = {
    username: 'admin',
    ipAddress: '127.0.0.1',
    now: 1_000,
    runtimeConfig,
    state,
  };

  assert.equal(assertLoginRateLimit(params), true);
  recordFailedLoginAttempt(params);
  recordFailedLoginAttempt(params);
  recordFailedLoginAttempt(params);

  assert.throws(() => assertLoginRateLimit(params), /login_rate_limited/);
});

test('login rate limit expires buckets after the configured window', () => {
  const state = new Map();
  const params = {
    username: 'admin',
    ipAddress: '127.0.0.1',
    now: 1_000,
    runtimeConfig,
    state,
  };

  recordFailedLoginAttempt(params);
  recordFailedLoginAttempt(params);
  recordFailedLoginAttempt(params);

  assert.equal(
    assertLoginRateLimit({
      ...params,
      now: 61_001,
    }),
    true
  );
});

test('successful login clears the rate limit bucket for that username and ip', () => {
  const state = new Map();
  const params = {
    username: 'admin',
    ipAddress: '127.0.0.1',
    now: 1_000,
    runtimeConfig,
    state,
  };

  recordFailedLoginAttempt(params);
  clearLoginRateLimit(params);

  assert.equal(assertLoginRateLimit(params), true);
  assert.equal(state.size, 0);
});

test('login rate limit can be disabled for dedicated verification sessions', () => {
  const state = new Map();
  const disabledConfig = {
    ...runtimeConfig,
    loginRateLimitEnabled: false,
  };
  const params = {
    username: 'admin',
    ipAddress: '127.0.0.1',
    now: 1_000,
    runtimeConfig: disabledConfig,
    state,
  };

  assert.equal(recordFailedLoginAttempt(params), null);
  assert.equal(assertLoginRateLimit(params), true);
  assert.equal(state.size, 0);
});
