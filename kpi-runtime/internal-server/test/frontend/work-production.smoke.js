import assert from 'node:assert/strict';
import test from 'node:test';

import { createContext, overrideBinding } from './support/work-production-harness.js';

test('work production split files expose utility, history, and draft helpers together', () => {
  const context = createContext();
  const summary = context.getWorkTeamCalendarUtilitySummary('work_team_calendar_overview', '2026-04');
  const historySummary = context
    .getWorkTeamCalendarHistorySummaryMap('work_team_calendar_overview', ['2026-04-15'])
    .get('2026-04-15');
  const historyHtml = context.renderWorkTeamCalendarGroupedHistoryHtml('work_team_calendar_overview', [
    '2026-04-15',
  ]);
  const productionGroups = context.getWorkTeamCalendarProductionGroups('work_team_calendar_team1_part1', [
    '2026-04-15',
    '2026-04-16',
  ]);
  const productionHtml = context.renderWorkTeamCalendarProductionGroupsHtml(
    productionGroups,
    context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1')
  );
  const overviewProductionHtml = context.renderWorkTeamCalendarProductionTeamGroupsHtml(
    'work_team_calendar_team1_part1',
    ['2026-04-15'],
    context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1')
  );

  assert.equal(typeof context.getWorkTeamCalendarUtilitySummary, 'function');
  assert.equal(typeof context.renderWorkTeamCalendarGroupedHistoryHtml, 'function');
  assert.equal(typeof context.getWorkTeamCalendarDraftForDates, 'function');
  assert.equal(summary.electric.usageText, '120 kWh');
  assert.equal(summary.production.totalAmountText, '350kg');
  assert.equal(productionGroups[0].items[0].productCode, 'A-001');
  assert.equal(productionGroups[0].items[0].regularWorkers, 2.5);
  assert.equal(productionGroups[0].items[0].contractWorkers, 0.5);
  assert.equal(productionGroups[0].items[0].materialStandard, 190);
  assert.equal(productionGroups[0].items[0].materialActual, 200);
  assert.equal(productionGroups[0].items[0].totalWorkTime, 9);
  assert.equal(productionGroups[0].items[0].stickEa, 1200);
  assert.equal(productionGroups[0].items[0].laborProductivityEa, 24);
  assert.equal(productionGroups[1].items[0].productionKind, 'rework');
  assert.equal(productionGroups[0].totalWorkTime, 8.5);
  assert.equal(productionGroups[0].totalOperationTime, 7.25);
  assert.match(productionHtml, /Work 8\.5/);
  assert.match(productionHtml, /Run 7\.3/);
  assert.match(productionHtml, /Total 9\.0/);
  assert.match(productionHtml, /Workers 3\.0/);
  assert.match(productionHtml, /EA 1,200/);
  assert.match(productionHtml, /EA\/P 24\.0/);
  assert.match(productionHtml, /코드 A-001/);
  assert.match(productionHtml, /\uC7AC\uAC00\uACF5\uD488/);
  assert.match(overviewProductionHtml, /Work 8\.5/);
  assert.match(overviewProductionHtml, /Run 7\.3/);
  assert.match(overviewProductionHtml, /Total 9\.0/);
  assert.match(summary.workEntryCountText, /^1건/);
  assert.equal(summary.workCostText, '10만원');
  assert.equal(historySummary.starCount, 1);
  assert.equal(historySummary.items[0].star, 'KPI');
  assert.equal(historySummary.items[0].subcategory, 'Inspection');
  assert.equal(historySummary.items[0].title, 'Boiler check');
  assert.match(historyHtml, /Boiler check/);
  assert.match(historyHtml, /10만원/);
  assert.match(historyHtml, /work-team-calendar-work-pill is-kpi/);
  assert.match(historyHtml, /work-team-calendar-team-group/);

  const actionHtml = context.renderWorkProductionActionMenuHtml({ summary: true });
  assert.match(actionHtml, /data-work-production-action="paste"/);
  assert.match(actionHtml, /data-work-production-kind="normal"/);
  assert.match(actionHtml, /data-work-production-kind="rework"/);
  assert.match(actionHtml, /openWorkProductionPasteModal\(event, 'normal'\)[^>]*>정상</);
  assert.match(actionHtml, /openWorkProductionPasteModal\(event, 'rework'\)[^>]*>재가공품</);
  assert.match(actionHtml, /data-work-production-action="delete"/);
  assert.doesNotMatch(actionHtml, /data-work-production-action="entry"/);
  assert.doesNotMatch(actionHtml, /openWorkProductionEntryModal/);
  assert.doesNotMatch(actionHtml, /정상 기입|정상 붙여넣기|재가공품 기입|재가공품 붙여넣기/);
  assert.doesNotMatch(actionHtml, /data-work-production-action="export"/);

  const alerts = [];
  let deleteOptions = null;
  let modifiedLabel = '';
  let renderCount = 0;
  context.alert = (message) => alerts.push(String(message || ''));
  context.openUtilSelectiveDeleteModal = (options) => {
    deleteOptions = options;
    options.onApplied?.({ removedProductionCount: 2 });
  };
  overrideBinding(context, 'setLastModified', (label) => {
    modifiedLabel = String(label || '');
  });
  overrideBinding(context, 'renderWorkTeamCalendarModal', () => {
    renderCount += 1;
  });

  assert.equal(context.openWorkProductionDeleteModal({
    stopPropagation() {},
    preventDefault() {},
  }), true);
  assert.equal(deleteOptions.datasetKey, 'production');
  assert.equal(deleteOptions.teamName, context.getWorkTeamCalendarCategory('work_team_calendar_team1_part1').title);
  assert.equal(deleteOptions.fromYm, '2026-04');
  assert.equal(deleteOptions.toYm, '2026-04');
  assert.equal(modifiedLabel, '팀별내역서');
  assert.equal(renderCount, 1);
  assert.match(alerts.at(-1), /2/);
});

