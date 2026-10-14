import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const fixtureOrigin = 'http://equipment-history.fixture.test';
const recordPath = '/api/modules/portal_data/records/data_equipment_history_card';
const team2 = 'work_team_calendar_team2';
const team3 = 'work_team_calendar_team3';
const equipmentDirectory = 'data-entry/runtime/data/equipment-history/';
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const scriptPaths = Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g))
  .map((match) => match[1].split('?')[0])
  .filter((file) => file.startsWith(equipmentDirectory));
const stylePaths = [
  ...[
    '01-equipment-foundation.css',
    '02-utility-entry-shell.css',
    '03-utility-entry-workspace.css',
    '04-utility-entry-graph-responsive.css',
    '05-equipment-detail.css',
    '06-equipment-dashboard.css',
    '07-equipment-board.css',
    '08-equipment-responsive.css',
  ].map((file) => `kpi-runtime/app/styles/data/data/${file}`),
  `${equipmentDirectory}KPI.data.equipment-history.css`,
  `${equipmentDirectory}KPI.data.equipment-history.preventive-maintenance.css`,
  `${equipmentDirectory}KPI.data.equipment-history.maintenance.css`,
];
const assets = new Map(
  await Promise.all(
    [...scriptPaths, ...stylePaths].map(async (file) => [
      `/${file}`,
      await fs.readFile(path.join(repoRoot, file), 'utf8'),
    ])
  )
);

function makePayload() {
  const equipment = (id, name, maintenanceCategory, room, team = team2) => ({
    id,
    name,
    equipmentCode: id.toUpperCase(),
    team: team === team2 ? '2팀' : '3팀',
    teamDataKey: team,
    room,
    process: '공통 공정',
    maintenanceCategory,
    status: '가동중',
    annualMaintenancePlan: [],
    maintenanceHistory: [],
  });
  const first = equipment('compressor-a', '압축기 A', '압축기', '기계실 A');
  first.annualMaintenancePlan = [
    {
      equipmentName: first.name,
      maintenanceItem: '오일 점검',
      maintenanceContent: '기존 예방정비 내용',
      cycle: '연 1회',
      executionMonth: '9월',
      inspectionNotes: '기존 계획 비고',
    },
  ];
  first.maintenanceHistory = [
    { date: '2026.09.01', type: '정기점검', content: 'A 기존 이력', worker: '김점검', note: '보존' },
  ];
  const second = equipment('compressor-b', '압축기 B', '압축기', '다른 기계실');
  second.maintenanceHistory = [
    { date: '2026.09.02', type: '수리', content: 'B 기존 이력', worker: '박정비', note: '' },
  ];
  return {
    meta: { fixtureMarker: 'preserve-unrelated-payload' },
    equipmentList: [
      first,
      second,
      equipment('pump-a', '압축기 표시 펌프', '펌프', '기계실 A'),
      equipment('unclassified', '종류 미지정 설비', '', '기계실 A'),
      equipment('team3-compressor', '3팀 압축기', '압축기', '기계실 A', team3),
    ],
  };
}

