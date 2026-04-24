"use strict";

const TARGET_COLS = ["A", "B", "C", "E", "F"];
const HEADER_ROW = 3;
const DATA_START_ROW = 4;
const TEAM_VALUE_INDEX = 1;
const LINE_VALUE_INDEX = 2;
const PRODUCTION_VALUE_INDEX = 4;
const PRODUCTION_DATE_OFFSET_DAYS = 0;

const REQUIRED_HEADER_RULES = {
  A: [/생산일자/],
  B: [/팀/],
  C: [/라인명/, /라인/],
  E: [/품명/],
  F: [/생산량/],
};

const state = {
  headers: TARGET_COLS.map((col) => `${col}열`),
  rows: [],
  filteredRows: [],
  fileSummaries: [],
  periodSummaries: [],
  teamSummaries: [],
  selectedPeriod: "ALL",
  selectedTeam: "ALL",
  selectedLine: "ALL",
  sortKey: "date_asc",
  search: "",
  dateRangeLabel: "-",
  duplicateRemovedCount: 0,
  failedFiles: [],
  storedRows: [],
  storedTeams: [],
};

const dom = {};
const EMBED_DATA_SECTION_IDS = [
  "metricsSection",
  "periodSummarySection",
  "teamSummarySection",
  "resultTableSection",
  "fileSummarySection",
];
const isEmbedMode = (() => {
  try {
    const params = new URLSearchParams(window.location.search || "");
    if (params.get("embed") === "1") return true;
  } catch (error) {
    // no-op
  }
  return window.self !== window.top;
})();

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  setupEmbedMode();
  bindEvents();
  clearExtractedState();
  initializeStoredExportPanel();
  setStatus("파일을 첨부한 뒤 추출 실행을 눌러주세요.");
});

function cacheDom() {
  dom.fileInput = document.getElementById("fileInput");
  dom.periodSelect = document.getElementById("periodSelect");
  dom.teamSelect = document.getElementById("teamSelect");
  dom.lineSelect = document.getElementById("lineSelect");
  dom.sortSelect = document.getElementById("sortSelect");
  dom.searchInput = document.getElementById("searchInput");
  dom.extractBtn = document.getElementById("extractBtn");
  dom.applyToKpiBtn = document.getElementById("applyToKpiBtn");
  dom.downloadFilteredBtn = document.getElementById("downloadFilteredBtn");
  dom.downloadAllBtn = document.getElementById("downloadAllBtn");
  dom.backBtn = document.getElementById("backBtn");
  dom.statusText = document.getElementById("statusText");
  dom.storedSection = document.getElementById("storedExportSection");
  dom.storedStartDate = document.getElementById("storedStartDate");
  dom.storedEndDate = document.getElementById("storedEndDate");
  dom.storedTeamSelect = document.getElementById("storedTeamSelect");
  dom.downloadStoredBtn = document.getElementById("downloadStoredBtn");
  dom.refreshStoredBtn = document.getElementById("refreshStoredBtn");

  dom.metricFiles = document.getElementById("metricFiles");
  dom.metricRowsAll = document.getElementById("metricRowsAll");
  dom.metricRowsFiltered = document.getElementById("metricRowsFiltered");
  dom.metricPeriod = document.getElementById("metricPeriod");
  dom.metricTeam = document.getElementById("metricTeam");
  dom.metricLine = document.getElementById("metricLine");
  dom.metricSum = document.getElementById("metricSum");
  dom.metricAvg = document.getElementById("metricAvg");
  dom.metricDateRange = document.getElementById("metricDateRange");
  dom.metricDedup = document.getElementById("metricDedup");

  dom.currentPeriodLabel = document.getElementById("currentPeriodLabel");
  dom.periodSummaryBody = document.getElementById("periodSummaryBody");
  dom.teamSummaryBody = document.getElementById("teamSummaryBody");
  dom.tableHeader = document.getElementById("tableHeader");
  dom.tableBody = document.getElementById("tableBody");
  dom.fileSummary = document.getElementById("fileSummary");
}

function setupEmbedMode() {
  if (!isEmbedMode) return;
  document.body.classList.add("embed-mode");
  setEmbedDataSectionsVisible(false);
  simplifyEmbedControls();
}

function setEmbedDataSectionsVisible(visible) {
  if (!isEmbedMode) return;
  EMBED_DATA_SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.style.display = visible ? "" : "none";
  });
}

function simplifyEmbedControls() {
  const controlsSection = document.getElementById("extractControlsSection");
  if (!controlsSection) return;
  controlsSection.querySelectorAll(".field").forEach((field) => {
    const hasFileInput = field.querySelector("#fileInput");
    field.style.display = hasFileInput ? "" : "none";
  });
  dom.downloadFilteredBtn.style.display = "none";
  dom.downloadAllBtn.style.display = "none";
  dom.backBtn.style.display = "none";
  if (dom.storedSection) dom.storedSection.style.display = "";
}

