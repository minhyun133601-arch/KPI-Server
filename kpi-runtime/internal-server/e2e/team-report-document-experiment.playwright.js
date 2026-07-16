import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const internalServerRoot = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);

async function runLocalUserScript(scriptName, args) {
  const result = await execFileAsync(
    process.execPath,
    [path.join(internalServerRoot, 'src', 'scripts', scriptName), ...args],
    {
      cwd: internalServerRoot,
      env: process.env,
    }
  );
  const raw = String(result.stdout || result.stderr || '').trim();
  return raw ? JSON.parse(raw) : null;
}

async function createTempAdminUser(username) {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const credentials = {
    username,
    password: `Codex!${token}!Aa1`,
  };
  const result = await runLocalUserScript('createManagedUserLocal.js', [
    `--username=${credentials.username}`,
    '--displayName=Codex Team Report LAB E2E',
    `--password=${credentials.password}`,
    '--roles=admin',
  ]);
  expect(result?.ok, result?.error || 'temporary admin creation failed').toBeTruthy();
  return credentials;
}

async function deleteTempUser(username) {
  const result = await runLocalUserScript('deleteUser.js', [`--username=${username}`]);
  expect(
    result?.ok || result?.error === 'user_not_found',
    result?.error || 'temporary user deletion failed'
  ).toBeTruthy();
}

test('team report LAB renders the document surface and can return to the original', async ({ page, baseURL }) => {
  const experimentUsername = String(process.env.KPI_TEAM_REPORT_DOCUMENT_EXPERIMENT_USERNAME || '').trim();
  test.skip(
    !experimentUsername.startsWith('codex.team-report-lab.'),
    'verification runtime must target a disposable team report experiment account'
  );
  const statusResponse = await page.request.get(new URL('/api/bootstrap/status', baseURL).toString());
  expect(statusResponse.ok()).toBeTruthy();
  const bootstrapStatus = await statusResponse.json();
  const loginRequired = Boolean(bootstrapStatus?.authEnabled && bootstrapStatus?.loginEnabled);
  const credentials = loginRequired ? await createTempAdminUser(experimentUsername) : null;

  try {
    await page.goto('/');
    if (loginRequired) {
      await page.getByLabel('Username').fill(credentials.username);
      await page.getByLabel('Password').fill(credentials.password);
      await page.getByRole('button', { name: 'Login' }).click();
    }

    await expect(page.locator('#sidebar')).toBeVisible();
    await page
      .getByRole('button', { name: /팀별내역서/ })
      .first()
      .click();
    const labButton = page.locator('#cat-btn-work-2');
    await expect(labButton).toContainText('팀별내역서 LAB');
    await expect(labButton).toBeVisible();
    await labButton.click();

    const dialog = page.locator('.work-team-calendar-dialog.is-team-report-experiment');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.work-team-calendar-experiment-badge')).toHaveText('실험 화면');
    await expect(dialog.locator('.work-team-calendar-mode-segment')).toHaveCount(3);
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(6);
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(0)).toHaveText('팀별');
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(1)).toHaveText('공정별');
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(2)).toHaveText('공장별');
    await expect(page.locator('#sidebar')).toHaveClass(/is-team-report-experiment/);

    const processModeButton = dialog.locator('[data-work-team-mode="process"]');
    await processModeButton.click();
    await expect(processModeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(4);
    expect(await processModeButton.evaluate((node) => document.activeElement === node)).toBeTruthy();

    const processTeamButton = dialog.locator('[data-work-team-switch]').nth(1);
    await processTeamButton.click();
    await expect(processTeamButton).toHaveAttribute('aria-pressed', 'true');
    expect(await processTeamButton.evaluate((node) => document.activeElement === node)).toBeTruthy();
    await expect(dialog).toHaveClass(/is-team-report-experiment/);

    await dialog.locator('[data-work-team-mode="detail"]').click();
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(6);

    const experimentStyles = await dialog.evaluate((node) => {
      const topbar = node.querySelector('.work-team-calendar-topbar');
      const switches = node.querySelector('.work-team-calendar-switches');
      const board = node.querySelector('.work-team-calendar-board');
      return {
        topbarBackground: topbar ? getComputedStyle(topbar).backgroundColor : '',
        switchDisplay: switches ? getComputedStyle(switches).display : '',
        switchOverflowX: switches ? getComputedStyle(switches).overflowX : '',
        boardRadius: board ? getComputedStyle(board).borderRadius : '',
      };
    });
    expect(experimentStyles.topbarBackground).toBe('rgb(255, 255, 255)');
    expect(experimentStyles.switchDisplay).toBe('flex');
    expect(['auto', 'scroll']).toContain(experimentStyles.switchOverflowX);
    expect(experimentStyles.boardRadius).toBe('8px');

    await page.screenshot({
      path: path.join(internalServerRoot, 'var', 'playwright', 'team-report-document-experiment.png'),
      fullPage: true,
    });

    await page.locator('#cat-btn-work-0-team-0').click();
    await expect(page.locator('.work-team-calendar-dialog')).toBeVisible();
    await expect(page.locator('.work-team-calendar-dialog')).not.toHaveClass(/is-team-report-experiment/);
  } finally {
    if (credentials?.username) await deleteTempUser(credentials.username);
  }
});
