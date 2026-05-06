import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.factory-adapter.js');
const sectionPath = path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.sections.production-report.js');
const sectionRegistryPath = path.join(repoRoot, 'kpi-runtime', 'sections', 'KPI.section.registry.js');
const popupPath = path.join(repoRoot, 'kpi-runtime', 'sections', 'monthly-performance-report-popup.html');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const sectionSource = await fs.readFile(sectionPath, 'utf8');
const sectionRegistrySource = await fs.readFile(sectionRegistryPath, 'utf8');
const popupSource = await fs.readFile(popupPath, 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function loadProductionReportSection() {
  const context = {
    window: {},
  };
  vm.runInNewContext(adapterSource, context, {
    filename: adapterPath,
  });
  vm.runInNewContext(sectionSource, context, {
    filename: sectionPath,
  });
  return context.window.KpiSectionFactories.productionReport();
}

test('monthly performance report section is separate from work-history reports', () => {
  const section = loadProductionReportSection();

  assert.equal(section.id, 'productionReport');
  assert.equal(section.name, '월간 실적보고');
  assert.equal(section.icon, 'fa-chart-line');
  assert.equal(section.accent, '#0b477b');
  assert.equal(section.directLaunch, true);
  assert.equal(section.launchUrl, '/kpi-runtime/sections/monthly-performance-report-popup.html');
  assert.equal(section.launchTarget, 'popup');
  assert.equal(section.launchWindowName, 'kpi-monthly-performance-report');
  assert.equal(section.launchWindowWidth, 1480);
  assert.equal(section.launchWindowHeight, 920);
  assert.equal(Array.isArray(section.categories), true);
  assert.equal(section.categories.length, 0);

  assert.doesNotMatch(sectionSource, /preview\.html/i);
  assert.doesNotMatch(sectionSource, /work_history_records/);
  assert.doesNotMatch(sectionSource, /history_tool/);
});

test('monthly performance popup renders one utility analysis table with electric gas toggle', () => {
  assert.match(popupSource, /공무환경팀 월간 실적보고/);
  assert.match(popupSource, /유틸리티 분석표/);
  assert.match(popupSource, /전기 분석표/);
  assert.match(popupSource, /가스비 분석표/);
  assert.match(popupSource, /data-report-utility-button="electric"/);
  assert.match(popupSource, /data-report-utility-button="gas"/);
  assert.match(popupSource, /data-report-analysis-panel="electric"/);
  assert.match(popupSource, /data-report-analysis-panel="gas"/);
  assert.doesNotMatch(popupSource, /data-report-export/);
  assert.doesNotMatch(popupSource, /downloadStandaloneReport/);
  assert.doesNotMatch(popupSource, /buildStandaloneHtml/);
  assert.match(popupSource, /data-report-chart-modal/);
  assert.match(popupSource, /data-report-chart-open/);
  assert.match(popupSource, /data-report-range-from/);
  assert.match(popupSource, /data-report-range-to/);
  assert.match(popupSource, /util-sheet-analysis-chart-card/);
  assert.match(popupSource, /util-sheet-analysis-series-controls/);
  assert.match(popupSource, /전기 사용량 · 금액 · 생산량/);
  assert.match(popupSource, /LNG\/LPG 사용량 · 금액 · 생산량/);
  assert.match(popupSource, /이번달 특이사항/);
  assert.match(popupSource, /1팀 1파트 생산량이 전월 대비 12\.4% 증가/);
  assert.doesNotMatch(popupSource, /폐수 분석표/);
  assert.doesNotMatch(popupSource, /폐수 처리량/);
  assert.doesNotMatch(popupSource, /data-report-chart="waste"/);
  assert.doesNotMatch(popupSource, /report-chart-grid/);
  assert.doesNotMatch(popupSource, /같은 월 기준으로 비교/);
  assert.doesNotMatch(popupSource, /인쇄/);
  assert.doesNotMatch(popupSource, /data-team-tab=/);
  assert.doesNotMatch(popupSource, /data-team-panel=/);
});

test('kpi html and registry wire the production report section before the section registry bootstraps', () => {
  const adapterIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.factory-adapter.js?v=1');
  const sectionIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.sections.production-report.js?v=1');
  const registryIndex = kpiHtml.indexOf('kpi-runtime/sections/KPI.section.registry.js?v=1');

  assert.ok(adapterIndex >= 0, 'section factory adapter loader is missing');
  assert.ok(sectionIndex >= 0, 'production report section loader is missing');
  assert.ok(sectionIndex > adapterIndex, 'production report section must load after section factory adapter');
  assert.ok(registryIndex > sectionIndex, 'section registry must load after the production report section');
  assert.match(sectionRegistrySource, /'work', 'util', 'audit', 'data', 'productionReport', 'owner'/);
  assert.doesNotMatch(sectionRegistrySource, /window\.KpiSectionFactories/);
});
