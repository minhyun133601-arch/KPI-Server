import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeWorkHistoryPayload,
  resolveNextDocumentLocation,
} from '../../../src/scripts/one-shot/repairWorkHistoryAttachmentCategories.js';

test('normalizeWorkHistoryPayload moves legacy billing attachments to other slot', () => {
  const { payload, changed, summary } = normalizeWorkHistoryPayload({
    meta: { moduleKey: 'work_history_records' },
    teams: {
      team4: [
        {
          team: 'team4',
          attachmentSlots: {
            billing: {
              attachmentType: 'billing',
              originalName: 'legacy-billing.pdf',
              fileCategory: 'billing_pdf',
            },
            report: {
              attachmentType: 'report',
              originalName: 'legacy-report.pdf',
              fileCategory: 'report_pdf',
            },
          },
          billingAttachment: {
            attachmentType: 'billing',
            originalName: 'legacy-billing.pdf',
            fileCategory: 'billing_pdf',
          },
        },
      ],
    },
  });

  const record = payload.teams.team4[0];
  assert.equal(changed, true);
  assert.equal(summary.legacySlotMovedCount, 1);
  assert.equal(record.attachmentSlots.report.fileCategory, 'report_document');
  assert.equal(record.attachmentSlots.other.attachmentType, 'other');
  assert.equal(record.attachmentSlots.other.fileCategory, 'other_document');
  assert.equal(record.billingAttachment, undefined);
  assert.equal(record.otherAttachment.originalName, 'legacy-billing.pdf');
  assert.deepEqual(
    record.attachments.map((attachment) => attachment.attachmentType),
    ['report', 'other']
  );
});

test('normalizeWorkHistoryPayload is stable after legacy fields are normalized', () => {
  const first = normalizeWorkHistoryPayload({
    meta: { moduleKey: 'work_history_records' },
    teams: {
      team4: [
        {
          team: 'team4',
          attachmentSlots: {
            billing: {
              attachmentType: 'billing',
              originalName: 'legacy-billing.pdf',
              fileCategory: 'billing_pdf',
            },
            report: {
              attachmentType: 'report',
              originalName: 'legacy-report.pdf',
              fileCategory: 'report_pdf',
            },
          },
        },
      ],
    },
  });
  const second = normalizeWorkHistoryPayload(first.payload);

  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  assert.deepEqual(second.payload, first.payload);
  assert.equal(second.summary.legacySlotMovedCount, 0);
  assert.equal(second.summary.legacyPropertyMovedCount, 0);
});

test('resolveNextDocumentLocation maps legacy work-history document folders', () => {
  const billing = resolveNextDocumentLocation({
    owner_key: 'work_history_records:team4:billing:2026-04-22:1',
    file_category: 'billing_pdf',
    stored_name: 'stored.pdf',
    metadata: {},
  });
  const report = resolveNextDocumentLocation({
    owner_key: 'work_history_records:team4:report:2026-04-22:1',
    file_category: 'report_pdf',
    stored_name: 'report.pdf',
    metadata: {},
  });

  assert.equal(billing.fileCategory, 'other_document');
  assert.equal(billing.storageRelPath, '첨부파일/작업내역/기타/stored.pdf');
  assert.equal(billing.metadata.storageFolder, '첨부파일/작업내역/기타');
  assert.equal(report.fileCategory, 'report_document');
  assert.equal(report.storageRelPath, '첨부파일/작업내역/보고서/report.pdf');
});