function bindEvents() {
  dom.extractBtn.addEventListener("click", handleExtract);
  dom.periodSelect.addEventListener("change", handlePeriodChange);
  dom.teamSelect.addEventListener("change", handleTeamChange);
  dom.lineSelect.addEventListener("change", handleLineChange);
  dom.sortSelect.addEventListener("change", handleSortChange);
  dom.searchInput.addEventListener("input", handleSearch);
  dom.applyToKpiBtn.addEventListener("click", handleApplyToKpi);
  dom.downloadFilteredBtn.addEventListener("click", downloadFilteredRows);
  dom.downloadAllBtn.addEventListener("click", downloadAllRows);
  dom.backBtn.addEventListener("click", handleBack);
  dom.downloadStoredBtn?.addEventListener("click", handleDownloadStoredRows);
  dom.refreshStoredBtn?.addEventListener("click", () => refreshStoredRowsFromParent(true));
  window.addEventListener("message", handleKpiImportResultMessage);

  dom.fileInput.addEventListener("change", () => {
    const count = dom.fileInput.files.length;
    setStatus(
      count > 0
        ? `선택 파일: ${count}개 (여러 파일/여러 시트 동시 분석)`
        : "파일 선택이 취소되었습니다.",
    );
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Backspace") return;
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    handleBack();
  });
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function handleBack() {
  if (isEmbedMode && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "kpi-production-close" }, "*");
    return;
  }
  if (window.history.length > 1) window.history.back();
}

function setStatus(message, isError = false) {
  dom.statusText.textContent = message;
  dom.statusText.classList.toggle("error", isError);
}

function setBusy(isBusy) {
  dom.extractBtn.disabled = isBusy;
  dom.applyToKpiBtn.disabled = isBusy || state.rows.length === 0;
  dom.fileInput.disabled = isBusy;
  dom.periodSelect.disabled = isBusy;
  dom.teamSelect.disabled = isBusy;
  dom.lineSelect.disabled = isBusy;
  dom.sortSelect.disabled = isBusy;
  dom.searchInput.disabled = isBusy;
  if (dom.downloadStoredBtn) dom.downloadStoredBtn.disabled = isBusy;
  if (dom.refreshStoredBtn) dom.refreshStoredBtn.disabled = isBusy;
  if (dom.storedStartDate) dom.storedStartDate.disabled = isBusy;
  if (dom.storedEndDate) dom.storedEndDate.disabled = isBusy;
  if (dom.storedTeamSelect) dom.storedTeamSelect.disabled = isBusy;
}

function handlePeriodChange() {
  state.selectedPeriod = dom.periodSelect.value;
  refreshDerivedViews();
  renderAll();
}

function handleTeamChange() {
  state.selectedTeam = dom.teamSelect.value;
  refreshDerivedViews();
  renderAll();
}

function handleLineChange() {
  state.selectedLine = dom.lineSelect.value;
  refreshDerivedViews();
  renderAll();
}

function handleSortChange() {
  state.sortKey = dom.sortSelect.value;
  refreshFilteredRows();
  renderAll();
}

function handleSearch() {
  state.search = dom.searchInput.value.trim().toLowerCase();
  refreshDerivedViews();
  renderAll();
}

