import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, flushMicrotasks, createReportDeckSharedStore } from './support/util-runtime-source-harness.js';
import { createReportDeckContainer, assertOptionalContentHidden } from './support/report-deck-dom-harness.js';

test('report deck safety page stays visible but blank output omits it and saves slide10 data', async () => {
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
              payload: { reportDate: '2025.12.15' },
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

  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', true);
  assertOptionalContentHidden(deckDom, 'slide10', true);
  assert.equal(deckDom.slides[10].hidden, false);
  assert.equal(deckDom.root.dataset.reportSlide10Enabled, 'true');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.addPageButton.disabled, true);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].hidden, false);
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintPageText, undefined);
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'false');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', true);
  assertOptionalContentHidden(deckDom, 'slide10', true);
  assert.equal(deckDom.slides[7].dataset.reportPrintLast, 'true');
  deckDom.listeners.click({
    target: deckDom.productionContentsJumpButton,
    preventDefault() {},
  });
  const slide10SafetySummaryCell = {
    dataset: { reportPlanSourceSlot: '5', reportPlanLocalSlot: '5' },
    closest(selector) {
      return selector === '.report-safety-summary-cell' ? this : null;
    },
  };
  deckDom.listeners.click({
    target: slide10SafetySummaryCell,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '5');
  assert.equal(deckDom.overviewDialogFields.team.value, '1팀 2파트');
  assert.equal(deckDom.overviewTeamRow.hidden, false);
  assert.equal(deckDom.overviewDialogFields.title.focusCount, 1);
  assert.equal(deckDom.overviewDialogFields.date.focusCount, 0);
  deckDom.listeners.click({
    target: deckDom.overviewCancelButton,
    preventDefault() {},
  });
  const slide10SummaryField = {
    dataset: { reportPlanSummary: 'slide10', reportPlanSourceSlot: '1' },
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
    target: slide10SummaryField,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'public-works');
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewTeamRow.hidden, false);
  assert.equal(deckDom.overviewDialogFields.title.focusCount, 2);

  const firstTeamLabel = deckDom.safetyTeamOptionButtons[0].textContent;
  const regularTeamLabel = deckDom.safetyTeamOptionButtons[1].textContent;
  const otherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  deckDom.overviewDialogFields.team.value = otherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = firstTeamLabel;
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.customTeam.customValidity, '기존 팀명은 해당 팀을 선택해 주세요.');
  assert.equal(deckDom.overviewDialogFields.customTeam.reportValidityCount, 1);
  assert.equal(deckDom.overviewDialogFields.customTeam.focusCount, 1);

  deckDom.overviewDialogFields.customTeam.value = '협력업체';
  deckDom.overviewDialogFields.title.value = '배관 주변 정리';
  deckDom.overviewDialogFields.effect.value = '통행 위험 제거';
  deckDom.overviewDialogFields.hazard.value = '온습도 조절 불량';
  deckDom.overviewDialogFields.date.value = '2025-12-27';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planRowLabels[0].textContent, '협력업체');
  assert.equal(deckDom.planRowLabels[0].dataset.reportPlanRowFilled, 'true');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowFilled, 'true');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanFilled,
    'false'
  );
  deckDom.listeners.click({
    target: slide10SummaryField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialogFields.team.value, otherTeamLabel);
  assert.equal(deckDom.overviewDialogFields.customTeam.value, '협력업체');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.team.value = regularTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
  assert.equal(deckDom.overviewDialogFields.customTeam.value, '');
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planRowLabels[0].textContent, regularTeamLabel);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[10].dataset.reportPrintPageText, '7/7');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide10', false);

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
  assert.equal(savedPayload.slide10Enabled, 'true');
  assert.equal(savedPayload.slide10SlotCount, '1');
  assert.equal(savedPayload.slide10Item1Team, regularTeamLabel);
  assert.equal(savedPayload.slide10Item1Title, '배관 주변 정리');
  assert.equal(savedPayload.slide10Item1Effect, '온습도 조절 불량');
  assert.equal(savedPayload.slide10Item1Date, '2025-12-27');
  assert.equal(savedPayload.slide10Item1AmountText, '');
  assert.equal(savedPayload.slide10Item1Text, '배관 주변 정리\n12.27 完, 온습도 조절 불량 예방');
  assert.equal(savedPayload.slide10BeforeImage16, '');
  assert.equal(savedPayload.slide10AfterImage16, '');
});

test('report deck safety custom cost text follows amount when both are entered', async () => {
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

  const slide10SummaryField = {
    dataset: { reportPlanSummary: 'slide10', reportPlanSourceSlot: '1' },
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
    target: slide10SummaryField,
    preventDefault() {},
  });

  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialogFields.amountText.disabled, false);
  deckDom.overviewDialogFields.amount.value = '2';
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.amount });
  assert.equal(deckDom.overviewDialogFields.amountText.disabled, false);
  deckDom.overviewDialogFields.amountText.value = '자체 처리';
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.amountText });
  assert.equal(deckDom.overviewDialogFields.amount.disabled, false);
  assert.equal(deckDom.overviewDialogFields.amount.value, '2');

  deckDom.overviewDialogFields.title.value = '배관 주변 정리';
  deckDom.overviewDialogFields.hazard.value = '넘어짐';
  deckDom.overviewDialogFields.date.value = '2025-12-28';
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

  const savedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(savedPayload.slide10Item1Amount, '2');
  assert.equal(savedPayload.slide10Item1AmountText, '자체 처리');
  assert.equal(savedPayload.slide10Item1Text, '배관 주변 정리\n12.28 完, 2 백만원 소요, 자체 처리, 넘어짐 예방');
});

test('report deck safety deleted slot can be restored from the report payload', async () => {
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
                slide10Enabled: 'true',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
                slide10BeforeImage1: '/files/before.png',
                slide10AfterImage1: '/files/after.png',
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
  const slide10DeleteButton = deckDom.planDeleteButtons.find(
    (button) => button.dataset.reportPlanDeleteSlot === 'slide10' && button.dataset.reportPlanLocalSlot === '1'
  );
  assert.equal(slide10DeleteButton?.dataset.reportPlanSourceSlot, '1');

  deckDom.listeners.click({
    target: slide10DeleteButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, false);
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'false'
  );

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

  const deletedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  const deletedBackups = JSON.parse(deletedPayload.slide10DeletedSlotBackups);
  assert.equal(deletedPayload.slide10SlotCount, '0');
  assert.equal(deletedPayload.slide10Item1Team, '');
  assert.equal(deletedBackups.length, 1);
  assert.equal(deletedBackups[0].slotIndex, 1);
  assert.equal(deletedBackups[0].entry.team, '1팀 1파트');
  assert.equal(deletedBackups[0].entry.effect, '미끄럼');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, false);

  deckDom.listeners.click({
    target: deckDom.undoDeleteButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, true);
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );

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

  const restoredPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(restoredPayload.slide10SlotCount, '1');
  assert.equal(restoredPayload.slide10DeletedSlotBackups, '');
  assert.equal(restoredPayload.slide10Item1Team, '1팀 1파트');
  assert.equal(restoredPayload.slide10Item1Effect, '미끄럼');
  assert.equal(restoredPayload.slide10Item1Date, '2025-12-27');
  assert.equal(restoredPayload.slide10BeforeImage1, '/files/before.png');
  assert.equal(restoredPayload.slide10AfterImage1, '/files/after.png');
});
