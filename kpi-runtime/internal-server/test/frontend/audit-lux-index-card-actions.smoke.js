import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditWorkspaceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);
const auditAttachmentsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-attachments.js'),
  'utf8'
);
const auditEvidenceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.evidence.js'),
  'utf8'
);
const auditPdfThumbnailSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-pdf-thumbnails.js'),
  'utf8'
);

function createLuxWorkspaceRuntime(initialData = {}, initialForm = {}) {
  const data = structuredClone({ entries: [], standards: [], evidence: [], ...initialData });
  const entryForm = { year: 2026, quarter: 3, team: '', ...initialForm };
  const content = { innerHTML: '' };
  const category = { dataKey: 'audit_lux', title: '조도' };
  const context = {
    AuditState: {},
    AUDIT_LUX_BASE_YEAR: 2023,
    AppData: { audit: { categories: [category] } },
    console: { ...console, warn() {}, error() {} },
    document: {
      getElementById: (id) => (id === 'content-container' ? content : null),
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    HTMLElement: class HTMLElement {},
    HTMLInputElement: class HTMLInputElement {},
    escapeHtml: (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
    })[char]),
    escapeJs: (value) => String(value ?? '').replace(/['\\]/g, '\\$&'),
    normalizeAuditZone: (value) => String(value ?? '').trim().toLowerCase(),
    getAuditFilterTeams: () => ['2팀', '3팀'],
    getAuditCurrentQuarterInfo: () => ({ year: 2026, quarter: 3 }),
    getQuarterInfo: () => ({ year: 2026, quarter: 3 }),
    getAuditEntryFormState: () => entryForm,
    getAuditData: () => structuredClone(data),
    cloneAuditDataPayload: (payload) => structuredClone(payload),
    isAuditLuxDataKey: (key) => key === 'audit_lux',
    getAuditLuxWorkspaceRows: () => [],
    getAuditLuxYearNote: () => '',
    saveAuditData: async (_key, nextData) => {
      for (const key of Object.keys(data)) delete data[key];
      Object.assign(data, structuredClone(nextData));
      return true;
    },
    syncAuditLuxDetachedPreview() {},
    syncAuditLuxWorkspaceFullscreenUi() {},
    initAuditLuxPdfThumbnails() {},
    setLastModified() {},
    alert(message) { context.alerts.push(message); },
    alerts: [],
  };
  context.renderAuditContent = () => context.renderAuditLuxWorkspace(category, data);
  vm.createContext(context);
  vm.runInContext(auditEvidenceSource, context);
  vm.runInContext(auditAttachmentsSource, context);
  vm.runInContext(auditWorkspaceSource, context);
  return {
    context, data, entryForm,
    render: () => context.renderAuditContent(),
    html: () => content.innerHTML,
  };
}

function quarterButtons(html) {
  return [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
    .filter(([, attrs]) => /class="[^"]*\baudit-lux-quarter-button\b/.test(attrs))
    .map(([, attrs, body]) => ({
      attrs,
      text: body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    }));
}

test('audit lux starts with the current year and waits for an explicit team choice', () => {
  const runtime = createLuxWorkspaceRuntime();
  runtime.render();

  assert.match(runtime.html(), /id="audit-lux-year-audit_lux"/);
  assert.match(runtime.html(), /value="2026"\s+selected/);
  assert.match(runtime.html(), /id="audit-lux-team-audit_lux"/);
  assert.match(runtime.html(), /<option value=""\s+selected/);
  assert.match(runtime.html(), /audit-lux-selection-empty/);
  assert.doesNotMatch(runtime.html(), /audit-lux-window-header|audit-lux-window-title/);
  assert.match(runtime.html(), /<h2 class="audit-lux-category-title">조도<\/h2>/);
  assert.doesNotMatch(runtime.html(), /audit-lux-team-content|audit-lux-document/);
  assert.deepEqual(Array.from(runtime.context.getAuditLuxWorkspaceTeams('audit_lux')),
    ['1팀 1파트', '1팀 2파트', '2팀', '3팀']);

  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '2팀');
  assert.equal(runtime.entryForm.team, '2팀');
  assert.match(runtime.html(), /audit-lux-team-content[^>]*data-year="2026"[^>]*data-team="2팀"/);
  assert.match(runtime.html(), /2팀 조도 측정/);
  assert.equal((runtime.html().match(/class="audit-lux-team-content/g) || []).length, 1);
  assert.doesNotMatch(runtime.html(), /audit-lux-index-year|audit-lux-index-card/);

  runtime.context.setAuditLuxWorkspaceYear('audit_lux', 2025);
  assert.match(runtime.html(), /audit-lux-team-content[^>]*data-year="2025"[^>]*data-team="2팀"/);
  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '3팀');
  assert.match(runtime.html(), /audit-lux-team-content[^>]*data-year="2025"[^>]*data-team="3팀"/);
  assert.match(runtime.html(), /3팀 조도 측정/);
  assert.doesNotMatch(runtime.html(), /2팀 조도 측정/);

  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '');
  assert.match(runtime.html(), /audit-lux-selection-empty/);
  assert.doesNotMatch(runtime.html(), /audit-lux-team-content|audit-lux-document/);
});

test('audit lux later cumulative evidence completes earlier quarters without separate uploads', () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [{ year: 2026, team: '2팀', status: '2' }],
    evidence: [{ year: 2026, team: '2팀', quarter: 3, file: 'lux-q3.pdf' }],
  }, { team: '2팀' });
  runtime.render();

  assert.match(runtime.html(), /3분기까지 완료/);
  assert.match(runtime.html(), /<progress\b[^>]*max="4"[^>]*value="3"/);
  const quarters = quarterButtons(runtime.html());
  assert.equal(quarters.length, 4);
  assert.match(quarters[0].attrs, /is-complete/);
  assert.match(quarters[0].text, /완료/);
  assert.match(quarters[0].text, /3분기 누적 자료/);
  assert.match(quarters[1].attrs, /is-complete/);
  assert.match(quarters[1].text, /3분기 누적 자료/);
  assert.match(quarters[2].text, /완료/);
  assert.match(quarters[2].text, /누적 자료 등록/);
  assert.match(quarters[2].attrs, /is-complete/);
  assert.match(quarters[3].text, /예정/);
  assert.match(quarters[3].attrs, /is-pending/);
  assert.match(quarters[3].attrs, /disabled/);
  assert.equal(runtime.data.evidence.length, 1, 'cumulative completion must not create duplicate evidence slots');
  const completionOptions = runtime.html().match(/<select[^>]*audit-lux-completion-select[^>]*>([\s\S]*?)<\/select>/)?.[1] || '';
  for (const status of ['', '1', '2']) {
    const option = [...completionOptions.matchAll(/<option\b([^>]*)>/g)]
      .find(([, attrs]) => attrs.includes(`value="${status}"`));
    assert.ok(option, `completion option ${status || 'incomplete'} must remain visible`);
    assert.match(option[1], /disabled/, 'cumulative evidence must prevent lowering completion');
  }
});

