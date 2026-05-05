(function registerUtilReportSheetWindowShells() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before KPI.util.report.sheet.windows.shells.js');
    }

    const getApi = typeof runtimeAdapter.getApi === 'function'
        ? name => runtimeAdapter.getApi(name)
        : () => null;
    if (getApi('KPIUtilReportSheetWindowShells')) {
        return;
    }

    const runtime = {
        buildUtilSheetDetachedCompareToggleHtml: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return getApi('KPIUtilReportSheetWindowShells');
    }

    function getDocument() {
        return typeof runtimeAdapter.getDocument === 'function' ? runtimeAdapter.getDocument() : null;
    }

    function getUtilSheetDetachedHeadAssetsHtml() {
        const doc = getDocument();
        const head = doc?.head;
        if (!head || typeof head.querySelectorAll !== 'function') return '';
        return Array.from(head.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(node => String(node?.outerHTML || ''))
            .join('');
    }

    function buildUtilSheetDetachedReportShellHtml() {
        const compareToggleHtml = typeof runtime.buildUtilSheetDetachedCompareToggleHtml === 'function'
            ? runtime.buildUtilSheetDetachedCompareToggleHtml('month')
            : '';

        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>유틸리티 보고서</title>
                ${getUtilSheetDetachedHeadAssetsHtml()}
                <style>
                    html, body { height: 100%; }
                    body { margin: 0; overflow: hidden; background: #dbe4f3; color: #0f172a; }
                    .util-sheet-report-detached-shell { height: 100vh; min-height: 100vh; display: grid; grid-template-rows: auto minmax(0, 1fr); background: #dbe4f3; }
                    .util-sheet-report-detached-head { position: sticky; top: 0; z-index: 10; display: flex; align-items: flex-start; justify-content: space-between; gap: 0.9rem; padding: 14px 16px; border-bottom: 1px solid #bfdbfe; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12); cursor: grab; user-select: none; }
                    .util-sheet-report-detached-head.is-window-dragging { cursor: grabbing; }
                    .util-sheet-report-detached-copy { display: grid; gap: 0.2rem; min-width: 0; }
                    .util-sheet-report-detached-kicker { font-size: 0.68rem; font-weight: 900; color: #1d4ed8; letter-spacing: 0.06em; text-transform: uppercase; }
                    .util-sheet-report-detached-title { font-size: 1.04rem; font-weight: 900; color: #0f172a; }
                    .util-sheet-report-detached-sub { font-size: 0.76rem; font-weight: 700; color: #475569; }
                    .util-sheet-report-detached-note { font-size: 0.72rem; font-weight: 700; color: #64748b; line-height: 1.45; }
                    .util-sheet-report-detached-actions { display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }
                    .util-sheet-report-detached-btn { min-height: 34px; border: 1px solid #bfdbfe; background: rgba(255, 255, 255, 0.92); color: #1d4ed8; border-radius: 8px; padding: 0 12px; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.72); }
                    .util-sheet-report-detached-btn:hover { border-color: #60a5fa; background: #ffffff; }
                    .util-sheet-report-detached-btn.is-close { border-color: #fecaca; color: #b91c1c; }
                    .util-sheet-report-detached-btn.is-close:hover { border-color: #f87171; background: #fff1f2; }
                    .util-sheet-report-detached-body { min-height: 0; overflow: auto; overscroll-behavior: contain; display: grid; gap: 0.8rem; padding: 14px; background: #f8fafc; }
                    @media (min-width: 1400px) {
                        .util-sheet-report-detached-body { padding: 16px; gap: 1rem; }
                    }
                </style>
            </head>
            <body>
                <div class="util-sheet-report-detached-shell">
                    <div class="util-sheet-report-detached-head">
                        <div class="util-sheet-report-detached-copy">
                            <div class="util-sheet-report-detached-kicker" data-role="util-sheet-report-detached-kicker">GAS REPORT</div>
                            <div class="util-sheet-report-detached-title" data-role="util-sheet-report-detached-title">보고서</div>
                            <div class="util-sheet-report-detached-sub" data-role="util-sheet-report-detached-sub">기준: -</div>
                            <div class="util-sheet-report-detached-note">팝업 창을 별도 브라우저 창으로 열어 두고 계속 보고서를 확인할 수 있습니다.</div>
                        </div>
                        <div class="util-sheet-report-detached-actions">${compareToggleHtml}</div>
                    </div>
                    <div class="util-sheet-report-detached-body" data-role="util-sheet-report-detached-body">
                        <div class="util-sheet-empty">보고서를 불러오는 중입니다.</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    function buildUtilSheetAnalysisChartPopupShellHtml() {
        return `
            <!doctype html>
            <html lang="ko">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>차트 전체화면</title>
                ${getUtilSheetDetachedHeadAssetsHtml()}
                <style>
                    html, body { height: 100%; }
                    body { margin: 0; overflow: hidden; background: #0f172a; color: #0f172a; }
                    .util-sheet-analysis-chart-popup-shell { height: 100vh; min-height: 100vh; display: grid; grid-template-rows: auto minmax(0, 1fr); background: #e2e8f0; }
                    .util-sheet-analysis-chart-popup-head { position: sticky; top: 0; z-index: 12; display: flex; align-items: flex-start; justify-content: space-between; gap: 0.9rem; padding: 14px 16px; border-bottom: 1px solid rgba(148, 163, 184, 0.45); background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16); }
                    .util-sheet-analysis-chart-popup-copy { display: grid; gap: 0.2rem; min-width: 0; }
                    .util-sheet-analysis-chart-popup-kicker { font-size: 0.68rem; font-weight: 900; color: #1d4ed8; letter-spacing: 0.06em; text-transform: uppercase; }
                    .util-sheet-analysis-chart-popup-title { font-size: 1.08rem; font-weight: 900; color: #0f172a; }
                    .util-sheet-analysis-chart-popup-sub { font-size: 0.76rem; font-weight: 700; color: #475569; }
                    .util-sheet-analysis-chart-popup-actions { display: inline-flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; justify-content: flex-end; }
                    .util-sheet-analysis-chart-popup-btn { min-height: 34px; border: 1px solid #bfdbfe; background: rgba(255, 255, 255, 0.94); color: #1d4ed8; border-radius: 8px; padding: 0 12px; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 800; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.72); }
                    .util-sheet-analysis-chart-popup-btn:hover { border-color: #60a5fa; background: #ffffff; }
                    .util-sheet-analysis-chart-popup-btn.is-close { border-color: #fecaca; color: #b91c1c; }
                    .util-sheet-analysis-chart-popup-btn.is-close:hover { border-color: #f87171; background: #fff1f2; }
                    .util-sheet-analysis-chart-popup-body { min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 12px; background: #f8fafc; }
                    .util-sheet-analysis-chart-popup-content { display: grid; min-height: calc(100vh - 88px); }
                    .util-sheet-analysis-chart-popup-content .util-sheet-analysis-chart-card { min-height: calc(100vh - 112px); }
                    .util-sheet-analysis-chart-popup-content .util-sheet-analysis-chart-surface { min-height: 0; flex: 1 1 auto; }
                    .util-sheet-analysis-chart-popup-content .util-sheet-analysis-chart-frame { min-height: calc(100vh - 238px); height: calc(100vh - 238px); }
                    .util-sheet-analysis-chart-popup-content .util-report-chart-shell { height: 100%; }
                    .util-sheet-analysis-chart-popup-content .util-analytics-chart,
                    .util-sheet-analysis-chart-popup-content .util-analytics-chart-canvas,
                    .util-sheet-analysis-chart-popup-content .util-chart-scroll-shell { min-height: 100%; height: 100%; }
                    .util-sheet-analysis-chart-popup-body .util-sheet-analysis-chart-surface,
                    .util-sheet-analysis-chart-popup-body .util-analytics-chart-canvas { overscroll-behavior-x: contain; scrollbar-gutter: stable both-edges; }
                    .util-sheet-analysis-chart-popup-body .util-analytics-chart-canvas { cursor: grab; touch-action: pan-x; }
                    .util-sheet-analysis-chart-popup-body .util-analytics-chart-canvas.is-dragging { cursor: grabbing; }
                    @media (min-width: 1400px) {
                        .util-sheet-analysis-chart-popup-body { padding: 16px; }
                        .util-sheet-analysis-chart-popup-content .util-sheet-analysis-chart-frame { min-height: calc(100vh - 252px); height: calc(100vh - 252px); }
                    }
                </style>
            </head>
            <body>
                <div class="util-sheet-analysis-chart-popup-shell">
                    <div class="util-sheet-analysis-chart-popup-head">
                        <div class="util-sheet-analysis-chart-popup-copy">
                            <div class="util-sheet-analysis-chart-popup-kicker">ANALYSIS CHART</div>
                            <div class="util-sheet-analysis-chart-popup-title" data-role="util-sheet-analysis-chart-popup-title">차트 전체화면</div>
                            <div class="util-sheet-analysis-chart-popup-sub" data-role="util-sheet-analysis-chart-popup-sub">그래프를 크게 보는 창입니다.</div>
                        </div>
                        <div class="util-sheet-analysis-chart-popup-actions">
                            <button type="button" class="util-sheet-analysis-chart-popup-btn is-close" data-role="util-sheet-analysis-chart-popup-close">
                                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                                <span>닫기</span>
                            </button>
                        </div>
                    </div>
                    <div class="util-sheet-analysis-chart-popup-body" data-role="util-sheet-analysis-chart-popup-body">
                        <div class="util-sheet-empty">차트를 불러오는 중입니다.</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }


    const api = {
        setRuntimeAdapters,
        getUtilSheetDetachedHeadAssetsHtml,
        buildUtilSheetDetachedReportShellHtml,
        buildUtilSheetAnalysisChartPopupShellHtml
    };
    runtimeAdapter.exportApi('KPIUtilReportSheetWindowShells', api);
})();
