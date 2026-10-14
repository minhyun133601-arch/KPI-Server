import assert from 'node:assert/strict';
import test from 'node:test';
import { File } from 'node:buffer';
import { createEquipmentHistoryRuntime } from './support/equipment-history-render-harness.js';

const TEAM_KEY = 'work_team_calendar_team2';
const emptyRoot = { querySelector: () => null, querySelectorAll: () => [] };

function createFixture() {
  const runtime = createEquipmentHistoryRuntime();
  runtime.context.console = { ...console, warn() {} };
  const api = runtime.context.KpiDataEquipmentHistory;
  const data = {
    equipmentList: [
      { id: 'pump-a', name: 'Pump A', teamDataKey: TEAM_KEY, room: 'A', status: '가동중', maintenanceCategory: 'Pump' },
      { id: 'pump-b', name: 'Pump B', teamDataKey: TEAM_KEY, room: 'A', status: '가동중', maintenanceCategory: 'Pump' },
      { id: 'pump-c', name: 'Pump C', teamDataKey: TEAM_KEY, room: 'B', status: '가동중', maintenanceCategory: 'Pump' },
    ],
  };
  const state = {
    view: 'card',
    selectedId: 'pump-a',
    draft: api.createDraft(api.normalizeEquipmentItems(data)[0]),
    preventiveMaintenance: { teamKey: TEAM_KEY },
    pendingPhotoDocumentCleanupIds: [],
  };
  return { ...runtime, api, data, state };
}

function installAssetServer(context, options = {}) {
  const uploadedFiles = [];
  const uploadedDocuments = [];
  const deletedIds = [];
  const writes = [];
  let failPut = options.failPut === true;
  let failUpload = options.failUpload || 0;
  context.__KPI_SERVER_RUNTIME_CONFIG__ = {
    data: {
      enabled: true,
      records: { data_equipment_history_card: { readEnabled: true, writeEnabled: true, permissionKey: 'equipment' } },
      assets: { equipmentHistory: { writeEnabled: true } },
    },
  };
  context.FileReader = class {
    readAsDataURL(file) {
      assert.ok(file instanceof File);
      uploadedFiles.push(file);
      this.result = `data:${file.type};base64,YQ==`;
      this.onload();
    }
  };
  context.fetch = async (url, request) => {
    if (request.method === 'POST') {
      if (failUpload && uploadedFiles.length === failUpload) {
        failUpload = 0;
        return { ok: false, status: 503, json: async () => ({ ok: false, error: 'upload_failed' }) };
      }
      const body = JSON.parse(request.body);
      const document = {
        id: `uploaded-${uploadedDocuments.length + 1}`,
        original_name: body.originalName,
        mime_type: body.mimeType,
      };
      uploadedDocuments.push(document);
      return { ok: true, status: 200, json: async () => ({ ok: true, document }) };
    }
    if (request.method === 'DELETE') {
      deletedIds.push(decodeURIComponent(String(url).split('/').at(-1)));
      return { ok: true, status: 200 };
    }
    assert.equal(request.method, 'PUT');
    const payload = JSON.parse(request.body).payload;
    writes.push(payload);
    if (failPut) {
      failPut = false;
      return { ok: false, status: 503, json: async () => ({ ok: false, error: 'network_failed' }) };
    }
    return { ok: true, status: 200, json: async () => ({ ok: true, record: { payload } }) };
  };
  return { uploadedFiles, uploadedDocuments, deletedIds, writes };
}

