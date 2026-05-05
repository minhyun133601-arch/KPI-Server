import { config } from '../config.js';

const STATIC_SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
});

function setHeaderIfUnset(res, name, value) {
  if (!value) return;
  if (typeof res.hasHeader === 'function' && res.hasHeader(name)) return;
  res.setHeader(name, value);
}

export function buildSecurityHeaders(runtimeConfig = config) {
  if (!runtimeConfig.securityHeadersEnabled) return {};

  const headers = { ...STATIC_SECURITY_HEADERS };
  if (runtimeConfig.frameOptions) {
    headers['X-Frame-Options'] = runtimeConfig.frameOptions;
  }
  if (runtimeConfig.permissionsPolicy) {
    headers['Permissions-Policy'] = runtimeConfig.permissionsPolicy;
  }
  if (runtimeConfig.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = runtimeConfig.contentSecurityPolicy;
  }
  if (runtimeConfig.strictTransportSecurityEnabled) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

export function applySecurityHeaders(res, runtimeConfig = config) {
  for (const [name, value] of Object.entries(buildSecurityHeaders(runtimeConfig))) {
    setHeaderIfUnset(res, name, value);
  }
}