test('audit lux opens the latest evidence and keeps replacement scoped to the displayed cumulative document', () => {
  const runtime = createLuxWorkspaceRuntime({
    evidence: [
      { year: 2026, team: '2팀', quarter: 1, documentId: 'lux-team2-q1', fileName: 'q1.pdf' },
      { year: 2026, team: '2팀', quarter: 2, documentId: 'lux-team2-q2', fileName: 'q2.pdf' },
      { year: 2026, team: '3팀', quarter: 3, documentId: 'lux-team3-q3', fileName: 'other-team.pdf' },
    ],
  });
  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '2팀');

  assert.equal(runtime.entryForm.quarter, 2);
  assert.match(runtime.html(), /audit-lux-document[^>]*data-quarter="2"/);
  assert.match(runtime.html(), /2분기 측정 자료/);
  assert.match(runtime.html(), /\/api\/files\/lux-team2-q2\/view/);
  assert.match(runtime.html(), /\/api\/files\/lux-team2-q2\/download/);
  assert.doesNotMatch(runtime.html(), /other-team\.pdf|lux-team3-q3/);
  assert.match(runtime.html(), /원본 열기/);
  assert.match(runtime.html(), /다운로드/);
  assert.match(runtime.html(), /교체/);
  assert.match(runtime.html(), /2분기까지 완료/);
  assert.match(runtime.html(), /audit-lux-document[^>]*data-quarter="2"[^>]*data-source-quarter="2"/);
  assert.match(runtime.html(), /2분기 누적 자료 · 1~2분기 포함/);

  runtime.context.selectAuditLuxWorkspaceQuarter('audit_lux', 1);
  assert.equal(runtime.entryForm.quarter, 1);
  assert.match(runtime.html(), /audit-lux-document[^>]*data-quarter="1"[^>]*data-source-quarter="2"/);
  assert.match(runtime.html(), /1분기 측정 자료/);
  assert.match(runtime.html(), /2분기 누적 자료 · 1~2분기 포함/);
  assert.match(runtime.html(), /\/api\/files\/lux-team2-q2\/view/);
  assert.doesNotMatch(runtime.html(), /href="[^"]*lux-team2-q1/);
  assert.match(runtime.html(), /handleAuditLuxAttachmentChangeForTarget\('audit_lux', 2026, '2팀', 2, this\)/);
  let pickerClicks = 0;
  const input = { dataset: { quarter: '2' }, click: () => { pickerClicks += 1; } };
  const getElementById = runtime.context.document.getElementById;
  const inputId = runtime.context.getAuditLuxAttachmentInputId('audit_lux', 2026, '2팀', 2);
  runtime.context.document.getElementById = (id) => id === inputId ? input : getElementById(id);
  runtime.context.openAuditLuxAttachmentPickerForTarget('audit_lux', 2026, '2팀', 2);
  assert.equal(pickerClicks, 1);
  assert.equal(runtime.entryForm.quarter, 1, 'opening or cancelling replacement must preserve the viewed quarter');
  assert.equal(runtime.context.getAuditLuxSelectedAttachmentQuarter('audit_lux', 2026, '2팀'), 1);

  runtime.context.selectAuditLuxWorkspaceQuarter('audit_lux', 3);
  assert.match(runtime.html(), /3분기 측정 자료/);
  assert.match(runtime.html(), /등록/);
  assert.doesNotMatch(runtime.html(), /href="[^"]*lux-team2-q[12]/);
  assert.match(quarterButtons(runtime.html())[2].attrs, /is-incomplete/);
  runtime.context.selectAuditLuxWorkspaceQuarter('audit_lux', 4);
  assert.equal(runtime.entryForm.quarter, 3, 'future quarters must not become the upload target');
});

