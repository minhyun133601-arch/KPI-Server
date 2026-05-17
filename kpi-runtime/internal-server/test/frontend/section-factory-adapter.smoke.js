import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const sectionSourcePaths = [
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.factory-adapter.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.builders.js'),
  path.join(repoRoot, 'team-report', 'runtime', 'work', 'sections', 'KPI.sections.work.js'),
  path.join(repoRoot, 'utility', 'runtime', 'util', 'sections', 'KPI.sections.util.js'),
  path.join(repoRoot, 'data-entry', 'runtime', 'data', 'sections', 'KPI.sections.data.js'),
  path.join(repoRoot, 'audit', 'runtime', 'audit', 'sections', 'KPI.sections.audit.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.report.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.owner.js'),
  path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.registry.js'),
];

const sectionSources = await Promise.all(
  sectionSourcePaths.map(async (targetPath) => ({
    filename: path.basename(targetPath),
    source: await fs.readFile(targetPath, 'utf8'),
  }))
);
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function createContext() {
  const context = {
    window: {},
    Object,
    String,
    Array,
  };
  vm.createContext(context);
  sectionSources.forEach(({ filename, source }) => {
    vm.runInContext(source, context, { filename });
  });
  return context;
}

function getOpenDivBalanceBefore(content, marker) {
  const rootAttributeIndex = content.indexOf('data-report-deck-editor');
  const markerIndex = content.indexOf(marker);
  assert.ok(rootAttributeIndex >= 0, 'report deck editor root is missing');
  assert.ok(markerIndex > rootAttributeIndex, `${marker} must render after the report deck root`);
  const rootOpenIndex = content.lastIndexOf('<div', rootAttributeIndex);
  const fragment = content.slice(rootOpenIndex, markerIndex);
  const openCount = (fragment.match(/<div\b/g) || []).length;
  const closeCount = (fragment.match(/<\/div>/g) || []).length;
  return openCount - closeCount;
}

