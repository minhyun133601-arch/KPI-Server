import { DEFAULT_ARCHIVE_FOLDER, DEFAULT_START_DAY } from './constants.js';

export function normalizeText(value) {
  return String(value ?? '').trim();
}

export function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numericValue =
    typeof value === 'number'
      ? value
      : Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function normalizeDateKey(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    // PostgreSQL DATE rows can be parsed as local-midnight Date objects.
    // Keep the local calendar day instead of shifting through UTC.
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const text = normalizeText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return '';
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return '';
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }
  const maxDayByMonth = [
    31,
    year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (day > maxDayByMonth[month - 1]) {
    return '';
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function normalizeTimestamp(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  return normalizeText(value);
}

export function clampStartDay(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) {
    return DEFAULT_START_DAY;
  }
  return Math.min(31, Math.max(1, parsed));
}

function normalizeTeamName(value) {
  return normalizeText(value).replace(/\([^)]*\)/g, '').replace(/\s+/g, '');
}

function normalizeDedupeText(value) {
  return normalizeText(value).replace(/\s+/g, ' ').toLowerCase();
}

export function normalizeProductionKind(value) {
  const normalized = normalizeText(value).toLowerCase().replace(/[\s_-]+/g, '');
  if (
    normalized === 'rework' ||
    normalized === 'reprocessed' ||
    normalized === 'reprocessedproduct' ||
    normalized === 'reprocess' ||
    normalized === 'reworkproduct' ||
    normalized === '\uC7AC\uAC00\uACF5' ||
    normalized === '\uC7AC\uAC00\uACF5\uD488'
  ) {
    return 'rework';
  }
  return 'normal';
}

function canonicalizeMetric(value) {
  const numericValue = normalizeNumber(value);
  return Number.isFinite(numericValue) ? String(numericValue) : '';
}

export function buildEntryDedupeKey(entry) {
  const date = normalizeDateKey(entry?.date);
  const amount = canonicalizeMetric(entry?.amount);
  const moistureExcludedYield = canonicalizeMetric(entry?.moistureExcludedYield);
  const workTime = canonicalizeMetric(entry?.workTime ?? entry?.inputTime);
  const operationTime = canonicalizeMetric(entry?.operationTime);
  const equipmentCapa = canonicalizeMetric(entry?.equipmentCapa);
  const equipmentUtilization = canonicalizeMetric(entry?.equipmentUtilization);
  const teamKey = normalizeTeamName(entry?.teamName).toLowerCase();
  if (!date || amount === '' || !teamKey) {
    return '';
  }
  return [
    normalizeProductionKind(
      entry?.productionKind ?? entry?.production_kind ?? entry?.productionType ?? entry?.production_type ?? entry?.kind
    ),
    date,
    teamKey,
    normalizeDedupeText(entry?.lineName),
    normalizeDedupeText(entry?.productCode),
    normalizeDedupeText(entry?.productName),
    amount,
    moistureExcludedYield,
    workTime,
    operationTime,
    equipmentCapa,
    equipmentUtilization,
  ].join('|');
}