test('work production pasted entry keeps extractor parsing and merge payload shape', async () => {
  const context = createContext();
  const alerts = [];
  let mergeRows = null;
  let parseText = '';
  let parseOptions = null;
  context.alert = (message) => alerts.push(String(message || ''));
  context.XLSX = {};
  context.DEFAULT_UTIL_PRODUCTION_PERIOD = { startDay: 1 };
  context.UtilProductionState = { startDay: 1 };
  context.UTIL_PRODUCTION_DAILY_DATA = [];
  context.UTIL_PRODUCTION_ARCHIVE_META = [];
  context.UTIL_PRODUCTION_DAILY_STATE = { meta: {}, periodDefault: { startDay: 1 }, teams: [], archives: [] };
  context.KPIProductionExtractorImportParsing = {
    parsePastedTableText(parseContext, text, options) {
      assert.deepEqual(Array.from(parseContext.TARGET_COLS), ['A', 'B', 'C', 'D', 'E', 'F']);
      parseText = text;
      parseOptions = options;
      return {
        rows: [
          {
            fileName: options.fileName,
            values: ['2026-04-03', '2팀', 'S/D', 'P-002', 'Product B', '456'],
            productCode: 'P-002',
            moistureExcludedYield: '99.1%',
            workTime: '24',
            operationTime: '23',
            equipmentCapa: '51000',
            equipmentUtilization: '95%',
            regularWorkers: '7.5',
            contractWorkers: '1.5',
            materialStandard: '450',
            materialActual: '456',
            totalWorkTime: '25',
            stickEa: '2400',
            laborProductivityEa: '30',
            dateObj: new Date('2026-04-03T00:00:00Z'),
            teamKey: '2팀',
            lineKey: 'S/D',
            rowNumber: 4,
          },
        ],
      };
    },
    deduplicateRows(parseContext, rows) {
      return { rows, removedCount: 0 };
    },
  };
  let mergeOptions = null;
  context.mergeUtilProductionExtractorRows = (rows, options) => {
    mergeRows = rows;
    mergeOptions = options;
    return {
      addedCount: 1,
      skippedCount: 0,
      patchedCount: 0,
      replacedCount: 0,
      savePromise: Promise.resolve(true),
    };
  };
  context.persistUtilProductionDailyState = () => true;
  context.refreshUtilProductionDailyIndex = () => {};
  context.renderWorkTeamCalendarModal = () => {};
  context.setLastModified = () => {};

  assert.equal(
    await context.importWorkProductionPastedText('clipboard payload', {
      productionKind: 'normal',
    }),
    true
  );
  assert.equal(parseText, 'clipboard payload');
  assert.equal(parseOptions.referenceYear, 2026);
  assert.equal(parseOptions.cycleStartDay, 1);
  assert.equal(parseOptions.fileName, '정상 붙여넣기');
  assert.equal(mergeOptions.productionKind, 'normal');
  assert.deepEqual(JSON.parse(JSON.stringify(mergeRows)), [
    {
      date: '2026-04-03',
      team: '2팀',
      lineName: 'S/D',
      productionKind: 'normal',
      productCode: 'P-002',
      productName: 'Product B',
      amount: '456',
      moistureExcludedYield: '99.1%',
      workTime: '24',
      operationTime: '23',
      equipmentCapa: '51000',
      equipmentUtilization: '95%',
      regularWorkers: '7.5',
      contractWorkers: '1.5',
      materialStandard: '450',
      materialActual: '456',
      totalWorkTime: '25',
      stickEa: '2400',
      laborProductivityEa: '30',
      sourceFileName: '정상 붙여넣기',
      sourceFingerprint: '',
    },
  ]);
  assert.match(alerts.at(-1), /기입 완료/);
});

