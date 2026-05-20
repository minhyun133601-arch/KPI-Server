import { sendJson } from '../lib/http.js';
import { parseBody, requireAuth } from './route-context.js';

const MAX_CAPTURE_PAGES = 40;
const MIN_CAPTURE_EDGE = 320;
const MAX_CAPTURE_EDGE = 4096;
const MAX_CAPTURE_BODY_BYTES = 160 * 1024 * 1024;

const zipCrcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = zipCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateParts(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: (((year - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f)
  };
}

function localHeader(record) {
  const header = Buffer.alloc(30 + record.name.length);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(record.time, 10);
  header.writeUInt16LE(record.date, 12);
  header.writeUInt32LE(record.crc, 14);
  header.writeUInt32LE(record.size, 18);
  header.writeUInt32LE(record.size, 22);
  header.writeUInt16LE(record.name.length, 26);
  header.writeUInt16LE(0, 28);
  record.name.copy(header, 30);
  return header;
}

function centralHeader(record) {
  const header = Buffer.alloc(46 + record.name.length);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(record.time, 12);
  header.writeUInt16LE(record.date, 14);
  header.writeUInt32LE(record.crc, 16);
  header.writeUInt32LE(record.size, 20);
  header.writeUInt32LE(record.size, 24);
  header.writeUInt16LE(record.name.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(record.offset, 42);
  record.name.copy(header, 46);
  return header;
}

function buildZip(entries) {
  const parts = [];
  const centralParts = [];
  const records = [];
  const dos = dosDateParts();
  let offset = 0;

  for (const entry of entries) {
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data || []);
    const record = {
      name: Buffer.from(entry.name, 'utf8'),
      size: data.length,
      crc: crc32(data),
      time: dos.time,
      date: dos.date,
      offset
    };
    const local = localHeader(record);
    parts.push(local, data);
    offset += local.length + data.length;
    records.push(record);
  }

  let centralSize = 0;
  for (const record of records) {
    const central = centralHeader(record);
    centralParts.push(central);
    centralSize += central.length;
  }

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(records.length, 8);
  end.writeUInt16LE(records.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...centralParts, end]);
}

function readCaptureEdge(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(MIN_CAPTURE_EDGE, Math.min(MAX_CAPTURE_EDGE, parsed));
}

function sanitizeZipFileName(value) {
  const normalized = String(value || 'report-capture.zip')
    .trim()
    .replace(/[\\/:*?"<>|\r\n]+/g, '_');
  const fileName = normalized || 'report-capture.zip';
  return fileName.toLowerCase().endsWith('.zip') ? fileName : `${fileName}.zip`;
}

function buildCaptureDocument(pageHtml, width, height) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:;">
<style>
html, body {
  width: ${width}px;
  height: ${height}px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #111827;
}
[data-report-capture-page] {
  display: grid;
  place-items: center;
  width: ${width}px;
  height: ${height}px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #111827;
}
</style>
</head>
<body><main data-report-capture-page>${pageHtml}</main></body>
</html>`;
}

async function loadChromium() {
  const playwright = await import('@playwright/test');
  return playwright.chromium;
}

async function renderCaptureEntries({ pages, width, height }) {
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  const entries = [];
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1
    });
    for (const [index, pageHtml] of pages.entries()) {
      await page.setContent(buildCaptureDocument(pageHtml, width, height), {
        waitUntil: 'load',
        timeout: 30000
      });
      await page.evaluate(() => globalThis.document?.fonts?.ready).catch(() => {});
      const image = await page.locator('[data-report-capture-page]').screenshot({
        type: 'png',
        animations: 'disabled'
      });
      entries.push({
        name: `${index + 1}.png`,
        data: image
      });
    }
  } finally {
    await browser.close().catch(() => {});
  }
  return entries;
}

async function renderCaptureZip(options) {
  return buildZip(await renderCaptureEntries(options));
}

function sendZip(res, fileName, buffer) {
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Length': String(buffer.length),
    'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '_')}"`,
    'Cache-Control': 'no-store'
  });
  res.end(buffer);
}

function sendCaptureImages(res, fileName, entries) {
  const body = JSON.stringify({
    ok: true,
    fileName,
    imageCount: entries.length,
    files: entries.map((entry) => ({
      name: entry.name,
      mimeType: 'image/png',
      dataBase64: entry.data.toString('base64')
    }))
  });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

export async function handleReportDeckCaptureZip(context) {
  const { req, res, auth } = context;
  requireAuth(auth);
  const body = await parseBody(req, MAX_CAPTURE_BODY_BYTES);
  const pages = Array.isArray(body?.pages)
    ? body.pages.map((page) => String(page || '')).filter((page) => page.trim())
    : [];
  if (!pages.length || pages.length > MAX_CAPTURE_PAGES) {
    sendJson(res, 400, {
      ok: false,
      error: 'invalid_capture_pages',
      maxPages: MAX_CAPTURE_PAGES
    });
    return;
  }

  const width = readCaptureEdge(body?.width, 2560);
  const height = readCaptureEdge(body?.height, 1440);
  const fileName = sanitizeZipFileName(body?.fileName);
  if (String(body?.format || '').toLowerCase() === 'images') {
    const entries = await renderCaptureEntries({ pages, width, height });
    sendCaptureImages(res, fileName, entries);
    return;
  }

  const zipBuffer = await renderCaptureZip({ pages, width, height });
  sendZip(res, fileName, zipBuffer);
}
