import { sendJson } from '../lib/http.js';
import { renderCapturePdfFromEntries } from '../lib/capture-pdf.js';
import { buildZip } from '../lib/capture-zip.js';
import { parseBody, requireAuth } from './route-context.js';

const MAX_CAPTURE_PAGES = 40;
const MIN_CAPTURE_EDGE = 320;
const MAX_CAPTURE_EDGE = 4096;
const MAX_CAPTURE_BODY_BYTES = 160 * 1024 * 1024;
const PDF_JPEG_QUALITY = 92;

function readCaptureEdge(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(MIN_CAPTURE_EDGE, Math.min(MAX_CAPTURE_EDGE, parsed));
}

function sanitizeCaptureFileName(value, fallback, extension) {
  const safeFallback = String(fallback || `report-capture${extension}`).trim() || `report-capture${extension}`;
  const safeExtension = String(extension || '').startsWith('.') ? String(extension || '') : `.${extension}`;
  const normalized = String(value || safeFallback)
    .trim()
    .replace(/[\\/:*?"<>|\r\n]+/g, '_');
  const fileName = normalized || safeFallback;
  return fileName.toLowerCase().endsWith(safeExtension.toLowerCase()) ? fileName : `${fileName}${safeExtension}`;
}

function encodeContentDispositionFileName(value) {
  return encodeURIComponent(String(value || '')).replace(/['()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildContentDispositionFallback(value) {
  const fallback = String(value || 'report-capture')
    .replace(/[\x00-\x1F\x7F]+/g, '_')
    .replace(/[^\x20-\x7E]+/g, '_')
    .replace(/[\\/"<>|:;?*]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return fallback || 'report-capture';
}

export function buildCaptureAttachmentContentDisposition(fileName) {
  const safeFileName = String(fileName || 'report-capture').trim() || 'report-capture';
  const fallback = buildContentDispositionFallback(safeFileName);
  const encodedFileName = encodeContentDispositionFileName(safeFileName);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodedFileName}`;
}

function readCapturePageNumber(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(9999, parsed);
}

function resolveCaptureEntryName(pageNumbers, index, extension = '.png') {
  const pageNumber = readCapturePageNumber(Array.isArray(pageNumbers) ? pageNumbers[index] : null, index + 1);
  const safeExtension = String(extension || '').startsWith('.') ? String(extension || '') : `.${extension}`;
  return `${pageNumber}${safeExtension}`;
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

async function renderCaptureEntriesWithBrowser(browser, { pages, width, height, pageNumbers = [], imageType = 'png' }) {
  const entries = [];
  const type = String(imageType || '').toLowerCase() === 'jpeg' ? 'jpeg' : 'png';
  const extension = type === 'jpeg' ? '.jpg' : '.png';
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1
  });
  try {
    for (const [index, pageHtml] of pages.entries()) {
      await page.setContent(buildCaptureDocument(pageHtml, width, height), {
        waitUntil: 'load',
        timeout: 30000
      });
      await page.evaluate('document.fonts && document.fonts.ready').catch(() => {});
      const screenshotOptions = {
        type,
        animations: 'disabled'
      };
      if (type === 'jpeg') {
        screenshotOptions.quality = PDF_JPEG_QUALITY;
      }
      const image = await page.locator('[data-report-capture-page]').screenshot(screenshotOptions);
      entries.push({
        name: resolveCaptureEntryName(pageNumbers, index, extension),
        data: image
      });
    }
  } finally {
    await page.close().catch(() => {});
  }
  return entries;
}

async function renderCaptureEntries(options) {
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  try {
    return await renderCaptureEntriesWithBrowser(browser, options);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function renderCaptureZip(options) {
  return buildZip(await renderCaptureEntries(options));
}

async function renderCapturePdf(options) {
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  try {
    const entries = await renderCaptureEntriesWithBrowser(browser, {
      ...options,
      imageType: 'jpeg'
    });
    return await renderCapturePdfFromEntries(browser, entries, options.width, options.height);
  } finally {
    await browser.close().catch(() => {});
  }
}

function sendZip(res, fileName, buffer) {
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Length': String(buffer.length),
    'Content-Disposition': buildCaptureAttachmentContentDisposition(fileName),
    'Cache-Control': 'no-store'
  });
  res.end(buffer);
}

function sendPdf(res, fileName, buffer) {
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Length': String(buffer.length),
    'Content-Disposition': buildCaptureAttachmentContentDisposition(fileName),
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
  const format = String(body?.format || '').toLowerCase();
  const fileName = sanitizeCaptureFileName(
    body?.fileName,
    format === 'pdf' ? 'report-capture.pdf' : 'report-capture.zip',
    format === 'pdf' ? '.pdf' : '.zip'
  );
  if (format === 'images') {
    const entries = await renderCaptureEntries({ pages, width, height, pageNumbers: body?.pageNumbers });
    sendCaptureImages(res, fileName, entries);
    return;
  }
  if (format === 'pdf') {
    const pdfBuffer = await renderCapturePdf({ pages, width, height, pageNumbers: body?.pageNumbers });
    sendPdf(res, fileName, pdfBuffer);
    return;
  }

  const zipBuffer = await renderCaptureZip({ pages, width, height, pageNumbers: body?.pageNumbers });
  sendZip(res, fileName, zipBuffer);
}
