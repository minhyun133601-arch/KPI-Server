import assert from 'node:assert/strict';
import test from 'node:test';
import { createContext, flushMicrotasks, createReportDeckSharedStore } from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck memo dialog edits notepad text and applies selected range formatting', async () => {
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
                slide3GasMemo: '전월대비 10, 5% ↑ 검정',
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
  const normalMemoRow = deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-memo-row');

  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });

  assert.equal(deckDom.memoDialog.hidden, false);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="site_yusan"/);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="site_total"/);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="other"/);
  assert.match(deckDom.memoNotepad.value, /10, 5%/);
  assert.match(deckDom.memoPreview.innerHTML, /report-auto-memo-change is-up/);
  assert.equal(deckDom.memoNotepadFontSizeInput.disabled, true);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '3');
  assert.match(deckDom.memoContents[0].innerHTML, /report-auto-memo-delta">/);
  assert.match(deckDom.memoContents[0].innerHTML, /<span class="report-auto-memo-change is-up"> 10, 5% ↑<\/span> 검정/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delta is-up/);

  deckDom.memoNotepad.value = 'Edited memo';
  deckDom.memoNotepad.selectionStart = deckDom.memoNotepad.value.length;
  deckDom.memoNotepad.selectionEnd = deckDom.memoNotepad.value.length;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Edited memo/);

  deckDom.memoNotepad.value = 'Edited memo\nManual memo\nSecond manual memo';
  deckDom.memoNotepad.selectionStart = deckDom.memoNotepad.value.length;
  deckDom.memoNotepad.selectionEnd = deckDom.memoNotepad.value.length;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Manual memo/);
  assert.match(deckDom.memoContents[0].innerHTML, /Second manual memo/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delete/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /data-report-memo-delete-line/);

  const memoCandidateButton = {
    dataset: { reportMemoCandidate: '0' },
    closest(selector) {
      return selector === '[data-report-memo-candidate]' ? this : null;
    },
  };
  deckDom.memoDialog.__reportMemoCandidates = [{ text: 'Candidate memo', direction: 'up' }];
  const secondManualStart = deckDom.memoNotepad.value.indexOf('Second manual memo');
  deckDom.memoNotepad.selectionStart = secondManualStart;
  deckDom.memoNotepad.selectionEnd = secondManualStart;
  deckDom.listeners.click({
    target: memoCandidateButton,
    preventDefault() {},
  });
  assert.equal(deckDom.memoNotepad.value, 'Edited memo\nManual memo\nCandidate memo\nSecond manual memo');
  assert.match(deckDom.memoContents[0].innerHTML, /Candidate memo/);

  const revisedMemoText = 'Edited memo\nManual memo revised\nrow detail\nCandidate memo\nSecond manual memo';
  deckDom.memoNotepad.value = revisedMemoText;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Manual memo revised[\s\S]*row detail/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delete/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /data-report-memo-delete-line/);
  const selectedMemoStart = revisedMemoText.indexOf('Manual memo revised') + 'Manual '.length;
  const selectedMemoEnd = selectedMemoStart + 'memo'.length;
  deckDom.memoNotepad.selectionStart = selectedMemoStart;
  deckDom.memoNotepad.selectionEnd = selectedMemoEnd;
  deckDom.listeners.select({ target: deckDom.memoNotepad });
  assert.equal(deckDom.memoNotepadFontSizeInput.disabled, false);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '3');
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  assert.match(
    deckDom.memoPreview.innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorClearButton,
    preventDefault() {},
  });
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-manual-color/);
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  deckDom.memoNotepadFontSizeButton.dataset.reportMemoNotepadFontSizeDelta = '1';
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-size" style="font-size:11\.6px;line-height:1;"><span class="report-auto-memo-manual-color is-red">memo<\/span><\/span> revised/
  );
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '4');
  assert.match(
    deckDom.memoPreview.innerHTML,
    /Manual <span class="report-auto-memo-manual-size" style="font-size:11\.6px;line-height:1;"><span class="report-auto-memo-manual-color is-red">memo<\/span><\/span> revised/
  );
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:12\.8px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '5');
  deckDom.memoNotepadFontSizeButton.dataset.reportMemoNotepadFontSizeDelta = '-1';
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:11\.6px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '4');
  deckDom.memoNotepadFontSizeInput.value = '6';
  deckDom.listeners.change({ type: 'change', target: deckDom.memoNotepadFontSizeInput });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:14px;line-height:1;"/);
  assert.match(deckDom.memoPreview.innerHTML, /style="font-size:14px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '6');
  deckDom.memoNotepad.selectionStart = revisedMemoText.indexOf('Manual memo revised');
  deckDom.memoNotepad.selectionEnd = selectedMemoEnd;
  deckDom.listeners.select({ target: deckDom.memoNotepad });
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '?');
  assert.ok(deckDom.memoNotepad.focusCount >= 6);
  let memoLineSpacePropagationStopped = false;
  deckDom.listeners.keydown({
    key: ' ',
    code: 'Space',
    target: deckDom.memoNotepad,
    preventDefault() {
      assert.fail('space in a memo notepad should remain textarea input');
    },
    stopPropagation() {
      memoLineSpacePropagationStopped = true;
    },
  });
  assert.equal(memoLineSpacePropagationStopped, true);
  let memoLineEnterPropagationStopped = false;
  deckDom.listeners.keydown({
    key: 'Enter',
    code: 'Enter',
    target: deckDom.memoNotepad,
    preventDefault() {
      assert.fail('enter in a memo notepad should remain textarea line break');
    },
    stopPropagation() {
      memoLineEnterPropagationStopped = true;
    },
  });
  assert.equal(memoLineEnterPropagationStopped, true);

  const deletedMemoText = 'Edited memo\nManual memo revised\nrow detail\nSecond manual memo';
  deckDom.memoNotepad.value = deletedMemoText;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /Candidate memo/);
  assert.equal(deckDom.memoNotepad.value, deletedMemoText);

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
  assert.ok(saveCall, 'report memo save request was not sent');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide3GasMemo, 'Edited memo\nManual memo revised\nrow detail\nSecond manual memo');
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineSizes), {});
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineSizeRanges), {
    slide3GasMemo: [[], [{ start: 7, end: 11, size: 3 }], [], []],
  });
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineColors), {
    slide3GasMemo: [[], [{ start: 7, end: 11, color: 'red' }], [], []],
  });
  assert.notEqual(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-memo-row'), normalMemoRow);
  assert.match(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-table-row'), /%$/);
  assert.match(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-chart-row'), /%$/);
  assert.match(deckDom.analysisColumns[5].style.getPropertyValue('--report-analysis-memo-row'), /%$/);
  assert.match(deckDom.wasteLayouts[0].style.getPropertyValue('--report-waste-main-row'), /%$/);
  assert.match(deckDom.wasteLayouts[1].style.getPropertyValue('--report-waste-memo-row'), /%$/);
});

test('report deck completion saves pending memo notepad input to server', async () => {
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
                slide3GasMemo: '',
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
  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });

  deckDom.memoNotepad.value = '북정 가스 직접 입력\n북정 전기 직접 입력';
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  const saveCall = fetchCalls.filter((call) => call.options?.method === 'PUT').at(-1);
  assert.ok(saveCall, 'pending manual memo was not saved');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide3GasMemo, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(deckDom.memoNotepad.value, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(deckDom.memoDialog.hidden, true);
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다']);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });
  deckDom.memoNotepad.value = '북정 가스 직접 입력\n북정 전기 직접 입력';
  const putCountBeforeDuplicatePending = fetchCalls.filter((call) => call.options?.method === 'PUT').length;
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(deckDom.memoNotepad.value, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(fetchCalls.filter((call) => call.options?.method === 'PUT').length, putCountBeforeDuplicatePending);
});
