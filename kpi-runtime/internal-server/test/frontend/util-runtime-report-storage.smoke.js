import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, createReportDeckSharedStore } from './support/util-runtime-source-harness.js';

test('util runtime browser adapter reads and writes report deck module records', async () => {
  const fetchCalls = [];
  const { context } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            module_key: 'report_runtime',
            record_key: 'cover',
            payload: { title: '서버 보고서' },
            version: 2,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });

  const adapter = context.KpiUtilRuntimeBrowserAdapter;
  assert.equal(adapter.getReportRuntimeConfig().moduleKey, 'report_runtime');
  assert.equal(adapter.getReportRuntimeConfig().recordKey, 'cover');

  const loaded = await adapter.fetchReportDeckCover({ recordKey: 'report_2026_05' });
  assert.equal(loaded.record.payload.title, '서버 보고서');
  assert.equal(fetchCalls[0].url, '/api/modules/report_runtime/records/report_2026_05');
  assert.equal(fetchCalls[0].options.method, 'GET');

  await adapter.saveReportDeckCover({ title: '수정 보고서' }, { recordKey: 'report_2026_05' });
  assert.equal(fetchCalls[1].url, '/api/modules/report_runtime/records/report_2026_05');
  assert.equal(fetchCalls[1].options.method, 'PUT');
  assert.deepEqual(JSON.parse(fetchCalls[1].options.body), {
    payload: { title: '수정 보고서' },
  });

  const sharedStore = await adapter.fetchMeteringSharedStore();
  assert.equal(fetchCalls[2].url, '/api/shared-store');
  assert.equal(fetchCalls[2].options.method, 'GET');
  assert.equal(
    sharedStore.store.resourceDatasets.electric.billingSettlementEntries['2025-12'].scopes.bukjeong.completed,
    true
  );
});

test('util runtime browser adapter uploads report deck images as managed files', async () => {
  const fetchCalls = [];
  const { context } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          document: { id: 'doc-report-image-1' },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL() {
      this.result = 'data:image/png;base64,QUJD';
      this.onload?.();
    }
  };

  const imageUrl = await context.KpiUtilRuntimeBrowserAdapter.uploadReportDeckImage(
    { name: 'slide.png', type: 'image/png' },
    { recordKey: 'report_2025_11', fieldKey: 'slide8BeforeImage1' }
  );

  assert.equal(imageUrl, '/api/files/doc-report-image-1/view');
  assert.equal(fetchCalls[0].url, '/api/files/base64');
  assert.equal(fetchCalls[0].options.method, 'POST');
  const body = JSON.parse(fetchCalls[0].options.body);
  assert.equal(body.permissionKey, 'util.metering.app');
  assert.equal(body.ownerDomain, 'report.runtime');
  assert.equal(body.ownerKey, 'report_2025_11');
  assert.equal(body.fileCategory, 'image');
  assert.equal(body.originalName, 'slide.png');
  assert.equal(body.mimeType, 'image/png');
  assert.equal(body.base64Data, 'QUJD');
  assert.equal(body.metadata.fieldKey, 'slide8BeforeImage1');
});
