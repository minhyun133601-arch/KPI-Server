import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adapterSource,
  runtimeSource,
  createContext,
  createPopupWindowMock,
  flushMicrotasks,
  createReportDeckSharedStore,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck memo dialogs defer heavy work and cache repeated candidate results', () => {
  assert.match(runtimeSource, /function waitReportDeckUiFrame/);
  assert.match(runtimeSource, /await waitReportDeckUiFrame\(\);[\s\S]*buildReportDeckMemoOverview/);
  assert.match(runtimeSource, /await waitReportDeckUiFrame\(\);[\s\S]*buildReportDeckMemoCandidates/);
  assert.match(runtimeSource, /memoCandidateCache:\s*new Map\(\)/);
  assert.match(runtimeSource, /memoOverviewCache:\s*new Map\(\)/);
  assert.match(runtimeSource, /buildReportDeckMemoCandidateCacheKey/);
  assert.match(runtimeSource, /function startReportDeckMemoOverviewDrag/);
  assert.match(runtimeSource, /function startReportDeckMemoDialogDrag/);
  assert.match(runtimeSource, /data-report-memo-overview-drag-handle/);
  assert.match(runtimeSource, /data-report-memo-drag-handle/);
  assert.match(runtimeSource, /function setReportDeckMemoOverviewPosition/);
  assert.match(runtimeSource, /function setReportDeckMemoDialogPosition/);
  assert.match(runtimeSource, /function syncReportDeckMemoTeamOptions/);
  assert.match(runtimeSource, /reportMemoLineColors/);
  assert.match(runtimeSource, /reportMemoLineSizeRanges/);
  assert.match(runtimeSource, /reportMemoPreserveFormatting/);
  assert.match(runtimeSource, /function syncReportDeckMemoNotepadToState/);
  assert.match(runtimeSource, /function adjustReportDeckMemoNotepadFontSize/);
  assert.match(runtimeSource, /function setReportDeckMemoNotepadFontSize/);
  assert.match(runtimeSource, /function applyReportDeckMemoNotepadColor/);
  assert.match(runtimeSource, /function getReportDeckMemoLineSelectionFontSizeLevels/);
  assert.match(runtimeSource, /function insertReportDeckMemoCandidateAtNotepadCursor/);
  assert.match(runtimeSource, /function syncReportDeckMemoDialogPreview/);
  assert.match(runtimeSource, /function rememberReportDeckMemoNotepadSelection/);
  assert.match(runtimeSource, /data-report-memo-notepad/);
  assert.match(runtimeSource, /data-report-memo-notepad-font-size-delta/);
  assert.match(runtimeSource, /data-report-memo-notepad-font-size-input/);
  assert.doesNotMatch(runtimeSource, /data-report-memo-indent-break/);
  assert.doesNotMatch(runtimeSource, /data-report-memo-preserve-format/);
  assert.match(runtimeSource, /data-report-memo-preview/);
  assert.match(runtimeSource, /data-report-memo-notepad-color/);
  assert.match(runtimeSource, /data-report-memo-line-color/);
  assert.doesNotMatch(runtimeSource, /data-report-memo-line-color-value="clear"/);
  assert.match(runtimeSource, /is-preserve-format/);
  assert.doesNotMatch(runtimeSource, />&#8630;<\/button>/);
  assert.doesNotMatch(runtimeSource, />초기화<\/button>/);
  assert.match(runtimeSource, /function clearReportDeckMemoLineColorRange/);
  assert.match(runtimeSource, /function applyReportDeckMemoLineColor/);
  assert.match(runtimeSource, /function applyReportDeckMemoLineFontSizeRange/);
  assert.match(runtimeSource, /report-auto-memo-manual-size/);
  assert.match(runtimeSource, /REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS/);
  assert.match(adapterSource, /site_yusan:\s*Object\.freeze\(REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS\)/);
  assert.match(
    runtimeSource,
    /root\.addEventListener\?\.\('pointerdown'[\s\S]*startReportDeckMemoDialogDrag\(root, event\)[\s\S]*startReportDeckMemoOverviewDrag\(root, event\);/
  );
  assert.match(runtimeSource, /function openReportDeckMemoOverviewPopupOrDialog/);
  assert.match(runtimeSource, /ownerWindow\.open\(/);
  assert.match(runtimeSource, /void (?:parts\.)?openReportDeckMemoOverviewPopupOrDialog\(root, meta\);/);
  assert.match(runtimeSource, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(runtimeSource, /data-report-memo-overview-copy/);
  assert.match(runtimeSource, /data-report-memo-copy-text/);
  assert.match(
    runtimeSource,
    /report-memo-overview-row-label" title="\$\{(?:parts\.)?escapeReportDeckHtml\(metricLabel\)\}"/
  );
  assert.match(
    runtimeSource,
    /report-memo-overview-row-text" title="\$\{(?:parts\.)?escapeReportDeckHtml\(memoText\)\}"/
  );
  assert.match(runtimeSource, /function copyReportDeckMemoOverviewText/);
  assert.match(runtimeSource, /copyReportDeckTextToClipboard/);
  assert.doesNotMatch(runtimeSource, /report-memo-overview-row\.is-up\{/);
  assert.doesNotMatch(runtimeSource, /report-memo-overview-row\.is-down\{/);
  assert.match(runtimeSource, /report-auto-memo-change\.is-up\{color:#c00000;\}/);
  assert.match(runtimeSource, /report-auto-memo-change\.is-down\{color:#2f75b5;\}/);
  assert.match(adapterSource, /function getReportDeckMemoBuildCacheMap/);
  assert.match(adapterSource, /skipUtilityReady:\s*true/);
  assert.match(adapterSource, /'productionStats'/);
  assert.match(adapterSource, /'electricRows'/);
  assert.match(adapterSource, /'lineValueMaps'/);
  assert.match(adapterSource, /'wasteRows'/);
});

test('report deck memo input popup can be dragged by its header', () => {
  const deckDom = createReportDeckContainer({ withMemoOverviewWindow: true });
  const { registered } = createContext();
  let preventCount = 0;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.memoDialog.hidden = false;
  deckDom.listeners.pointerdown({
    target: deckDom.memoDialogDragHandle,
    button: 0,
    pointerId: 9,
    clientX: 700,
    clientY: 100,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoDialog.classList.contains('is-dragging'), true);
  assert.deepEqual(deckDom.memoDialogDragHandle.pointerCaptures, [9]);
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointermove, 'function');
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointerup, 'function');

  deckDom.memoOverviewWindowListeners.pointermove({
    clientX: 640,
    clientY: 130,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoDialog.style.left, '560px');
  assert.equal(deckDom.memoDialog.style.top, '84px');
  assert.equal(deckDom.memoDialog.style.right, 'auto');
  assert.equal(deckDom.memoDialog.dataset.reportMemoFloating, 'true');

  const pointerUp = deckDom.memoOverviewWindowListeners.pointerup;
  pointerUp({});

  assert.equal(deckDom.memoDialog.classList.contains('is-dragging'), false);
  assert.deepEqual(deckDom.memoDialogDragHandle.releasedPointerCaptures, [9]);
  assert.equal(deckDom.memoOverviewWindowListeners.pointermove, undefined);
  assert.equal(deckDom.memoOverviewWindowListeners.pointerup, undefined);
  assert.equal(preventCount, 2);
});

test('report deck memo overview popup can be dragged as a floating panel', () => {
  const deckDom = createReportDeckContainer({ withMemoOverviewWindow: true });
  const { registered } = createContext();
  let preventCount = 0;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.memoOverviewDialog.hidden = false;
  deckDom.listeners.pointerdown({
    target: deckDom.memoOverviewDragHandle,
    button: 0,
    pointerId: 7,
    clientX: 100,
    clientY: 80,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoOverviewDialog.classList.contains('is-dragging'), true);
  assert.deepEqual(deckDom.memoOverviewDragHandle.pointerCaptures, [7]);
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointermove, 'function');
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointerup, 'function');

  deckDom.memoOverviewWindowListeners.pointermove({
    clientX: 180,
    clientY: 140,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoOverviewDialog.style.left, '104px');
  assert.equal(deckDom.memoOverviewDialog.style.top, '124px');
  assert.equal(deckDom.memoOverviewDialog.style.right, 'auto');
  assert.equal(deckDom.memoOverviewDialog.dataset.reportMemoOverviewFloating, 'true');

  const pointerUp = deckDom.memoOverviewWindowListeners.pointerup;
  pointerUp({});

  assert.equal(deckDom.memoOverviewDialog.classList.contains('is-dragging'), false);
  assert.deepEqual(deckDom.memoOverviewDragHandle.releasedPointerCaptures, [7]);
  assert.equal(deckDom.memoOverviewWindowListeners.pointermove, undefined);
  assert.equal(deckDom.memoOverviewWindowListeners.pointerup, undefined);
  assert.equal(preventCount, 2);
});

test('report deck memo overview opens in a separate browser popup window', async () => {
  const popup = createPopupWindowMock();
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    openImpl: () => popup,
  });
  const overviewButton = {
    closest(selector) {
      return selector === '[data-report-memo-overview-toggle]' ? this : null;
    },
  };
  let prevented = false;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  deckDom.root.__reportDeckMeta.selectedMonth = '2025-12';
  deckDom.root.__reportDeckMeta.sharedStore = createReportDeckSharedStore();

  deckDom.listeners.click({
    target: overviewButton,
    preventDefault() {
      prevented = true;
    },
  });
  await flushMicrotasks();

  assert.equal(prevented, true);
  assert.equal(registered.openCalls.length, 1);
  assert.equal(registered.openCalls[0][1], 'kpi_report_memo_overview');
  assert.match(registered.openCalls[0][2], /width=920/);
  assert.equal(deckDom.memoOverviewDialog.hidden, true);
  assert.equal(popup.document.openCount >= 2, true);
  assert.equal(popup.document.closeCount, popup.document.openCount);
  assert.equal(popup.focusCount >= 2, true);
  assert.match(popup.document.writes[0], /report-memo-overview-empty/);
  assert.match(popup.document.html, /report-memo-overview-popup-head/);
  assert.match(popup.document.html, /data-report-memo-overview-list/);
  assert.match(popup.document.html, /report-memo-overview-row/);
  assert.match(popup.document.html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(
    popup.document.html,
    /report-memo-overview-row\{[^}]*grid-template-columns:minmax\(48px,max-content\) minmax\(0,1fr\) auto;[^}]*border:1px solid #e5e7eb;[^}]*background:#fbfdff;[^}]*font-size:5\.2px;[^}]*line-height:1\.08;/
  );
  assert.doesNotMatch(popup.document.html, /report-memo-overview-row\.is-up\{/);
  assert.doesNotMatch(popup.document.html, /report-memo-overview-row\.is-down\{/);
  assert.match(popup.document.html, /report-memo-overview-copy\{[^}]*height:14px;[^}]*font-size:5\.2px;/);
  assert.match(popup.document.html, /data-report-memo-overview-copy/);
  assert.match(popup.document.html, /data-report-memo-copy-state/);
  assert.match(popup.document.html, /report-auto-memo-change\.is-up\{color:#c00000;\}/);
  assert.match(popup.document.html, /report-auto-memo-change\.is-down\{color:#2f75b5;\}/);
});

test('report deck memo overview copy button writes one memo line to clipboard', async () => {
  const copiedTexts = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    clipboardWriteTextImpl: async (text) => {
      copiedTexts.push(text);
    },
  });
  const copyButton = {
    dataset: {
      reportMemoCopyText: '유산 생산량은 전월대비 10% 상승했습니다.',
    },
    textContent: '복사',
    closest(selector) {
      return selector === '[data-report-memo-overview-copy]' ? this : null;
    },
  };
  let prevented = false;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: copyButton,
    preventDefault() {
      prevented = true;
    },
  });
  await flushMicrotasks();

  assert.equal(prevented, true);
  assert.deepEqual(copiedTexts, ['유산 생산량은 전월대비 10% 상승했습니다.']);
  assert.equal(copyButton.textContent, '복사됨');
  assert.equal(copyButton.dataset.reportMemoCopyState, 'copied');
});
