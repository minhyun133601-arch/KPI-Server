"use strict";

const TARGET_COLS = ["A", "B", "C", "D", "E", "F"];
const HEADER_ROW = 3;
const DATA_START_ROW = 4;
const TEAM_VALUE_INDEX = 1;
const LINE_VALUE_INDEX = 2;
const PRODUCT_CODE_VALUE_INDEX = 3;
const PRODUCTION_VALUE_INDEX = 5;
const PRODUCTION_DATE_OFFSET_DAYS = 0;
const FIXED_PERIOD_START_DAY = 1;

const REQUIRED_HEADER_RULES = {
  A: [/생산일자/],
  B: [/팀/],
  C: [/라인명/, /라인/],
  D: [/코드/],
  E: [/품명/],
  F: [/생산량/],
};
const browser = typeof ProductionExtractorBrowserAdapter !== "undefined" ? ProductionExtractorBrowserAdapter : null;

const state = {
  headers: TARGET_COLS.map((col) => `${col}열`),
  rows: [],
  filteredRows: [],
  fileSummaries: [],
  periodSummaries: [],
  teamSummaries: [],
  cycleStartDay: FIXED_PERIOD_START_DAY,
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
function requireProductionParsingApi() {
  const api = browser?.getImportParsingApi?.();
  if (api) return api;
  throw new Error("KPIProductionExtractorImportParsing is not loaded.");
}

function getProductionParsingContext() {
  return {
    XLSX,
    TARGET_COLS,
    HEADER_ROW,
    DATA_START_ROW,
    TEAM_VALUE_INDEX,
    LINE_VALUE_INDEX,
    PRODUCT_CODE_VALUE_INDEX,
    PRODUCTION_VALUE_INDEX,
    PRODUCTION_DATE_OFFSET_DAYS,
    REQUIRED_HEADER_RULES,
    parseProductionValue,
  };
}

function requireProductionExportActionsApi() {
  const api = browser?.getExportActionsApi?.();
  if (api) return api;
  throw new Error("KPIProductionExtractorExportActions is not loaded.");
}

function getProductionExportActionsContext() {
  return {
    browserWindow: browser?.getWindowContext?.() || null,
    document,
    XLSX,
    state,
    dom,
    formatNumber,
    parseDateText,
    parseProductionValue,
    formatYmd,
    setStatus,
    getSelectedPeriodText,
    getSelectedTeamText,
    getSelectedLineText,
    getSelectedSortText,
    getDateRangeLabel,
    normalizeValue,
    computeProductionStats,
    PRODUCTION_VALUE_INDEX,
    PRODUCTION_DATE_OFFSET_DAYS,
  };
}

const EMBED_DATA_SECTION_IDS = [
  "metricsSection",
  "periodSummarySection",
  "teamSummarySection",
  "resultTableSection",
  "fileSummarySection",
];
const isEmbedMode = (() => {
  try {
    const params = new URLSearchParams(browser?.getLocationSearch?.() || "");
    if (params.get("embed") === "1") return true;
  } catch (error) {
    // no-op
  }
  return browser?.isEmbeddedWindow?.() === true;
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
  state.cycleStartDay = FIXED_PERIOD_START_DAY;
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
  browser?.addMessageListener?.(handleKpiImportResultMessage);

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
  if (isEmbedMode && browser?.requestParentClose?.() === true) {
    return;
  }
  if (browser?.canGoBack?.() === true) browser?.goBack?.();
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
          const parsed = await parseExcelFile(file, state.cycleStartDay);
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
function buildKpiBridgeRows() {
  const fileMetaMap = buildSourceFileMetaMap();
  return state.rows.map((row) => ({
    date: row.values[0] ?? "",
    team: row.values[TEAM_VALUE_INDEX] ?? "",
    lineName: row.values[LINE_VALUE_INDEX] ?? "",
    productCode: row.values[PRODUCT_CODE_VALUE_INDEX] ?? "",
    productName: row.values[4] ?? "",
    amount: row.values[PRODUCTION_VALUE_INDEX] ?? "",
    moistureExcludedYield: row.moistureExcludedYield ?? "",
    workTime: row.workTime ?? row.inputTime ?? "",
    operationTime: row.operationTime ?? "",
    equipmentCapa: row.equipmentCapa ?? "",
    equipmentUtilization: row.equipmentUtilization ?? "",
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
  if (browser?.canPostToParent?.() !== true) {
    setStatus("KPI 연동 화면에서만 생산량 기입이 가능합니다.", true);
    return;
  }
  const payload = {
    type: "kpi-production-extracted",
    rows: buildKpiBridgeRows(),
    meta: {
      cycleStartDay: state.cycleStartDay,
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
    browser?.postToParent?.(payload, "*");
    setStatus(`생산량 추가 기입 요청: ${formatNumber(state.rows.length)}행 전송 완료`);
  } catch (error) {
    const fallbackPayload = {
      ...payload,
      meta: {
        ...payload.meta,
        sourceFiles: [],
      },
    };
    browser?.postToParent?.(fallbackPayload, "*");
    setStatus(`생산량 추가 기입 요청: ${formatNumber(state.rows.length)}행 전송 완료`);
  }
}

function handleKpiImportResultMessage(event) {
  const data = event?.data;
  if (!data || data.type !== "kpi-production-import-result") return;
  if (data.ok) {
    const addedText = formatNumber(Number(data.addedCount) || 0);
    const skippedText = formatNumber(Number(data.skippedCount) || 0);
    const replacedText = formatNumber(Number(data.replacedCount) || 0);
    const replacedNotice = Number(data.replacedCount) > 0 ? `, 기존 ${replacedText}건 교체` : "";
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
    setStatus(`생산량 기입 완료: ${addedText}건 기입${replacedNotice}, 중복 제외 ${skippedText}건${failedNotice}`);
    return;
  }
  const message = data.message ? String(data.message) : "생산량 기입에 실패했습니다.";
  setStatus(message, true);
}

function initializeStoredExportPanel() {
  return requireProductionExportActionsApi().initializeStoredExportPanel(
    getProductionExportActionsContext(),
  );
}

async function refreshStoredRowsFromParent(showNotice = true) {
  return requireProductionExportActionsApi().refreshStoredRowsFromParent(
    getProductionExportActionsContext(),
    showNotice,
  );
}

async function handleDownloadStoredRows() {
  return requireProductionExportActionsApi().handleDownloadStoredRows(
    getProductionExportActionsContext(),
  );
}

function downloadFilteredRows() {
  return requireProductionExportActionsApi().downloadFilteredRows(
    getProductionExportActionsContext(),
  );
}

function downloadAllRows() {
  return requireProductionExportActionsApi().downloadAllRows(
    getProductionExportActionsContext(),
  );
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