test('audit lux progress saves the selected team without changing the viewed quarter', async () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [{ year: 2026, team: '3팀', status: '1' }],
    evidence: [{ year: 2026, team: '2팀', quarter: 1, file: 'q1.pdf' }],
  }, { team: '2팀' });
  runtime.render();
  const previousQuarter = runtime.context.getAuditLuxSelectedAttachmentQuarter('audit_lux', 2026, '2팀');

  assert.equal(await runtime.context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', '2'), true);
  assert.equal(runtime.context.getAuditLuxSelectedAttachmentQuarter('audit_lux', 2026, '2팀'), previousQuarter);
  assert.deepEqual(runtime.data.luxProgress, [
    { year: 2026, team: '3팀', status: '1' },
    { year: 2026, team: '2팀', status: '2' },
  ]);
  runtime.render();
  assert.match(runtime.html(), /2분기까지 완료/);

  runtime.context.saveAuditData = async () => false;
  assert.equal(await runtime.context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', '3'), false);
  assert.equal(runtime.context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '2');
  assert.equal(runtime.data.luxProgress.find((item) => item.team === '2팀').status, '2');
  runtime.render();
  assert.match(runtime.html(), /2분기까지 완료/);
});

test('audit lux cumulative evidence raises cached completion and floors both successful and failed writes', async () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [{ year: 2026, team: '2팀', status: '1' }],
    evidence: [{ year: 2026, team: '2팀', quarter: 2, documentId: 'lux-q2', fileName: 'q2.pdf' }],
  }, { team: '2팀' });
  const { context } = runtime;

  assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '2');
  assert.equal(await context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', ''), true);
  assert.deepEqual(runtime.data.luxProgress, [{ year: 2026, team: '2팀', status: '2' }]);

  runtime.data.evidence.push({ year: 2026, team: '2팀', quarter: 3, documentId: 'lux-q3', fileName: 'q3.pdf' });
  assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '3', 'new evidence must raise already cached completion');
  context.saveAuditData = async () => false;
  assert.equal(await context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', '1'), false);
  assert.deepEqual(runtime.data.luxProgress, [{ year: 2026, team: '2팀', status: '2' }]);
  assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '3');
  assert.equal(context.isAuditLuxProgressSaving('audit_lux'), false);
});