function attachFiles(state) {
  const photoFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
  const firstFile = new File(['first'], 'manual.pdf', { type: 'application/pdf' });
  const secondFile = new File(['second'], 'replacement.pdf', { type: 'application/pdf' });
  Object.assign(state.draft, {
    photoFile,
    photoDataUrl: 'data:image/jpeg;base64,b2xk',
    photoName: 'photo.jpg',
    photoDocumentId: 'photo-old',
    photoPreviewUrl: '/api/files/photo-old/view',
    photoDownloadUrl: '/api/files/photo-old/download',
    photoStorageRelPath: 'old-photo.jpg',
    documents: [
      { clientRowId: 'existing', title: 'Existing', documentId: 'document-old', fileName: 'existing.pdf' },
      { clientRowId: 'new', title: 'New', fileName: firstFile.name, pendingFile: firstFile },
      {
        clientRowId: 'replacement', title: 'Replacement', pendingFile: secondFile,
        documentId: 'replacement-old', fileName: secondFile.name, previewUrl: '/api/files/replacement-old/view',
      },
    ],
  });
  state.pendingPhotoDocumentCleanupIds = ['photo-old'];
  return { photoFile, firstFile, secondFile };
}

for (const failure of ['payload', 'partial-upload']) {
  test(`equipment attachment ${failure} failure preserves files and existing references for retry`, async () => {
    const { api, context, data, state } = createFixture();
    const server = installAssetServer(context, failure === 'payload' ? { failPut: true } : { failUpload: 3 });
    const { photoFile, firstFile, secondFile } = attachFiles(state);
    const originalDraft = state.draft;
    const originalRows = [...originalDraft.documents];
    const beforeDraft = JSON.stringify(originalDraft);
    const beforeData = JSON.stringify(data);

    assert.equal(await api.saveCurrentEquipmentHistoryView(emptyRoot, data, state, () => {}), false);
    assert.equal(state.draft, originalDraft);
    assert.equal(JSON.stringify(state.draft), beforeDraft);
    assert.equal(JSON.stringify(data), beforeData);
    assert.equal(state.draft.photoFile, photoFile);
    assert.equal(state.draft.documents[1].pendingFile, firstFile);
    assert.equal(state.draft.documents[2].pendingFile, secondFile);
    originalRows.forEach((row, index) => assert.equal(state.draft.documents[index], row));
    assert.deepEqual(server.deletedIds, server.uploadedDocuments.map((document) => document.id));
    assert.deepEqual(state.pendingPhotoDocumentCleanupIds, ['photo-old']);
    assert.equal(state.equipmentMaintenanceSaving, false);

    const uploadCount = server.uploadedFiles.length;
    assert.equal(await api.saveCurrentEquipmentHistoryView(emptyRoot, data, state, () => {}), true);
    assert.deepEqual(server.uploadedFiles.slice(uploadCount), [photoFile, firstFile, secondFile]);
    const record = data.equipmentList[0];
    const successfulIds = server.uploadedDocuments.slice(-3).map((document) => document.id);
    assert.equal(record.photoDocumentId, successfulIds[0]);
    assert.deepEqual(Array.from(record.documents, (row) => row.documentId), ['document-old', successfulIds[1], successfulIds[2]]);
    assert.equal(state.draft.photoFile, undefined);
    assert.ok(state.draft.documents.every((row) => !row.pendingFile));
    assert.ok(server.deletedIds.includes('photo-old'));
    assert.ok(!server.deletedIds.includes('document-old'));
    assert.ok(!server.deletedIds.includes('replacement-old'));
  });
}

const boardWrites = [
  ['status', (api, data, state) => api.cycleBoardCardStatus(data, state, 'pump-a')],
  ['bulk status', (api, data, state) => api.applyBoardStatus(data, state, { scope: 'all', status: '정비중' })],
  ['card order', (api, data, state) => api.moveBoardCard(data, state, 'pump-a', 1)],
  ['room order', (api, data, state) => api.moveBoardRoom(data, state, { team: TEAM_KEY, room: 'A', direction: 1 })],
  ['delete', (api, data, state) => api.deleteDraft(data, state)],
];

function deferWrites(api) {
  const pending = [];
  api.canSaveEquipmentHistoryToServer = () => true;
  api.saveEquipmentHistoryPayload = (payload) => new Promise((resolve, reject) => {
    pending.push({ payload, complete: () => resolve(payload), reject });
  });
  return pending;
}

