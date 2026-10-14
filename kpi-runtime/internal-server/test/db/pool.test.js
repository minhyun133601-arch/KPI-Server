import assert from 'node:assert/strict';
import test from 'node:test';

import { closePool, getPool } from '../../src/db/pool.js';

test('idle database errors do not escape and keep the pool available', async (t) => {
  const pool = getPool();
  t.after(closePool);
  const warnings = t.mock.method(console, 'warn', () => {});
  const error = Object.assign(new Error('private connection details'), { code: 'ECONNRESET' });

  assert.doesNotThrow(() => pool.emit('error', error, { password: 'private-password' }));
  assert.equal(getPool(), pool);
  assert.equal(warnings.mock.calls.length, 1);
  const logged = JSON.stringify(warnings.mock.calls[0].arguments);
  assert.match(logged, /ECONNRESET/);
  assert.doesNotMatch(logged, /private/);
});
