import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const internalServerRoot = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);
const luxWorkspaceSource = await fs.readFile(
  path.resolve(internalServerRoot, '../../audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);
const luxIconContext = {};
vm.createContext(luxIconContext);
vm.runInContext(luxWorkspaceSource, luxIconContext);
const expectedTeamColors = [
  ['team1part1', 'rgb(29, 78, 216)'],
  ['team1part2', 'rgb(217, 119, 6)'],
  ['team2', 'rgb(4, 120, 87)'],
  ['team3', 'rgb(91, 33, 182)'],
  ['team4', 'rgb(220, 38, 38)'],
];
const expectedIconPaths = [
  'M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z',
  'M4.5 15.5L15.7 6.1C16.7 5.3 18.2 5.7 18.7 6.9L21 12.2V18.5H4.5V15.5Z',
  'M5 9.2L12 12.8L19 9.2M5 9.2L8.2 5.5L12 7.4L15.8 5.5L19 9.2V16.8L12 20.5L5 16.8V9.2Z',
  'M10 3.5H14M10.6 3.5V6.4L8.8 8.4V19C8.8 20.1 9.7 21 10.8 21H13.2C14.3 21 15.2 20.1 15.2 19V8.4L13.4 6.4V3.5',
  'M6 18L14.8 9.2M13.5 6.2L17.8 10.5M16.2 4.5L19.5 7.8L17.8 10.5L13.5 6.2L16.2 4.5Z',
];
const teamFixtures = [
  ['team1part1', '1팀 1파트'],
  ['team1part2', '1팀 2파트'],
  ['team2', '2팀'],
  ['team3', '3팀'],
  ['team4', '공무환경팀'],
].map(([key, label]) => ({
  key,
  label,
  iconSvg: luxIconContext.getAuditLuxTeamIconSvg(label),
}));

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

async function createTempAdminUser() {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const credentials = {
    username: `codex.team-visual.${token}`,
    password: `Codex!${token}!Aa1`,
  };
  const result = await runLocalUserScript('createManagedUserLocal.js', [
    `--username=${credentials.username}`,
    '--displayName=Codex Team Visual E2E',
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

test('work history and illuminance reuse equipment team colors and icons', async ({ page, baseURL }) => {
  const statusResponse = await page.request.get(new URL('/api/bootstrap/status', baseURL).toString());
  expect(statusResponse.ok()).toBeTruthy();
  const bootstrapStatus = await statusResponse.json();
  const loginRequired = Boolean(bootstrapStatus?.authEnabled && bootstrapStatus?.loginEnabled);
  const credentials = loginRequired ? await createTempAdminUser() : null;

  try {
    await page.goto('/');
    if (loginRequired) {
      await page.getByLabel('Username').fill(credentials.username);
      await page.getByLabel('Password').fill(credentials.password);
      await page.getByRole('button', { name: 'Login' }).click();
    }
    await expect(page.locator('#sidebar')).toBeVisible();

    await page.evaluate(
      (teams) => {
        const fixture = document.createElement('section');
        fixture.className = 'audit-lux-index-year';
        fixture.setAttribute('data-e2e-lux-team-visuals', '');
        fixture.style.cssText =
          'position:fixed;inset:24px auto auto 24px;width:360px;z-index:99999;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.18)';
        fixture.innerHTML = `<div class="audit-lux-index-year-head"><h3>조도 팀 표시 검증</h3></div><div class="audit-lux-index-grid">${teams
          .map(
            (team) => `
            <article class="audit-lux-index-card is-${team.key} is-empty">
              <div class="audit-lux-index-team-cell">
                <strong class="audit-lux-index-team-label is-${team.key} kpi-team-display">
                  <span class="audit-lux-index-team-icon kpi-team-display-icon" aria-hidden="true">${team.iconSvg}</span>
                  <span class="kpi-team-display-name">${team.label}</span>
                </strong>
              </div>
              <div class="audit-lux-index-preview-cell"></div>
            </article>`
          )
          .join('')}</div>`;
        document.body.appendChild(fixture);
      },
      teamFixtures.slice(0, 4)
    );
    const luxFixture = page.locator('[data-e2e-lux-team-visuals]');
    await expect(luxFixture).toBeVisible();
    const luxCards = luxFixture.locator('.audit-lux-index-card');
    await expect(luxCards).toHaveCount(4);
    const luxVisuals = await luxCards.evaluateAll((cards) =>
      cards.map((card) => {
        const cell = card.querySelector('.audit-lux-index-team-cell');
        const icon = card.querySelector('.kpi-team-display-icon');
        const svg = icon?.querySelector('svg');
        const iconStyle = icon ? getComputedStyle(icon) : null;
        const cellStyle = cell ? getComputedStyle(cell) : null;
        return {
          teamClass:
            Array.from(card.classList)
              .find((name) => name.startsWith('is-team'))
              ?.replace(/^is-/, '') || '',
          iconColor: iconStyle?.color || '',
          iconSize: [iconStyle?.width || '', iconStyle?.height || ''],
          svgSize: svg ? [getComputedStyle(svg).width, getComputedStyle(svg).height] : [],
          hasTint: Boolean(cellStyle && cellStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'),
          hasAccentMarker: Boolean(cellStyle && cellStyle.boxShadow !== 'none'),
          fitsCell: Boolean(cell && cell.scrollWidth <= cell.clientWidth),
          iconPath: icon?.querySelector('path')?.getAttribute('d') || '',
        };
      })
    );
    expect(luxVisuals).toEqual(
      expectedTeamColors.slice(0, 4).map(([teamClass, color], index) => ({
        teamClass,
        iconColor: color,
        iconSize: ['24px', '24px'],
        svgSize: ['16px', '16px'],
        hasTint: true,
        hasAccentMarker: true,
        fitsCell: true,
        iconPath: expectedIconPaths[index],
      }))
    );
    await test.info().attach('illuminance-team-display', {
      body: await luxFixture.screenshot(),
      contentType: 'image/png',
    });
    await luxFixture.evaluate((fixture) => fixture.remove());

    await page.evaluate(async (teams) => {
      const host = document.createElement('div');
      host.setAttribute('data-e2e-work-team-visuals', '');
      host.style.cssText =
        'position:fixed;inset:24px;z-index:99999;overflow:auto;background:#f3f4f6;box-shadow:0 8px 24px rgba(15,23,42,.18)';
      const root = host.attachShadow({ mode: 'open' });
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '/team-report/runtime/work/history/KPI.work.history.css';
      const loaded = new Promise((resolve, reject) => {
        stylesheet.addEventListener('load', () => resolve(true), { once: true });
        stylesheet.addEventListener('error', () => reject(new Error('work history stylesheet failed to load')), {
          once: true,
        });
      });
      const surface = document.createElement('div');
      surface.className = 'work-history-app';
      surface.innerHTML = `<section class="work-history-experiment-board">${teams
        .map(
          (team) => `
            <section class="work-history-experiment-team ${team.key}">
              <header class="work-history-experiment-team-head">
                <span class="work-history-experiment-team-title">
                  <strong class="work-history-experiment-team-name kpi-team-display">
                    <span class="work-history-experiment-team-icon kpi-team-display-icon" aria-hidden="true">${team.iconSvg}</span>
                    <span class="kpi-team-display-name">${team.label}</span>
                  </strong>
                  <span class="work-history-experiment-team-count">1건</span>
                </span>
              </header>
            </section>`
        )
        .join('')}</section>`;
      root.append(stylesheet, surface);
      document.body.appendChild(host);
      await loaded;
    }, teamFixtures);
    const workHost = page.locator('[data-e2e-work-team-visuals]');
    await expect(workHost).toBeVisible();
    await expect
      .poll(() =>
        workHost.evaluate(
          (host) => getComputedStyle(host.shadowRoot?.querySelector('.work-history-experiment-team')).borderTopWidth
        )
      )
      .toBe('3px');
    const workVisuals = await workHost.evaluate((host) => {
      const root = host.shadowRoot;
      if (!root) return [];
      return Array.from(root.querySelectorAll('.work-history-experiment-team')).map((section) => {
        const header = section.querySelector('.work-history-experiment-team-head');
        const icon = section.querySelector('.kpi-team-display-icon');
        const svg = icon?.querySelector('svg');
        const count = section.querySelector('.work-history-experiment-team-count');
        const sectionStyle = getComputedStyle(section);
        const headerStyle = header ? getComputedStyle(header) : null;
        const iconStyle = icon ? getComputedStyle(icon) : null;
        return {
          teamClass: Array.from(section.classList).find((name) => /^team(?:1part[12]|[2-4])$/.test(name)) || '',
          topBorder: [sectionStyle.borderTopWidth, sectionStyle.borderTopColor],
          iconColor: iconStyle?.color || '',
          iconSize: [iconStyle?.width || '', iconStyle?.height || ''],
          svgSize: svg ? [getComputedStyle(svg).width, getComputedStyle(svg).height] : [],
          hasTint: Boolean(headerStyle && headerStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'),
          countColor: count ? getComputedStyle(count).color : '',
          iconPath: icon?.querySelector('path')?.getAttribute('d') || '',
        };
      });
    });
    expect(workVisuals).toEqual(
      expectedTeamColors.map(([teamClass, color], index) => ({
        teamClass,
        topBorder: ['3px', color],
        iconColor: color,
        iconSize: ['24px', '24px'],
        svgSize: ['16px', '16px'],
        hasTint: true,
        countColor: color,
        iconPath: expectedIconPaths[index],
      }))
    );
    await test.info().attach('work-history-team-display', {
      body: await workHost.screenshot(),
      contentType: 'image/png',
    });
  } finally {
    if (credentials?.username) await deleteTempUser(credentials.username);
  }
});
