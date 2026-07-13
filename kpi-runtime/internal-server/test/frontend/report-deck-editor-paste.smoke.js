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

test('report deck editor accepts clipboard image paste into plan image slots', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
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
            document: { id: 'doc-paste-image-1' },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: {
              title: 'Clipboard image report',
              reportDate: '2025.12.15',
            },
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL(file) {
      this.result = `data:${file?.type || 'image/png'};base64,UEFTVEU=`;
      this.onload?.();
    }
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, false);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, false);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, false);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage1.textContent, '이미지 첨부 또는 붙여넣기');

  let clickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImages[0],
    preventDefault() {
      clickPrevented = true;
    },
  });
  assert.equal(clickPrevented, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 1);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.reportPlanPasteTarget, 'true');

  let pasteButtonPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImagePasteButtons[0],
    preventDefault() {
      pasteButtonPrevented = true;
    },
  });
  assert.equal(pasteButtonPrevented, true);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 2);
  assert.equal(deckDom.status.textContent, '붙여넣을 이미지 칸 선택됨');

  let pastePrevented = false;
  deckDom.listeners.paste({
    target: deckDom.planImages[0],
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'clipboard.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {
      pastePrevented = true;
    },
  });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(pastePrevented, true);
  const uploadCall = fetchCalls.find((call) => call.url === '/api/files/base64');
  assert.ok(uploadCall, 'clipboard image upload was not called');
  const uploadBody = JSON.parse(uploadCall.options.body);
  assert.equal(uploadBody.ownerDomain, 'report.runtime');
  assert.equal(uploadBody.ownerKey, getReportRecordKey(getLatestReportMonthKey()));
  assert.equal(uploadBody.originalName, 'clipboard.png');
  assert.equal(uploadBody.mimeType, 'image/png');
  assert.equal(uploadBody.base64Data, 'UEFTVEU=');
  assert.equal(uploadBody.metadata.fieldKey, 'slide8BeforeImage1');
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-paste-image-1/view');
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'true');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);

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
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);

  let disabledPasteButtonPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImagePasteButtons[0],
    preventDefault() {
      disabledPasteButtonPrevented = true;
    },
  });
  assert.equal(disabledPasteButtonPrevented, true);
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 3);

  let uploadClickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImages[0],
    preventDefault() {
      uploadClickPrevented = true;
    },
  });
  assert.equal(uploadClickPrevented, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 3);

  let replacePastePrevented = false;
  deckDom.listeners.paste({
    target: deckDom.planImages[0],
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'replacement.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {
      replacePastePrevented = true;
    },
  });
  await flushMicrotasks();
  await flushMicrotasks();
  assert.equal(replacePastePrevented, true);
  assert.equal(fetchCalls.filter((call) => call.url === '/api/files/base64').length, 1);
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-paste-image-1/view');

  let clearPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImageClearButtons[0],
    preventDefault() {
      clearPrevented = true;
    },
  });
  assert.equal(clearPrevented, true);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'false');
  assert.equal(deckDom.planImageInputs[0].disabled, false);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, false);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, false);
  assert.equal(deckDom.status.textContent, '저장 필요');

  let attachClickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImageUploadButtons[0],
    preventDefault() {
      attachClickPrevented = true;
    },
  });
  assert.equal(attachClickPrevented, false);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);

  deckDom.planImageInputs[0].files = [{ name: 'manual-upload.png', type: 'image/png' }];
  deckDom.listeners.change({
    target: deckDom.planImageInputs[0],
  });
  await flushMicrotasks();
  await flushMicrotasks();

  const uploadCalls = fetchCalls.filter((call) => call.url === '/api/files/base64');
  assert.equal(uploadCalls.length, 2);
  const finalUploadBody = JSON.parse(uploadCalls.at(-1).options.body);
  assert.equal(finalUploadBody.originalName, 'manual-upload.png');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);
  assert.equal(deckDom.status.textContent, '저장 필요');
});

test('report deck safety image paste stays in the selected slide10 team row slot', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
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
            document: { id: 'doc-slide10-paste' },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: options?.body
              ? JSON.parse(options.body).payload
              : {
                  title: 'Safety image report',
                  reportDate: '2025.12.15',
                },
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL(file) {
      this.result = `data:${file?.type || 'image/png'};base64,U0FGRVRZ=`;
      this.onload?.();
    }
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });

  const targetKey = 'slide10BeforeImage13';
  const targetImage = deckDom.planImages.find((image) => image.dataset.reportPlanImage === targetKey);
  const targetPasteButton = deckDom.planImagePasteButtons.find(
    (button) => button.dataset.reportPlanImagePaste === targetKey
  );
  assert.ok(targetImage, 'slide10 3-team image slot is missing from the test DOM');
  assert.ok(targetPasteButton, 'slide10 3-team paste button is missing from the test DOM');
  assert.equal(targetPasteButton.disabled, false);

  deckDom.listeners.click({
    target: targetPasteButton,
    preventDefault() {},
  });
  deckDom.listeners.paste({
    target: targetImage,
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'slide10-team3.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {},
  });
  await flushMicrotasks();
  await flushMicrotasks();

  const uploadCall = fetchCalls.find((call) => call.url === '/api/files/base64');
  assert.ok(uploadCall, 'slide10 clipboard image upload was not called');
  const uploadBody = JSON.parse(uploadCall.options.body);
  assert.equal(uploadBody.metadata.fieldKey, targetKey);
  assert.equal(targetImage.src, '/api/files/doc-slide10-paste/view');

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
  assert.equal(savedPayload.slide10BeforeImage1, '');
  assert.equal(savedPayload.slide10Item1Team, '');
  assert.equal(savedPayload.slide10BeforeImage13, '/api/files/doc-slide10-paste/view');
  assert.equal(savedPayload.slide10Item13Team, '3팀');
  assert.equal(savedPayload.slide10SlotCount, '13');
});