function fixtureHtml(payload) {
  // Only the shell runtime and HTTP record service are fixtures. Every equipment
  // module, stylesheet, form event, normalization and save serializer is real.
  const safePayload = JSON.stringify(payload).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:14px Arial,sans-serif}
    #content-container{width:100%;min-width:0;padding:16px}</style>
    ${stylePaths.map((file) => `<link rel="stylesheet" href="/${file}">`).join('')}
    </head><body><main id="content-container"></main><script>
    window.PortalData = {data_equipment_history_card:${safePayload}};
    window.KpiRuntime = {canUseServerWrite: enabled => enabled === true};
    window.__KPI_SERVER_RUNTIME_CONFIG__ = {data:{enabled:true,apiBase:'/api',moduleKey:'portal_data',
      records:{data_equipment_history_card:{recordKey:'data_equipment_history_card',
      readEnabled:true,writeEnabled:true,permissionKey:'data_equipment_history_card'}}}};
    </script>${scriptPaths.map((file) => `<script src="/${file}"></script>`).join('')}
    <script>KpiDataEquipmentHistoryBrowserAdapter.getApi().render(
      {title:'설비 이력',dataKey:'data_equipment_history_card'},
      {container:document.getElementById('content-container')},PortalData.data_equipment_history_card);
    </script></body></html>`;
}

async function openFixture(page, initialPayload = makePayload()) {
  let payload = structuredClone(initialPayload);
  let pendingSave = null;
  let nextSaveFailure = false;
  const writes = [];
  const errors = [];
  const dialogs = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    if (dialog.type() === 'alert') await dialog.accept();
    else await dialog.dismiss();
  });
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== fixtureOrigin) {
      errors.push(`Unexpected external request: ${request.method()} ${request.url()}`);
      await route.abort();
      return;
    }
    if (url.pathname === recordPath && request.method() === 'PUT') {
      const body = request.postDataJSON();
      writes.push(structuredClone(body));
      if (pendingSave) await pendingSave.promise;
      if (nextSaveFailure) {
        nextSaveFailure = false;
        await route.fulfill({ status: 500, json: { ok: false, error: 'fixture_save_failed' } });
        return;
      }
      payload = structuredClone(body.payload);
      await route.fulfill({ json: { ok: true, record: { payload } } });
      return;
    }
    if (url.pathname === '/' && request.method() === 'GET') {
      await route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixtureHtml(payload) });
      return;
    }
    if (assets.has(url.pathname) && request.method() === 'GET') {
      await route.fulfill({
        contentType: url.pathname.endsWith('.css') ? 'text/css' : 'application/javascript',
        body: assets.get(url.pathname),
      });
      return;
    }
    errors.push(`Unexpected fixture request: ${request.method()} ${url.pathname}`);
    await route.abort();
  });
  await page.goto(fixtureOrigin);
  await expect(page.locator('[data-equipment-history-surface]')).toBeVisible();
  return {
    writes,
    errors,
    dialogs,
    getPayload: () => structuredClone(payload),
    failNextSave() {
      nextSaveFailure = true;
    },
    holdSaves() {
      let release;
      const promise = new Promise((resolve) => {
        release = resolve;
      });
      pendingSave = { promise, release };
    },
    releaseSaves() {
      pendingSave?.release();
      pendingSave = null;
    },
  };
}

async function openPreventive(page, team = team2) {
  await page.locator(`[data-equipment-preventive-maintenance-team="${team}"]`).click();
  const dialog = page.locator('[data-equipment-preventive-dialog]');
  await expect(dialog).toBeVisible();
  return dialog;
}

function rowField(root, section, field, index = 0) {
  return root.locator(
    `[data-equipment-row-section="${section}"][data-equipment-row-index="${index}"][data-equipment-field="${field}"]`
  );
}

async function expectShareDecision(page, fixture, writeCount = 0, peers = ['compressor-b'], sourceId = 'compressor-a') {
  const share = page.locator('[data-equipment-maintenance-share-dialog]');
  await expect(share).toBeVisible();
  await expect(share).toHaveAttribute('aria-modal', 'true');
  await expect(share).toContainText('다른 카테고리에도 적용하시겠습니까?');
  const equipment = fixture.getPayload().equipmentList;
  const source = equipment.find((item) => item.id === sourceId);
  const candidates = equipment.filter((item) => item.id !== sourceId && item.teamDataKey === source.teamDataKey);
  await expect(share.locator('[data-equipment-maintenance-share-target]')).toHaveCount(candidates.length);
  for (const { id } of candidates) {
    const target = share.locator(`[data-equipment-maintenance-share-target="${id}"]`);
    await expect(target).toBeAttached();
    if (peers.includes(id)) await expect(target).toBeChecked();
    else await expect(target).not.toBeChecked();
  }
  await expect(share.locator('[data-equipment-maintenance-share-preview]')).not.toHaveAttribute('open');
  expect(fixture.writes).toHaveLength(writeCount);
  return share;
}

function shareGroup(share, equipmentId) {
  return share
    .locator(`[data-equipment-maintenance-share-target="${equipmentId}"]`)
    .locator('xpath=ancestor::details[@data-equipment-maintenance-share-group]');
}

async function expectNoOverflow(page, panel) {
  const layout = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      documentOverflow: document.documentElement.scrollWidth - innerWidth,
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      panelOverflow: element.scrollWidth - element.clientWidth,
      overflowingElements: Array.from(document.querySelectorAll('body *'))
        .filter((node) => node.getBoundingClientRect().right > innerWidth + 1)
        .slice(0, 12)
        .map((node) => ({ tag: node.tagName, class: node.className, right: node.getBoundingClientRect().right })),
    };
  });
  expect(layout.documentOverflow, JSON.stringify(layout)).toBeLessThanOrEqual(1);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.top).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
  expect(layout.panelOverflow).toBeLessThanOrEqual(1);
  await expect(panel).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}

async function expectCategoryControlsAligned(preventive, equipmentId) {
  const boxes = await preventive.evaluate((dialog, id) => {
    const selectors = [
      `[data-equipment-preventive-category="${id}"]`,
      `[data-equipment-preventive-category-save="${id}"]`,
      `[data-equipment-preventive-edit="${id}"]`,
    ];
    return selectors.map((selector) => {
      const rect = dialog.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
  }, equipmentId);
  for (const box of boxes.slice(1)) {
    expect(Math.abs(box.top - boxes[0].top), JSON.stringify(boxes)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.bottom - boxes[0].bottom), JSON.stringify(boxes)).toBeLessThanOrEqual(1);
  }
  expect(boxes[0].right).toBeLessThan(boxes[1].left);
  expect(boxes[1].right).toBeLessThan(boxes[2].left);
}

test('preventive maintenance lists actual team equipment, plans and history with team isolation', async ({ page }) => {
  const fixture = await openFixture(page);
  await expect(page.locator('[data-equipment-preventive-maintenance-team]')).toHaveCount(5);
  const dialog = await openPreventive(page);
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  for (const id of ['compressor-a', 'compressor-b', 'pump-a', 'unclassified']) {
    await expect(dialog.locator(`[data-equipment-preventive-edit="${id}"]`)).toBeVisible();
  }
  await expect(dialog.locator('[data-equipment-preventive-edit="team3-compressor"]')).toHaveCount(0);
  await expect(dialog).toContainText('기존 예방정비 내용');
  await expect(dialog).toContainText('A 기존 이력');
  await expect(dialog).not.toContainText('3팀 압축기');
  const records = dialog.locator('[data-equipment-preventive-record-details="compressor-a"]');
  await expect(records).not.toHaveAttribute('open');
  await records.locator('summary').click();
  await expect(records).toHaveAttribute('open');
  await expect(records.locator('.data-equipment-preventive-records')).toBeVisible();
  for (const month of ['9', '10', 'all']) {
    await dialog.locator(`[data-equipment-preventive-month="${month}"]`).click();
    await expect(records).toHaveAttribute('open');
    await expect(dialog.locator('[data-equipment-preventive-edit]')).toHaveCount(4);
    for (const id of ['compressor-a', 'compressor-b', 'pump-a', 'unclassified']) {
      await expect(dialog.locator(`[data-equipment-preventive-category="${id}"]`)).toBeVisible();
    }
    if (month === '10') await expect(dialog).not.toContainText('기존 예방정비 내용');
    else await expect(dialog).toContainText('기존 예방정비 내용');
    await expect(dialog).toContainText('A 기존 이력');
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(`[data-equipment-preventive-maintenance-team="${team2}"]`)).toBeFocused();
  const otherTeam = await openPreventive(page, team3);
  await expect(otherTeam.locator('[data-equipment-preventive-edit]')).toHaveCount(1);
  await expect(otherTeam).toContainText('3팀 압축기');
  await expect(otherTeam).not.toContainText('압축기 A');
  await page.keyboard.press('Escape');
  const emptyTeam = await openPreventive(page, 'work_team_calendar_team1_part1');
  await expect(emptyTeam.locator('[data-equipment-preventive-edit]')).toHaveCount(0);
  await expect(emptyTeam).toContainText('설비');
  expect(fixture.writes).toHaveLength(0);
  expect(fixture.errors).toEqual([]);
});

test('preventive editor and equipment history share saved rows in both directions after reload', async ({ page }) => {
  const fixture = await openFixture(page);
  let dialog = await openPreventive(page);
  await dialog.locator('[data-equipment-preventive-edit="compressor-a"]').click();
  await expect(dialog.locator('[data-equipment-field="maintenanceCategory"]')).toHaveValue('압축기');
  await rowField(dialog, 'maintenanceHistory', 'content').fill('예방정비 화면에서 수정한 이력');
  await rowField(dialog, 'annualMaintenancePlan', 'maintenanceContent').fill('예방정비 화면에서 수정한 계획');
  await dialog.locator('[data-equipment-save]').click();
  const share = await expectShareDecision(page, fixture);
  await share.locator('[data-equipment-maintenance-share-decision="current"]').click();
  await expect.poll(() => fixture.writes.length).toBe(1);
  await dialog.locator('[data-equipment-preventive-list]').click();
  await expect(dialog).toContainText('예방정비 화면에서 수정한 이력');
  await expect(dialog).toContainText('예방정비 화면에서 수정한 계획');
  await page.reload();
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await expect(rowField(page, 'maintenanceHistory', 'content')).toHaveValue('예방정비 화면에서 수정한 이력');
  await expect(rowField(page, 'annualMaintenancePlan', 'maintenanceContent')).toHaveValue(
    '예방정비 화면에서 수정한 계획'
  );
  await rowField(page, 'maintenanceHistory', 'content').fill('설비 이력카드에서 다시 수정한 이력');
  await rowField(page, 'annualMaintenancePlan', 'maintenanceContent').fill('설비 이력카드에서 다시 수정한 계획');
  await page.locator('[data-equipment-field="maintenanceCategory"]').fill('스크류 압축기');
  await page.keyboard.press('Control+s');
  const cardShare = await expectShareDecision(page, fixture, 1, []);
  await cardShare.locator('[data-equipment-maintenance-share-decision="current"]').click();
  await expect.poll(() => fixture.writes.length).toBe(2);
  await page.reload();
  dialog = await openPreventive(page);
  await expect(dialog).toContainText('설비 이력카드에서 다시 수정한 이력');
  await expect(dialog).toContainText('설비 이력카드에서 다시 수정한 계획');
  const saved = fixture.getPayload();
  expect(saved.equipmentList.find((item) => item.id === 'compressor-a').maintenanceCategory).toBe('스크류 압축기');
  expect(saved.equipmentList.find((item) => item.id === 'compressor-b').maintenanceHistory[0].content).toBe(
    'B 기존 이력'
  );
  expect(saved.meta.fixtureMarker).toBe('preserve-unrelated-payload');
  expect(fixture.errors).toEqual([]);
});

test('team list assigns categories inline, preserves raw metadata and retains other category drafts', async ({
  page,
}) => {
  const initial = makePayload();
  initial.equipmentList[0].futureMetadata = { nested: ['preserve', { enabled: false }] };
  initial.equipmentList[0].annualMaintenancePlan[0].externalPlanReference = 'legacy-plan-17';
  initial.equipmentList[0].maintenanceHistory[0].externalHistoryReference = 'legacy-history-32';
  const fixture = await openFixture(page, initial);
  let preventive = await openPreventive(page);
  const category = '직접 지정한 공용 생산 설비';
  await preventive.locator('[data-equipment-preventive-category="compressor-a"]').fill(category);
  await preventive.locator('[data-equipment-preventive-category="pump-a"]').fill(category);
  await preventive.locator('[data-equipment-preventive-month="10"]').click();
  await expect(preventive.locator('[data-equipment-preventive-category="compressor-a"]')).toHaveValue(category);
  await expect(preventive.locator('[data-equipment-preventive-category="pump-a"]')).toHaveValue(category);
  await preventive.locator('[data-equipment-preventive-category-save="compressor-a"]').click();
  await expect.poll(() => fixture.writes.length).toBe(1);
  const expected = structuredClone(initial);
  expected.equipmentList[0].maintenanceCategory = category;
  expect(fixture.getPayload()).toEqual({
    ...expected,
    maintenanceCategoriesByTeam: {
      [team2]: expect.arrayContaining(['압축기', '펌프', category]),
      [team3]: ['압축기'],
    },
    meta: { ...expected.meta, updatedAt: expect.any(String) },
  });
  await expect(page.locator('[data-equipment-maintenance-share-dialog]')).toHaveCount(0);
  await expect(preventive.locator('[data-equipment-preventive-category="pump-a"]')).toHaveValue(category);
  await preventive.locator('[data-equipment-preventive-category-save="pump-a"]').click();
  await expect.poll(() => fixture.writes.length).toBe(2);
  expected.equipmentList[2].maintenanceCategory = category;
  expect(fixture.getPayload()).toEqual({
    ...expected,
    maintenanceCategoriesByTeam: {
      [team2]: expect.arrayContaining(['압축기', '펌프', category]),
      [team3]: ['압축기'],
    },
    meta: { ...expected.meta, updatedAt: expect.any(String) },
  });
  await page.reload();
  preventive = await openPreventive(page);
  for (const id of ['compressor-a', 'pump-a']) {
    await expect(preventive.locator(`[data-equipment-preventive-category="${id}"]`)).toHaveValue(category);
  }
  await preventive.locator('[data-equipment-preventive-edit="compressor-a"]').click();
  await expect(preventive.locator('[data-equipment-field="maintenanceCategory"]')).toHaveValue(category);
  expect(fixture.errors).toEqual([]);
});

test('inline category Enter waits for Korean text composition and saves the completed name once', async ({ page }) => {
  const fixture = await openFixture(page);
  const preventive = await openPreventive(page);
  const category = preventive.locator('[data-equipment-preventive-category="unclassified"]');
  await category.fill('공용 압축');
  await category.dispatchEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    isComposing: true,
    keyCode: 13,
    bubbles: true,
  });
  await category.dispatchEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    isComposing: false,
    keyCode: 229,
    bubbles: true,
  });
  expect(fixture.writes).toHaveLength(0);
  expect(fixture.getPayload().equipmentList.find((item) => item.id === 'unclassified').maintenanceCategory).toBe('');
  await category.fill('공용 압축기');
  await category.press('Enter');
  await expect.poll(() => fixture.writes.length).toBe(1);
  await expect(category).toHaveValue('공용 압축기');
  expect(fixture.getPayload().equipmentList.find((item) => item.id === 'unclassified').maintenanceCategory).toBe(
    '공용 압축기'
  );
  await page.reload();
  const reloaded = await openPreventive(page);
  await expect(reloaded.locator('[data-equipment-preventive-category="unclassified"]')).toHaveValue('공용 압축기');
  expect(fixture.errors).toEqual([]);
});

test('opening batch with an unsaved plan asks for sharing and cancellation keeps the source draft', async ({
  page,
}) => {
  const fixture = await openFixture(page);
  const preventive = await openPreventive(page);
  await preventive.locator('[data-equipment-preventive-edit="compressor-a"]').click();
  await rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent').fill('일괄 추가를 열기 전 작성한 계획');
  await preventive.locator('[data-equipment-maintenance-batch="annualMaintenancePlan"]').click();
  let share = await expectShareDecision(page, fixture);
  await expect(page.locator('[data-equipment-maintenance-batch-dialog]')).toHaveCount(0);
  await share.locator('[data-equipment-maintenance-share-cancel]').first().click();
  await expect(share).toHaveCount(0);
  await expect(rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent')).toHaveValue(
    '일괄 추가를 열기 전 작성한 계획'
  );
  expect(fixture.writes).toHaveLength(0);
  await preventive.locator('[data-equipment-maintenance-batch="annualMaintenancePlan"]').click();
  share = await expectShareDecision(page, fixture);
  await share.locator('[data-equipment-maintenance-share-target="compressor-b"]').check();
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect(share).toHaveCount(0);
  await expect.poll(() => fixture.writes.length).toBe(1);
  expect(fixture.getPayload().equipmentList.find((item) => item.id === 'compressor-b').annualMaintenancePlan).toEqual([
    expect.objectContaining({ equipmentName: '압축기 B', maintenanceContent: '일괄 추가를 열기 전 작성한 계획' }),
  ]);
  await preventive.locator('[data-equipment-maintenance-batch="annualMaintenancePlan"]').click();
  const batch = page.locator('[data-equipment-maintenance-batch-dialog]');
  await expect(batch).toBeVisible();
  await expect(batch.locator('[data-equipment-maintenance-batch-section]')).toHaveValue('annualMaintenancePlan');
  await expect(page.locator('[data-equipment-maintenance-share-dialog]')).toHaveCount(0);
  expect(fixture.writes).toHaveLength(1);
  expect(fixture.errors).toEqual([]);
});

test('new plans and history ask before sharing, honor selected peers and save once despite repeated shortcuts', async ({
  page,
}) => {
  const initial = makePayload();
  initial.equipmentList.push({
    ...structuredClone(initial.equipmentList[1]),
    id: 'compressor-c',
    name: '압축기 C',
    equipmentCode: 'COMPRESSOR-C',
    maintenanceHistory: [],
  });
  const fixture = await openFixture(page, initial);
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await page.locator('[data-equipment-add-row="annualMaintenancePlan"]').click();
  for (const [field, value] of Object.entries({
    maintenanceItem: '공통 필터 교체',
    maintenanceContent: '신규 예방정비 공동 등록',
    cycle: '연 1회',
    executionMonth: '11월',
  })) {
    await rowField(page, 'annualMaintenancePlan', field, 1).fill(value);
  }
  await page.locator('[data-equipment-add-row="maintenanceHistory"]').click();
  await rowField(page, 'maintenanceHistory', 'date', 1).fill('2026.09.07');
  await rowField(page, 'maintenanceHistory', 'content', 1).fill('신규 정비이력 공동 등록');
  await page.keyboard.press('Control+s');
  const share = await expectShareDecision(page, fixture, 0, ['compressor-b', 'compressor-c']);
  for (const id of ['compressor-a', 'team3-compressor']) {
    await expect(share.locator(`[data-equipment-maintenance-share-target="${id}"]`)).toHaveCount(0);
  }
  await page.keyboard.press('Control+s');
  await page.keyboard.press('Control+s');
  expect(fixture.writes).toHaveLength(0);
  await expect(page.locator('[data-equipment-maintenance-share-dialog]')).toHaveCount(1);
  await share.locator('[data-equipment-maintenance-share-target="compressor-b"]').check();
  await share.locator('[data-equipment-maintenance-share-target="compressor-c"]').uncheck();
  fixture.holdSaves();
  try {
    await share.locator('[data-equipment-maintenance-share-decision="selected"]').evaluate((button) => {
      button.click();
      button.click();
    });
    await expect.poll(() => fixture.writes.length).toBe(1);
    await page.keyboard.press('Control+s');
    expect(fixture.writes).toHaveLength(1);
  } finally {
    fixture.releaseSaves();
  }
  await expect(share).toHaveCount(0);
  const saved = fixture.getPayload();
  const source = saved.equipmentList.find((item) => item.id === 'compressor-a');
  const peer = saved.equipmentList.find((item) => item.id === 'compressor-b');
  expect(source.annualMaintenancePlan).toHaveLength(2);
  expect(source.maintenanceHistory).toHaveLength(2);
  expect(peer.annualMaintenancePlan).toEqual([
    expect.objectContaining({ equipmentName: '압축기 B', maintenanceContent: '신규 예방정비 공동 등록' }),
  ]);
  expect(peer.maintenanceHistory.map((row) => row.content)).toEqual(['B 기존 이력', '신규 정비이력 공동 등록']);
  for (const id of ['pump-a', 'unclassified', 'team3-compressor', 'compressor-c']) {
    expect(saved.equipmentList.find((item) => item.id === id)).toEqual(
      initial.equipmentList.find((item) => item.id === id)
    );
  }
  await page.keyboard.press('Control+s');
  await expect(rowField(page, 'annualMaintenancePlan', 'maintenanceContent')).toBeEnabled();
  await expect(page.locator('[data-equipment-maintenance-share-dialog]')).toHaveCount(0);
  await page.reload();
  const preventive = await openPreventive(page);
  await expect(preventive.locator('[data-equipment-preventive-equipment="compressor-a"]')).toContainText(
    '신규 예방정비 공동 등록'
  );
  await expect(preventive.locator('[data-equipment-preventive-equipment="compressor-b"]')).toContainText(
    '신규 예방정비 공동 등록'
  );
  expect(
    fixture.getPayload().equipmentList.find((item) => item.id === 'compressor-b').annualMaintenancePlan
  ).toHaveLength(1);
  expect(fixture.getPayload().equipmentList.find((item) => item.id === 'compressor-b').maintenanceHistory).toHaveLength(
    2
  );
  expect(fixture.errors).toEqual([]);
});

test('cancelled sharing preserves the team editor draft and source-only save leaves peers untouched', async ({
  page,
}) => {
  const fixture = await openFixture(page);
  const preventive = await openPreventive(page);
  await preventive.locator('[data-equipment-preventive-edit="compressor-a"]').click();
  await rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent').fill('현재 설비만 변경할 예방정비');
  await preventive.locator('[data-equipment-save]').click();
  let share = await expectShareDecision(page, fixture);
  await share.locator('[data-equipment-maintenance-share-cancel]').first().click();
  await expect(share).toHaveCount(0);
  await expect(rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent')).toHaveValue(
    '현재 설비만 변경할 예방정비'
  );
  expect(fixture.getPayload()).toEqual(makePayload());
  expect(fixture.writes).toHaveLength(0);
  await page.keyboard.press('Control+s');
  share = await expectShareDecision(page, fixture);
  await share.locator('[data-equipment-maintenance-share-decision="current"]').click();
  await expect.poll(() => fixture.writes.length).toBe(1);
  await expect(share).toHaveCount(0);
  expect(fixture.getPayload().equipmentList.find((item) => item.id === 'compressor-b')).toEqual(
    makePayload().equipmentList[1]
  );
  await preventive.locator('[data-equipment-preventive-list]').click();
  await expect(preventive).toContainText('현재 설비만 변경할 예방정비');
  await page.reload();
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await expect(rowField(page, 'annualMaintenancePlan', 'maintenanceContent')).toHaveValue(
    '현재 설비만 변경할 예방정비'
  );
  expect(fixture.errors).toEqual([]);
});

test('failed shared save retains draft and selection and retries without duplicating records', async ({ page }) => {
  const fixture = await openFixture(page);
  const preventive = await openPreventive(page);
  await preventive.locator('[data-equipment-preventive-edit="compressor-a"]').click();
  await rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent').fill('실패 후 재시도할 예방정비');
  await preventive.locator('[data-equipment-save]').click();
  const share = await expectShareDecision(page, fixture);
  await share.locator('[data-equipment-maintenance-share-target="compressor-b"]').check();
  fixture.failNextSave();
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect.poll(() => fixture.writes.length).toBe(1);
  await expect(share.locator('[data-equipment-maintenance-share-decision="selected"]')).toBeEnabled();
  await expect(share.locator('[data-equipment-maintenance-share-target="compressor-b"]')).toBeChecked();
  await expect(rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent')).toHaveValue(
    '실패 후 재시도할 예방정비'
  );
  expect(fixture.getPayload()).toEqual(makePayload());
  await page.keyboard.press('Control+s');
  expect(fixture.writes).toHaveLength(1);
  fixture.holdSaves();
  try {
    await share.locator('[data-equipment-maintenance-share-decision="selected"]').evaluate((button) => {
      button.click();
      button.click();
    });
    await expect.poll(() => fixture.writes.length).toBe(2);
    await page.keyboard.press('Control+s');
    expect(fixture.writes).toHaveLength(2);
  } finally {
    fixture.releaseSaves();
  }
  await expect(share).toHaveCount(0);
  const saved = fixture.getPayload();
  for (const id of ['compressor-a', 'compressor-b']) {
    const plans = saved.equipmentList.find((item) => item.id === id).annualMaintenancePlan;
    expect(plans).toHaveLength(1);
    expect(plans[0].maintenanceContent).toBe('실패 후 재시도할 예방정비');
  }
  expect(saved.equipmentList[0].annualMaintenancePlan[0].equipmentName).toBe('압축기 A');
  expect(saved.equipmentList[1].annualMaintenancePlan[0].equipmentName).toBe('압축기 B');
  await page.reload();
  const reloaded = await openPreventive(page);
  await expect(reloaded.locator('[data-equipment-preventive-equipment="compressor-b"]')).toContainText(
    '실패 후 재시도할 예방정비'
  );
  expect(fixture.writes).toHaveLength(2);
  expect(fixture.errors).toEqual([]);
});

test('individual history offers other categories after completion and supports partial category selection', async ({
  page,
}) => {
  const initial = makePayload();
  initial.equipmentList.push({
    ...structuredClone(initial.equipmentList[2]),
    id: 'pump-b',
    name: '펌프 B',
    equipmentCode: 'PUMP-B',
  });
  const fixture = await openFixture(page, initial);
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await page.locator('[data-equipment-add-row="maintenanceHistory"]').click();
  await rowField(page, 'maintenanceHistory', 'date', 1).fill('2026.09.08');
  await rowField(page, 'maintenanceHistory', 'content', 1).fill('다른 종류 설비에도 적용할 정비');
  await rowField(page, 'maintenanceHistory', 'worker', 1).fill('정비 담당자');
  await expect(page.locator('[data-equipment-maintenance-share-dialog]')).toHaveCount(0);
  expect(fixture.writes).toHaveLength(0);
  await page.keyboard.press('Control+s');
  const share = await expectShareDecision(page, fixture);
  const sameCategory = shareGroup(share, 'compressor-b');
  const otherCategory = shareGroup(share, 'pump-a');
  const categoryCheckbox = otherCategory.locator('[data-equipment-maintenance-share-category]');
  await expect(sameCategory).toHaveAttribute('open');
  await expect(otherCategory).not.toHaveAttribute('open');
  await expect(shareGroup(share, 'unclassified')).not.toHaveAttribute('open');
  await expect(share.locator('[data-equipment-maintenance-share-target="team3-compressor"]')).toHaveCount(0);
  await page.screenshot({
    path: path.join(repoRoot, 'kpi-runtime/internal-server/var/playwright-equipment-history/desktop-card-share.png'),
  });
  await categoryCheckbox.check();
  await expect(otherCategory).toHaveAttribute('open');
  for (const id of ['pump-a', 'pump-b']) {
    await expect(share.locator(`[data-equipment-maintenance-share-target="${id}"]`)).toBeChecked();
  }
  await share.locator('[data-equipment-maintenance-share-target="pump-b"]').uncheck();
  await expect(categoryCheckbox).toHaveJSProperty('indeterminate', true);
  await expect(categoryCheckbox).not.toBeChecked();
  await share.locator('[data-equipment-maintenance-share-target="compressor-b"]').uncheck();
  await expect(sameCategory.locator('[data-equipment-maintenance-share-category]')).not.toBeChecked();
  const preview = share.locator('[data-equipment-maintenance-share-preview]');
  await preview.locator('summary').click();
  await expect(preview).toHaveAttribute('open');
  await expect(preview).toContainText('다른 종류 설비에도 적용할 정비');
  expect(fixture.writes).toHaveLength(0);
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect(share).toHaveCount(0);
  expect(fixture.writes).toHaveLength(1);
  const saved = fixture.getPayload();
  expect(saved.equipmentList.find((item) => item.id === 'compressor-a').maintenanceHistory).toHaveLength(2);
  expect(saved.equipmentList.find((item) => item.id === 'pump-a').maintenanceHistory).toEqual([
    expect.objectContaining({ content: '다른 종류 설비에도 적용할 정비', worker: '정비 담당자' }),
  ]);
  for (const id of ['compressor-b', 'pump-b', 'unclassified', 'team3-compressor']) {
    expect(saved.equipmentList.find((item) => item.id === id)).toEqual(
      initial.equipmentList.find((item) => item.id === id)
    );
  }
  await page.reload();
  const preventive = await openPreventive(page);
  for (const id of ['compressor-a', 'pump-a']) {
    await expect(preventive.locator(`[data-equipment-preventive-equipment="${id}"]`)).toContainText(
      '다른 종류 설비에도 적용할 정비'
    );
  }
  expect(fixture.errors).toEqual([]);
});

test('individual history keeps the completed draft on cancel and retains other category choices after a failed save', async ({
  page,
}) => {
  const fixture = await openFixture(page);
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await rowField(page, 'maintenanceHistory', 'content').fill('다른 카테고리 저장 실패 후 재시도');
  await page.keyboard.press('Control+s');
  let share = await expectShareDecision(page, fixture);
  await shareGroup(share, 'pump-a').locator('[data-equipment-maintenance-share-category]').check();
  await share.locator('[data-equipment-maintenance-share-cancel]').first().click();
  await expect(share).toHaveCount(0);
  await expect(rowField(page, 'maintenanceHistory', 'content')).toHaveValue('다른 카테고리 저장 실패 후 재시도');
  expect(fixture.writes).toHaveLength(0);
  expect(fixture.getPayload()).toEqual(makePayload());
  await page.keyboard.press('Control+s');
  share = await expectShareDecision(page, fixture);
  await shareGroup(share, 'pump-a').locator('[data-equipment-maintenance-share-category]').check();
  await share.locator('[data-equipment-maintenance-share-target="compressor-b"]').uncheck();
  fixture.failNextSave();
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect.poll(() => fixture.writes.length).toBe(1);
  await expect(share.locator('[data-equipment-maintenance-share-decision="selected"]')).toBeEnabled();
  await expect(share.locator('[data-equipment-maintenance-share-target="pump-a"]')).toBeChecked();
  await expect(share.locator('[data-equipment-maintenance-share-target="compressor-b"]')).not.toBeChecked();
  await expect(shareGroup(share, 'pump-a')).toHaveAttribute('open');
  await expect(rowField(page, 'maintenanceHistory', 'content')).toHaveValue('다른 카테고리 저장 실패 후 재시도');
  expect(fixture.getPayload()).toEqual(makePayload());
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect(share).toHaveCount(0);
  expect(fixture.writes).toHaveLength(2);
  const saved = fixture.getPayload();
  for (const id of ['compressor-a', 'pump-a']) {
    const rows = saved.equipmentList.find((item) => item.id === id).maintenanceHistory;
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe('다른 카테고리 저장 실패 후 재시도');
  }
  expect(saved.equipmentList.find((item) => item.id === 'compressor-b')).toEqual(makePayload().equipmentList[1]);
  expect(fixture.errors).toEqual([]);
});

test('uncategorized equipment can share completed history with an explicitly selected category', async ({ page }) => {
  const fixture = await openFixture(page);
  await page.locator('[data-equipment-board-card][data-equipment-open-card="unclassified"]').click();
  await rowField(page, 'maintenanceHistory', 'date').fill('2026.09.08');
  await rowField(page, 'maintenanceHistory', 'content').fill('분류 전 설비에서 작성한 공통 이력');
  await page.keyboard.press('Control+s');
  const share = await expectShareDecision(page, fixture, 0, [], 'unclassified');
  await expect(share.locator('[data-equipment-maintenance-share-decision="selected"]')).toBeDisabled();
  const compressorCategory = shareGroup(share, 'compressor-a');
  await expect(compressorCategory).not.toHaveAttribute('open');
  await compressorCategory.locator('[data-equipment-maintenance-share-category]').check();
  await expect(share.locator('[data-equipment-maintenance-share-target="compressor-a"]')).toBeChecked();
  await expect(share.locator('[data-equipment-maintenance-share-target="compressor-b"]')).toBeChecked();
  await share.locator('[data-equipment-maintenance-share-decision="selected"]').click();
  await expect(share).toHaveCount(0);
  expect(fixture.writes).toHaveLength(1);
  const saved = fixture.getPayload();
  for (const id of ['unclassified', 'compressor-a', 'compressor-b']) {
    expect(saved.equipmentList.find((item) => item.id === id).maintenanceHistory.at(-1).content).toBe(
      '분류 전 설비에서 작성한 공통 이력'
    );
  }
  expect(saved.equipmentList.find((item) => item.id === 'unclassified').maintenanceCategory).toBe('');
  for (const id of ['pump-a', 'team3-compressor']) {
    expect(saved.equipmentList.find((item) => item.id === id)).toEqual(
      makePayload().equipmentList.find((item) => item.id === id)
    );
  }
  expect(fixture.errors).toEqual([]);
});

async function openBatchForCategory(page) {
  const preventive = await openPreventive(page);
  await preventive.locator(`[data-equipment-maintenance-batch-team="${team2}"]`).click();
  const batch = page.locator('[data-equipment-maintenance-batch-dialog]');
  await expect(batch).toBeVisible();
  const categorySelect = batch.locator('[data-equipment-maintenance-batch-category]');
  const categoryValue = await categorySelect
    .locator('option')
    .evaluateAll((options) => options.find((option) => option.textContent.includes('압축기'))?.value);
  expect(categoryValue).toBeTruthy();
  await categorySelect.selectOption(categoryValue);
  await batch.locator('[data-equipment-maintenance-batch-all]').click();
  return batch;
}

test('bulk history appends only to the selected equipment kind within its team and prevents duplicate saves', async ({
  page,
}) => {
  const fixture = await openFixture(page);
  const batch = await openBatchForCategory(page);
  await expect(batch.locator('[data-equipment-maintenance-batch-target]')).toHaveCount(2);
  for (const id of ['compressor-a', 'compressor-b']) {
    await expect(batch.locator(`[data-equipment-maintenance-batch-target="${id}"]`)).toBeChecked();
  }
  for (const id of ['pump-a', 'unclassified', 'team3-compressor']) {
    await expect(batch.locator(`[data-equipment-maintenance-batch-target="${id}"]`)).toHaveCount(0);
  }
  for (const [field, value] of Object.entries({
    date: '2026.09.07',
    type: '예방정비',
    content: '동일 설비 종류 오일 교체',
    worker: '정정비',
    note: '각 설비에 한 건만 추가',
  })) {
    await batch.locator(`[data-equipment-maintenance-batch-field="${field}"]`).fill(value);
  }
  fixture.holdSaves();
  try {
    await batch.locator('[data-equipment-maintenance-batch-save]').evaluate((button) => {
      button.click();
      button.click();
    });
    await expect.poll(() => fixture.writes.length).toBe(1);
    await expect(batch.locator('[data-equipment-maintenance-batch-save]')).toBeDisabled();
    await page.keyboard.press('Control+s');
    expect(fixture.writes).toHaveLength(1);
  } finally {
    fixture.releaseSaves();
  }
  await expect(batch).toHaveCount(0);
  const saved = fixture.getPayload();
  for (const [id, original] of [
    ['compressor-a', 'A 기존 이력'],
    ['compressor-b', 'B 기존 이력'],
  ]) {
    const rows = saved.equipmentList.find((item) => item.id === id).maintenanceHistory;
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.content)).toEqual([original, '동일 설비 종류 오일 교체']);
    expect(rows[1].worker).toBe('정정비');
  }
  for (const id of ['pump-a', 'unclassified', 'team3-compressor']) {
    expect(saved.equipmentList.find((item) => item.id === id).maintenanceHistory).toEqual([]);
  }
  expect(saved.equipmentList.find((item) => item.id === 'compressor-a').annualMaintenancePlan).toHaveLength(1);
  await page.reload();
  const preventive = await openPreventive(page);
  await expect(preventive).toContainText('동일 설비 종류 오일 교체');
  expect(fixture.writes).toHaveLength(1);
  expect(fixture.errors).toEqual([]);
});

test('bulk plans honor explicit target selection and use each selected equipment name', async ({ page }) => {
  const fixture = await openFixture(page);
  const batch = await openBatchForCategory(page);
  await batch.locator('[data-equipment-maintenance-batch-section]').selectOption('annualMaintenancePlan');
  await batch.locator('[data-equipment-maintenance-batch-target="compressor-a"]').uncheck();
  for (const [field, value] of Object.entries({
    maintenanceItem: '필터 교체',
    maintenanceContent: '선택 설비 필터 예방 교체',
    cycle: '연 1회',
    executionMonth: '10월',
  })) {
    await batch.locator(`[data-equipment-maintenance-batch-field="${field}"]`).fill(value);
  }
  await batch.locator('[data-equipment-maintenance-batch-save]').click();
  await expect(batch).toHaveCount(0);
  const saved = fixture.getPayload();
  expect(saved.equipmentList.find((item) => item.id === 'compressor-a').annualMaintenancePlan).toEqual(
    makePayload().equipmentList[0].annualMaintenancePlan
  );
  expect(saved.equipmentList.find((item) => item.id === 'compressor-b').annualMaintenancePlan).toEqual([
    expect.objectContaining({ equipmentName: '압축기 B', maintenanceItem: '필터 교체', executionMonth: '10월' }),
  ]);
  expect(saved.equipmentList.find((item) => item.id === 'compressor-b').maintenanceHistory).toHaveLength(1);
  expect(saved.equipmentList.find((item) => item.id === 'team3-compressor').annualMaintenancePlan).toEqual([]);
  expect(fixture.writes).toHaveLength(1);
  expect(fixture.errors).toEqual([]);
});

test('user assigned custom categories drive bulk targets after reload and preserve unsaved card edits', async ({
  page,
}) => {
  const fixture = await openFixture(page);
  const customCategory = '직접 지정한 고압라인 설비';
  for (const [index, id] of ['compressor-a', 'pump-a'].entries()) {
    await page.locator(`[data-equipment-board-card][data-equipment-open-card="${id}"]`).click();
    await page.locator('[data-equipment-field="maintenanceCategory"]').fill(customCategory);
    await page.keyboard.press('Control+s');
    await expect.poll(() => fixture.writes.length).toBe(index + 1);
    await expect
      .poll(() => fixture.getPayload().equipmentList.find((item) => item.id === id).maintenanceCategory)
      .toBe(customCategory);
    await page.reload();
  }
  await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
  await expect(page.locator('[data-equipment-field="maintenanceCategory"]')).toHaveValue(customCategory);
  await rowField(page, 'maintenanceHistory', 'content').fill('일괄 입력 전 카드 수정도 보존');
  await page.locator('[data-equipment-maintenance-batch="maintenanceHistory"]').click();
  const share = await expectShareDecision(page, fixture, 2, ['pump-a']);
  await expect(page.locator('[data-equipment-maintenance-batch-dialog]')).toHaveCount(0);
  await share.locator('[data-equipment-maintenance-share-decision="current"]').click();
  await expect(share).toHaveCount(0);
  await expect.poll(() => fixture.writes.length).toBe(3);
  await page.locator('[data-equipment-maintenance-batch="maintenanceHistory"]').click();
  const batch = page.locator('[data-equipment-maintenance-batch-dialog]');
  await expect(batch).toBeVisible();
  await expect.poll(() => fixture.writes.length).toBe(3);
  await expect(batch.locator('[data-equipment-maintenance-batch-category] option:checked')).toContainText(
    customCategory
  );
  await expect(batch.locator('[data-equipment-maintenance-batch-target]')).toHaveCount(2);
  for (const id of ['compressor-a', 'pump-a']) {
    await batch.locator(`[data-equipment-maintenance-batch-target="${id}"]`).check();
  }
  await expect(batch.locator('[data-equipment-maintenance-batch-target="compressor-b"]')).toHaveCount(0);
  await batch.locator('[data-equipment-maintenance-batch-field="date"]').fill('2026.09.07');
  await batch.locator('[data-equipment-maintenance-batch-field="content"]').fill('직접 지정한 카테고리 공통 정비');
  await batch.locator('[data-equipment-maintenance-batch-save]').click();
  await expect(batch).toHaveCount(0);
  const saved = fixture.getPayload();
  expect(
    saved.equipmentList.find((item) => item.id === 'compressor-a').maintenanceHistory.map((row) => row.content)
  ).toEqual(['일괄 입력 전 카드 수정도 보존', '직접 지정한 카테고리 공통 정비']);
  expect(saved.equipmentList.find((item) => item.id === 'pump-a').maintenanceHistory[0].content).toBe(
    '직접 지정한 카테고리 공통 정비'
  );
  expect(saved.equipmentList.find((item) => item.id === 'compressor-b').maintenanceHistory).toHaveLength(1);
  expect(fixture.writes).toHaveLength(4);
  expect(fixture.errors).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 960 },
  { width: 390, height: 844 },
]) {
  test(`saved team categories can be selected without saving and controls align at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const initial = makePayload();
    initial.equipmentList.find((item) => item.id === 'team3-compressor').maintenanceCategory = '3팀 전용 카테고리';
    const fixture = await openFixture(page, initial);
    let preventive = await openPreventive(page);
    const customCategory = '직접 만든 공용 설비';
    const comboFor = (id) =>
      preventive.locator(`[data-equipment-preventive-equipment="${id}"] .data-equipment-category-combo`);
    await expectCategoryControlsAligned(preventive, 'compressor-a');
    await preventive.locator('[data-equipment-preventive-category="compressor-a"]').fill(customCategory);
    expect(fixture.writes).toHaveLength(0);
    await preventive.locator('[data-equipment-preventive-category-save="compressor-a"]').click();
    await expect.poll(() => fixture.writes.length).toBe(1);
    let combo = comboFor('compressor-b');
    await combo.locator('[data-equipment-category-toggle]').click();
    let options = page.locator(
      `[id="${await combo.locator('[data-equipment-category-input]').getAttribute('aria-controls')}"]`
    );
    await expect(options).toBeVisible();
    await expect(options.getByRole('option', { name: customCategory, exact: true })).toBeVisible();
    await expect(options.getByRole('option', { name: '3팀 전용 카테고리', exact: true })).toHaveCount(0);
    await page.screenshot({
      path: path.join(
        repoRoot,
        `kpi-runtime/internal-server/var/playwright-equipment-history/category-dropdown-${viewport.width}.png`
      ),
    });
    await options.getByRole('option', { name: customCategory, exact: true }).click();
    await expect(options).toBeHidden();
    await expect(preventive.locator('[data-equipment-preventive-category="compressor-b"]')).toHaveValue(customCategory);
    expect(fixture.writes).toHaveLength(1);
    await expectCategoryControlsAligned(preventive, 'compressor-b');
    await preventive.locator('[data-equipment-preventive-category-save="compressor-b"]').click();
    await expect.poll(() => fixture.writes.length).toBe(2);
    expect(
      fixture
        .getPayload()
        .equipmentList.filter((item) => item.teamDataKey === team2 && item.maintenanceCategory === '압축기')
    ).toHaveLength(0);
    expect(fixture.getPayload().maintenanceCategoriesByTeam[team2]).toEqual(
      expect.arrayContaining(['압축기', customCategory])
    );
    await page.reload();
    preventive = await openPreventive(page);
    combo = comboFor('pump-a');
    const input = preventive.locator('[data-equipment-preventive-category="pump-a"]');
    await combo.locator('[data-equipment-category-toggle]').click();
    options = page.locator(
      `[id="${await combo.locator('[data-equipment-category-input]').getAttribute('aria-controls')}"]`
    );
    await expect(options.getByRole('option', { name: '압축기', exact: true })).toBeVisible();
    await expect(options.getByRole('option', { name: customCategory, exact: true })).toBeVisible();
    await expect(options.getByRole('option', { name: '3팀 전용 카테고리', exact: true })).toHaveCount(0);
    await input.press('Escape');
    await expect(options).toBeHidden();
    await expect(preventive).toBeVisible();
    await expect(input).toHaveValue('펌프');
    await input.fill('');
    await input.press('ArrowDown');
    await expect(options).toBeVisible();
    const possibleValues = await options.getByRole('option').allTextContents();
    await input.press('Enter');
    await expect(options).toBeHidden();
    expect(possibleValues).toContain(await input.inputValue());
    expect(await input.inputValue()).not.toBe('');
    expect(fixture.writes).toHaveLength(2);
    await combo.locator('[data-equipment-category-toggle]').click();
    await expect(options).toBeVisible();
    await preventive.locator('#equipment-preventive-list-title').click();
    await expect(options).toBeHidden();
    expect(fixture.writes).toHaveLength(2);
    await page.reload();
    preventive = await openPreventive(page);
    for (const id of ['compressor-a', 'compressor-b']) {
      await expect(preventive.locator(`[data-equipment-preventive-category="${id}"]`)).toHaveValue(customCategory);
    }
    await expect(preventive.locator('[data-equipment-preventive-category="pump-a"]')).toHaveValue('펌프');
    await expectNoOverflow(page, preventive.locator('.data-equipment-preventive-panel'));
    await page.keyboard.press('Escape');
    preventive = await openPreventive(page, team3);
    const otherCombo = preventive.locator(
      '[data-equipment-preventive-equipment="team3-compressor"] .data-equipment-category-combo'
    );
    await otherCombo.locator('[data-equipment-category-toggle]').click();
    const otherOptions = page.locator(
      `[id="${await otherCombo.locator('[data-equipment-category-input]').getAttribute('aria-controls')}"]`
    );
    await expect(otherOptions.getByRole('option', { name: '3팀 전용 카테고리', exact: true })).toBeVisible();
    await expect(otherOptions.getByRole('option', { name: customCategory, exact: true })).toHaveCount(0);
    expect(fixture.writes).toHaveLength(2);
    expect(fixture.errors).toEqual([]);
  });

  test(`preventive list, editor and bulk dialog stay inside a ${viewport.width}px viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const fixture = await openFixture(page);
    const preventive = await openPreventive(page);
    await expectNoOverflow(page, preventive.locator('.data-equipment-preventive-panel'));
    if (viewport.width === 1440) {
      await page.screenshot({
        path: path.join(
          repoRoot,
          'kpi-runtime/internal-server/var/playwright-equipment-history/desktop-preventive.png'
        ),
        fullPage: true,
      });
    }
    await preventive.locator('[data-equipment-preventive-edit="compressor-a"]').click();
    await expectNoOverflow(page, preventive.locator('.data-equipment-preventive-panel'));
    await preventive.locator('[data-equipment-maintenance-batch="maintenanceHistory"]').click();
    const batch = page.locator('[data-equipment-maintenance-batch-dialog]');
    await expect(batch).toBeVisible();
    await expectNoOverflow(page, batch.locator(':scope > *').first());
    if (viewport.width === 390) {
      await page.screenshot({
        path: path.join(
          repoRoot,
          'kpi-runtime/internal-server/var/playwright-equipment-history/mobile-maintenance-batch.png'
        ),
      });
    }
    await batch.locator('[data-equipment-maintenance-batch-close]').first().click();
    await expect(batch).toHaveCount(0);
    await rowField(preventive, 'annualMaintenancePlan', 'maintenanceContent').fill('화면 크기별 공유 확인');
    await preventive.locator('[data-equipment-save]').click();
    const share = await expectShareDecision(page, fixture);
    await expectNoOverflow(page, share.locator(':scope > *').first());
    await shareGroup(share, 'pump-a').locator('[data-equipment-maintenance-share-category]').check();
    await share.locator('[data-equipment-maintenance-share-preview] summary').click();
    await expectNoOverflow(page, share.locator(':scope > *').first());
    if (viewport.width === 390) {
      await page.screenshot({
        path: path.join(
          repoRoot,
          'kpi-runtime/internal-server/var/playwright-equipment-history/mobile-maintenance-share.png'
        ),
      });
    }
    await share.locator('[data-equipment-maintenance-share-cancel]').first().click();
    await expect(share).toHaveCount(0);
    await page.reload();
    await page.locator('[data-equipment-board-card][data-equipment-open-card="compressor-a"]').click();
    await rowField(page, 'maintenanceHistory', 'content').fill('개별 카드의 카테고리 적용 화면');
    await page.keyboard.press('Control+s');
    const cardShare = await expectShareDecision(page, fixture);
    await expectNoOverflow(page, cardShare.locator(':scope > *').first());
    await page.screenshot({
      path: path.join(
        repoRoot,
        `kpi-runtime/internal-server/var/playwright-equipment-history/card-share-${viewport.width}.png`
      ),
    });
    await cardShare.locator('[data-equipment-maintenance-share-cancel]').first().click();
    expect(fixture.writes).toHaveLength(0);
    expect(fixture.errors).toEqual([]);
  });

  test(`all 66 team equipment remain scrollable and the last category saves at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const seed = makePayload();
    const initial = {
      meta: { fixtureMarker: 'long-team-list-preserved' },
      equipmentList: Array.from({ length: 66 }, (_, index) => ({
        ...structuredClone(seed.equipmentList[1]),
        id: `team3-equipment-${String(index + 1).padStart(2, '0')}`,
        name: `3팀 설비 ${String(index + 1).padStart(2, '0')}`,
        equipmentCode: `TEAM3-${index + 1}`,
        team: '3팀',
        teamDataKey: team3,
        futureMetadata: { originalIndex: index },
      })),
    };
    const fixture = await openFixture(page, initial);
    let preventive = await openPreventive(page, team3);
    const categorySelector = '[data-equipment-preventive-category="team3-equipment-66"]';
    await expect(preventive.locator('[data-equipment-preventive-category]')).toHaveCount(66);
    await expect(preventive.locator('[data-equipment-preventive-edit]')).toHaveCount(66);
    await expect(preventive.locator('[data-equipment-preventive-record-details][open]')).toHaveCount(0);
    await page.screenshot({
      path: path.join(
        repoRoot,
        `kpi-runtime/internal-server/var/playwright-equipment-history/team-66-first-${viewport.width}.png`
      ),
    });
    const measurements = await preventive.evaluate(async (dialog, selector) => {
      const content = dialog.querySelector('.data-equipment-preventive-content');
      const list = dialog.querySelector('.data-equipment-preventive-list');
      const target = dialog.querySelector(selector);
      const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const measure = () => {
        const contentBox = content.getBoundingClientRect();
        const listBox = list.getBoundingClientRect();
        const targetBox = target.getBoundingClientRect();
        const x = targetBox.left + targetBox.width / 2;
        const y = targetBox.top + targetBox.height / 2;
        const hit = document.elementFromPoint(x, y);
        return {
          gridAutoRows: getComputedStyle(content).gridAutoRows,
          contentHeight: content.clientHeight,
          contentScrollHeight: content.scrollHeight,
          contentScrollTop: content.scrollTop,
          listHeight: list.clientHeight,
          listScrollHeight: list.scrollHeight,
          listScrollTop: list.scrollTop,
          targetTop: targetBox.top,
          targetBottom: targetBox.bottom,
          contentTop: contentBox.top,
          contentBottom: contentBox.bottom,
          listTop: listBox.top,
          listBottom: listBox.bottom,
          fullyInContent: targetBox.top >= contentBox.top && targetBox.bottom <= contentBox.bottom,
          fullyInList: targetBox.top >= listBox.top && targetBox.bottom <= listBox.bottom,
          reachableByPointer: hit === target,
          visibleCategoryCount: Array.from(dialog.querySelectorAll('[data-equipment-preventive-category]')).filter(
            (input) => {
              const rect = input.getBoundingClientRect();
              return rect.top >= contentBox.top && rect.bottom <= contentBox.bottom;
            }
          ).length,
        };
      };
      const scrollToLast = async () => {
        content.scrollTop += target.getBoundingClientRect().top - content.getBoundingClientRect().top - 80;
        await nextFrame();
        return measure();
      };
      content.scrollTop = 0;
      const firstScreen = measure();
      content.style.gridAutoRows = 'auto';
      content.scrollTop = 0;
      await nextFrame();
      const priorGridSizing = await scrollToLast();
      content.style.gridAutoRows = '';
      content.scrollTop = 0;
      await nextFrame();
      const fixedGridSizing = await scrollToLast();
      return { firstScreen, priorGridSizing, fixedGridSizing };
    }, categorySelector);
    await fs.writeFile(
      testInfo.outputPath('long-team-list-layout.json'),
      JSON.stringify(measurements, null, 2),
      'utf8'
    );
    expect(measurements.firstScreen.visibleCategoryCount).toBeGreaterThanOrEqual(viewport.width === 1440 ? 4 : 1);
    expect(measurements.fixedGridSizing.listHeight).toBeGreaterThan(5000);
    expect(measurements.fixedGridSizing.fullyInContent, JSON.stringify(measurements)).toBe(true);
    expect(measurements.fixedGridSizing.fullyInList, JSON.stringify(measurements)).toBe(true);
    expect(measurements.fixedGridSizing.listScrollTop, JSON.stringify(measurements)).toBe(0);
    expect(measurements.fixedGridSizing.reachableByPointer, JSON.stringify(measurements)).toBe(true);
    await expectNoOverflow(page, preventive.locator('.data-equipment-preventive-panel'));
    await expect(preventive.locator(categorySelector)).toBeInViewport({ ratio: 1 });
    await preventive.locator(categorySelector).fill('마지막 설비에 직접 지정한 카테고리');
    await page.screenshot({
      path: path.join(
        repoRoot,
        `kpi-runtime/internal-server/var/playwright-equipment-history/team-66-last-${viewport.width}.png`
      ),
    });
    await preventive.locator('[data-equipment-preventive-category-save="team3-equipment-66"]').click();
    await expect.poll(() => fixture.writes.length).toBe(1);
    const expected = structuredClone(initial.equipmentList);
    expected[65].maintenanceCategory = '마지막 설비에 직접 지정한 카테고리';
    expect(fixture.getPayload().equipmentList).toEqual(expected);
    expect(fixture.getPayload().meta.fixtureMarker).toBe(initial.meta.fixtureMarker);
    await page.reload();
    preventive = await openPreventive(page, team3);
    await expect(preventive.locator('[data-equipment-preventive-category]')).toHaveCount(66);
    await expect(preventive.locator(categorySelector)).toHaveValue('마지막 설비에 직접 지정한 카테고리');
    await preventive.locator('[data-equipment-preventive-month="10"]').click();
    await expect(preventive.locator('[data-equipment-preventive-category]')).toHaveCount(66);
    await expect(preventive.locator('[data-equipment-preventive-edit]')).toHaveCount(66);
    expect(fixture.writes).toHaveLength(1);
    expect(fixture.errors).toEqual([]);
  });
}