async function handleExtract() {
  const files = Array.from(dom.fileInput.files || []);
  if (files.length === 0) {
    setStatus("엑셀 파일을 먼저 선택해주세요.", true);
    return;
  }

  setBusy(true);
  setStatus("엑셀 파일을 분석 중입니다...");

  try {
    const parsedResults = await Promise.all(
      files.map(async (file) => {
        try {
          const parsed = await parseExcelFile(file);
          return {
            ok: true,
            fileName: String(file?.name || "").trim(),
            parsed,
          };
        } catch (error) {
          return {
            ok: false,
            fileName: String(file?.name || "").trim(),
            message: String(error?.message || "형식 오류"),
          };
        }
      }),
    );
    const parsedFiles = parsedResults
      .filter((item) => item.ok && item.parsed)
      .map((item) => item.parsed);
    const failedFiles = parsedResults
      .filter((item) => !item.ok)
      .map((item) => ({
        fileName: item.fileName || "알 수 없는 파일",
        message: item.message || "형식 오류",
      }));
    if (parsedFiles.length === 0) {
      const failedNames = failedFiles.map((item) => item.fileName).filter(Boolean).join(", ");
      throw new Error(
        failedNames
          ? `형식 오류 파일만 선택되었습니다. 오류 파일: ${failedNames}`
          : "기입 가능한 데이터가 없습니다.",
      );
    }

    state.headers = TARGET_COLS.map((col) => `${col}열`);
    state.rows = [];
    state.fileSummaries = [];
    state.periodSummaries = [];
    state.teamSummaries = [];
    state.selectedPeriod = "ALL";
    state.selectedTeam = "ALL";
    state.selectedLine = "ALL";
    state.sortKey = "date_asc";
    state.search = "";
    state.duplicateRemovedCount = 0;
    state.failedFiles = failedFiles;
    dom.searchInput.value = "";
    dom.sortSelect.value = state.sortKey;

    for (const parsed of parsedFiles) {
      if (parsed.headers.length === TARGET_COLS.length) {
        state.headers = parsed.headers;
      }
      state.rows.push(...parsed.rows);
      state.fileSummaries.push({
        fileName: parsed.fileName,
        rowCount: parsed.rows.length,
        productionRangeLabel: parsed.productionRangeLabel,
        sheetCount: parsed.sheetCount,
      });
    }

    const dedup = deduplicateRows(state.rows);
    state.rows = dedup.rows;
    state.duplicateRemovedCount = dedup.removedCount;
    state.rows.sort(compareRowsByDateAsc);
    state.dateRangeLabel = getDateRangeLabel(state.rows);

    buildPeriodSummaries();
    populatePeriodOptions();
    populateTeamOptions();
    populateLineOptions();
    refreshDerivedViews();
    renderAll();

    const failedNames = failedFiles.map((item) => item.fileName).filter(Boolean);
    const failedNotice = failedNames.length
      ? `, 형식 오류 제외 ${failedNames.length.toLocaleString("ko-KR")}개 (${failedNames.join(", ")})`
      : "";
    setStatus(
      `완료: 선택 ${files.length}개 중 ${parsedFiles.length.toLocaleString("ko-KR")}개 분석, ${state.rows.length.toLocaleString("ko-KR")}행 추출 (중복 제거 ${state.duplicateRemovedCount.toLocaleString("ko-KR")}건${failedNotice})`,
    );
    if (isEmbedMode) setEmbedDataSectionsVisible(true);
  } catch (error) {
    clearExtractedState();
    if (isEmbedMode) setEmbedDataSectionsVisible(false);
    setStatus(`오류: ${error.message}`, true);
  } finally {
    setBusy(false);
  }
}
async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  if (workbook.SheetNames.length === 0) {
    throw new Error(`[${file.name}] 시트가 없습니다.`);
  }

  const rows = [];
  let headers = [];
  let minDate = null;
  let maxDate = null;
  let parsedSheetCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawHeaders = TARGET_COLS.map((col) =>
      String(getCellDisplayValue(worksheet, `${col}${HEADER_ROW}`) || "").trim(),
    );

    if (rawHeaders.every((header) => header === "")) continue;

    validateTemplateHeaders(file.name, sheetName, rawHeaders);

    const displayHeaders = rawHeaders.map(
      (header, index) => header || `${TARGET_COLS[index]}열`,
    );
    if (headers.length === 0) {
      headers = displayHeaders;
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    const lastRow = range.e.r + 1;

    for (let rowNumber = DATA_START_ROW; rowNumber <= lastRow; rowNumber += 1) {
      const values = TARGET_COLS.map((col) => getCellDisplayValue(worksheet, `${col}${rowNumber}`));
      if (!hasData(values)) continue;

      const dateCell = worksheet[`A${rowNumber}`];
      const parsedDate = parseDate(dateCell, values[0]);
      const dateObj = applyDateOffset(parsedDate, PRODUCTION_DATE_OFFSET_DAYS);
      values[0] = dateObj ? formatYmd(dateObj) : normalizeValue(values[0]);

      const lineValue = normalizeValue(values[LINE_VALUE_INDEX]);
      const teamValue = normalizeValue(values[TEAM_VALUE_INDEX]);
      values[TEAM_VALUE_INDEX] = resolveProductionTeamValue(teamValue, lineValue);
      values[LINE_VALUE_INDEX] = lineValue === "" ? "라인 없음" : String(lineValue);

      if (dateObj) {
        if (!minDate || dateObj < minDate) minDate = dateObj;
        if (!maxDate || dateObj > maxDate) maxDate = dateObj;
      }

      const periodInfo = dateObj
        ? getPeriodInfo(dateObj)
        : { key: "NO_DATE", label: "날짜 없음", start: null };

      rows.push({
        fileName: file.name,
        sheetName,
        rowNumber,
        values,
        dateObj,
        teamKey: values[TEAM_VALUE_INDEX],
        lineKey: values[LINE_VALUE_INDEX],
        periodKey: periodInfo.key,
        periodLabel: periodInfo.label,
        periodStart: periodInfo.start,
      });
    }

    parsedSheetCount += 1;
  }

  if (parsedSheetCount === 0) {
    throw new Error(`[${file.name}] 형식에 맞는 시트를 찾지 못했습니다. (3행 A/B/C/E/F 헤더 확인)`);
  }

  return {
    fileName: file.name,
    headers,
    rows,
    productionRangeLabel: buildDateRangeLabel(minDate, maxDate),
    sheetCount: parsedSheetCount,
  };
}

