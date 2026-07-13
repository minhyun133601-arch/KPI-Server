(function registerUtilityGraphTemplateMemo(global) {
  if (!global) return;
  const PARTS_KEY = Symbol.for('kpi.utilityGraphTemplate.parts');
  const parts = global[PARTS_KEY] || (global[PARTS_KEY] = Object.create(null));
  if (!Array.isArray(parts.memoTeamOptions) || !Array.isArray(parts.memoMetricOptions)) {
    throw new Error('KpiUtilityGraphTemplate foundation part missing');
  }
  const memoTeamOptions = parts.memoTeamOptions;
  const memoMetricOptions = parts.memoMetricOptions;
  const escapeHtml = (...args) => parts.escapeHtml(...args);

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


  Object.assign(parts, { renderUtilityGraphMemo });
})(this);
