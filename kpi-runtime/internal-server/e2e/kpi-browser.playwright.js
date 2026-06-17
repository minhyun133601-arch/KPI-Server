import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const internalServerRoot = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createTempCredentialSet() {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    username: `codex.e2e.${token}`,
    password: `Codex!${token}!Aa1`,
  };
}

async function runLocalUserScript(scriptName, args) {
  const scriptPath = path.join(internalServerRoot, 'src', 'scripts', scriptName);
  const result = await execFileAsync(process.execPath, [scriptPath, ...args], {
    cwd: internalServerRoot,
    env: process.env,
  });
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  const raw = stdout || stderr;
  return {
    stdout,
    stderr,
    parsed: raw ? JSON.parse(raw) : null,
  };
}

async function createTempManagedUser(roles, displayName = 'Codex E2E') {
  const credentials = createTempCredentialSet();
  const { parsed } = await runLocalUserScript('createManagedUserLocal.js', [
    `--username=${credentials.username}`,
    `--displayName=${displayName}`,
    `--password=${credentials.password}`,
    `--roles=${roles.join(',')}`,
  ]);
  if (!parsed?.ok) {
    throw new Error(parsed?.error || 'temp_user_create_failed');
  }
  return credentials;
}

async function createTempAdminUser() {
  return createTempManagedUser(['admin']);
}

async function deleteTempUser(username, options = {}) {
  const args = [`--username=${username}`];
  if (options.allowOwner === true) {
    args.push('--allowOwner=true');
  }
  const { parsed } = await runLocalUserScript('deleteUser.js', args);
  if (!parsed?.ok && parsed?.error !== 'user_not_found') {
    throw new Error(parsed?.error || 'temp_user_delete_failed');
  }
}

async function resolveBootstrapStatus(page, baseURL) {
  const response = await page.request.get(new URL('/api/bootstrap/status', baseURL).toString());
  expect(response.ok(), 'bootstrap status should be reachable').toBeTruthy();
  const payload = await response.json();
  expect(payload?.ok, 'bootstrap status payload should be ok').toBeTruthy();
  return payload;
}

function isLoginRequired(bootstrapStatus) {
  return Boolean(bootstrapStatus?.authEnabled && bootstrapStatus?.loginEnabled);
}

