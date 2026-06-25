import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const runtimeDirName = 'kpi-runtime';
const runtimeDirEntries = await fs.readdir(path.join(repoRoot, runtimeDirName), { withFileTypes: true });

assert.ok(runtimeDirEntries.length > 0, 'kpi-runtime directory must exist');

const appRoot = path.join(repoRoot, runtimeDirName, 'app');
const stylesRoot = path.join(appRoot, 'styles');
const kpiHtmlPath = path.join(repoRoot, 'KPI.html');
const shellManifestPath = path.join(appRoot, 'KPI.app.shell.css');

const styleEntries = [
  {
    href: `${runtimeDirName}/app/styles/shell/dashboard.css?v=108`,
    manifestHref: './styles/shell/dashboard.css?v=108',
    fileName: 'dashboard.css',
    relativeSegments: ['shell', 'dashboard.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/shell/shell-chrome.css?v=058`,
    manifestHref: './styles/shell/shell-chrome.css?v=058',
    fileName: 'shell-chrome.css',
    relativeSegments: ['shell', 'shell-chrome.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/work/work.css?v=066`,
    manifestHref: './styles/work/work.css?v=066',
    fileName: 'work.css',
    relativeSegments: ['work', 'work.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/metering/metering.css?v=084`,
    manifestHref: './styles/metering/metering.css?v=084',
    fileName: 'metering.css',
    relativeSegments: ['metering', 'metering.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/audit/audit.css?v=070`,
    manifestHref: './styles/audit/audit.css?v=070',
    fileName: 'audit.css',
    relativeSegments: ['audit', 'audit.css'],
  },
];

const kpiHtml = await fs.readFile(kpiHtmlPath, 'utf8');
const shellManifest = await fs.readFile(shellManifestPath, 'utf8');
const styleContents = Object.fromEntries(
    await Promise.all(
    styleEntries.map(async ({ fileName, relativeSegments }) => [
      fileName,
      await fs.readFile(path.join(stylesRoot, ...relativeSegments), 'utf8'),
    ])
  )
);

test('kpi html loads split shell css links instead of inline style block', () => {
  let previousIndex = -1;
  for (const { href } of styleEntries) {
    const linkTag = `<link rel="stylesheet" href="${href}">`;
    const linkIndex = kpiHtml.indexOf(linkTag);
    assert.notEqual(linkIndex, -1, `${href} link must exist in KPI.html`);
    assert.ok(linkIndex > previousIndex, `${href} must keep the documented load order`);
    previousIndex = linkIndex;
  }

  assert.equal(
    /app\/KPI\.app\.shell\.css\?v=\d+/.test(kpiHtml),
    false,
    'KPI.html should no longer load the legacy single-file shell css path'
  );
  assert.doesNotMatch(kpiHtml, /<style>/, 'KPI.html inline shell style block should remain removed');
});

test('shell css compatibility manifest imports split files', () => {
  for (const { fileName, manifestHref } of styleEntries) {
    assert.match(
      shellManifest,
      new RegExp(`@import url\\(\"${manifestHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\"\\);`),
      `${fileName} must remain in the compatibility manifest`
    );
  }
});

test('split shell css keeps key selectors in the expected files', () => {
  assert.match(styleContents['dashboard.css'], /#dashboard\s*\{/);
  assert.match(styleContents['dashboard.css'], /\.dashboard-version-badge\s*\{/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-chart-card\s*\{[^}]*border:\s*1px solid #111827;[^}]*background:\s*#ffffff;[^}]*gap:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-report-chart-shell \.util-analytics-chart\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*padding:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-grid\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-value\s*\{[^}]*paint-order:\s*stroke;[^}]*stroke:\s*#ffffff;[^}]*stroke-width:\s*3px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-canvas svg > rect\[opacity\]\s*\{[^}]*opacity:\s*1;[^}]*stroke:\s*#ffffff;[^}]*rx:\s*2px;[^}]*shape-rendering:\s*crispEdges;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(100%,\s*340px\),\s*420px\)\);[^}]*justify-content:\s*start;[^}]*border-bottom:\s*1px solid #d1d5db;[^}]*background:\s*#f8fafc;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*row-gap:\s*5px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-card-actions\s*\{[^}]*top:\s*8px;[^}]*right:\s*9px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-summary-remove-button\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-badge\s*\{[^}]*background:\s*var\(--util-summary-badge-color,\s*#64748b\);[^}]*color:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-label\s*\{[^}]*max-width:\s*100%;[^}]*text-overflow:\s*ellipsis;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-controls\s*\{[^}]*grid-column:\s*1;[^}]*border-top:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-control-actions\s*\{[^}]*display:\s*inline-flex;[^}]*border:\s*0;[^}]*border-top:\s*1px solid #e5e7eb;[^}]*padding:\s*4px 0 0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-chart-surface\.util-sheet-analysis-table-chart\s*\{[^}]*display:\s*grid;[^}]*align-items:\s*start;[^}]*padding:\s*6px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-table-chart-frame\s*\{[^}]*min-height:\s*0;[^}]*height:\s*auto;[^}]*display:\s*block;[^}]*border:\s*0;[^}]*padding:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-set\s*\{[^}]*--exp-table-column-min:\s*1440px;[^}]*--exp-table-label-width:\s*230px;[^}]*overflow-x:\s*auto;/s);
  assert.doesNotMatch(styleContents['dashboard.css'], /experiment-chart-table-set:not\(\[data-exp-table-count="1"\]\)[\s\S]*--exp-table-column-min:\s*640px/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-grid\s*\{[^}]*width:\s*var\(--exp-table-column-min\);[^}]*grid-template-columns:\s*var\(--exp-table-column-min\);/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-card\s*\{[^}]*width:\s*var\(--exp-table-column-min\);[^}]*min-height:\s*0;[^}]*height:\s*auto;[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*padding:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-table-chart \.util-sheet-table-wrap\s*\{[^}]*width:\s*var\(--exp-table-column-min\);[^}]*min-height:\s*0;[^}]*height:\s*auto;[^}]*max-height:\s*min\(560px,\s*calc\(100vh - 280px\)\);[^}]*overflow:\s*auto;[^}]*border:\s*1px solid #cbd5e1;[^}]*background:\s*#ffffff;[^}]*box-shadow:\s*0 1px 2px rgba\(15,\s*23,\s*42,\s*0\.04\);/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table\s*\{[^}]*width:\s*var\(--exp-table-column-min\);[^}]*min-width:\s*var\(--exp-table-column-min,\s*1440px\);[^}]*height:\s*auto;[^}]*table-layout:\s*fixed;[^}]*border-collapse:\s*collapse;[^}]*border-spacing:\s*0;[^}]*border:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table th,\s*\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table td\s*\{[^}]*border:\s*1px solid #d8dee7;[^}]*font-size:\s*var\(--exp-table-font-size,\s*13\.5px\);[^}]*line-height:\s*1\.16;[^}]*padding:\s*var\(--exp-table-cell-padding,\s*4px 8px\);/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table thead th\s*\{[^}]*background:\s*#eef2f7;[^}]*border-bottom:\s*1px solid #b8c2d0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table thead th\.experiment-chart-table-unit-head\s*\{[^}]*width:\s*var\(--exp-table-label-width,\s*230px\);[^}]*text-align:\s*left;[^}]*white-space:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-unit-label\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*6px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-number\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;[^}]*border:\s*1px solid #cbd5e1;[^}]*border-radius:\s*50%;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-row-title\s*\{[^}]*max-width:\s*100%;[^}]*overflow:\s*hidden;[^}]*white-space:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-row-title span:last-child\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-board\s*\{[^}]*width:\s*var\(--exp-table-column-min\);[^}]*min-width:\s*var\(--exp-table-column-min\);[^}]*grid-template-columns:\s*92px minmax\(0,\s*1fr\);[^}]*border:\s*1px solid #cbd5e1;[^}]*background:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-list\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*font-size:\s*11\.8px;[^}]*overflow-wrap:\s*normal;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-line\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*18px minmax\(0,\s*1fr\) auto;[^}]*white-space:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-text\s*\{[^}]*flex-wrap:\s*nowrap;[^}]*overflow:\s*hidden;[^}]*white-space:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-copy\s*\{[^}]*width:\s*30px;[^}]*min-width:\s*30px;[^}]*height:\s*18px;[^}]*border:\s*1px solid #cbd5e1;[^}]*cursor:\s*pointer;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-copy\[data-exp-chart-table-memo-copy-state="copied"\]\s*\{[^}]*border-color:\s*#94a3b8;[^}]*color:\s*#111827;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-copy\[data-exp-chart-table-memo-copy-state="failed"\]\s*\{[^}]*border-color:\s*#fecaca;[^}]*color:\s*#b91c1c;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-segment\.is-up\s*\{\s*color:\s*#c00000;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-memo-segment\.is-down\s*\{\s*color:\s*#2f75b5;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.experiment-chart-table-card \.util-sheet-analysis-table-head\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*0 8px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-stat-row\s*\{[^}]*display:\s*flex;[^}]*border-top:\s*1px solid #e5e7eb;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-label-toggle\s*\{[^}]*border:\s*1px solid #cbd5e1;[^}]*font-size:\s*10\.5px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-stat\.is-max\s*\{[^}]*background:\s*#fef2f2;[^}]*color:\s*#b91c1c;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-sheet-analysis-summary-stat\.is-min\s*\{[^}]*background:\s*#eff6ff;[^}]*color:\s*#1d4ed8;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-toolbar\s*\{[^}]*min-height:\s*40px;[^}]*border-bottom:\s*1px solid #dbe4f3;[^}]*box-shadow:\s*none;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-unified-shell\s*\{[^}]*grid-template-rows:\s*minmax\(0,\s*1fr\);/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-inline-tools\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*30px;[^}]*flex-wrap:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-inline-spacer\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-width:\s*12px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-view-toggle\s*\{[^}]*flex:\s*0 0 auto;[^}]*border:\s*1px solid #111827;[^}]*overflow:\s*hidden;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-view-button\.is-active\s*\{[^}]*background:\s*#111827;[^}]*color:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount > \.util-sheet-empty\.experiment-empty-state\s*\{[^}]*place-items:\s*stretch center;[^}]*align-content:\s*start;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-empty-state \.experiment-chart-inline-tools\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*padding:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-add-card-trigger\s*\{[^}]*min-height:\s*30px;[^}]*border:\s*1px solid #cbd5e1;[^}]*background:\s*#ffffff;[^}]*box-shadow:\s*none;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-period-input\s*\{[^}]*height:\s*30px;[^}]*border-radius:\s*6px;[^}]*font-size:\s*0\.74rem;[^}]*box-shadow:\s*none;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-fullscreen-button\s*\{[^}]*min-height:\s*30px;[^}]*border:\s*1px solid #cbd5e1;[^}]*white-space:\s*nowrap;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-overview-ratio-shell\s*\{[^}]*min-height:\s*calc\(100vh - 40px\);[^}]*background:\s*#f3f6fb;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-unified-shell\.is-experiment-browser-fullscreen,[\s\S]*\.experiment-overview-ratio-shell:fullscreen\s*\{[^}]*height:\s*100dvh;[^}]*overflow:\s*auto;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-year-overlap-button\s*\{[^}]*min-height:\s*30px;[^}]*border:\s*1px solid #cbd5e1;[^}]*background:\s*#ffffff;[^}]*box-shadow:\s*none;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-year-overlap-button\[aria-pressed="true"\]\s*\{[^}]*border-color:\s*#111827;[^}]*background:\s*#f1f5f9;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-year-overlap-years\s*\{[^}]*min-height:\s*30px;[^}]*display:\s*inline-flex;[^}]*gap:\s*4px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-year-overlap-year\[aria-pressed="true"\]\s*\{[^}]*border-color:\s*#111827;[^}]*background:\s*#f1f5f9;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-remove-select\s*\{[^}]*height:\s*30px;[^}]*border-radius:\s*6px;[^}]*font-size:\s*0\.74rem;[^}]*box-shadow:\s*none;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-palette\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*6px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-groups\[hidden\],[\s\S]*\.experiment-card-groups\[data-exp-card-groups-source\]\s*\{\s*display:\s*none !important;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-step-control\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(74px,\s*auto\);[^}]*border:\s*1px solid #111827;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-step-select\s*\{[^}]*height:\s*42px;[^}]*background:\s*#f8fafc;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder-source\]\s*\{\s*display:\s*none !important;\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-selection-preview\s*\{\s*display:\s*none !important;\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-step-control \.experiment-ratio-add-button:disabled\s*\{[^}]*background:\s*#111827;[^}]*color:\s*#ffffff;[^}]*opacity:\s*0\.48;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-builder \.experiment-inline-ratio-summary,[\s\S]*\.experiment-inline-ratio-builder \.experiment-ratio-fraction-card-head,[\s\S]*\.experiment-inline-ratio-builder \.experiment-ratio-status\s*\{\s*display:\s*none !important;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-builder\s*\{[^}]*gap:\s*0;[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*padding:\s*0;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-summary-line-check-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);[^}]*gap:\s*6px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-summary-line-open-button\[hidden\]\s*\{\s*display:\s*none !important;\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-part-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-part-grid \.experiment-ratio-field:nth-of-type\(4\)\s*\{\s*border-right:\s*0;\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-denominator\s*\{[^}]*position:\s*relative;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(74px,\s*auto\);[^}]*gap:\s*0;[^}]*border:\s*1px solid #111827;[^}]*padding-left:\s*58px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\]\[data-exp-ratio-mode="true"\]\s*\{[^}]*position:\s*relative;[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\) minmax\(74px,\s*auto\);[^}]*padding-left:\s*58px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\]\[data-exp-ratio-mode="true"\]::before,[\s\S]*\.experiment-inline-ratio-denominator::before\s*\{[^}]*position:\s*absolute;[^}]*left:\s*8px;[^}]*top:\s*50%;[^}]*width:\s*42px;[^}]*border:\s*1px solid #111827;[^}]*background:\s*#ffffff;[^}]*font-weight:\s*900;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\]\[data-exp-ratio-mode="true"\]::before\s*\{\s*content:\s*"분자";\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-denominator::before\s*\{\s*content:\s*"분모";\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-denominator \.experiment-ratio-fraction-card\s*\{[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-inline-ratio-denominator \.experiment-ratio-add-button\s*\{[^}]*min-height:\s*50px;[^}]*border:\s*0;[^}]*background:\s*#111827;[^}]*color:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\]\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\) minmax\(148px,\s*auto\);[^}]*gap:\s*0;[^}]*border:\s*1px solid #111827;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\] \.experiment-ratio-field\s*\{[^}]*min-height:\s*50px;[^}]*border-right:\s*1px solid #d1d5db;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-builder-actions\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(74px,\s*auto\)\);[^}]*border-left:\s*1px solid #d1d5db;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\] \.experiment-ratio-add-button\s*\{[^}]*min-height:\s*50px;[^}]*background:\s*#111827;[^}]*color:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-ratio-builder-grid\[data-exp-card-builder\]\[data-exp-ratio-mode="true"\] \[data-exp-card-builder-add\]\s*\{\s*display:\s*none;\s*\}/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-selector-card\s*\{[^}]*min-height:\s*42px;[^}]*padding:\s*7px\s*76px\s*7px\s*10px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-card-action\s*\{[^}]*top:\s*50%;[^}]*right:\s*8px;[^}]*width:\s*58px;/s);

  assert.match(styleContents['shell-chrome.css'], /#viewer\s*\{/);
  assert.match(styleContents['shell-chrome.css'], /body\.is-report-popup\s+#dashboard/);
  assert.match(styleContents['shell-chrome.css'], /\.viewer-header\s*\{/);
  assert.match(styleContents['shell-chrome.css'], /\.global-save-dock\s*\{/);
  assert.match(styleContents['shell-chrome.css'], /\.runtime-auth-bar\s*\{/);

  assert.match(styleContents['work.css'], /\.work-panel\s*\{/);
  assert.match(styleContents['work.css'], /\.work-chooser-shell\s*\{/);
  assert.doesNotMatch(styleContents['work.css'], /f107/);
  assert.match(styleContents['work.css'], /\.work-team-calendar-production-action-list\s*\{[^}]*position:\s*static;/s);

  assert.match(styleContents['metering.css'], /\.util-tabs-wrap\s*\{/);
  assert.match(styleContents['metering.css'], /\.month-panel\s*\{/);
  assert.match(styleContents['metering.css'], /\.util-sheet-meter-table-electric\s+th\[data-correction-source="true"\]/);
  assert.match(styleContents['metering.css'], /\.util-sheet-meter-table-electric\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*table-layout:\s*fixed;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-meter-table-electric\s+th,\s*\.util-sheet-meter-table-electric\s+td\s*\{[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-meter-table-electric\s+th:first-child,\s*\.util-sheet-meter-table-electric\s+td:first-child\s*\{[^}]*position:\s*static;[^}]*min-width:\s*0;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-waste-meter-card\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s);
  assert.doesNotMatch(styleContents['metering.css'], /\.util-sheet-waste-meter-card\s*\{[^}]*minmax\(500px,/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-modal-card\s*\{[^}]*background:\s*#f3f6fb;[^}]*color:\s*#172033;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-modal-body\s*\{[^}]*grid-template-rows:\s*auto\s*auto\s*auto;[^}]*overflow-y:\s*auto;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-chart-shell\s*\{[^}]*min-height:\s*0;[^}]*padding:\s*5px;[^}]*grid-template-rows:\s*auto;[^}]*background:\s*#ffffff;/s);
  assert.doesNotMatch(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-chart-shell\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-chart-host-wrap\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styleContents['metering.css'], /\.util-report-modal-group-display\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(58px,\s*80px\)\)\s*minmax\(126px,\s*max-content\)\s*repeat\(3,\s*minmax\(58px,\s*80px\)\);/s);
  assert.match(styleContents['metering.css'], /\.util-report-chart-inline-right\s+\.util-report-modal-group-display\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(56px,\s*76px\)\)\s*minmax\(126px,\s*max-content\)\s*repeat\(3,\s*minmax\(56px,\s*76px\)\);/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal-filter-actions\s*\{[^}]*display:\s*inline-flex;[^}]*gap:\s*4px;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-modal-group-display\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(58px,\s*80px\)\)\s*minmax\(126px,\s*max-content\);/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-donut-row\s*\{[^}]*z-index:\s*1;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[^}]*overflow:\s*hidden;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-inline-insight\s*\{[^}]*z-index:\s*2;[^}]*min-height:\s*260px;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-inline-insight-meta\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-composition-shell\s*\{[^}]*border-color:\s*#cbd5e1;[^}]*background:\s*#ffffff;[^}]*overflow:\s*hidden;/s);
  assert.match(styleContents['metering.css'], /\.util-report-composition-center\.is-ratio\s*\{[^}]*font-size:\s*1\.2rem;[^}]*font-weight:\s*900;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-composition-center\.is-ratio\s*\{[^}]*fill:\s*#1d4ed8;/s);
  assert.match(styleContents['metering.css'], /\.util-report-modal\.is-overview-ratio\s+\.util-report-yoy-table\.is-overview-breakdown\s+th\s*\{[^}]*background:\s*#dbeafe;[^}]*color:\s*#111827;/s);

  assert.match(styleContents['audit.css'], /\.audit-panel\s*\{/);
  assert.match(styleContents['audit.css'], /\.print-sheet\s*\{/);
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-shell\s*\{[^}]*height:\s*calc\(100vh - 84px\);[^}]*padding:\s*14px\s*16px\s*20px;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-window\s*\{[^}]*height:\s*100%;[^}]*grid-template-rows:\s*auto\s*minmax\(0,\s*1fr\)\s*auto;/s
  );
  assert.match(
    styleContents['audit.css'],
    /#content-container\.is-audit-lux-browser-fullscreen \.audit-lux-shell,\s*[\r\n\s]*#content-container:fullscreen \.audit-lux-shell\s*\{[^}]*height:\s*100dvh;[^}]*padding:\s*0;/s
  );
  assert.match(styleContents['audit.css'], /\.audit-lux-window-icon\s*\{/);
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-window-header\s*\{[^}]*grid-template-columns:\s*44px\s*minmax\(260px,\s*1fr\)\s*auto;[^}]*min-height:\s*78px;[^}]*padding:\s*16px\s*18px;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-window-title\s*\{[^}]*font-size:\s*clamp\(1\.32rem,\s*1\.75vw,\s*1\.72rem\);[^}]*line-height:\s*1\.1;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-fullscreen-toggle\s*\{[^}]*width:\s*38px;[^}]*height:\s*38px;[^}]*border-radius:\s*7px;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-index-card\s*\{[^}]*min-height:\s*252px;[^}]*grid-template-rows:\s*auto\s*96px\s*auto;[^}]*border-radius:\s*8px;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-index-card-media-link\s*\{[^}]*cursor:\s*zoom-in;[^}]*text-decoration:\s*none;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-index-card-actions\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);[^}]*gap:\s*0\.45rem;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-index-empty-thumb\s*\{[^}]*font-size:\s*0\.82rem;[^}]*font-weight:\s*900;/s
  );
  assert.doesNotMatch(styleContents['audit.css'], /\.audit-lux-index-card-status\s*\{/);
  assert.match(styleContents['audit.css'], /\.audit-lux-index-team-icon\s*\{/);
  assert.doesNotMatch(styleContents['audit.css'], /audit-lux-index-card\s*\{\s*grid-template-rows:\s*150px\s*auto\s*auto/);
});

test('utility sheet report modal stays above the viewer layer', () => {
  const viewerZIndexMatch = styleContents['shell-chrome.css'].match(/#viewer\s*\{[^}]*z-index:\s*(\d+)/s);
  const modalZIndexMatch = styleContents['metering.css'].match(/\.util-sheet-report-modal\s*\{[^}]*z-index:\s*(\d+)/s);

  assert.ok(viewerZIndexMatch, '#viewer z-index must stay explicit');
  assert.ok(modalZIndexMatch, 'utility sheet report modal z-index must stay explicit');
  assert.ok(Number(modalZIndexMatch[1]) > Number(viewerZIndexMatch[1]), 'utility sheet modal must render above #viewer');
  assert.match(styleContents['metering.css'], /\.util-sheet-report-modal\.is-open\s*\{\s*display:\s*flex;/);
  assert.match(styleContents['metering.css'], /\.util-sheet-report-modal\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*center;[^}]*padding:\s*16px;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-report-card\s*\{[^}]*width:\s*min\(1120px,\s*96vw\);[^}]*border-radius:\s*8px;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-report-modal\.is-expanded\s+\.util-sheet-report-card\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100dvh;/s);
  assert.match(styleContents['metering.css'], /\.util-sheet-meter-summary-toolbar\s*\{/);
  assert.match(styleContents['metering.css'], /\.util-sheet-inline-help\s*\{/);
});