function validateTemplateHeaders(fileName, sheetName, headers) {
  for (let index = 0; index < TARGET_COLS.length; index += 1) {
    const col = TARGET_COLS[index];
    const rawHeader = String(headers[index] || "").trim();
    const normalized = normalizeHeader(rawHeader);
    const patterns = REQUIRED_HEADER_RULES[col] || [];

    if (normalized === "" || patterns.length === 0) {
      throw new Error(`[${fileName} - ${sheetName}] ${col}${HEADER_ROW} 헤더가 비어있습니다.`);
    }

    const isValid = patterns.some((pattern) => pattern.test(normalized));
    if (!isValid) {
      throw new Error(
        `[${fileName} - ${sheetName}] ${col}${HEADER_ROW} 헤더 형식이 다릅니다. 현재: "${rawHeader}"`,
      );
    }
  }
}

function normalizeHeader(text) {
  return String(text || "")
    .toLowerCase()
    .replaceAll(/\s+/g, "")
    .replaceAll(/[._\-()]/g, "");
}

function deduplicateRows(rows) {
  const seenKeys = new Set();
  const dedupedRows = [];
  let removedCount = 0;

  for (const row of rows) {
    const key = buildRowDedupKey(row);
    if (seenKeys.has(key)) {
      removedCount += 1;
      continue;
    }
    seenKeys.add(key);
    dedupedRows.push(row);
  }

  return { rows: dedupedRows, removedCount };
}

function buildRowDedupKey(row) {
  const values = Array.isArray(row?.values) ? row.values : [];
  // Dedupe compares row content only (date/team/line/product/amount), not row number.
  return values
    .map((value, index) => canonicalizeValueForDedup(value, index))
    .join("||");
}

function canonicalizeValueForDedup(value, index) {
  if (index === PRODUCTION_VALUE_INDEX) {
    const numeric = parseProductionValue(value);
    if (numeric !== null) return `N:${numeric}`;
  }

  if (index === 0) {
    const parsedDate = parseDateText(value);
    if (parsedDate) return `D:${formatYmd(parsedDate)}`;
  }

  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) return `N:${value}`;

  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

function getCellDisplayValue(worksheet, address) {
  const cell = worksheet[address];
  if (!cell) return "";

  if (cell.v instanceof Date) {
    const normalizedDate = normalizeExcelJsDate(cell.v);
    if (normalizedDate) return formatYmd(normalizedDate);
    return formatYmd(cell.v);
  }
  if (typeof cell.v === "number" && isDateFormattedCell(cell)) {
    const parsed = XLSX.SSF.parse_date_code(cell.v);
    if (parsed) return formatYmd(new Date(parsed.y, parsed.m - 1, parsed.d));
  }
  if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") return cell.w;
  if (cell.v === undefined || cell.v === null) return "";
  return cell.v;
}

function isDateFormattedCell(cell) {
  const format = String(cell.z || "").toLowerCase();
  return format.includes("yy") || format.includes("mm") || format.includes("dd");
}

function isLikelyExcelDateSerial(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return value >= 30000 && value <= 80000;
}

function hasData(values) {
  return values.some((value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  });
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return value;
}

