import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DOCUMENT_UPLOAD_MAX_BYTES,
  getBase64ByteLength,
  validateDocumentUploadPolicy,
} from '../../src/lib/document-upload-policy.js';

function assertRejectsUpload(input, expectedMessage) {
  assert.throws(() => validateDocumentUploadPolicy(input), {
    message: expectedMessage
  });
}

test('document upload policy requires billing documents to be real PDFs', () => {
  const baseInput = {
    ownerDomain: 'metering.billing_document',
    fileCategory: 'billing_document',
    base64Data: Buffer.from('invoice').toString('base64')
  };

  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'utility-bill.pdf',
    mimeType: 'application/pdf'
  }));
  assertRejectsUpload({
    ...baseInput,
    originalName: 'utility-bill.pdf',
    mimeType: 'image/png'
  }, 'unsupported_type');
  assertRejectsUpload({
    ...baseInput,
    originalName: 'utility-bill.png',
    mimeType: 'application/pdf'
  }, 'unsupported_type');
});

test('document upload policy keeps generic attachments open but bounds managed domains', () => {
  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ownerDomain: 'generic',
    fileCategory: 'attachment',
    originalName: 'note.exe',
    mimeType: 'application/octet-stream',
    base64Data: Buffer.from('legacy').toString('base64')
  }));

  assertRejectsUpload({
    ownerDomain: 'work.history',
    fileCategory: 'attachment',
    originalName: 'note.exe',
    mimeType: 'application/octet-stream',
    base64Data: Buffer.from('blocked').toString('base64')
  }, 'unsupported_type');
});

test('document upload policy computes base64 size before save', () => {
  assert.equal(getBase64ByteLength('QUJDRA=='), 4);
});

test('document upload policy allows audit lux image and pdf evidence only', () => {
  const baseInput = {
    ownerDomain: 'audit.lux.evidence',
    fileCategory: 'evidence',
    base64Data: Buffer.from('evidence').toString('base64'),
  };

  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'lux.jpg',
    mimeType: 'image/jpeg',
  }));
  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'lux.pdf',
    mimeType: 'application/pdf',
  }));
  assertRejectsUpload({
    ...baseInput,
    originalName: 'lux.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }, 'unsupported_type');
});

test('document upload policy accepts image category by safe extension or mime boundary', () => {
  const baseInput = {
    ownerDomain: 'data.equipment_history',
    fileCategory: 'photo',
    base64Data: Buffer.from('image').toString('base64'),
  };

  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'photo.png',
    mimeType: 'application/octet-stream',
  }));
  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'photo.bin',
    mimeType: 'image/webp',
  }));
  assertRejectsUpload({
    ...baseInput,
    originalName: 'photo.exe',
    mimeType: 'application/octet-stream',
  }, 'unsupported_type');
});

test('document upload policy keeps managed attachment office and hwp types bounded', () => {
  const baseInput = {
    ownerDomain: 'work.history',
    fileCategory: 'attachment',
    base64Data: Buffer.from('attachment').toString('base64'),
  };

  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'report.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }));
  assert.doesNotThrow(() => validateDocumentUploadPolicy({
    ...baseInput,
    originalName: 'report.hwp',
    mimeType: 'application/haansofthwp',
  }));
  assertRejectsUpload({
    ...baseInput,
    originalName: 'report.txt',
    mimeType: 'text/plain',
  }, 'unsupported_type');
});

test('document upload policy rejects managed uploads over the byte limit', () => {
  const tooLargeBase64 = 'A'.repeat(Math.ceil(((DOCUMENT_UPLOAD_MAX_BYTES + 1) * 4) / 3));

  assertRejectsUpload({
    ownerDomain: 'work.history',
    fileCategory: 'attachment',
    originalName: 'report.pdf',
    mimeType: 'application/pdf',
    base64Data: tooLargeBase64,
  }, 'file_too_large');
});
