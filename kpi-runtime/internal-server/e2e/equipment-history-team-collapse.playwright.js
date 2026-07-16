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
  process.env.SUPERLOOPY_EVIDENCE || '.superloopy/evidence/frontend/20260715-equipment-team-collapse';
const evidenceRoot = path.resolve(repoRoot, evidenceRelativePath);

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
    throw new Error(payload?.error || scriptName + '_failed');
  }
  return payload;
}

async function createTempAdmin() {
  const token = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const credentials = {
    username: 'codex.equipment.collapse.' + token,
    password: 'Codex!' + token + '!Aa1',
  };
  await runUserScript('createManagedUserLocal.js', [
    '--username=' + credentials.username,
    '--displayName=Codex Equipment Collapse QA',
    '--password=' + credentials.password,
    '--roles=admin',
  ]);
  return credentials;
}

async function loginIfRequired(page, credentials) {
  await page.goto('/');
  if (!credentials) return;
  await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeVisible();
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('heading', { name: 'KPI Login' })).toBeHidden();
  await page.goto('/');
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
  expect(clicked, 'sidebar button ' + label + ' should exist').toBeTruthy();
  await page.waitForTimeout(250);
}

test('equipment-history team edit tools stay contextual without touching equipment data', async ({ page }) => {
  const bootstrapResponse = await page.request.get('/api/bootstrap/status');
  expect(bootstrapResponse.ok()).toBeTruthy();
  const bootstrapStatus = await bootstrapResponse.json();
  const loginRequired = Boolean(bootstrapStatus?.authEnabled && bootstrapStatus?.loginEnabled);
  const credentials = loginRequired ? await createTempAdmin() : null;
  const consoleErrors = [];
  const pageErrors = [];
  const equipmentWriteRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error?.message || String(error)));
  page.on('request', (request) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) return;
    if (!new URL(request.url()).pathname.endsWith('/records/data_equipment_history_card')) return;
    equipmentWriteRequests.push({ method: request.method(), url: request.url() });
  });

  try {
    await fs.mkdir(evidenceRoot, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 960 });
    await loginIfRequired(page, credentials);
    await expect(page.locator('#sidebar')).toBeVisible();
    await clickSidebarButton(page, '데이터 관리');
    await clickSidebarButton(page, '설비 이력');

    const board = page.locator('.equipment-history-skin .data-equipment-board');
    const summary = page.locator('.equipment-history-skin .data-equipment-index-summary');
    const maintenanceSummary = summary.locator(':scope > .is-check');
    const bulkActions = summary.locator(':scope > [data-equipment-bulk-actions]');
    const columns = board.locator('.data-equipment-board-column');
    await expect(board).toBeVisible();
    await expect(maintenanceSummary).toBeVisible();
    await expect(bulkActions).toBeVisible();
    const bulkActionLayout = await summary.evaluate((element) => {
      const maintenance = element.querySelector(':scope > .is-check');
      const actions = element.querySelector(':scope > [data-equipment-bulk-actions]');
      const maintenanceRect = maintenance?.getBoundingClientRect();
      const actionsRect = actions?.getBoundingClientRect();
      return {
        followsMaintenance: maintenance?.nextElementSibling === actions,
        horizontalGap: Math.round((actionsRect?.left || 0) - (maintenanceRect?.right || 0)),
        topOffset: Math.round((actionsRect?.top || 0) - (maintenanceRect?.top || 0)),
        heightOffset: Math.round((actionsRect?.height || 0) - (maintenanceRect?.height || 0)),
      };
    });
    expect(bulkActionLayout).toEqual({
      followsMaintenance: true,
      horizontalGap: 0,
      topOffset: 0,
      heightOffset: 0,
    });
    const columnCount = await columns.count();
    expect(columnCount).toBeGreaterThanOrEqual(5);
    await expect(board.locator('[data-equipment-team-collapse-toggle]')).toHaveCount(columnCount);

    const team = board.locator(
      '.data-equipment-board-column[data-equipment-board-team="work_team_calendar_team1_part1"]'
    );
    const teamHeader = team.locator(':scope > header');
    const collapseToggle = team.locator('[data-equipment-team-collapse-toggle]');
    const editToggle = team.locator('[data-equipment-edit-toggle-team]');
    const content = team.locator('[data-equipment-team-content]');
    const count = team.locator('.data-equipment-board-team-count');
    const addButton = team.locator('.data-equipment-board-team-title .data-equipment-board-add-button');
    const otherTeam = board.locator(
      '.data-equipment-board-column[data-equipment-board-team="work_team_calendar_team1_part2"]'
    );
    const otherEditToggle = otherTeam.locator('[data-equipment-edit-toggle-team]');
    const otherAddButton = otherTeam.locator('.data-equipment-board-team-title .data-equipment-board-add-button');
    const originalCardCount = await team.locator('.data-equipment-board-card').count();

    await expect(team).toBeVisible();
    await expect(teamHeader.locator('strong')).toHaveText('1팀 1파트');
    await expect(collapseToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(collapseToggle).toHaveAttribute('aria-label', '1팀 1파트 접기');
    await expect(collapseToggle).toHaveAttribute('aria-controls', await content.getAttribute('id'));
    await expect(content).toBeVisible();
    await expect(count).toBeVisible();
    await expect(addButton).toBeHidden();
    await expect(editToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(editToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(editToggle).toHaveAttribute('aria-label', '1팀 1파트 편집 모드 열기');
    await expect(editToggle.locator('i')).toHaveClass(/fa-pen/);
    await expect(board.locator('.data-equipment-board-column .data-equipment-board-add-button:visible')).toHaveCount(0);
    const controlLayout = await collapseToggle.evaluate((button) => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      const iconRect = button.querySelector('i')?.getBoundingClientRect();
      return {
        display: style.display,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        iconCentered: Boolean(
          iconRect &&
          Math.abs(iconRect.left + iconRect.width / 2 - (rect.left + rect.width / 2)) < 1 &&
          Math.abs(iconRect.top + iconRect.height / 2 - (rect.top + rect.height / 2)) < 1
        ),
      };
    });
    expect(controlLayout).toEqual({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      iconCentered: true,
    });
    await page.screenshot({ path: path.join(evidenceRoot, 'equipment-teams-expanded-1440.png'), fullPage: true });

    await collapseToggle.click();
    await expect(team).toHaveClass(/is-collapsed/);
    await expect(collapseToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(collapseToggle).toHaveAttribute('aria-label', '1팀 1파트 펼치기');
    await expect(content).toBeHidden();
    await expect(teamHeader.locator('strong')).toBeVisible();
    await expect(count).toBeVisible();
    await expect(addButton).toBeHidden();
    await expect(otherTeam).not.toHaveClass(/is-collapsed/);
    await expect(otherTeam).not.toHaveClass(/is-editing/);
    await expect(otherEditToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(otherAddButton).toBeHidden();
    await expect(otherTeam.locator('[data-equipment-team-content]')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: path.join(evidenceRoot, 'equipment-team-collapsed-1280.png'), fullPage: true });
    await page.getByRole('button', { name: '필터 초기화' }).click();
    await expect(team).toHaveClass(/is-collapsed/);
    await expect(collapseToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toBeHidden();

    await editToggle.click();
    await expect(team).not.toHaveClass(/is-collapsed/);
    await expect(team).toHaveClass(/is-ordering/);
    await expect(team).toHaveClass(/is-editing/);
    await expect(collapseToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(editToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(editToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(editToggle).toHaveAttribute('aria-label', '1팀 1파트 편집 모드 닫기');
    await expect(content).toBeVisible();
    await expect(addButton).toBeVisible();
    await expect(otherTeam).not.toHaveClass(/is-editing/);
    await expect(otherAddButton).toBeHidden();

    await collapseToggle.click();
    await expect(team).toHaveClass(/is-collapsed/);
    await expect(team).not.toHaveClass(/is-ordering/);
    await expect(team).not.toHaveClass(/is-editing/);
    await expect(editToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(editToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(editToggle).toHaveAttribute('aria-label', '1팀 1파트 편집 모드 열기');
    await expect(addButton).toBeHidden();
    await collapseToggle.focus();
    await page.keyboard.press('Enter');
    await expect(team).not.toHaveClass(/is-collapsed/);
    await expect(content).toBeVisible();
    await editToggle.click();
    await expect(team).toHaveClass(/is-editing/);
    await expect(addButton).toBeVisible();
    await editToggle.click();
    await expect(team).not.toHaveClass(/is-editing/);
    await expect(addButton).toBeHidden();
    await expect(team.locator('.data-equipment-board-card')).toHaveCount(originalCardCount);

    const populatedTeam = board
      .locator('.data-equipment-board-column:has(.data-equipment-board-room-add-button)')
      .first();
    await expect(populatedTeam).toBeVisible();
    const populatedTeamKey = await populatedTeam.getAttribute('data-equipment-board-team');
    const populatedEditToggle = populatedTeam.locator('[data-equipment-edit-toggle-team]');
    const populatedTeamAddButton = populatedTeam.locator(
      '.data-equipment-board-team-title .data-equipment-board-add-button'
    );
    const populatedRoomAddButtons = populatedTeam.locator('.data-equipment-board-room-add-button');
    const populatedCardTools = populatedTeam.locator('.data-equipment-board-card-tools');
    await populatedEditToggle.click();
    await expect(populatedTeam).toHaveClass(/is-editing/);
    await expect(populatedTeamAddButton).toBeVisible();
    await expect(populatedRoomAddButtons.first()).toBeVisible();
    await expect(populatedCardTools.first()).toBeVisible();
    await expect(populatedCardTools.first()).toHaveAttribute('aria-hidden', 'false');
    const visibleAddTeams = await board
      .locator('.data-equipment-board-column .data-equipment-board-add-button:visible')
      .evaluateAll((buttons) => [
        ...new Set(buttons.map((button) => button.closest('[data-equipment-board-team]')?.dataset.equipmentBoardTeam)),
      ]);
    expect(visibleAddTeams).toEqual([populatedTeamKey]);
    await page.screenshot({ path: path.join(evidenceRoot, 'equipment-team-edit-mode-1280.png'), fullPage: true });
    await populatedEditToggle.click();
    await expect(populatedTeam).not.toHaveClass(/is-editing/);
    await expect(populatedTeamAddButton).toBeHidden();
    await expect(board.locator('.data-equipment-board-column .data-equipment-board-add-button:visible')).toHaveCount(0);

    const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(desktopOverflow).toBeLessThanOrEqual(0);
    expect(equipmentWriteRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  } finally {
    if (credentials) await runUserScript('deleteUser.js', ['--username=' + credentials.username]);
  }
});
