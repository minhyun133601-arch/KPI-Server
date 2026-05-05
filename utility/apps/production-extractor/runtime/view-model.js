async function parseExcelFile(file, cycleStartDay = FIXED_PERIOD_START_DAY) {
  return requireProductionParsingApi().parseExcelFile(
    getProductionParsingContext(),
    file,
    cycleStartDay,
  );
}

function deduplicateRows(rows) {
  return requireProductionParsingApi().deduplicateRows(getProductionParsingContext(), rows);
}

function normalizeValue(value) {
  return requireProductionParsingApi().normalizeValue(value);
}

function parseDateText(value) {
  return requireProductionParsingApi().parseDateText(value);
}

function getPeriodInfo(date) {
  return requireProductionParsingApi().getPeriodInfo(getProductionParsingContext(), date);
}

function formatYmd(date) {
  return requireProductionParsingApi().formatYmd(date);
}

function buildDateRangeLabel(minDate, maxDate) {
  return requireProductionParsingApi().buildDateRangeLabel(
    getProductionParsingContext(),
    minDate,
    maxDate,
  );
}

function getDateRangeLabel(rows) {
  return requireProductionParsingApi().getDateRangeLabel(getProductionParsingContext(), rows);
}

function compareRowsByFallback(a, b) {
  const teamDiff = String(a.teamKey).localeCompare(String(b.teamKey), "ko");
  if (teamDiff !== 0) return teamDiff;

  const lineDiff = String(a.lineKey).localeCompare(String(b.lineKey), "ko");
  if (lineDiff !== 0) return lineDiff;

  const fileDiff = String(a.fileName).localeCompare(String(b.fileName), "ko");
  if (fileDiff !== 0) return fileDiff;

  const sheetDiff = String(a.sheetName || "").localeCompare(String(b.sheetName || ""), "ko");
  if (sheetDiff !== 0) return sheetDiff;

  return a.rowNumber - b.rowNumber;
}

function compareRowsByDateAsc(a, b) {
  if (a.dateObj && b.dateObj) {
    const diff = a.dateObj - b.dateObj;
    if (diff !== 0) return diff;
  } else if (!a.dateObj && b.dateObj) {
    return 1;
  } else if (a.dateObj && !b.dateObj) {
    return -1;
  }
  return compareRowsByFallback(a, b);
}

function compareRowsByDateDesc(a, b) {
  if (a.dateObj && b.dateObj) {
    const diff = b.dateObj - a.dateObj;
    if (diff !== 0) return diff;
  } else if (!a.dateObj && b.dateObj) {
    return 1;
  } else if (a.dateObj && !b.dateObj) {
    return -1;
  }
  return compareRowsByFallback(a, b);
}

function compareRowsBySort(a, b, sortKey) {
  switch (sortKey) {
    case "date_desc":
      return compareRowsByDateDesc(a, b);
    case "team_asc": {
      const teamDiff = String(a.teamKey).localeCompare(String(b.teamKey), "ko");
      if (teamDiff !== 0) return teamDiff;
      return compareRowsByDateAsc(a, b);
    }
    case "line_asc": {
      const lineDiff = String(a.lineKey).localeCompare(String(b.lineKey), "ko");
      if (lineDiff !== 0) return lineDiff;
      return compareRowsByDateAsc(a, b);
    }
    case "amount_desc": {
      const aValue = parseProductionValue(a.values[PRODUCTION_VALUE_INDEX]);
      const bValue = parseProductionValue(b.values[PRODUCTION_VALUE_INDEX]);
      const aNum = aValue === null ? Number.NEGATIVE_INFINITY : aValue;
      const bNum = bValue === null ? Number.NEGATIVE_INFINITY : bValue;
      const diff = bNum - aNum;
      if (diff !== 0) return diff;
      return compareRowsByDateAsc(a, b);
    }
    case "date_asc":
    default:
      return compareRowsByDateAsc(a, b);
  }
}

function sortRows(rows) {
  return [...rows].sort((a, b) => compareRowsBySort(a, b, state.sortKey));
}
function buildPeriodSummaries() {
  const periodMap = new Map();
  for (const row of state.rows) {
    if (!periodMap.has(row.periodKey)) {
      periodMap.set(row.periodKey, {
        key: row.periodKey,
        label: row.periodLabel,
        startTime: row.periodStart ? row.periodStart.getTime() : Number.MAX_SAFE_INTEGER,
        rowCount: 0,
        sum: 0,
        numericCount: 0,
      });
    }
    const target = periodMap.get(row.periodKey);
    target.rowCount += 1;
    const numericValue = parseProductionValue(row.values[PRODUCTION_VALUE_INDEX]);
    if (numericValue !== null) {
      target.sum += numericValue;
      target.numericCount += 1;
    }
  }

  state.periodSummaries = Array.from(periodMap.values())
    .sort((a, b) => a.startTime - b.startTime)
    .map((summary) => ({
      ...summary,
      avg: summary.numericCount > 0 ? summary.sum / summary.numericCount : null,
    }));
}

