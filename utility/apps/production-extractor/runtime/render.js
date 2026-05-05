function renderAll() {
  renderMetrics();
  renderCurrentPeriod();
  renderPeriodSummary();
  renderTeamSummary();
  renderTable();
  renderFileSummary();
  renderDownloadButtons();
}

function getSelectedPeriodText() {
  return state.selectedPeriod === "ALL"
    ? "전체"
    : dom.periodSelect.selectedOptions[0]?.textContent || "전체";
}

function getSelectedTeamText() {
  return state.selectedTeam === "ALL"
    ? "전체 팀"
    : dom.teamSelect.selectedOptions[0]?.textContent || state.selectedTeam;
}

function getSelectedLineText() {
  return state.selectedLine === "ALL"
    ? "전체 라인"
    : dom.lineSelect.selectedOptions[0]?.textContent || state.selectedLine;
}

function getSelectedSortText() {
  return dom.sortSelect.selectedOptions[0]?.textContent || "날짜 오름차순";
}

function renderMetrics() {
  const currentStats = computeProductionStats(state.filteredRows);

  dom.metricFiles.textContent = String(state.fileSummaries.length);
  dom.metricRowsAll.textContent = formatNumber(state.rows.length);
  dom.metricRowsFiltered.textContent = formatNumber(state.filteredRows.length);
  dom.metricPeriod.textContent = getSelectedPeriodText();
  dom.metricTeam.textContent = getSelectedTeamText();
  dom.metricLine.textContent = getSelectedLineText();
  dom.metricSum.textContent = formatNumber(currentStats.sum);
  dom.metricAvg.textContent = currentStats.avg === null ? "-" : formatNumber(currentStats.avg);
  dom.metricDateRange.textContent = state.dateRangeLabel;
  dom.metricDedup.textContent = formatNumber(state.duplicateRemovedCount);
}

function renderCurrentPeriod() {
  const periodText = getSelectedPeriodText();
  const teamText = getSelectedTeamText();
  const lineText = getSelectedLineText();
  const sortText = getSelectedSortText();
  dom.currentPeriodLabel.textContent = `현재 보기: ${periodText} / ${teamText} / ${lineText} / ${sortText}`;
}
function renderPeriodSummary() {
  dom.periodSummaryBody.innerHTML = "";

  if (state.periodSummaries.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty";
    td.colSpan = 4;
    td.textContent = "추출 실행 후 월별 요약이 표시됩니다.";
    tr.appendChild(td);
    dom.periodSummaryBody.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const summary of state.periodSummaries) {
    const tr = document.createElement("tr");
    if (state.selectedPeriod !== "ALL" && state.selectedPeriod === summary.key) {
      tr.classList.add("active-period");
    }

    const cells = [
      summary.label,
      formatNumber(summary.rowCount),
      formatNumber(summary.sum),
      summary.avg === null ? "-" : formatNumber(summary.avg),
    ];

    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }

  dom.periodSummaryBody.appendChild(fragment);
}

function renderTeamSummary() {
  dom.teamSummaryBody.innerHTML = "";

  if (state.teamSummaries.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty";
    td.colSpan = 5;
    td.textContent = "조건에 맞는 팀 요약 데이터가 없습니다.";
    tr.appendChild(td);
    dom.teamSummaryBody.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const summary of state.teamSummaries) {
    const tr = document.createElement("tr");
    if (state.selectedTeam !== "ALL" && state.selectedTeam === summary.team) {
      tr.classList.add("active-period");
    }

    const cells = [
      summary.team,
      formatNumber(summary.rowCount),
      summary.rangeLabel,
      formatNumber(summary.sum),
      summary.avg === null ? "-" : formatNumber(summary.avg),
    ];

    for (const value of cells) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }

  dom.teamSummaryBody.appendChild(fragment);
}

function renderTable() {
  dom.tableHeader.innerHTML = "";
  dom.tableBody.innerHTML = "";

  if (state.rows.length === 0) {
    const th = document.createElement("th");
    th.textContent = "데이터 없음";
    dom.tableHeader.appendChild(th);

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty";
    td.textContent = "추출 실행 후 데이터가 표시됩니다.";
    tr.appendChild(td);
    dom.tableBody.appendChild(tr);
    return;
  }

  for (const header of state.headers) {
    const th = document.createElement("th");
    th.textContent = header;
    dom.tableHeader.appendChild(th);
  }

  if (state.filteredRows.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "empty";
    td.colSpan = state.headers.length;
    td.textContent = "선택한 조건에 맞는 데이터가 없습니다.";
    tr.appendChild(td);
    dom.tableBody.appendChild(tr);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const row of state.filteredRows) {
    const tr = document.createElement("tr");
    for (const value of row.values) {
      const td = document.createElement("td");
      td.textContent = String(value ?? "");
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }
  dom.tableBody.appendChild(fragment);
}

function renderFileSummary() {
  if (state.fileSummaries.length === 0) {
    dom.fileSummary.className = "file-summary empty";
    dom.fileSummary.textContent = "아직 처리된 파일이 없습니다.";
    return;
  }

  dom.fileSummary.className = "file-summary";
  dom.fileSummary.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (const summary of state.fileSummaries) {
    const card = document.createElement("article");
    card.className = "summary-card";

    const title = document.createElement("h3");
    title.textContent = summary.fileName;
    card.appendChild(title);

    const sheetRow = document.createElement("p");
    sheetRow.className = "summary-row";
    sheetRow.innerHTML = `<span>분석 시트</span><strong>${formatNumber(summary.sheetCount)}개</strong>`;
    card.appendChild(sheetRow);

    const periodRow = document.createElement("p");
    periodRow.className = "summary-row";
    periodRow.innerHTML = `<span>생산 기간</span><strong>${escapeHtml(summary.productionRangeLabel)}</strong>`;
    card.appendChild(periodRow);

    const countRow = document.createElement("p");
    countRow.className = "summary-row";
    countRow.innerHTML = `<span>추출 행 수</span><strong>${formatNumber(summary.rowCount)}</strong>`;
    card.appendChild(countRow);

    fragment.appendChild(card);
  }

  dom.fileSummary.appendChild(fragment);
}

function renderDownloadButtons() {
  const hasAnyData = state.rows.length > 0;
  const hasFilteredData = state.filteredRows.length > 0;
  dom.applyToKpiBtn.disabled = !hasAnyData;
  dom.downloadAllBtn.disabled = !hasAnyData;
  dom.downloadFilteredBtn.disabled = !hasFilteredData;
}