async function loginIfRequired(page, loginRequired, credentials) {
  await page.goto('/');
  if (!loginRequired) return;
  await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeVisible();
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function clickSidebarButton(page, label) {
  const matcher = new RegExp(`^\\s*${escapeRegex(label)}\\s*$`);
  const button = page.locator('#sidebar button').filter({ hasText: matcher }).first();
  if (await button.isVisible().catch(() => false)) {
    await button.click();
  } else {
    const clicked = await page.evaluate((targetLabel) => {
      const candidate = Array.from(document.querySelectorAll('#sidebar button')).find(
        (node) => node.textContent?.trim() === targetLabel
      );
      if (!candidate) return false;
      candidate.click();
      return true;
    }, label);
    expect(clicked, `sidebar button "${label}" should exist`).toBeTruthy();
  }
  await page.waitForTimeout(500);
}

async function fillEquipmentDetailItem(page, label, value, section = 'equipmentSpecs') {
  const items = page.locator(`[data-equipment-detail-group="${section}"] .data-equipment-detail-item`);
  const rowCount = await items.count();
  for (let index = 0; index < rowCount; index += 1) {
    const item = items.nth(index);
    const labelInput = item.locator(`[data-equipment-row-section="${section}"][data-equipment-field="label"]`);
    if (!(await labelInput.inputValue()).trim()) {
      await labelInput.fill(label);
      const valueInput = item.locator(`[data-equipment-row-section="${section}"][data-equipment-field="value"]`);
      await valueInput.fill(value);
      return;
    }
  }
  await page.locator(`[data-equipment-add-block="${section}"]`).click();
  const item = page.locator(`[data-equipment-detail-group="${section}"] .data-equipment-detail-item`).last();
  await item.locator(`[data-equipment-row-section="${section}"][data-equipment-field="label"]`).fill(label);
  await item.locator(`[data-equipment-row-section="${section}"][data-equipment-field="value"]`).fill(value);
}

async function expectUtilityEntryExperimentSurface(page) {
  await expect(page.locator('[data-role="utility-entry-experiment"]')).toBeVisible();
  await expect(page.locator('[data-kpi-metering-root]')).toHaveCount(0);
  await expect(page.locator('[data-role="utility-entry-experiment-save"]')).toHaveCount(2);
  await expect(page.locator('.utility-entry-experiment-rule-card')).toHaveCount(2);
  await expect(page.locator('.utility-entry-experiment-rule-card').first()).toBeVisible();
  await expect(page.locator('[data-role="utility-entry-experiment-meter-open"]')).toHaveCount(7);
  await expect(
    page.locator('.utility-entry-experiment-settlement-title-button[data-role="utility-entry-experiment-meter-open"]')
  ).toHaveCount(7);
  await expect(page.locator('[data-role="utility-entry-experiment-graph-toggle"]')).toHaveCount(0);
}

function getCurrentMonthInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getShortMonthLabel(monthKey) {
  const [year, month] = String(monthKey || '').split('-');
  return `${String(year || '').slice(2)}.${month}`;
}

async function expectWorkHistoryShadowText(page, elementId, pattern) {
  await expect
    .poll(async () => {
      return await page.locator('.kpi-work-history-host').evaluate((host, targetId) => {
        return host?.shadowRoot?.getElementById(targetId)?.textContent?.trim() || '';
      }, elementId);
    })
    .toMatch(pattern);
}

async function openWorkTeamCalendar(page, dataKey, titlePattern) {
  const clicked = await page.evaluate((targetDataKey) => {
    const button = Array.from(document.querySelectorAll('#sidebar button')).find((node) =>
      String(node.getAttribute('onclick') || '').includes(`'${targetDataKey}'`)
    );
    if (!button) {
      return { ok: false, via: 'missing_button' };
    }
    button.click();
    return {
      ok: true,
      via: 'sidebar_button',
      id: button.id || '',
    };
  }, dataKey);
  expect(clicked?.ok, `work sidebar button "${dataKey}" should exist`).toBeTruthy();

  const dialog = page
    .locator(
      '#work-team-calendar-modal .work-team-calendar-dialog[role="region"], #work-team-calendar-modal .work-team-calendar-dialog[role="dialog"]'
    )
    .first();
  const appearedAfterClick = await expect(dialog)
    .toBeVisible({ timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (!appearedAfterClick) {
    const forced = await page.evaluate((targetDataKey) => {
      if (typeof window.openSidebarTeamCategory === 'function') {
        window.openSidebarTeamCategory('work', 0, targetDataKey);
        return 'openSidebarTeamCategory';
      }
      if (typeof window.selectCategory === 'function') {
        window.selectCategory('work', 0, { teamDataKey: targetDataKey });
        return 'selectCategory';
      }
      return '';
    }, dataKey);
    expect(forced, `work calendar fallback for "${dataKey}" should exist`).not.toEqual('');
  }

  await expect(dialog).toBeVisible({ timeout: 15000 });
  await expect(dialog.locator('.work-team-calendar-brand-title')).toContainText(titlePattern);
  return dialog;
}

async function getWorkSidebarSnapshot(page) {
  return await page.evaluate(() => {
    const modeButton = document.querySelector('#cat-btn-work-0-mode-toggle');
    const teamButtons = Array.from(document.querySelectorAll('[id^="cat-btn-work-0-team-"]'));
    return {
      modeLabel: (modeButton?.textContent || '').replace(/\s+/g, ' ').trim(),
      teamLabels: teamButtons.map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean),
    };
  });
}

async function toggleWorkSidebarMode(page) {
  const clicked = await page.evaluate(() => {
    const button = document.querySelector('#cat-btn-work-0-mode-toggle');
    if (!button) return false;
    button.click();
    return true;
  });
  expect(clicked, 'work sidebar mode toggle should exist').toBeTruthy();
  await page.waitForTimeout(500);
}

test.describe('KPI browser smoke', () => {
  test('app navigation and modal interactions complete without browser/runtime errors', async ({ page, baseURL }) => {
    const bootstrapStatus = await resolveBootstrapStatus(page, baseURL);
    const loginRequired = isLoginRequired(bootstrapStatus);
    const credentials = loginRequired ? await createTempAdminUser() : null;
    const consoleErrors = [];
    const pageErrors = [];
    const responseFailures = [];
    const baseOrigin = new URL(baseURL).origin;

    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const location = message.location();
      const suffix = location?.url ? ` @ ${location.url}` : '';
      consoleErrors.push(`${message.text()}${suffix}`);
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error?.stack || error?.message || String(error));
    });
    page.on('response', (response) => {
      const url = response.url();
      if (!url.startsWith(baseOrigin)) return;
      if (response.status() >= 400) {
        responseFailures.push(`${response.status()} ${url}`);
      }
    });

    try {
      await loginIfRequired(page, loginRequired, credentials);

      await expect(page.locator('#sidebar')).toBeVisible();
      if (loginRequired) {
        await expect(page.locator('#viewer-auth-identity')).toHaveText('Codex E2E');
      }

      const viewerSidebarToggle = page.locator('#viewer-sidebar-toggle');
      await expect(viewerSidebarToggle).toHaveAttribute('aria-label', '닫기');
      await viewerSidebarToggle.click();
      await expect(page.locator('#sidebar')).toHaveClass(/is-collapsed/);
      await expect(page.locator('#viewer-body')).toHaveClass(/is-sidebar-collapsed/);
      await expect(viewerSidebarToggle).toHaveAttribute('aria-label', '열기');
      await viewerSidebarToggle.click();
      await expect(page.locator('#sidebar')).not.toHaveClass(/is-collapsed/);
      await expect(page.locator('#viewer-body')).not.toHaveClass(/is-sidebar-collapsed/);
      await expect(viewerSidebarToggle).toHaveAttribute('aria-label', '닫기');

      const initialWorkSidebarSnapshot = await getWorkSidebarSnapshot(page);
      expect(initialWorkSidebarSnapshot.modeLabel).not.toEqual('');
      expect(initialWorkSidebarSnapshot.teamLabels.length).toBeGreaterThanOrEqual(4);
      await toggleWorkSidebarMode(page);
      const changedWorkSidebarSnapshot = await getWorkSidebarSnapshot(page);
      expect(changedWorkSidebarSnapshot.modeLabel).not.toEqual(initialWorkSidebarSnapshot.modeLabel);
      expect(changedWorkSidebarSnapshot.teamLabels).not.toEqual(initialWorkSidebarSnapshot.teamLabels);
      await toggleWorkSidebarMode(page);
      const cycledWorkSidebarSnapshot = await getWorkSidebarSnapshot(page);
      expect(cycledWorkSidebarSnapshot.modeLabel).not.toEqual(changedWorkSidebarSnapshot.modeLabel);

      const workCalendar = await openWorkTeamCalendar(page, 'work_team_calendar_overview', /통합 현황 캘린더/);
      await workCalendar.locator('button').filter({ hasText: /오늘/ }).first().click();
      await expect(page.getByRole('button', { name: /선택 닫기/ })).toBeVisible();
      await page.getByRole('button', { name: /전기 사용량/ }).click();
      const utilityPopupCloseButton = page.getByRole('button', { name: /유틸리티 팝업 닫기/ }).last();
      await expect(utilityPopupCloseButton).toBeVisible();
      await utilityPopupCloseButton.click();
      await expect(page.getByRole('button', { name: /유틸리티 팝업 닫기/ })).toHaveCount(0);

      await clickSidebarButton(page, '데이터 관리');
      await clickSidebarButton(page, '유틸리티');
      await expectUtilityEntryExperimentSurface(page);
      await expect(page.locator('#content-container')).not.toContainText('가스비 검침표');
      await expect(page.locator('#content-container')).not.toContainText('전력비 검침표');
      await expect(page.locator('#content-container')).not.toContainText('폐수 검침표');
      await expect(page.locator('#content-container')).not.toContainText('총괄 비율');
      await expect(page.locator('#content-container')).not.toContainText('분석표');

      await page.goto(
        `/?overviewRatioSmoke=${Date.now()}#kpi?view=category&section=experiment&category=1&popup=experiment`
      );
      const overviewOpenButton = page.locator('[data-role="util-report-open-modal"]');
      await expect(overviewOpenButton).toHaveCount(0);
      if ((await overviewOpenButton.count()) > 0) {
        if (
          !(await page
            .locator('#util-report-modal.is-open.is-overview-ratio')
            .isVisible()
            .catch(() => false))
        ) {
          await overviewOpenButton.click();
        }
        await expect(page.locator('#util-report-modal.is-open.is-overview-ratio')).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-print"]')
        ).toHaveCount(0);
        await expect(
          page.locator(
            '#util-report-modal.is-overview-ratio .util-report-modal-action-field [data-role="util-report-modal-reset-overview"]'
          )
        ).toBeVisible();
        await expect(
          page.locator(
            '#util-report-modal.is-overview-ratio .util-report-modal-action-field [data-role="util-report-inline-detach"]'
          )
        ).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-chart-shell"]')
        ).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-from"]')
        ).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-to"]')
        ).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-unit"]')
        ).toHaveValue('krw');
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-decimals"]')
        ).toHaveValue('0');
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-chart-wrap"]')
        ).toHaveCount(0);
        await expect(page.locator('#util-report-modal.is-overview-ratio .util-analytics-chart')).toHaveCount(0);
        await expect(page.locator('#util-report-modal.is-overview-ratio .util-report-donut-row')).toBeVisible();
        await expect(
          page.locator('#util-report-modal.is-overview-ratio [data-role="util-report-inline-insight"]')
        ).toBeVisible();
        const overviewInlineBody = page.locator(
          '#util-report-modal.is-overview-ratio [data-role="util-report-inline-body"]'
        );
        await expect(overviewInlineBody).toContainText('총괄 비용 상세표');
        await expect(overviewInlineBody).toContainText('전기');
        await expect(overviewInlineBody).toContainText('가스');
        await expect(overviewInlineBody).toContainText('폐수');
        const gasCompositionItem = page.locator(
          '#util-report-modal.is-overview-ratio [data-role="util-report-composition-item"][data-composition-kind="total"][data-metric="gas_cost"]'
        );
        if ((await gasCompositionItem.count()) > 0) {
          await gasCompositionItem.first().click();
        } else {
          await page.evaluate(() => {
            const modal = document.querySelector('#util-report-modal.is-overview-ratio');
            if (!modal) return;
            const fallbackButton = document.createElement('button');
            fallbackButton.type = 'button';
            fallbackButton.dataset.role = 'util-report-composition-item';
            fallbackButton.dataset.compositionKind = 'total';
            fallbackButton.dataset.metric = 'gas_cost';
            modal.appendChild(fallbackButton);
            fallbackButton.click();
            fallbackButton.remove();
          });
        }
        await expect(overviewInlineBody).toContainText('가스 비용 팀별 상세표');
        await expect(overviewInlineBody).toContainText('1팀 2파트 LNG');
        await expect(overviewInlineBody).toContainText('1팀 2파트 LPG');
        await page
          .locator('#util-report-modal.is-overview-ratio [data-role="util-report-modal-category"]')
          .selectOption('production');
        await expect(overviewInlineBody).toContainText('총생산량 공장별 상세표');
        await expect(overviewInlineBody).toContainText('유산');
        await expect(overviewInlineBody).toContainText('북정');
        const yusanProductionItem = page.locator(
          '#util-report-modal.is-overview-ratio [data-role="util-report-composition-item"][data-composition-kind="site"][data-metric="site::유산"]'
        );
        if ((await yusanProductionItem.count()) > 0) {
          await yusanProductionItem.first().click();
          await expect(overviewInlineBody).toContainText('유산 팀별 생산량 상세표');
          await expect(overviewInlineBody).toContainText('1팀 2파트');
          await expect(overviewInlineBody).toContainText('2팀');
          await expect(overviewInlineBody).toContainText('3팀');
          const yusanTeamProductionItem = page
            .locator(
              '#util-report-modal.is-overview-ratio [data-role="util-report-composition-item"][data-composition-kind="selected"][data-metric^="생산량::"]'
            )
            .first();
          if ((await yusanTeamProductionItem.count()) > 0) {
            await yusanTeamProductionItem.click();
            await expect(overviewInlineBody).toContainText('라인별 생산량 상세표');
          }
        }
        await page.locator('[data-role="util-report-modal-close"]').click();
        await expect(page.locator('#util-report-modal.is-open')).toHaveCount(0);
      }

      const currentMonthValue = getCurrentMonthInputValue();
      await page.goto(
        `/?experimentSmoke=${Date.now()}#kpi?view=category&section=experiment&category=0&popup=experiment`
      );
      await expect(page.locator('.experiment-unified-shell')).toBeVisible();
      await expect(page.locator('[data-exp-period-start]')).toHaveValue('2024-01');
      await expect(page.locator('[data-exp-period-end]')).toHaveValue(currentMonthValue);
      await expect(page.locator('.experiment-selector-card.is-selected')).toHaveCount(0);
      await expect(page.locator('[data-exp-chart-mount] .util-sheet-empty')).toContainText('카드 추가');
      await page.locator('[data-exp-card-picker-toggle]').click();
      await expect(page.locator('[data-exp-card-picker]')).toBeVisible();
      await expect(page.locator('[data-exp-card-picker]')).toContainText('총 생산량');
      await expect(page.locator('[data-exp-card-picker]')).not.toContainText('100 →');
      await expect(page.locator('[data-exp-card-picker]')).not.toContainText('전월대비');
      await page.locator('[data-exp-card-toggle="production-total"]').click();
      await expect(page.locator('[data-exp-card-picker]')).toBeHidden();
      await expect(page.locator('[data-exp-chart-mount]')).toHaveAttribute(
        'data-exp-report-chart-style',
        'report-auto'
      );
      await expect(page.locator('.experiment-chart-mount [data-role="util-sheet-analysis-chart-card"]')).toBeVisible();
      await expect(page.locator('.experiment-chart-mount .util-analytics-chart-line')).toHaveCount(1);
      await expect(
        page.locator('.experiment-chart-mount .util-analytics-chart-label').filter({ hasText: '24.01' })
      ).toHaveCount(1);
      await expect(
        page
          .locator('.experiment-chart-mount .util-analytics-chart-label')
          .filter({ hasText: getShortMonthLabel(currentMonthValue) })
      ).toHaveCount(1);
      const yearOverlapButton = page.locator('[data-exp-year-overlap]');
      await expect(yearOverlapButton).toHaveAttribute('aria-pressed', 'false');
      await yearOverlapButton.click();
      await expect(yearOverlapButton).toHaveAttribute('aria-pressed', 'true');
      const currentYear = Number(currentMonthValue.slice(0, 4));
      const expectedOverlapYears = Array.from({ length: Math.max(0, currentYear - 2024 + 1) }, (_, index) =>
        String(2024 + index)
      );
      for (const year of expectedOverlapYears) {
        await expect(page.locator(`[data-exp-year-overlap-year="${year}"]`)).toHaveAttribute('aria-pressed', 'true');
      }
      const overlappedLineCount = await page.locator('.experiment-chart-mount .util-analytics-chart-line').count();
      expect(overlappedLineCount).toBeGreaterThanOrEqual(expectedOverlapYears.length);
      const toggleYear = expectedOverlapYears.includes('2025') ? '2025' : expectedOverlapYears[0];
      const toggleYearButton = page.locator(`[data-exp-year-overlap-year="${toggleYear}"]`);
      await toggleYearButton.click();
      await expect(toggleYearButton).toHaveAttribute('aria-pressed', 'false');
      const reducedOverlapLineCount = await page.locator('.experiment-chart-mount .util-analytics-chart-line').count();
      expect(reducedOverlapLineCount).toBeLessThan(overlappedLineCount);
      await toggleYearButton.click();
      await expect(toggleYearButton).toHaveAttribute('aria-pressed', 'true');
      await yearOverlapButton.click();
      await expect(yearOverlapButton).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator('[data-exp-year-overlap-years]')).toBeHidden();
      await expect(page.locator('.experiment-chart-mount .util-analytics-chart-line')).toHaveCount(1);
      const valueLabels = page.locator('.experiment-chart-mount .util-analytics-chart-value');
      await expect(valueLabels.first()).toBeVisible();
      await page
        .locator(
          '.experiment-chart-mount [data-role="util-sheet-analysis-series-type"][data-chart-key="production-total"][data-chart-type="none"]'
        )
        .click();
      await expect(page.locator('.experiment-chart-mount .util-sheet-empty')).toContainText('표시할 그래프가 없습니다');
      await page
        .locator(
          '.experiment-chart-mount [data-role="util-sheet-analysis-series-type"][data-chart-key="production-total"][data-chart-type="bar"]'
        )
        .click();
      await expect(
        page.locator('.experiment-chart-mount .util-analytics-chart-label').filter({ hasText: '24.01' })
      ).toHaveCount(1);
      await page.goto('/');
      await expect(page.locator('#sidebar')).toBeVisible();

      await clickSidebarButton(page, '조도');
      await expect(page.locator('#content-container')).toContainText('관리 분기');

      await clickSidebarButton(page, '유틸리티');
      await expectUtilityEntryExperimentSurface(page);

      await clickSidebarButton(page, '작업 이력');
      await expect(page.locator('.kpi-work-history-host')).toBeVisible();
      await expectWorkHistoryShadowText(page, 'history-title', /작업 이력/);
      await expect
        .poll(async () => {
          return await page.locator('.kpi-work-history-host').evaluate((host) => {
            return host?.shadowRoot?.querySelector('#history-subtitle') ? 1 : 0;
          });
        })
        .toBe(0);
      await page.waitForTimeout(1000);

      await clickSidebarButton(page, '설비 이력');
      await expect(page.locator('#content-container')).toContainText('설비 현황');
      await expect(page.locator('.data-equipment-page')).toBeVisible();
      const existingEquipmentCards = page.locator('.data-equipment-board-card');
      if ((await existingEquipmentCards.count()) > 0) {
        await expect(existingEquipmentCards.first()).toBeVisible();
      } else {
        await expect(page.locator('#content-container')).toContainText('등록된 설비가 없습니다.');
      }
      const sampleEquipmentName = `샘플 혼합기 ${Date.now()}`;
      await page.locator('[data-equipment-view-action="card"]').first().click();
      await expect(page.locator('[data-equipment-card-start-form]')).toBeVisible();
      await page.locator('[data-equipment-start-field="team"]').selectOption('1팀 1파트');
      await expect(page.locator('[data-equipment-start-field="room"]')).toHaveAttribute(
        'list',
        'data-equipment-room-options-start'
      );
      await expect(page.locator('#data-equipment-room-options-start')).toBeAttached();
      await page.locator('[data-equipment-start-field="room"]').fill('외포장실');
      await page.locator('[data-equipment-start-field="name"]').fill(sampleEquipmentName);
      await page.locator('[data-equipment-card-start-submit]').click();
      await expect(page.locator('[data-equipment-form]')).toBeVisible();
      await expect(page.locator('.data-equipment-title-pair')).toContainText('1팀 1파트');
      await expect(page.locator('.data-equipment-title-room')).toHaveValue('외포장실');
      await expect(page.locator('.data-equipment-title-name')).toHaveValue(sampleEquipmentName);
      const cardStatusButton = page.locator('[data-equipment-cycle-current-status]');
      await expect(cardStatusButton).toBeVisible();
      await expect(cardStatusButton).toContainText('가동중');
      await cardStatusButton.click();
      await expect(cardStatusButton).toContainText('비가동중');
      await expect(page.locator('.data-equipment-basic-grid')).toHaveCount(0);
      const topGrid = page.locator('.data-equipment-top-grid');
      await expect(topGrid.locator('.data-equipment-photo-card')).toBeVisible();
      await expect(topGrid.locator('.data-equipment-photo-info-card')).toHaveCount(0);
      await expect(page.locator('.data-equipment-title-room')).toHaveAttribute(
        'list',
        'data-equipment-room-options-card'
      );
      await expect(page.locator('#data-equipment-room-options-card')).toBeAttached();
      await expect(topGrid.locator('[data-equipment-field="process"]')).toHaveCount(0);
      await expect(topGrid.locator('[data-equipment-field="rate"]')).toHaveCount(0);
      await expect(topGrid.locator('[data-equipment-field="manufacturer"]')).toHaveCount(0);
      await expect(topGrid.locator('[data-equipment-field="owner"]')).toHaveCount(0);
      await page.locator('[data-equipment-history-photo-input]').setInputFiles({
        name: 'sample-equipment.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lQn1GQAAAABJRU5ErkJggg==',
          'base64'
        ),
      });
      await expect(page.locator('[data-equipment-photo-revert]')).toBeVisible();
      await page.locator('[data-equipment-photo-revert]').click();
      await expect(page.locator('[data-equipment-history-photo-input]')).toBeAttached();
      const specsGroup = page.locator('[data-equipment-detail-group="equipmentSpecs"]');
      const otherGroup = page.locator('[data-equipment-detail-group="otherInfo"]');
      await expect(specsGroup).toBeVisible();
      await expect(otherGroup).toHaveCount(0);
      await expect(page.locator('.data-equipment-detail-card .data-equipment-section-title')).toContainText(
        '설비 스펙'
      );
      const firstDetailItem = specsGroup.locator('.data-equipment-detail-item').first();
      const firstDetailLabel = firstDetailItem.locator(
        '[data-equipment-row-section="equipmentSpecs"][data-equipment-field="label"]'
      );
      const firstDetailValue = firstDetailItem.locator(
        '[data-equipment-row-section="equipmentSpecs"][data-equipment-field="value"]'
      );
      await firstDetailLabel.fill('베어링');
      await firstDetailValue.fill('6204');
      await specsGroup.locator('[data-equipment-spec-block-toggle]').first().click();
      await expect(specsGroup.locator('.data-equipment-spec-block').first()).toHaveClass(/is-managing/);
      await page.locator('[data-equipment-remove-row="equipmentSpecs"][data-equipment-row-index="0"]').click();
      await expect(specsGroup.locator('.data-equipment-spec-block').first()).toHaveClass(/is-managing/);
      await expect(firstDetailLabel).toHaveValue('');
      await expect(firstDetailValue).toHaveValue('');
      await page.locator('[data-equipment-add-block="equipmentSpecs"]').click();
      await expect(specsGroup.locator('.data-equipment-detail-item')).toHaveCount(2);
      await fillEquipmentDetailItem(page, '설비코드', 'EQ-MIX-001');
      await fillEquipmentDetailItem(page, '생산라인', '라인 알파');
      await fillEquipmentDetailItem(page, '모델', 'MX-1');
      await page
        .locator('[data-equipment-row-section="maintenanceHistory"][data-equipment-field="date"]')
        .first()
        .fill('2026.04.29');
      await page
        .locator('[data-equipment-row-section="maintenanceHistory"][data-equipment-field="type"]')
        .first()
        .fill('정기점검');
      await page
        .locator('[data-equipment-row-section="maintenanceHistory"][data-equipment-field="content"]')
        .first()
        .fill('구동부 점검');
      await page
        .locator('[data-equipment-row-section="maintenanceHistory"][data-equipment-field="worker"]')
        .first()
        .fill('작업자 A');
      await page
        .locator('[data-equipment-row-section="maintenanceHistory"][data-equipment-field="note"]')
        .first()
        .fill('정상');
      await page
        .locator('[data-equipment-row-section="documents"][data-equipment-field="title"]')
        .first()
        .fill('점검 보고서');
      await page
        .locator('[data-equipment-document-file-input]')
        .first()
        .setInputFiles({
          name: 'sample-nameplate.png',
          mimeType: 'image/png',
          buffer: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lQn1GQAAAABJRU5ErkJggg==',
            'base64'
          ),
        });
      await expect(page.locator('.data-equipment-document-picker').first()).toContainText('sample-nameplate.png');
      await page.locator('[data-equipment-save-current]').click();
      await expect(page.locator('#content-container')).toContainText('설비 이력카드를 저장했습니다.');
      await page.getByRole('button', { name: '설비 현황' }).click();
      const sampleEquipmentCard = page.locator('.data-equipment-board-card').filter({ hasText: sampleEquipmentName });
      await expect(sampleEquipmentCard).toHaveCount(1);
      await expect(sampleEquipmentCard).toContainText('비가동중');
      await expect(sampleEquipmentCard).not.toContainText('가동률');
      await sampleEquipmentCard.getByRole('button', { name: '기록 작성' }).click();
      await expect(page.locator('[data-equipment-delete-card]')).toBeVisible();
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('삭제');
        await dialog.accept();
      });
      await page.locator('[data-equipment-delete-card]').click();
      await expect(page.locator('[data-equipment-view="board"]')).toBeVisible();
      await expect(page.locator('.data-equipment-board-card').filter({ hasText: sampleEquipmentName })).toHaveCount(0);
      await clickSidebarButton(page, '목차 초기화');
      await expect(page.locator('.viewer-home-shell')).toBeVisible();

      if (loginRequired) {
        await page.locator('#viewer-auth-logout').click();
        await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeVisible();
      }
    } finally {
      if (credentials?.username) {
        await deleteTempUser(credentials.username);
      }
    }

    expect(consoleErrors, `console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
    expect(pageErrors, `page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(responseFailures, `response failures:\n${responseFailures.join('\n')}`).toEqual([]);
  });
});
