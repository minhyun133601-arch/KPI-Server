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
    href: `${runtimeDirName}/app/styles/shell/dashboard.css?v=076`,
    manifestHref: './styles/shell/dashboard.css?v=076',
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
    href: `${runtimeDirName}/app/styles/audit/audit.css?v=059`,
    manifestHref: './styles/audit/audit.css?v=059',
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
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-report-chart-shell \.util-analytics-chart\s*\{[^}]*border:\s*1\.4px solid #111827;[^}]*background:\s*#ffffff;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-grid\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-value\s*\{[^}]*paint-order:\s*stroke;[^}]*stroke:\s*#ffffff;[^}]*stroke-width:\s*3px;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-mount\[data-exp-report-chart-style="report-auto"\] \.util-analytics-chart-canvas svg > rect\[opacity\]\s*\{[^}]*opacity:\s*1;[^}]*stroke:\s*#ffffff;[^}]*rx:\s*2px;[^}]*shape-rendering:\s*crispEdges;/s);
  assert.match(styleContents['dashboard.css'], /\.experiment-chart-toolbar\s*\{[^}]*min-height:\s*40px;[^}]*border-bottom:\s*1px solid #dbe4f3;[^}]*box-shadow:\s*none;/s);
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
