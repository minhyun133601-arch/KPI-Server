import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await fs.readFile(
  new URL('../../../sections/kpi/KPI.sections.kpi.energy-view.js', import.meta.url),
  'utf8'
);

function createViewApi() {
  const context = vm.createContext({});
  vm.runInContext(source, context, { filename: 'KPI.sections.kpi.energy-view.js' });
  return vm.runInContext('this[Symbol.for("kpi.energy.kpi.parts")]', context);
}

function createReport() {
  const components = [
    { key: 'electric', unit: 'kWh', amount: 2, factor: 10, kcal: 20, applicable: true },
    { key: 'lng', unit: 'Nm³', amount: 4, factor: 20, kcal: 80, applicable: true },
    { key: 'lpg', unit: 'kg', amount: 0, factor: 30, kcal: 0, applicable: false },
  ];
  return {
    scopeKey: 'total',
    scopeLabel: '전체',
    monthKeys: ['2026-01', '2026-02', '2026-03'],
    monthly: [
      { monthKey: '2026-01', energyKcal: 100, productionKg: 100, intensity: 1, complete: true, components },
      { monthKey: '2026-02', energyKcal: NaN, productionKg: NaN, intensity: NaN, complete: false, components: [] },
      { monthKey: '2026-03', energyKcal: 900, productionKg: 150, intensity: 6, complete: true, components },
    ],
    totals: {
      energyKcal: 1000,
      productionKg: 250,
      intensity: 4,
      electricKcal: 400,
      gasKcal: 600,
      lngKcal: 400,
      lpgKcal: 200,
      shares: { electric: 40, gas: 60, lng: 40, lpg: 20 },
      lngOfGasShare: 200 / 3,
      lpgOfGasShare: 100 / 3,
    },
    teams: [
      {
        key: 'team-01-01',
        label: '1팀 1파트',
        energyKcal: 600,
        productionKg: 100,
        intensity: 6,
        energyShare: 60,
        productionShare: 40,
      },
      {
        key: 'team-02',
        label: '2팀',
        energyKcal: 400,
        productionKg: 150,
        intensity: 8 / 3,
        energyShare: 40,
        productionShare: 60,
      },
    ],
    includedMonthKeys: ['2026-01', '2026-03'],
    excludedMonthKeys: ['2026-02'],
    coverage: { included: 2, total: 3 },
    factors: { electric: 10, lng: 20, lpg: 30, kjPerKcal: 4.1868 },
  };
}

test('energy KPI view renders the supplied aggregate ratio, coverage and team navigation', () => {
  const api = createViewApi();
  const html = api.buildEnergyKpiReportHtml(createReport());
  assert.match(html, /data-energy-kpi-value="intensity"><strong>4<\/strong><span>kcal\/kg/);
  assert.match(html, /Σ 열량 \/ Σ 생산량/);
  assert.doesNotMatch(
    html,
    /data-energy-kpi-value="energy"|data-energy-kpi-value="production"|기간 총열량|기간 생산량/
  );
  assert.equal((html.match(/class="energy-kpi-metric is-primary"/g) || []).length, 1);
  assert.match(html, /data-energy-kpi-monthly-table/);
  assert.match(html, /2026-03<\/th><td>150<\/td><td>900<\/td><td class="energy-kpi-monthly-intensity">6<\/td>/);
  assert.match(html, /데이터 포함 2 \/ 3개월/);
  assert.match(html, /제외된 1개월 확인<\/summary><p>2026-02/);
  assert.match(html, /data-energy-kpi-team="team-01-01"/);
  assert.match(html, /aria-label="1팀 1파트 KPI 보기"/);
  assert.match(html, /onclick="KpiEnergyDashboard.selectTeam\(this\)"/);
  assert.match(html, /생산량 비중/);
});

test('monthly table retains each missing month and shows available production or energy independently', () => {
  const api = createViewApi();
  const report = createReport();
  report.monthly[1].productionKg = 85;
  const html = api.buildEnergyKpiReportHtml(report);
  const monthlyTable = html.match(/<table[^>]*data-energy-kpi-monthly-table>[\s\S]*?<\/table>/)?.[0];
  assert.ok(monthlyTable);
  assert.equal((monthlyTable.match(/<th scope="row">/g) || []).length, 3);
  assert.match(monthlyTable, /2026-02<\/th><td>85<\/td><td><span class="energy-kpi-monthly-missing">미입력/);
  report.monthly[1].energyKcal = 700;
  report.monthly[1].productionKg = NaN;
  const energyOnlyTable = api
    .buildEnergyKpiReportHtml(report)
    .match(/<table[^>]*data-energy-kpi-monthly-table>[\s\S]*?<\/table>/)?.[0];
  assert.match(
    energyOnlyTable,
    /2026-02<\/th><td><span class="energy-kpi-monthly-missing">미입력<\/span><\/td><td>700/
  );
});

test('energy KPI view provides a full-width mount for the shared analysis graph', () => {
  const api = createViewApi();
  const html = api.buildEnergyKpiReportHtml(createReport());
  assert.match(html, /experiment-chart-mount[^>]*data-exp-report-chart-style="report-auto"[^>]*data-energy-kpi-chart/);
  assert.match(html, /월별 겹쳐보기/);
  assert.doesNotMatch(html, /<svg|energy-kpi-monthly-grid/);
});

