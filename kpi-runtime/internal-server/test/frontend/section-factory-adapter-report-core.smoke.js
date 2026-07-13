import assert from 'node:assert/strict';
import test from 'node:test';

import { createRegisteredSections, getOpenDivBalanceBefore } from './support/section-factory-harness.js';

test('section factory adapter preserves report deck core production memo and navigation markup', () => {
  const { appData } = createRegisteredSections();
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
  assert.match(
    appData.report.categories[0].content,
    /data-report-slide-view="production-team-1" data-report-slide-label="표지"/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-slide-view="production-team-2" data-report-slide-label="표지"/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-slide-view="production-team-3" data-report-slide-label="표지"/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-slide-view="public-works" data-report-slide-label="표지"/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide-department" contenteditable="false" spellcheck="false">생산1팀<\/div>/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide-department" contenteditable="false" spellcheck="false">생산2팀<\/div>/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide-department" contenteditable="false" spellcheck="false">생산3팀<\/div>/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide-department" contenteditable="false" spellcheck="false">공무환경팀<\/div>/
  );
  assert.match(appData.report.categories[0].content, /data-report-month-select/);
  assert.match(appData.report.categories[0].content, /class="report-slide report-production-contents-slide"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="본부 목차"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-slide="0"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="public-works"/);
  assert.match(appData.report.categories[0].content, /data-report-next-month-label/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-contents-page-range="production-team-1"[^>]*>3-8<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-contents-page-range="production-team-2"[^>]*>9-14<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-contents-page-range="production-team-3"[^>]*>15-20<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-contents-page-range="public-works"[^>]*>21-29<\/span>/
  );
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam1ContentsItem1"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam2ContentsItem2"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="productionTeam3ContentsItem4"/);
  assert.match(appData.report.categories[0].content, /data-report-field-ref="contentsItem4"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-label="목차"/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-contents-item-text"[\s\S]*data-report-next-month-label>5월<\/span>\s*<span data-report-field="contentsItem4"/
  );
  assert.match(appData.report.categories[0].content, /Ⅳ\. 공무환경팀/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="hq"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-1"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-2"/);
  assert.match(appData.report.categories[0].content, /data-report-jump-view="production-team-3"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-1"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-2"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="production-team-3"/);
  assert.match(appData.report.categories[0].content, /data-report-slide-view="public-works"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-field="productionTeam1ContentsTitle"[^>]*contenteditable="false"[^>]*>Contents<\/div>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-field="productionTeam1ContentsItem1"[^>]*contenteditable="false"[^>]*>생산실적\(생산량\)<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-field="productionTeam2ContentsItem3"[^>]*contenteditable="false"[^>]*>생산지표 2-1 노동생산성 \(직접노무비\/kg\)<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-field="productionTeam3ContentsItem4"[^>]*contenteditable="false"[^>]*>생산지표 2-2 수율<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-field="contentsItem1"[^>]*contenteditable="false"[^>]*>에너지 실적<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-next-month-label>5월<\/span>\s*<span data-report-field="contentsItem4"[^>]*>주요계획<\/span>/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide report-template-slide report-production-start-slide"/
  );
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
  assert.match(
    appData.report.categories[0].content,
    /data-report-chart-highlight-key="production-start:team_01:part1"/
  );
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="auto:bukjeong-utility:gas"/);
  assert.match(appData.report.categories[0].content, /data-report-chart-highlight-key="auto:yusan-lpg:cost"/);
  assert.match(appData.report.categories[0].content, /LPG, LNG환산 \(원\)/);
  assert.match(appData.report.categories[0].content, /rowspan="5"[^>]*>비용/);
  assert.match(appData.report.categories[0].content, /금액 차이/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-yusan-lpg-cost-difference-cell/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table tbody > tr:first-child \{ height: 14%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table tbody > tr:not\(:first-child\) \{ height: 21\.5%; \}/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-table="right"\] tbody > tr:not\(:first-child\) \{ height: 28\.033333%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide report-template-slide report-production-labor-slide"/
  );
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1LaborTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2LaborSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3LaborSection"/);
  assert.match(appData.report.categories[0].content, /report-production-labor-summary-table/);
  assert.match(appData.report.categories[0].content, /report-production-labor-cause-table/);
  assert.match(appData.report.categories[0].content, /<col class="report-production-cause-col-reason-wide">/);
  assert.match(appData.report.categories[0].content, /report-production-labor-chart-grid/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide report-template-slide report-production-labor-slide report-production-direct-labor-slide"/
  );
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam1DirectLaborTitle"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam2DirectLaborSection"/);
  assert.match(appData.report.categories[0].content, /data-report-field="productionTeam3DirectLaborSection"/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide report-template-slide report-production-yield-slide"/
  );
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
  assert.match(
    appData.report.categories[0].content,
    /data-report-chart-highlight-key="production-yield:team_01:part1"/
  );
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
  assert.match(
    appData.report.categories[0].content,
    /data-report-slide-label="생산지표 2-1 노동생산성 직접노무비\/kg"/
  );
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
  assert.match(appData.report.categories[0].content, /reportDeckCaptureSpin/);
  assert.match(appData.report.categories[0].content, /data-report-save-menu/);
  assert.match(appData.report.categories[0].content, /data-report-save-menu-toggle[^>]*>저장<\/button>/);
  assert.match(appData.report.categories[0].content, /data-report-save-menu-panel[^>]*hidden/);
  assert.match(appData.report.categories[0].content, /data-report-capture-zip/);
  assert.match(appData.report.categories[0].content, /data-report-capture-pdf>PDF<\/button>/);
  assert.match(appData.report.categories[0].content, /data-report-capture-controls/);
  assert.match(appData.report.categories[0].content, /data-report-capture-range-start/);
  assert.match(appData.report.categories[0].content, /data-report-capture-range-end/);
  assert.match(appData.report.categories[0].content, /data-report-capture-current-only/);
  assert.match(appData.report.categories[0].content, />범위<\/span>/);
  assert.match(appData.report.categories[0].content, /data-report-export-html>HTML<\/button>/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-month-select[\s\S]*data-report-save-menu-toggle[\s\S]*data-report-edit-toggle[\s\S]*data-report-fullscreen[^>]*aria-label="[^"]*"[\s\S]*&#9974;[\s\S]*<\/button>/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-edit-fullscreen-toggle/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-contents-toggle/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-save-menu-toggle[\s\S]*data-report-capture-controls[\s\S]*data-report-capture-zip[\s\S]*data-report-capture-pdf>PDF<\/button>[\s\S]*data-report-export-html>HTML<\/button>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-capture-zip[\s\S]*data-report-capture-pdf>PDF<\/button>[\s\S]*data-report-export-html>HTML<\/button>/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-save-menu-panel\[hidden\] \{ display: none !important; \}/
  );
  assert.doesNotMatch(appData.report.categories[0].content, />캡쳐 범위<\/span>/);
  assert.doesNotMatch(appData.report.categories[0].content, /<button[^>]+data-report-undo-delete/);
  assert.doesNotMatch(appData.report.categories[0].content, /<button[^>]+data-report-print-pdf/);
  assert.match(appData.report.categories[0].content, /data-report-export-html/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-toggle/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-deck-sidebar-action" data-report-memo-overview-toggle>특이사항<\/button>/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-font-size/);
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /class="report-deck-action-button" data-report-memo-overview-toggle/
  );
  assert.match(appData.report.categories[0].content, /data-report-memo-dialog/);
  assert.match(appData.report.categories[0].content, /data-report-memo-drag-handle/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-dialog/);
  assert.match(appData.report.categories[0].content, /aria-modal="false"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-panel/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-drag-handle/);
  assert.match(appData.report.categories[0].content, /data-report-memo-overview-list/);
  assert.match(appData.report.categories[0].content, /data-report-memo-team/);
  assert.match(appData.report.categories[0].content, /data-report-memo-metric/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide3GasMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide4ElectricMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide5LpgMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide6WasteMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-key="slide7WasteMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-content="slide7WasteMemo"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.unit\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="electric\.unit\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="unit\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-value="unit\.current"/);
  assert.match(appData.report.categories[0].content, /report-auto-unit-row/);
  assert.match(appData.report.categories[0].content, /report-waste-auto-unit-row/);
  assert.ok(getOpenDivBalanceBefore(appData.report.categories[0].content, 'data-report-memo-dialog') > 0);
  assert.ok(getOpenDivBalanceBefore(appData.report.categories[0].content, 'data-report-memo-overview-dialog') > 0);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad/);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-font-size-delta="-1"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-font-size-delta="1"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-font-size-input/);
  assert.match(
    appData.report.categories[0].content,
    /inputmode="numeric" value="3" data-report-memo-notepad-font-size-input/
  );
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-color="red"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-color="blue"/);
  assert.match(appData.report.categories[0].content, /data-report-memo-notepad-color="clear"/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-indent-break/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-preserve-format/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-preview/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-lines/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-manual-input/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-manual-add/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-memo-clear/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-notepad-wrap \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-notepad \{[^}]*min-height: 230px;[^}]*resize: vertical;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-notepad-actions \{[^}]*grid-template-columns: 28px 28px 42px;[^}]*width: 110px;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-notepad-size-input \{[^}]*width: 42px;[^}]*text-align: center;/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-indent-break-button \{/);
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-format-toggle \{/);
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-preview \{/);
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-preview-line \{/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-line-color-actions \{[^}]*grid-template-columns: repeat\(5, 28px\);[^}]*justify-content: start;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-line-color-button \{[^}]*width: 28px !important;[^}]*height: 26px;/
  );
  assert.match(appData.report.categories[0].content, /\.report-memo-line-color-button\.is-red \{[^}]*#c00000/);
  assert.match(appData.report.categories[0].content, /\.report-memo-line-color-button\.is-blue \{[^}]*#2f75b5/);
  assert.match(appData.report.categories[0].content, /\.report-memo-line-color-button\.is-clear \{/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-auto-memo-line\.is-up,\s*\.report-auto-memo-line\.is-down \{ color: #111827; \}/
  );
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-delta \{ color: #111827; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-change \{ font-weight: 900; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-change\.is-up \{ color: #c00000; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-change\.is-down \{ color: #2f75b5; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-manual-color\.is-red \{ color: #c00000; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-manual-color\.is-blue \{ color: #2f75b5; \}/);
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-manual-size \{[^}]*vertical-align: baseline;/);
  assert.doesNotMatch(appData.report.categories[0].content, /--report-auto-memo-font-size/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-deck-sidebar-control/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-auto-memo-content \{[^}]*gap: 5px;[^}]*padding: 6px 7px;[^}]*font-size: 10\.4px;[^}]*line-height: 1\.18/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-auto-memo-line \{[^}]*align-items: start;[^}]*white-space: nowrap;[^}]*font-size: var\(--report-auto-memo-line-font-size, inherit\);[^}]*line-height: var\(--report-auto-memo-line-line-height, inherit\);/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-auto-memo-line\.is-preserve-format \{ white-space: pre-wrap; overflow: visible; text-overflow: clip; \}/
  );
  assert.match(appData.report.categories[0].content, /\.report-auto-memo-add \{ display: none;/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor\[data-report-edit-mode="editing"\] \.report-auto-memo-add \{ display: inline-flex; \}/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /report-auto-memo-delete/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-dialog \{[^}]*width: min\(980px, calc\(100vw - 36px\)\);/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-dialog\[data-report-memo-floating="true"\] \{ right: auto; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-dialog-head \{[^}]*cursor: grab;[^}]*touch-action: none;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-dialog \{[^}]*position: fixed;[^}]*right: 24px;[^}]*pointer-events: none;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-panel \{[^}]*max-height: inherit;[^}]*pointer-events: auto;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-head \{[^}]*cursor: grab;[^}]*touch-action: none;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-rows \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-row \{[^}]*grid-template-columns: minmax\(48px, max-content\) minmax\(0, 1fr\) auto;[^}]*border: 1px solid #e5e7eb;[^}]*background: #fbfdff;[^}]*font-size: 5\.2px;[^}]*line-height: 1\.08;/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-overview-row\.is-up \{/);
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-overview-row\.is-down \{/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-row-label \{[^}]*white-space: normal;[^}]*overflow: visible;[^}]*text-overflow: clip;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-row-text \{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-overview-copy \{[^}]*height: 14px;[^}]*font-size: 5\.2px;/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-lines \{/);
  assert.doesNotMatch(appData.report.categories[0].content, /\.report-memo-line-row \{/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-candidate \{[^}]*grid-template-columns: 22px minmax\(0, 1fr\);[^}]*white-space: nowrap;[^}]*font-size: 10\.8px;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-memo-candidate-text \{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/
  );
  assert.match(appData.report.categories[0].content, /\.report-memo-candidate-add/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-contents-list\s*\{[^}]*left:\s*5\.3%[^}]*padding:\s*0[^}]*counter-reset:\s*report-contents/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-contents-list li\s*\{[^}]*grid-template-columns:\s*44px minmax\(0,\s*1fr\)/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-contents-item-text\s*\{[^}]*grid-column:\s*2[^}]*white-space:\s*nowrap/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-contents-team \.report-contents-item-text\s*\{[^}]*display:\s*inline[^}]*white-space:\s*normal/
  );
  assert.match(appData.report.categories[0].content, /class="report-slide-top-brand"/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide-logo is-bottom" src="shared-assets\/report-footer-logo\.png"/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /class="report-slide-logo is-bottom" src="shared-assets\/report-logo\.png"/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /class="report-slide-logo is-bottom" src="shared-assets\/logo\.jpg"/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide-logo\.is-bottom\s*\{[^}]*left:\s*2\.2%[^}]*bottom:\s*0\.16%[^}]*width:\s*22%[^}]*height:\s*4\.9%[^}]*z-index:\s*2[^}]*filter:\s*none/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide-top-brand\s*\{[^}]*top:\s*2\.55%[^}]*height:\s*3\.7%[^}]*display:\s*inline-flex[^}]*align-items:\s*center/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide-top-brand \.report-slide-section\s*\{[^}]*font-size:\s*14px[^}]*white-space:\s*nowrap/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-template-title\s*\{[^}]*left:\s*3\.4%[^}]*top:\s*2\.55%[^}]*font-size:\s*22px/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-chart-highlight-toggle\.has-highlight\s*\{[^}]*box-shadow:\s*0 0 0 2px rgba\(239,\s*68,\s*68,\s*0\.18\)/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-chart-highlight-reset\.has-highlight\s*\{[^}]*box-shadow:\s*0 0 0 2px rgba\(17,\s*24,\s*39,\s*0\.16\)/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-chart-highlight-hit\.is-highlighted\s*\{[^}]*fill:\s*transparent[^}]*stroke:\s*#ff0000[^}]*stroke-width:\s*2\.8/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-chart-highlight-hit\.is-range-start\s*\{[^}]*stroke:\s*#111827[^}]*stroke-width:\s*2\.4/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-chart-highlight-range\s*\{[^}]*stroke:\s*#111827[^}]*stroke-width:\s*2\.4/
  );
  assert.match(appData.report.categories[0].content, /data-report-edit-toggle/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-edit-toggle[\s\S]*data-report-fullscreen[^>]*aria-label="[^"]*"[\s\S]*&#9974;[\s\S]*<\/button>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-fullscreen[^>]*title="[^"]*"[\s\S]*&#9974;[\s\S]*<\/button>/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-edit-fullscreen-toggle/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-contents-toggle/);
  assert.match(appData.report.categories[0].content, /\.report-deck-contents-toggle \{ display: none; \}/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor:fullscreen:not\(\[data-report-edit-fullscreen-mode="true"\]\) \.report-deck-toolbar/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor:fullscreen\[data-report-edit-fullscreen-mode="true"\] \.report-deck-toolbar \{ display: flex; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor:fullscreen\[data-report-edit-fullscreen-mode="true"\] \.report-deck-contents-toggle \{ display: inline-flex; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor:fullscreen\[data-report-edit-fullscreen-mode="true"\]\[data-report-contents-collapsed="true"\] \.report-deck-sidebar \{ display: none; \}/
  );
  assert.match(appData.report.categories[0].content, /@page \{ size: 297mm 210mm; margin: 0; \}/);
  assert.match(
    appData.report.categories[0].content,
    /\*::-webkit-scrollbar \{ width: 0 !important; height: 0 !important; display: none !important; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-editor\[data-report-print-mode="true"\] \.report-deck-toolbar,\s*\.report-deck-editor\[data-report-print-mode="true"\] \.report-deck-sidebar/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide\[data-report-print-visible="true"\]\s*\{[^}]*width:\s*277mm !important[^}]*height:\s*155\.8125mm !important[^}]*margin:\s*27\.09375mm 10mm !important/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-start-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-start-layout::before,\s*\.report-production-labor-layout::before,\s*\.report-production-yield-layout::before\s*\{[^}]*left:\s*50%[^}]*background:\s*#f59e0b/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-start-column\s*\{[^}]*grid-template-rows:\s*8% 13\.2% 9\.8% 24\.8% 6\.2% minmax\(0,\s*1fr\)/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-labor-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-yield-layout\s*\{[^}]*left:\s*3\.4%[^}]*right:\s*2\.9%[^}]*top:\s*8\.4%[^}]*column-gap:\s*5\.2%/
  );
  assert.match(appData.report.categories[0].content, /\.report-production-col-value\s*\{ width:\s*16\.6%; \}/);
  assert.match(appData.report.categories[0].content, /\.report-production-cause-col-reason-wide\s*\{ width:\s*66%; \}/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-production-start-cause-table td:last-child\s*\{[^}]*padding-left:\s*6px[^}]*overflow-wrap:\s*anywhere/
  );
  assert.match(appData.report.categories[0].content, /data-report-stage/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="bukjeong-utility"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="yusan-utility"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-analysis/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-slide report-template-slide report-bukjeong-analysis-slide report-yusan-lpg-analysis-slide"/
  );
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-table="left"/);
  assert.match(appData.report.categories[0].content, /<th class="report-auto-row-label">1팀 2파트<\/th>/);
  assert.match(appData.report.categories[0].content, /생산량<br>\(kg\)/);
  assert.match(appData.report.categories[0].content, /사용량<br>\(kg\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /1팀 2파트<br>LPG/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.current"/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-auto-chart report-lpg-chart" data-report-yusan-lpg-chart="unit"/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-auto-chart-plot report-lpg-chart-plot" data-report-yusan-lpg-chart-plot="unit"/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-bukjeong-analysis-column\s*\{[^}]*grid-template-rows:\s*var\(--report-analysis-table-row,\s*28%\)\s*var\(--report-analysis-chart-row,\s*62%\)\s*var\(--report-analysis-memo-row,\s*6%\)[^}]*gap:\s*2\.6%/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-analysis-slide \.report-bukjeong-analysis-column\s*\{[^}]*grid-template-rows:\s*var\(--report-analysis-table-row,\s*28%\)\s*var\(--report-analysis-chart-row,\s*62%\)\s*var\(--report-analysis-memo-row,\s*6%\)[^}]*gap:\s*2\.6%/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-table,\s*\.report-yusan-lpg-analysis-slide \.report-lpg-chart,\s*\.report-yusan-lpg-analysis-slide \.report-yusan-lpg-memo\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-auto-chart-legend\.is-compact\s*\{[^}]*font-size:\s*10\.5px/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-analysis-slide \.report-lpg-chart-title\s*\{/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-yusan-lpg-ratio-formula\s*\{[^}]*font-size:\s*9\.5px[^}]*white-space:\s*nowrap/
  );
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-table="right"/);
  assert.match(
    appData.report.categories[0].content,
    /<th class="report-auto-row-label">비율<small class="report-yusan-lpg-ratio-formula">LPG\/LNG환산<\/small><\/th>/
  );
  assert.match(
    appData.report.categories[0].content,
    /<th class="report-auto-row-label">금액 차이<small class="report-yusan-lpg-ratio-formula">LPG - LNG환산<\/small><\/th>/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /<th class="report-auto-row-label">차 액<\/th>/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-month-label="reference"[\s\S]*data-report-yusan-lpg-month-label="current"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-yusan-lpg-month-label="previous"/
  );
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-value="usage\.mom"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-value="usage\.reference"[\s\S]*data-report-yusan-lpg-value="usage\.current"[\s\S]*data-report-yusan-lpg-value="usage\.yoy"[\s\S]*data-report-yusan-lpg-value="usage\.previous"[\s\S]*data-report-yusan-lpg-value="usage\.mom"/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-cost-month-label="reference"[\s\S]*data-report-yusan-lpg-cost-month-label="current"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-yusan-lpg-cost-month-label="previous"/
  );
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.mom"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-cost-value="0\.reference"[\s\S]*data-report-yusan-lpg-cost-value="0\.current"[\s\S]*data-report-yusan-lpg-cost-value="0\.yoy"[\s\S]*data-report-yusan-lpg-cost-value="0\.previous"[\s\S]*data-report-yusan-lpg-cost-value="0\.mom"/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /증감\(%\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /증감율\(%\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /class="report-yusan-lpg-colgroup"/);
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /<td class="report-auto-note-cell" rowspan="3">1팀 2파트<\/td>/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /<td class="report-auto-note-cell[^"]*" rowspan="3">LPG ⇒LNG<br>환산<\/td>/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-auto-resource-cell report-yusan-lpg-cost-resource" rowspan="5">비용<br><span>\(원\)<\/span><small>LPG ⇒ LNG<br>환산<\/small>/
  );
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="0\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-cost-value="3\.current"/);
  assert.match(appData.report.categories[0].content, /data-report-yusan-lpg-chart-plot="cost"/);
  assert.match(appData.report.categories[0].content, /LPG, LNG환산 \(원\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /LPG 실제 금액 \/ LNG 환산 금액/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="bukjeong-waste"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-analysis="yusan-waste"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.current"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-auto-month-label="reference"[\s\S]*data-report-auto-month-label="current"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-auto-month-label="previous"/
  );
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.previous"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.yoy"/);
  assert.match(appData.report.categories[0].content, /data-report-auto-value="gas\.usage\.mom"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-auto-value="gas\.usage\.reference"[\s\S]*data-report-auto-value="gas\.usage\.current"[\s\S]*data-report-auto-value="gas\.usage\.yoy"[\s\S]*data-report-auto-value="gas\.usage\.previous"[\s\S]*data-report-auto-value="gas\.usage\.mom"/
  );
  assert.match(appData.report.categories[0].content, /전기<br><span>\(kWh\)<\/span>/);
  assert.match(appData.report.categories[0].content, /사용량<br>\(kWh\)/);
  assert.match(appData.report.categories[0].content, /data-report-auto-chart-plot="electric"/);
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-value="usage\.current"/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-waste-auto-month-label="reference"[\s\S]*data-report-waste-auto-month-label="current"[\s\S]*<th>전년대비<\/th>[\s\S]*data-report-waste-auto-month-label="previous"[\s\S]*<th>전월대비<\/th>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-waste-auto-value="usage\.reference"[\s\S]*data-report-waste-auto-value="usage\.current"[\s\S]*data-report-waste-auto-value="usage\.yoy"[\s\S]*data-report-waste-auto-value="usage\.previous"[\s\S]*data-report-waste-auto-value="usage\.mom"/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-waste-auto-value="water\.reference"[\s\S]*data-report-waste-auto-value="water\.current"[\s\S]*data-report-waste-auto-value="water\.yoy"[\s\S]*data-report-waste-auto-value="water\.previous"[\s\S]*data-report-waste-auto-value="water\.mom"/
  );
  assert.match(appData.report.categories[0].content, /data-report-waste-auto-chart-plot/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-waste-auto-layout\s*\{[^}]*grid-template-rows:\s*var\(--report-waste-main-row,\s*83\.5%\)\s*var\(--report-waste-memo-row,\s*6\.5%\)[^}]*gap:\s*5% 6%/
  );
});
