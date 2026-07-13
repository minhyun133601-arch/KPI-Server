import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createContext,
  flushMicrotasks,
  getCurrentCalendarMonthKey,
  getLatestReportMonthKey,
  getReportRecordUrl,
  getReportMonthNumber,
  getReportDateForMonth,
  getReportDateInputForMonth,
  createReportDeckSharedStore,
} from './support/util-runtime-source-harness.js';
import { createReportDeckContainer } from './support/report-deck-dom-harness.js';

test('report deck editor loads and saves through server module records', async () => {
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
        const isNovember = String(url).endsWith('/report_2025_11');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                title: isNovember ? '11월 공유 보고서' : 'DB 공유 보고서',
                reportDate: isNovember ? '2025.11.15' : '2025.12.15',
                department: '생산본부 공무환경팀',
                preparedBy: '작성자',
                slide5Title: '1. 유산 (가스 비용) 분석',
                slide6Title: '2. 북정 (폐수 비용) 분석',
                slide7Title: '2. 유산 (폐수 비용) 분석',
                slide8SlotCount: '3',
                slide8Item1Text: 'DB plan text',
                slide8BeforeImage1: isNovember ? '' : 'data:image/png;base64,AAAA',
              },
              version: 7,
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
            version: 8,
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
  const titleField = deckDom.fields.find((field) => field.dataset.reportField === 'title');
  const dateField = deckDom.fields.find((field) => field.dataset.reportField === 'reportDate');
  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  const slide5TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide5Title');
  const slide6TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide6Title');
  const slide7TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide7Title');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const team1ContentsTitleField = deckDom.fields.find(
    (field) => field.dataset.reportField === 'productionTeam1ContentsTitle'
  );
  const team1ContentsItem1Field = deckDom.fields.find(
    (field) => field.dataset.reportField === 'productionTeam1ContentsItem1'
  );
  const team1ContentsItem1Ref = deckDom.fieldRefs.find(
    (field) => field.dataset.reportFieldRef === 'productionTeam1ContentsItem1'
  );
  const contentsItem4Field = deckDom.fields.find((field) => field.dataset.reportField === 'contentsItem4');
  const latestReportMonth = getLatestReportMonthKey();
  const latestReportRecordUrl = getReportRecordUrl(latestReportMonth);
  const latestReportMonthNumber = getReportMonthNumber(latestReportMonth);
  const nextReportMonthNumber = getReportMonthNumber(latestReportMonth, 1);
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(departmentField.textContent, '생산본부');
  assert.equal(slide5TitleField.textContent, '1. 유 산 (가스 비용) 분석');
  assert.equal(slide6TitleField.textContent, '2. 북 정 (폐수 비용) 분석');
  assert.equal(slide7TitleField.textContent, '2. 유 산 (폐수 비용) 분석');
  assert.equal(slide8TitleField.textContent.startsWith(`3. ${latestReportMonthNumber}`), true);
  assert.equal(slide9TitleField.textContent.startsWith(`4. ${nextReportMonthNumber}`), true);
  assert.equal(dateField.textContent, getReportDateForMonth(latestReportMonth));
  assert.equal(team1ContentsTitleField.textContent, 'Contents');
  assert.equal(team1ContentsItem1Field.textContent, '생산실적(생산량)');
  assert.equal(team1ContentsItem1Ref.textContent, '생산실적(생산량)');
  assert.equal(contentsItem4Field.textContent, '주요계획');
  assert.equal(
    deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text').textContent,
    'DB plan text'
  );
  assert.equal(deckDom.planImages[0].src, 'data:image/png;base64,AAAA');
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'true');
  assert.equal(deckDom.dateInput.value, getReportDateInputForMonth(latestReportMonth));
  assert.equal(deckDom.status.textContent, '');
  assert.equal(deckDom.monthSelect.value, latestReportMonth);
  assert.equal(deckDom.monthSelect.disabled, false);
  assert.equal(deckDom.monthSelect.innerHTML.includes(latestReportMonth), true);
  assert.equal(deckDom.monthSelect.innerHTML.includes(getCurrentCalendarMonthKey()), false);
  assert.equal(fetchCalls[0].url, '/api/shared-store');
  assert.equal(fetchCalls[1].url, latestReportRecordUrl);
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(deckDom.root.dataset.reportActiveView, 'hq');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 2');
  assert.equal(deckDom.reportReturnButton.hidden, true);
  assert.equal(deckDom.slides[0].classList.active, true);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(registered.printCount, 1);
  assert.equal(deckDom.root.dataset.reportPrintMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintView, 'all');
  assert.equal(deckDom.slides[0].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[2].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[8].dataset.reportPrintLast, 'true');
  deckDom.listeners.click({
    target: deckDom.productionContentsJumpButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'public-works');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 9');
  assert.equal(deckDom.reportReturnButton.hidden, false);
  assert.equal(deckDom.slides[2].classList.active, true);
  assert.equal(deckDom.slides[2].pageNumber.textContent, '1/9');
  assert.equal(deckDom.slides[9].pageNumber.textContent, '8/9');
  assert.equal(deckDom.slides[10].pageNumber.textContent, '9/9');
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(registered.printCount, 2);
  assert.equal(deckDom.root.dataset.reportPrintMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintView, 'public-works');
  assert.equal(deckDom.slides[0].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[2].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[8].dataset.reportPrintLast, 'true');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[1].disabled, true);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage2.textContent, '');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다']);
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[1].disabled, true);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage2.textContent, '');
  assert.equal(deckDom.editButton.textContent, '수정');

  titleField.textContent = '수정된 공유 보고서';
  deckDom.listeners.input({
    target: titleField,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(slide8TitleField.contenteditable, 'false');
  assert.equal(slide9TitleField.contenteditable, 'false');
  assert.equal(team1ContentsTitleField.contenteditable, 'true');
  assert.equal(team1ContentsItem1Field.contenteditable, 'true');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, false);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.editButton.textContent, '완료');

  titleField.textContent = '수정된 공유 보고서';
  deckDom.listeners.input({
    target: titleField,
  });
  await flushMicrotasks();

  assert.equal(fetchCalls.length, 2);
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(deckDom.status.textContent, '');

  slide8TitleField.textContent = '수정 불가 제목';
  deckDom.listeners.input({
    target: slide8TitleField,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);
  assert.equal(slide8TitleField.textContent.startsWith(`3. ${latestReportMonthNumber}`), true);
  assert.equal(deckDom.status.textContent, '');

  team1ContentsItem1Field.textContent = '생산량 실적';
  deckDom.listeners.input({
    target: team1ContentsItem1Field,
  });
  await flushMicrotasks();
  assert.equal(team1ContentsItem1Ref.textContent, '생산량 실적');
  assert.equal(deckDom.status.textContent, '저장 필요');

  deckDom.dateInput.value = '2025-12-16';
  deckDom.listeners.change({
    target: deckDom.dateInput,
  });
  await flushMicrotasks();
  assert.equal(dateField.textContent, getReportDateForMonth(latestReportMonth, 16));
  assert.equal(fetchCalls.length, 2);

  const slide8OverviewField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  deckDom.listeners.click({
    target: slide8OverviewField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
  deckDom.overviewDialogFields.team.value = '공무환경팀';
  deckDom.overviewDialogFields.title.value = '환경 설비 보수';
  deckDom.overviewDialogFields.effect.value = '점검 시간 단축';
  deckDom.overviewDialogFields.date.value = '2025-12-20';
  deckDom.overviewDialogFields.amount.value = 'abc';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.amount.customValidity, '백만원 단위 숫자만 입력해 주세요.');
  assert.equal(deckDom.overviewDialogFields.amount.reportValidityCount, 1);
  assert.equal(deckDom.overviewDialogFields.amount.focusCount, 1);
  assert.equal(deckDom.status.textContent, '금액은 숫자만 입력해 주세요');
  const slide8KnownTeamLabel = deckDom.safetyTeamOptionButtons[0].textContent;
  const slide8OtherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  const slide8CustomTeam = '협력공사';
  deckDom.overviewDialogFields.team.value = slide8OtherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = slide8KnownTeamLabel;
  deckDom.overviewDialogFields.amount.value = '5.5';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.customTeam.customValidity, '기존 팀명은 해당 팀을 선택해 주세요.');
  deckDom.overviewDialogFields.customTeam.value = slide8CustomTeam;
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);
  assert.equal(deckDom.overviewDialogFields.amount.customValidity, '');
  assert.equal(
    slide8OverviewField.textContent,
    `${slide8CustomTeam}\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원`
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
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide9');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewDialogFields.kind.value, 'cause');
  assert.equal(deckDom.overviewDialogFields.date.type, 'month');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
  deckDom.listeners.click({
    target: deckDom.overviewKindButtons[1],
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialogFields.kind.value, 'purpose');
  assert.equal(deckDom.overviewKindButtons[1].classList.active, true);
  const slide9OtherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  const slide9CustomTeam = '협력계획';
  deckDom.overviewDialogFields.team.value = slide9OtherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = slide9CustomTeam;
  deckDom.overviewDialogFields.title.value = '외포장실 안전장치 설치';
  deckDom.overviewDialogFields.detail.value = '안전사고 예방';
  deckDom.overviewDialogFields.date.value = '2025-12-25';
  deckDom.overviewDialogFields.amount.value = '6.5';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);

  deckDom.listeners.click({
    target: deckDom.planImageClearButtons[0],
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planImages[0].src, undefined);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'false');

  let ctrlSavePrevented = false;
  let ctrlSaveStopped = false;
  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {
      ctrlSavePrevented = true;
    },
    stopPropagation() {
      ctrlSaveStopped = true;
    },
  });
  await flushMicrotasks();
  assert.equal(ctrlSavePrevented, true);
  assert.equal(ctrlSaveStopped, true);
  assert.equal(fetchCalls[2].url, latestReportRecordUrl);
  assert.equal(fetchCalls[2].options.method, 'PUT');
  const savedReportPayload = JSON.parse(fetchCalls[2].options.body).payload;
  assert.equal(savedReportPayload.title.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.productionTeam1ContentsItem1, '생산량 실적');
  assert.equal(savedReportPayload.slide8Title.startsWith(`3. ${latestReportMonthNumber}`), true);
  assert.equal(savedReportPayload.slide9Title.startsWith(`4. ${nextReportMonthNumber}`), true);
  assert.equal(savedReportPayload.slide5Title, '1. 유 산 (가스 비용) 분석');
  assert.equal(savedReportPayload.slide6Title, '2. 북 정 (폐수 비용) 분석');
  assert.equal(savedReportPayload.slide7Title, '2. 유 산 (폐수 비용) 분석');
  assert.equal(savedReportPayload.reportDate, getReportDateForMonth(latestReportMonth, 16));
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8SlotCount, '3');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Team, slide8CustomTeam);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Title, '환경 설비 보수');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Effect, '점검 시간 단축');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Date, '2025-12-20');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Amount, '5.5');
  assert.equal(
    JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Text,
    `${slide8CustomTeam}\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원`
  );
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9SlotCount, '1');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Team, slide9CustomTeam);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Title, '외포장실 안전장치 설치');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Kind, 'purpose');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Detail, '안전사고 예방');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Date, '2025-12');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Amount, '6.5');
  assert.equal(
    JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Text,
    `${slide9CustomTeam}\n외포장실 안전장치 설치\n▶ 목적 : 안전사고 예방\n▶ 예상 날짜 : 25.12월 中\n▶ 예상 금액 : 6.5 백만원`
  );
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8BeforeImage1, '');
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다', '저장되었습니다']);
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.editButton.textContent, '수정');

  deckDom.monthSelect.value = '2025-11';
  deckDom.listeners.change({
    target: deckDom.monthSelect,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls[3].url, '/api/modules/report_runtime/records/report_2025_11');
  assert.equal(titleField.textContent, '11월 실적 보고');
  assert.equal(slide8TitleField.textContent, '3. 11월 공사 및 정비 현황');
  assert.equal(slide9TitleField.textContent, '4. 12월 주요 계획');
  assert.equal(dateField.textContent, '2025.12.15');
  assert.equal(deckDom.root.dataset.reportMonth, '2025-11');
  assert.equal(deckDom.root.dataset.reportRecordKey, 'report_2025_11');

  deckDom.listeners.click({
    target: deckDom.navButtons[3],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '3');
  assert.equal(deckDom.counter.textContent, '4 / 9');
  assert.equal(deckDom.slides[5].classList.active, true);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '4');

  let saveMenuPrevented = false;
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  deckDom.listeners.click({
    target: deckDom.saveMenuToggleButton,
    preventDefault() {
      saveMenuPrevented = true;
    },
  });
  assert.equal(saveMenuPrevented, true);
  assert.equal(deckDom.saveMenuPanel.hidden, false);
  assert.equal(deckDom.saveMenu.dataset.reportSaveMenuOpen, 'true');
  assert.equal(deckDom.saveMenuToggleButton['aria-expanded'], 'true');
  assert.equal(deckDom.saveMenuToggleButton.classList.active, true);
  let saveMenuEscapePrevented = false;
  deckDom.listeners.keydown({
    key: 'Escape',
    target: {
      closest() {
        return null;
      },
    },
    preventDefault() {
      saveMenuEscapePrevented = true;
    },
  });
  assert.equal(saveMenuEscapePrevented, true);
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  assert.equal(deckDom.saveMenu.dataset.reportSaveMenuOpen, undefined);
  assert.equal(deckDom.saveMenuToggleButton['aria-expanded'], 'false');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  team1ContentsItem1Field.textContent = '발표 전 저장';
  deckDom.listeners.input({
    target: team1ContentsItem1Field,
  });
  await flushMicrotasks();
  const presentationSaveIndex = fetchCalls.length;
  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  await flushMicrotasks();
  const presentationSaveCall = fetchCalls
    .slice(presentationSaveIndex)
    .find(
      (call) => call.url === '/api/modules/report_runtime/records/report_2025_11' && call.options?.method === 'PUT'
    );
  assert.ok(presentationSaveCall, 'presentation should save edited report before fullscreen');
  assert.equal(JSON.parse(presentationSaveCall.options.body).payload.productionTeam1ContentsItem1, '발표 전 저장');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(deckDom.editButton.textContent, '수정');
  assert.equal(deckDom.root.fullscreenRequestCount, 1);
  assert.equal(deckDom.stage.focusCount, 2);
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, 'true');
  assert.equal(deckDom.counter.textContent, '5 / 7');
  assert.equal(deckDom.slides[8].dataset.reportOutputPrepared, 'true');
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.slides[10].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.navButtons[7].hidden, true);

  let fullscreenClickPrevented = false;
  deckDom.listeners.click({
    target: {
      closest() {
        return null;
      },
    },
    preventDefault() {
      fullscreenClickPrevented = true;
    },
  });
  assert.equal(fullscreenClickPrevented, true);
  assert.equal(deckDom.root.dataset.reportActiveSlide, '5');

  deckDom.listeners.click({
    target: deckDom.navButtons[6],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '6');
  assert.equal(deckDom.root.ownerDocument.fullscreenElement, deckDom.root);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 9');
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, undefined);
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.root.ownerDocument.exitCount, 1);
  assert.equal(deckDom.root.ownerDocument.fullscreenElement, null);

  deckDom.listeners.click({
    target: deckDom.reportReturnButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'hq');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '1');
  assert.equal(deckDom.counter.textContent, '2 / 2');
  assert.equal(deckDom.reportReturnButton.hidden, true);
  assert.equal(deckDom.slides[1].classList.active, true);
});