test('work production paste modal Ctrl+S submits the active modal', () => {
  const context = createContext();
  let defaultPrevented = false;
  let propagationStopped = false;
  let submittedModal = null;
  overrideBinding(context, 'submitWorkProductionPasteModal', (modal) => {
    submittedModal = modal;
    return Promise.resolve(true);
  });

  assert.equal(
    context.handleWorkProductionPasteKeydown({
      key: 's',
      ctrlKey: true,
      metaKey: false,
      preventDefault() {
        defaultPrevented = true;
      },
      stopPropagation() {
        propagationStopped = true;
      },
      currentTarget: {
        closest(selector) {
          assert.equal(selector, '#work-production-paste-modal');
          return { id: 'active-paste-modal' };
        },
      },
    }),
    true
  );
  assert.equal(defaultPrevented, true);
  assert.equal(propagationStopped, true);
  assert.equal(submittedModal.id, 'active-paste-modal');
});

test('work production paste modal stays open and clears text after successful import', async () => {
  const context = createContext();
  const control = { disabled: false };
  const textarea = {
    value: 'clipboard payload',
    disabled: false,
    focused: false,
    focus() {
      this.focused = true;
    },
  };
  const modal = {
    dataset: { productionKind: 'normal' },
    querySelector(selector) {
      return selector === '[data-work-production-paste-text]' ? textarea : null;
    },
    querySelectorAll(selector) {
      return selector === '[data-work-production-paste-control]' ? [control] : [];
    },
  };
  let importedText = '';
  let closed = false;

  context.document.getElementById = (id) => (id === 'work-production-paste-modal' ? modal : null);
  overrideBinding(context, 'importWorkProductionPastedText', async (text) => {
    importedText = text;
    return true;
  });
  overrideBinding(context, 'closeWorkProductionPasteModal', () => {
    closed = true;
    return true;
  });

  assert.equal(await context.submitWorkProductionPasteModal(modal), true);
  assert.equal(importedText, 'clipboard payload');
  assert.equal(textarea.value, '');
  assert.equal(textarea.disabled, false);
  assert.equal(control.disabled, false);
  assert.equal(textarea.focused, true);
  assert.equal(closed, false);
});

test('work production draft helpers update member and title state through the shared draft store', () => {
  const context = createContext();

  assert.equal(
    context.toggleWorkTeamCalendarMember('Alpha', {
      dataKey: 'work_team_calendar_team1_part1',
      dateKey: '2026-04-15',
      dateKeys: ['2026-04-15'],
    }),
    true
  );

  context.updateWorkTeamCalendarTitle('Shift note');
  const draft = context.getWorkTeamCalendarDraftForDates('work_team_calendar_team1_part1', ['2026-04-15']);

  assert.deepEqual(draft.members, ['Alpha']);
  assert.equal(draft.title, 'Shift note');
});
