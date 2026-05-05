const auditLuxDetachedPreviewBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
    ? KpiAuditRecordsBrowserAdapter
    : null;

if (!auditLuxDetachedPreviewBrowser) {
    throw new Error('KpiAuditRecordsBrowserAdapter must load before KPI.audit.records.lux-detached-preview.js');
}

const adapters = {
    escapeHtml: (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
};

    function setRuntimeAdapters(nextAdapters = {}) {
        Object.assign(adapters, nextAdapters);
    }

    function escapePreviewHtml(value) {
        return typeof adapters.escapeHtml === 'function'
            ? adapters.escapeHtml(value)
            : String(value ?? '');
    }

    function buildAuditLuxDetachedPreviewHtml({
        title,
        meta,
        fileLabel,
        viewUrl,
        downloadUrl,
        isPdf,
        rotation
    }) {
        const safeTitle = escapePreviewHtml(title || '조도 스캔본 원본');
        const safeMeta = escapePreviewHtml(meta || '');
        const safeFileLabel = escapePreviewHtml(fileLabel || '첨부 파일');
        const safeViewUrl = escapePreviewHtml(viewUrl || '');
        const safeDownloadUrl = escapePreviewHtml(downloadUrl || viewUrl || '#');
        const mediaHtml = safeViewUrl
            ? (isPdf
                ? `<iframe class="audit-lux-popout-frame" src="${safeViewUrl}" title="${safeTitle}"></iframe>`
                : `<img class="audit-lux-popout-image" src="${safeViewUrl}" alt="${safeTitle}" style="transform: rotate(${Number(rotation || 0)}deg);" />`)
            : '<div class="audit-lux-popout-empty">선택한 연도에 등록된 스캔본이 없습니다.</div>';
        return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Noto Sans KR", sans-serif;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      background: linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
      color: #0f172a;
    }
    .audit-lux-popout-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      border-bottom: 1px solid #dbeafe;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
    }
    .audit-lux-popout-copy {
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .audit-lux-popout-title {
      font-size: 1rem;
      font-weight: 900;
    }
    .audit-lux-popout-meta {
      font-size: 0.8rem;
      color: #475569;
      font-weight: 700;
    }
    .audit-lux-popout-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .audit-lux-popout-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid #bfdbfe;
      background: #ffffff;
      color: #1d4ed8;
      font: inherit;
      font-size: 0.8rem;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
    }
    .audit-lux-popout-stage {
      min-height: 0;
      margin: 18px;
      border-radius: 18px;
      border: 1px solid #dbeafe;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      box-shadow: 0 20px 44px rgba(15, 23, 42, 0.12);
    }
    .audit-lux-popout-image {
      max-width: 100%;
      max-height: calc(100vh - 180px);
      object-fit: contain;
      transform-origin: center center;
    }
    .audit-lux-popout-frame {
      width: 100%;
      min-height: calc(100vh - 180px);
      border: 0;
      background: #ffffff;
    }
    .audit-lux-popout-empty {
      padding: 24px;
      text-align: center;
      color: #64748b;
      font-size: 0.86rem;
      font-weight: 700;
    }
    .audit-lux-popout-foot {
      display: grid;
      gap: 4px;
      padding: 0 18px 18px;
      color: #64748b;
      font-size: 0.78rem;
      line-height: 1.45;
    }
  </style>
</head>
<body>
  <div class="audit-lux-popout-head">
    <div class="audit-lux-popout-copy">
      <div class="audit-lux-popout-title">스캔본 원본</div>
      <div class="audit-lux-popout-meta">${safeMeta}</div>
    </div>
    <div class="audit-lux-popout-actions">
      <a class="audit-lux-popout-btn" href="${safeDownloadUrl}" target="_blank" rel="noopener">원본 열기</a>
      <button type="button" class="audit-lux-popout-btn" onclick="self.close()">닫기</button>
    </div>
  </div>
  <div class="audit-lux-popout-stage">${mediaHtml}</div>
  <div class="audit-lux-popout-foot">
    <span>창 상단을 잡고 다른 모니터로 이동해 원본을 펼쳐둔 채 검침할 수 있습니다.</span>
    <span>${safeFileLabel}</span>
  </div>
</body>
</html>`;
    }

auditLuxDetachedPreviewBrowser.expose('KPIAuditLuxDetachedPreview', {
    setRuntimeAdapters,
    buildAuditLuxDetachedPreviewHtml
});
