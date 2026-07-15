import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const internalServerRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(__dirname, '../../..');
const execFileAsync = promisify(execFile);
const evidenceRelativePath =
  process.env.SUPERLOOPY_EVIDENCE || '.superloopy/evidence/frontend/20260715-utility-daily-delete';
const evidenceRoot = path.resolve(repoRoot, evidenceRelativePath);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createStoreFixture() {
  return {
    resourceType: 'electric',
    manualSaveHistory: [],
    resourceDatasets: {
      electric: {
        equipmentItems: [{ id: 'field_01', name: '배풍', factor: '1' }],
        equipmentEntries: {
          '2026-05-01': { values: { field_01: '100' }, completed: true, dayStatus: 'completed' },
          '2026-05-02': { values: { field_01: '200' }, completed: true, dayStatus: 'completed' },
        },
        teamMonthlyEntries: {},
        billingSettlementEntries: {},
      },
      gas: {
        equipmentItems: [{ id: 'gas_field_01', name: 'LNG 합계', factor: '1' }],
        equipmentEntries: {
          '2026-05-01': { values: { gas_field_01: '300' }, completed: true, dayStatus: 'completed' },
          '2026-05-02': { values: { gas_field_01: '400' }, completed: true, dayStatus: 'completed' },
        },
        teamMonthlyEntries: {},
        billingSettlementEntries: {},
      },
      waste: {
        equipmentEntries: {
          '2026-05-01': { values: { waste_field_01: '500' }, completed: true },
        },
        teamMonthlyEntries: { '2026-05': { waste_yusan: 25 } },
        billingSettlementEntries: {},
      },
      production: { monthlyEntries: { '2026-05': { yusan: 50 } } },
      other: { monthlyEntries: { '2026-05': { average_temperature: 20.5 } } },
    },
  };
}

async function runUserScript(scriptName, args) {
  const result = await execFileAsync(
    process.execPath,
    [path.join(internalServerRoot, 'src', 'scripts', scriptName), ...args],
    {
      cwd: internalServerRoot,
      env: process.env,
    }
  );
  const payload = JSON.parse(String(result.stdout || result.stderr || '{}').trim());
  if (!payload?.ok && payload?.error !== 'user_not_found') {
    throw new Error(payload?.error || `${scriptName}_failed`);
  }
  return payload;
}

async function createTempAdmin() {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const credentials = {
    username: `codex.utility.qa.${token}`,
    password: `Codex!${token}!Aa1`,
  };
  await runUserScript('createManagedUserLocal.js', [
    `--username=${credentials.username}`,
    '--displayName=Codex Utility QA',
    `--password=${credentials.password}`,
    '--roles=admin',
  ]);
  return credentials;
}

async function login(page, credentials) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeVisible();
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeHidden();
  await page.goto('/');
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.locator('#viewer-auth-identity')).toHaveText('Codex Utility QA');
}

async function clickSidebarButton(page, label) {
  await expect
    .poll(async () => {
      return await page
        .locator('#sidebar button')
        .evaluateAll((buttons) => buttons.map((button) => button.textContent?.trim() || ''));
    })
    .toContain(label);
  const clicked = await page.evaluate((targetLabel) => {
    const button = Array.from(document.querySelectorAll('#sidebar button')).find(
      (candidate) => candidate.textContent?.trim() === targetLabel
    );
    if (!button) return false;
    button.click();
    return true;
  }, label);
  expect(clicked, `sidebar button ${label} should exist`).toBeTruthy();
  await page.waitForTimeout(250);
}

