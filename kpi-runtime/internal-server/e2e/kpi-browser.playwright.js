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

async function expectIntegratedMeteringTitle(page, titlePattern) {
  await expect(page.locator('[data-kpi-metering-root]')).toBeVisible();
  await expect
    .poll(async () => {
      return await page.evaluate(() => {
        const host = document.querySelector('[data-kpi-metering-root]');
        return host?.shadowRoot?.getElementById('appTitle')?.textContent?.trim() || '';
      });
    })
    .toMatch(titlePattern);
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
      await clickSidebarButton(page, '유틸리티 기입');
      await expectIntegratedMeteringTitle(page, /월간 (전기 기입|가스 검침|폐수 기입|생산량 기입) 시트/);

      await clickSidebarButton(page, '분석');
      await expect(page.locator('#content-container')).toContainText('총괄 비율');
      const totalRatioOpenButton = page.locator('[data-role="util-report-open-modal"]').first();
      await expect(totalRatioOpenButton).toBeVisible();
      await totalRatioOpenButton.click();
      await expect(page.locator('#util-report-modal.is-open.is-overview-ratio')).toBeVisible();
      await expect(
        page.locator('[data-role="util-report-modal-total-donut"] .util-report-composition-donut svg').first()
      ).toBeVisible();
      await expect(
        page.locator('[data-role="util-report-modal-selected-donut"] .util-report-composition-donut svg').first()
      ).toBeVisible();
      await expect(page.locator('[data-role="util-report-modal-chart-wrap"]')).toHaveCount(0);
      await expect(page.locator('[data-role="util-report-modal-chart-type-toggle"]')).toHaveCount(0);
      await expect(page.locator('[data-role="util-report-modal-chart-fullscreen-toggle"]')).toHaveCount(0);
      await expect(page.locator('[data-role="util-report-modal-show-labels"]')).toHaveCount(0);
      await expect(page.locator('[data-role="util-report-inline-body"]')).toBeVisible();
      await page.locator('[data-role="util-report-modal-close"]').click();
      await expect(page.locator('#util-report-modal.is-open')).toHaveCount(0);
      const analysisToggleButton = page
        .locator('#content-container button')
        .filter({ hasText: /검침표|분석표/ })
        .first();
      await expect(analysisToggleButton).toBeVisible();
      const analysisToggleLabel = String(await analysisToggleButton.textContent()).trim();
      const toggledAnalysisLabel = analysisToggleLabel === '검침표' ? '분석표' : '검침표';
      await expect(page.locator('#content-container')).toContainText(
        analysisToggleLabel === '검침표' ? '가스비 검침표' : '가스비 분석표'
      );
      await analysisToggleButton.click();
      await expect(
        page
          .locator('#content-container button')
          .filter({ hasText: new RegExp(toggledAnalysisLabel) })
          .first()
      ).toBeVisible();
      await expect(page.locator('#content-container')).toContainText(
        toggledAnalysisLabel === '검침표' ? '가스비 검침표' : '가스비 분석표'
      );

      await clickSidebarButton(page, '조도 (Lux)');
      await expect(page.locator('#content-container')).toContainText('조도 입력');

      await clickSidebarButton(page, '법정 설비 관리');
      await expect(page.locator('#content-container')).toContainText('법정 설비');
      await expect(page.locator('#content-container')).toContainText('법정 설비 점검');
      await expect(page.locator('.audit-legal-dashboard')).toBeVisible();
      await expect(page.locator('.audit-legal-entry-form')).toBeVisible();
      await expect(page.locator('#content-container')).toContainText('보일러 설비 추가');
      await expect(page.locator('#content-container')).toContainText('정기검사');
      await expect(page.locator('#content-container')).toContainText('사용검사');
      await expect(page.locator('#content-container')).toContainText('선임');
      await expect(page.locator('[data-audit-legal-open-category-inspection="boiler"]')).toBeVisible();
      await expect(page.locator('[data-audit-legal-category="elevator"]')).toBeVisible();
      await expect(page.locator('#content-container')).toContainText('승강기');
      await expect(page.locator('[data-audit-legal-calendar-toggle]')).toHaveAttribute('aria-expanded', 'true');
      await page.locator('[data-audit-legal-calendar-toggle]').click();
      await expect(page.locator('[data-audit-legal-calendar-toggle]')).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator('.audit-legal-calendar-month-watermark')).toHaveCount(0);
      await page.locator('[data-audit-legal-calendar-toggle]').click();
      await expect(page.locator('[data-audit-legal-calendar-toggle]')).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('[data-audit-legal-calendar-shift="-1"]')).toBeVisible();
      await expect(page.locator('[data-audit-legal-calendar-shift="1"]')).toBeVisible();
      await expect(page.locator('[data-audit-legal-calendar-year]')).toBeVisible();
      await expect(page.locator('[data-audit-legal-calendar-month]')).toBeVisible();
      await expect(page.locator('.audit-legal-calendar-month-watermark')).toBeVisible();
      const legalCalendarMonth = page.locator('[data-audit-legal-calendar-month]');
      const initialLegalCalendarMonth = await legalCalendarMonth.inputValue();
      await page.locator('[data-audit-legal-calendar-shift="1"]').click();
      await expect(legalCalendarMonth).not.toHaveValue(initialLegalCalendarMonth);
      const legalOpenInspectionButtons = page.locator('[data-audit-legal-open-inspection]');
      if ((await legalOpenInspectionButtons.count()) === 0) {
        for (const itemType of ['fire', 'electric', 'environment', 'elevator', 'other']) {
          await page.locator(`[data-audit-legal-category="${itemType}"]`).click();
          if ((await legalOpenInspectionButtons.count()) > 0) break;
        }
      }
      if ((await legalOpenInspectionButtons.count()) > 0) {
        await expect(page.locator('#content-container')).toContainText('남은 관리 일정');
        await expect(page.locator('#content-container')).toContainText('날짜 미등록');
        await expect(page.locator('#content-container')).toContainText('선임일');
        await expect(page.locator('#content-container')).toContainText('다음 교육일');
        await expect(legalOpenInspectionButtons.first()).toBeVisible();
        await legalOpenInspectionButtons.first().click();
        const legalInspectionForm = page.locator('[data-audit-legal-inspection-form]').first();
        await expect(legalInspectionForm.locator('[data-audit-legal-inspection-input="cycle"]')).toBeVisible();
        await legalInspectionForm.locator('[data-audit-legal-inspection-input="lastDate"]').fill('2026-01-10');
        await legalInspectionForm.locator('[data-audit-legal-inspection-input="cycle"]').selectOption('6개월');
        await expect(legalInspectionForm.locator('[data-audit-legal-inspection-input="nextDate"]')).toHaveValue(
          '2026-07-10'
        );
        await expect(page.locator('[data-audit-legal-delete-facility]').first()).toBeVisible();
      } else {
        await expect(page.locator('#content-container')).toContainText('등록된 설비가 없습니다');
        await expect(page.locator('[data-audit-legal-form]')).toBeVisible();
        await expect(page.locator('[data-audit-legal-input="facility"]')).toBeVisible();
      }
      await expect(page.locator('#content-container')).not.toContainText('중요 알림');
      await expect(page.locator('#content-container')).not.toContainText('프리뷰');
      await expect(page.locator('#content-container')).not.toContainText('법정 설비 목록');
      await expect(page.locator('#content-container')).not.toContainText('문서 현황');
      await expect(page.locator('.audit-legal-popup')).toHaveCount(0);
      await expect(page.locator('.audit-legal-popup-launch')).toHaveCount(0);

      await clickSidebarButton(page, '유틸리티 기입');
      await expectIntegratedMeteringTitle(page, /월간 (전기 기입|가스 검침|폐수 기입|생산량 기입) 시트/);
      await page.waitForTimeout(1000);

      await clickSidebarButton(page, '작업 이력 기입');
      await expect(page.locator('.kpi-work-history-host')).toBeVisible();
      await expectWorkHistoryShadowText(page, 'history-title', /팀별내역서 작업내역/);
      await expectWorkHistoryShadowText(
        page,
        'history-subtitle',
        /기간별 작업자, 구분, 비용과 문서 첨부까지 기록하는 통합 작업내역 도구/
      );
      await page.waitForTimeout(1000);

      await clickSidebarButton(page, '설비 이력 카드');
      await expect(page.locator('#content-container')).toContainText('설비 현황');
      await expect(page.locator('.data-equipment-page')).toBeVisible();
      const existingEquipmentCards = page.locator('.data-equipment-board-card');
      if ((await existingEquipmentCards.count()) > 0) {
        await expect(existingEquipmentCards.first()).toBeVisible();
      } else {
        await expect(page.locator('#content-container')).toContainText('등록된 설비가 없습니다.');
      }
      const sampleEquipmentName = `샘플 혼합기 ${Date.now()}`;
      await page.locator('[data-equipment-view-action="card"]').click();
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
      await expect(page.locator('[data-equipment-status-toggle="가동중"]')).toHaveAttribute('aria-pressed', 'true');
      await page.locator('[data-equipment-status-toggle="비가동중"]').click();
      await expect(page.locator('[data-equipment-status-toggle="비가동중"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.data-equipment-basic-grid')).toHaveCount(0);
      const topGrid = page.locator('.data-equipment-top-grid');
      await expect(topGrid.locator('.data-equipment-photo-card')).toBeVisible();
      await expect(topGrid.locator('.data-equipment-photo-info-card')).toBeVisible();
      await expect(topGrid.locator('[data-equipment-field="room"]')).toHaveAttribute(
        'list',
        'data-equipment-room-options-card'
      );
      await expect(page.locator('#data-equipment-room-options-card')).toBeAttached();
      await topGrid.locator('[data-equipment-field="process"]').fill('혼합 공정');
      await topGrid.locator('[data-equipment-field="rate"]').fill('88');
      await topGrid.locator('[data-equipment-field="manufacturer"]').fill('샘플 제조사');
      await topGrid.locator('[data-equipment-field="owner"]').fill('ABC 정비');
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
