(function registerUtilityGraphTemplateShell(global) {
  if (!global) return;
  const PARTS_KEY = Symbol.for('kpi.utilityGraphTemplate.parts');
  const parts = global[PARTS_KEY] || (global[PARTS_KEY] = Object.create(null));
  if (!Array.isArray(parts.defaultTopMonths) || !parts.emptyReportData) {
    throw new Error('KpiUtilityGraphTemplate foundation part missing');
  }
  const defaultTopMonths = parts.defaultTopMonths;
  const emptyReportData = parts.emptyReportData;
  const mergeReportData = (...args) => parts.mergeReportData(...args);
  const drawTopChart = (...args) => parts.drawTopChart(...args);
  const normalizeTopSeries = (...args) => parts.normalizeTopSeries(...args);
  const renderAxisLabel = (...args) => parts.renderAxisLabel(...args);
  const renderBottomChart = (...args) => parts.renderBottomChart(...args);
  const renderLegend = (...args) => parts.renderLegend(...args);
  const renderUnitCostTable = (...args) => parts.renderUnitCostTable(...args);
  const renderUtilityGraphMemo = (...args) => parts.renderUtilityGraphMemo(...args);

  function createReportShell() {
    return `
      <main class="utility-graph-template" data-role="utility-graph-template-root">
        <section class="top-panel panel-frame" aria-label="복합 차트">
          <div class="side-axis side-axis-left" data-role="utility-graph-left-axis" aria-hidden="true"></div>
          <svg class="top-chart" data-role="utility-graph-top-chart" role="img" aria-label="복합 차트"></svg>
          <div class="side-axis side-axis-right" data-role="utility-graph-right-axis" aria-hidden="true"></div>
          <div class="legend top-legend" data-role="utility-graph-legend" aria-label="범례"></div>
        </section>
        <section class="table-panel" aria-label="원단위 표">
          <table class="unit-cost-table" data-role="utility-graph-table"></table>
        </section>
        <section class="bottom-panel panel-frame" aria-label="원단위 추이 차트">
          <svg class="bottom-chart" data-role="utility-graph-bottom-chart" role="img" aria-label="원단위 추이"></svg>
          <div class="bottom-chart utility-graph-report-bottom-chart" data-role="utility-graph-bottom-chart-report" hidden></div>
          <div class="bottom-caption" data-role="utility-graph-bottom-caption"></div>
          <div class="graph-note report-auto-memo-box" data-role="utility-graph-note" role="button" tabindex="0">
            <strong>특이사항</strong>
            <div class="report-auto-memo-blank report-auto-memo-content" data-role="utility-graph-remark"></div>
          </div>
          <div class="utility-graph-memo-dialog report-memo-dialog" data-role="utility-graph-memo-dialog" hidden>
            <div class="report-memo-dialog-head">
              <strong>특이사항 선택</strong>
              <button type="button" data-role="utility-graph-memo-close">닫기</button>
            </div>
            <div class="report-memo-controls">
              <label>
                <span>팀</span>
                <select data-role="utility-graph-memo-team"></select>
              </label>
              <label>
                <span>항목</span>
                <select data-role="utility-graph-memo-metric"></select>
              </label>
            </div>
            <div class="report-memo-lines" data-role="utility-graph-memo-lines"></div>
            <div class="report-memo-manual">
              <textarea data-role="utility-graph-memo-manual-input" rows="2"></textarea>
              <button type="button" data-role="utility-graph-memo-manual-add">직접 추가</button>
            </div>
            <div class="report-memo-candidates" data-role="utility-graph-memo-candidates"></div>
            <div class="report-memo-dialog-actions">
              <button type="button" data-role="utility-graph-memo-clear">내용 비우기</button>
              <button type="button" class="is-primary" data-role="utility-graph-memo-close">완료</button>
            </div>
          </div>
        </section>
        <div class="utility-graph-memo-overview-dialog report-memo-overview-dialog" data-role="utility-graph-memo-overview-dialog" hidden role="dialog" aria-modal="true" aria-label="특이사항 전체 확인">
          <div class="report-memo-overview-panel">
            <div class="report-memo-overview-head">
              <strong>특이사항 전체 확인</strong>
              <button type="button" data-role="utility-graph-memo-overview-close" aria-label="닫기">닫기</button>
            </div>
            <div class="report-memo-overview-body" data-role="utility-graph-memo-overview-list">
              <div class="report-memo-overview-empty">특이사항 항목을 불러오는 중입니다.</div>
            </div>
          </div>
        </div>
      </main>
    `;
  }

  function createEmptyData(overrides = {}) {
    return mergeReportData(emptyReportData, overrides);
  }

  function render(container, nextData = {}) {
    if (!container) return null;
    let root = container.matches?.('[data-role="utility-graph-template-root"]')
      ? container
      : container.querySelector?.('[data-role="utility-graph-template-root"]');

    if (!root) {
      container.innerHTML = createReportShell();
      root = container.querySelector('[data-role="utility-graph-template-root"]');
    }

    const data = createEmptyData(nextData);
    renderReport(root, data);
    return root;
  }

  function renderReport(root, data) {
    setText(root, '[data-role="utility-graph-title"]', data.title || '');
    setText(root, '[data-role="utility-graph-range"]', data.rangeText || '');
    renderAxisLabel(root.querySelector('[data-role="utility-graph-left-axis"]'), data.labels.leftAxis || '');
    renderAxisLabel(root.querySelector('[data-role="utility-graph-right-axis"]'), data.labels.rightAxis || '');
    renderLegend(root.querySelector('[data-role="utility-graph-legend"]'), data.labels);

    drawTopChart(
      root.querySelector('[data-role="utility-graph-top-chart"]'),
      data.topMonths || defaultTopMonths,
      normalizeTopSeries(data.topSeries || {}),
      data.options?.top || emptyReportData.options.top,
      data.labels,
      data.title || ''
    );

    renderUnitCostTable(root.querySelector('[data-role="utility-graph-table"]'), data.tableMonths || emptyReportData.tableMonths, data.labels);

    renderBottomChart(root, data);

    setText(root, '[data-role="utility-graph-bottom-caption"]', data.labels.bottomCaption || '');
    renderUtilityGraphMemo(root, data);
  }

  function setText(root, selector, text) {
    const node = root.querySelector(selector);
    if (node) node.textContent = text;
  }


  Object.assign(parts, { createEmptyData, render });
})(this);
