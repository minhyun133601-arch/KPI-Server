import assert from 'node:assert/strict';
import test from 'node:test';

import { sendOwnerRepositoryMapPage, sendOwnerRepositoryMapScript } from '../../src/lib/owner-repository-map-page.js';

function createMockResponse() {
  return {
    headers: null,
    statusCode: null,
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

test('owner repository map page reuses the full operations-console map shell', async () => {
  const response = createMockResponse();

  await sendOwnerRepositoryMapPage(response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Type'], /text\/html/);
  assert.match(response.body, /id="treeRoot"/);
  assert.match(response.body, /id="recentList"/);
  assert.match(response.body, /data-i18n="historyTitle"/);
  assert.match(response.body, /src="\/owner\/repository-map\.js"/);
  assert.doesNotMatch(response.body, /src="\/repository-map\.js"/);
});

test('owner repository map script switches to the owner-only API when served under owner route', async () => {
  const response = createMockResponse();

  await sendOwnerRepositoryMapScript(response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Type'], /application\/javascript/);
  assert.match(response.body, /function resolveRepositoryMapEndpoint/);
  assert.match(response.body, /pathname\.startsWith\('\/owner\/repository-map'\)/);
  assert.match(response.body, /\/api\/owner\/repository-map\?maxDepth=50/);
  assert.match(response.body, /\/api\/repository-map\?maxDepth=50/);
});
