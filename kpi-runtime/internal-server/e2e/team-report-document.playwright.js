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

async function createTempAdminUser() {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const credentials = {
    username: `codex.team-report.${token}`,
    password: `Codex!${token}!Aa1`,
  };
  const result = await runLocalUserScript('createManagedUserLocal.js', [
    `--username=${credentials.username}`,
    '--displayName=Codex Team Report E2E',
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

async function openProductionMenu(menu, toggle) {
  if ((await menu.getAttribute('open')) === null) {
    await toggle.click();
  }
  await expect(menu).toHaveAttribute('open', '');
}

test('team report document is canonical and includes production input and delete management', async ({
  page,
  baseURL,
}) => {
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

    const sidebar = page.locator('#sidebar');
    const sidebarTree = page.locator('.sidebar-tree-shell');
    const teamReportButton = page.locator('#section-btn-work');
    const dialog = page.locator('.work-team-calendar-dialog.is-team-report-document');
    const readSidebarDesign = (sectionId) =>
      sidebar.evaluate((root, targetSectionId) => {
        const tree = root.querySelector('.sidebar-tree-shell');
        const sectionButton = root.querySelector(`#section-btn-${targetSectionId}`);
        const sectionIcon = sectionButton?.querySelector('.sidebar-group-icon');
        const rootStyle = getComputedStyle(root);
        const treeStyle = tree ? getComputedStyle(tree) : null;
        const buttonStyle = sectionButton ? getComputedStyle(sectionButton) : null;
        const iconStyle = sectionIcon ? getComputedStyle(sectionIcon) : null;
        return {
          width: rootStyle.width,
          padding: rootStyle.padding,
          backgroundColor: rootStyle.backgroundColor,
          treeGap: treeStyle?.gap || '',
          buttonMinHeight: buttonStyle?.minHeight || '',
          buttonPadding: buttonStyle?.padding || '',
          buttonRadius: buttonStyle?.borderRadius || '',
          iconWidth: iconStyle?.width || '',
          iconHeight: iconStyle?.height || '',
          iconRadius: iconStyle?.borderRadius || '',
        };
      }, sectionId);

    await expect(sidebar).toBeVisible();
    await expect(teamReportButton).toBeVisible();
    await expect(teamReportButton).toContainText(/팀별내역서/);
    await expect(teamReportButton).toHaveAttribute('aria-current', 'page');
    await expect(sidebar.getByRole('button', { name: '팀별내역서', exact: true })).toHaveCount(1);
    await expect(teamReportButton.locator('.sidebar-group-chevron')).toHaveCount(0);
    await expect(sidebar).not.toHaveClass(/is-team-report-document/);
    await expect(sidebarTree).not.toHaveClass(/is-team-report-document/);
    const canonicalSidebarDesign = await readSidebarDesign('work');
    expect(canonicalSidebarDesign).toEqual({
      width: '248px',
      padding: '10px 8px',
      backgroundColor: 'rgb(255, 255, 255)',
      treeGap: '2px',
      buttonMinHeight: '42px',
      buttonPadding: '6px 8px',
      buttonRadius: '6px',
      iconWidth: '28px',
      iconHeight: '28px',
      iconRadius: '6px',
    });
    await expect(page.locator('#sidebar button[id^="cat-btn-work-"]')).toHaveCount(0);
    await expect(teamReportButton.locator('xpath=..').locator('.sidebar-group-items')).toHaveCount(0);
    await expect(page.locator('[id^="cat-btn-work-0-team-"]')).toHaveCount(0);
    await expect(page.locator('#cat-btn-work-0-mode-toggle')).toHaveCount(0);
    await expect(sidebar).not.toContainText(/LAB|\uAE30\uC874 \uD654\uBA74/);
    await expect(
      page.locator(
        '.is-team-report-experiment, .work-team-calendar-experiment-nav, .work-team-calendar-experiment-badge'
      )
    ).toHaveCount(0);

    await expect(dialog).toBeVisible();
    await expect(page.locator('.viewer-home-shell')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.history.state?.route || null))
      .toMatchObject({
        view: 'category',
        sectionId: 'work',
        categoryIndex: 0,
      });
    expect(new URL(page.url()).hash).not.toContain('navCategory=');

    await teamReportButton.click();
    await expect(sidebar.getByRole('button', { name: '팀별내역서', exact: true })).toHaveCount(1);
    await expect(page.locator('#sidebar button[id^="cat-btn-work-"]')).toHaveCount(0);
    await expect(dialog).toBeVisible();

    await page.reload();
    await expect(teamReportButton).toHaveAttribute('aria-current', 'page');
    await expect(sidebar.getByRole('button', { name: '팀별내역서', exact: true })).toHaveCount(1);
    await expect(page.locator('#sidebar button[id^="cat-btn-work-"]')).toHaveCount(0);
    await expect(sidebar).not.toHaveClass(/is-team-report-document/);
    await expect(sidebarTree).not.toHaveClass(/is-team-report-document/);
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.history.state?.route || null))
      .toMatchObject({
        view: 'category',
        sectionId: 'work',
        categoryIndex: 0,
        navSectionId: 'work',
        navCategoryIndex: 0,
      });
    const documentNav = dialog.locator('.work-team-calendar-document-nav');
    const fullscreenToggle = documentNav.locator('[data-action="work-team-calendar-toggle-fullscreen"]');
    await expect(documentNav).toBeVisible();
    await expect(fullscreenToggle).toBeVisible();
    await expect(fullscreenToggle).toHaveAttribute('onclick', 'toggleWorkTeamCalendarFullscreen()');
    await expect(dialog.locator('.work-team-calendar-head')).toHaveCount(0);
    await expect(dialog.locator('.work-team-calendar-brand-title')).toHaveCount(0);
    await expect(dialog.locator('.work-team-calendar-brand-sub')).toHaveCount(0);
    await expect(dialog.locator('.work-team-calendar-mode-segment')).toHaveCount(3);
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(6);
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(0)).toHaveText('팀별');
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(1)).toHaveText('공정별');
    await expect(dialog.locator('.work-team-calendar-mode-segment').nth(2)).toHaveText('공장별');
    await expect(dialog).not.toContainText('실험 화면');
    await expect(dialog).not.toContainText('LAB');

    await dialog.locator('[data-work-team-switch="work_team_calendar_overview"]').click();
    const overviewUtilityLabels = dialog.locator('.work-team-calendar-utility-label');
    await expect(overviewUtilityLabels.filter({ hasText: /^전기 사용량$/ })).toHaveCount(1);
    await expect(overviewUtilityLabels.filter({ hasText: /^가스 사용량$/ })).toHaveCount(1);
    await expect(overviewUtilityLabels.filter({ hasText: /^총 생산량$/ })).toHaveCount(1);
    await expect(overviewUtilityLabels.filter({ hasText: /^총생산량$/ })).toHaveCount(0);

    const overviewUtilityAlignment = await dialog
      .locator('.work-team-calendar-utility-strip')
      .first()
      .evaluate((strip) => {
        const definitions = [
          ['electric', '전기 사용량'],
          ['gas', '가스 사용량'],
          ['production', '총 생산량'],
        ];
        const getBox = (root, selector) => {
          const rect = root?.querySelector(selector)?.getBoundingClientRect();
          const rootRect = root?.getBoundingClientRect();
          return rect && rootRect
            ? {
                centerY: rect.top + rect.height / 2 - rootRect.top,
                top: rect.top - rootRect.top,
                bottom: rect.bottom - rootRect.top,
              }
            : null;
        };
        const chips = Array.from(strip.querySelectorAll('.work-team-calendar-utility-chip'));
        return Object.fromEntries(
          definitions.map(([key, label]) => {
            const chip = chips.find(
              (candidate) => candidate.querySelector('.work-team-calendar-utility-label')?.textContent?.trim() === label
            );
            return [
              key,
              chip
                ? {
                    label: getBox(chip, '.work-team-calendar-utility-label'),
                    value: getBox(chip, '.work-team-calendar-utility-value'),
                    meta: getBox(chip, '.work-team-calendar-utility-meta'),
                    alignContent: getComputedStyle(chip).alignContent,
                    fontFamily: getComputedStyle(chip).fontFamily,
                    flowRowCount: Array.from(chip.children).filter((child) => {
                      const style = getComputedStyle(child);
                      return style.display !== 'none' && style.position !== 'absolute';
                    }).length,
                  }
                : null,
            ];
          })
        );
      });
    expect(Object.values(overviewUtilityAlignment).every(Boolean)).toBeTruthy();
    for (const rowName of ['label', 'value', 'meta']) {
      const rowCenters = Object.values(overviewUtilityAlignment).map((metric) => metric[rowName].centerY);
      expect(Math.max(...rowCenters) - Math.min(...rowCenters)).toBeLessThanOrEqual(0.5);
    }
    expect(overviewUtilityAlignment.electric.alignContent).toBe('start');
    expect(overviewUtilityAlignment.gas.alignContent).toBe('start');
    expect(overviewUtilityAlignment.production.alignContent).toBe('start');
    expect(new Set(Object.values(overviewUtilityAlignment).map((metric) => metric.fontFamily)).size).toBe(1);
    expect(Object.values(overviewUtilityAlignment).every((metric) => metric.flowRowCount === 3)).toBeTruthy();
    await expect(dialog.locator('.work-team-calendar-utility-hint')).toHaveCount(0);

    const processModeButton = dialog.locator('[data-work-team-mode="process"]');
    await processModeButton.click();
    await expect(processModeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(4);
    expect(await processModeButton.evaluate((node) => document.activeElement === node)).toBeTruthy();

    const processTeamButton = dialog.locator('[data-work-team-switch]').nth(1);
    await processTeamButton.click();
    await expect(processTeamButton).toHaveAttribute('aria-pressed', 'true');
    expect(await processTeamButton.evaluate((node) => document.activeElement === node)).toBeTruthy();

    const groupModeButton = dialog.locator('[data-work-team-mode="group"]');
    await groupModeButton.click();
    await expect(groupModeButton).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(4);

    await dialog.locator('[data-work-team-mode="detail"]').click();
    await expect(dialog.locator('[data-work-team-switch]')).toHaveCount(6);
    await dialog.locator('[data-work-team-switch="work_team_calendar_team1_part1"]').click();

    const documentStyles = await dialog.evaluate((node) => {
      const topbar = node.querySelector('.work-team-calendar-topbar');
      const switches = node.querySelector('.work-team-calendar-switches');
      const board = node.querySelector('.work-team-calendar-board');
      return {
        topbarBackground: topbar ? getComputedStyle(topbar).backgroundColor : '',
        topbarOverflow: topbar ? getComputedStyle(topbar).overflow : '',
        switchDisplay: switches ? getComputedStyle(switches).display : '',
        switchOverflowX: switches ? getComputedStyle(switches).overflowX : '',
        boardRadius: board ? getComputedStyle(board).borderRadius : '',
      };
    });
    expect(documentStyles.topbarBackground).toBe('rgb(255, 255, 255)');
    expect(documentStyles.topbarOverflow).toBe('visible');
    expect(documentStyles.switchDisplay).toBe('flex');
    expect(['auto', 'scroll']).toContain(documentStyles.switchOverflowX);
    expect(documentStyles.boardRadius).toBe('8px');

    const gasChoiceLayout = await dialog
      .locator('.work-team-calendar-utility-label')
      .filter({ hasText: /^가스 사용량$/ })
      .first()
      .evaluate((label) => {
        const chip = label.closest('.work-team-calendar-utility-chip');
        chip.classList.add('has-gas-choices');
        const choices = document.createElement('div');
        choices.className = 'work-team-calendar-utility-choices';
        choices.innerHTML = `
          <button type="button" class="work-team-calendar-utility-choice is-active">전체</button>
          <button type="button" class="work-team-calendar-utility-choice">LNG</button>
          <button type="button" class="work-team-calendar-utility-choice">LPG</button>
        `;
        chip.append(choices);
        const value = chip.querySelector('.work-team-calendar-utility-value');
        const meta = chip.querySelector('.work-team-calendar-utility-meta');
        const labelRange = document.createRange();
        labelRange.selectNodeContents(label);
        const choicesRect = choices.getBoundingClientRect();
        const valueRect = value.getBoundingClientRect();
        const result = {
          choicesPosition: getComputedStyle(choices).position,
          choicesLeft: choicesRect.left,
          choicesBottom: choicesRect.bottom,
          labelTextRight: labelRange.getBoundingClientRect().right,
          valueTop: valueRect.top,
          valueWhiteSpace: getComputedStyle(value).whiteSpace,
          metaWhiteSpace: getComputedStyle(meta).whiteSpace,
          gridRowCount: getComputedStyle(chip).gridTemplateRows.trim().split(/\s+/).length,
          flowRowCount: Array.from(chip.children).filter((child) => getComputedStyle(child).position !== 'absolute')
            .length,
        };
        choices.remove();
        chip.classList.remove('has-gas-choices');
        return result;
      });
    expect(gasChoiceLayout.choicesPosition).toBe('absolute');
    expect(gasChoiceLayout.gridRowCount).toBe(3);
    expect(gasChoiceLayout.flowRowCount).toBe(3);
    expect(gasChoiceLayout.choicesLeft).toBeGreaterThanOrEqual(gasChoiceLayout.labelTextRight);
    expect(gasChoiceLayout.choicesBottom).toBeLessThanOrEqual(gasChoiceLayout.valueTop);
    expect(gasChoiceLayout.valueWhiteSpace).toBe('nowrap');
    expect(gasChoiceLayout.metaWhiteSpace).toBe('nowrap');

    const productionMenu = dialog.locator('.work-team-calendar-production-action-menu').first();
    const productionToggle = productionMenu.locator(
      '.work-team-calendar-production-action-toggle[aria-label="생산량 관리"]'
    );
    await expect(productionToggle).toBeVisible();
    await expect(productionToggle).toHaveText('관리');
    expect(await productionToggle.evaluate((node) => getComputedStyle(node).color)).toBe('rgb(15, 23, 42)');

    const utilityAlignment = await dialog
      .locator('.work-team-calendar-utility-strip')
      .first()
      .evaluate((strip) => {
        const productionChip = strip.querySelector('.work-team-calendar-utility-chip.has-production-actions');
        const referenceChip = Array.from(strip.querySelectorAll('.work-team-calendar-utility-chip')).find(
          (chip) => chip !== productionChip && chip.querySelector('.work-team-calendar-utility-value')
        );
        const getBox = (root, selector) => {
          const rect = root?.querySelector(selector)?.getBoundingClientRect();
          return rect
            ? {
                left: rect.left,
                right: rect.right,
                centerY: rect.top + rect.height / 2,
              }
            : null;
        };
        return productionChip && referenceChip
          ? {
              label: getBox(productionChip, '.work-team-calendar-utility-label'),
              action: getBox(productionChip, '.work-team-calendar-production-action-toggle'),
              value: getBox(productionChip, '.work-team-calendar-utility-value'),
              meta: getBox(productionChip, '.work-team-calendar-utility-meta'),
              referenceValue: getBox(referenceChip, '.work-team-calendar-utility-value'),
              referenceMeta: getBox(referenceChip, '.work-team-calendar-utility-meta'),
              chipHeight: productionChip.getBoundingClientRect().height,
            }
          : null;
      });
    expect(utilityAlignment).not.toBeNull();
    expect(Math.abs(utilityAlignment.label.centerY - utilityAlignment.action.centerY)).toBeLessThanOrEqual(4);
    expect(utilityAlignment.action.left).toBeGreaterThan(utilityAlignment.label.right);
    expect(Math.abs(utilityAlignment.value.left - utilityAlignment.label.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(utilityAlignment.meta.left - utilityAlignment.label.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(utilityAlignment.value.centerY - utilityAlignment.referenceValue.centerY)).toBeLessThanOrEqual(2);
    expect(Math.abs(utilityAlignment.meta.centerY - utilityAlignment.referenceMeta.centerY)).toBeLessThanOrEqual(2);

    await openProductionMenu(productionMenu, productionToggle);
    await expect(productionMenu.locator('[data-work-production-action]')).toHaveCount(3);
    const menuStyles = await productionMenu.locator('.work-team-calendar-production-action-list').evaluate((list) => {
      const style = getComputedStyle(list);
      const rect = list.getBoundingClientRect();
      return {
        position: style.position,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        left: rect.left,
        right: rect.right,
        viewportWidth: window.innerWidth,
      };
    });
    expect(menuStyles.position).toBe('absolute');
    expect(menuStyles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(menuStyles.borderRadius).toBe('6px');
    expect(menuStyles.left).toBeGreaterThanOrEqual(0);
    expect(menuStyles.right).toBeLessThanOrEqual(menuStyles.viewportWidth);
    const openChipHeight = await productionMenu.evaluate(
      (menu) => menu.closest('.work-team-calendar-utility-chip')?.getBoundingClientRect().height || 0
    );
    expect(Math.abs(openChipHeight - utilityAlignment.chipHeight)).toBeLessThanOrEqual(1);
    await productionMenu.locator('[data-work-production-action="paste"][data-work-production-kind="normal"]').click();
    let pasteModal = page.locator('#work-production-paste-modal[data-production-kind="normal"]');
    await expect(pasteModal).toBeVisible();
    await expect(pasteModal.locator('#work-production-paste-title')).toHaveText('정상 생산량');
    await expect(pasteModal.locator('[data-work-production-paste-text]')).toBeVisible();
    await expect(pasteModal.locator('[data-work-production-paste-submit]')).toBeVisible();
    await expect(pasteModal).toHaveClass(/is-team-report-document-ui/);
    await expect(pasteModal.locator('.work-production-paste-dialog')).toHaveCSS('border-radius', '8px');
    await page.screenshot({
      path: path.join(internalServerRoot, 'var', 'playwright', 'team-report-document-production-input.png'),
      fullPage: true,
    });
    await pasteModal.locator('[data-work-production-paste-close]').first().click();
    await expect(pasteModal).toHaveCount(0);

    await openProductionMenu(productionMenu, productionToggle);
    await productionMenu.locator('[data-work-production-action="paste"][data-work-production-kind="rework"]').click();
    pasteModal = page.locator('#work-production-paste-modal[data-production-kind="rework"]');
    await expect(pasteModal).toBeVisible();
    await expect(pasteModal.locator('#work-production-paste-title')).toHaveText('재가공품 생산량');
    await pasteModal.locator('[data-work-production-paste-close]').first().click();
    await expect(pasteModal).toHaveCount(0);

    const selectedMonth = await dialog
      .locator('.work-team-calendar-nav .work-team-calendar-select')
      .nth(1)
      .inputValue();
    await openProductionMenu(productionMenu, productionToggle);
    await productionMenu.locator('[data-work-production-action="delete"]').click();
    const deleteModal = page.locator('#util-selective-delete-modal.is-open');
    await expect(deleteModal).toBeVisible();
    await expect(deleteModal.locator('[data-role="dataset"]')).toHaveText('구분: 생산량');
    await expect(deleteModal.locator('[data-role="team"]')).toHaveValue('1팀 1파트');
    await expect(deleteModal.locator('[data-role="from"]')).toHaveValue(selectedMonth);
    await expect(deleteModal.locator('[data-role="to"]')).toHaveValue(selectedMonth);
    await expect(deleteModal.locator('[data-role="apply"]')).toBeVisible();
    await expect(deleteModal).toHaveClass(/is-team-report-delete-modal/);
    await expect(deleteModal.locator('#util-selective-delete-title')).toHaveText('생산량 삭제');
    await expect(deleteModal.locator('.util-production-modal-header')).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)'
    );
    await expect(deleteModal.locator('.util-production-modal-card')).toHaveCSS('border-radius', '8px');
    await expect(deleteModal.locator('.util-selective-delete-controls')).toHaveCSS('grid-template-columns', /.+ .+ .+/);
    await page.screenshot({
      path: path.join(internalServerRoot, 'var', 'playwright', 'team-report-document-production-delete.png'),
      fullPage: true,
    });
    await deleteModal.locator('[data-role="close"]').click();
    await expect(deleteModal).toHaveCount(0);

    await page.screenshot({
      path: path.join(internalServerRoot, 'var', 'playwright', 'team-report-document.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 360, height: 800 });
    const compactNavigationLayout = await documentNav.evaluate((nav) => {
      const modeSegments = nav.querySelector('.work-team-calendar-mode-segments');
      const switches = nav.querySelector('.work-team-calendar-switches');
      const fullscreenButton = nav.querySelector('[data-action="work-team-calendar-toggle-fullscreen"]');
      const navRect = nav.getBoundingClientRect();
      const modeRect = modeSegments?.getBoundingClientRect();
      const switchesRect = switches?.getBoundingClientRect();
      const fullscreenRect = fullscreenButton?.getBoundingClientRect();
      return {
        fullscreenInside:
          Boolean(fullscreenRect) &&
          fullscreenRect.left >= navRect.left - 1 &&
          fullscreenRect.right <= navRect.right + 1,
        switchesBelowModes: Boolean(modeRect && switchesRect && switchesRect.top >= modeRect.bottom),
      };
    });
    expect(compactNavigationLayout.fullscreenInside).toBeTruthy();
    expect(compactNavigationLayout.switchesBelowModes).toBeTruthy();

    await page.setViewportSize({ width: 1440, height: 960 });
    const dataSectionButton = page.locator('#section-btn-data');
    await dataSectionButton.click();
    const dataGroup = dataSectionButton.locator('xpath=..');
    const dataCategoryButtons = dataGroup.locator('[id^="cat-btn-data-"]');
    await expect(dataGroup).toHaveClass(/is-expanded/);
    await expect(dataCategoryButtons).toHaveCount(4);
    await expect(dataCategoryButtons.first()).toBeVisible();
    await dataCategoryButtons.first().click();
    await expect(dataSectionButton).toHaveClass(/is-active/);
    await expect(dataCategoryButtons.first()).toHaveClass(/active/);
    await expect(dataCategoryButtons.first()).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('[data-role="utility-entry-experiment"]')).toBeVisible();
    await expect(sidebar).not.toHaveClass(/is-team-report-document/);
    await expect(sidebarTree).not.toHaveClass(/is-team-report-document/);
    expect(await readSidebarDesign('data')).toEqual(canonicalSidebarDesign);
    await expect(dataCategoryButtons.first()).toHaveCSS('min-height', '36px');
    await expect(dataCategoryButtons.first()).toHaveCSS('border-radius', '4px');

    const sidebarToggle = page.locator('#viewer-sidebar-toggle');
    await sidebarToggle.click();
    await expect(sidebar).toHaveClass(/is-collapsed/);
    await expect(page.locator('#viewer-body')).toHaveClass(/is-sidebar-collapsed/);
    await expect(sidebar).toHaveCSS('width', '96px');
    await expect(sidebar.locator('.sidebar-group').first()).toBeHidden();
    await expect(sidebarToggle).toHaveAttribute('aria-label', '열기');
    await sidebarToggle.click();
    await expect(sidebar).not.toHaveClass(/is-collapsed/);
    await expect(sidebar).toHaveCSS('width', '248px');
    await expect(dataGroup).toHaveClass(/is-expanded/);
    await expect(dataCategoryButtons.first()).toHaveClass(/active/);

    const analysisButton = page.locator('#section-btn-experiment');
    await analysisButton.click();
    await expect(analysisButton).toHaveClass(/is-active/);
    await expect(analysisButton).toHaveAttribute('aria-current', 'page');
    await expect(analysisButton.locator('.sidebar-group-chevron')).toHaveCount(0);
    await expect(analysisButton.locator('xpath=..').locator('.sidebar-group-items')).toHaveCount(0);
    expect(await readSidebarDesign('experiment')).toEqual(canonicalSidebarDesign);
    await expect(sidebar).not.toHaveClass(/is-team-report-document/);
  } finally {
    if (credentials?.username) await deleteTempUser(credentials.username);
  }
});
