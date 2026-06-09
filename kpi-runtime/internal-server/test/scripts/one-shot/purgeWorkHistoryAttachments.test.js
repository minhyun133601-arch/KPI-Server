import assert from 'node:assert/strict';
import test from 'node:test';

import { stripWorkHistoryAttachmentsFromPayload } from '../../../src/scripts/one-shot/purgeWorkHistoryAttachments.js';

test('stripWorkHistoryAttachmentsFromPayload removes legacy attachment fields only', () => {
  const sourcePayload = {
    meta: { moduleKey: 'work_history_records' },
    teams: {
      team1part1: [
        {
          team: 'team1part1',
          startDate: '2026-04-01',
          endDate: '2026-04-01',
          workContent: 'Alpha task',
          cost: 1000,
          attachmentSlots: { report: { originalName: 'report.pdf' } },
          attachments: [{ originalName: 'report.pdf' }],
          reportAttachment: { originalName: 'report.pdf' },
          reportDocument: { originalName: 'report.pdf' },
          estimateAttachment: { originalName: 'estimate.pdf' },
          estimateDocument: { originalName: 'estimate.pdf' },
          otherAttachment: { originalName: 'memo.pdf' },
          otherDocument: { originalName: 'memo.pdf' },
          billingAttachment: { originalName: 'billing.pdf' },
          billingDocument: { originalName: 'billing.pdf' },
        },
      ],
      team2: [
        {
          team: 'team2',
          startDate: '2026-04-02',
          endDate: '2026-04-02',
          workContent: 'Beta task',
        },
      ],
    },
  };

  const { payload, changed, summary } = stripWorkHistoryAttachmentsFromPayload(sourcePayload);
  const record = payload.teams.team1part1[0];

  assert.equal(changed, true);
  assert.equal(summary.teamCount, 2);
  assert.equal(summary.recordCount, 2);
  assert.equal(summary.changedRecordCount, 1);
  assert.equal(summary.removedFieldCount, 10);
  assert.equal(record.workContent, 'Alpha task');
  assert.equal(record.cost, 1000);
  assert.equal(record.attachments, undefined);
  assert.equal(record.attachmentSlots, undefined);
  assert.equal(record.reportAttachment, undefined);
  assert.equal(sourcePayload.teams.team1part1[0].attachments.length, 1);
});

test('stripWorkHistoryAttachmentsFromPayload is stable when no attachment fields remain', () => {
  const sourcePayload = {
    teams: {
      team1part1: [
        {
          team: 'team1part1',
          startDate: '2026-04-01',
          endDate: '2026-04-01',
          workContent: 'Alpha task',
        },
      ],
    },
  };

  const { payload, changed, summary } = stripWorkHistoryAttachmentsFromPayload(sourcePayload);

  assert.equal(changed, false);
  assert.equal(summary.removedFieldCount, 0);
  assert.deepEqual(payload.teams.team1part1, sourcePayload.teams.team1part1);
});
