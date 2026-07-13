import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, flushMicrotasks, createReportDeckSharedStore } from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck editor sorts slide8 overview columns by team order', async () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    fetchImpl: async (url, options = {}) => {
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
                reportDate: '2025.12.15',
                slide8SlotCount: '2',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '공무 작업',
                slide8BeforeImage1: 'image-env-before',
                slide8AfterImage1: 'image-env-after',
                slide8Item2Team: '1팀 1파트',
                slide8Item2Title: '1파트 작업',
                slide8BeforeImage2: 'image-team-before',
                slide8AfterImage2: 'image-team-after',
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
        json: async () => ({ ok: true, record: { payload: JSON.parse(options.body).payload } }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  const firstOverview = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  const secondOverview = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item2Text');
  assert.equal(firstOverview.textContent, '1팀 1파트\n1파트 작업');
  assert.equal(secondOverview.textContent, '공무환경팀\n공무 작업');
  assert.equal(deckDom.planImages[0].src, 'image-team-before');
  assert.equal(deckDom.planImages[1].src, 'image-env-before');
  assert.equal(deckDom.planImages[4].src, 'image-team-after');
  assert.equal(deckDom.planImages[5].src, 'image-env-after');
});

test('report deck plan overviews sort by team date and amount', async () => {
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
                reportDate: '2025.12.15',
                slide8SlotCount: '7',
                slide8Item1Team: '1팀 1파트',
                slide8Item1Title: '늦은 정비',
                slide8Item1Date: '2025-12-20',
                slide8Item1Amount: '5',
                slide8Item2Team: '1팀 1파트',
                slide8Item2Title: '같은 날짜 고액 정비',
                slide8Item2Date: '2025-12-10',
                slide8Item2Amount: '7',
                slide8Item3Team: '1팀 1파트',
                slide8Item3Title: '같은 날짜 저액 정비',
                slide8Item3Date: '2025-12-10',
                slide8Item3Amount: '2',
                slide8Item4Team: '2팀',
                slide8Item4Title: '다른 팀 빠른 정비',
                slide8Item4Date: '2025-12-01',
                slide8Item4Amount: '1',
                slide8Item5Team: '기타',
                slide8Item5Title: '기타 정비',
                slide8Item5Date: '2025-11-01',
                slide8Item5Amount: '0',
                slide8Item6Team: '공무환경팀',
                slide8Item6Title: '공무 정비',
                slide8Item6Date: '2025-12-31',
                slide8Item6Amount: '9',
                slide8Item7Team: '물류센터',
                slide8Item7Title: '물류 정비',
                slide8Item7Date: '2025-10-01',
                slide8Item7Amount: '0',
                slide9SlotCount: '7',
                slide9Item1Team: '1팀 1파트',
                slide9Item1Title: '늦은 계획',
                slide9Item1Date: '2026-02',
                slide9Item1Amount: '5',
                slide9Item2Team: '1팀 1파트',
                slide9Item2Title: '같은 월 고액 계획',
                slide9Item2Date: '2026-01',
                slide9Item2Amount: '7',
                slide9Item3Team: '1팀 1파트',
                slide9Item3Title: '같은 월 저액 계획',
                slide9Item3Date: '2026-01',
                slide9Item3Amount: '2',
                slide9Item4Team: '2팀',
                slide9Item4Title: '다른 팀 빠른 계획',
                slide9Item4Date: '2025-12',
                slide9Item4Amount: '1',
                slide9Item5Team: '기타',
                slide9Item5Title: '기타 계획',
                slide9Item5Date: '2025-11',
                slide9Item5Amount: '0',
                slide9Item6Team: '공무환경팀',
                slide9Item6Title: '공무 계획',
                slide9Item6Date: '2026-03',
                slide9Item6Amount: '9',
                slide9Item7Team: '물류센터',
                slide9Item7Title: '물류 계획',
                slide9Item7Date: '2025-10',
                slide9Item7Amount: '0',
                slide10Enabled: 'true',
                slide10SlotCount: '4',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-20',
                slide10Item1Amount: '5',
                slide10Item2Team: '1팀 1파트',
                slide10Item2Effect: '넘어짐',
                slide10Item2Date: '2025-12-10',
                slide10Item2Amount: '7',
                slide10Item3Team: '1팀 1파트',
                slide10Item3Effect: '끼임',
                slide10Item3Date: '2025-12-10',
                slide10Item3Amount: '2',
                slide10Item4Team: '2팀',
                slide10Item4Effect: '충돌',
                slide10Item4Date: '2025-12-01',
                slide10Item4Amount: '1',
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
        json: async () => ({ ok: true, record: { payload: JSON.parse(options.body).payload } }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '3'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.3')?.dataset.reportPlanSourceSlot,
    '1'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '4'
  );

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  const preparedByField = deckDom.fields.find((field) => field.dataset.reportField === 'preparedBy');
  preparedByField.textContent = 'sort check';
  deckDom.listeners.input({ target: preparedByField });
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

  const saveCall = fetchCalls.filter((call) => call.options?.method === 'PUT').at(-1);
  assert.ok(saveCall, 'sorted report payload was not saved');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide8Item1Title, '같은 날짜 저액 정비');
  assert.equal(savedPayload.slide8Item2Title, '같은 날짜 고액 정비');
  assert.equal(savedPayload.slide8Item3Title, '늦은 정비');
  assert.equal(savedPayload.slide8Item4Title, '다른 팀 빠른 정비');
  assert.equal(savedPayload.slide8Item5Title, '공무 정비');
  assert.equal(savedPayload.slide8Item6Title, '물류 정비');
  assert.equal(savedPayload.slide8Item7Title, '기타 정비');
  assert.equal(savedPayload.slide9Item1Title, '같은 월 저액 계획');
  assert.equal(savedPayload.slide9Item2Title, '같은 월 고액 계획');
  assert.equal(savedPayload.slide9Item3Title, '늦은 계획');
  assert.equal(savedPayload.slide9Item4Title, '다른 팀 빠른 계획');
  assert.equal(savedPayload.slide9Item5Title, '공무 계획');
  assert.equal(savedPayload.slide9Item6Title, '물류 계획');
  assert.equal(savedPayload.slide9Item7Title, '기타 계획');
});

test('report deck plan slot add requires saved complete overview and delete removes a slot', async () => {
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
                reportDate: '2025.12.15',
                slide8SlotCount: '1',
                slide8Item1Team: '1팀 1파트',
                slide8Item1Title: '저장된 작업',
                slide8Item1Effect: '설비 안정',
                slide8Item1Date: '2025-12-10',
                slide8Item1Amount: '1.2',
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
        json: async () => ({ ok: true, record: { payload: JSON.parse(options.body).payload } }),
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
  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  departmentField.textContent = '저장 전 변경';
  deckDom.listeners.input({ target: departmentField });
  deckDom.listeners.click({
    target: deckDom.planAddSlotButtons[0],
    preventDefault() {},
  });
  assert.equal(deckDom.status.textContent, '저장 완료 후 칸을 추가해 주세요');
  assert.equal(deckDom.overviewDialog.hidden, true);

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
  assert.equal(deckDom.status.textContent, '저장되었습니다');

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
  assert.equal(deckDom.status.textContent, '저장 필요');

  deckDom.listeners.click({
    target: deckDom.planDeleteButtons[1],
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);
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
  const savedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(savedPayload.slide8SlotCount, '1');
  assert.equal(savedPayload.slide8Item1Title, '저장된 작업');
  assert.equal(savedPayload.slide8Item2Title, '');
});
