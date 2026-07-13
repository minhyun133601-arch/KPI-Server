(function registerKpiReportDeckAdapterExportDom(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function cleanReportDeckExportSlide(slide, isActive = false, sourceSlide = null, editorRoot = null) {
        slide?.classList?.toggle?.('is-active', isActive === true);
        slide?.setAttribute?.('aria-hidden', isActive === true ? 'false' : 'true');
        Array.from(slide?.querySelectorAll?.('[contenteditable]') || []).forEach(element => {
            element.removeAttribute?.('contenteditable');
            element.removeAttribute?.('spellcheck');
        });
        Array.from(slide?.querySelectorAll?.('.report-plan-image-choice, .report-plan-count-control, .report-safety-add-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear]') || []).forEach(element => {
            element.remove?.();
        });
        parts.applyReportDeckPreparedOutputState(slide, sourceSlide, editorRoot);
    }

    function buildReportDeckExportNav(doc, slides = []) {
        const nav = doc.createElement('div');
        nav.className = 'report-slide-nav';
        slides.forEach((slide, index) => {
            const button = doc.createElement('button');
            button.type = 'button';
            button.dataset.reportSlideTarget = String(index);
            button.classList?.toggle?.('is-active', index === 0);
            button.setAttribute?.('aria-current', index === 0 ? 'page' : 'false');
            const number = doc.createElement('span');
            number.textContent = String(index + 1).padStart(2, '0');
            const label = doc.createElement('strong');
            label.textContent = String(slide?.dataset?.reportSlideLabel || slide?.querySelector?.('[data-report-field$="Title"]')?.textContent || `${index + 1}`).trim();
            button.appendChild(number);
            button.appendChild(label);
            nav.appendChild(button);
        });
        return nav;
    }

    function buildReportDeckExportViewer(doc, editorRoot, slides = [], options = {}) {
        const deck = doc.createElement('main');
        deck.className = 'report-deck-editor report-export-viewer';
        deck.dataset.reportExportViewer = 'true';
        deck.dataset.reportEditMode = 'view';
        if (editorRoot?.dataset?.reportActiveView) {
            deck.dataset.reportActiveView = editorRoot.dataset.reportActiveView;
        }
        deck.dataset.reportActiveSlide = '0';

        const toolbar = doc.createElement('div');
        toolbar.className = 'report-deck-toolbar';
        toolbar.innerHTML = `
            <div class="report-deck-title">
                <strong>보고서</strong>
                <span data-report-slide-counter>1 / ${slides.length}</span>
            </div>
            <div class="report-deck-actions">
                <span class="report-deck-save-message" data-report-export-status aria-live="polite"></span>
                ${options.includeCaptureButton === false ? '' : '<button type="button" class="report-deck-action-button" data-report-export-capture-zip>캡쳐</button>'}
                <button type="button" class="report-deck-action-button" data-report-export-fullscreen>전체화면</button>
            </div>
        `;

        const workspace = doc.createElement('div');
        workspace.className = 'report-deck-workspace';

        const sidebar = doc.createElement('aside');
        sidebar.className = 'report-deck-sidebar';
        sidebar.setAttribute('aria-label', '보고서 목차');
        const sidebarTitle = doc.createElement('strong');
        sidebarTitle.textContent = '목차';
        sidebar.appendChild(sidebarTitle);
        sidebar.appendChild(buildReportDeckExportNav(doc, slides));

        const stage = doc.createElement('section');
        stage.className = 'report-deck-stage';
        stage.dataset.reportStage = '';
        stage.setAttribute('aria-label', '보고서 슬라이드');
        stage.tabIndex = 0;
        slides.forEach((slide, index) => {
            const clone = slide.cloneNode(true);
            cleanReportDeckExportSlide(clone, index === 0, slide, editorRoot);
            stage.appendChild(clone);
        });

        workspace.appendChild(sidebar);
        workspace.appendChild(stage);
        deck.appendChild(toolbar);
        deck.appendChild(workspace);
        return deck;
    }

    function getReportDeckPrintableSlides(editorRoot) {
        const slides = Array.from(editorRoot?.querySelectorAll?.('[data-report-slide-page]') || [])
            .filter(slide => slide.hidden !== true && String(slide?.dataset?.reportSlidePage || '') !== '-1');
        const preparedSlides = slides.filter(slide => String(slide?.dataset?.reportPrintVisible || '') === 'true');
        return preparedSlides.length ? preparedSlides : slides;
    }

    function normalizeReportDeckCapturePageRange(value, total) {
        const max = Math.max(1, Number.parseInt(String(total ?? '1'), 10) || 1);
        const startRaw = Number.parseInt(String(value?.start ?? '1'), 10);
        const endRaw = Number.parseInt(String(value?.end ?? max), 10);
        const start = Math.max(1, Math.min(max, Number.isInteger(startRaw) ? startRaw : 1));
        const end = Math.max(1, Math.min(max, Number.isInteger(endRaw) ? endRaw : max));
        return {
            start: Math.min(start, end),
            end: Math.max(start, end)
        };
    }

    function getReportDeckCaptureSelection(editorRoot, options = {}) {
        const slides = getReportDeckPrintableSlides(editorRoot);
        const range = normalizeReportDeckCapturePageRange(options.pageRange, slides.length);
        return {
            slides: slides.slice(range.start - 1, range.end),
            pageNumbers: Array.from({ length: Math.max(0, range.end - range.start + 1) }, (_item, index) => range.start + index),
            start: range.start,
            end: range.end,
            total: slides.length
        };
    }

    function buildReportDeckPrintOnlyCss() {
        return `
            @page { size: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} ${parts.REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0; }
            * { box-sizing: border-box; scrollbar-width: none !important; -ms-overflow-style: none !important; }
            *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
            html, body { width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH}; min-height: ${parts.REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body.report-print-body { font-family: Arial, "Malgun Gothic", sans-serif; }
            .report-print-viewer { display: block !important; width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
            .report-print-page { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: ${parts.REPORT_DECK_PRINT_PAGE_HEIGHT} !important; margin: 0 !important; padding: ${parts.REPORT_DECK_PRINT_PAGE_MARGIN} !important; overflow: hidden !important; background: #ffffff !important; break-after: page; page-break-after: always; }
            .report-print-page:last-child, .report-print-page[data-report-print-last="true"] { break-after: auto; page-break-after: auto; }
            .report-print-slide-frame { position: relative !important; flex: 0 0 auto !important; width: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: 100% !important; max-height: 100% !important; margin: 0 auto !important; padding: 0 !important; overflow: hidden !important; background: #ffffff !important; }
            .report-print-slide-image { display: block !important; width: 100% !important; height: 100% !important; object-fit: contain !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: #ffffff !important; }
            .report-print-viewer .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: 100% !important; max-height: 100% !important; aspect-ratio: auto !important; border: 0 !important; box-shadow: none !important; break-after: auto !important; page-break-after: auto !important; overflow: hidden !important; background: #ffffff !important; }
            .report-print-viewer .report-plan-image-choice,
            .report-print-viewer .report-plan-count-control,
            .report-print-viewer .report-safety-add-control,
            .report-print-viewer .report-slide-date-input,
            .report-print-viewer .report-chart-highlight-controls,
            .report-print-viewer .report-chart-highlight-toggle,
            .report-print-viewer .report-chart-highlight-reset,
            .report-print-viewer [data-report-plan-image-input],
            .report-print-viewer [data-report-plan-image-clear],
            .report-print-viewer [data-report-export-print],
            .report-print-viewer [data-report-export-fullscreen],
            .report-print-viewer [data-report-fullscreen],
            .report-print-viewer [data-report-edit-toggle],
            .report-print-viewer [data-report-memo-overview-toggle],
            .report-print-viewer [data-report-print-pdf],
            .report-print-viewer [data-report-capture-zip],
            .report-print-viewer [data-report-capture-pdf],
            .report-print-viewer [data-report-export-html],
            .report-print-viewer .report-memo-overview-dialog { display: none !important; }
            .report-print-viewer img:not([src]),
            .report-print-viewer img[src=""] { visibility: hidden !important; }
            .report-print-viewer [data-report-field] { outline: 0 !important; }
        `;
    }

    function buildReportDeckPrintViewer(doc, slides = []) {
        const deck = doc.createElement('main');
        deck.className = 'report-print-viewer';
        deck.dataset.reportPrintViewer = 'true';
        slides.forEach((slide, index) => {
            const page = doc.createElement('section');
            page.className = 'report-print-page';
            page.dataset.reportPrintPage = String(index + 1);
            const frame = doc.createElement('div');
            frame.className = 'report-print-slide-frame';
            const image = doc.createElement('img');
            image.className = 'report-print-slide-image';
            image.alt = String(slide?.dataset?.reportSlideLabel || `report slide ${index + 1}`).trim();
            image.src = slide?.dataUrl || '';
            if (index === slides.length - 1) {
                page.dataset.reportPrintLast = 'true';
            }
            frame.appendChild(image);
            page.appendChild(frame);
            deck.appendChild(page);
        });
        return deck;
    }

    function normalizeReportDeckCaptureViewport(size = {}) {
        const width = Math.max(320, Math.min(4096, Number.parseInt(String(size.width ?? ''), 10) || parts.REPORT_DECK_CAPTURE_SLIDE_WIDTH));
        const height = Math.max(320, Math.min(4096, Number.parseInt(String(size.height ?? ''), 10) || parts.REPORT_DECK_CAPTURE_SLIDE_HEIGHT));
        return { width, height };
    }

    function getReportDeckCaptureViewport() {
        const screenWidth = Number.parseInt(String(root.screen?.width ?? ''), 10) || 0;
        const screenHeight = Number.parseInt(String(root.screen?.height ?? ''), 10) || 0;
        const innerWidth = Number.parseInt(String(root.innerWidth ?? ''), 10) || 0;
        const innerHeight = Number.parseInt(String(root.innerHeight ?? ''), 10) || 0;
        return normalizeReportDeckCaptureViewport({
            width: screenWidth || innerWidth || parts.REPORT_DECK_CAPTURE_SLIDE_WIDTH,
            height: screenHeight || innerHeight || parts.REPORT_DECK_CAPTURE_SLIDE_HEIGHT
        });
    }

    function buildReportDeckCaptureCss(viewport = {}) {
        const capture = normalizeReportDeckCaptureViewport(viewport);
        const slideWidth = Math.min(capture.width, Math.round(capture.height * 16 / 9));
        const slideHeight = Math.round(slideWidth * 9 / 16);
        return `
            html, body { margin: 0 !important; padding: 0 !important; width: ${capture.width}px !important; height: ${capture.height}px !important; overflow: hidden !important; background: #111827 !important; }
            .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: 0 !important; top: 0 !important; width: ${slideWidth}px !important; height: ${slideHeight}px !important; max-width: none !important; min-width: 0 !important; min-height: 0 !important; aspect-ratio: 16 / 9 !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; overflow: hidden !important; background: #ffffff !important; }
            .report-slide.is-active { display: block !important; }
            .report-plan-image-choice, .report-plan-count-control, .report-safety-add-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-export-print], [data-report-export-fullscreen], [data-report-fullscreen], [data-report-edit-toggle], [data-report-memo-overview-toggle], [data-report-print-pdf], [data-report-capture-zip], [data-report-capture-pdf], [data-report-export-html] { display: none !important; }
            [data-report-field] { outline: 0 !important; }
        `;
    }

    function buildReportDeckCaptureHost(doc, editorRoot, slide, viewport = {}) {
        const capture = normalizeReportDeckCaptureViewport(viewport);
        const host = doc.createElement('div');
        host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        host.style.width = `${capture.width}px`;
        host.style.height = `${capture.height}px`;
        host.style.display = 'grid';
        host.style.placeItems = 'center';
        host.style.margin = '0';
        host.style.padding = '0';
        host.style.overflow = 'hidden';
        host.style.background = '#111827';

        const style = doc.createElement('style');
        style.textContent = `${parts.getReportDeckExportStyleText(editorRoot)}\n${buildReportDeckCaptureCss(capture)}`;
        host.appendChild(style);

        const clone = slide.cloneNode(true);
        cleanReportDeckExportSlide(clone, true, slide, editorRoot);
        clone.classList?.add?.('is-active');
        clone.removeAttribute?.('hidden');
        clone.setAttribute?.('aria-hidden', 'false');
        clone.dataset.reportPrintVisible = 'true';
        host.appendChild(clone);
        return host;
    }

    async function inlineReportDeckCaptureImages(container) {
        const images = Array.from(container?.querySelectorAll?.('img') || []);
        for (const image of images) {
            const source = image.getAttribute?.('src') || image.src || '';
            if (!String(source || '').trim() || String(source).startsWith('data:')) continue;
            try {
                image.setAttribute?.('src', await parts.fetchReportDeckImageAsDataUrl(source));
            } catch (error) {
                void error;
                image.removeAttribute?.('src');
            }
        }
    }

    async function captureReportDeckSlideImageUrl(editorRoot, slide) {
        const doc = editorRoot?.ownerDocument || root.document || globalScope?.document || null;
        const XMLSerializerCtor = root.XMLSerializer || globalScope?.XMLSerializer;
        const BlobCtor = root.Blob || globalScope?.Blob;
        const urlApi = root.URL || globalScope?.URL;
        if (!doc || typeof doc.createElement !== 'function' || typeof XMLSerializerCtor !== 'function' || typeof BlobCtor !== 'function' || !urlApi?.createObjectURL) {
            throw new Error('report_deck_capture_unavailable');
        }

        const capture = getReportDeckCaptureViewport();
        const host = buildReportDeckCaptureHost(doc, editorRoot, slide, capture);
        await inlineReportDeckCaptureImages(host);
        await doc.fonts?.ready?.catch?.(() => {});
        const serializedHost = new XMLSerializerCtor().serializeToString(host);
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${capture.width}" height="${capture.height}" viewBox="0 0 ${capture.width} ${capture.height}"><foreignObject width="100%" height="100%">${serializedHost}</foreignObject></svg>`;
        return urlApi.createObjectURL(new BlobCtor([svgText], { type: 'image/svg+xml;charset=utf-8' }));
    }

    async function buildReportDeckCapturePageHtml(editorRoot, slide, viewport = {}) {
        const doc = editorRoot?.ownerDocument || root.document || globalScope?.document || null;
        if (!doc || typeof doc.createElement !== 'function') {
            throw new Error('report_deck_capture_document_unavailable');
        }
        const host = buildReportDeckCaptureHost(doc, editorRoot, slide, viewport);
        await inlineReportDeckCaptureImages(host);
        await doc.fonts?.ready?.catch?.(() => {});
        return parts.getNodeOuterHtml(host);
    }

    async function buildReportDeckPrintSnapshots(editorRoot, slides = []) {
        const urlApi = root.URL || globalScope?.URL;
        (Array.isArray(editorRoot?.__reportDeckPrintObjectUrls) ? editorRoot.__reportDeckPrintObjectUrls : []).forEach(objectUrl => {
            try {
                urlApi?.revokeObjectURL?.(objectUrl);
            } catch (error) {
                void error;
            }
        });
        editorRoot.__reportDeckPrintObjectUrls = [];
        const snapshots = [];
        for (const slide of slides) {
            const objectUrl = await captureReportDeckSlideImageUrl(editorRoot, slide);
            editorRoot.__reportDeckPrintObjectUrls.push(objectUrl);
            snapshots.push({
                dataUrl: objectUrl,
                dataset: {
                    reportSlideLabel: slide?.dataset?.reportSlideLabel || ''
                }
            });
        }
        return snapshots;
    }

    async function buildReportDeckPrintHtml(editorRoot, slides = []) {
        const doc = editorRoot?.ownerDocument || root.document || globalScope?.document || null;
        if (!doc || typeof doc.createElement !== 'function') {
            throw new Error('report_deck_print_document_unavailable');
        }
        const snapshots = await buildReportDeckPrintSnapshots(editorRoot, slides);
        const deck = buildReportDeckPrintViewer(doc, snapshots);
        const baseHref = String(doc.baseURI || root.location?.href || globalScope?.location?.href || '').trim();
        return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${baseHref ? `<base href="${parts.escapeHtmlAttribute(baseHref)}">` : ''}
<style>
${parts.getReportDeckExportStyleText(editorRoot)}
${buildReportDeckPrintOnlyCss()}
</style>
</head>
<body class="report-print-body">
${parts.getNodeOuterHtml(deck)}
</body>
</html>`;
    }

    function cleanupReportDeckPrintFrame(frame, editorRoot = null) {
        const objectUrls = Array.isArray(editorRoot?.__reportDeckPrintObjectUrls)
            ? editorRoot.__reportDeckPrintObjectUrls
            : [];
        objectUrls.forEach(objectUrl => {
            try {
                (root.URL || globalScope?.URL)?.revokeObjectURL?.(objectUrl);
            } catch (error) {
                void error;
            }
        });
        if (editorRoot) {
            editorRoot.__reportDeckPrintObjectUrls = [];
        }
        try {
            frame?.remove?.();
        } catch (error) {
            void error;
        }
    }

    function waitReportDeckPrintImages(doc) {
        const images = Array.from(doc?.images || []);
        if (!images.length) return Promise.resolve();
        return Promise.all(images.map(image => {
            const source = image.getAttribute?.('src') || image.currentSrc || image.src || '';
            if (!String(source || '').trim() || image.complete) return Promise.resolve();
            return new Promise(resolve => {
                image.addEventListener?.('load', resolve, { once: true });
                image.addEventListener?.('error', resolve, { once: true });
            });
        }));
    }

    async function inlineReportDeckPrintImages(doc) {
        const images = Array.from(doc?.querySelectorAll?.('img') || []);
        for (const image of images) {
            const source = image.getAttribute?.('src') || image.src || '';
            if (!String(source || '').trim() || String(source).startsWith('data:')) continue;
            try {
                image.setAttribute?.('src', await parts.fetchReportDeckImageAsDataUrl(source));
            } catch (error) {
                void error;
                try {
                    image.setAttribute?.('src', new URL(source, doc?.baseURI || root.location?.href || '').href);
                } catch (urlError) {
                    void urlError;
                }
            }
        }
    }

    function printReportDeckFrame(editorRoot, slides = []) {
        const doc = editorRoot?.ownerDocument || root.document || globalScope?.document || null;
        if (!doc?.body || typeof doc.createElement !== 'function') {
            return false;
        }
        const frame = doc.createElement('iframe');
        frame.setAttribute?.('title', 'report pdf print');
        frame.setAttribute?.('aria-hidden', 'true');
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        frame.style.opacity = '0';
        doc.body.appendChild(frame);

        const frameWindow = frame.contentWindow || null;
        const frameDocument = frame.contentDocument || frameWindow?.document || null;
        if (!frameWindow || !frameDocument || typeof frameWindow.print !== 'function') {
            cleanupReportDeckPrintFrame(frame, editorRoot);
            return false;
        }

        const cleanup = () => cleanupReportDeckPrintFrame(frame, editorRoot);
        const runPrint = async () => {
            try {
                const html = await buildReportDeckPrintHtml(editorRoot, slides);
                frameDocument.open();
                frameDocument.write(html);
                frameDocument.close();
                void frameDocument.body?.offsetHeight;
                await waitReportDeckPrintImages(frameDocument);
                await frameDocument.fonts?.ready?.catch?.(() => {});
                void frameDocument.body?.offsetHeight;
                frameWindow.addEventListener?.('afterprint', cleanup, { once: true });
                root.setTimeout?.(cleanup, 60000);
                frameWindow.focus?.();
                frameWindow.print();
            } catch (error) {
                void error;
                cleanup();
                const fallbackWindow = editorRoot?.ownerDocument?.defaultView || root;
                fallbackWindow?.print?.();
            }
        };
        void runPrint();
        return true;
    }

    async function inlineReportDeckExportImages(container) {
        const images = Array.from(container?.querySelectorAll?.('img') || []);
        for (const image of images) {
            const source = image.getAttribute?.('src') || image.src || '';
            if (!String(source || '').trim()) continue;
            image.setAttribute?.('src', await parts.fetchReportDeckImageAsDataUrl(source));
        }
    }

    function buildReportDeckExportCss() {
        return `
            html, body { margin: 0; width: 100%; height: 100%; min-height: 100%; background: #111827; overflow: hidden; }
            body.report-export-body { font-family: Arial, "Malgun Gothic", sans-serif; }
            .report-export-viewer { width: 100vw; height: 100vh; min-height: 0; grid-template-rows: auto minmax(0, 1fr); gap: 0; background: #111827; }
            .report-export-viewer .report-deck-toolbar { min-height: 40px; }
            .report-export-viewer .report-deck-stage { padding: 0; }
            .report-export-viewer .report-slide { width: min(100%, calc(177.777vh - 86px)); max-width: none; border: 0; box-shadow: none; }
            .report-export-viewer .report-plan-image-choice,
            .report-export-viewer .report-plan-count-control,
            .report-export-viewer .report-safety-add-control,
            .report-export-viewer .report-slide-date-input,
            .report-export-viewer .report-chart-highlight-controls,
            .report-export-viewer .report-chart-highlight-toggle,
            .report-export-viewer .report-chart-highlight-reset,
            .report-export-viewer [data-report-plan-image-input],
            .report-export-viewer [data-report-plan-image-clear] { display: none !important; }
            .report-export-viewer [data-report-field] { outline: 0 !important; }
            .report-export-viewer:fullscreen { width: 100vw; height: 100vh; min-height: 0; grid-template-rows: minmax(0, 1fr); gap: 0; padding: 0; background: #111827; }
            .report-export-viewer:fullscreen .report-deck-toolbar,
            .report-export-viewer:fullscreen .report-deck-sidebar { display: none; }
            .report-export-viewer:fullscreen .report-deck-workspace { height: 100vh; grid-template-columns: minmax(0, 1fr); gap: 0; }
            .report-export-viewer:fullscreen .report-deck-stage { border: 0; border-radius: 0; padding: 0; background: #111827; }
            .report-export-viewer:fullscreen .report-slide { width: min(100vw, 177.777vh); max-width: none; border: 0; box-shadow: none; }
            @media print {
                @page { size: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} ${parts.REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0; }
                * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
                html, body { width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH}; min-height: ${parts.REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0 !important; padding: 0 !important; overflow: visible; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .report-export-viewer { display: block !important; width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; background: #ffffff !important; }
                .report-export-viewer .report-deck-toolbar,
                .report-export-viewer .report-deck-sidebar { display: none !important; }
                .report-export-viewer .report-deck-workspace,
                .report-export-viewer .report-deck-stage { display: block !important; width: ${parts.REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; background: #ffffff !important; overflow: visible !important; }
                .report-export-viewer .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${parts.REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: none !important; aspect-ratio: auto !important; margin: 27.09375mm ${parts.REPORT_DECK_PRINT_PAGE_MARGIN} !important; border: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; overflow: hidden !important; }
                .report-export-viewer .report-slide:last-child { break-after: auto; page-break-after: auto; }
                .report-export-viewer img:not([src]),
                .report-export-viewer img[src=""] { visibility: hidden !important; }
            }
        `;
    }

    Object.assign(parts, {
        cleanReportDeckExportSlide,
        buildReportDeckExportNav,
        buildReportDeckExportViewer,
        getReportDeckPrintableSlides,
        normalizeReportDeckCapturePageRange,
        getReportDeckCaptureSelection,
        buildReportDeckPrintOnlyCss,
        buildReportDeckPrintViewer,
        normalizeReportDeckCaptureViewport,
        getReportDeckCaptureViewport,
        buildReportDeckCaptureCss,
        buildReportDeckCaptureHost,
        inlineReportDeckCaptureImages,
        captureReportDeckSlideImageUrl,
        buildReportDeckCapturePageHtml,
        buildReportDeckPrintSnapshots,
        buildReportDeckPrintHtml,
        cleanupReportDeckPrintFrame,
        waitReportDeckPrintImages,
        inlineReportDeckPrintImages,
        printReportDeckFrame,
        inlineReportDeckExportImages,
        buildReportDeckExportCss
    });
})(globalThis);
