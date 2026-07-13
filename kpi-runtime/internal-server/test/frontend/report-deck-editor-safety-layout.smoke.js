import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, flushMicrotasks, createReportDeckSharedStore } from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck safety starts as a team list and adds slots per selected team row', async () => {
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

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowLabels[1].textContent, '1팀 2파트');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(deckDom.safetyTeamSelect.disabled, true);
  assert.equal(deckDom.safetyAddButton.disabled, true);
  assert.equal(deckDom.safetyTeamMenu.hidden, true);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamSelect.disabled, false);
  assert.equal(deckDom.safetyAddButton.disabled, false);
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  assert.equal(deckDom.safetyTeamOptionButtons.length, 7);
  assert.equal(deckDom.safetyTeamOptionButtons[4].textContent, '공무환경팀');
  assert.equal(deckDom.safetyTeamOptionButtons[5].textContent, '물류센터');
  assert.equal(deckDom.safetyTeamOptionButtons[6].textContent, '기타');
  assert.equal(deckDom.safetyTeamOptionButtons[1].disabled, false);
  assert.equal(deckDom.safetyTeamOptionButtons[0].focusCount, 1);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[1],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '1');
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewDialogFields.team.value, '1팀 2파트');

  deckDom.overviewDialogFields.hazard.value = '넘어짐';
  deckDom.overviewDialogFields.date.value = '2025-12-28';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 2파트');
  assert.equal(deckDom.planRowLabels[1].textContent, deckDom.safetyTeamOptionButtons[0].textContent);
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '1');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanActive,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanActive,
    'false'
  );

  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[3],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '3');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
  assert.equal(deckDom.overviewDialogFields.team.value, '3팀');

  deckDom.listeners.click({
    target: deckDom.overviewCancelButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[4],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '4');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
  assert.equal(deckDom.overviewDialogFields.team.value, '공무환경팀');
});

test('report deck safety groups each team and balances rows after four items', async () => {
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
                slide10SlotCount: '5',
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [`slide10Item${index + 1}Team`, '1팀 1파트'])
                ),
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [`slide10Item${index + 1}Effect`, '미끄럼'])
                ),
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [
                    `slide10Item${index + 1}Date`,
                    `2025-12-${String(index + 1).padStart(2, '0')}`,
                  ])
                ),
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

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowLabels[1].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '3');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '2');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '1'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.3')?.dataset.reportPlanSourceSlot,
    '3'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.4')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '4'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.6')?.dataset.reportPlanSourceSlot,
    '5'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.7')?.dataset.reportPlanActive,
    'false'
  );
});

test('report deck safety table arrows reorder within a row and move to the next row', async () => {
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
                slide10SlotCount: '2',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-01',
                slide10Item2Team: '1팀 1파트',
                slide10Item2Effect: '충돌',
                slide10Item2Date: '2025-12-02',
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

  const firstRightButton = deckDom.safetyTableMoveButtons.find(
    (button) => button.slotIndex === 1 && button.direction === 'right'
  );
  assert.equal(firstRightButton.disabled, false);
  deckDom.listeners.click({
    target: firstRightButton,
    preventDefault() {},
  });
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanSourceSlot,
    '1'
  );

  const secondDownButton = deckDom.safetyTableMoveButtons.find(
    (button) => button.slotIndex === 2 && button.direction === 'down'
  );
  assert.equal(secondDownButton.disabled, false);
  deckDom.listeners.click({
    target: secondDownButton,
    preventDefault() {},
  });
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '1'
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
  const savedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(savedPayload.slide10TableOrder, '[[2],[1]]');
});
