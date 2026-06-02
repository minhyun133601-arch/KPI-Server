import assert from 'node:assert/strict';
import { validateHeaderValue } from 'node:http';
import test from 'node:test';

import { buildCaptureAttachmentContentDisposition } from '../../src/routes/report-capture-routes.js';

test('capture downloads encode Korean file names in Content-Disposition', () => {
  const header = buildCaptureAttachmentContentDisposition('2026-04 북정공장 전기 원가 Data.pdf');

  validateHeaderValue('Content-Disposition', header);
  assert.match(header, /^attachment; filename="2026-04_Data\.pdf"; filename\*=UTF-8''/);
  assert.match(header, /%EB%B6%81%EC%A0%95%EA%B3%B5%EC%9E%A5/);
  assert.doesNotMatch(header, /북정공장/);
});

test('capture download fallback removes header-unsafe characters', () => {
  const header = buildCaptureAttachmentContentDisposition('bad"name\r\n.pdf');

  validateHeaderValue('Content-Disposition', header);
  assert.match(header, /^attachment; filename="bad_name_\.pdf"; filename\*=UTF-8''/);
  assert.doesNotMatch(header, /[\r\n]/);
});
