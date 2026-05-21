"use strict";

(function attachProductionExtractorImportParsing(globalScope) {
  const SUPPLEMENTAL_DEDUPE_COLS = {
    regularWorkers: "G",
    contractWorkers: "H",
    moistureExcludedYield: "N",
    workTime: "J",
    operationTime: "L",
    equipmentCapa: "V",
    equipmentUtilization: "W",
    materialStandard: "X",
    materialActual: "Y",
    totalWorkTime: "AG",
    stickEa: "AH",
    laborProductivityEa: "AI",
  };
  const SUPPLEMENTAL_DEDUPE_KEYS = Object.freeze(Object.keys(SUPPLEMENTAL_DEDUPE_COLS));
  const SUPPLEMENTAL_PERCENT_KEYS = new Set(["moistureExcludedYield", "equipmentUtilization"]);
  const HC_RAW_PASTE_COLS = Object.freeze({
    rowNumber: 0,
    date: 1,
    team: 2,
    line: 3,
    productCode: 4,
    productName: 5,
    amount: 8,
    regularWorkers: 10,
    contractWorkers: 11,
    workTime: 14,
    operationTime: 17,
    moistureExcludedYield: 20,
    equipmentCapa: 31,
    equipmentUtilization: 32,
    materialStandard: 34,
    materialActual: 35,
    totalWorkTime: 53,
    stickEa: 58,
    laborProductivityEa: 59,
  });

  function normalizeHeader(text) {
    return String(text || "")
      .toLowerCase()
      .replaceAll(/\s+/g, "")
      .replaceAll(/[._\-()]/g, "");
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

  function isDateFormattedCell(cell) {
    const format = String(cell.z || "").toLowerCase();
    return format.includes("yy") || format.includes("mm") || format.includes("dd");
  }

  function isLikelyExcelDateSerial(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    return value >= 30000 && value <= 80000;
  }

  function getCellDisplayValue(context, worksheet, address) {
    const cell = worksheet[address];
    if (!cell) return "";

    if (cell.v instanceof Date) {
      const displayDate = parseDateText(cell.w, { referenceYear: cell.v.getUTCFullYear() });
      if (displayDate) return formatYmd(displayDate);
      const normalizedDate = normalizeExcelJsDate(cell.v);
      if (normalizedDate) return formatYmd(normalizedDate);
      return formatYmd(cell.v);
    }
    if (typeof cell.v === "number" && isDateFormattedCell(cell)) {
      const parsed = context.XLSX.SSF.parse_date_code(cell.v);
      if (parsed) return formatYmd(new Date(parsed.y, parsed.m - 1, parsed.d));
    }
    if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") return cell.w;
    if (cell.v === undefined || cell.v === null) return "";
    return cell.v;
  }

  function makeCalendarDate(year, month, day) {
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }
    if (year < 1990 || year > 2100) return null;
    return date;
  }

  function normalizeTextYear(value) {
    const year = Number(value);
    if (!Number.isFinite(year)) return null;
    if (String(value).trim().length === 2) return 2000 + year;
    return year;
  }

  function parseDateText(value, options = {}) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!text) return null;

    const yearFirst = text.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (yearFirst) {
      return makeCalendarDate(Number(yearFirst[1]), Number(yearFirst[2]), Number(yearFirst[3]));
    }

    const monthDayYear = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/);
    if (monthDayYear) {
      return makeCalendarDate(
        normalizeTextYear(monthDayYear[3]),
        Number(monthDayYear[1]),
        Number(monthDayYear[2]),
      );
    }

    const referenceYear = Number(options.referenceYear);
    if (!Number.isFinite(referenceYear)) return null;

    const koreanMonthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일?/);
    if (koreanMonthDay) {
      return makeCalendarDate(referenceYear, Number(koreanMonthDay[1]), Number(koreanMonthDay[2]));
    }

    const monthDay = text.match(/\b(\d{1,2})[./-](\d{1,2})\b/);
    if (monthDay) {
      return makeCalendarDate(referenceYear, Number(monthDay[1]), Number(monthDay[2]));
    }

    return null;
  }

  function parseDate(context, cell, fallbackValue) {
    if (cell) {
      if (cell.v instanceof Date) {
        const fromDisplay = parseDateText(cell.w, { referenceYear: cell.v.getUTCFullYear() });
        if (fromDisplay) return fromDisplay;
        const normalizedDate = normalizeExcelJsDate(cell.v);
        if (normalizedDate) return normalizedDate;
        return stripTime(cell.v);
      }

      if (typeof cell.v === "number" && (isDateFormattedCell(cell) || isLikelyExcelDateSerial(cell.v))) {
        const parsed = context.XLSX.SSF.parse_date_code(cell.v);
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

  function applyDateOffset(date, offsetDays) {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
    const safeOffset = Number.isFinite(Number(offsetDays)) ? Number(offsetDays) : 0;
    const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    shifted.setDate(shifted.getDate() + safeOffset);
    return shifted;
  }

  function sanitizeCycleDay(value) {
    const day = Number(value);
    if (!Number.isFinite(day)) return 15;
    return Math.min(31, Math.max(1, Math.floor(day)));
  }

  function getPeriodInfo(_context, date, cycleStartDay) {
    void cycleStartDay;
    const periodStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const key = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
    const label = `${periodStart.getFullYear()}년 ${periodStart.getMonth() + 1}월 (${formatMd(periodStart)}~${formatMd(periodEnd)})`;
    return { key, label, start: periodStart };
  }

  function buildDateRangeLabel(_context, minDate, maxDate) {
    if (!minDate || !maxDate) return "날짜 없음";
    return `${formatYmd(minDate)} ~ ${formatYmd(maxDate)}`;
  }

  function getDateRangeLabel(context, rows) {
    let minDate = null;
    let maxDate = null;
    for (const row of rows) {
      if (!row.dateObj) continue;
      if (!minDate || row.dateObj < minDate) minDate = row.dateObj;
      if (!maxDate || row.dateObj > maxDate) maxDate = row.dateObj;
    }
    return buildDateRangeLabel(context, minDate, maxDate);
  }

  function hasData(values) {
    return values.some((value) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim() !== "";
      return true;
    });
  }

  function canonicalizeValueForDedup(context, value, index) {
    if (index === context.PRODUCTION_VALUE_INDEX) {
      const numeric = context.parseProductionValue(value);
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

  function canonicalizeSupplementalMetricForDedup(context, value) {
    const numeric = context.parseProductionValue?.(value);
    if (Number.isFinite(numeric)) {
      const text = String(value ?? "").trim();
      if (!text.includes("%") && numeric >= 0 && numeric <= 1) return `N:${numeric * 100}`;
      return `N:${numeric}`;
    }
    if (value === null || value === undefined) return "";
    if (typeof value === "number" && Number.isFinite(value)) return `N:${value}`;
    return String(value).trim().replace(/\s+/g, " ").toLowerCase();
  }

  function canonicalizeAmountMetricForDedup(context, value) {
    const numeric = context.parseProductionValue?.(value);
    if (Number.isFinite(numeric)) return `N:${numeric}`;
    if (value === null || value === undefined) return "";
    if (typeof value === "number" && Number.isFinite(value)) return `N:${value}`;
    return String(value).trim().replace(/\s+/g, " ").toLowerCase();
  }

  function buildRowDedupKey(context, row) {
    const values = Array.isArray(row?.values) ? row.values : [];
    const baseKey = values.map((value, index) => canonicalizeValueForDedup(context, value, index));
    for (const key of SUPPLEMENTAL_DEDUPE_KEYS) {
      baseKey.push(
        SUPPLEMENTAL_PERCENT_KEYS.has(key)
          ? canonicalizeSupplementalMetricForDedup(context, row?.[key])
          : canonicalizeAmountMetricForDedup(context, row?.[key]),
      );
    }
    return baseKey.join("||");
  }

  function deduplicateRows(context, rows) {
    const seenKeys = new Set();
    const dedupedRows = [];
    let removedCount = 0;

    for (const row of rows) {
      const key = buildRowDedupKey(context, row);
      if (seenKeys.has(key)) {
        removedCount += 1;
        continue;
      }
      seenKeys.add(key);
      dedupedRows.push(row);
    }

    return { rows: dedupedRows, removedCount };
  }

  function validateTemplateHeaders(context, fileName, sheetName, headers) {
    for (let index = 0; index < context.TARGET_COLS.length; index += 1) {
      const col = context.TARGET_COLS[index];
      const rawHeader = String(headers[index] || "").trim();
      const normalized = normalizeHeader(rawHeader);
      const patterns = context.REQUIRED_HEADER_RULES[col] || [];

      if (normalized === "" || patterns.length === 0) {
        throw new Error(`[${fileName} - ${sheetName}] ${col}${context.HEADER_ROW} 헤더가 비어있습니다.`);
      }

      const isValid = patterns.some((pattern) => pattern.test(normalized));
      if (!isValid) {
        throw new Error(
          `[${fileName} - ${sheetName}] ${col}${context.HEADER_ROW} 헤더 형식이 다릅니다. 현재: "${rawHeader}"`,
        );
      }
    }
  }

  function getColumnIndex(column) {
    const letters = String(column || "")
      .trim()
      .toUpperCase();
    if (!letters) return -1;
    let index = 0;
    for (const char of letters) {
      const code = char.charCodeAt(0);
      if (code < 65 || code > 90) return -1;
      index = index * 26 + (code - 64);
    }
    return index - 1;
  }

  function parseDelimitedTableText(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    const source = String(text || "");

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      const nextChar = source[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && char === "\t") {
        row.push(cell);
        cell = "";
        continue;
      }

      if (!inQuotes && (char === "\n" || char === "\r")) {
        if (char === "\r" && nextChar === "\n") index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    if (cell !== "" || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    if (rows[0]?.[0]) {
      rows[0][0] = String(rows[0][0]).replace(/^\uFEFF/, "");
    }

    return rows;
  }

  function getRowValueByColumn(row, column) {
    const index = getColumnIndex(column);
    if (index < 0 || !Array.isArray(row)) return "";
    return normalizeValue(row[index]);
  }

  function getRowValueByIndex(row, index) {
    if (!Number.isInteger(index) || index < 0 || !Array.isArray(row)) return "";
    return normalizeValue(row[index]);
  }

  function isBlankSupplementalValue(value) {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  }

  function getSupplementalRowValue(sourceRow, columnMap, key) {
    const mappedValue = getRowValueByIndex(sourceRow, columnMap?.[key]);
    if (!isBlankSupplementalValue(mappedValue)) return mappedValue;
    return getRowValueByColumn(sourceRow, SUPPLEMENTAL_DEDUPE_COLS[key]);
  }

  function readSupplementalExcelValues(context, worksheet, rowNumber) {
    return SUPPLEMENTAL_DEDUPE_KEYS.reduce((acc, key) => {
      acc[key] = getCellDisplayValue(context, worksheet, `${SUPPLEMENTAL_DEDUPE_COLS[key]}${rowNumber}`);
      return acc;
    }, {});
  }

  function getTargetValuesFromPastedRow(context, row) {
    return context.TARGET_COLS.map((col) => getRowValueByColumn(row, col));
  }

  function normalizePastedHeaderKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[._\-()<>[\]{}]/g, "");
  }

  function getPastedHeaderKind(value) {
    const key = normalizePastedHeaderKey(value);
    if (!key) return "";
    if (key.includes("\uC778\uC6D0\uC815\uADDC") || key === "regularworkers" || key === "regularworker" || key.includes("regularpersonnel")) return "regularWorkers";
    if (key.includes("\uC778\uC6D0\uC6A9\uC5ED") || key === "contractworkers" || key === "outsourcedworkers" || key.includes("contractpersonnel")) return "contractWorkers";
    if (key.includes("\uCD1D\uC870\uC5C5\uC2DC\uAC04") || key === "totalworktime" || key === "totallaborhours") return "totalWorkTime";
    if (key.includes("\uC6D0\uC7AC\uB8CC") && key.includes("\uD45C\uC900")) return "materialStandard";
    if (key.includes("\uC6D0\uC7AC\uB8CC") && key.includes("\uC2E4\uC801")) return "materialActual";
    if (key.includes("\uC2A4\uD2F1\uC785\uC218\uB7C9") || key === "stickea" || key === "stickcount") return "stickEa";
    if ((key.includes("\uC778\uB2F9\uC0DD\uC0B0\uC131") && key.includes("ea")) || key === "laborproductivityea") return "laborProductivityEa";
    if (key.includes("생산일자") || key === "date" || key.includes("productiondate")) return "date";
    if (key.includes("라인명") || key === "라인" || key === "line" || key.includes("linename")) return "line";
    if (key === "팀" || key.endsWith("팀") || key === "team") return "team";
    if (key.includes("코드") || key === "code" || key.includes("itemcode") || key.includes("productcode")) return "productCode";
    if (key.includes("품명") || key.includes("제품명") || key === "product" || key.includes("productname") || key.includes("itemname")) return "productName";
    if (key.includes("생산량") || key === "amount" || key.includes("productionamount")) return "amount";
    if (key.includes("조업시간") || key === "worktime" || key.includes("inputtime")) return "workTime";
    if (key.includes("가동시간") || key === "operationtime" || key === "runtime" || key === "runtimehours") return "operationTime";
    if (key.includes("수율수분제외") || key.includes("수분제외") || key.includes("moistureexcluded") || key.includes("yield")) return "moistureExcludedYield";
    if (key.includes("설비capa") || key === "capa" || key.includes("equipmentcapa") || key.includes("capacity")) return "equipmentCapa";
    if (key.includes("설비가동율") || key.includes("설비가동률") || key.includes("가동율") || key.includes("가동률") || key.includes("utilization")) return "equipmentUtilization";
    return "";
  }

  function buildPastedColumnMap(row) {
    const map = {};
    (Array.isArray(row) ? row : []).forEach((value, index) => {
      const kind = getPastedHeaderKind(value);
      if (!kind || Number.isInteger(map[kind])) return;
      map[kind] = index;
    });
    return map;
  }

  function hasPastedSemanticHeader(row) {
    const map = buildPastedColumnMap(row);
    return Number.isInteger(map.date)
      && Number.isInteger(map.team)
      && Number.isInteger(map.line)
      && Number.isInteger(map.productName)
      && Number.isInteger(map.amount);
  }

  function getPastedCanonicalValues(context, row, columnMap = null) {
    if (columnMap && Number.isInteger(columnMap.date) && Number.isInteger(columnMap.amount)) {
      const values = new Array(context.TARGET_COLS.length).fill("");
      values[0] = getRowValueByIndex(row, columnMap.date);
      values[context.TEAM_VALUE_INDEX] = getRowValueByIndex(row, columnMap.team);
      values[context.LINE_VALUE_INDEX] = getRowValueByIndex(row, columnMap.line);
      if (Number.isInteger(context.PRODUCT_CODE_VALUE_INDEX)) {
        values[context.PRODUCT_CODE_VALUE_INDEX] = getRowValueByIndex(row, columnMap.productCode);
      }
      if (Number.isInteger(context.PRODUCT_NAME_VALUE_INDEX)) {
        values[context.PRODUCT_NAME_VALUE_INDEX] = getRowValueByIndex(row, columnMap.productName);
      }
      values[context.PRODUCTION_VALUE_INDEX] = getRowValueByIndex(row, columnMap.amount);
      return values;
    }
    return getTargetValuesFromPastedRow(context, row);
  }

  function stripHtmlText(value) {
    return String(value ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim();
  }

  function isPositiveIntegerText(value) {
    return /^[1-9]\d*$/.test(String(value ?? "").trim());
  }

  function isHcRawPastedDataRow(context, row) {
    if (!Array.isArray(row) || row.length <= HC_RAW_PASTE_COLS.laborProductivityEa) return false;
    if (!isPositiveIntegerText(getRowValueByIndex(row, HC_RAW_PASTE_COLS.rowNumber))) return false;
    if (!parsePastedDate(context, getRowValueByIndex(row, HC_RAW_PASTE_COLS.date), null)) return false;
    const amount = getRowValueByIndex(row, HC_RAW_PASTE_COLS.amount);
    const productName = stripHtmlText(getRowValueByIndex(row, HC_RAW_PASTE_COLS.productName));
    if (!productName || productName.includes("==")) return false;
    return !isBlankSupplementalValue(amount);
  }

  function getHcRawPastedCanonicalValues(context, row) {
    const values = new Array(context.TARGET_COLS.length).fill("");
    values[0] = getRowValueByIndex(row, HC_RAW_PASTE_COLS.date);
    values[context.TEAM_VALUE_INDEX] = getRowValueByIndex(row, HC_RAW_PASTE_COLS.team);
    values[context.LINE_VALUE_INDEX] = getRowValueByIndex(row, HC_RAW_PASTE_COLS.line);
    if (Number.isInteger(context.PRODUCT_CODE_VALUE_INDEX)) {
      values[context.PRODUCT_CODE_VALUE_INDEX] = getRowValueByIndex(row, HC_RAW_PASTE_COLS.productCode);
    }
    if (Number.isInteger(context.PRODUCT_NAME_VALUE_INDEX)) {
      values[context.PRODUCT_NAME_VALUE_INDEX] = stripHtmlText(getRowValueByIndex(row, HC_RAW_PASTE_COLS.productName));
    }
    values[context.PRODUCTION_VALUE_INDEX] = getRowValueByIndex(row, HC_RAW_PASTE_COLS.amount);
    return values;
  }

  function getHcRawPastedSupplementalValues(row) {
    return SUPPLEMENTAL_DEDUPE_KEYS.reduce((acc, key) => {
      acc[key] = getRowValueByIndex(row, HC_RAW_PASTE_COLS[key]);
      return acc;
    }, {});
  }

  function isTemplateHeaderRow(context, fileName, sheetName, row) {
    try {
      validateTemplateHeaders(context, fileName, sheetName, getTargetValuesFromPastedRow(context, row));
      return true;
    } catch (_error) {
      return hasPastedSemanticHeader(row);
    }
  }

  function findPastedHeaderRowIndex(context, fileName, sheetName, tableRows) {
    const expectedIndex = Number(context.HEADER_ROW) - 1;
    if (
      Number.isInteger(expectedIndex) &&
      expectedIndex >= 0 &&
      expectedIndex < tableRows.length &&
      isTemplateHeaderRow(context, fileName, sheetName, tableRows[expectedIndex])
    ) {
      return expectedIndex;
    }

    return tableRows.findIndex((row) => hasData(row) && isTemplateHeaderRow(context, fileName, sheetName, row));
  }

  function normalizeReferenceYear(value) {
    const year = Number(value);
    if (!Number.isFinite(year)) return null;
    const normalized = Math.floor(year);
    return normalized >= 1990 && normalized <= 2100 ? normalized : null;
  }

  function parsePastedDate(context, value, referenceYear) {
    const parsedTextDate = parseDateText(value, { referenceYear });
    if (parsedTextDate) return parsedTextDate;

    const numeric = Number(String(value ?? "").trim());
    if (isLikelyExcelDateSerial(numeric) && typeof context.XLSX?.SSF?.parse_date_code === "function") {
      const parsed = context.XLSX.SSF.parse_date_code(numeric);
      if (parsed) return makeCalendarDate(parsed.y, parsed.m, parsed.d);
    }

    return null;
  }

  function getPastedReferenceYear(context, tableRows, dateColumn, options = {}) {
    const requestedYear = normalizeReferenceYear(options.referenceYear);
    if (requestedYear) return requestedYear;

    const columnMap = options.columnMap || null;
    for (const row of tableRows) {
      const value = columnMap && Number.isInteger(columnMap.date)
        ? getRowValueByIndex(row, columnMap.date)
        : getRowValueByColumn(row, dateColumn);
      const parsed = parsePastedDate(context, value, null);
      if (parsed) return parsed.getFullYear();
    }

    return new Date().getFullYear();
  }

  function parsePastedTableText(context, text, options = {}) {
    const fileName = String(options.fileName || "붙여넣기").trim() || "붙여넣기";
    const sheetName = String(options.sheetName || "붙여넣기").trim() || "붙여넣기";
    const tableRows = parseDelimitedTableText(text);
    if (!tableRows.some((row) => hasData(row))) {
      throw new Error("붙여넣은 내용이 비어있습니다.");
    }

    const headerRowIndex = findPastedHeaderRowIndex(context, fileName, sheetName, tableRows);
    const columnMap = headerRowIndex >= 0 ? buildPastedColumnMap(tableRows[headerRowIndex]) : null;
    const hcRawPasteMode = headerRowIndex < 0 && tableRows.some((row) => isHcRawPastedDataRow(context, row));
    if (headerRowIndex < 0 && !hcRawPasteMode) {
      throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC0DD\uC0B0\uB7C9 \uBD99\uC5EC\uB123\uAE30 \uC591\uC2DD\uC785\uB2C8\uB2E4. \uC9C0\uC815\uB41C \uC0DD\uC0B0\uB7C9 \uC591\uC2DD \uB610\uB294 HC \uC6D0\uBCF8 \uD45C\uB9CC \uBD99\uC5EC\uB123\uC5B4 \uC8FC\uC138\uC694.");
    }
    const headerValues = headerRowIndex >= 0
      ? getPastedCanonicalValues(context, tableRows[headerRowIndex], columnMap)
      : context.TARGET_COLS.map((col) => `${col}열`);
    const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
    const dateColumn = context.TARGET_COLS[0] || "A";
    const referenceYear = getPastedReferenceYear(context, tableRows.slice(dataStartIndex), dateColumn, {
      ...options,
      columnMap,
    });
    const rows = [];
    let minDate = null;
    let maxDate = null;

    for (let rowIndex = dataStartIndex; rowIndex < tableRows.length; rowIndex += 1) {
      const sourceRow = tableRows[rowIndex];
      if (hcRawPasteMode && !isHcRawPastedDataRow(context, sourceRow)) continue;
      const values = hcRawPasteMode
        ? getHcRawPastedCanonicalValues(context, sourceRow)
        : getPastedCanonicalValues(context, sourceRow, columnMap);
      if (!hasData(values)) continue;
      if (isTemplateHeaderRow(context, fileName, sheetName, sourceRow)) continue;

      const parsedDate = parsePastedDate(context, values[0], referenceYear);
      const dateObj = applyDateOffset(parsedDate, context.PRODUCTION_DATE_OFFSET_DAYS);
      values[0] = dateObj ? formatYmd(dateObj) : normalizeValue(values[0]);

      const lineValue = normalizeValue(values[context.LINE_VALUE_INDEX]);
      const teamValue = normalizeValue(values[context.TEAM_VALUE_INDEX]);
      values[context.TEAM_VALUE_INDEX] = resolveProductionTeamValue(teamValue, lineValue);
      values[context.LINE_VALUE_INDEX] = lineValue === "" ? "라인 없음" : String(lineValue);
      const productCode = Number.isInteger(context.PRODUCT_CODE_VALUE_INDEX)
        ? normalizeValue(values[context.PRODUCT_CODE_VALUE_INDEX])
        : "";

      const supplementalValues = hcRawPasteMode
        ? getHcRawPastedSupplementalValues(sourceRow)
        : SUPPLEMENTAL_DEDUPE_KEYS.reduce((acc, key) => {
          acc[key] = getSupplementalRowValue(sourceRow, columnMap, key);
          return acc;
        }, {});

      if (dateObj) {
        if (!minDate || dateObj < minDate) minDate = dateObj;
        if (!maxDate || dateObj > maxDate) maxDate = dateObj;
      }

      const periodInfo = dateObj
        ? getPeriodInfo(context, dateObj, options.cycleStartDay)
        : { key: "NO_DATE", label: "날짜 없음", start: null };

      rows.push({
        fileName,
        sheetName,
        rowNumber: rowIndex + 1,
        values,
        productCode,
        ...supplementalValues,
        dateObj,
        teamKey: values[context.TEAM_VALUE_INDEX],
        lineKey: values[context.LINE_VALUE_INDEX],
        periodKey: periodInfo.key,
        periodLabel: periodInfo.label,
        periodStart: periodInfo.start,
      });
    }

    if (!rows.length) {
      throw new Error("붙여넣은 내용에서 기입 가능한 생산량 데이터가 없습니다.");
    }

    return {
      fileName,
      headers: headerValues,
      rows,
      productionRangeLabel: buildDateRangeLabel(context, minDate, maxDate),
      sheetCount: 1,
    };
  }

  async function parseExcelFile(context, file, cycleStartDay) {
    const buffer = await file.arrayBuffer();
    const workbook = context.XLSX.read(buffer, { type: "array", cellDates: true });
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

      const rawHeaders = context.TARGET_COLS.map((col) =>
        String(getCellDisplayValue(context, worksheet, `${col}${context.HEADER_ROW}`) || "").trim(),
      );

      if (rawHeaders.every((header) => header === "")) continue;

      validateTemplateHeaders(context, file.name, sheetName, rawHeaders);

      const displayHeaders = rawHeaders.map(
        (header, index) => header || `${context.TARGET_COLS[index]}열`,
      );
      if (headers.length === 0) {
        headers = displayHeaders;
      }

      const range = context.XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
      const lastRow = range.e.r + 1;

      for (let rowNumber = context.DATA_START_ROW; rowNumber <= lastRow; rowNumber += 1) {
        const values = context.TARGET_COLS.map((col) => getCellDisplayValue(context, worksheet, `${col}${rowNumber}`));
        if (!hasData(values)) continue;
        const supplementalValues = readSupplementalExcelValues(context, worksheet, rowNumber);

        const dateCell = worksheet[`A${rowNumber}`];
        const parsedDate = parseDate(context, dateCell, values[0]);
        const dateObj = applyDateOffset(parsedDate, context.PRODUCTION_DATE_OFFSET_DAYS);
        values[0] = dateObj ? formatYmd(dateObj) : normalizeValue(values[0]);

        const lineValue = normalizeValue(values[context.LINE_VALUE_INDEX]);
        const teamValue = normalizeValue(values[context.TEAM_VALUE_INDEX]);
        values[context.TEAM_VALUE_INDEX] = resolveProductionTeamValue(teamValue, lineValue);
        values[context.LINE_VALUE_INDEX] = lineValue === "" ? "라인 없음" : String(lineValue);
        const productCode = Number.isInteger(context.PRODUCT_CODE_VALUE_INDEX)
          ? normalizeValue(values[context.PRODUCT_CODE_VALUE_INDEX])
          : "";

        if (dateObj) {
          if (!minDate || dateObj < minDate) minDate = dateObj;
          if (!maxDate || dateObj > maxDate) maxDate = dateObj;
        }

        const periodInfo = dateObj
          ? getPeriodInfo(context, dateObj, cycleStartDay)
          : { key: "NO_DATE", label: "날짜 없음", start: null };

        rows.push({
          fileName: file.name,
          sheetName,
          rowNumber,
          values,
          productCode,
          ...supplementalValues,
          dateObj,
          teamKey: values[context.TEAM_VALUE_INDEX],
          lineKey: values[context.LINE_VALUE_INDEX],
          periodKey: periodInfo.key,
          periodLabel: periodInfo.label,
          periodStart: periodInfo.start,
        });
      }

      parsedSheetCount += 1;
    }

    if (parsedSheetCount === 0) {
      throw new Error(`[${file.name}] 형식에 맞는 시트를 찾지 못했습니다. (3행 A/B/C/D/E/F 헤더 확인)`);
    }

    return {
      fileName: file.name,
      headers,
      rows,
      productionRangeLabel: buildDateRangeLabel(context, minDate, maxDate),
      sheetCount: parsedSheetCount,
    };
  }

  globalScope.KPIProductionExtractorImportParsing = {
    applyDateOffset,
    buildDateRangeLabel,
    deduplicateRows,
    formatMd,
    formatYmd,
    getDateRangeLabel,
    getPeriodInfo,
    normalizeValue,
    parseDateText,
    parseExcelFile,
    parsePastedTableText,
    sanitizeCycleDay,
    validateTemplateHeaders,
  };
})(this);
