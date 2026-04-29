import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeUsername } from '../../src/services/auth.js';

test('normalizeUsername accepts Korean owner usernames', () => {
  assert.equal(normalizeUsername(' 김민현 '), '김민현');
});

test('normalizeUsername rejects separators and spaces', () => {
  assert.throws(() => normalizeUsername('김민현/1347'), /invalid_username_format/);
  assert.throws(() => normalizeUsername('김 민현'), /invalid_username_format/);
});