test('audit lux cumulative documents keep year team and exact archive lookups isolated', () => {
  const runtime = createLuxWorkspaceRuntime({
    evidence: [
      { year: 2025, team: '2팀', quarter: 4, documentId: 'lux-2025-q4', fileName: '2025-q4.pdf' },
      { year: 2026, team: '2팀', quarter: 2, documentId: 'lux-2026-q2', fileName: '2026-q2.pdf' },
      { year: 2026, team: '3팀', quarter: 3, documentId: 'lux-other-team', fileName: 'other-team.pdf' },
    ],
  });
  const { context } = runtime;

  assert.equal(context.getAuditLuxEvidenceCompletedQuarter('audit_lux', 2025, '2팀'), 4);
  assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2025, '2팀'), 'complete');
  assert.equal(context.getAuditLuxCumulativeEvidenceItem('audit_lux', 2025, '2팀', 1)?.documentId, 'lux-2025-q4');
  assert.equal(context.getAuditLuxCumulativeEvidenceItem('audit_lux', 2026, '2팀', 1)?.documentId, 'lux-2026-q2');
  assert.equal(context.getAuditLuxCumulativeEvidenceItem('audit_lux', 2026, '2팀', 3), null);
  assert.equal(context.getAuditLuxCumulativeEvidenceItem('audit_lux', 2027, '2팀', 1), null);
  assert.equal(context.getAuditLuxCumulativeEvidenceItem('audit_lux', 2026, '1팀 1파트', 1), null);
  assert.equal(context.getAuditLuxEvidenceCompletedQuarter('audit_lux', 2026, '1팀 1파트'), 0);
  assert.equal(context.getAuditLuxYearEvidenceItem('audit_lux', 2026, '2팀', 1), null, 'exact lookup must keep deletion and replacement scoped');
  assert.equal(context.getAuditLuxYearEvidenceItem('audit_lux', 2026, '2팀', 2)?.documentId, 'lux-2026-q2');
});

