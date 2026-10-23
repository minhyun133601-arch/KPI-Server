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
const navigationPath = path.join(appRoot, 'KPI.app.navigation.js');

const dashboardFacadePath = path.join(stylesRoot, 'shell', 'dashboard.css');
const dashboardChunkRoot = path.join(stylesRoot, 'shell', 'dashboard');
const shellChromeFacadePath = path.join(stylesRoot, 'shell', 'shell-chrome.css');
const shellChromeResponsivePath = path.join(
  stylesRoot,
  'shell',
  'shell-chrome',
  '03-home-area-responsive.css'
);
const dashboardChunkImports = [
  './dashboard/01-foundation.css',
  './dashboard/02-panels.css',
  './dashboard/03-override-stage-one.css',
  './dashboard/04-override-stage-two.css',
  './dashboard/05-experiment-composer.css?v=2',
  './dashboard/06-energy-kpi.css?v=6',
];

function getCssImports(source) {
  return [...source.matchAll(/@import\s+url\("([^"]+)"\);/g)];
}

function countCssLines(source) {
  const lines = source.split(/\r?\n/);
  return source.endsWith('\n') ? lines.length - 1 : lines.length;
}

async function resolveCssImports(filePath, ancestorPaths = []) {
  const resolvedPath = path.resolve(filePath);
  assert.equal(
    ancestorPaths.includes(resolvedPath),
    false,
    `css import cycle must not include ${resolvedPath}`
  );

  const source = await fs.readFile(resolvedPath, 'utf8');
  const imports = getCssImports(source);
  const importedFiles = [];
  let content = '';
  let cursor = 0;

  for (const match of imports) {
    const importedPath = path.resolve(path.dirname(resolvedPath), match[1].replace(/[?#].*$/, ''));
    const imported = await resolveCssImports(importedPath, [...ancestorPaths, resolvedPath]);
    content += source.slice(cursor, match.index) + imported.content;
    cursor = match.index + match[0].length;
    importedFiles.push(importedPath, ...imported.importedFiles);
  }

  content += source.slice(cursor);
  return { content, importedFiles, imports, source };
}

const styleEntries = [
  {
    href: `${runtimeDirName}/app/styles/shell/dashboard.css?v=115`,
    manifestHref: './styles/shell/dashboard.css?v=115',
    fileName: 'dashboard.css',
    relativeSegments: ['shell', 'dashboard.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/shell/shell-chrome.css?v=067`,
    manifestHref: './styles/shell/shell-chrome.css?v=067',
    fileName: 'shell-chrome.css',
    relativeSegments: ['shell', 'shell-chrome.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/work/work.css?v=068`,
    manifestHref: './styles/work/work.css?v=068',
    fileName: 'work.css',
    relativeSegments: ['work', 'work.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/work/team-report-document.css?v=007`,
    manifestHref: './styles/work/team-report-document.css?v=007',
    fileName: 'team-report-document.css',
    relativeSegments: ['work', 'team-report-document.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/work/team-report-date-detail.css?v=001`,
    manifestHref: './styles/work/team-report-date-detail.css?v=001',
    fileName: 'team-report-date-detail.css',
    relativeSegments: ['work', 'team-report-date-detail.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/metering/metering.css?v=089`,
    manifestHref: './styles/metering/metering.css?v=089',
    fileName: 'metering.css',
    relativeSegments: ['metering', 'metering.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/audit/audit.css?v=081`,
    manifestHref: './styles/audit/audit.css?v=081',
    fileName: 'audit.css',
    relativeSegments: ['audit', 'audit.css'],
  },
  {
    href: `${runtimeDirName}/app/styles/shared/status-team-marks.css?v=20260716a`,
    manifestHref: './styles/shared/status-team-marks.css?v=20260716a',
    fileName: 'status-team-marks.css',
    relativeSegments: ['shared', 'status-team-marks.css'],
  },
];

const kpiHtml = await fs.readFile(kpiHtmlPath, 'utf8');
const shellManifest = await fs.readFile(shellManifestPath, 'utf8');
const shellChromeFacade = await fs.readFile(shellChromeFacadePath, 'utf8');
const shellChromeResponsive = await fs.readFile(shellChromeResponsivePath, 'utf8');
const navigationSource = await fs.readFile(navigationPath, 'utf8');
const resolvedDashboard = await resolveCssImports(dashboardFacadePath);
const styleContents = Object.fromEntries(
    await Promise.all(
    styleEntries.map(async ({ fileName, relativeSegments }) => [
      fileName,
      (await resolveCssImports(path.join(stylesRoot, ...relativeSegments))).content,
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

test('monthly utility meter sheet alignment stays limited to the three requested desktop sheets', () => {
  const meteringCss = styleContents['metering.css'];
  const startMarker = '/* Monthly utility meter sheet alignment: start */';
  const endMarker = '/* Monthly utility meter sheet alignment: end */';
  const startIndex = meteringCss.indexOf(startMarker);
  const endIndex = meteringCss.indexOf(endMarker, startIndex);

  assert.ok(startIndex >= 0, 'monthly utility meter sheet alignment start marker must exist');
  assert.ok(endIndex > startIndex, 'monthly utility meter sheet alignment end marker must exist');

  const scopedCss = meteringCss.slice(startIndex, endIndex + endMarker.length);
  const scopedLinkKeys = new Set(
    [...scopedCss.matchAll(/data-utility-entry-experiment-meter-link-key="([^"]+)"/g)]
      .map(([, linkKey]) => linkKey)
  );

  assert.deepEqual(
    [...scopedLinkKeys].sort(),
    ['electric_yusan', 'gas_yusan_lng', 'gas_yusan_lpg'],
    'alignment rules must target only the requested monthly electric, LNG, and LPG meter sheets'
  );
  assert.match(scopedCss, /\.util-sheet-gas-view-toggle/);
  assert.match(scopedCss, /\[data-role="util-sheet-report-print"\]/);
  assert.match(scopedCss, /\.util-sheet-meter-table-card/);
  assert.match(scopedCss, /min-height:\s*28px;/);
  assert.match(scopedCss, /border-radius:\s*4px;/);
  assert.match(scopedCss, /box-shadow:\s*none;/);
  assert.doesNotMatch(
    scopedCss,
    /utility-entry-experiment-(?:form-table|input)|data-dataset-key="waste"|@media/,
    'alignment rules must not alter entry fields, waste sheets, or mobile breakpoints'
  );
});

test('viewer header keeps account, timing, logout, and save details in compact groups', () => {
  const requiredIds = [
    'viewer-auth-bar',
    'viewer-auth-identity',
    'viewer-auth-role',
    'viewer-auth-id',
    'viewer-auth-logout',
    'global-save-recent-chip',
    'global-save-recent-value',
    'global-save-date-chip',
    'global-save-date-value',
    'global-save-button',
  ];

  for (const id of requiredIds) {
    assert.match(kpiHtml, new RegExp(`id="${id}"`), `${id} must remain available in the viewer header`);
  }

  assert.match(
    kpiHtml,
    /class="global-save-context"[^>]*>[\s\S]*id="global-save-recent-chip"[\s\S]*id="global-save-date-chip"[\s\S]*<\/div>/
  );
  const viewerAuthMarkup = kpiHtml.slice(
    kpiHtml.indexOf('id="viewer-auth-bar"'),
    kpiHtml.indexOf('id="global-save-recent-chip"')
  );
  assert.doesNotMatch(viewerAuthMarkup, /runtime-auth-caption/);
  assert.match(viewerAuthMarkup, /runtime-auth-segment-main[^>]*>\s*<strong id="viewer-auth-identity"/);
  assert.match(kpiHtml, /class="label">오늘<\/span>/);

  const shellCss = styleContents['shell-chrome.css'];
  assert.match(
    shellCss,
    /\.viewer-header-actions \.runtime-auth-bar\s*\{[^}]*display:\s*inline-flex;[^}]*align-items:\s*stretch;[^}]*height:\s*44px;[^}]*border-radius:\s*7px;/s
  );
  assert.match(
    shellCss,
    /\.global-save-context\s*\{[^}]*display:\s*inline-grid;[^}]*height:\s*44px;[^}]*overflow:\s*hidden;[^}]*border-radius:\s*7px;/s
  );
  assert.match(shellCss, /\.global-save-button\s*\{[^}]*height:\s*44px;[^}]*border-radius:\s*7px;/s);
  assert.match(
    shellCss,
    /@media \(max-width:\s*640px\)[\s\S]*\.viewer-header-actions \.runtime-auth-bar\s*\{[^}]*grid-column:\s*1 \/ -1;/s
  );
  assert.match(
    shellChromeResponsive,
    /@media \(max-width:\s*900px\)[\s\S]*\.viewer-header\s*\{[^}]*flex-wrap:\s*wrap;/s
  );
  assert.match(
    shellChromeResponsive,
    /@media \(max-width:\s*640px\)[\s\S]*\.viewer-header-actions \.global-save-dock\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto;/s
  );
  assert.match(shellChromeFacade, /01-shell-runtime\.css\?v=067/);
  assert.match(shellChromeFacade, /03-home-area-responsive\.css\?v=067/);
});

test('management policy home keeps its copy and uses the clean full-viewport layout', () => {
  const expectedCopy = [
    '2026년 경영방침',
    '새로운 기준으로 지속 성장의 기반을 구축한다',
    'AI 역량을 확보하여 업무효율을 극대화한다.',
    '신소가 행동강령',
    '신뢰(信賴)',
    '“의지하고, 이해하고, 믿고, 열어라”',
    '“의리신열”',
    '차이나 부족함을 인정하고 스스로를 낮추는 겸손한 자세',
    '상대를 배려, 존중하고 이해하려는 태도',
    '존중, 성실, 책임 있는 행동을 취하는 자세',
    '개방적이고 열린 마음으로 받아들이려는 자세',
    '소통(疏通)',
    '“찾아가고, 다가가고, 듣고, 말하라”',
    '“방다청설”',
    '적극적인 문제해결과 도전하려는 자세',
    '자발적이며 친절하게 협업하고 협력하는 모습',
    '경청하고 수용하는 태도',
    '진정성과 공감대 형성을 위한 적극적인 자세',
    '가치창조(價値創造)',
    '“경험하고, 나누고, 배우고, 쓸모있게 하라”',
    '“경나학쓸”',
    '도전을 통해 노하우를 쌓고 다양한 기능과 지식을 획득하는 자세',
    '생각과 정보를 나누고 공유하는 자세',
    '새로운 기술과 환경에서 아이디어를 찾고 학습하려는 자세',
    '창의적인 마인드와 가치지향적인 태도',
  ];

  for (const copy of expectedCopy) {
    assert.ok(navigationSource.includes(copy), `management policy copy must remain unchanged: ${copy}`);
  }

  const shellCss = styleContents['shell-chrome.css'];
  const homeStart = shellCss.indexOf('.viewer-home-shell {');
  const homeEnd = shellCss.indexOf('.work-metering-embed-shell {', homeStart);
  const homeCss = shellCss.slice(homeStart, homeEnd);

  assert.ok(homeStart >= 0 && homeEnd > homeStart, 'management policy home css must remain discoverable');
  assert.match(homeCss, /height:\s*calc\(100dvh - 60px\);/);
  assert.match(homeCss, /grid-template-rows:\s*minmax\(250px, 0\.9fr\) minmax\(330px, 1\.1fr\);/);
  assert.match(homeCss, /grid-template-columns:\s*minmax\(280px, 32%\) minmax\(0, 1fr\);/);
  assert.match(homeCss, /\.viewer-home-guideline-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/s);
  assert.match(homeCss, /@media \(max-width: 1080px\)[\s\S]*grid-template-columns:\s*1fr;/);
  assert.doesNotMatch(homeCss, /max-width:\s*1260px|radial-gradient|backdrop-filter|box-shadow/);
});

test('dashboard compatibility facade keeps recursive chunks ordered and bounded', async () => {
  assert.deepEqual(
    resolvedDashboard.imports.map((match) => match[1]),
    dashboardChunkImports,
    'dashboard facade imports must keep the documented cascade order'
  );
  assert.deepEqual(
    resolvedDashboard.importedFiles,
    dashboardChunkImports.map((importPath) => path.resolve(path.dirname(dashboardFacadePath), importPath.replace(/[?#].*$/, ''))),
    'dashboard recursive import traversal must resolve every documented chunk in order'
  );
  assert.equal(
    resolvedDashboard.source.replace(/@import\s+url\("[^"]+"\);/g, '').trim(),
    '',
    'dashboard.css must remain an import-only compatibility facade'
  );
  assert.ok(countCssLines(resolvedDashboard.source) < 100, 'dashboard facade must stay below 100 lines');

  for (const importPath of dashboardChunkImports) {
    const chunkPath = path.resolve(path.dirname(dashboardFacadePath), importPath.replace(/[?#].*$/, ''));
    assert.equal(path.dirname(chunkPath), dashboardChunkRoot, `${importPath} must stay in the dashboard chunk directory`);
    const chunkStat = await fs.stat(chunkPath);
    const chunkSource = await fs.readFile(chunkPath, 'utf8');
    assert.ok(chunkStat.isFile(), `${importPath} must exist as a CSS file`);
    assert.ok(countCssLines(chunkSource) <= 800, `${importPath} must stay at or below 800 lines`);
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
  assert.doesNotMatch(styleContents['shell-chrome.css'], /sidebar-item-team/);

  assert.match(styleContents['work.css'], /\.work-btn\s*\{/);
  assert.match(styleContents['work.css'], /\.work-save-status\s*\{/);
  assert.match(styleContents['work.css'], /\.work-team-calendar-inline-shell\s*\{/);
  assert.doesNotMatch(styleContents['work.css'], /\.work-panel\s*\{|work-chooser|work-team-hero|work-team-outline|work-team-glyph/);
  assert.doesNotMatch(styleContents['work.css'], /f107/);
  assert.match(styleContents['work.css'], /\.work-team-calendar-production-action-list\s*\{[^}]*position:\s*static;/s);
  assert.match(styleContents['work.css'], /\.work-team-calendar-utility-action-slot\s*\{[^}]*position:\s*absolute;/s);
  assert.match(styleContents['work.css'], /\.work-team-calendar-utility-chip \.work-team-calendar-production-action-list\s*\{[^}]*position:\s*absolute;/s);
  assert.match(styleContents['team-report-document.css'], /\.work-team-calendar-dialog\.is-team-report-document \.work-team-calendar-topbar\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(
    styleContents['team-report-date-detail.css'],
    /\.work-team-calendar-overlay-layer\.is-date-detail\s*\{[^}]*place-items:\s*center;[^}]*overflow:\s*hidden;/s
  );
  assert.match(
    styleContents['team-report-date-detail.css'],
    /\.work-team-calendar-editor\.is-floating\.is-date-detail\s*\{[^}]*width:\s*min\(860px,\s*calc\(100% - 12px\)\);[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\);/s
  );
  assert.match(
    styleContents['team-report-date-detail.css'],
    /\.work-team-calendar-detail-body\s*\{[^}]*align-content:\s*start;[^}]*overflow:\s*auto;/s
  );
  assert.match(
    styleContents['team-report-date-detail.css'],
    /@media \(max-width:\s*760px\)[\s\S]*\.work-team-calendar-overlay-layer\.is-date-detail\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*8px;/s
  );

  assert.match(styleContents['metering.css'], /\.util-tabs-wrap\s*\{/);
  assert.doesNotMatch(styleContents['metering.css'], /\.month-panel\s*\{|Monthly plan calendar/);
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
    /\.audit-lux-shell,\s*\.audit-lux-modal\s*\{[^}]*font-family:\s*"Noto Sans KR",\s*system-ui,\s*-apple-system,\s*BlinkMacSystemFont,\s*"Segoe UI",\s*sans-serif;/s
  );
  assert.doesNotMatch(
    styleContents['audit.css'],
    /font-family:\s*Arial,\s*["']Malgun Gothic["'],\s*["']Noto Sans KR["']/
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-shell\s*\{[^}]*height:\s*calc\(100vh - 84px\);[^}]*padding:\s*12px;[^}]*background:\s*#f3f4f6;/s
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
    /\.audit-lux-window-header\s*\{[^}]*grid-template-columns:\s*34px\s*minmax\(260px,\s*1fr\)\s*auto;[^}]*min-height:\s*54px;[^}]*padding:\s*10px\s*12px;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-window-title\s*\{[^}]*font-size:\s*1\.25rem;[^}]*line-height:\s*1\.2;/s
  );
  assert.match(
    styleContents['audit.css'],
    /\.audit-lux-fullscreen-toggle\s*\{[^}]*width:\s*38px;[^}]*height:\s*38px;[^}]*border-radius:\s*7px;/s
  );
  assert.match(
    styleContents['status-team-marks.css'], /\.audit-lux-index-team-cell \.audit-lux-index-team-label\s*,[\s\S]*\.kpi-team-display\s*\{/);
  assert.match(styleContents['status-team-marks.css'], /\.kpi-team-display-icon\s*\{[^}]*width:\s*24px[^}]*height:\s*24px[^}]*background:\s*color-mix\(in srgb, var\(--kpi-team-accent\) 8%, #ffffff\)/s);
  assert.match(styleContents['status-team-marks.css'], /\.kpi-team-display-icon svg\s*\{[^}]*width:\s*16px[^}]*height:\s*16px/s);
  assert.match(styleContents['status-team-marks.css'], /--kpi-team-4:\s*#dc2626;/);
  assert.match(styleContents['status-team-marks.css'], /\.audit-lux-index-card\.is-team1part1,[\s\S]*--kpi-team-accent:\s*var\(--kpi-team-1-1\);/);
  assert.match(styleContents['status-team-marks.css'], /\.work-history-app \.work-history-experiment-team\.team4\s*\{[^}]*--kpi-team-accent:\s*var\(--kpi-team-4\);/s);
  assert.match(styleContents['status-team-marks.css'], /\.work-history-app \.work-history-experiment-team\s*\{[^}]*border-top:\s*3px solid var\(--kpi-team-accent\)/s);
  assert.match(styleContents['status-team-marks.css'], /\.work-history-app \.work-history-experiment-team-head\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--kpi-team-accent\) 10%, var\(--white\)\)/s);
  assert.match(styleContents['status-team-marks.css'], /\.audit-lux-index-team-cell\s*\{[^}]*background:\s*color-mix\(in srgb, var\(--kpi-team-accent\) 10%, #ffffff\)[^}]*box-shadow:\s*inset 3px 0 0 var\(--kpi-team-accent\)/s);
  assert.doesNotMatch(styleContents['status-team-marks.css'], /audit-lux-index-team-label::before|work-history-experiment-team-name::before/);
  assert.doesNotMatch(styleContents['status-team-marks.css'], /background:\s*var\(--kpi-team-1-[12]\);/);
  assert.match(styleContents['status-team-marks.css'], /\.work-history-app \.work-history-experiment-status\.is-complete,[\s\S]*\.audit-lux-progress-select\.is-complete\s*\{/);
  assert.match(styleContents['status-team-marks.css'], /\.work-history-app \.work-history-experiment-status\.is-incomplete,[\s\S]*\.audit-lux-progress-select\.is-incomplete\s*\{/);
  assert.match(styleContents['status-team-marks.css'], /\.audit-lux-progress-select\.is-progress\s*\{/);
});

test('audit lux team workspace scopes its selection progress and responsive document layout', async () => {
  const teamCss = await fs.readFile(path.join(stylesRoot, 'audit', 'audit-lux-team.css'), 'utf8');
  const auditFacade = await fs.readFile(path.join(stylesRoot, 'audit', 'audit.css'), 'utf8');
  assert.match(auditFacade, /@import\s+url\(["']\.\/audit-lux-team\.css\?v=4["']\)/);
  assert.match(teamCss, /\.audit-lux-shell\.is-team-view\s+\.audit-lux-team-workspace\s*\{/);
  assert.match(teamCss, /\.audit-lux-shell\.is-team-view\s+\.audit-lux-quarter-list\s*\{/);
  assert.match(teamCss, /\.audit-lux-shell\.is-team-view\s+button:focus-visible/);
  assert.match(teamCss, /\.audit-lux-shell\.is-team-view\s+\.audit-lux-document\s*\{/);
  assert.match(
    teamCss,
    /\.audit-lux-shell\.is-team-view\s+\.audit-lux-quarter-button\.is-complete\s*\{[^}]*--audit-lux-quarter-surface:\s*var\(--audit-lux-complete-surface\);/s
  );
  assert.match(
    teamCss,
    /\.audit-lux-shell\.is-team-view\s+\.audit-lux-quarter-button\.is-complete\s+\.audit-lux-quarter-state\s*\{[^}]*color:\s*var\(--audit-lux-complete\);/s
  );
  assert.match(
    teamCss,
    /\.audit-lux-shell\.is-team-view\s+\.audit-lux-quarter-button\.is-incomplete\s+\.audit-lux-quarter-state\s*\{[^}]*color:\s*var\(--audit-lux-incomplete\);/s
  );
  assert.match(
    teamCss,
    /\.audit-lux-quarter-button\.is-selected:hover:not\(:disabled\)\s*\{[^}]*outline:\s*1px solid var\(--audit-lux-foreground\);[^}]*background:\s*var\(--audit-lux-quarter-surface,/s
  );
  assert.match(
    teamCss,
    /\.audit-lux-quarter-button:disabled\s+\.audit-lux-quarter-state\s*\{[^}]*color:\s*var\(--audit-lux-foreground-muted\);/s
  );
  assert.match(teamCss, /@media\s*\(max-width:[^)]+\)[\s\S]*\.audit-lux-shell\.is-team-view/);
  assert.doesNotMatch(teamCss, /(?:^|\})\s*\.audit-lux-(?:quarter|document|completion|team)-[^{}]*\{/);
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
