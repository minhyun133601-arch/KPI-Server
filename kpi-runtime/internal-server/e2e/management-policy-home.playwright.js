import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const internalServerRoot = path.resolve(__dirname, '..');
const screenshotRoot = path.join(internalServerRoot, 'var', 'playwright');

const policyLines = ['새로운 기준으로 지속 성장의 기반을 구축한다', 'AI 역량을 확보하여 업무효율을 극대화한다.'];

const guidelineNames = ['신뢰(信賴)', '소통(疏通)', '가치창조(價値創造)'];

const guidelineItems = [
  '차이나 부족함을 인정하고 스스로를 낮추는 겸손한 자세',
  '상대를 배려, 존중하고 이해하려는 태도',
  '존중, 성실, 책임 있는 행동을 취하는 자세',
  '개방적이고 열린 마음으로 받아들이려는 자세',
  '적극적인 문제해결과 도전하려는 자세',
  '자발적이며 친절하게 협업하고 협력하는 모습',
  '경청하고 수용하는 태도',
  '진정성과 공감대 형성을 위한 적극적인 자세',
  '도전을 통해 노하우를 쌓고 다양한 기능과 지식을 획득하는 자세',
  '생각과 정보를 나누고 공유하는 자세',
  '새로운 기술과 환경에서 아이디어를 찾고 학습하려는 자세',
  '창의적인 마인드와 가치지향적인 태도',
];

async function readHomeLayout(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.viewer-home-shell');
    const main = document.querySelector('#main-scroll');
    const header = document.querySelector('.viewer-header');
    const grid = document.querySelector('.viewer-home-guideline-grid');
    if (!shell || !main || !header || !grid) return null;
    const shellRect = shell.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    return {
      shellWidth: shellRect.width,
      shellHeight: shellRect.height,
      mainClientWidth: main.clientWidth,
      mainScrollWidth: main.scrollWidth,
      availableHeight: window.innerHeight - headerRect.height,
      gridColumns: getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length,
    };
  });
}

test.describe('management policy home', () => {
  test('keeps all copy and fills the available viewer cleanly', async ({ page, baseURL }) => {
    const statusResponse = await page.request.get(new URL('/api/bootstrap/status', baseURL).toString());
    const status = await statusResponse.json();
    test.skip(Boolean(status?.authEnabled && status?.loginEnabled), 'This focused smoke uses the no-login QA runtime.');

    await page.goto('/#kpi?view=home');
    await expect(page.locator('.viewer-home-shell')).toBeVisible();
    await expect(page.getByRole('heading', { name: '2026년 경영방침' })).toBeVisible();
    await expect(page.locator('.viewer-home-policy-line > span:last-child')).toHaveText(policyLines);
    await expect(page.getByRole('heading', { name: '신소가 행동강령' })).toBeVisible();
    await expect(page.locator('.viewer-home-guideline-name')).toHaveText(guidelineNames);
    await expect(page.locator('.viewer-home-guideline-list li')).toHaveText(guidelineItems);

    const desktopLayout = await readHomeLayout(page);
    expect(desktopLayout).not.toBeNull();
    expect(Math.abs(desktopLayout.shellWidth - desktopLayout.mainClientWidth)).toBeLessThanOrEqual(2);
    expect(desktopLayout.shellHeight).toBeGreaterThanOrEqual(desktopLayout.availableHeight - 1);
    expect(desktopLayout.mainScrollWidth).toBeLessThanOrEqual(desktopLayout.mainClientWidth + 1);
    expect(desktopLayout.gridColumns).toBe(3);
    await page.screenshot({
      path: path.join(screenshotRoot, 'management-policy-home-desktop.png'),
      fullPage: true,
    });

    await page.setViewportSize({ width: 900, height: 900 });
    await expect(page.locator('.viewer-home-shell')).toBeVisible();
    const narrowLayout = await readHomeLayout(page);
    expect(narrowLayout).not.toBeNull();
    expect(Math.abs(narrowLayout.shellWidth - narrowLayout.mainClientWidth)).toBeLessThanOrEqual(2);
    expect(narrowLayout.mainScrollWidth).toBeLessThanOrEqual(narrowLayout.mainClientWidth + 1);
    expect(narrowLayout.gridColumns).toBe(1);
    await page.screenshot({
      path: path.join(screenshotRoot, 'management-policy-home-narrow.png'),
      fullPage: true,
    });
  });
});