function populatePeriodOptions() {
  const periodMap = new Map();
  for (const row of state.rows) {
    if (!periodMap.has(row.periodKey)) {
      periodMap.set(row.periodKey, {
        label: row.periodLabel,
        startTime: row.periodStart ? row.periodStart.getTime() : Number.MAX_SAFE_INTEGER,
      });
    }
  }

  const periods = Array.from(periodMap.entries()).sort((a, b) => a[1].startTime - b[1].startTime);
  const previousSelected = state.selectedPeriod;

  dom.periodSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "전체";
  dom.periodSelect.appendChild(allOption);

  for (const [key, info] of periods) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = info.label;
    dom.periodSelect.appendChild(option);
  }

  const exists = previousSelected === "ALL" || periodMap.has(previousSelected);
  state.selectedPeriod = exists ? previousSelected : "ALL";
  dom.periodSelect.value = state.selectedPeriod;
}

function populateTeamOptions() {
  const teams = Array.from(
    new Set(state.rows.map((row) => String(row.teamKey || "팀 없음"))),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const previousSelected = state.selectedTeam;
  dom.teamSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "전체 팀";
  dom.teamSelect.appendChild(allOption);

  for (const team of teams) {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    dom.teamSelect.appendChild(option);
  }

  const exists = previousSelected === "ALL" || teams.includes(previousSelected);
  state.selectedTeam = exists ? previousSelected : "ALL";
  dom.teamSelect.value = state.selectedTeam;
}

function populateLineOptions() {
  const lines = Array.from(
    new Set(state.rows.map((row) => String(row.lineKey || "라인 없음"))),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  const previousSelected = state.selectedLine;
  dom.lineSelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "전체 라인";
  dom.lineSelect.appendChild(allOption);

  for (const line of lines) {
    const option = document.createElement("option");
    option.value = line;
    option.textContent = line;
    dom.lineSelect.appendChild(option);
  }

  const exists = previousSelected === "ALL" || lines.includes(previousSelected);
  state.selectedLine = exists ? previousSelected : "ALL";
  dom.lineSelect.value = state.selectedLine;
}

function matchesPeriodLineAndSearch(row) {
  const matchPeriod = state.selectedPeriod === "ALL" || row.periodKey === state.selectedPeriod;
  if (!matchPeriod) return false;

  const matchLine = state.selectedLine === "ALL" || row.lineKey === state.selectedLine;
  if (!matchLine) return false;

  if (state.search.length === 0) return true;

  return row.values
    .map((value) => String(value ?? "").toLowerCase())
    .join(" ")
    .includes(state.search);
}

function refreshTeamSummaries() {
  const rows = state.rows.filter(matchesPeriodLineAndSearch);
  const teamMap = new Map();

  for (const row of rows) {
    const key = String(row.teamKey || "팀 없음");
    if (!teamMap.has(key)) {
      teamMap.set(key, {
        team: key,
        rowCount: 0,
        sum: 0,
        numericCount: 0,
        minDate: null,
        maxDate: null,
      });
    }

    const target = teamMap.get(key);
    target.rowCount += 1;

    if (row.dateObj) {
      if (!target.minDate || row.dateObj < target.minDate) target.minDate = row.dateObj;
      if (!target.maxDate || row.dateObj > target.maxDate) target.maxDate = row.dateObj;
    }

    const numeric = parseProductionValue(row.values[PRODUCTION_VALUE_INDEX]);
    if (numeric !== null) {
      target.sum += numeric;
      target.numericCount += 1;
    }
  }

  state.teamSummaries = Array.from(teamMap.values())
    .map((summary) => ({
      ...summary,
      avg: summary.numericCount > 0 ? summary.sum / summary.numericCount : null,
      rangeLabel: buildDateRangeLabel(summary.minDate, summary.maxDate),
    }))
    .sort((a, b) => a.team.localeCompare(b.team, "ko"));
}

function refreshFilteredRows() {
  const filtered = state.rows.filter((row) => {
    if (!matchesPeriodLineAndSearch(row)) return false;
    if (state.selectedTeam !== "ALL" && row.teamKey !== state.selectedTeam) return false;
    return true;
  });
  state.filteredRows = sortRows(filtered);
}

function refreshDerivedViews() {
  refreshTeamSummaries();
  refreshFilteredRows();
}


function computeProductionStats(rows) {
  let sum = 0;
  let numericCount = 0;
  for (const row of rows) {
    const numeric = parseProductionValue(row.values[PRODUCTION_VALUE_INDEX]);
    if (numeric === null) continue;
    sum += numeric;
    numericCount += 1;
  }
  return {
    sum,
    avg: numericCount > 0 ? sum / numericCount : null,
    numericCount,
  };
}

function parseProductionValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  if (text === "") return null;

  const cleaned = text.replaceAll(",", "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const numeric = Number(match[0]);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatNumber(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  if (Number.isInteger(value)) return value.toLocaleString("ko-KR");

  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return rounded.toLocaleString("ko-KR");

  return rounded.toLocaleString("ko-KR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