export function normalizeEntry(input, fallbackTeamName = '') {
  const date = normalizeDateKey(input?.date);
  const teamName = normalizeText(input?.team ?? input?.teamName ?? fallbackTeamName);
  const amount = normalizeNumber(input?.amount ?? input?.production ?? input?.value);
  if (!date || !teamName || !Number.isFinite(amount)) {
    return null;
  }

  const entry = {
    date,
    teamName,
    lineName: normalizeText(input?.lineName ?? input?.line ?? input?.lineNm),
    productionKind: normalizeProductionKind(
      input?.productionKind ?? input?.production_kind ?? input?.productionType ?? input?.production_type ?? input?.kind
    ),
    productCode: normalizeText(input?.productCode ?? input?.itemCode ?? input?.product_code ?? input?.code),
    productName: normalizeText(input?.productName ?? input?.itemName ?? input?.product),
    amount,
    moistureExcludedYield: normalizeNumber(
      input?.moistureExcludedYield ?? input?.moistureFreeYield ?? input?.yieldExcludingMoisture ?? input?.yieldRate
    ),
    workTime: normalizeNumber(
      input?.workTime ?? input?.inputTime ?? input?.feedTime ?? input?.loadingTime ?? input?.injectionTime
    ),
    operationTime: normalizeNumber(
      input?.operationTime ?? input?.operatingTime ?? input?.runtime ?? input?.runTime ?? input?.operationHours
    ),
    equipmentCapa: normalizeNumber(
      input?.equipmentCapa ?? input?.capa ?? input?.equipmentCapacity
    ),
    equipmentUtilization: normalizeNumber(
      input?.equipmentUtilization ?? input?.operationRate ?? input?.equipmentRate ?? input?.utilizationRate
    ),
    sourceArchiveId: normalizeText(input?.sourceArchiveId),
    sourceFingerprint: normalizeText(input?.sourceFingerprint ?? input?.fingerprint ?? input?.fileFingerprint),
    sourceFileName: normalizeText(input?.sourceFileName ?? input?.fileName),
  };
  entry.dedupeKey = buildEntryDedupeKey(entry);
  return entry.dedupeKey ? entry : null;
}

export function normalizeArchiveYears(years) {
  const set = new Set();
  (Array.isArray(years) ? years : []).forEach((value) => {
    const year = Number(value);
    if (!Number.isFinite(year) || year < 1900 || year > 2999) {
      return;
    }
    set.add(Math.floor(year));
  });
  return [...set].sort((a, b) => b - a);
}

export function normalizeArchiveYearMonths(values) {
  const set = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const text = normalizeText(value);
    const match = /^(\d{4})-(\d{2})$/.exec(text);
    if (!match) {
      return;
    }
    set.add(`${match[1]}-${match[2]}`);
  });
  return [...set].sort((a, b) => b.localeCompare(a, 'ko'));
}

export function normalizeArchiveTeams(teams) {
  const set = new Set();
  (Array.isArray(teams) ? teams : []).forEach((value) => {
    const team = normalizeText(value);
    if (!team) {
      return;
    }
    set.add(team);
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
}

export function buildArchiveFingerprint(fileName, size, lastModified) {
  const safeFileName = normalizeText(fileName).toLowerCase();
  if (!safeFileName) {
    return '';
  }
  const safeSize = Number.isFinite(Number(size)) ? Number(size) : 0;
  const safeLastModified = Number.isFinite(Number(lastModified)) ? Number(lastModified) : 0;
  return `${safeFileName}|${safeSize}|${safeLastModified}`;
}

export function normalizeArchiveMeta(item) {
  if (!isPlainObject(item)) {
    return null;
  }

  const fileName = normalizeText(item.fileName ?? item.name);
  if (!fileName) {
    return null;
  }

  const size = Number.isFinite(Number(item.size)) ? Number(item.size) : 0;
  const lastModified = Number.isFinite(Number(item.lastModified)) ? Number(item.lastModified) : 0;
  const fingerprint =
    normalizeText(item.fingerprint) || buildArchiveFingerprint(fileName, size, lastModified);
  const documentId = normalizeText(item.documentId ?? item.fileId);
  const storage =
    normalizeText(item.storage || (documentId || item.previewUrl || item.downloadUrl ? 'server' : 'local')) ===
    'server'
      ? 'server'
      : 'local';
  const id =
    normalizeText(item.id) ||
    documentId ||
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    fileName,
    size,
    mimeType: normalizeText(item.type) || 'application/octet-stream',
    lastModified,
    savedAt: normalizeTimestamp(item.savedAt) || new Date().toISOString(),
    folderName: normalizeText(item.folder) || DEFAULT_ARCHIVE_FOLDER,
    fingerprint,
    documentId: documentId || (storage === 'server' ? id : ''),
    storage,
    previewUrl: normalizeText(item.previewUrl),
    downloadUrl: normalizeText(item.downloadUrl),
    years: normalizeArchiveYears(item.years),
    yearMonths: normalizeArchiveYearMonths(item.yearMonths),
    teams: normalizeArchiveTeams(item.teams),
  };
}
