import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const fixtureOrigin = 'http://utility-analysis.fixture.test';
const scriptPaths = [
  'kpi-runtime/sections/KPI.section.factory-adapter.js',
  ...[
    'state',
    'catalog',
    'selection',
    'composer-model',
    'authority',
    'chart-model',
    'chart-view',
    'composer-view',
    'controller',
  ].map((name) => `kpi-runtime/sections/experiment/KPI.sections.experiment.${name}.js`),
  'kpi-runtime/sections/KPI.sections.experiment.js',
  'audit/runtime/audit/records/KPI.audit.records.util-format.js',
  'utility/runtime/util/KPI.util.data-sync.js',
  'utility/runtime/util/KPI.util.data-sync.production.js',
  'utility/runtime/util/energy/KPI.util.energy.dual.js',
  'utility/runtime/util/energy/KPI.util.energy.trend-chart.js',
  'utility/runtime/util/report/KPI.util.report.formatters.js',
  'utility/runtime/util/report/KPI.util.report.builder.state.js',
  'utility/runtime/util/report/KPI.util.report.builder.charts.js',
  'utility/runtime/util/report/KPI.util.report.runtime-adapter.js',
  ...['config', 'options', 'controls', 'analysis/state', 'analysis/chart-controls', 'analysis/render'].map(
    (name) => `utility/runtime/util/report/sheet/${name}.js`
  ),
];
const stylePaths = [
  'kpi-runtime/app/styles/metering/metering/01-metering-core.css',
  'kpi-runtime/app/styles/metering/metering/02-report-builder.css',
  'kpi-runtime/app/styles/shell/dashboard/05-experiment-composer.css',
];
const assets = new Map(
  await Promise.all(
    [...scriptPaths, ...stylePaths].map(async (file) => [
      `/${file}`,
      await fs.readFile(path.join(repoRoot, file), 'utf8'),
    ])
  )
);

function fixtureHtml() {
  // The shell and source records are isolated. Card events, calculation, SVG,
  // table, chart state, formatting and stylesheet modules are the real assets.
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
    <style>body{margin:0;font:14px Arial,sans-serif}*{box-sizing:border-box}</style>
    ${stylePaths.map((file) => `<link rel="stylesheet" href="/${file}">`).join('')}
    </head><body><main id="fixture-root"></main>
    ${scriptPaths.map((file) => `<script src="/${file}"></script>`).join('')}
    <script>
    window.getUtilDailyProductionValue = (teamName, year, month) => ({
      details: year === 2026 && month <= 2 ? [{
        entryKey: teamName + ':' + year + '-' + month + ':sd', teamName,
        lineName: 'S/D 건조', dateLabel: year + '-' + String(month).padStart(2, '0') + '-01',
        amount: month * 1200, yieldRate: 90 + month
      }] : []
    });
    KPIUtilReportSheetControls.setRuntimeAdapters({escapeUtilSheetHtml: escapeHtml});
    KPIUtilReportSheetAnalysisChartControls.setRuntimeAdapters({
      ...KPIUtilReportSheetAnalysisState, escapeUtilSheetHtml: escapeHtml
    });
    KPIUtilReportSheetAnalysisRender.setRuntimeAdapters({
      ...KPIUtilReportSheetAnalysisState, ...KPIUtilReportSheetAnalysisChartControls,
      escapeUtilSheetHtml: escapeHtml,
      renderUtilIndependentBoundsMultiSeriesChart, renderUtilTrendChart
    });
    const parts = window[Symbol.for('kpi.experiment.section.parts')];
    document.getElementById('fixture-root').innerHTML = '<section class="experiment-unified-shell">'
      + parts.buildExperimentChartToolsHtml({startMonth:'2026-01',endMonth:'2026-02'})
      + ['line-sd-production','summary-sd-yield_rate'].map(key =>
        '<article class="experiment-selector-card" data-exp-card="' + key + '">'
        + '<button data-exp-card-toggle="' + key + '" aria-pressed="false"'
        + ' onclick="KpiExperimentGraphPrototype.toggleCard(this)">' + key + '</button></article>'
      ).join('')
      + '<div class="experiment-chart-mount" data-exp-chart-mount data-exp-report-chart-style="report-auto"></div></section>';
    KpiExperimentGraphPrototype.mount(document.querySelector('.experiment-unified-shell'));
    </script></body></html>`;
}

async function openAnalysisFixture(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.origin === fixtureOrigin) {
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
    }
    errors.push(`Unexpected request: ${request.method()} ${url.pathname}`);
    await route.abort();
  });
  await page.goto(fixtureOrigin);
  expect(errors).toEqual([]);
  await expect(page.locator('.experiment-unified-shell')).toBeVisible();
  await page.locator('[data-exp-period-start]').fill('2026-01');
  await page.locator('[data-exp-period-end]').fill('2026-02');
  return errors;
}

test('production line selection draws its real SVG chart and table', async ({ page }) => {
  const errors = await openAnalysisFixture(page);
  await page.locator('[data-exp-card-toggle="line-sd-production"]').click();
  const chart = page.locator('[data-exp-chart-mount]');
  await expect(chart.locator('.util-analytics-chart-line')).toHaveCount(1);
  await expect(chart.locator('svg')).toBeVisible();
  await expect(chart.locator('.util-analytics-chart-value').filter({ hasText: '1,200' })).toBeVisible();
  await page.locator('[data-exp-chart-view="table"]').click();
  await expect(chart.locator('.experiment-chart-table-card')).toBeVisible();
  await expect(chart).toContainText('2,400');
  expect(errors).toEqual([]);
});

test('efficiency line selection draws yield values and switches between line and bar charts', async ({ page }) => {
  const errors = await openAnalysisFixture(page);
  await page.locator('[data-exp-card-toggle="summary-sd-yield_rate"]').click();
  const chart = page.locator('[data-exp-chart-mount]');
  await expect(chart.locator('.util-analytics-chart-line')).toHaveCount(1);
  await expect(chart.locator('svg')).toBeVisible();
  await expect(chart.locator('.util-analytics-chart-value').filter({ hasText: '91' })).toBeVisible();
  await chart.locator('[data-role="util-sheet-analysis-series-type"][data-chart-type="bar"]').click();
  await expect(chart.locator('svg rect:has(title)')).toHaveCount(2);
  await expect(chart.locator('.util-analytics-chart-line')).toHaveCount(0);
  expect(errors).toEqual([]);
});
