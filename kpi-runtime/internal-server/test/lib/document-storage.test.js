import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveDocumentStorage } from '../../src/lib/document-storage.js';

test('equipment documents are stored below the equipment-name folder', () => {
  const photo = resolveDocumentStorage({
    ownerDomain: 'data.equipment_history',
    ownerKey: 'EQ-001',
    fileCategory: 'photo',
    metadata: { equipmentName: 'Mixer A' },
  });
  const attachment = resolveDocumentStorage({
    ownerDomain: 'audit.legal_facility',
    ownerKey: 'legal-001',
    fileCategory: 'attachment',
    metadata: { facilityName: 'Boiler 1' },
  });

  assert.deepEqual(photo.storageFolder, ['equipment-assets', 'equipment-history', 'Mixer A', 'images']);
  assert.equal(photo.metadata.storageFolder, 'equipment-assets/equipment-history/Mixer A/images');
  assert.deepEqual(attachment.storageFolder, ['equipment-assets', 'legal-facility', 'Boiler 1', 'attachments']);
  assert.equal(attachment.metadata.storageFolder, 'equipment-assets/legal-facility/Boiler 1/attachments');
});

test('metering billing documents are stored below resource-specific folders', () => {
  const electric = resolveDocumentStorage({
    ownerDomain: 'metering.billing_document',
    ownerKey: 'electric:2026-04',
    fileCategory: 'billing_document',
  });
  const gas = resolveDocumentStorage({
    ownerDomain: 'metering.billing_document',
    ownerKey: 'fallback',
    fileCategory: 'billing_document',
    metadata: { resourceType: 'gas' },
  });

  assert.deepEqual(electric.storageFolder, ['첨부파일', '유틸리티', '전기 청구서']);
  assert.deepEqual(gas.storageFolder, ['첨부파일', '유틸리티', '가스 청구서']);
});

test('work history documents resolve billing report and fallback folders', () => {
  const billing = resolveDocumentStorage({
    ownerDomain: 'work.history',
    fileCategory: 'billing_pdf',
  });
  const report = resolveDocumentStorage({
    ownerDomain: 'work.history',
    fileCategory: 'report_pdf',
  });
  const fallback = resolveDocumentStorage({
    ownerDomain: 'work.history',
    fileCategory: 'attachment',
  });

  assert.deepEqual(billing.storageFolder, ['첨부파일', '작업내역', '청구서']);
  assert.deepEqual(report.storageFolder, ['첨부파일', '작업내역', '보고서']);
  assert.deepEqual(fallback.storageFolder, ['첨부파일', '작업내역', '기타']);
});

test('document storage honors explicit folders only for unmanaged domains', () => {
  const unmanaged = resolveDocumentStorage({
    ownerDomain: 'custom.domain',
    fileCategory: 'attachment',
    metadata: { storageFolder: 'custom/root' },
  });
  const managed = resolveDocumentStorage({
    ownerDomain: 'work.team_calendar',
    fileCategory: 'attachment',
    metadata: { storageFolder: 'custom/root' },
  });

  assert.deepEqual(unmanaged.storageFolder, ['custom', 'root']);
  assert.equal(unmanaged.metadata.storageFolder, 'custom/root');
  assert.deepEqual(managed.storageFolder, ['첨부파일', '작업내역', '캘린더 첨부']);
  assert.equal(managed.metadata.storageFolder, '첨부파일/작업내역/캘린더 첨부');
});
