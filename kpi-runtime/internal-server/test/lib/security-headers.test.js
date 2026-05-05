import assert from 'node:assert/strict';
import test from 'node:test';

import { applySecurityHeaders, buildSecurityHeaders } from '../../src/lib/security-headers.js';

function createHeaderRecorder(existing = {}) {
  const headers = new Map(Object.entries(existing));
  return {
    headers,
    hasHeader(name) {
      return headers.has(name);
    },
    setHeader(name, value) {
      headers.set(name, value);
    },
  };
}

test('security headers provide conservative defaults without CSP enforcement', () => {
  const headers = buildSecurityHeaders({
    securityHeadersEnabled: true,
    frameOptions: 'SAMEORIGIN',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
    contentSecurityPolicy: null,
    strictTransportSecurityEnabled: false,
  });

  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'no-referrer');
  assert.equal(headers['Cross-Origin-Resource-Policy'], 'same-origin');
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN');
  assert.equal(headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(headers['Content-Security-Policy'], undefined);
  assert.equal(headers['Strict-Transport-Security'], undefined);
});

test('security headers can opt into CSP and HSTS only when configured', () => {
  const headers = buildSecurityHeaders({
    securityHeadersEnabled: true,
    frameOptions: 'DENY',
    permissionsPolicy: '',
    contentSecurityPolicy: "default-src 'self'",
    strictTransportSecurityEnabled: true,
  });

  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Content-Security-Policy'], "default-src 'self'");
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000; includeSubDomains');
  assert.equal(headers['Permissions-Policy'], undefined);
});

test('applySecurityHeaders preserves response headers already set by a route', () => {
  const response = createHeaderRecorder({
    'X-Frame-Options': 'DENY',
  });

  applySecurityHeaders(response, {
    securityHeadersEnabled: true,
    frameOptions: 'SAMEORIGIN',
    permissionsPolicy: 'camera=()',
    contentSecurityPolicy: null,
    strictTransportSecurityEnabled: false,
  });

  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});
