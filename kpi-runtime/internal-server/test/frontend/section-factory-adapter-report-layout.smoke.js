import assert from 'node:assert/strict';
import test from 'node:test';

import { createRegisteredSections } from './support/section-factory-harness.js';

test('section factory adapter preserves report deck print plan safety and optional-page markup', () => {
  const { appData } = createRegisteredSections();
  assert.match(appData.report.categories[0].content, /class="report-plan-table"/);
  assert.match(appData.report.categories[0].content, /class="report-plan-table report-status-table"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-slide="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-slide="slide9"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-slide="slide10"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-add-slot="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-add-slot="slide9"/);
  assert.match(appData.report.categories[0].content, /class="report-safety-add-control"/);
  assert.match(appData.report.categories[0].content, /data-report-safety-team-select/);
  assert.match(appData.report.categories[0].content, /data-report-safety-table-controls/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-safety-table-move="left"[\s\S]*&larr;[\s\S]*data-report-safety-table-move="right"[\s\S]*&rarr;[\s\S]*data-report-safety-table-move="up"[\s\S]*&uarr;[\s\S]*data-report-safety-table-move="down"[\s\S]*&darr;/
  );
  assert.match(appData.report.categories[0].content, /<option value="0">1팀 1파트<\/option>/);
  assert.match(appData.report.categories[0].content, /<option value="3">3팀<\/option>/);
  assert.match(appData.report.categories[0].content, /<option value="5">물류센터<\/option>/);
  assert.match(appData.report.categories[0].content, /<option value="6">기타<\/option>/);
  assert.match(appData.report.categories[0].content, /data-report-safety-team-option="5"[\s\S]*>물류센터<\/button>/);
  assert.match(appData.report.categories[0].content, /data-report-safety-team-option="6"[\s\S]*>기타<\/button>/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-safety-row-add-slot/);
  assert.match(appData.report.categories[0].content, /data-report-add-page="slide10"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-delete-slot="slide8"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-delete-slot="slide9"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-delete-slot="slide10"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide8BeforeImage"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide8AfterImage"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide9Image"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide10BeforeImage"/);
  assert.match(appData.report.categories[0].content, /data-report-plan-image-role="slide10AfterImage"/);
  assert.match(
    appData.report.categories[0].content,
    /<th class="report-safety-label-head" aria-hidden="true"><\/th>\s*<th class="report-safety-row-team" data-report-plan-row-team="slide10" data-report-plan-row-index="0" data-report-plan-slot="slide10\.1"/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-layout \{ position: absolute; left: 3\.4%; right: 2\.9%; top: 8\.4%; bottom: 8\.8%;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-layout\[data-report-plan-slot-count="1"\] \{ --report-plan-table-width: 28\.45%; --report-plan-label-width: 16\.17%; --report-plan-slot-width: 83\.83%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-layout\[data-report-plan-slot-count="2"\] \{ --report-plan-table-width: 52\.3%; --report-plan-label-width: 8\.8%; --report-plan-slot-width: 45\.6%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-layout\[data-report-plan-slot-count="3"\] \{ --report-plan-table-width: 76\.15%; --report-plan-label-width: 6\.04%; --report-plan-slot-width: 31\.32%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-layout\[data-report-plan-slot-count="4"\] \{ --report-plan-table-width: 100%; --report-plan-label-width: 4\.6%; --report-plan-slot-width: 23\.85%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-status-layout \{ left: 3\.4%; right: 2\.9%; top: 8\.4%; bottom: 8\.8%; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-table \{[^}]*height: 100%;[^}]*table-layout: fixed;[^}]*overflow: hidden;/
  );
  assert.match(appData.report.categories[0].content, /\.report-plan-image-row \{ height: 72%; \}/);
  assert.match(appData.report.categories[0].content, /\.report-plan-summary-row \{ height: 18\.2%; \}/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-status-before-row, \.report-status-after-row \{ height: 36%; \}/
  );
  assert.match(appData.report.categories[0].content, /\.report-status-summary-row \{ height: 18\.2%; \}/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-safety-table \{[^}]*width: var\(--report-safety-table-width, 100%\);[^}]*--report-safety-label-width: 4\.6%; --report-safety-slot-width: 23\.85%;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-safety-label-col \{ width: var\(--report-safety-label-width\); \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-safety-slot-col \{ width: var\(--report-safety-slot-width\); \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-safety-table\[data-report-plan-row-active-slot-count="1"\]/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-safety-table\[data-report-plan-row-active-slot-count="4"\]/
  );
  assert.match(appData.report.categories[0].content, /\.report-safety-table-controls \{/);
  assert.match(appData.report.categories[0].content, /\.report-safety-summary-team \{[^}]*color: #1d4ed8;/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide\[data-report-output-prepared="true"\] \.report-plan-layout\[data-report-plan-filled-slot-count="1"\]/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide\[data-report-output-prepared="true"\] \.report-plan-table th\[data-report-plan-filled="false"\]/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide\[data-report-output-prepared="true"\] \.report-safety-table\[data-report-plan-row-filled-slot-count="1"\]/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide\[data-report-output-prepared="true"\] \.report-safety-table th\[data-report-plan-filled="false"\]/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /\.report-safety-layout\[data-report-plan-filled-row-count="1"\][^{]*\{ grid-template-rows: minmax\(0, 1fr\); \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-image-cell \{[^}]*position: relative;[^}]*min-height: 0;[^}]*overflow: hidden;[^}]*line-height: 0;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-image-frame \{[^}]*position: absolute;[^}]*inset: 7px;[^}]*place-items: center;[^}]*overflow: hidden;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-image-frame img \{[^}]*width: 100%;[^}]*height: 100%;[^}]*object-fit: contain;[^}]*object-position: center;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-status-table \.report-plan-image-frame \{[^}]*inset: 5px;[^}]*border-width: 3px;/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-plan-table col\[data-report-plan-active="false"\], \.report-plan-table th\[data-report-plan-active="false"\], \.report-plan-table td\[data-report-plan-active="false"\] \{ display: none; \}/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /td\[data-report-plan-active="false"\] > \* \{ visibility: hidden;/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-status-slot-col" data-report-plan-slot="slide8\.1" data-report-plan-local-slot="1"/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-plan-slot-col" data-report-plan-slot="slide9\.1" data-report-plan-local-slot="1"/
  );
  assert.match(appData.report.categories[0].content, /data-report-slide8-overview="next">개 요<\/th>/);
  assert.match(appData.report.categories[0].content, /<th>개 요<\/th>/);
  assert.doesNotMatch(appData.report.categories[0].content, /개<br>요/);
  assert.match(appData.report.categories[0].content, /data-report-slide8-overview="1"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-dialog/);
  assert.match(appData.report.categories[0].content, /data-report-overview-team-row/);
  assert.match(appData.report.categories[0].content, /data-report-overview-custom-team-row/);
  assert.match(appData.report.categories[0].content, /data-report-overview-custom-team/);
  assert.match(appData.report.categories[0].content, /<option value="물류센터">물류센터<\/option>/);
  assert.match(appData.report.categories[0].content, /<option value="기타">기타<\/option>/);
  assert.match(appData.report.categories[0].content, /data-report-overview-date-row/);
  assert.match(appData.report.categories[0].content, /data-report-overview-amount-row/);
  assert.match(appData.report.categories[0].content, /data-report-overview-hazard-row/);
  assert.match(appData.report.categories[0].content, /data-report-overview-hazard/);
  assert.match(appData.report.categories[0].content, /<input type="text" data-report-overview-hazard/);
  assert.doesNotMatch(appData.report.categories[0].content, /<select data-report-overview-hazard/);
  assert.match(appData.report.categories[0].content, /data-report-overview-kind-option="cause"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-kind-option="purpose"/);
  assert.match(appData.report.categories[0].content, /data-report-overview-detail/);
  assert.match(
    appData.report.categories[0].content,
    /type="number" step="any" inputmode="decimal" data-report-overview-amount/
  );
  assert.match(appData.report.categories[0].content, /data-report-overview-amount-text/);
  assert.match(
    appData.report.categories[0].content,
    /class="report-overview-amount-line"[\s\S]*data-report-overview-amount[\s\S]*data-report-overview-amount-text/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-overview-amount-line \{[^}]*grid-template-columns: minmax\(130px, 168px\) minmax\(0, 1fr\);/
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-input(?:\s|>)/g) || []).length,
    40
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-upload(?:\s|>)/g) || []).length,
    40
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-paste(?:\s|>)/g) || []).length,
    40
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-mode-toggle(?:\s|>)/g) || []).length,
    0
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-placeholder(?:\s|>)/g) || []).length,
    40
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-source-label(?:\s|>)/g) || []).length,
    0
  );
  assert.equal(
    (appData.report.categories[0].content.match(/\sdata-report-plan-image-clear(?:\s|>)/g) || []).length,
    40
  );
  assert.equal(
    (appData.report.categories[0].content.match(/class="report-plan-image-clear-button"/g) || []).length,
    40
  );
  assert.equal((appData.report.categories[0].content.match(/class="report-plan-image-choice"/g) || []).length, 40);
  assert.equal(
    (appData.report.categories[0].content.match(/data-report-plan-image-frame role="button"/g) || []).length,
    40
  );
  assert.equal((appData.report.categories[0].content.match(/aria-label="이미지 첨부"/g) || []).length, 40);
  assert.match(
    appData.report.categories[0].content,
    /data-report-edit-mode="editing"\] \.report-slide\.is-active \.report-plan-image-frame/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-edit-mode="editing"\] \.report-slide\.is-active \.report-plan-image-frame\[data-has-image="false"\] \.report-plan-image-choice \{ display: flex; \}/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-edit-mode="editing"\] \.report-slide\.is-active \.report-plan-image-frame\[data-has-image="true"\] \.report-plan-image-clear-button \{ display: inline-flex; \}/
  );
  assert.doesNotMatch(appData.report.categories[0].content, /report-plan-image-actions/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-plan-image-source/);
  assert.match(appData.report.categories[0].content, /북 정 LNG \(m³\) \/ 생산량\(kg\)/);
  assert.match(appData.report.categories[0].content, /북 정 전기 \(kWh\) \/ 생산량\(kg\)/);
  assert.match(appData.report.categories[0].content, /유 산 LNG \(m³\) \/ 생산량\(kg\)/);
  assert.match(appData.report.categories[0].content, /유 산 전기 \(kWh\) \/ 생산량\(kg\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /북정 LNG \(m³\) \/ 생산량\(kg\)/);
  assert.doesNotMatch(appData.report.categories[0].content, /유산 LNG \(m³\) \/ 생산량\(kg\)/);
  assert.match(appData.report.categories[0].content, /북정 폐수 \(m³\) \/ 생산량 \(톤\)/);
  assert.match(appData.report.categories[0].content, /유산 폐수 \(m³\) \/ 생산량 \(톤\)/);
  assert.match(appData.report.categories[0].content, /3\/6/);
  assert.match(appData.report.categories[0].content, /6\/6/);
  assert.match(appData.report.categories[0].content, /3\/9/);
  assert.match(appData.report.categories[0].content, /5\/9/);
  assert.match(appData.report.categories[0].content, /6\/9/);
  assert.match(appData.report.categories[0].content, /data-report-slide-counter>1 \/ 2/);
  assert.match(
    appData.report.categories[0].content,
    /data-report-dynamic-slide="slide8" data-report-dynamic-page="1"[^>]* hidden>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-dynamic-slide="slide9" data-report-dynamic-page="1"[^>]* hidden>/
  );
  assert.match(
    appData.report.categories[0].content,
    /data-report-dynamic-slide="slide10" data-report-dynamic-page="0" data-report-optional-page="slide10"[^>]*>/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /data-report-dynamic-slide="slide10" data-report-dynamic-page="1"/
  );
  assert.match(appData.report.categories[0].content, /data-report-optional-content="slide8" hidden/);
  assert.match(appData.report.categories[0].content, /data-report-optional-content="slide9" hidden/);
  assert.match(appData.report.categories[0].content, /data-report-optional-content="slide10" hidden/);
  assert.equal(
    (appData.report.categories[0].content.match(/data-report-optional-content="slide8" hidden/g) || []).length,
    2
  );
  assert.equal(
    (appData.report.categories[0].content.match(/data-report-optional-content="slide9" hidden/g) || []).length,
    2
  );
  assert.equal(
    (appData.report.categories[0].content.match(/data-report-optional-content="slide10" hidden/g) || []).length,
    1
  );
  assert.match(
    appData.report.categories[0].content,
    /\[data-report-optional-content\]\[hidden\]\s*\{\s*display:\s*none !important;/
  );
  assert.match(appData.report.categories[0].content, /data-report-field="slide10Title"/);
  assert.match(appData.report.categories[0].content, /data-report-nav-label="주요 계획" hidden>/);
  assert.match(appData.report.categories[0].content, /data-report-nav-label="자율 안전 신고제" hidden>/);
  assert.match(
    appData.report.categories[0].content,
    /\.report-slide-nav button\[hidden\]\s*\{\s*display:\s*none !important;/
  );
  assert.match(
    appData.report.categories[0].content,
    /class="report-deck-back-button"[^>]*data-report-jump-slide="1"[^>]*data-report-jump-view="hq"[^>]*data-report-return-hq hidden>이전<\/button>/
  );
  assert.match(
    appData.report.categories[0].content,
    /\.report-deck-back-button\[hidden\]\s*\{\s*display:\s*none !important;/
  );
  assert.match(appData.report.categories[0].content, /\.report-slide\[hidden\]\s*\{\s*display:\s*none !important;/);
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
    /data-report-yusan-lpg-table="right"\] tbody > tr:first-child \{ height: 15\.9%; \}/
  );
  assert.doesNotMatch(
    appData.report.categories[0].content,
    /data-report-yusan-lpg-table="right"\] tbody > tr:not\(:first-child\) \{ height: 28\.033333%; \}/
  );
  assert.equal((appData.report.categories[0].content.match(/<th>비고<\/th>/g) || []).length, 0);
  assert.equal((appData.report.categories[0].content.match(/data-report-slide-page=/g) || []).length, 32);
  assert.equal((appData.report.categories[0].content.match(/data-report-slide-target=/g) || []).length, 32);
  assert.doesNotMatch(appData.report.categories[0].content, /DB 필드/);
  assert.doesNotMatch(appData.report.categories[0].content, /report-deck-status/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-mode/);
  assert.doesNotMatch(appData.report.categories[0].content, /data-report-input/);
  assert.doesNotMatch(JSON.stringify(appData.data.categories), /data-role="util-sheet-monthly-report-panel"/);
});