for (const saved of [true, false]) {
  test('audit lux cumulative upload ' + (saved ? 'advances completion after record save' : 'keeps prior completion after failed record save'), async () => {
    const runtime = createLuxWorkspaceRuntime({
      evidence: [{ year: 2026, team: '2팀', quarter: 1, documentId: 'lux-q1', fileName: 'q1.pdf' }],
    }, { team: '2팀' });
    const { context } = runtime;
    const deletedDocuments = [];
    context.uploadAuditLuxEvidenceToServer = async () => ({
      year: 2026, team: '2팀', quarter: 3, documentId: 'lux-q3', fileName: 'q3.pdf',
    });
    context.deleteAuditEvidenceFromServer = async (item) => { deletedDocuments.push(item.documentId); };
    if (!saved) context.saveAuditData = async () => false;
    assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '1');

    const input = { files: [{ name: 'q3.pdf' }], value: 'q3.pdf', dataset: { quarter: '3' } };
    await context.handleAuditLuxAttachmentChangeForTarget('audit_lux', 2026, '2팀', 3, input);
    runtime.render();

    assert.equal(context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), saved ? '3' : '1');
    assert.match(runtime.html(), saved ? /3분기까지 완료/ : /1분기까지 완료/);
    assert.equal(runtime.data.evidence.some((item) => item.documentId === 'lux-q3'), saved);
    assert.equal(runtime.data.evidence.some((item) => item.documentId === 'lux-q1'), true);
    assert.deepEqual(deletedDocuments, saved ? [] : ['lux-q3']);
    assert.equal(context.alerts.length, saved ? 0 : 1);
    assert.equal(input.value, '');
  });
}

test('audit lux progress caps current-year completion and allows all quarters for prior years', async () => {
  const runtime = createLuxWorkspaceRuntime();
  const { context } = runtime;
  const currentYearOptions = context.getAuditLuxProgressStatusOptions('complete', 2026);
  assert.match(currentYearOptions, /value="3" selected/);
  assert.doesNotMatch(currentYearOptions, /value="complete"/);
  assert.match(context.getAuditLuxProgressStatusOptions('complete', 2025), /value="complete" selected/);

  context.getAuditCurrentQuarterInfo = () => ({ year: 2026, quarter: 1 });
  const firstQuarterOptions = context.getAuditLuxProgressStatusOptions('3', 2026);
  assert.match(firstQuarterOptions, /value="1" selected/);
  assert.doesNotMatch(firstQuarterOptions, /value="2"|value="3"|value="complete"/);
  context.getAuditCurrentQuarterInfo = () => ({ year: 2026, quarter: 3 });
  assert.equal(await context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', 'complete'), true);
  assert.deepEqual(runtime.data.luxProgress, [{ year: 2026, team: '2팀', status: '3' }]);

  context.setAuditLuxWorkspaceTeam('audit_lux', '2팀');
  context.setAuditLuxWorkspaceYear('audit_lux', 2025);
  assert.equal(quarterButtons(runtime.html()).filter(({ attrs }) => /disabled/.test(attrs)).length, 0);
  assert.equal(await context.setAuditLuxProgressStatusForTarget('audit_lux', 2025, '2팀', 'complete'), true);
  runtime.render();
  assert.match(runtime.html(), /연간 측정 완료/);
  assert.match(runtime.html(), /<progress\b[^>]*max="4"[^>]*value="4"/);
});

test('audit lux completion control waits for saving and restores its value after failure', async () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [{ year: 2026, team: '2팀', status: '2' }],
  }, { team: '2팀' });
  const feedback = { textContent: '' };
  const input = { value: '3', disabled: false, isConnected: true };
  const attachmentButton = { disabled: false };
  runtime.context.document.querySelector = (selector) => {
    if (selector === '.audit-lux-save-feedback') return feedback;
    if (selector === '.audit-lux-document-actions button') return attachmentButton;
    return null;
  };
  let finishSaving;
  runtime.context.saveAuditData = () => new Promise((resolve) => { finishSaving = resolve; });

  const saving = runtime.context.updateAuditLuxWorkspaceProgress('audit_lux', input);
  assert.equal(input.disabled, true);
  assert.equal(attachmentButton.disabled, true);
  assert.equal(runtime.context.isAuditLuxProgressSaving('audit_lux'), true);
  assert.match(feedback.textContent, /저장 중/);
  finishSaving(false);
  await saving;

  assert.equal(input.disabled, false);
  assert.equal(attachmentButton.disabled, false);
  assert.equal(runtime.context.isAuditLuxProgressSaving('audit_lux'), false);
  assert.equal(input.value, '2');
  assert.match(feedback.textContent, /저장하지 못했습니다/);
  assert.equal(runtime.context.getAuditLuxProgressStatus('audit_lux', 2026, '2팀'), '2');
});

