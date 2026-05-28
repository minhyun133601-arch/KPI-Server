(function registerUtilityGraphTemplate(global) {
  const NS = 'http://www.w3.org/2000/svg';
  const memoTeamOptions = [
    { key: 'team_01_01', label: '1팀 1파트' },
    { key: 'team_01_02', label: '1팀 2파트' },
    { key: 'team_02', label: '2팀' },
    { key: 'team_03', label: '3팀' }
  ];
  const memoMetricOptions = [
    { key: 'production', label: '생산량' },
    { key: 'yusan_production_share', label: '유산 생산량 비율' },
    { key: 'electric', label: '전력량' },
    { key: 'electric_unit', label: '생산량 대비 전력량' },
    { key: 'lng', label: 'LNG' },
    { key: 'lng_unit', label: '생산량 대비 LNG' },
    { key: 'lpg', label: 'LPG' },
    { key: 'lpg_unit', label: '생산량 대비 LPG' },
    { key: 'waste_usage', label: '폐수 방류량' },
    { key: 'waste_cost_total', label: '폐수 처리비용' }
  ];

  const defaultTopMonths = buildMonths('2025-04', '2026-04');
  const defaultTableMonths = buildMonths('2024-04', '2026-04');
  const defaultLabels = {
    leftAxis: '금액',
    rightAxis: '사용량',
    usage: '전력량',
    usageUnit: 'kWh',
    amount: '금액',
    amountUnit: '원',
    production: '생산량',
    productionUnit: 'Kg',
    site: '북정',
    ratio: '생산량 대비 전력량',
    ratioUnit: 'kWh/Kg',
    tableRow: '생산량 대비 전력량<br>(kWh/Kg)',
    bottomCaption: ''
  };

  const emptyReportData = {
    title: '북정공장 전기 원가 Data',
    rangeText: '',
    labels: defaultLabels,
    topMonths: defaultTopMonths,
    tableMonths: defaultTableMonths.map(month => ({
      ...month,
      value: null,
      highlight: month.key === '2025-04' || month.key === '2026-04'
    })),
    bottomMonths: defaultTableMonths,
    topSeries: {
      usage: null,
      amount: null,
      production: null
    },
    bottomSeries: null,
    remark: '',
    options: {
      top: {
        leftAxisMax: 70000000,
        rightAxisMax: 1600000,
        amountAxisStep: 10000000,
        usageAxisStep: 200000,
        showDataLabels: true
      },
      bottom: {
        yMin: null,
        yMax: null,
        yStep: 0.05,
        showDataLabels: true,
        comparisonKeys: ['2025-04', '2026-04']
      }
    }
  };

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

  function getUtilityGraphMemoLines(text = '') {
    return String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  function getUtilityGraphMemoLineClass(lineText = '') {
    const text = String(lineText || '');
    const hasUp = text.includes('↑') || text.includes('▲');
    const hasDown = text.includes('↓') || text.includes('▼');
    if (hasUp && hasDown) return 'is-mixed';
    if (hasUp) return 'is-up';
    if (hasDown) return 'is-down';
    return 'is-flat';
  }

  function getUtilityGraphMemoSegmentClass(segmentText = '') {
    const text = String(segmentText || '');
    if (text.includes('↑') || text.includes('▲')) return 'is-up';
    if (text.includes('↓') || text.includes('▼')) return 'is-down';
    return 'is-flat';
  }

  function findUtilityGraphMemoBasisIndex(text = '', startIndex = 0) {
    return ['전월대비', '전년대비'].reduce((best, basisLabel) => {
      const index = text.indexOf(basisLabel, startIndex);
      if (index < 0) return best;
      return best < 0 || index < best ? index : best;
    }, -1);
  }

  function renderUtilityGraphMemoLineHtml(lineText = '') {
    const text = String(lineText || '');
    let cursor = 0;
    let basisIndex = findUtilityGraphMemoBasisIndex(text, 0);
    if (basisIndex < 0) return escapeHtml(text);

    const parts = [];
    while (basisIndex >= 0) {
      if (basisIndex > cursor) {
        parts.push(escapeHtml(text.slice(cursor, basisIndex)));
      }
      const nextBasisIndex = findUtilityGraphMemoBasisIndex(text, basisIndex + 1);
      const rawSegmentEnd = nextBasisIndex >= 0 ? nextBasisIndex : text.length;
      let segmentText = text.slice(basisIndex, rawSegmentEnd);
      const separatorMatch = segmentText.match(/,\s*$/);
      const separatorText = separatorMatch ? separatorMatch[0] : '';
      if (separatorText) {
        segmentText = segmentText.slice(0, -separatorText.length);
      }
      const basisMatch = segmentText.match(/^(전월대비|전년대비)(\s*)([\s\S]*)$/);
      if (basisMatch) {
        parts.push(`<span class="report-auto-memo-basis">${escapeHtml(basisMatch[1])}</span>`);
        const valueText = `${basisMatch[2] || ''}${basisMatch[3] || ''}`;
        if (valueText) {
          const segmentClass = getUtilityGraphMemoSegmentClass(valueText);
          parts.push(`<span class="report-auto-memo-delta ${segmentClass}">${escapeHtml(valueText)}</span>`);
        }
      } else {
        const segmentClass = getUtilityGraphMemoSegmentClass(segmentText);
        parts.push(`<span class="report-auto-memo-segment ${segmentClass}">${escapeHtml(segmentText)}</span>`);
      }
      if (separatorText) {
        parts.push(escapeHtml(separatorText));
      }
      cursor = rawSegmentEnd;
      basisIndex = nextBasisIndex;
    }
    if (cursor < text.length) {
      parts.push(escapeHtml(text.slice(cursor)));
    }
    return parts.join('');
  }

  function renderUtilityGraphMemoAddButtonHtml(key = '') {
    const normalizedKey = String(key || '').trim();
    return normalizedKey
      ? `<button type="button" class="report-auto-memo-add" data-role="utility-graph-memo-add" data-utility-graph-memo-add-key="${escapeHtml(normalizedKey)}" title="특이사항 추가">+</button>`
      : '';
  }

  function renderUtilityGraphMemoContent(root) {
    const state = root.__utilityGraphMemoState || {};
    const container = root.querySelector('[data-role="utility-graph-remark"]');
    if (!container) return;
    const lines = Array.isArray(state.lines) ? state.lines : [];
    container.dataset.empty = lines.length ? 'false' : 'true';
    const addButtonHtml = renderUtilityGraphMemoAddButtonHtml(state.key);
    if (!lines.length) {
      container.innerHTML = addButtonHtml;
      return;
    }
    container.innerHTML = lines.map((line, index) => (
      `<span class="report-auto-memo-line ${getUtilityGraphMemoLineClass(line)}">`
        + `<span class="report-auto-memo-line-text">${renderUtilityGraphMemoLineHtml(line)}</span>`
        + `<button type="button" class="report-auto-memo-delete" data-role="utility-graph-memo-delete-line" data-utility-graph-memo-delete-line="${index}" title="특이사항 삭제">-</button>`
      + '</span>'
    )).join('') + addButtonHtml;
  }

  function normalizeUtilityGraphMemoOption(value = '', options = [], fallback = '') {
    const key = String(value || '').trim();
    return options.some(option => option.key === key) ? key : fallback;
  }

  function syncUtilityGraphMemoDialogOptions(root) {
    const state = root.__utilityGraphMemoState || {};
    const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
    const teamSelect = dialog?.querySelector?.('[data-role="utility-graph-memo-team"]');
    const metricSelect = dialog?.querySelector?.('[data-role="utility-graph-memo-metric"]');
    const teamKey = normalizeUtilityGraphMemoOption(state.teamKey || state.defaultTeam, memoTeamOptions, memoTeamOptions[0].key);
    const metricKey = normalizeUtilityGraphMemoOption(state.metricKey || state.defaultMetric, memoMetricOptions, memoMetricOptions[0].key);
    if (teamSelect) {
      teamSelect.innerHTML = memoTeamOptions.map(option => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
      teamSelect.value = teamKey;
    }
    if (metricSelect) {
      metricSelect.innerHTML = memoMetricOptions.map(option => `<option value="${escapeHtml(option.key)}">${escapeHtml(option.label)}</option>`).join('');
      metricSelect.value = metricKey;
    }
    state.teamKey = teamKey;
    state.metricKey = metricKey;
  }

  function setUtilityGraphMemoCandidateMessage(root) {
    const list = root.querySelector('[data-role="utility-graph-memo-candidates"]');
    if (list) {
      list.dataset.empty = 'true';
      list.innerHTML = '';
    }
  }

  function renderUtilityGraphMemoDialogLines(root) {
    const state = root.__utilityGraphMemoState || {};
    const list = root.querySelector('[data-role="utility-graph-memo-lines"]');
    if (!list) return;
    const lines = Array.isArray(state.lines) ? state.lines : [];
    list.dataset.empty = lines.length ? 'false' : 'true';
    if (!lines.length) {
      list.innerHTML = '';
      return;
    }
    list.innerHTML = lines.map((line, index) => (
      `<div class="report-memo-line-row" data-utility-graph-memo-line-row="${index}">`
        + `<textarea class="report-memo-line-input ${getUtilityGraphMemoLineClass(line)}" data-role="utility-graph-memo-line-input" data-utility-graph-memo-line-input="${index}" rows="2" aria-label="특이사항 ${index + 1}">${escapeHtml(line)}</textarea>`
        + `<button type="button" data-role="utility-graph-memo-dialog-delete-line" data-utility-graph-memo-delete-line="${index}">삭제</button>`
      + '</div>'
    )).join('');
  }

  function renderUtilityGraphMemoCandidates(root, candidates = []) {
    const list = root.querySelector('[data-role="utility-graph-memo-candidates"]');
    const state = root.__utilityGraphMemoState || {};
    if (!list) return;
    const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
    state.candidates = normalizedCandidates;
    if (!normalizedCandidates.length) {
      setUtilityGraphMemoCandidateMessage(root);
      return;
    }
    list.innerHTML = normalizedCandidates.map((candidate, index) => {
      const direction = String(candidate?.direction || 'flat').trim() || 'flat';
      return `<button type="button" class="report-memo-candidate is-${escapeHtml(direction)}" data-role="utility-graph-memo-candidate" data-utility-graph-memo-candidate="${index}"><span class="report-memo-candidate-add">+</span><span class="report-memo-candidate-text">${renderUtilityGraphMemoLineHtml(candidate?.text || '')}</span></button>`;
    }).join('');
  }

  async function refreshUtilityGraphMemoDialog(root) {
    const state = root.__utilityGraphMemoState || {};
    const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
    if (!dialog || dialog.hidden) return;
    const teamSelect = dialog.querySelector('[data-role="utility-graph-memo-team"]');
    const metricSelect = dialog.querySelector('[data-role="utility-graph-memo-metric"]');
    state.teamKey = normalizeUtilityGraphMemoOption(teamSelect?.value, memoTeamOptions, state.defaultTeam || memoTeamOptions[0].key);
    state.metricKey = normalizeUtilityGraphMemoOption(metricSelect?.value, memoMetricOptions, state.defaultMetric || memoMetricOptions[0].key);
    if (teamSelect) teamSelect.value = state.teamKey;
    if (metricSelect) metricSelect.value = state.metricKey;

    const sequence = (Number(state.sequence || 0) || 0) + 1;
    state.sequence = sequence;
    setUtilityGraphMemoCandidateMessage(root);
    const adapter = global?.KpiUtilRuntimeBrowserAdapter;
    if (!state.monthKey || typeof adapter?.buildReportDeckMemoCandidates !== 'function') {
      setUtilityGraphMemoCandidateMessage(root);
      return;
    }
    try {
      const result = await adapter.buildReportDeckMemoCandidates(state.monthKey, {
        teamKey: state.teamKey,
        metricKey: state.metricKey,
        memoKey: state.key,
        store: state.store || null
      });
      if (state.sequence !== sequence) return;
      if (result?.ok !== true) {
        setUtilityGraphMemoCandidateMessage(root);
        return;
      }
      renderUtilityGraphMemoCandidates(root, result.candidates || []);
    } catch (error) {
      void error;
      if (state.sequence === sequence) {
        setUtilityGraphMemoCandidateMessage(root);
      }
    }
  }

  function setUtilityGraphMemoLines(root, lines = [], options = {}) {
    const state = root.__utilityGraphMemoState || {};
    state.lines = (Array.isArray(lines) ? lines : [])
      .map(line => String(line || '').trim())
      .filter(Boolean);
    renderUtilityGraphMemoContent(root);
    if (options.syncDialog !== false) renderUtilityGraphMemoDialogLines(root);
    root.dispatchEvent?.(new CustomEvent('utility-graph-memo-change', {
      bubbles: true,
      detail: {
        key: state.key || '',
        monthKey: state.monthKey || '',
        text: state.lines.join('\n')
      }
    }));
    scheduleUtilityGraphMemoChange(root);
  }

  function scheduleUtilityGraphMemoChange(root) {
    const state = root.__utilityGraphMemoState || {};
    if (typeof state.onChange !== 'function') return;
    const text = Array.isArray(state.lines) ? state.lines.join('\n') : '';
    if (state.changeTimer && typeof global?.clearTimeout === 'function') {
      global.clearTimeout(state.changeTimer);
    }
    const run = () => {
      state.changeTimer = null;
      Promise.resolve(state.onChange(text, {
        key: state.key || '',
        monthKey: state.monthKey || ''
      })).catch(() => {});
    };
    if (typeof global?.setTimeout === 'function') {
      state.changeTimer = global.setTimeout(run, 350);
    } else {
      run();
    }
  }

  function appendUtilityGraphMemoLines(root, addedLines = []) {
    const state = root.__utilityGraphMemoState || {};
    const currentLines = Array.isArray(state.lines) ? state.lines : [];
    const nextLines = currentLines.concat(
      (Array.isArray(addedLines) ? addedLines : [])
        .map(line => String(line || '').trim())
        .filter(Boolean)
    );
    setUtilityGraphMemoLines(root, nextLines);
  }

  function openUtilityGraphMemoDialog(root) {
    const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
    if (!dialog) return;
    syncUtilityGraphMemoDialogOptions(root);
    renderUtilityGraphMemoDialogLines(root);
    const manualInput = dialog.querySelector('[data-role="utility-graph-memo-manual-input"]');
    if (manualInput) manualInput.value = '';
    dialog.hidden = false;
    void refreshUtilityGraphMemoDialog(root);
    dialog.querySelector('[data-role="utility-graph-memo-team"]')?.focus?.();
  }

  function closeUtilityGraphMemoDialog(root) {
    const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
    if (dialog) dialog.hidden = true;
  }

  function getUtilityGraphMemoOverviewDialog(root) {
    return root?.querySelector?.('[data-role="utility-graph-memo-overview-dialog"]') || null;
  }

  function emitUtilityGraphMemoOverviewState(root, open) {
    root?.dispatchEvent?.(new CustomEvent('utility-graph-memo-overview-state', {
      bubbles: true,
      detail: { open: open === true }
    }));
  }

  function closeUtilityGraphMemoOverviewDialog(root) {
    const dialog = getUtilityGraphMemoOverviewDialog(root);
    if (!dialog) return;
    dialog.hidden = true;
    delete dialog.dataset.utilityGraphMemoOverviewSequence;
    emitUtilityGraphMemoOverviewState(root, false);
  }

  function setUtilityGraphMemoOverviewMessage(root, message) {
    const list = root?.querySelector?.('[data-role="utility-graph-memo-overview-list"]');
    if (!list) return;
    list.innerHTML = `<div class="report-memo-overview-empty">${escapeHtml(message)}</div>`;
  }

  function renderUtilityGraphMemoOverviewDialog(root, groups = []) {
    const list = root?.querySelector?.('[data-role="utility-graph-memo-overview-list"]');
    if (!list) return;
    const normalizedGroups = (Array.isArray(groups) ? groups : [])
      .map(group => ({
        ...group,
        candidates: Array.isArray(group?.candidates) ? group.candidates : []
      }))
      .filter(group => group.candidates.length);
    if (!normalizedGroups.length) {
      setUtilityGraphMemoOverviewMessage(root, '해당 월에 확인 가능한 특이사항 항목이 없습니다.');
      return;
    }
    list.innerHTML = normalizedGroups.map(group => (
      `<section class="report-memo-overview-group" data-utility-graph-memo-overview-group="${escapeHtml(group.key || '')}">`
        + `<h3 class="report-memo-overview-group-title">${escapeHtml(group.label || '')}</h3>`
        + '<div class="report-memo-overview-rows">'
        + group.candidates.map(candidate => {
          const direction = String(candidate?.direction || 'flat').trim() || 'flat';
          const metricLabel = String(candidate?.metricLabel || '').trim();
          return `<div class="report-memo-overview-row is-${escapeHtml(direction)}">`
            + `<span class="report-memo-overview-row-label">${escapeHtml(metricLabel)}</span>`
            + `<span class="report-memo-overview-row-text">${renderUtilityGraphMemoLineHtml(candidate?.text || '')}</span>`
          + '</div>';
        }).join('')
        + '</div>'
      + '</section>'
    )).join('');
  }

  async function openUtilityGraphMemoOverviewDialog(root) {
    const dialog = getUtilityGraphMemoOverviewDialog(root);
    const state = root.__utilityGraphMemoState || {};
    if (!dialog) return false;
    dialog.hidden = false;
    emitUtilityGraphMemoOverviewState(root, true);
    dialog.dataset.utilityGraphMemoOverviewSequence = String((Number(dialog.dataset.utilityGraphMemoOverviewSequence || '0') || 0) + 1);
    const sequence = dialog.dataset.utilityGraphMemoOverviewSequence;
    setUtilityGraphMemoOverviewMessage(root, '특이사항 항목을 불러오는 중입니다.');
    const adapter = global?.KpiUtilRuntimeBrowserAdapter;
    if (!state.monthKey || typeof adapter?.buildReportDeckMemoOverview !== 'function') {
      setUtilityGraphMemoOverviewMessage(root, '보고서 월 데이터가 준비되지 않았습니다.');
      return true;
    }
    const cacheKey = String(state.monthKey || '').trim();
    if (cacheKey && state.overviewCache instanceof Map && state.overviewCache.has(cacheKey)) {
      renderUtilityGraphMemoOverviewDialog(root, state.overviewCache.get(cacheKey)?.groups || []);
      return true;
    }
    try {
      const result = await adapter.buildReportDeckMemoOverview(state.monthKey, {
        store: state.store || null
      });
      if (dialog.dataset.utilityGraphMemoOverviewSequence !== sequence) return true;
      if (result?.ok !== true) {
        setUtilityGraphMemoOverviewMessage(root, '특이사항 항목을 불러올 수 없습니다.');
        return true;
      }
      if (cacheKey && state.overviewCache instanceof Map) {
        state.overviewCache.set(cacheKey, {
          groups: Array.isArray(result.groups) ? result.groups : []
        });
      }
      renderUtilityGraphMemoOverviewDialog(root, result.groups || []);
    } catch (error) {
      void error;
      if (dialog.dataset.utilityGraphMemoOverviewSequence === sequence) {
        setUtilityGraphMemoOverviewMessage(root, '특이사항 항목을 불러오지 못했습니다.');
      }
    }
    return true;
  }

  function toggleUtilityGraphMemoOverviewDialog(root) {
    const dialog = getUtilityGraphMemoOverviewDialog(root);
    if (!dialog) return false;
    if (!dialog.hidden) {
      closeUtilityGraphMemoOverviewDialog(root);
      return true;
    }
    void openUtilityGraphMemoOverviewDialog(root);
    return true;
  }

  function bindUtilityGraphMemo(root) {
    if (!root || root.__utilityGraphMemoBound) return;
    root.__utilityGraphMemoBound = true;
    root.addEventListener('utility-graph-memo-overview-toggle', event => {
      event.preventDefault?.();
      toggleUtilityGraphMemoOverviewDialog(root);
    });
    root.addEventListener('click', event => {
      const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
      const overviewDialog = getUtilityGraphMemoOverviewDialog(root);
      const overviewCloseButton = event.target?.closest?.('[data-role="utility-graph-memo-overview-close"]');
      if (overviewCloseButton) {
        event.preventDefault();
        closeUtilityGraphMemoOverviewDialog(root);
        return;
      }

      if (overviewDialog && !overviewDialog.hidden && event.target === overviewDialog) {
        event.preventDefault();
        closeUtilityGraphMemoOverviewDialog(root);
        return;
      }

      const addButton = event.target?.closest?.('[data-role="utility-graph-memo-add"]');
      if (addButton) {
        event.preventDefault();
        openUtilityGraphMemoDialog(root);
        return;
      }

      const closeButton = event.target?.closest?.('[data-role="utility-graph-memo-close"]');
      if (closeButton) {
        event.preventDefault();
        closeUtilityGraphMemoDialog(root);
        return;
      }

      const clearButton = event.target?.closest?.('[data-role="utility-graph-memo-clear"]');
      if (clearButton) {
        event.preventDefault();
        setUtilityGraphMemoLines(root, []);
        return;
      }

      const manualAddButton = event.target?.closest?.('[data-role="utility-graph-memo-manual-add"]');
      if (manualAddButton) {
        event.preventDefault();
        const input = dialog?.querySelector?.('[data-role="utility-graph-memo-manual-input"]');
        const lines = getUtilityGraphMemoLines(input?.value || '');
        if (lines.length) {
          appendUtilityGraphMemoLines(root, lines);
          if (input) input.value = '';
        }
        return;
      }

      const deleteButton = event.target?.closest?.('[data-role="utility-graph-memo-delete-line"], [data-role="utility-graph-memo-dialog-delete-line"]');
      if (deleteButton) {
        event.preventDefault();
        const state = root.__utilityGraphMemoState || {};
        const index = Number.parseInt(String(deleteButton.dataset.utilityGraphMemoDeleteLine || ''), 10);
        const lines = Array.isArray(state.lines) ? state.lines.slice() : [];
        if (Number.isInteger(index) && index >= 0 && index < lines.length) {
          lines.splice(index, 1);
          setUtilityGraphMemoLines(root, lines);
        }
        return;
      }

      const candidateButton = event.target?.closest?.('[data-role="utility-graph-memo-candidate"]');
      if (candidateButton) {
        event.preventDefault();
        const state = root.__utilityGraphMemoState || {};
        const index = Number.parseInt(String(candidateButton.dataset.utilityGraphMemoCandidate || ''), 10);
        const candidate = Array.isArray(state.candidates) ? state.candidates[index] : null;
        if (candidate?.text) appendUtilityGraphMemoLines(root, [candidate.text]);
        return;
      }

      const noteBox = event.target?.closest?.('[data-role="utility-graph-note"]');
      if (noteBox) {
        event.preventDefault();
        openUtilityGraphMemoDialog(root);
        return;
      }

      if (dialog && !dialog.hidden && !event.target?.closest?.('[data-role="utility-graph-memo-dialog"]')) {
        closeUtilityGraphMemoDialog(root);
      }
    });

    root.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const overviewDialog = getUtilityGraphMemoOverviewDialog(root);
      if (overviewDialog && !overviewDialog.hidden) {
        event.preventDefault();
        closeUtilityGraphMemoOverviewDialog(root);
        return;
      }
      const dialog = root.querySelector('[data-role="utility-graph-memo-dialog"]');
      if (!dialog || dialog.hidden) return;
      event.preventDefault();
      closeUtilityGraphMemoDialog(root);
    });

    root.addEventListener('input', event => {
      const selector = event.target?.closest?.('[data-role="utility-graph-memo-team"], [data-role="utility-graph-memo-metric"]');
      if (selector) {
        void refreshUtilityGraphMemoDialog(root);
        return;
      }
      const lineInput = event.target?.closest?.('[data-role="utility-graph-memo-line-input"]');
      if (lineInput) {
        const state = root.__utilityGraphMemoState || {};
        const index = Number.parseInt(String(lineInput.dataset.utilityGraphMemoLineInput || ''), 10);
        const lines = Array.isArray(state.lines) ? state.lines.slice() : [];
        if (Number.isInteger(index) && index >= 0) {
          lines[index] = String(lineInput.value || '');
          setUtilityGraphMemoLines(root, lines, { syncDialog: false });
        }
      }
    });

    root.addEventListener('change', event => {
      const selector = event.target?.closest?.('[data-role="utility-graph-memo-team"], [data-role="utility-graph-memo-metric"]');
      if (selector) void refreshUtilityGraphMemoDialog(root);
    });
  }

  function renderUtilityGraphMemo(root, data) {
    const memo = data.memo && typeof data.memo === 'object' ? data.memo : {};
    const key = String(memo.key || 'utilityGraphMemo').trim() || 'utilityGraphMemo';
    root.__utilityGraphMemoState = {
      key,
      monthKey: String(memo.monthKey || '').trim(),
      defaultTeam: normalizeUtilityGraphMemoOption(memo.defaultTeam, memoTeamOptions, 'team_01_02'),
      defaultMetric: normalizeUtilityGraphMemoOption(memo.defaultMetric, memoMetricOptions, 'electric_unit'),
      teamKey: normalizeUtilityGraphMemoOption(memo.defaultTeam, memoTeamOptions, 'team_01_02'),
      metricKey: normalizeUtilityGraphMemoOption(memo.defaultMetric, memoMetricOptions, 'electric_unit'),
      store: memo.store || null,
      onChange: typeof memo.onChange === 'function' ? memo.onChange : null,
      lines: getUtilityGraphMemoLines(data.remark || ''),
      candidates: [],
      overviewCache: new Map(),
      sequence: 0
    };
    const note = root.querySelector('[data-role="utility-graph-note"]');
    if (note) {
      note.dataset.reportMemoKey = key;
      note.dataset.reportMemoDefaultTeam = root.__utilityGraphMemoState.defaultTeam;
      note.dataset.reportMemoDefaultMetric = root.__utilityGraphMemoState.defaultMetric;
    }
    closeUtilityGraphMemoDialog(root);
    closeUtilityGraphMemoOverviewDialog(root);
    renderUtilityGraphMemoContent(root);
    bindUtilityGraphMemo(root);
  }

  function renderAxisLabel(node, label) {
    if (!node) return;
    node.innerHTML = String(label || '')
      .split('')
      .map(char => `<span>${escapeHtml(char)}</span>`)
      .join('');
  }

  function renderLegend(node, labels) {
    if (!node) return;
    node.innerHTML = `
      <div class="legend-item">
        <span class="legend-bar"></span>
        <span>${escapeHtml(labels.usage || '사용량')}<br>(${escapeHtml(labels.usageUnit || '')})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line legend-line-blue"><i></i></span>
        <span>${escapeHtml(labels.amount || '금액')}<br>(${escapeHtml(labels.amountUnit || '')})</span>
      </div>
      <div class="legend-item">
        <span class="legend-line legend-line-red"><i></i></span>
        <span>${escapeHtml(labels.production || '생산량')}<br>(${escapeHtml(labels.productionUnit || '')})</span>
      </div>
    `;
  }

  function normalizeTopSeries(series) {
    return {
      usage: series.usage ?? series.electricityKwh ?? null,
      amount: series.amount ?? series.amountKrw ?? null,
      production: series.production ?? series.productionKg ?? null
    };
  }

  function buildTopTrendScales(layout, seriesMap) {
    const plotTop = layout.y + 28;
    const plotBottom = layout.y + layout.h - 10;
    const plotHeight = Math.max(1, plotBottom - plotTop);
    const bandHeight = Math.max(42, plotHeight * 0.42);
    const centers = {
      production: plotTop + plotHeight * 0.22,
      amount: plotTop + plotHeight * 0.52,
      usage: plotTop + plotHeight * 0.82
    };

    return Object.fromEntries(Object.entries(seriesMap).map(([key, values]) => {
      const band = buildTopTrendBand(centers[key], bandHeight, layout);
      return [key, buildTopTrendScale(values, band)];
    }));
  }

  function buildTopTrendBand(centerY, height, layout) {
    const minTop = layout.y + 8;
    const maxTop = layout.y + layout.h - height;
    const y = Math.max(minTop, Math.min(maxTop, centerY - height / 2));
    return {
      y,
      h: height,
      baseY: y + height
    };
  }

  function buildTopTrendScale(values, band) {
    const domain = getTrendDomain(values);
    const span = domain.max - domain.min;
    return {
      ...band,
      domain,
      yFor(value) {
        const ratio = span > 0 ? (value - domain.min) / span : 0.5;
        return band.y + band.h - Math.max(0, Math.min(1, ratio)) * band.h;
      }
    };
  }

  function getTopTrendLabelBounds(scale, layout) {
    if (!scale) {
      return {
        minY: layout.y + 8,
        maxY: layout.y + layout.h - 8
      };
    }
    return {
      minY: scale.y,
      maxY: scale.baseY
    };
  }

  function getTrendDomain(values) {
    const finiteValues = (Array.isArray(values) ? values : []).filter(isFiniteNumber);
    if (!finiteValues.length) return { min: 0, max: 1 };

    const finiteMin = Math.min(...finiteValues);
    const finiteMax = Math.max(...finiteValues);
    const magnitude = Math.max(Math.abs(finiteMin), Math.abs(finiteMax), 1);
    const finiteRange = Math.max(finiteMax - finiteMin, magnitude * 0.04, 1);
    const min = Math.max(0, finiteMin - finiteRange * 0.28);
    const max = Math.max(min + finiteRange * 0.7, finiteMax + finiteRange * 0.42);

    return { min, max };
  }

  function drawTopChart(svg, months, series, options, labels, title = '') {
    if (!svg) return;
    clearSvg(svg);
    setViewBox(svg, 0, 0, 1098, 320);

    const edgeInset = 1098 / 25 / 2;
    const layout = { x: edgeInset, y: 28, w: 1098 - edgeInset * 2, h: 242, bottom: 270 };
    const usage = normalizeSeries(series.usage, months);
    const amount = normalizeSeries(series.amount, months);
    const production = normalizeSeries(series.production, months);
    const autoScale = options.autoScale === true;
    const trendScales = autoScale
      ? buildTopTrendScales(layout, { usage, amount, production })
      : null;
    const leftMax = autoScale ? null : getPositiveAxisMax(options.leftAxisMax, amount, months, 10000000);
    const usageMax = autoScale ? null : getPositiveAxisMax(options.usageAxisMax || options.rightAxisMax, usage, months, 200000);
    const productionMax = autoScale ? null : getPositiveAxisMax(options.productionAxisMax || options.rightAxisMax, production, months, 200000);
    const xFor = i => layout.x + (months.length <= 1 ? layout.w / 2 : (layout.w / (months.length - 1)) * i);
    const yLeft = trendScales?.amount?.yFor || (value => layout.y + layout.h - (value / leftMax) * layout.h);
    const yUsage = trendScales?.usage?.yFor || (value => layout.y + layout.h - (value / usageMax) * layout.h);
    const yProduction = trendScales?.production?.yFor || (value => layout.y + layout.h - (value / productionMax) * layout.h);
    const labelBounds = {
      usage: getTopTrendLabelBounds(trendScales?.usage, layout),
      amount: getTopTrendLabelBounds(trendScales?.amount, layout),
      production: getTopTrendLabelBounds(trendScales?.production, layout)
    };

    addRect(svg, layout.x, layout.y, layout.w, layout.h, { fill: '#fff', stroke: 'none' });
    if (String(title || '').trim()) {
      addText(svg, 14, 20, String(title || '').trim(), 'utility-graph-title-in-chart', {
        'text-anchor': 'start'
      });
    }
    drawTopChartLegend(svg, layout, labels);

    addLine(svg, layout.x, layout.y + layout.h, layout.x + layout.w, layout.y + layout.h, 'svg-axis-line');

    const barW = 18;
    const usageBaseY = layout.y + layout.h;
    const deferredLabels = [];

    usage.forEach((value, i) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(i);
      const y = yUsage(value);
      addRect(svg, x - barW / 2, Math.min(y, usageBaseY), barW, Math.max(0, usageBaseY - y), {
        fill: 'var(--utility-graph-yellow)',
        stroke: 'none'
      });
      if (options.showDataLabels) {
        const labelText = comma(value);
        const labelY = getRankedSeriesLabelY(value, usage, y, {
          baseOffset: 6,
          spreadOffset: 8,
          minY: labelBounds.usage.minY,
          maxY: labelBounds.usage.maxY
        });
        deferredLabels.push({
          x,
          y: labelY,
          sourceY: y,
          minY: labelBounds.usage.minY,
          maxY: labelBounds.usage.maxY,
          seriesKey: 'usage',
          pointIndex: i,
          fontSize: 10.5,
          text: labelText,
          className: 'svg-data-label-black',
          attrs: {
            'text-anchor': 'middle'
          }
        });
      }
    });

    drawLineSeries(svg, amount, months, xFor, yLeft, {
      stroke: 'var(--utility-graph-blue)',
      strokeWidth: 3.2,
      marker: 'diamond',
      markerFill: 'var(--utility-graph-blue-dark)',
      markerSize: 6,
      labelClass: 'svg-data-label-blue',
      labelFormatter: comma,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 7,
      labelSpreadOffset: 8,
      labelMinY: labelBounds.amount.minY,
      labelMaxY: labelBounds.amount.maxY,
      showLabels: options.showDataLabels,
      edgeTextAnchors: false,
      seriesKey: 'amount',
      labelFontSize: 10.5,
      deferredLabels
    });

    drawLineSeries(svg, production, months, xFor, yProduction, {
      stroke: 'var(--utility-graph-red)',
      strokeWidth: 3.2,
      marker: 'triangle',
      markerFill: 'var(--utility-graph-red)',
      markerSize: 6,
      labelClass: 'svg-data-label-red',
      labelFormatter: comma,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 7,
      labelSpreadOffset: 8,
      labelMinY: labelBounds.production.minY,
      labelMaxY: labelBounds.production.maxY,
      showLabels: options.showDataLabels,
      edgeTextAnchors: false,
      seriesKey: 'production',
      labelFontSize: 10.5,
      deferredLabels
    });

    drawDeferredLabels(svg, resolveDeferredLabelCollisions(deferredLabels));

    months.forEach((month, i) => {
      addText(svg, xFor(i), layout.y + layout.h + 18, month.label || month.key, 'report-auto-chart-month', {
        'text-anchor': 'middle'
      });
    });

    svg.setAttribute('aria-label', `${title ? `${title} ` : ''}${labels.usage || '사용량'}, ${labels.amount || '금액'}, ${labels.production || '생산량'} 복합 차트`);
  }

  function drawTopChartLegend(svg, layout, labels) {
    const items = [
      {
        type: 'bar',
        color: 'var(--utility-graph-yellow)',
        label: `${labels.usage || '사용량'} (${labels.usageUnit || ''})`,
        width: 176
      },
      {
        type: 'line',
        color: 'var(--utility-graph-blue)',
        marker: 'diamond',
        label: `${labels.amount || '금액'} (${labels.amountUnit || ''})`,
        width: 162
      },
      {
        type: 'line',
        color: 'var(--utility-graph-red)',
        marker: 'triangle',
        label: `${labels.production || '생산량'} (${labels.productionUnit || ''})`,
        width: 190
      }
    ];
    const totalWidth = items.reduce((sum, item) => sum + item.width, 0);
    let x = layout.x + Math.max(0, (layout.w - totalWidth) / 2);
    const y = 20;

    items.forEach(item => {
      if (item.type === 'bar') {
        addRect(svg, x, y - 5, 30, 7, { fill: item.color, stroke: 'none' });
      } else {
        addLine(svg, x, y, x + 30, y, '', {
          stroke: item.color,
          'stroke-width': 3,
          'stroke-linecap': 'round'
        });
        drawMarker(svg, x + 15, y, item.marker, item.color, 5);
      }
      addText(svg, x + 38, y + 5, item.label, 'report-auto-chart-legend', {
        'text-anchor': 'start'
      });
      x += item.width;
    });
  }

  function renderUnitCostTable(table, months, labels) {
    if (!table) return;
    table.innerHTML = '';
    const colgroup = document.createElement('colgroup');
    colgroup.innerHTML = months.map(() => '<col />').join('');
    table.appendChild(colgroup);

    const groups = groupByConsecutiveYear(months);
    const thead = document.createElement('thead');
    const yearRow = document.createElement('tr');
    groups.forEach(group => {
      const th = document.createElement('th');
      th.className = 'year-head';
      th.colSpan = group.count;
      th.textContent = `${group.year}년`;
      yearRow.appendChild(th);
    });

    thead.appendChild(yearRow);

    const monthRow = document.createElement('tr');
    months.forEach(month => {
      const th = document.createElement('th');
      th.className = `month-head${month.highlight ? ' highlight' : ''}`;
      th.textContent = month.monthLabel || `${month.month}월`;
      monthRow.appendChild(th);
    });
    thead.appendChild(monthRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const valueRow = document.createElement('tr');
    const rowLabel = document.createElement('th');
    rowLabel.className = 'row-label';
    rowLabel.innerHTML = labels.tableRow || `${escapeHtml(labels.ratio || '원단위')}<br>(${escapeHtml(labels.ratioUnit || '')})`;
    void rowLabel;

    months.forEach(month => {
      const td = document.createElement('td');
      td.className = `data-cell${month.highlight ? ' highlight' : ''}`;
      td.textContent = formatUnitCost(month.value);
      valueRow.appendChild(td);
    });

    tbody.appendChild(valueRow);
    table.appendChild(tbody);
  }

  function drawBottomChart(svg, months, series, options, labels) {
    if (!svg) return;
    clearSvg(svg);
    setViewBox(svg, 0, 0, 1098, 252);

    const layout = { x: 0, y: 18, w: 1098, h: 204 };
    const values = normalizeSeries(series, months);
    const finiteValues = values.filter(isFiniteNumber);
    const finiteMin = finiteValues.length ? Math.min(...finiteValues) : 0;
    const finiteMax = finiteValues.length ? Math.max(...finiteValues) : 0;
    const finiteRange = Math.max(finiteMax - finiteMin, Math.abs(finiteMax) * 0.18, 0.06);
    const yMin = Number.isFinite(options.yMin)
      ? options.yMin
      : Math.max(0, finiteMin - finiteRange * 0.28);
    const yMax = Number.isFinite(options.yMax) && options.yMax > yMin
      ? options.yMax
      : Math.max(yMin + 0.08, finiteMax + finiteRange * 0.42);
    const monthW = months.length ? layout.w / months.length : layout.w;
    const xFor = i => layout.x + (months.length <= 1 ? layout.w / 2 : monthW * (i + 0.5));
    const yFor = value => layout.y + layout.h - ((value - yMin) / (yMax - yMin)) * layout.h;

    addRect(svg, layout.x, layout.y, layout.w, layout.h, { fill: '#fff', stroke: 'none' });
    drawBottomChartInlineLabel(svg, labels, layout);
    addLine(svg, layout.x, layout.y + layout.h, layout.x + layout.w, layout.y + layout.h, 'report-auto-chart-axis');

    const deferredLabels = [];
    drawLineSeries(svg, values, months, xFor, yFor, {
      stroke: '#111827',
      strokeWidth: 3.2,
      marker: 'circle',
      markerFill: '#111827',
      labelClass: 'report-auto-chart-label',
      labelAttrs: { fill: '#111827' },
      labelFormatter: formatUnitCost,
      labelPlacement: 'ranked-above',
      labelBaseOffset: 6,
      labelSpreadOffset: 8,
      labelMinY: layout.y + 12,
      labelMaxY: layout.y + layout.h - 8,
      showLabels: options.showDataLabels,
      markerSize: 4,
      seriesKey: 'ratio',
      labelFontSize: 10.2,
      deferredLabels
    });

    drawComparisonArrows(svg, months, values, xFor, yFor, options.comparisonKeys || []);
    drawDeferredLabels(svg, resolveDeferredLabelCollisions(deferredLabels));

    months.forEach((month, i) => {
      addText(svg, xFor(i), layout.y + layout.h + 10, month.monthLabel || `${month.month}월`, 'report-auto-chart-month report-auto-chart-bottom-month', {
        'text-anchor': i === 0 ? 'start' : (i === months.length - 1 ? 'end' : 'middle')
      });
    });

    svg.setAttribute('aria-label', `${labels.ratio || '원단위'} 추이`);
  }

  function drawBottomChartInlineLabel(svg, labels, layout) {
    const site = String(labels.site || '').trim();
    const ratio = String(labels.ratio || '').trim();
    const unit = String(labels.ratioUnit || '').trim();
    const title = [site, ratio].filter(Boolean).join(' · ');
    if (!title && !unit) return;
    addText(svg, layout.x + 12, layout.y + 16, title, 'report-auto-chart-inline-label is-title', {
      'text-anchor': 'start'
    });
    if (unit) {
      addText(svg, layout.x + 12, layout.y + 30, `(${unit})`, 'report-auto-chart-inline-label is-unit', {
        'text-anchor': 'start'
      });
    }
  }

  function renderBottomChart(root, data) {
    const svg = root.querySelector('[data-role="utility-graph-bottom-chart"]');
    const reportHost = root.querySelector('[data-role="utility-graph-bottom-chart-report"]');
    if (reportHost) {
      reportHost.innerHTML = '';
      reportHost.hidden = true;
      reportHost.toggleAttribute('hidden', true);
    }
    if (svg) {
      svg.hidden = false;
      svg.toggleAttribute('hidden', false);
      svg.setAttribute('aria-hidden', 'false');
    }

    drawBottomChart(
      svg,
      data.bottomMonths || defaultTableMonths,
      data.bottomSeries,
      data.options?.bottom || emptyReportData.options.bottom,
      data.labels
    );
  }

  function drawComparisonArrows(svg, months, values, xFor, yFor, keys) {
    if (!keys.length) return;
    keys.forEach(key => {
      const index = months.findIndex(month => month.key === key);
      if (index < 0 || !isFiniteNumber(values[index])) return;
      const x = xFor(index);
      const targetY = yFor(values[index]);
      addCircle(svg, x, targetY, 6, {
        fill: 'none',
        stroke: 'var(--utility-graph-red)',
        'stroke-width': 2
      });
    });
  }

  function drawLineSeries(svg, values, months, xFor, yFor, config) {
    let d = '';
    let isOpen = false;

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) {
        isOpen = false;
        return;
      }
      const x = xFor(index);
      const y = yFor(value);
      d += `${isOpen ? ' L' : ' M'}${round(x)} ${round(y)}`;
      isOpen = true;
    });

    if (d.trim()) {
      const path = addPath(svg, d, {
        fill: 'none',
        stroke: config.stroke,
        'stroke-width': config.strokeWidth,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round'
      });
      if (config.dashed) path.setAttribute('stroke-dasharray', '7 5');
    }

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(index);
      const y = yFor(value);
      drawMarker(svg, x, y, config.marker, config.markerFill, config.markerSize);
    });

    values.forEach((value, index) => {
      if (!isFiniteNumber(value)) return;
      const x = xFor(index);
      const y = yFor(value);
      if (config.showLabels) {
        const labelText = config.labelFormatter(value);
        const labelY = config.labelPlacement === 'ranked-above'
          ? getRankedSeriesLabelY(value, values, y, {
              baseOffset: config.labelBaseOffset,
              spreadOffset: config.labelSpreadOffset,
              minY: config.labelMinY,
              maxY: config.labelMaxY
            })
          : placeDistributedLabelY(x, y, labelText, {
              offsets: rotateLabelOffsets(
                Array.isArray(config.labelOffsets) && config.labelOffsets.length
                  ? config.labelOffsets
                  : [config.labelDy || 0],
                index
              ),
              minY: config.labelMinY,
              maxY: config.labelMaxY,
              placedLabels: config.placedLabels,
              fontSize: 11
            });
        const attrs = {
          'text-anchor': config.edgeTextAnchors ? getChartEdgeTextAnchor(index, months.length) : 'middle',
          ...(config.labelAttrs || {})
        };
        if (Array.isArray(config.deferredLabels)) {
          config.deferredLabels.push({
            x,
            y: labelY,
            sourceY: y,
            minY: config.labelMinY,
            maxY: config.labelMaxY,
            seriesKey: config.seriesKey || '',
            pointIndex: index,
            fontSize: config.labelFontSize || 11,
            text: labelText,
            className: config.labelClass,
            attrs
          });
        } else {
          addText(svg, x, labelY, labelText, config.labelClass, attrs);
        }
      }
    });
  }

  function drawDeferredLabels(svg, labels) {
    if (!svg || !Array.isArray(labels)) return;
    labels.forEach(label => {
      addText(svg, label.x, label.y, label.text, label.className, label.attrs || {});
    });
  }

  function resolveDeferredLabelCollisions(labels) {
    if (!Array.isArray(labels) || labels.length <= 1) return labels || [];

    const placed = [];
    return labels.map(label => {
      if (!label || !isFiniteNumber(label.x) || !isFiniteNumber(label.y)) return label;
      const sourceY = isFiniteNumber(label.sourceY) ? label.sourceY : label.y;
      const minY = isFiniteNumber(label.minY) ? label.minY : 0;
      const maxY = isFiniteNumber(label.maxY) ? label.maxY : 9999;
      const fontSize = isFiniteNumber(label.fontSize) ? label.fontSize : 11;
      const candidates = buildLabelCollisionCandidates(label.y, sourceY, minY, maxY);
      const blockers = placed.filter(placedLabel =>
        placedLabel &&
        placedLabel.seriesKey !== label.seriesKey
      );
      const chosenY = chooseNonOverlappingLabelY(label.x, label.text, fontSize, candidates, blockers, sourceY, label.attrs);
      const placedLabel = {
        ...label,
        y: chosenY,
        box: buildLabelBox(label.x, chosenY, label.text, fontSize, label.attrs),
        seriesKey: label.seriesKey,
        pointIndex: label.pointIndex
      };
      placed.push(placedLabel);
      return placedLabel;
    });
  }

  function buildLabelCollisionCandidates(currentY, sourceY, minY, maxY) {
    const offsets = [
      currentY - sourceY,
      -4,
      -10,
      -17,
      -25,
      10,
      18,
      27,
      -34,
      36
    ];
    return Array.from(new Set(offsets
      .map(offset => round(clampLabelY(sourceY + offset, minY, maxY)))
      .concat([round(clampLabelY(currentY, minY, maxY))])));
  }

  function chooseNonOverlappingLabelY(x, text, fontSize, candidates, blockers, sourceY, attrs = {}) {
    let best = null;
    for (const candidateY of candidates) {
      const box = buildLabelBox(x, candidateY, text, fontSize, attrs);
      const overlapScore = getLabelOverlapScore(box, blockers.map(blocker => blocker.box).filter(Boolean));
      const distanceScore = Math.abs(candidateY - sourceY) / 1000;
      const aboveMarkerScore = candidateY <= sourceY ? 0 : 0.08;
      const score = overlapScore + distanceScore + aboveMarkerScore;
      if (overlapScore <= 0) return candidateY;
      if (!best || score < best.score) best = { y: candidateY, score };
    }
    return best?.y ?? candidates[0] ?? sourceY;
  }

  function getChartEdgeTextAnchor(index, total) {
    if (index === 0) return 'start';
    if (index === total - 1) return 'end';
    return 'middle';
  }

  function getRankedSeriesLabelY(value, values, sourceY, options = {}) {
    const rank = getSeriesValueRank(value, values);
    const baseOffset = Number.isFinite(Number(options.baseOffset)) ? Number(options.baseOffset) : 7;
    const spreadOffset = Number.isFinite(Number(options.spreadOffset)) ? Number(options.spreadOffset) : 8;
    return clampLabelY(sourceY - (baseOffset + spreadOffset * rank), options.minY, options.maxY);
  }

  function getSeriesValueRank(value, values) {
    if (!isFiniteNumber(value)) return 0;
    const finiteValues = (Array.isArray(values) ? values : []).filter(isFiniteNumber);
    if (!finiteValues.length) return 0;
    const min = Math.min(...finiteValues);
    const max = Math.max(...finiteValues);
    if (max <= min) return 0.5;
    return (value - min) / (max - min);
  }

  function rotateLabelOffsets(offsets, index) {
    if (!Array.isArray(offsets) || offsets.length <= 1) return offsets || [0];
    const start = index % offsets.length;
    return offsets.slice(start).concat(offsets.slice(0, start));
  }

  function placeDistributedLabelY(x, sourceY, text, options = {}) {
    const placedLabels = Array.isArray(options.placedLabels) ? options.placedLabels : null;
    const offsets = Array.isArray(options.offsets) && options.offsets.length ? options.offsets : [0];
    const fontSize = Number.isFinite(Number(options.fontSize)) ? Number(options.fontSize) : 11;
    const candidates = offsets
      .concat(offsets.map(offset => offset + (offset >= 0 ? 18 : -18)))
      .map(offset => clampLabelY(sourceY + offset, options.minY, options.maxY));
    const uniqueCandidates = Array.from(new Set(candidates.map(value => round(value))));
    const fallbackY = uniqueCandidates[0] ?? clampLabelY(sourceY, options.minY, options.maxY);

    if (!placedLabels) return fallbackY;

    let best = null;
    for (const candidateY of uniqueCandidates) {
      const box = buildLabelBox(x, candidateY, text, fontSize);
      const overlapScore = getLabelOverlapScore(box, placedLabels);
      const score = overlapScore + (Math.abs(candidateY - sourceY) / 1000);
      if (overlapScore <= 0) {
        placedLabels.push(box);
        return candidateY;
      }
      if (!best || score < best.score) best = { y: candidateY, box, score };
    }

    const chosen = best || { y: fallbackY, box: buildLabelBox(x, fallbackY, text, fontSize) };
    placedLabels.push(chosen.box);
    return chosen.y;
  }

  function buildLabelBox(x, y, text, fontSize = 11, attrs = {}) {
    const width = Math.max(24, String(text || '').length * fontSize * 0.62);
    const height = fontSize + 5;
    const anchor = attrs?.['text-anchor'] || 'middle';
    const left = anchor === 'start'
      ? x - 3
      : anchor === 'end'
        ? x - width - 3
        : x - width / 2 - 3;
    const right = anchor === 'start'
      ? x + width + 3
      : anchor === 'end'
        ? x + 3
        : x + width / 2 + 3;
    return {
      left,
      right,
      top: y - height + 2,
      bottom: y + 4
    };
  }

  function getLabelOverlapScore(box, placedLabels) {
    return placedLabels.reduce((score, placed) => {
      const xOverlap = Math.max(0, Math.min(box.right, placed.right) - Math.max(box.left, placed.left));
      const yOverlap = Math.max(0, Math.min(box.bottom, placed.bottom) - Math.max(box.top, placed.top));
      return score + (xOverlap * yOverlap);
    }, 0);
  }

  function drawMarker(svg, x, y, type, fill, size = 5) {
    if (type === 'diamond') {
      addPolygon(svg, `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`, { fill });
      return;
    }
    if (type === 'triangle') {
      addPolygon(svg, `${x},${y - size - 1} ${x + size + 1},${y + size} ${x - size - 1},${y + size}`, { fill });
      return;
    }
    addCircle(svg, x, y, size, { fill });
  }

  function normalizeSeries(series, months) {
    if (!series) return months.map(() => null);
    if (Array.isArray(series)) {
      if (series.length && typeof series[0] === 'object' && series[0] !== null) {
        const map = Object.fromEntries(series.map(row => [row.key, row.value]));
        return months.map((month, index) => valueOrNull(map[month.key] ?? rowValue(series[index])));
      }
      return months.map((_, index) => valueOrNull(series[index]));
    }
    if (typeof series === 'object') {
      return months.map(month => valueOrNull(series[month.key]));
    }
    return months.map(() => null);
  }

  function rowValue(row) {
    if (!row || typeof row !== 'object') return null;
    return row.value;
  }

  function buildMonths(startKey, endKey) {
    const [startYear, startMonth] = startKey.split('-').map(Number);
    const [endYear, endMonth] = endKey.split('-').map(Number);
    const result = [];
    let year = startYear;
    let month = startMonth;
    while (year < endYear || (year === endYear && month <= endMonth)) {
      result.push({
        key: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        monthLabel: `${month}월`,
        label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
      });
      month += 1;
      if (month > 12) {
        year += 1;
        month = 1;
      }
    }
    return result;
  }

  function groupByConsecutiveYear(months) {
    const groups = [];
    months.forEach(month => {
      const last = groups[groups.length - 1];
      if (last && last.year === month.year) {
        last.count += 1;
      } else {
        groups.push({ year: month.year, count: 1 });
      }
    });
    return groups;
  }

  function getPositiveAxisMax(configuredMax, series, months, fallbackStep) {
    if (Number.isFinite(configuredMax) && configuredMax > 0) return configuredMax;
    const values = normalizeSeries(series, months).filter(isFiniteNumber);
    const maxValue = Math.max(...values, 0);
    if (maxValue <= 0) return fallbackStep;
    return getNiceAxisMax(maxValue);
  }

  function getNiceAxisMax(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    return getNiceNumber(numeric * 1.15);
  }

  function getNiceNumber(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1;
    const exponent = Math.floor(Math.log10(numeric));
    const base = 10 ** exponent;
    const fraction = numeric / base;
    let niceFraction = 10;
    if (fraction <= 1) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 2.5) {
      niceFraction = 2.5;
    } else if (fraction <= 5) {
      niceFraction = 5;
    }
    return niceFraction * base;
  }

  function formatUnitCost(value) {
    return isFiniteNumber(value) ? Number(value).toFixed(3) : '';
  }

  function formatAxisDecimal(value) {
    if (!isFiniteNumber(value) || Math.abs(value) < 1e-10) return '-';
    return Number(value).toFixed(3).replace(/^0/, '');
  }

  function clampLabelY(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return value;
    const minValue = Number.isFinite(Number(min)) ? Number(min) + 8 : numeric;
    const maxValue = Number.isFinite(Number(max)) ? Number(max) - 8 : numeric;
    return Math.max(minValue, Math.min(maxValue, numeric));
  }

  function comma(value) {
    return isFiniteNumber(value) ? Math.round(value).toLocaleString('en-US') : '';
  }

  function valueOrNull(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function round(value) {
    return Math.round(value * 100) / 100;
  }

  function mergeReportData(base, next) {
    const merged = clone(base);
    Object.assign(merged, next);
    merged.labels = { ...base.labels, ...(next.labels || {}) };
    merged.options = {
      top: { ...base.options.top, ...(next.options?.top || {}) },
      bottom: { ...base.options.bottom, ...(next.options?.bottom || {}) }
    };
    merged.topSeries = { ...base.topSeries, ...(next.topSeries || {}) };

    if (Array.isArray(next.tableMonths)) {
      const baseMonths = next.replaceTableMonths === true ? [] : base.tableMonths;
      const overrideMap = new Map(next.tableMonths.map(month => [month.key, month]));
      merged.tableMonths = baseMonths.length
        ? baseMonths.map(month => ({ ...month, ...(overrideMap.get(month.key) || {}) }))
        : next.tableMonths;
    }
    if (Array.isArray(next.topMonths)) merged.topMonths = next.topMonths;
    if (Array.isArray(next.bottomMonths)) merged.bottomMonths = next.bottomMonths;

    return merged;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function setViewBox(svg, x, y, width, height) {
    svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  }

  function createSvgElement(tagName) {
    return global.document.createElementNS(NS, tagName);
  }

  function addLine(svg, x1, y1, x2, y2, className = '', attrs = {}) {
    const el = createSvgElement('line');
    Object.entries({ x1, y1, x2, y2, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    if (className) el.setAttribute('class', className);
    svg.appendChild(el);
    return el;
  }

  function addRect(svg, x, y, width, height, attrs = {}) {
    const el = createSvgElement('rect');
    Object.entries({ x, y, width, height, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addCircle(svg, cx, cy, r, attrs = {}) {
    const el = createSvgElement('circle');
    Object.entries({ cx, cy, r, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addPolygon(svg, points, attrs = {}) {
    const el = createSvgElement('polygon');
    Object.entries({ points, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addPath(svg, d, attrs = {}) {
    const el = createSvgElement('path');
    Object.entries({ d, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
    return el;
  }

  function addText(svg, x, y, text, className = '', attrs = {}) {
    const el = createSvgElement('text');
    Object.entries({ x, y, ...attrs }).forEach(([key, value]) => el.setAttribute(key, value));
    if (className) el.setAttribute('class', className);
    el.textContent = text;
    svg.appendChild(el);
    return el;
  }

  function escapeHtml(value = '') {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  if (!global) return;

  global.KpiUtilityGraphTemplate = {
    createEmptyData,
    mergeData: mergeReportData,
    render,
    buildMonths
  };

  if (global.document) {
    global.document.addEventListener('DOMContentLoaded', () => {
      const standalone = global.document.getElementById('energyReport');
      if (standalone) render(standalone, {});
    });
  }
})(this);