function normalizeCompactText(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function isEmptyTeamText(value) {
  const normalized = normalizeCompactText(value);
  if (!normalized) return true;
  return (
    normalized === "-" ||
    normalized === "없음" ||
    normalized === "팀없음" ||
    normalized === "미입력" ||
    normalized === "na" ||
    normalized === "n/a"
  );
}

function resolveProductionTeamValue(teamValue, lineValue) {
  const teamText = String(normalizeValue(teamValue) ?? "").trim();
  const teamNormalized = normalizeCompactText(teamText);
  const lineNormalized = normalizeCompactText(normalizeValue(lineValue));

  if (isEmptyTeamText(teamText) || teamNormalized.includes("3팀") || lineNormalized.includes("액상")) {
    return "3팀";
  }
  return teamText;
}

function parseDate(cell, fallbackValue) {
  if (cell) {
    if (cell.v instanceof Date) {
      const normalizedDate = normalizeExcelJsDate(cell.v);
      if (normalizedDate) return normalizedDate;
      return stripTime(cell.v);
    }

    if (typeof cell.v === "number" && (isDateFormattedCell(cell) || isLikelyExcelDateSerial(cell.v))) {
      const parsed = XLSX.SSF.parse_date_code(cell.v);
      if (parsed) {
        const date = new Date(parsed.y, parsed.m - 1, parsed.d);
        if (date.getFullYear() >= 1990 && date.getFullYear() <= 2100) {
          return date;
        }
      }
    }

    const fromDisplay = parseDateText(cell.w);
    if (fromDisplay) return fromDisplay;
  }

  return parseDateText(fallbackValue);
}

function parseDateText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  const match = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  if (year < 1990 || year > 2100) return null;
  return date;
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function normalizeExcelJsDate(date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  if (isUtcMidnight) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function applyDateOffset(date, offsetDays) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  const safeOffset = Number.isFinite(Number(offsetDays)) ? Number(offsetDays) : 0;
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  shifted.setDate(shifted.getDate() + safeOffset);
  return shifted;
}

function getPeriodInfo(date) {
  const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const key = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
  const label = `${periodStart.getFullYear()}년 ${periodStart.getMonth() + 1}월 (${formatMd(periodStart)}~${formatMd(periodEnd)})`;
  return { key, label, start: periodStart };
}

function formatYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMd(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}/${d}`;
}

function buildDateRangeLabel(minDate, maxDate) {
  if (!minDate || !maxDate) return "날짜 없음";
  return `${formatYmd(minDate)} ~ ${formatYmd(maxDate)}`;
}

function getDateRangeLabel(rows) {
  let minDate = null;
  let maxDate = null;
  for (const row of rows) {
    if (!row.dateObj) continue;
    if (!minDate || row.dateObj < minDate) minDate = row.dateObj;
    if (!maxDate || row.dateObj > maxDate) maxDate = row.dateObj;
  }
  return buildDateRangeLabel(minDate, maxDate);
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

function buildKpiBridgeRows() {
  const fileMetaMap = buildSourceFileMetaMap();
  return state.rows.map((row) => ({
    date: row.values[0] ?? "",
    team: row.values[TEAM_VALUE_INDEX] ?? "",
    lineName: row.values[LINE_VALUE_INDEX] ?? "",
    productName: row.values[3] ?? "",
    amount: row.values[PRODUCTION_VALUE_INDEX] ?? "",
    sourceFileName: String(row.fileName || "").trim(),
    sourceFingerprint: String(fileMetaMap.get(String(row.fileName || "").trim())?.fingerprint || ""),
  }));
}

function buildSourceFingerprint(fileName, size, lastModified) {
  const safeName = String(fileName || "").trim().toLowerCase();
  const safeSize = Number.isFinite(Number(size)) ? Number(size) : 0;
  const safeLastModified = Number.isFinite(Number(lastModified)) ? Number(lastModified) : 0;
  if (!safeName) return "";
  return `${safeName}|${safeSize}|${safeLastModified}`;
}

function buildSourceFileMetaMap() {
  const files = Array.from(dom.fileInput?.files || []);
  const map = new Map();
  for (const file of files) {
    const fileName = String(file?.name || "").trim();
    if (!fileName) continue;
    map.set(fileName, {
      fileName,
      size: Number(file?.size) || 0,
      lastModified: Number(file?.lastModified) || 0,
      fingerprint: buildSourceFingerprint(fileName, file?.size, file?.lastModified),
    });
  }
  return map;
}

function buildSourceFilesPayload() {
  const files = Array.from(dom.fileInput?.files || []);
  return files
    .map((file) => ({
      fileName: String(file?.name || "").trim(),
      size: Number(file?.size) || 0,
      type: String(file?.type || ""),
      lastModified: Number(file?.lastModified) || 0,
      fingerprint: buildSourceFingerprint(file?.name, file?.size, file?.lastModified),
      blob: file,
    }))
    .filter((item) => item.fileName && item.blob instanceof Blob);
}

function handleApplyToKpi() {
  if (state.rows.length === 0) {
    setStatus("생산량 기입 대상이 없습니다.", true);
    return;
  }
  if (!window.parent || window.parent === window) {
    setStatus("KPI 연동 화면에서만 생산량 기입이 가능합니다.", true);
    return;
  }
  const payload = {
    type: "kpi-production-extracted",
    rows: buildKpiBridgeRows(),
    meta: {
      rowCount: state.rows.length,
      duplicateRemovedCount: state.duplicateRemovedCount,
      failedFiles: state.failedFiles.map((item) => ({
        fileName: String(item?.fileName || "").trim(),
        message: String(item?.message || "").trim(),
      })),
      sourceFolderName: "원본 엑셀",
      sourceFiles: buildSourceFilesPayload(),
      generatedAt: new Date().toISOString(),
    },
  };
  try {
    window.parent.postMessage(payload, "*");
    setStatus(`생산량 기입 요청: ${formatNumber(state.rows.length)}행 전송 완료`);
  } catch (error) {
    const fallbackPayload = {
      ...payload,
      meta: {
        ...payload.meta,
        sourceFiles: [],
      },
    };
    window.parent.postMessage(fallbackPayload, "*");
    setStatus(`생산량 기입 요청: ${formatNumber(state.rows.length)}행 전송 완료`);
  }
}

function handleKpiImportResultMessage(event) {
  const data = event?.data;
  if (!data || data.type !== "kpi-production-import-result") return;
  if (data.ok) {
    const addedText = formatNumber(Number(data.addedCount) || 0);
    const skippedText = formatNumber(Number(data.skippedCount) || 0);
    const failedFiles = Array.isArray(data.failedFiles)
      ? data.failedFiles
          .map((item) => {
            if (typeof item === "string") return item.trim();
            return String(item?.fileName || "").trim();
          })
          .filter(Boolean)
      : [];
    const failedNotice = failedFiles.length
      ? `, 형식 오류 제외 ${formatNumber(failedFiles.length)}개 (${failedFiles.join(", ")})`
      : "";
    setStatus(`생산량 기입 완료: 추가 ${addedText}건, 중복 제외 ${skippedText}건${failedNotice}`);
    return;
  }
  const message = data.message ? String(data.message) : "생산량 기입에 실패했습니다.";
  setStatus(message, true);
}

function initializeStoredExportPanel() {
  if (!dom.storedSection) return;
  if (!window.parent || window.parent === window) {
    if (dom.downloadStoredBtn) dom.downloadStoredBtn.disabled = true;
    if (dom.refreshStoredBtn) dom.refreshStoredBtn.disabled = true;
    return;
  }
  refreshStoredRowsFromParent(false);
}

async function refreshStoredRowsFromParent(showNotice = true) {
  try {
    const payload = await requestStoredRowsViaBridge();
    state.storedRows = normalizeStoredRowsPayload(payload.rows);
    state.storedTeams = normalizeStoredTeamList(payload.teams, state.storedRows);
    populateStoredTeamOptions();
    applyStoredDateRangeDefaults();
    if (showNotice) {
      setStatus(`기입데이터 갱신: ${formatNumber(state.storedRows.length)}건`);
    }
  } catch (error) {
    if (showNotice) {
      setStatus(`기입데이터 조회 실패: ${error.message || "알 수 없는 오류"}`, true);
    }
  }
}

function requestStoredRowsViaBridge() {
  return new Promise((resolve, reject) => {
    if (!window.parent || window.parent === window) {
      reject(new Error("KPI 연동 화면에서만 조회할 수 있습니다."));
      return;
    }
    const requestId = `kpi_stored_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("기입데이터 응답 시간이 초과되었습니다."));
    }, 10000);

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };

    const onMessage = (event) => {
      const data = event?.data;
      if (!data || data.type !== "kpi-production-stored-data-response") return;
      if (String(data.requestId || "") !== requestId) return;
      cleanup();
      if (!data.ok) {
        reject(new Error(String(data.message || "기입데이터 조회 실패")));
        return;
      }
      resolve({
        rows: Array.isArray(data.rows) ? data.rows : [],
        teams: Array.isArray(data.teams) ? data.teams : [],
      });
    };

    window.addEventListener("message", onMessage);
    try {
      window.parent.postMessage(
        {
          type: "kpi-production-stored-data-request",
          requestId,
        },
        "*",
      );
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

function normalizeStoredRowsPayload(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const dedupe = new Set();
  const normalizedRows = [];
  for (const row of list) {
    const parsedDate = parseDateText(row?.date);
    const amount = parseProductionValue(row?.amount ?? row?.production ?? row?.value);
    const team = String(row?.team ?? "").trim();
    const lineName = String(row?.lineName ?? row?.line ?? "").trim();
    const productName = String(row?.productName ?? row?.product ?? row?.itemName ?? "").trim();
    if (!parsedDate || amount === null || !team) continue;
    const date = formatYmd(parsedDate);
    const key = [
      date,
      team.toLowerCase(),
      lineName.toLowerCase(),
      productName.toLowerCase(),
      String(amount),
    ].join("|");
    if (dedupe.has(key)) continue;
    dedupe.add(key);
    normalizedRows.push({
      date,
      team,
      lineName,
      productName,
      amount,
    });
  }
  normalizedRows.sort((a, b) => {
    const dateDiff = String(a.date).localeCompare(String(b.date), "ko");
    if (dateDiff !== 0) return dateDiff;
    const teamDiff = String(a.team).localeCompare(String(b.team), "ko");
    if (teamDiff !== 0) return teamDiff;
    const lineDiff = String(a.lineName).localeCompare(String(b.lineName), "ko");
    if (lineDiff !== 0) return lineDiff;
    return String(a.productName).localeCompare(String(b.productName), "ko");
  });
  return normalizedRows;
}

function normalizeStoredTeamList(teams, rows) {
  const set = new Set();
  (Array.isArray(teams) ? teams : []).forEach((team) => {
    const value = String(team || "").trim();
    if (value) set.add(value);
  });
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const value = String(row?.team || "").trim();
    if (value) set.add(value);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ko"));
}

function populateStoredTeamOptions() {
  if (!dom.storedTeamSelect) return;
  const previous = String(dom.storedTeamSelect.value || "ALL");
  dom.storedTeamSelect.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "ALL";
  allOption.textContent = "전체 팀";
  dom.storedTeamSelect.appendChild(allOption);
  for (const team of state.storedTeams) {
    const option = document.createElement("option");
    option.value = team;
    option.textContent = team;
    dom.storedTeamSelect.appendChild(option);
  }
  const exists = previous === "ALL" || state.storedTeams.includes(previous);
  dom.storedTeamSelect.value = exists ? previous : "ALL";
}

function applyStoredDateRangeDefaults() {
  if (!dom.storedStartDate || !dom.storedEndDate) return;
  if (!state.storedRows.length) {
    if (!dom.storedStartDate.value) dom.storedStartDate.value = "";
    if (!dom.storedEndDate.value) dom.storedEndDate.value = "";
    return;
  }
  const dates = state.storedRows.map((row) => String(row.date || "")).filter(Boolean);
  if (!dates.length) return;
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  if (!dom.storedStartDate.value) dom.storedStartDate.value = minDate;
  if (!dom.storedEndDate.value) dom.storedEndDate.value = maxDate;
}

function sanitizeFileNameToken(value, fallback = "전체팀") {
  const raw = String(value || "").trim() || fallback;
  return raw.replace(/[\\/:*?"<>|]/g, "_");
}

async function handleDownloadStoredRows() {
  if (!window.parent || window.parent === window) {
    setStatus("KPI 연동 화면에서만 기입데이터 추출이 가능합니다.", true);
    return;
  }
  if (!dom.downloadStoredBtn) return;

  dom.downloadStoredBtn.disabled = true;
  if (dom.refreshStoredBtn) dom.refreshStoredBtn.disabled = true;
  try {
    const payload = await requestStoredRowsViaBridge();
    state.storedRows = normalizeStoredRowsPayload(payload.rows);
    state.storedTeams = normalizeStoredTeamList(payload.teams, state.storedRows);
    populateStoredTeamOptions();
    applyStoredDateRangeDefaults();

    if (!state.storedRows.length) {
      setStatus("기입된 생산량 데이터가 없습니다.", true);
      return;
    }

    const startDate = String(dom.storedStartDate?.value || "").trim();
    const endDate = String(dom.storedEndDate?.value || "").trim();
    const selectedTeam = String(dom.storedTeamSelect?.value || "ALL");
    const parsedStart = parseDateText(startDate);
    const parsedEnd = parseDateText(endDate);
    if (!parsedStart || !parsedEnd) {
      setStatus("시작일/종료일을 입력해주세요.", true);
      return;
    }
    const safeStart = formatYmd(parsedStart);
    const safeEnd = formatYmd(parsedEnd);
    if (safeStart > safeEnd) {
      setStatus("시작일은 종료일보다 늦을 수 없습니다.", true);
      return;
    }

    const filteredRows = state.storedRows.filter((row) => {
      const date = String(row.date || "");
      if (!date || date < safeStart || date > safeEnd) return false;
      if (selectedTeam !== "ALL" && String(row.team || "") !== selectedTeam) return false;
      return true;
    });
    if (!filteredRows.length) {
      setStatus("선택한 기간/팀 조건에 맞는 기입데이터가 없습니다.", true);
      return;
    }

    const teamLabel = selectedTeam === "ALL" ? "전체팀" : selectedTeam;
    const fileName = `생산량기입데이터_${safeStart.replaceAll("-", "")}_${safeEnd.replaceAll("-", "")}_${sanitizeFileNameToken(teamLabel)}.xlsx`;
    exportStoredRowsToXlsx(filteredRows, fileName, {
      startDate: safeStart,
      endDate: safeEnd,
      teamLabel,
    });
    setStatus(`기입데이터 엑셀 추출 완료: ${fileName}`);
  } catch (error) {
    setStatus(`기입데이터 추출 실패: ${error.message || "알 수 없는 오류"}`, true);
  } finally {
    dom.downloadStoredBtn.disabled = false;
    if (dom.refreshStoredBtn) dom.refreshStoredBtn.disabled = false;
  }
}

function exportStoredRowsToXlsx(rows, fileName, options = {}) {
  const resultAoa = [["생산일자", "팀", "라인명", "품명", "생산량"]];
  for (const row of rows) {
    resultAoa.push([
      String(row.date || ""),
      String(row.team || ""),
      String(row.lineName || ""),
      String(row.productName || ""),
      Number(row.amount) || 0,
    ]);
  }
  const resultSheet = XLSX.utils.aoa_to_sheet(resultAoa);
  resultSheet["!cols"] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
  ];

  const sum = rows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0);
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["생성일시", new Date().toLocaleString("ko-KR")],
    ["시작일", String(options.startDate || "")],
    ["종료일", String(options.endDate || "")],
    ["팀", String(options.teamLabel || "전체팀")],
    ["건수", rows.length],
    ["생산량 합계", sum],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, resultSheet, "기입데이터");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "요약");
  XLSX.writeFile(workbook, fileName);
}