test('section factory adapter registers dashboard sections without direct section globals', () => {
  const context = createContext();
  const factories = context.window.KpiSectionFactories;
  const registry = context.window.KpiSectionRegistry;

  assert.equal(typeof context.window.KpiSectionFactoryAdapter.registerFactory, 'function');
  assert.equal(typeof factories.work, 'function');
  assert.equal(typeof factories.util, 'function');
  assert.equal(typeof factories.audit, 'function');
  assert.equal(typeof factories.data, 'function');
  assert.equal(typeof factories.report, 'function');
  assert.equal(typeof factories.owner, 'function');
  assert.equal(typeof registry.registerSections, 'function');

  const appData = registry.registerSections({});
  assert.deepEqual(Object.keys(appData), ['work', 'util', 'audit', 'data', 'report', 'owner']);
  assert.equal(appData.work.name, '팀별내역서');
  assert.equal(appData.util.name, '유틸리티');
  assert.equal(appData.audit.name, '오디트');
  assert.equal(
    JSON.stringify(appData.audit.categories.map((category) => category.dataKey)),
    JSON.stringify(['audit_lux', 'audit_legal_facility'])
  );
  assert.equal(appData.data.name, '데이터 관리');
  assert.equal(appData.report.name, '보고서');
  assert.equal(appData.report.directLaunch, true);
  assert.equal(appData.report.hideNavigationChevron, true);
  assert.equal(appData.report.launchTarget, 'popup');
  assert.equal(appData.report.launchWindowName, 'kpi-report-editor');
  assert.equal(appData.report.launchFillScreen, true);
  assert.equal(appData.report.launchPopupMode, 'report');
  assert.equal(appData.report.launchRoute.view, 'category');
  assert.equal(appData.report.launchRoute.sectionId, 'report');
  assert.equal(appData.report.launchRoute.categoryIndex, 0);
  assert.equal(Array.isArray(appData.report.categories), true);
  assert.equal(appData.report.categories.length, 1);
  assert.equal(appData.report.categories[0].navHidden, true);
  assert.equal(appData.report.categories[0].viewerMode, 'full-bleed');
  assert.match(appData.report.categories[0].content, /data-report-deck-editor/);
  assert.match(appData.report.categories[0].content, /data-report-active-view="hq"/);
  assert.match(appData.report.categories[0].content, /data-report-field="title"/);
  assert.match(appData.report.categories[0].content, /data-report-date-input/);
  assert.match(appData.report.categories[0].content, /data-report-field="department"[^>]*>생산본부<\/div>/);
  assert.equal((appData.report.categories[0].content.match(/data-report-field="department"/g) || []).length, 1);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-1" data-report-slide-label="표지"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-2" data-report-slide-label="표지"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-3" data-report-slide-label="표지"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="public-works" data-report-slide-label="표지"/);
  assert.match(appData.report.categories[0].content, /class="report-slide-department" contenteditable="false" spellcheck="false">생산1팀<\/div>/);
  assert.match(appData.report.categories[0].content, /class="report-slide-department" contenteditable="false" spellcheck="false">생산2팀<\/div>/);
  assert.match(appData.report.categories[0].content, /class="report-slide-department" contenteditable="false" spellcheck="false">생산3팀<\/div>/);
  assert.match(appData.report.categories[0].content, /class="report-slide-department" contenteditable="false" spellcheck="false">공무환경팀<\/div>/);
  assert.match(appData.report.categories[0].content, /data-report-month-select/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-production-contents-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="본부 목차"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-slide="0"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="public-works"/);
  assert.match(appData.report.categories[0].content, /data-report-next-month-label/);
  assert.match(appData.report.categories[0].content, /data-report-contents-page-range="production-team-1"[^>]*>3-8<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-contents-page-range="production-team-2"[^>]*>9-14<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-contents-page-range="production-team-3"[^>]*>15-20<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-contents-page-range="public-works"[^>]*>21-29<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam1ContentsItem1"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam2ContentsItem2"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam3ContentsItem4"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="contentsItem4"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="목차"/);
  assert.match(appData.report.categories[0].content, /class="report-contents-item-text"[\s\S]*data-report-next-month-label>5월<\/span>\s*<span data-report-field="contentsItem4"/);
  assert.match(appData.report.categories[0].content, /Ⅳ\. 공무환경팀/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="hq"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-1"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-2"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-3"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-1"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-2"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-3"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="public-works"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1ContentsTitle"[^>]*contenteditable="false"[^>]*>Contents<\/div>/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1ContentsItem1"[^>]*contenteditable="false"[^>]*>생산실적\(생산량\)<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2ContentsItem3"[^>]*contenteditable="false"[^>]*>생산지표 2-1 노동생산성 \(직접노무비\/kg\)<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3ContentsItem4"[^>]*contenteditable="false"[^>]*>생산지표 2-2 수율<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-field="contentsItem1"[^>]*contenteditable="false"[^>]*>에너지 실적<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-next-month-label>5월<\/span>\s*<span data-report-field="contentsItem4"[^>]*>주요계획<\/span>/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-template-slide report-production-start-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-production-start-analysis="team_01"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1StartTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2StartSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3StartSection"/);
  assert.match(appData.report.categories[0].content, /report-production-start-summary-table/);
  assert.match(appData.report.categories[0].content, /report-production-start-cause-table/);
  assert.match(appData.report.categories[0].content, /<col class="report-production-col-part">/);
  assert.match(appData.report.categories[0].content, /<col class="report-production-cause-col-reason">/);
  assert.match(appData.report.categories[0].content, /report-production-start-chart-grid/);
  assert.match(appData.report.categories[0].content, /data-report-production-start-value="part1\.sd\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-production-start-cause="part1\.sd\.yoyRate"/);
  assert.match(appData.report.categories[0].content, /data-report-production-start-chart-plot="part1"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="production-start:team_01:part1"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="auto:bukjeong-utility:gas"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="auto:yusan-lpg:cost"/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-template-slide report-production-labor-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1LaborTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2LaborSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3LaborSection"/);
  assert.match(appData.report.categories[0].content, /report-production-labor-summary-table/);
  assert.match(appData.report.categories[0].content, /report-production-labor-cause-table/);
  assert.match(appData.report.categories[0].content, /<col class="report-production-cause-col-reason-wide">/);
  assert.match(appData.report.categories[0].content, /report-production-labor-chart-grid/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-template-slide report-production-labor-slide report-production-direct-labor-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1DirectLaborTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2DirectLaborSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3DirectLaborSection"/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-template-slide report-production-yield-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-production-yield-analysis="team_01"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1YieldTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2YieldSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3YieldSection"/);
  assert.match(appData.report.categories[0].content, /report-production-yield-summary-table/);
  assert.match(appData.report.categories[0].content, /report-production-yield-cause-table/);
  assert.match(appData.report.categories[0].content, /report-production-yield-chart-grid/);
  assert.match(appData.report.categories[0].content, /data-report-production-yield-value="part1\.sd\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-production-yield-cause="part1\.sd\.yoyDelta"/);
  assert.match(appData.report.categories[0].content, /data-report-production-yield-chart-plot="part1"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="production-yield:team_01:part1"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-mode="point"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-mode="range"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-reset="part1"/);
  assert.match(appData.report.categories[0].content, /1\) 1파트 생산량 :/);
  assert.match(appData.report.categories[0].content, /2\) 2파트 생산량 :/);
  assert.match(appData.report.categories[0].content, /당월실적<br>\(TON\)/);
  assert.match(appData.report.categories[0].content, /전년대비 증감 요인/);
  assert.match(appData.report.categories[0].content, /1\) 1파트 노동생산성\(kg\/M\.hr\):/);
  assert.match(appData.report.categories[0].content, /2\) 2파트 노동생산성\(kg\/M\.hr\):/);
  assert.match(appData.report.categories[0].content, /생산지표 2-1 노동생산성/);
  assert.match(appData.report.categories[0].content, /단위: kg\/M\.hr/);
  assert.match(appData.report.categories[0].content, /3\) 1파트 노동생산성\(직접노무비\/kg\) :/);
  assert.match(appData.report.categories[0].content, /4\) 2파트 노동생산성 \(직접노무비\/kg\) :/);
  assert.match(appData.report.categories[0].content, /직접노무비\/kg 및 인원현황/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="생산지표 2-1 노동생산성 직접노무비\/kg"/);
  assert.match(appData.report.categories[0].content, /1\) 1파트 수율 :/);
  assert.match(appData.report.categories[0].content, /2\) 2파트 수율 :/);
  assert.match(appData.report.categories[0].content, /생산지표 2-2 수율/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="생산지표 2-2 수율"/);
  assert.match(appData.report.categories[0].content, /단위: %/);
  assert.doesNotMatch(appData.report.categories[0].content, /1,412|1,568|83\.8%|93\.3%/);
  assert.doesNotMatch(appData.report.categories[0].content, /116\.5|153\.2|105\.1|153\.4/);
  assert.doesNotMatch(appData.report.categories[0].content, /91\.5|71\.1|35\.8%|64\.2/);
  assert.doesNotMatch(appData.report.categories[0].content, /97\.8|98\.5|100\.5|101\.8/);
  assert.match(appData.report.categories[0].content, /report-deck-save-message/);
  assert.match(appData.report.categories[0].content, /data-report-print-pdf/);
  assert.match(appData.report.categories[0].content, /data-report-export-html/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-toggle/);
  assert.match(appData.report.categories[0].content, /data-report-memo-dialog/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-dialog/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-list/);
  assert.match(appData.report.categories[0].content, /data-report-memo-team/);
  assert.match(appData.report.categories[0].content, /data-report-memo-metric/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide3GasMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide4ElectricMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide5LpgMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide6WasteMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide7WasteMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-content="slide7WasteMemo"/);
  assert.ok(getOpenDivBalanceBefore(appData.report.categories[0].content, 'data-report-memo-dialog') > 0);
  assert.ok(getOpenDivBalanceBefore(appData.report.categories[0].content, 'data-report-memo-overview-dialog') > 0);
  assert.match(appData.report.categories[0].content, /data-report-memo-lines/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-line\.is-up,\s*\.report-auto-memo-line\.is-down \{ color: #111827; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-delta\.is-up \{ color: #c00000; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-delta\.is-down \{ color: #2f75b5; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-add,\s*\.report-auto-memo-delete \{ display: none;/);
  assert.match(appData.report.categories[0].content, /\.report-deck-editor\[data-report-edit-mode="editing"\] \.report-auto-memo-add,\s*\.report-deck-editor\[data-report-edit-mode="editing"\] \.report-auto-memo-delete \{ display: inline-flex; \}/);
  assert.match(appData.report.categories[0].content, /\.report-memo-candidate-add/);
  assert.match(appData.report.categories[0].content, /\.report-contents-list\s*\{[^}]*left:\s*5\.3%[^}]*padding:\s*0[^}]*counter-reset:\s*report-contents/);
  assert.match(appData.report.categories[0].content, /\.report-contents-list li\s*\{[^}]*grid-template-columns:\s*44px minmax\(0,\s*1fr\)/);
  assert.match(appData.report.categories[0].content, /\.report-contents-item-text\s*\{[^}]*grid-column:\s*2[^}]*white-space:\s*nowrap/);
  assert.match(appData.report.categories[0].content, /\.report-production-contents-team \.report-contents-item-text\s*\{[^}]*display:\s*inline[^}]*white-space:\s*normal/);
  assert.match(appData.report.categories[0].content, /class="report-slide-top-brand"/);
  assert.match(appData.report.categories[0].content, /\.report-slide-top-brand\s*\{[^}]*top:\s*2\.55%[^}]*height:\s*3\.7%[^}]*display:\s*inline-flex[^}]*align-items:\s*center/);
  assert.match(appData.report.categories[0].content, /\.report-slide-top-brand \.report-slide-section\s*\{[^}]*font-size:\s*14px[^}]*white-space:\s*nowrap/);
  assert.match(appData.report.categories[0].content, /\.report-template-title\s*\{[^}]*left:\s*3\.4%[^}]*top:\s*2\.55%[^}]*font-size:\s*22px/);
  assert.match(appData.report.categories[0].content, /\.report-chart-highlight-toggle\.has-highlight\s*\{[^}]*box-shadow:\s*0 0 0 2px rgba\(239,\s*68,\s*68,\s*0\.18\)/);
  assert.match(appData.report.categories[0].content, /\.report-chart-highlight-reset\.has-highlight\s*\{[^}]*box-shadow:\s*0 0 0 2px rgba\(17,\s*24,\s*39,\s*0\.16\)/);
  assert.match(appData.report.categories[0].content, /\.report-chart-highlight-hit\.is-highlighted\s*\{[^}]*fill:\s*transparent[^}]*stroke:\s*#ff0000[^}]*stroke-width:\s*2\.8/);
  assert.match(appData.report.categories[0].content, /\.report-chart-highlight-hit\.is-range-start\s*\{[^}]*stroke:\s*#111827[^}]*stroke-width:\s*2\.4/);
  assert.match(appData.report.categories[0].content, /\.report-chart-highlight-range\s*\{[^}]*stroke:\s*#111827[^}]*stroke-width:\s*2\.4/);
  assert.match(appData.report.categories[0].content, /data-report-edit-toggle/);
  assert.match(appData.report.categories[0].content, /data-report-fullscreen/);
  assert.match(appData.report.categories[0].content, /@page \{ size: 297mm 210mm; margin: 0; \}/);
  assert.match(appData.report.categories[0].content, /\*::-webkit-scrollbar \{ width: 0 !important; height: 0 !important; display: none !important; \}/);
  assert.match(appData.report.categories[0].content, /\.report-deck-editor\[data-report-print-mode="true"\] \.report-deck-toolbar,\s*\.report-deck-editor\[data-report-print-mode="true"\] \.report-deck-sidebar/);
  assert.match(appData.report.categories[0].content, /\.report-slide\[data-report-print-visible="true"\]\s*\{[^}]*width:\s*297mm !important[^}]*height:\s*167\.0625mm !important[^}]*margin:\s*21\.46875mm 0 !important/);
  assert.match(appData.report.categories[0].content, /\.report-production-start-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/);
  assert.match(appData.report.categories[0].content, /\.report-production-start-layout::before,\s*\.report-production-labor-layout::before,\s*\.report-production-yield-layout::before\s*\{[^}]*left:\s*50%[^}]*background:\s*#f59e0b/);
  assert.match(appData.report.categories[0].content, /\.report-production-start-column\s*\{[^}]*grid-template-rows:\s*8% 13\.2% 9\.8% 24\.8% 6\.2% minmax\(0,\s*1fr\)/);
  assert.match(appData.report.categories[0].content, /\.report-production-labor-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/);
  assert.match(appData.report.categories[0].content, /\.report-production-yield-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/);
  assert.match(appData.report.categories[0].content, /\.report-production-col-value\s*\{ width:\s*16\.6%; \}/);
  assert.match(appData.report.categories[0].content, /\.report-production-cause-col-reason-wide\s*\{ width:\s*66%; \}/);
  assert.match(appData.report.categories[0].content, /\.report-production-start-cause-table td:last-child\s*\{[^}]*padding-left:\s*6px[^}]*overflow-wrap:\s*anywhere/);
  assert.match(appData.report.categories[0].content, /data-report-stage/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="bukjeong-utility"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="yusan-utility"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-analysis/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-template-slide report-bukjeong-analysis-slide report-yusan-lpg-analysis-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-table="left"/);
  assert.match(appData.report.categories[0].content, /<th class="report-auto-row-label">1팀 2파트<\/th>/);
  assert.match(appData.report.categories[0].content, /생산량<br>\(kg\)/);
  assert.match(appData.report.categories[0].content, /사용량<br>\(kg\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /1팀 2파트<br>LPG/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.current"/);
  assert.match(appData.report.categories[0].content, /class="report-auto-chart report-lpg-chart" data-report-yusan-lpg-chart="unit"/);
  assert.match(appData.report.categories[0].content, /class="report-auto-chart-plot report-lpg-chart-plot" data-report-yusan-lpg-chart-plot="unit"/);
  assert.match(appData.report.categories[0].content, /\.report-yusan-lpg-analysis-slide \.report-bukjeong-analysis-column\s*\{[^}]*grid-template-rows:\s*25% 53% 18%[^}]*gap:\s*2\.6%/);
  assert.match(appData.report.categories[0].content, /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table,\s*\.report-yusan-lpg-analysis-slide \.report-lpg-chart,\s*\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-memo\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-table="right"/);
  assert.match(appData.report.categories[0].content, /<th class="report-auto-row-label">비율<\/th>/);
  assert.doesNotMatch(appData.report.categories[0].content, /<th class="report-auto-row-label">차 액<\/th>/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-month-label="current"[\s\S]*data-report-yusan-lpg-month-label="reference"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-yusan-lpg-month-label="previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.current"[\s\S]*data-report-yusan-lpg-value="usage\.reference"[\s\S]*data-report-yusan-lpg-value="usage\.yoy"[\s\S]*data-report-yusan-lpg-value="usage\.previous"[\s\S]*data-report-yusan-lpg-value="usage\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-month-label="current"[\s\S]*data-report-yusan-lpg-cost-month-label="reference"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-yusan-lpg-cost-month-label="previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.current"[\s\S]*data-report-yusan-lpg-cost-value="0\.reference"[\s\S]*data-report-yusan-lpg-cost-value="0\.yoy"[\s\S]*data-report-yusan-lpg-cost-value="0\.previous"[\s\S]*data-report-yusan-lpg-cost-value="0\.mom"/);
  assert.doesNotMatch(appData.report.categories[0].content, /증감\(%\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /증감율\(%\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /class="report-yusan-lpg-colgroup"/);
  assert.doesNotMatch(appData.report.categories[0].content, /<td class="report-auto-note-cell" rowspan="3">1팀 2파트<\/td>/);
  assert.doesNotMatch(appData.report.categories[0].content, /<td class="report-auto-note-cell[^"]*" rowspan="3">LPG ⇒LNG<br>환산<\/td>/);
  assert.match(appData.report.categories[0].content, /class="report-auto-resource-cell report-yusan-lpg-cost-resource" rowspan="4">비용<br><span>\(원\)<\/span><small>LPG ⇒ LNG<br>환산<\/small>/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-chart-plot="cost"/);
  assert.match(appData.report.categories[0].content, /LPG 실제 금액 \/ LNG 환산 금액/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="bukjeong-waste"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="yusan-waste"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-month-label="current"[\s\S]*data-report-auto-month-label="reference"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-auto-month-label="previous"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.current"[\s\S]*data-report-auto-value="gas\.usage\.reference"[\s\S]*data-report-auto-value="gas\.usage\.yoy"[\s\S]*data-report-auto-value="gas\.usage\.previous"[\s\S]*data-report-auto-value="gas\.usage\.mom"/);
  assert.match(appData.report.categories[0].content, /전기<br><span>\(kWh\)<\/span>/);
  assert.match(appData.report.categories[0].content, /사용량<br>\(kWh\)/);
  assert.match(appData.report.categories[0].content, /data-report-auto-chart-plot="electric"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-value="usage\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-month-label="current"[\s\S]*data-report-waste-auto-month-label="reference"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-waste-auto-month-label="previous"[\s\S]*<th>전월대비<\/th>/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-value="usage\.current"[\s\S]*data-report-waste-auto-value="usage\.reference"[\s\S]*data-report-waste-auto-value="usage\.yoy"[\s\S]*data-report-waste-auto-value="usage\.previous"[\s\S]*data-report-waste-auto-value="usage\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-value="water\.current"[\s\S]*data-report-waste-auto-value="water\.reference"[\s\S]*data-report-waste-auto-value="water\.yoy"[\s\S]*data-report-waste-auto-value="water\.previous"[\s\S]*data-report-waste-auto-value="water\.mom"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-chart-plot/);
  assert.match(appData.report.categories[0].content, /class="report-plan-table"/);
  assert.match(appData.report.categories[0].content, /class="report-plan-table report-status-table"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-slide="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-slide="slide9"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-add-slot="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-add-slot="slide9"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-delete-slot="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-delete-slot="slide9"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide8BeforeImage"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide8AfterImage"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide9Image"/);
  assert.match(appData.report.categories[0].content, /class="report-status-slot-col" data-report-plan-slot="slide8\.1" data-report-plan-local-slot="1"/);
  assert.match(appData.report.categories[0].content, /class="report-plan-slot-col" data-report-plan-slot="slide9\.1" data-report-plan-local-slot="1"/);
  assert.match(appData.report.categories[0].content, /data-report-slide8-overview="1"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-dialog/);
  assert.match(appData.report.categories[0].content, /data-report-overview-team/);
  assert.match(appData.report.categories[0].content, /data-report-overview-kind-option="cause"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-kind-option="purpose"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-detail/);
  assert.match(appData.report.categories[0].content, /type="number" step="any" inputmode="decimal" data-report-overview-amount/);
  assert.equal((appData.report.categories[0].content.match(/\sdata-report-plan-image-input(?:\s|>)/g) || []).length, 24);
  assert.equal((appData.report.categories[0].content.match(/\sdata-report-plan-image-clear(?:\s|>)/g) || []).length, 24);
  assert.match(appData.report.categories[0].content, /유산 LNG \(m³\) \/ 생산량\(kg\)/);
  assert.match(appData.report.categories[0].content, /북정 폐수 \(m³\) \/ 톤/);
  assert.match(appData.report.categories[0].content, /유산 폐수 \(m³\) \/ 톤/);
  assert.match(appData.report.categories[0].content, /3\/6/);
  assert.match(appData.report.categories[0].content, /6\/6/);
  assert.match(appData.report.categories[0].content, /3\/9/);
  assert.match(appData.report.categories[0].content, /5\/9/);
  assert.match(appData.report.categories[0].content, /6\/9/);
  assert.match(appData.report.categories[0].content, /data-report-slide-counter>1 \/ 2/);
  assert.match(appData.report.categories[0].content, /data-report-dynamic-slide="slide8" data-report-dynamic-page="1"[^>]* hidden>/);
  assert.match(appData.report.categories[0].content, /data-report-dynamic-slide="slide9" data-report-dynamic-page="1"[^>]* hidden>/);
  assert.match(appData.report.categories[0].content, /data-report-nav-label="주요 계획" hidden>/);
  assert.match(appData.report.categories[0].content, /\.report-slide-nav button\[hidden\]\s*\{\s*display:\s*none !important;/);
  assert.match(appData.report.categories[0].content, /class="report-deck-back-button"[^>]*data-report-jump-slide="1"[^>]*data-report-jump-view="hq"[^>]*data-report-return-hq hidden>이전<\/button>/);
  assert.match(appData.report.categories[0].content, /\.report-deck-back-button\[hidden\]\s*\{\s*display:\s*none !important;/);
  assert.match(appData.report.categories[0].content, /\.report-slide\[hidden\]\s*\{\s*display:\s*none !important;/);
  assert.match(appData.report.categories[0].content, /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table tbody > tr:first-child \{ height: 15\.9%; \}/);
  assert.match(appData.report.categories[0].content, /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table tbody > tr:not\(:first-child\) \{ height: 28\.033333%; \}/);
  assert.equal((appData.report.categories[0].content.match(/<th>비고<\/th>/g) || []).length, 0);
  assert.equal((appData.report.categories[0].content.match(/data-report-slide-page=/g) || []).length, 31);
  assert.equal((appData.report.categories[0].content.match(/data-report-slide-target=/g) || []).length, 31);
  assert.doesNotMatch(appData.report.categories[0].content, /DB 필드/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-deck-status/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-mode/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-input/);
  assert.doesNotMatch(JSON.stringify(appData.util.categories), /data-role="util-sheet-monthly-report-panel"/);
  assert.equal(appData.owner.ownerOnly, true);

  const nonAdapterSources = sectionSources
    .filter(({ filename }) => filename !== 'KPI.section.factory-adapter.js')
    .map(({ source }) => source)
    .join('\n');
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionFactories/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionBuilders/);
  assert.doesNotMatch(nonAdapterSources, /window\.KpiSectionRegistry/);
});

test('kpi html loads section factory adapter before all section factories', () => {
  const adapterIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.factory-adapter.js?v=1');
  const buildersIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.builders.js?v=215');
  const workIndex = kpiHtml.indexOf('team-report/runtime/work/sections/KPI.sections.work.js?v=231');
  const utilIndex = kpiHtml.indexOf('utility/runtime/util/sections/KPI.sections.util.js?v=244');
  const dataIndex = kpiHtml.indexOf('data-entry/runtime/data/sections/KPI.sections.data.js?v=6');
  const auditIndex = kpiHtml.indexOf('audit/runtime/audit/sections/KPI.sections.audit.js?v=4');
  const reportIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.report.js?v=68');
  const ownerIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.owner.js?v=5');
  const registryIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.registry.js?v=3');

  assert.ok(adapterIndex >= 0, 'section factory adapter loader is missing');
  assert.ok(buildersIndex > adapterIndex, 'section builders must load after adapter');
  assert.ok(workIndex > buildersIndex, 'work section must load after builders');
  assert.ok(utilIndex > workIndex, 'util section must load after work section');
  assert.ok(dataIndex > utilIndex, 'data section must load after util section');
  assert.ok(auditIndex > dataIndex, 'audit section must load after data section');
  assert.equal(kpiHtml.indexOf('KPI.sections.production-report.js'), -1, 'production report section loader must stay removed');
  assert.ok(reportIndex > auditIndex, 'report section must load after audit section');
  assert.ok(ownerIndex > reportIndex, 'owner section must load after report section');
  assert.ok(registryIndex > ownerIndex, 'section registry must load after section factories');
});
