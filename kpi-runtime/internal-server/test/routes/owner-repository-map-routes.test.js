import assert from 'node:assert/strict';
import test from 'node:test';

import {
  sendOwnerRepositoryMapPage,
  sendOwnerRepositoryMapScript,
} from '../../src/lib/owner-repository-map-page.js';

function createResponseCapture() {
  const capture = {
    statusCode: 0,
    headers: {},
    body: '',
  };

  return {
    capture,
    writeHead(statusCode, headers) {
      capture.statusCode = statusCode;
      capture.headers = headers || {};
    },
    end(chunk) {
      capture.body = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk || '');
    },
  };
}

test('owner repository map page rewrites its data script to the owner route', async () => {
  const response = createResponseCapture();

  await sendOwnerRepositoryMapPage(response);

  assert.equal(response.capture.statusCode, 200);
  assert.match(response.capture.headers['Content-Type'], /text\/html/);
  assert.match(response.capture.body, /<script src="\/owner\/repository-map-data\.js"><\/script>/);
  assert.doesNotMatch(response.capture.body, /<script src="\/repository-map-data\.js"><\/script>/);
  assert.match(response.capture.body, /\/api\/owner\/repository-map/);
  assert.doesNotMatch(response.capture.body, /\/owner\/repository-map-history\//);
});

test('owner repository map data script serves the split repository-map data file', async () => {
  const response = createResponseCapture();

  await sendOwnerRepositoryMapScript(response);

  assert.equal(response.capture.statusCode, 200);
  assert.match(response.capture.headers['Content-Type'], /application\/javascript/);
  assert.match(response.capture.body, /KPI_REPOSITORY_MAP_STATIC_TREE/);
  assert.doesNotMatch(response.capture.body, /KPI_REPOSITORY_MAP_HISTORY_FILES/);
  assert.doesNotMatch(response.capture.body, /KPI_REPOSITORY_MAP_DAILY_HISTORY/);
  assert.doesNotMatch(response.capture.body, /KPI_REPOSITORY_MAP_I18N/);
});
