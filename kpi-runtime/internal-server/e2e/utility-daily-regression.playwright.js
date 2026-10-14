import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const fixtureOrigin = 'http://utility-daily.fixture.test';
const sourceDirectory = 'data-entry/runtime/data/sections/utility-entry/';
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const scriptPaths = Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g))
  .map((match) => match[1].split('?')[0])
  .filter((file) => file.startsWith(sourceDirectory));
const stylePaths = [
  '01-equipment-foundation.css',
  '02-utility-entry-shell.css',
  '03-utility-entry-workspace.css',
  '04-utility-entry-graph-responsive.css',
].map((file) => `kpi-runtime/app/styles/data/data/${file}`);
const assets = new Map(
  await Promise.all(
    [...scriptPaths, ...stylePaths].map(async (file) => [
      `/${file}`,
      await fs.readFile(path.join(repoRoot, file), 'utf8'),
    ])
  )
);

function fixtureHtml() {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <style>body{margin:0;font:14px Arial,sans-serif}main{padding:16px}</style>
    ${stylePaths.map((file) => `<link rel="stylesheet" href="/${file}">`).join('')}
    </head><body><main data-role="utility-entry-experiment" class="utility-entry-experiment"></main>
    ${scriptPaths.map((file) => `<script src="/${file}"></script>`).join('')}
    <script>
      const parts = window[Symbol.for('kpi.utilityEntryExperiment.parts')];
      const host = document.querySelector('main');
      host.innerHTML = '<div class="utility-entry-experiment-switch">' +
        '<input class="utility-entry-experiment-radio" type="radio" id="utility-entry-experiment-daily" checked>' +
        '<div class="utility-entry-experiment-view-stack"><div class="utility-entry-experiment-view is-daily">' +
        parts.buildUtilityEntryExperimentPanel({period:'daily',year:'2026',month:'05',date:'2026-05-01',
          body:parts.buildUtilityEntryExperimentDaily()}) + '</div></div></div>';
      parts.initializeUtilityEntryExperiment(host);
    </script></body></html>`;
}

function createRecords() {
  return {
    electric: {
      equipmentItems: [{ id: 'field_01', label: '배풍' }],
      equipmentEntries: {
        '2026-05-01': { values: { field_01: '100' } },
        '2026-05-02': { values: { field_01: '200' } },
        '2026-05-03': { values: { field_01: '300' } },
      },
    },
    gas: { equipmentEntries: {} },
    waste: {},
    other: {},
  };
}

async function openFixture(page, options = {}) {
  let records = createRecords();
  let failReads = options.failReads === true;
  let pendingRead = null;
  let releaseRecordReads = () => {};
  let pendingRecordReads = options.holdRecordReads
    ? new Promise((resolve) => {
        releaseRecordReads = resolve;
      })
    : null;
  const errors = [];
  const writes = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', (dialog) => dialog.accept());
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== fixtureOrigin) {
      errors.push(`Unexpected external request: ${request.method()} ${request.url()}`);
      await route.abort();
      return;
    }
    if (url.pathname === '/') {
      await route.fulfill({ contentType: 'text/html; charset=utf-8', body: fixtureHtml() });
      return;
    }
    if (assets.has(url.pathname)) {
      await route.fulfill({
        contentType: url.pathname.endsWith('.css') ? 'text/css' : 'application/javascript',
        body: assets.get(url.pathname),
      });
      return;
    }
    if (url.pathname.startsWith('/api/modules/util_metering/records/')) {
      if (pendingRecordReads) await pendingRecordReads;
      const resourceType = url.pathname.split('/').pop().replace(/_v1$/, '');
      await route.fulfill({
        status: failReads ? 503 : 200,
        json: { record: { payload: records[resourceType] || {} } },
      });
      return;
    }
    if (url.pathname === '/api/shared-store') {
      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        writes.push(structuredClone(body));
        records = structuredClone(body.store.resourceDatasets);
        await route.fulfill({ json: { ok: true, meta: { version: 2 } } });
      } else {
        if (pendingRead) await pendingRead;
        await route.fulfill({
          json: { ok: true, store: { resourceDatasets: records }, meta: { version: 1 } },
        });
      }
      return;
    }
    errors.push(`Unexpected fixture request: ${request.method()} ${url.pathname}`);
    await route.abort();
  });
  await page.clock.setFixedTime(new Date('2026-09-30T03:00:00Z'));
  await page.goto(fixtureOrigin, { waitUntil: 'domcontentloaded' });
  return {
    errors,
    writes,
    releaseRecordReads() {
      releaseRecordReads();
      pendingRecordReads = null;
    },
    setFailReads(value) {
      failReads = value;
    },
    holdSharedRead() {
      let release;
      pendingRead = new Promise((resolve) => {
        release = resolve;
      });
      return () => {
        release();
        pendingRead = null;
      };
    },
  };
}

const hostSelector = '[data-role="utility-entry-experiment"]';
const currentSelector =
  'input[data-utility-entry-experiment-save-kind="daily-current"][data-utility-entry-experiment-field-id="field_01"]:visible';
const calendarSelector = '[data-role="utility-entry-experiment-completed-calendar"]';
const daySelector = 'button[data-utility-entry-experiment-date]';

test('daily dates remain visible and selectable while records are loading', async ({ page }) => {
  const fixture = await openFixture(page, { holdRecordReads: true });
  const host = page.locator(hostSelector);
  const calendar = page.locator(calendarSelector);
  const save = page.locator('[data-role="utility-entry-experiment-save"]');
  const remove = page.locator('[data-role="utility-entry-experiment-delete"]');
  try {
    await expect(calendar.locator(daySelector)).toHaveCount(31);
    await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-05-01');
    await expect(calendar).toContainText('기입 상태 불러오는 중');
    await expect(calendar.locator(`${daySelector}.is-unknown`)).toHaveCount(31);
    await expect(calendar.locator('.is-missing, .is-done, .is-partial')).toHaveCount(0);
    await expect(save).toBeDisabled();
    await expect(remove).toBeDisabled();

    await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
    await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-05-02');
    await expect(page.locator('[data-utility-entry-experiment-date="2026-05-02"]')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('06');
    await expect(calendar.locator(daySelector)).toHaveCount(30);
    await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-06-01');
    await expect(calendar.locator(`${daySelector}.is-unknown`)).toHaveCount(30);
    await page.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('05');
    await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
  } finally {
    fixture.releaseRecordReads();
  }
  await expect(host).toHaveAttribute('data-actual-values-ready', 'true');
  await expect(page.locator(currentSelector)).toHaveValue('200');
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-05-02');
  await expect(page.locator('[data-utility-entry-experiment-date="2026-05-02"]')).toHaveClass(/is-partial/);
  await expect(page.locator('[data-utility-entry-experiment-date="2026-05-04"]')).toHaveClass(/is-missing/);
  await expect(calendar.locator('.is-unknown')).toHaveCount(0);
  await expect(save).toBeEnabled();
  await expect(remove).toBeEnabled();
  expect(fixture.writes).toEqual([]);
  expect(fixture.errors).toEqual([]);
});

test('daily calendar keeps edits on their date and restores an empty draft', async ({ page }) => {
  const fixture = await openFixture(page);
  const host = page.locator(hostSelector);
  const input = page.locator(currentSelector);
  await expect(host).toHaveAttribute('data-actual-values-ready', 'true');
  await expect(input).toHaveValue('100');
  await input.fill('150');
  await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
  await expect(input).toHaveValue('200');
  await expect(host).toHaveAttribute('data-utility-entry-experiment-daily-error-count', '0');

  await page.locator('[data-utility-entry-experiment-date="2026-05-01"]').click();
  await expect(input).toHaveValue('150');
  await expect(host).toHaveAttribute('data-utility-entry-experiment-save-status', 'unsaved');
  await input.fill('');
  await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
  await expect(input).toHaveValue('200');
  await page.locator('[data-utility-entry-experiment-date="2026-05-01"]').click();
  await expect(input).toHaveValue('');
  expect(fixture.writes).toEqual([]);
  expect(fixture.errors).toEqual([]);
});

test('daily save writes the original date while another calendar day is selected', async ({ page }) => {
  const fixture = await openFixture(page);
  const input = page.locator(currentSelector);
  await expect(input).toHaveValue('100');
  await input.fill('150');
  const releaseRead = fixture.holdSharedRead();
  try {
    await page.locator('[data-role="utility-entry-experiment-save"]').click();
    await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
    await expect(input).toHaveValue('200');
  } finally {
    releaseRead();
  }
  await expect.poll(() => fixture.writes.length).toBe(1);
  expect(fixture.writes[0].store.resourceDatasets.electric.equipmentEntries['2026-05-01'].values.field_01).toBe('150');
  expect(fixture.writes[0].store.resourceDatasets.electric.equipmentEntries['2026-05-02'].values.field_01).toBe('200');
  await expect(input).toHaveValue('200');
  expect(fixture.errors).toEqual([]);
});

test('failed daily reads preserve the calendar and recover using the visible retry button', async ({ page }) => {
  const fixture = await openFixture(page, { failReads: true });
  const host = page.locator(hostSelector);
  const calendar = page.locator(calendarSelector);
  const retry = calendar.locator('[data-role="utility-entry-experiment-retry"]');
  await expect(host).toHaveAttribute('data-actual-values-ready', 'error');
  await expect(calendar.locator(daySelector)).toHaveCount(31);
  await expect(calendar.getByText('기입 상태를 불러오지 못했습니다.', { exact: true })).toBeVisible();
  await expect(retry).toBeVisible();
  await expect(retry).toHaveText('다시 불러오기');
  await expect(calendar.locator(`${daySelector}.is-unknown`)).toHaveCount(31);
  await expect(calendar.locator('.is-missing, .is-done, .is-partial')).toHaveCount(0);
  await expect(page.locator('[data-role="utility-entry-experiment-save"]')).toBeDisabled();
  await expect(page.locator('[data-role="utility-entry-experiment-delete"]')).toBeDisabled();
  await page.locator('[data-utility-entry-experiment-date="2026-05-02"]').click();
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-05-02');
  await page.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('06');
  await expect(calendar.locator(daySelector)).toHaveCount(30);
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-06-01');
  await page.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('05');
  await expect(host).toHaveAttribute('data-actual-values-ready', 'error');
  await expect(retry).toBeVisible();
  fixture.setFailReads(false);
  await retry.click();
  await expect(host).toHaveAttribute('data-actual-values-ready', 'true');
  await expect(page.locator(currentSelector)).toHaveValue('100');
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2026-05-01');
  await expect(page.locator('[data-utility-entry-experiment-date="2026-05-01"]')).toHaveClass(/is-partial/);
  await expect(page.locator('[data-utility-entry-experiment-date="2026-05-04"]')).toHaveClass(/is-missing/);
  await expect(calendar.locator('.is-unknown')).toHaveCount(0);
  await expect(retry).toHaveCount(0);
  await expect(page.locator('[data-role="utility-entry-experiment-save"]')).toBeEnabled();
  await expect(page.locator('[data-role="utility-entry-experiment-delete"]')).toBeEnabled();
  await expect(host).not.toHaveAttribute('data-actual-values-error', /.+/);
  expect(fixture.writes).toEqual([]);
  expect(fixture.errors).toEqual([]);
});

test('daily dates show leap days and remain usable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const fixture = await openFixture(page);
  const calendar = page.locator(calendarSelector);
  await expect(page.locator(hostSelector)).toHaveAttribute('data-actual-values-ready', 'true');
  await page.locator('[data-role="utility-entry-experiment-daily-year"]').selectOption('2024');
  await page.locator('[data-role="utility-entry-experiment-daily-month"]').selectOption('02');
  await expect(calendar.locator(daySelector)).toHaveCount(29);
  const leapDay = calendar.locator('[data-utility-entry-experiment-date="2024-02-29"]');
  await expect(leapDay).toBeVisible();
  await leapDay.click();
  await expect(leapDay).toHaveAttribute('aria-pressed', 'true');
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2024-02-29');
  const bounds = await leapDay.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.locator('[data-role="utility-entry-experiment-daily-year"]').selectOption('2025');
  await expect(calendar.locator(daySelector)).toHaveCount(28);
  await expect(calendar.locator('[data-utility-entry-experiment-date="2025-02-29"]')).toHaveCount(0);
  await expect(calendar.locator('.utility-entry-experiment-completed-head')).toContainText('선택 2025-02-01');
  expect(fixture.writes).toEqual([]);
  expect(fixture.errors).toEqual([]);
});
