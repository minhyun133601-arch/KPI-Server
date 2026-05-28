function escapeHtmlAttribute(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function buildCapturePdfDocumentHtml(entries, width, height) {
  const pageWidth = readPositiveInteger(width, 2560);
  const pageHeight = readPositiveInteger(height, 1440);
  const pages = Array.from(entries || [])
    .map((entry, index) => {
      const name = escapeHtmlAttribute(entry?.name || `${index + 1}.jpg`);
      const data = Buffer.isBuffer(entry?.data) ? entry.data : Buffer.from(entry?.data || []);
      const src = `data:image/jpeg;base64,${data.toString('base64')}`;
      return `<section class="capture-pdf-page"><img src="${src}" alt="${name}"></section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<style>
@page {
  size: ${pageWidth}px ${pageHeight}px;
  margin: 0;
}
* {
  box-sizing: border-box;
}
html,
body {
  width: ${pageWidth}px;
  margin: 0;
  padding: 0;
  background: #ffffff;
}
.capture-pdf-page {
  display: block;
  width: ${pageWidth}px;
  height: ${pageHeight}px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  break-after: page;
  page-break-after: always;
}
.capture-pdf-page:last-child {
  break-after: auto;
  page-break-after: auto;
}
.capture-pdf-page img {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  object-fit: fill;
}
</style>
</head>
<body>
${pages}
</body>
</html>`;
}

export async function renderCapturePdfFromEntries(browser, entries, width, height) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1
  });
  try {
    await page.setContent(buildCapturePdfDocumentHtml(entries, width, height), {
      waitUntil: 'load',
      timeout: 30000
    });
    await page.emulateMedia({ media: 'print' });
    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      width: `${width}px`,
      height: `${height}px`,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      scale: 1
    });
  } finally {
    await page.close().catch(() => {});
  }
}
