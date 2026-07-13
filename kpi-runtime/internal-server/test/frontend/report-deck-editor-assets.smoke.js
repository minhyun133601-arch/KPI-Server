import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContext,
  flushMicrotasks,
  getLatestReportMonthKey,
  getReportRecordKey,
  createReportDeckSharedStore,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck overview blank amount renders self handled text', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
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
      if (options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                reportDate: '2026.05.15',
              },
              version: 1,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: JSON.parse(options.body).payload,
            version: 2,
            updated_at: '2026-05-15T00:01:00.000Z',
          },
        }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });

  const slide8OverviewField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  deckDom.listeners.click({
    target: slide8OverviewField,
    preventDefault() {},
  });
  deckDom.overviewDialogFields.team.value = '공무환경팀';
  deckDom.overviewDialogFields.title.value = '보일러 배관 보수';
  deckDom.overviewDialogFields.effect.value = '누수 예방';
  deckDom.overviewDialogFields.date.value = '2026-05-20';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(
    slide8OverviewField.textContent,
    '공무환경팀\n보일러 배관 보수\n▶ 효과 : 누수 예방\n▶ 완료 날짜 : 05.20 完\n▶ 금액 : 자체 처리'
  );

  const slide9SummaryField = {
    dataset: { reportPlanSummary: 'slide9', reportPlanSourceSlot: '1' },
    textContent: '',
    closest(selector) {
      return selector === '[data-report-plan-summary]' ? this : null;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    blur() {},
  };
  deckDom.listeners.click({
    target: slide9SummaryField,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.overviewKindButtons[1],
    preventDefault() {},
  });
  deckDom.overviewDialogFields.team.value = '1팀 2파트';
  deckDom.overviewDialogFields.title.value = '압축공기 라인 개선';
  deckDom.overviewDialogFields.detail.value = '작업 안정화';
  deckDom.overviewDialogFields.date.value = '2026-06';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  await flushMicrotasks();

  const savedPayload = JSON.parse(fetchCalls[2].options.body).payload;
  assert.equal(savedPayload.slide8Item1Amount, '');
  assert.equal(
    savedPayload.slide8Item1Text,
    '공무환경팀\n보일러 배관 보수\n▶ 효과 : 누수 예방\n▶ 완료 날짜 : 05.20 完\n▶ 금액 : 자체 처리'
  );
  assert.equal(savedPayload.slide9Item1Amount, '');
  assert.equal(savedPayload.slide9Item1Date, '2026-06');
  assert.equal(
    savedPayload.slide9Item1Text,
    '1팀 2파트\n압축공기 라인 개선\n▶ 목적 : 작업 안정화\n▶ 예상 날짜 : 26.06월 中\n▶ 예상 금액 : 자체 처리'
  );

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.planAddSlotButtons[0],
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
});

test('report deck editor externalizes inline image data before saving records', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
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
      if (url === '/api/files/base64') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            ok: true,
            document: { id: 'doc-inline-image-1' },
          }),
        };
      }
      if (options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                title: 'Inline image report',
                reportDate: '2025.12.15',
                slide8BeforeImage1: 'data:image/png;base64,QUJD',
              },
              version: 1,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: JSON.parse(options.body).payload,
            version: 2,
            updated_at: '2026-05-15T00:01:00.000Z',
          },
        }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  departmentField.textContent = 'Saved with file image';
  deckDom.listeners.input({ target: departmentField });
  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  await flushMicrotasks();

  const uploadIndex = fetchCalls.findIndex((call) => call.url === '/api/files/base64');
  const saveIndex = fetchCalls.findIndex((call) => call.options?.method === 'PUT');
  assert.ok(uploadIndex > 0, 'inline image upload was not called');
  assert.ok(saveIndex > uploadIndex, 'record save must happen after image upload');
  const uploadBody = JSON.parse(fetchCalls[uploadIndex].options.body);
  assert.equal(uploadBody.ownerDomain, 'report.runtime');
  assert.equal(uploadBody.ownerKey, getReportRecordKey(getLatestReportMonthKey()));
  assert.equal(uploadBody.base64Data, 'QUJD');
  const savedBody = JSON.parse(fetchCalls[saveIndex].options.body);
  assert.equal(savedBody.payload.slide8BeforeImage1, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.status.textContent, '저장되었습니다');
});
