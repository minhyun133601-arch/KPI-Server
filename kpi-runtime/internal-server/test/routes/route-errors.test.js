import assert from 'node:assert/strict';
import test from 'node:test';

import { getRouteErrorStatusCode } from '../../src/routes/route-errors.js';

test('login rate limit errors return HTTP 429', () => {
  assert.equal(getRouteErrorStatusCode(new Error('login_rate_limited')), 429);
});