for (const saved of [true, false]) {
  test('audit lux refreshes the visible completion result after a quarter changes during ' +
    (saved ? 'a successful save' : 'a failed save'), async () => {
    const runtime = createLuxWorkspaceRuntime({
      luxProgress: [{ year: 2026, team: '2팀', status: '1' }],
    }, { team: '2팀' });
    runtime.render();
    const originalInput = { value: '2', disabled: false, isConnected: true };
    const currentInput = { value: '1', disabled: false, isConnected: true, focus() {} };
    let feedback = { textContent: '' };
    runtime.context.document.querySelector = (selector) => {
      if (selector === '.audit-lux-save-feedback') return feedback;
      if (selector === '.audit-lux-completion-select') return currentInput;
      if (selector === '.audit-lux-team-content') return {
        dataset: { year: String(runtime.entryForm.year), team: runtime.entryForm.team },
      };
      return null;
    };
    let finishSaving;
    const realSave = runtime.context.saveAuditData;
    runtime.context.saveAuditData = (key, payload) => new Promise((resolve) => {
      finishSaving = async () => resolve(saved ? await realSave(key, payload) : false);
    });

    const saving = runtime.context.updateAuditLuxWorkspaceProgress('audit_lux', originalInput);
    originalInput.isConnected = false;
    runtime.context.selectAuditLuxWorkspaceQuarter('audit_lux', 1);
    feedback = { textContent: 'newly rendered feedback' };
    await finishSaving();
    await saving;

    assert.equal(runtime.entryForm.quarter, 1);
    assert.match(runtime.html(), /audit-lux-document[^>]*data-quarter="1"/);
    assert.match(runtime.html(), saved ? /2분기까지 완료/ : /1분기까지 완료/);
    assert.match(feedback.textContent, saved ? /저장되었습니다/ : /저장하지 못했습니다/);
  });
}

test('audit lux saving an earlier team leaves the currently selected team visible', async () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [{ year: 2026, team: '2팀', status: '1' }],
  }, { team: '2팀' });
  runtime.render();
  const input = { value: '2', disabled: false, isConnected: true };
  const feedback = { textContent: '' };
  runtime.context.document.querySelector = (selector) => {
    if (selector === '.audit-lux-save-feedback') return feedback;
    if (selector === '.audit-lux-team-content') return {
      dataset: { year: String(runtime.entryForm.year), team: runtime.entryForm.team },
    };
    return null;
  };
  let finishSaving;
  const realSave = runtime.context.saveAuditData;
  runtime.context.saveAuditData = (key, payload) => new Promise((resolve) => {
    finishSaving = async () => resolve(await realSave(key, payload));
  });
  let renderCount = 0;
  const renderContent = runtime.context.renderAuditContent;
  runtime.context.renderAuditContent = (...args) => {
    renderCount += 1;
    return renderContent(...args);
  };

  const saving = runtime.context.updateAuditLuxWorkspaceProgress('audit_lux', input);
  input.isConnected = false;
  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '3팀');
  assert.equal(renderCount, 1);
  assert.match(runtime.html().match(/<select[^>]*audit-lux-completion-select[^>]*>/)?.[0] || '', /disabled/);
  feedback.textContent = 'current team feedback';
  await finishSaving();
  await saving;

  assert.equal(renderCount, 2, 'the newly selected team must rerender to unlock its completion control');
  assert.match(runtime.html(), /audit-lux-team-content[^>]*data-team="3팀"/);
  assert.match(runtime.html(), /3팀 조도 측정/);
  assert.doesNotMatch(runtime.html(), /2팀 조도 측정/);
  assert.doesNotMatch(runtime.html().match(/<select[^>]*audit-lux-completion-select[^>]*>/)?.[0] || '', /disabled/);
  assert.equal(feedback.textContent, 'current team feedback');
  assert.equal(runtime.entryForm.team, '3팀');
  assert.equal(runtime.data.luxProgress.find((item) => item.team === '2팀').status, '2');
});