function downloadFilteredRows() {
  if (state.filteredRows.length === 0) {
    setStatus("다운로드할 데이터가 없습니다.", true);
    return;
  }

  const safePeriod = getSelectedPeriodText().replace(/[\\/:*?"<>|]/g, "_");
  const safeTeam = getSelectedTeamText().replace(/[\\/:*?"<>|]/g, "_");
  const safeLine = getSelectedLineText().replace(/[\\/:*?"<>|]/g, "_");
  exportRowsToXlsx(state.filteredRows, `생산량추출_${safePeriod}_${safeTeam}_${safeLine}.xlsx`);
}

function downloadAllRows() {
  if (state.rows.length === 0) {
    setStatus("다운로드할 데이터가 없습니다.", true);
    return;
  }
  exportRowsToXlsx(state.rows, "생산량추출_전체.xlsx");
}

function exportRowsToXlsx(rows, fileName) {
  const aoa = [];
  aoa.push(["추출 기준", "A/B/C/E/F 열, 날짜 원본값 유지, 월 기준 1일~말일 분류"]);
  aoa.push(["선택 월", getSelectedPeriodText()]);
  aoa.push(["선택 팀", getSelectedTeamText()]);
  aoa.push(["선택 라인", getSelectedLineText()]);
  aoa.push(["정렬", getSelectedSortText()]);
  aoa.push(["생산 기간", getDateRangeLabel(rows)]);
  aoa.push(["중복 제거", `${formatNumber(state.duplicateRemovedCount)}건`]);
  aoa.push([]);
  aoa.push(state.headers);

  for (const row of rows) {
    aoa.push(row.values.map((value) => normalizeValue(value)));
  }

  const resultSheet = XLSX.utils.aoa_to_sheet(aoa);
  resultSheet["!cols"] = state.headers.map((header, index) => {
    const base = String(header).length + 6;
    const longCol = index === PRODUCTION_VALUE_INDEX ? 30 : 14;
    return { wch: Math.max(base, longCol) };
  });

  const stats = computeProductionStats(rows);
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["생성일시", new Date().toLocaleString("ko-KR")],
    ["행 수", rows.length],
    ["생산 기간", getDateRangeLabel(rows)],
    ["중복 제거", state.duplicateRemovedCount],
    ["생산량 합계", stats.sum],
    ["생산량 평균", stats.avg === null ? "" : stats.avg],
  ]);

  const monthSummaryAoa = [["월", "데이터 행", "생산량 합계", "생산량 평균"]];
  for (const summary of state.periodSummaries) {
    monthSummaryAoa.push([
      summary.label,
      summary.rowCount,
      summary.sum,
      summary.avg === null ? "" : summary.avg,
    ]);
  }
  const monthSummarySheet = XLSX.utils.aoa_to_sheet(monthSummaryAoa);

  const teamSummaryAoa = [["팀", "데이터 행", "생산 기간", "생산량 합계", "생산량 평균"]];
  for (const summary of state.teamSummaries) {
    teamSummaryAoa.push([
      summary.team,
      summary.rowCount,
      summary.rangeLabel,
      summary.sum,
      summary.avg === null ? "" : summary.avg,
    ]);
  }
  const teamSummarySheet = XLSX.utils.aoa_to_sheet(teamSummaryAoa);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, resultSheet, "추출결과");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "요약");
  XLSX.utils.book_append_sheet(workbook, monthSummarySheet, "월별요약");
  XLSX.utils.book_append_sheet(workbook, teamSummarySheet, "팀별요약");
  XLSX.writeFile(workbook, fileName);

  setStatus(`다운로드 완료: ${fileName}`);
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

function clearExtractedState() {
  state.headers = TARGET_COLS.map((col) => `${col}열`);
  state.rows = [];
  state.filteredRows = [];
  state.fileSummaries = [];
  state.periodSummaries = [];
  state.teamSummaries = [];
  state.selectedPeriod = "ALL";
  state.selectedTeam = "ALL";
  state.selectedLine = "ALL";
  state.sortKey = "date_asc";
  state.search = "";
  state.dateRangeLabel = "-";
  state.duplicateRemovedCount = 0;
  state.failedFiles = [];

  if (dom.searchInput) dom.searchInput.value = "";
  if (dom.sortSelect) dom.sortSelect.value = "date_asc";

  populatePeriodOptions();
  populateTeamOptions();
  populateLineOptions();
  refreshDerivedViews();
  renderAll();
  if (isEmbedMode) setEmbedDataSectionsVisible(false);
}