test('board writes lock before snapshots and reject overlapping board, card and maintenance saves', async (t) => {
  for (const [name, write] of boardWrites) {
    await t.test(name, async () => {
      const { api, data, state } = createFixture();
      const pending = deferWrites(api);
      const first = write(api, data, state);
      assert.equal(state.equipmentMaintenanceSaving, true);
      assert.equal(pending.length, 1);
      const beforeData = JSON.stringify(data);
      for (const [, competingWrite] of boardWrites) {
        assert.equal(await competingWrite(api, data, state), false);
      }
      assert.equal(await api.saveDraft(data, state), false);
      assert.equal(await api.saveCurrentEquipmentHistoryView(emptyRoot, data, state, () => {}), false);
      assert.equal(await api.saveEquipmentPreventiveCategory(data, state, 'pump-a', 'Other'), false);
      state.maintenanceBatch = { saving: false };
      assert.equal(await api.saveEquipmentMaintenanceBatch(data, state), false);
      state.maintenanceBatch = null;
      assert.equal(pending.length, 1);
      assert.equal(JSON.stringify(data), beforeData);
      pending[0].complete();
      assert.equal(await first, true);
      assert.equal(state.equipmentMaintenanceSaving, false);
    });
  }
});

test('a status change after an earlier write completes keeps both equipment changes', async () => {
  const { api, data, state } = createFixture();
  const pending = deferWrites(api);
  const first = api.cycleBoardCardStatus(data, state, 'pump-a');
  assert.equal(await api.cycleBoardCardStatus(data, state, 'pump-b'), false);
  pending[0].complete();
  assert.equal(await first, true);
  const second = api.cycleBoardCardStatus(data, state, 'pump-b');
  assert.equal(pending.length, 2);
  pending[1].complete();
  assert.equal(await second, true);
  assert.deepEqual(Array.from(data.equipmentList, (row) => row.status), ['비가동중', '비가동중', '가동중']);
});

test('failed board writes release the lock without changing the payload and allow retry', async () => {
  const { api, data, state } = createFixture();
  const pending = deferWrites(api);
  const beforeData = JSON.stringify(data);
  const first = api.moveBoardCard(data, state, 'pump-a', 1);
  pending[0].reject(new Error('network_failed'));
  await assert.rejects(first, /network_failed/);
  assert.equal(JSON.stringify(data), beforeData);
  assert.equal(state.equipmentMaintenanceSaving, false);
  const retry = api.moveBoardCard(data, state, 'pump-a', 1);
  pending[1].complete();
  assert.equal(await retry, true);
  assert.deepEqual(Array.from(data.equipmentList, (row) => row.id), ['pump-b', 'pump-a', 'pump-c']);
});

test('card and maintenance writes also block board mutations until completion', async () => {
  const { api, data, state } = createFixture();
  const pending = deferWrites(api);
  const cardSave = api.saveCurrentEquipmentHistoryView(emptyRoot, data, state, () => {});
  await Promise.resolve();
  assert.equal(pending.length, 1);
  for (const [, write] of boardWrites) assert.equal(await write(api, data, state), false);
  pending[0].complete();
  assert.equal(await cardSave, true);

  state.maintenanceBatch = {
    teamKey: TEAM_KEY,
    categoryKey: api.getEquipmentMaintenanceCategory(data.equipmentList[0]).key,
    selectedIds: ['pump-a', 'pump-b'],
    section: 'maintenanceHistory',
    row: { date: '2026-09-07', content: 'Inspection' },
  };
  const maintenanceSave = api.saveEquipmentMaintenanceBatch(data, state);
  assert.equal(pending.length, 2);
  for (const [, write] of boardWrites) assert.equal(await write(api, data, state), false);
  pending[1].complete();
  assert.equal(await maintenanceSave, true);
  assert.equal(state.maintenanceBatch.saving, false);
});