test('audit lux prevents overlapping completion writes across teams and unlocks controls after saving', async () => {
  const runtime = createLuxWorkspaceRuntime({
    luxProgress: [
      { year: 2026, team: '2팀', status: '1' },
      { year: 2026, team: '3팀', status: '1' },
    ],
  }, { team: '2팀' });
  let finishSaving;
  let saveCount = 0;
  const realSave = runtime.context.saveAuditData;
  runtime.context.saveAuditData = (key, payload) => new Promise((resolve) => {
    saveCount += 1;
    finishSaving = async () => resolve(await realSave(key, payload));
  });

  const saving = runtime.context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '2팀', '2');
  assert.equal(runtime.context.isAuditLuxProgressSaving('audit_lux'), true);
  assert.equal(await runtime.context.setAuditLuxProgressStatusForTarget('audit_lux', 2026, '3팀', '3'), false);
  assert.equal(await runtime.context.saveAuditLuxWorkspace('audit_lux', { silent: true }), false);
  assert.equal(saveCount, 1, 'a second team must not replace the debounced write');
  runtime.context.setAuditLuxWorkspaceTeam('audit_lux', '3팀');
  assert.match(runtime.html(), /3팀 조도 측정/);
  assert.match(runtime.html().match(/<select[^>]*audit-lux-completion-select[^>]*>/)?.[0] || '', /disabled/);
  const uploadAction = [...runtime.html().matchAll(/<button\b([^>]*)>/g)]
    .find(([, attrs]) => /audit-lux-document-action/.test(attrs));
  assert.ok(uploadAction, 'the document upload action must remain visible');
  assert.match(uploadAction[1], /disabled/);
  assert.doesNotMatch(quarterButtons(runtime.html())[0].attrs, /disabled/, 'quarter browsing must stay available');

  await finishSaving();
  assert.equal(await saving, true);
  assert.equal(runtime.context.isAuditLuxProgressSaving('audit_lux'), false);
  runtime.render();
  assert.doesNotMatch(runtime.html().match(/<select[^>]*audit-lux-completion-select[^>]*>/)?.[0] || '', /disabled/);
  assert.equal(runtime.data.luxProgress.find((item) => item.team === '3팀').status, '1');
});

test('audit lux PDF evidence retains the first-page thumbnail fallback', () => {
  const runtime = createLuxWorkspaceRuntime();
  const thumb = runtime.context.renderAuditLuxAttachmentThumb('audit_lux', 2026, '2팀', 2, {
    documentId: 'lux-pdf', fileName: 'measurement.pdf', mimeType: 'application/pdf'
  });
  assert.match(thumb, /data-audit-lux-pdf-thumb="audit_lux"/);
  assert.match(thumb, /data-audit-lux-pdf-url="\/api\/files\/lux-pdf\/view"/);
  assert.match(auditPdfThumbnailSource, /pdfjs\.getDocument\(\{ url: pdfUrl, withCredentials: true \}\)/);
  assert.match(auditPdfThumbnailSource, /page\.render\(\{ canvasContext: context, viewport \}\)\.promise/);
  assert.match(auditPdfThumbnailSource, /element\.replaceWith\(image\)/);
  assert.match(auditPdfThumbnailSource, /audit lux pdf thumbnail fallback/);
});
