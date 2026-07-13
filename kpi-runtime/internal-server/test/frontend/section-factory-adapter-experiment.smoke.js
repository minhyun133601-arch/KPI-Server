import assert from 'node:assert/strict';
import test from 'node:test';

import { createRegisteredSections } from './support/section-factory-harness.js';

test('section factory adapter preserves experiment shell builder and ratio markup', () => {
  const { appData } = createRegisteredSections();
  assert.equal(appData.experiment.name, '분석');
  assert.notEqual(appData.experiment.navigationHidden, true);
  assert.notEqual(appData.experiment.directLaunch, true);
  assert.equal(appData.experiment.openDefaultCategoryOnMain, true);
  assert.equal(appData.experiment.hideNavigationChevron, true);
  assert.equal(appData.experiment.launchTarget, undefined);
  assert.equal(appData.experiment.launchRoute, undefined);
  assert.equal(Array.isArray(appData.experiment.categories), true);
  assert.equal(appData.experiment.categories.length, 1);
  assert.equal(appData.experiment.categories[0].title, '선/막대');
  assert.equal(appData.experiment.categories[0].navHidden, true);
  assert.equal(appData.experiment.categories[0].viewerMode, 'full-bleed');
  assert.equal(appData.experiment.categories[0].launchTarget, undefined);
  assert.equal(appData.experiment.categories[0].launchRoute, undefined);
  assert.match(appData.experiment.categories[0].content, /experiment-unified-shell/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /지표 통합 그래프/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /experiment-unified-head/);
  assert.match(appData.experiment.categories[0].content, /data-exp-fullscreen-toggle/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-picker-toggle/);
  assert.match(appData.experiment.categories[0].content, /data-exp-period-start/);
  assert.match(appData.experiment.categories[0].content, /data-exp-period-end/);
  assert.match(appData.experiment.categories[0].content, /data-exp-year-overlap/);
  assert.match(appData.experiment.categories[0].content, /data-exp-year-overlap-years/);
  assert.match(appData.experiment.categories[0].content, /experiment-chart-inline-tools/);
  assert.match(appData.experiment.categories[0].content, /data-exp-chart-view-toggle/);
  assert.match(appData.experiment.categories[0].content, /data-exp-chart-view="chart"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-chart-view="table"/);
  assert.match(appData.experiment.categories[0].content, /experiment-chart-toolbar" data-exp-chart-toolbar/);
  assert.match(appData.experiment.categories[0].content, /KpiExperimentGraphPrototype/);
  assert.match(appData.experiment.categories[0].content, /data-exp-report-chart-style="report-auto"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-mode/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-target/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-detail/);
  assert.match(appData.experiment.categories[0].content, /data-exp-summary-line-open/);
  assert.match(appData.experiment.categories[0].content, /data-exp-summary-line-picker/);
  assert.match(appData.experiment.categories[0].content, /data-exp-summary-line-options/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-target[^>]*disabled/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-detail[^>]*disabled/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /data-exp-card-step-select/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /data-exp-card-builder-source/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /data-exp-card-step-path/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-builder-add/);
  assert.match(
    appData.experiment.categories[0].content,
    /class="experiment-card-groups" data-exp-card-groups-source hidden/
  );
  assert.match(appData.experiment.categories[0].content, /data-exp-card-group="production" hidden/);
  assert.match(appData.experiment.categories[0].content, /<span>1차 유형<\/span>/);
  assert.match(appData.experiment.categories[0].content, /<span>2차 범위<\/span>/);
  assert.match(appData.experiment.categories[0].content, /<span>3차 분류<\/span>/);
  assert.match(appData.experiment.categories[0].content, /<span>4차 세부<\/span>/);
  assert.match(appData.experiment.categories[0].content, /<option value="basic" selected>기본<\/option>/);
  assert.match(appData.experiment.categories[0].content, /<option value="efficiency">효율<\/option>/);
  assert.match(appData.experiment.categories[0].content, /<option value="detail">내역<\/option>/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /<option value="summary">종합<\/option>/);
  assert.match(appData.experiment.categories[0].content, /<option value="total">전체<\/option>/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="production-total"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-sd-yield_rate"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-ica-1-yield_rate"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-bottle-28-yield_rate"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-operation_time"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-work_time"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-total_work_time"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-production_days"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-off_days"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-product_count"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-equipment_capa"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-stick_ea"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="summary-yusan-rework_production"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="lpg-usage"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="waste-discharge-bukjeong"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="waste-discharge-yusan"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="waste-cost-bukjeong"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="waste-cost-yusan"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card="cost-yusan-excluding-waste"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-open/);
  assert.match(appData.experiment.categories[0].content, />비율<\/span>/);
  assert.match(
    appData.experiment.categories[0].content,
    /class="experiment-card-builder-actions"[\s\S]*data-exp-card-builder-add[\s\S]*data-exp-ratio-open/
  );
  assert.match(appData.experiment.categories[0].content, /data-exp-card-picker-close/);
  assert.match(appData.experiment.categories[0].content, /<strong>카드 목록<\/strong>/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /closePickerFromBackdrop\(event\)/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /capturePickerBackdropPointer\(event\)/);
  assert.match(appData.experiment.categories[0].content, /data-exp-inline-ratio-builder/);
  assert.match(appData.experiment.categories[0].content, /data-exp-inline-ratio-numerator/);
  assert.match(appData.experiment.categories[0].content, /data-exp-inline-ratio-add/);
  assert.match(appData.experiment.categories[0].content, /toggleInlineRatioBuilder\(this\)/);
  assert.match(appData.experiment.categories[0].content, /experiment-ratio-fraction-builder/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-part="numerator"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-part="denominator"/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-mode/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-scope/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-category/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-line-open/);
  assert.match(appData.experiment.categories[0].content, /openRatioLinePicker\(this\)/);
  assert.match(appData.experiment.categories[0].content, /data-exp-ratio-detail/);
  assert.match(appData.experiment.categories[0].content, /data-exp-card-detail-open/);
  assert.match(appData.experiment.categories[0].content, /openCardDetailPicker\(this\)/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /data-exp-ratio-numerator/);
  assert.doesNotMatch(appData.experiment.categories[0].content, /data-exp-ratio-denominator/);
  [
    'cost-team-01-01',
    'cost-team-01-02',
    'cost-team-02',
    'cost-team-03',
    'cost-bukjeong',
    'cost-yusan',
    'cost-total',
  ].forEach((cardKey) => {
    assert.match(appData.experiment.categories[0].content, new RegExp(`data-exp-card="${cardKey}"`));
  });
  assert.equal(
    appData.experiment.categories.some((category) => category.utilitySurface === 'analysis'),
    false
  );
  assert.equal(
    appData.experiment.categories.some((category) => category.autoOpenUtilityReportModal === true),
    false
  );
});
