import assert from 'node:assert/strict';
import test from 'node:test';

import { config } from '../../src/config.js';
import { handleLogin } from '../../src/routes/auth-routes.js';

function createJsonResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(body) {
      this.body = Buffer.isBuffer(body) ? body.toString('utf8') : String(body || '');
    },
  };
}

for (const state of [
  { authEnabled: false, loginEnabled: false },
  { authEnabled: false, loginEnabled: true },
  { authEnabled: true, loginEnabled: false },
]) {
  test(`login endpoint is disabled when auth/login flags are ${state.authEnabled}/${state.loginEnabled}`, async () => {
    const previousAuthEnabled = config.authEnabled;
    const previousLoginEnabled = config.loginEnabled;
    config.authEnabled = state.authEnabled;
    config.loginEnabled = state.loginEnabled;

    try {
      const res = createJsonResponse();
      await handleLogin({ req: {}, res });
      assert.equal(res.statusCode, 403);
      assert.deepEqual(JSON.parse(res.body), {
        ok: false,
        error: 'login_disabled',
      });
    } finally {
      config.authEnabled = previousAuthEnabled;
      config.loginEnabled = previousLoginEnabled;
    }
  });
}