test('utility daily delete is scoped, guarded, and visually adjacent to quick input', async ({ page }) => {
  const credentials = await createTempAdmin();
  let store = createStoreFixture();
  let putPayload = null;
  let putCount = 0;
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error?.message || String(error)));

  await page.route('**/api/modules/util_metering/records/*', async (route) => {
    const recordKey = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1) || '');
    const resourceType = {
      electric_v1: 'electric',
      gas_v1: 'gas',
      waste_v1: 'waste',
      other_v1: 'other',
    }[recordKey];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, record: { payload: clone(store.resourceDatasets[resourceType] || {}) } }),
    });
  });
  await page.route('**/api/shared-store', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          store: clone(store),
          meta: {
            version: 7,
            recordVersions: { electric_v1: 4, gas_v1: 5, waste_v1: 2, production_v1: 3, other_v1: 2 },
          },
        }),
      });
      return;
    }
    putCount += 1;
    putPayload = route.request().postDataJSON();
    await new Promise((resolve) => setTimeout(resolve, 600));
    store = clone(putPayload.store);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, meta: { version: 8 } }),
    });
  });

  try {
    await fs.mkdir(evidenceRoot, { recursive: true });
    await login(page, credentials);
    await clickSidebarButton(page, '데이터 관리');
    await clickSidebarButton(page, '유틸리티');

    const host = page.locator('[data-role="utility-entry-experiment"]');
    const dailyView = host.locator('.utility-entry-experiment-view.is-daily');
    const monthlyView = host.locator('.utility-entry-experiment-view.is-monthly');
    const deleteButton = dailyView.locator('[data-role="utility-entry-experiment-delete"]');
    const quickButton = dailyView.locator('[data-role="utility-entry-experiment-quick-toggle"]');
    const saveButton = dailyView.locator('[data-role="utility-entry-experiment-save"]');
    const state = dailyView.locator('[data-role="utility-entry-experiment-save-state"]');

    await expect(dailyView).toBeVisible();
    await expect(deleteButton).toHaveText('삭제');
    await expect(deleteButton).toHaveAttribute('aria-label', '선택 날짜 입력값 전체 삭제');
    await expect(monthlyView.locator('[data-role="utility-entry-experiment-delete"]')).toHaveCount(0);
    const placement = await dailyView
      .locator('[data-role="utility-entry-experiment-quick-entry"]')
      .evaluate((group) => {
        const quick = group.querySelector('[data-role="utility-entry-experiment-quick-toggle"]');
        const remove = group.querySelector('[data-role="utility-entry-experiment-delete"]');
        const quickRect = quick?.getBoundingClientRect();
        const deleteRect = remove?.getBoundingClientRect();
        return {
          adjacent: quick?.nextElementSibling === remove,
          sameRow: Boolean(quickRect && deleteRect && Math.abs(quickRect.top - deleteRect.top) < 1),
          ordered: Boolean(quickRect && deleteRect && deleteRect.left > quickRect.right),
        };
      });
    expect(placement).toEqual({ adjacent: true, sameRow: true, ordered: true });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: path.join(evidenceRoot, 'utility-daily-1280.png'), fullPage: true });
    await page.setViewportSize({ width: 768, height: 900 });
    await page.screenshot({ path: path.join(evidenceRoot, 'utility-daily-768.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(evidenceRoot, 'utility-daily-390.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });

    await dailyView.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('05');
    await expect(dailyView.locator('[data-role="utility-entry-experiment-daily-date"]')).toHaveValue('2026-05-01');
    await expect(dailyView.getByLabel('배풍 현재값').last()).toHaveValue('100');
    await expect(dailyView.locator('[aria-label="LNG 합계 현재값"]').last()).toHaveValue('300');

    let cancelledMessage = '';
    page.once('dialog', async (dialog) => {
      cancelledMessage = dialog.message();
      await dialog.dismiss();
    });
    await deleteButton.click();
    await expect.poll(() => putCount).toBe(0);
    expect(cancelledMessage).toBe('2026-05-01에 기입된 유틸리티 값이 삭제됩니다.\n정말 삭제하시겠습니까?');

    page.once('dialog', async (dialog) => dialog.accept());
    await deleteButton.click();
    await expect(deleteButton).toBeDisabled();
    await expect(saveButton).toBeDisabled();
    await expect(state).toHaveText('삭제 중');
    await expect(state).toHaveText('2026-05-01 삭제됨');
    await expect(deleteButton).toBeEnabled();
    await expect(saveButton).toBeEnabled();
    expect(putCount).toBe(1);
    expect(putPayload.expectedVersion).toBe(7);
    expect(putPayload.store.resourceDatasets.electric.equipmentEntries['2026-05-01']).toBeUndefined();
    expect(putPayload.store.resourceDatasets.gas.equipmentEntries['2026-05-01']).toBeUndefined();
    expect(putPayload.store.resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01).toBe('200');
    expect(putPayload.store.resourceDatasets.waste.equipmentEntries['2026-05-01'].values.waste_field_01).toBe('500');
    await expect(dailyView.getByLabel('배풍 현재값').last()).toHaveValue('');
    await expect(dailyView.locator('[aria-label="LNG 합계 현재값"]').last()).toHaveValue('');
    await page.screenshot({ path: path.join(evidenceRoot, 'utility-daily-deleted-1280.png'), fullPage: true });

    await dailyView.getByRole('tab', { name: '월간' }).click();
    await expect(monthlyView).toBeVisible();
    await expect(deleteButton).toBeHidden();
    const monthlyCipCards = monthlyView.locator('.utility-entry-experiment-settlement.is-cip');
    await expect(monthlyCipCards).toHaveCount(1);
    await expect(monthlyCipCards.locator('tbody th')).toHaveText(['1팀 1파트', '1팀 2파트', '2팀', '3팀']);
    await expect(monthlyCipCards.getByLabel('북정 CIP 횟수 1팀 1파트')).toHaveCount(1);
    await page.screenshot({ path: path.join(evidenceRoot, 'utility-monthly-cip-1280.png'), fullPage: true });
    await monthlyView.getByRole('tab', { name: '일간' }).click();
    await expect(dailyView).toBeVisible();

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desktopOverflow).toBeLessThanOrEqual(0);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await expect(quickButton).toBeVisible();

    await clickSidebarButton(page, '조도');
    const luxTeamLabels = page.locator('.audit-lux-index-year').first().locator('.audit-lux-index-team-label');
    await expect(luxTeamLabels).toHaveText(['1팀 1파트', '1팀 2파트', '2팀', '3팀']);
    await expect(page.locator('.audit-lux-index-panel')).not.toContainText('1팀 1파트 CIP');
    await page.screenshot({ path: path.join(evidenceRoot, 'audit-lux-team-labels-1280.png'), fullPage: true });
  } finally {
    await runUserScript('deleteUser.js', [`--username=${credentials.username}`]);
  }
});
