import assert from 'node:assert/strict';
import test from 'node:test';

import { createRegisteredSections } from './support/section-factory-harness.js';

test('section factory adapter registers factories and preserves data and work category contracts', () => {
  const { context, factories, registry, appData, sectionSources } = createRegisteredSections();

  assert.equal(typeof context.window.KpiSectionFactoryAdapter.registerFactory, 'function');
  assert.equal(typeof factories.work, 'function');
  assert.equal(typeof factories.data, 'function');
  assert.equal(typeof factories.report, 'function');
  assert.equal(typeof factories.experiment, 'function');
  assert.equal(typeof factories.owner, 'function');
  assert.equal(typeof registry.registerSections, 'function');
  assert.equal(context.window.KpiSectionFactoryAdapter.getBuilder('buildUtilityOverviewRatioContent'), null);
  assert.equal(typeof context.window.KpiUtilityEntryExperiment?.normalizeNumberText, 'function');
  assert.equal(typeof context.window.KpiUtilityEntryExperiment?.getMonthlyMeterLinkStates, 'function');
  assert.equal(typeof context.window.KpiUtilityEntryExperiment?.openGraphTemplate, 'function');
  assert.equal(typeof context.window.KpiUtilityEntryExperiment?.save, 'function');

  assert.deepEqual(Object.keys(appData), ['work', 'data', 'report', 'experiment']);
  assert.equal(appData.owner, undefined);
  assert.equal(appData.work.name, '팀별내역서');
  assert.equal(appData.data.name, '데이터 관리');
  assert.equal(appData.data.categories.length, 4);
  const utilityEntryCategory = appData.data.categories[0];
  assert.equal(utilityEntryCategory.title, '유틸리티');
  assert.equal(utilityEntryCategory.utilitySurface, 'entry-experiment');
  assert.equal(utilityEntryCategory.viewerMode, 'full-bleed');
  assert.match(utilityEntryCategory.content, /data-role="utility-entry-experiment"/);
  assert.match(utilityEntryCategory.content, /data-role="utility-entry-experiment-meter-open"/);
  assert.equal(
    (utilityEntryCategory.content.match(/data-role="utility-entry-experiment-meter-open"/g) || []).length,
    7
  );
  assert.equal(
    (
      utilityEntryCategory.content.match(
        /utility-entry-experiment-settlement-title-button utility-entry-experiment-meter-key/g
      ) || []
    ).length,
    7
  );
  assert.equal(
    (utilityEntryCategory.content.match(/data-role="utility-entry-experiment-graph-toggle"/g) || []).length,
    0
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="electric_yusan"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="electric_bukjeong"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="gas_yusan_lng"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="gas_yusan_lpg"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="gas_bukjeong_lng"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="waste_yusan"/
  );
  assert.match(
    utilityEntryCategory.content,
    /utility-entry-experiment-settlement-title-button[\s\S]*data-utility-entry-experiment-meter-link="waste_bukjeong"/
  );
  assert.match(
    utilityEntryCategory.content,
    /data-utility-entry-experiment-meter-link="electric_bukjeong"[\s\S]*data-utility-entry-experiment-title-graph="electric_bukjeong"/
  );
  assert.match(
    utilityEntryCategory.content,
    /data-utility-entry-experiment-meter-link="gas_bukjeong_lng"[\s\S]*data-utility-entry-experiment-title-graph="gas_bukjeong"/
  );
  assert.match(utilityEntryCategory.content, /data-utility-entry-experiment-meter-link="gas_yusan_lng"/);
  assert.match(utilityEntryCategory.content, /data-utility-entry-experiment-meter-link="gas_yusan_lpg"/);
  assert.match(utilityEntryCategory.content, /data-utility-entry-experiment-meter-link="gas_bukjeong_lng"/);
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 LPG Nm3 단가"[\s\S]*data-utility-entry-experiment-field-key="unit_price_m3"/
  );
  assert.match(utilityEntryCategory.content, /aria-label="유산 LPG Nm3 단가"[\s\S]*원\/M3/);
  assert.match(utilityEntryCategory.content, /인건비[\s\S]*총비용[\s\S]*단가[\s\S]*생산량 대비 폐수량/);
  assert.match(
    utilityEntryCategory.content,
    /생산량 대비 폐수량[\s\S]*utility-entry-experiment-calc-help-popover">폐수\/생산량/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 폐수 생산량 대비 폐수량"[\s\S]*data-utility-entry-experiment-field-key="waste_per_production_ton"[\s\S]*m3\/톤/
  );
  assert.match(
    utilityEntryCategory.content,
    /type="number"[\s\S]*step="any"[\s\S]*aria-label="기타 월간 평균온도"[\s\S]*data-utility-entry-experiment-save-kind="other-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="average_temperature"[\s\S]*data-utility-entry-experiment-number-kind="float"[\s\S]*℃/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 횟수 1팀 2파트"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_count"[\s\S]*data-utility-entry-experiment-team-key="team_01_02"[\s\S]*회/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 시간 1팀 2파트"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_time"[\s\S]*data-utility-entry-experiment-team-key="team_01_02"[\s\S]*data-utility-entry-experiment-number-kind="float"[\s\S]*시간/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 횟수 2팀"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_count"[\s\S]*data-utility-entry-experiment-team-key="team_02"[\s\S]*회/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 시간 2팀"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_time"[\s\S]*data-utility-entry-experiment-team-key="team_02"[\s\S]*data-utility-entry-experiment-number-kind="float"[\s\S]*시간/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 횟수 3팀"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_count"[\s\S]*data-utility-entry-experiment-team-key="team_03"[\s\S]*회/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="유산 CIP 시간 3팀"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_time"[\s\S]*data-utility-entry-experiment-team-key="team_03"[\s\S]*data-utility-entry-experiment-number-kind="float"[\s\S]*시간/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="북정 CIP 횟수 1팀 1파트"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_count"[\s\S]*data-utility-entry-experiment-team-key="team_01_01"[\s\S]*회/
  );
  assert.match(
    utilityEntryCategory.content,
    /aria-label="북정 CIP 시간 1팀 1파트"[\s\S]*data-utility-entry-experiment-save-kind="other-team-monthly-field"[\s\S]*data-utility-entry-experiment-field-key="cip_time"[\s\S]*data-utility-entry-experiment-team-key="team_01_01"[\s\S]*data-utility-entry-experiment-number-kind="float"[\s\S]*시간/
  );
  const cipCards = utilityEntryCategory.content.match(
    /<section class="utility-entry-experiment-settlement is-cip">[\s\S]*?<\/section>/g
  );
  assert.equal(cipCards?.length, 1);
  assert.match(cipCards[0], /1팀 1파트[\s\S]*1팀 2파트[\s\S]*2팀[\s\S]*3팀/);
  assert.match(cipCards[0], /aria-label="북정 CIP 횟수 1팀 1파트"/);
  assert.match(cipCards[0], /aria-label="유산 CIP 횟수 1팀 2파트"/);
  const dataSectionSource = sectionSources
    .filter(({ filename }) => filename.startsWith('KPI.utility-entry.') || filename === 'KPI.sections.data.js')
    .map(({ source }) => source)
    .join('\n')
    .replace(/\bparts\.(?=[A-Za-z_$][\w$]*\s*\()/g, '');
  assert.match(dataSectionSource, /key:\s*'electric_bukjeong'/);
  assert.match(dataSectionSource, /calculateUtilityEntryExperimentUnitPrice\(powerCharge,\s*usageBase,\s*0\)/);
  assert.match(dataSectionSource, /calculateUtilityEntryExperimentUnitPrice\(powerCharge,\s*rawLpgUsage,\s*1\)/);
  assert.match(dataSectionSource, /calculateUtilityEntryExperimentWastePerProductionTon\(usageBase,\s*production\)/);
  assert.match(dataSectionSource, /electric_yusan:\s*'electric_yusan'/);
  assert.match(dataSectionSource, /electric_bukjeong:\s*'electric_bukjeong'/);
  assert.match(dataSectionSource, /gas_yusan_lng:\s*'gas_yusan'/);
  assert.match(dataSectionSource, /gas_yusan_lpg:\s*'gas_yusan_lpg'/);
  assert.match(dataSectionSource, /gas_bukjeong_lng:\s*'gas_bukjeong'/);
  assert.match(dataSectionSource, /gas_yusan_lpg:\s*Object\.freeze\(\{/);
  assert.match(dataSectionSource, /scopeKey:\s*'yusan_lpg'/);
  assert.match(dataSectionSource, /productionTeamNames:\s*Object\.freeze\(\['1팀 2파트'\]\)/);
  assert.match(dataSectionSource, /memoKey:\s*'utilityGraphGasYusanLpgMemo'/);
  assert.match(dataSectionSource, /memoDefaultMetric:\s*'lpg_unit'/);
  assert.match(dataSectionSource, /Object\.freeze\(\{\s*key:\s*'gas_yusan_lpg',\s*label:\s*'LPG 그래프'\s*\}\)/);
  assert.match(dataSectionSource, /utilityEntryExperimentTitleGraph/);
  assert.match(dataSectionSource, /openUtilityEntryExperimentGraphTemplateByKey\(\s*titleGraphKey/);
  assert.match(
    dataSectionSource,
    /modal\.dataset\.utilityEntryExperimentGraphOptions\s*=\s*JSON\.stringify\(graphOptions\)/
  );
  assert.match(dataSectionSource, /modal\.dataset\.utilityEntryExperimentGraphKey/);
  assert.match(dataSectionSource, /data-role="utility-entry-experiment-graph-capture-pdf"/);
  assert.match(dataSectionSource, /report-deck\/capture-zip/);
  assert.match(dataSectionSource, /format:\s*'pdf'/);
  assert.match(dataSectionSource, /ensureUtilityEntryExperimentGraphFullscreenForCapture\(targetModal\)/);
  assert.match(dataSectionSource, /requestFullscreen\.call\(target\)/);
  assert.match(dataSectionSource, /transform:\s*scale\(\$\{scaleX\},\s*\$\{scaleY\}\)/);

  const meterLinkStates = context.window.KpiUtilityEntryExperiment.getMonthlyMeterLinkStates(
    {
      electric: {
        equipmentEntries: {
          '2026-06-01': {
            values: {
              field_01: '123',
            },
          },
        },
      },
      gas: {},
      waste: {},
    },
    '2026-05'
  );
  assert.equal(meterLinkStates.electric_yusan.ready, true);
  assert.equal(meterLinkStates.electric_bukjeong.ready, true);
  assert.equal(meterLinkStates.electric_yusan.statusLabel, '검침값 입력');
  assert.equal(meterLinkStates.gas_yusan_lng.ready, false);
  assert.match(meterLinkStates.gas_yusan_lng.title, /검침값 입력 후/u);
  assert.equal(meterLinkStates.gas_yusan_lpg.ready, false);
  assert.match(meterLinkStates.gas_yusan_lpg.title, /검침값 입력 후/u);

  assert.doesNotMatch(utilityEntryCategory.content, /data-utility-entry-experiment-graph="electric_yusan"/);
  assert.doesNotMatch(utilityEntryCategory.content, /data-utility-entry-experiment-graph="electric_bukjeong"/);
  assert.doesNotMatch(utilityEntryCategory.content, /data-utility-entry-experiment-graph="gas_yusan"/);
  assert.doesNotMatch(utilityEntryCategory.content, /data-utility-entry-experiment-graph="gas_bukjeong"/);
  assert.match(utilityEntryCategory.content, /data-role="utility-entry-experiment-billing-attach"/);
  assert.doesNotMatch(utilityEntryCategory.content, /data-kpi-metering-root/);
  assert.doesNotMatch(JSON.stringify(appData.data.categories), /총괄 비율/);
  assert.equal(appData.data.categories[1].title, '작업 이력');
  assert.equal(appData.data.categories[1].desc, '');
  assert.equal(appData.data.categories[1].shortcutTarget.sectionId, 'work');
  assert.equal(appData.work.categories[1].title, '작업 이력');
  assert.equal(appData.work.categories[1].desc, '');
  const dataCategoryTitles = Array.from(appData.data.categories, (category) => category.title);
  const equipmentHistoryCategories = Array.from(appData.data.categories).filter(
    (category) => category.title === '설비 이력'
  );
  assert.deepEqual(dataCategoryTitles, ['유틸리티', '작업 이력', '설비 이력', '조도']);
  assert.equal(equipmentHistoryCategories.length, 1);
  assert.equal(dataCategoryTitles.indexOf('설비 이력'), dataCategoryTitles.indexOf('작업 이력') + 1);
  assert.equal(equipmentHistoryCategories[0].desc, '');
  assert.equal(equipmentHistoryCategories[0].dataKey, 'data_equipment_history_card');
  assert.deepEqual(
    Object.keys(equipmentHistoryCategories[0]).filter((key) => /surface/i.test(key)),
    []
  );
  assert.equal(appData.data.categories[3].dataKey, 'audit_lux');
  assert.equal(appData.data.categories[3].fileName, 'Central Server DB / Lux Data');
});