test('KPI starts with a clean graph view and keeps all detailed data in its hidden side panel', () => {
  const api = createViewApi();
  const html = api.buildEnergyKpiReportHtml(createReport());
  const [main, drawer] = html.split('<aside class="energy-kpi-drawer"');
  assert.ok(drawer);
  assert.match(main, /data-energy-kpi-main/);
  assert.match(main, /data-energy-kpi-chart/);
  assert.doesNotMatch(main, /<table|energy-kpi-fuel-grid|data-energy-kpi-conversion/);
  assert.match(drawer, /id="energy-kpi-details" hidden role="dialog" aria-label="KPI 상세 자료"/);
  assert.doesNotMatch(drawer, /aria-modal/);
  assert.match(drawer, /data-energy-kpi-panel-close onclick="KpiEnergyDashboard.closePanel\(this\)"/);
  assert.match(drawer, /data-energy-kpi-popout onclick="KpiEnergyDashboard.detachPanel\(this\)" title="다른 모니터로 옮길 수 있는 별도 창으로 열기">새 창으로 <span aria-hidden="true">↗/);
  assert.match(drawer, /data-energy-kpi-popup-status hidden role="status"/);
  assert.doesNotMatch(drawer, /data-energy-kpi-previous|이전 보기/);
  assert.match(drawer, /class="energy-kpi-drawer-header" data-energy-kpi-drag-handle title="드래그하여 이동"/);
  assert.match(drawer, /data-energy-kpi-drag-keyboard tabindex="0" role="group" aria-label="상세 창 이동" aria-describedby="energy-kpi-move-hint"/);
  assert.match(drawer, /id="energy-kpi-move-hint">드래그하여 이동 · 방향키로 이동/);
  assert.match(drawer, /data-energy-kpi-drawer-scroll/);
  assert.match(drawer, /<h3>전체<\/h3><p>2026-01 — 2026-03<\/p>/);
  for (const key of ['monthly', 'composition', 'teams', 'conversion']) {
    assert.match(main, new RegExp(`data-energy-kpi-panel-open="${key}"[^>]*aria-expanded="false" aria-controls="energy-kpi-details"`));
    assert.match(drawer, new RegExp(`data-energy-kpi-panel-tab="${key}" onclick="KpiEnergyDashboard.selectPanel\\(this\\)"`));
    assert.match(drawer, new RegExp(`data-energy-kpi-panel-content="${key}" hidden role="tabpanel"`));
  }
  assert.match(drawer, /data-energy-kpi-monthly-table/);
  assert.match(drawer, /energy-kpi-fuel-grid/);
  assert.match(drawer, /data-energy-kpi-team="team-01-01"/);
  assert.match(drawer, /data-energy-kpi-conversion/);
});

test('gas children distinguish their share of gas from their share of total energy', () => {
  const api = createViewApi();
  const html = api.buildEnergyKpiReportHtml(createReport());
  assert.match(html, /가스 내 66\.7% <span>· 전체 40%/);
  assert.match(html, /가스 내 33\.3% <span>· 전체 20%/);
  assert.match(html, /전기 전체 열량 비중 40%/);
  assert.match(html, /가스 전체 열량 비중 60%/);
});

test('conversion panel renders actual inputs and distinguishes missing and unused fuels', () => {
  const api = createViewApi();
  const html = api.buildEnergyKpiReportHtml(createReport());
  assert.match(html, /<section[^>]*data-energy-kpi-conversion>/);
  assert.match(html, /2 kWh × 10/);
  assert.match(html, /4 Nm³ × 20/);
  assert.match(html, /미사용 · 합산 제외/);
  assert.match(html, /미입력/);
  assert.match(html, /1 kcal = 4\.1868 kJ/);
  assert.match(html, /집계 제외/);
});

test('zero production and absent data stay explicit without fabricated values', () => {
  const api = createViewApi();
  const report = createReport();
  report.totals.productionKg = 0;
  report.totals.intensity = NaN;
  assert.match(api.buildEnergyKpiReportHtml(report), /생산량이 0 kg이므로 원단위를 산출할 수 없습니다/);
  const emptyHtml = api.buildEnergyKpiReportHtml({});
  assert.match(emptyHtml, /선택 기간에 해당하는 월이 없습니다/);
  assert.match(emptyHtml, /선택 기간 확인/);
  assert.doesNotMatch(emptyHtml, /NaN|Infinity|undefined/);
  report.monthly = [{ monthKey: '2026-01', intensity: 0, complete: true }];
  const zeroHtml = api.buildEnergyKpiReportHtml(report);
  assert.doesNotMatch(zeroHtml, /NaN|Infinity/);
});

test('view escapes report labels and confines share bar widths to numeric percentages', () => {
  const api = createViewApi();
  const report = createReport();
  report.teams[0].label = '<img src=x onerror=alert(1)>';
  report.scopeLabel = '<img src=x onerror=alert(1)>';
  report.teams[0].key = 'team-01-01" onmouseover="alert(1)';
  report.teams[0].energyShare = 900;
  report.teams[0].productionShare = -200;
  const html = api.buildEnergyKpiReportHtml(report);
  assert.doesNotMatch(html, /<img|onmouseover="alert/);
  assert.match(html, /&lt;img/);
  assert.match(html, /style="width:100%"/);
  assert.match(html, /style="width:0%"/);
});
