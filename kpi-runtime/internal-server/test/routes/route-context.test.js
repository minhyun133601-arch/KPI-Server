import assert from 'node:assert/strict';
import test from 'node:test';

import { config } from '../../src/config.js';
import { clearAuthCookie, requireAdmin, requireOwner, writeAuthCookie } from '../../src/routes/route-context.js';

test('admin and owner guards allow open verification mode without auth context', () => {
  const previousAuthEnabled = config.authEnabled;
  try {
    config.authEnabled = false;

    assert.equal(requireAdmin(null), true);
    assert.equal(requireOwner(null), true);
  } finally {
    config.authEnabled = previousAuthEnabled;
  }
});

function createHeaderRecorder() {
  const headers = new Map();
  return {
    headers,
    setHeader(name, value) {
      headers.set(name, value);
    }
  };
}

test('auth cookie secure flag follows runtime config', () => {
  const previousCookieSecure = config.cookieSecure;
  try {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const secureResponse = createHeaderRecorder();
    config.cookieSecure = true;
    writeAuthCookie(secureResponse, 'raw-token', expiresAt);
    assert.match(secureResponse.headers.get('Set-Cookie'), /;\s*Secure(?:;|$)/);

    const clearResponse = createHeaderRecorder();
    clearAuthCookie(clearResponse);
    assert.match(clearResponse.headers.get('Set-Cookie'), /;\s*Secure(?:;|$)/);

    const plainResponse = createHeaderRecorder();
    config.cookieSecure = false;
    writeAuthCookie(plainResponse, 'raw-token', expiresAt);
    assert.doesNotMatch(plainResponse.headers.get('Set-Cookie'), /;\s*Secure(?:;|$)/);
  } finally {
    config.cookieSecure = previousCookieSecure;
  }
});
