import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContext,
  flushMicrotasks,
  getLatestReportMonthKey,
  getReportMonthNumber,
  createReportDeckSharedStore,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer, assertOptionalContentHidden } from './support/report-deck-dom-harness.js';

test('report deck output derives optional order and prints only filled plan cells', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide9SlotCount: '4',
                slide9Item4Team: '2팀',
                slide9Item4Title: '포장 라인 개선',
                slide9Item4Kind: 'purpose',
                slide9Item4Detail: '작업 안정화',
                slide9Item4Date: '2025-12-25',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
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

  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  assert.equal(
    slide9TitleField.textContent.startsWith(`3. ${getReportMonthNumber(getLatestReportMonthKey(), 1)}`),
    true
  );
  assert.equal(slide10TitleField.textContent, '4. 자율 안전 신고제');
  assert.equal(slide9SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.equal(slide10SectionField.textContent, 'Ⅳ. 공무환경팀');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);
  assert.equal(deckDom.planSlides[1].dataset.reportPlanFilledSlotCount, '1');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide9.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide9.2')?.dataset.reportPlanFilled,
    'false'
  );
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowFilledSlotCount, '1');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanFilled,
    'false'
  );

  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assert.equal(deckDom.slides[8].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, 'true');
  assert.equal(deckDom.slides[10].dataset.reportOutputPrepared, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, undefined);
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.saveMenuToggleButton,
    preventDefault() {},
  });
  assert.equal(deckDom.saveMenuPanel.hidden, false);

  deckDom.listeners.click({
    target: deckDom.exportButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });

  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);
});

test('report deck output titles and roman headers are corrected from printed optional pages', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide8Section: 'Ⅲ. 공무환경팀',
                slide8Title: '3. 잘못 저장된 정비 제목',
                slide8SlotCount: '1',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '보일러 배관 보수',
                slide8Item1Effect: '누수 예방',
                slide8Item1Date: '2025-12-20',
                slide9Section: 'Ⅳ. 공무환경팀',
                slide9Title: '4. 잘못 저장된 계획 제목',
                slide9SlotCount: '1',
                slide9Item1Team: '2팀',
                slide9Item1Title: '포장 라인 개선',
                slide9Item1Kind: 'purpose',
                slide9Item1Detail: '작업 안정화',
                slide9Item1Date: '2025-12',
                slide10Section: 'Ⅲ. 공무환경팀',
                slide10Title: '3. 자율 안전 신고제',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
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

  const slide8SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Section');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');

  slide8SectionField.textContent = 'Ⅲ. 공무환경팀';
  slide8TitleField.textContent = '3. 잘못 남은 공사 및 정비 현황';
  slide9SectionField.textContent = 'Ⅳ. 공무환경팀';
  slide9TitleField.textContent = '4. 잘못 남은 주요 계획';

  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });

  assert.equal(slide8TitleField.textContent.startsWith(`3. ${getReportMonthNumber(getLatestReportMonthKey())}`), true);
  assert.equal(
    slide9TitleField.textContent.startsWith(`4. ${getReportMonthNumber(getLatestReportMonthKey(), 1)}`),
    true
  );
  assert.equal(slide10TitleField.textContent, '5. 자율 안전 신고제');
  assert.equal(slide8SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.equal(slide9SectionField.textContent, 'Ⅳ. 공무환경팀');
  assert.equal(slide10SectionField.textContent, 'Ⅴ. 공무환경팀');
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
});

test('report deck optional header roman numerals follow the extracted section order', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide8Section: 'Ⅴ. 공무환경팀',
                slide8Title: '5. 잘못 저장된 정비 제목',
                slide8SlotCount: '1',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '보일러 배관 보수',
                slide8Item1Effect: '누수 예방',
                slide8Item1Date: '2025-12-20',
                slide9Section: 'Ⅴ. 공무환경팀',
                slide9Title: '5. 잘못 저장된 계획 제목',
                slide9SlotCount: '1',
                slide9Item1Team: '2팀',
                slide9Item1Title: '포장 라인 개선',
                slide9Item1Kind: 'purpose',
                slide9Item1Detail: '작업 안정화',
                slide9Item1Date: '2025-12-25',
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

  const slide8SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Section');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');

  assert.equal(slide8SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.match(slide8TitleField.textContent, /^3\. /);
  assert.equal(slide9SectionField.textContent, 'Ⅳ. 공무환경팀');
  assert.match(slide9TitleField.textContent, /^4\. /);
  assert.equal(slide10SectionField.textContent, 'Ⅴ. 공무환경팀');
  assert.match(slide10TitleField.textContent, /^5\. /);
});
