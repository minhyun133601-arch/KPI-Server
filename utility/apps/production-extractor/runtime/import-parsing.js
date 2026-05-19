"use strict";

(function attachProductionExtractorImportParsing(globalScope) {
  const SUPPLEMENTAL_DEDUPE_COLS = {
    moistureExcludedYield: "N",
    workTime: "J",
    operationTime: "L",
    equipmentCapa: "V",
    equipmentUtilization: "W",
  };

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
    baseKey.push(
      canonicalizeSupplementalMetricForDedup(context, row?.moistureExcludedYield),
      canonicalizeAmountMetricForDedup(context, row?.workTime),
      canonicalizeAmountMetricForDedup(context, row?.operationTime),
      canonicalizeSupplementalMetricForDedup(context, row?.equipmentCapa),
      canonicalizeSupplementalMetricForDedup(context, row?.equipmentUtilization),
    );
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
        const moistureExcludedYield = getCellDisplayValue(
          context,
          worksheet,
          `${SUPPLEMENTAL_DEDUPE_COLS.moistureExcludedYield}${rowNumber}`,
        );
        const workTime = getCellDisplayValue(
          context,
          worksheet,
          `${SUPPLEMENTAL_DEDUPE_COLS.workTime}${rowNumber}`,
        );
        const operationTime = getCellDisplayValue(
          context,
          worksheet,
          `${SUPPLEMENTAL_DEDUPE_COLS.operationTime}${rowNumber}`,
        );
        const equipmentCapa = getCellDisplayValue(
          context,
          worksheet,
          `${SUPPLEMENTAL_DEDUPE_COLS.equipmentCapa}${rowNumber}`,
        );
        const equipmentUtilization = getCellDisplayValue(
          context,
          worksheet,
          `${SUPPLEMENTAL_DEDUPE_COLS.equipmentUtilization}${rowNumber}`,
        );

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
          moistureExcludedYield,
          workTime,
          operationTime,
          equipmentCapa,
          equipmentUtilization,
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
    sanitizeCycleDay,
    validateTemplateHeaders,
  };
})(this);
