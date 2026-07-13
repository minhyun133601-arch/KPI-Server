(function registerKpiReportDeckAdapterExportHtml(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function buildReportDeckExportScript(options = {}) {
        const printOnlyCss = JSON.stringify(parts.buildReportDeckPrintOnlyCss());
        const captureZipDataUrlJson = JSON.stringify(String(options.captureZipDataUrl || '').trim());
        const captureZipFileNameJson = JSON.stringify(String(options.captureZipFileName || 'report-capture.zip').trim() || 'report-capture.zip');
        return `
(() => {
    const root = document.querySelector('[data-report-export-viewer]');
    if (!root) return;
    const slides = Array.from(root.querySelectorAll('[data-report-slide-page]'));
    const buttons = Array.from(root.querySelectorAll('[data-report-slide-target]'));
    const counter = root.querySelector('[data-report-slide-counter]');
    const stage = root.querySelector('[data-report-stage]');
    const status = root.querySelector('[data-report-export-status]');
    const captureButton = root.querySelector('[data-report-export-capture-zip]');
    const embeddedCaptureZipDataUrl = ${captureZipDataUrlJson};
    const embeddedCaptureZipFileName = ${captureZipFileNameJson};
    const getCurrent = () => Math.max(0, Math.min(slides.length - 1, Number.parseInt(root.dataset.reportActiveSlide || '0', 10) || 0));
    const setStatus = (state, text) => {
        if (!status) return;
        status.dataset.state = String(state || 'idle');
        status.textContent = String(text || '');
    };
    const setCaptureBusy = busy => {
        if (busy) {
            root.dataset.reportCaptureBusy = 'true';
        } else {
            delete root.dataset.reportCaptureBusy;
        }
        if (captureButton) {
            captureButton.disabled = Boolean(busy);
            captureButton.setAttribute('aria-busy', busy ? 'true' : 'false');
        }
    };
    const downloadEmbeddedCaptureZip = () => {
        if (!embeddedCaptureZipDataUrl) {
            setStatus('error', '캡쳐 ZIP 없음');
            return;
        }
        setCaptureBusy(true);
        try {
            setStatus('saving', '캡쳐 ZIP 다운로드 중');
            const link = document.createElement('a');
            link.href = embeddedCaptureZipDataUrl;
            link.download = embeddedCaptureZipFileName || 'report-capture.zip';
            link.style.display = 'none';
            document.body?.appendChild?.(link);
            link.click?.();
            link.remove?.();
            setStatus('saved', '캡쳐 ZIP 다운로드 완료');
        } catch (error) {
            void error;
            setStatus('error', '캡쳐 ZIP 다운로드 실패');
        } finally {
            setCaptureBusy(false);
        }
    };
    const setSlide = index => {
        if (!slides.length) return;
        const next = Math.max(0, Math.min(slides.length - 1, Number.parseInt(String(index), 10) || 0));
        root.dataset.reportActiveSlide = String(next);
        slides.forEach((slide, slideIndex) => {
            const active = slideIndex === next;
            slide.classList.toggle('is-active', active);
            slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        buttons.forEach(button => {
            const active = Number.parseInt(button.dataset.reportSlideTarget || '0', 10) === next;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-current', active ? 'page' : 'false');
        });
        if (counter) counter.textContent = String(next + 1) + ' / ' + String(slides.length);
    };
    const exitFullscreen = () => {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        const result = exit?.call(document);
        result?.catch?.(() => {});
    };
    const moveSlide = direction => {
        if (!slides.length) return;
        const current = getCurrent();
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || null;
        if (fullscreenElement && direction > 0 && current >= slides.length - 1) {
            setSlide(0);
            exitFullscreen();
            return;
        }
        setSlide((current + direction + slides.length) % slides.length);
    };
    const isReportDeckExportFullscreenAdvanceClick = target => {
        if (!target) return false;
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || null;
        if (fullscreenElement !== root) return false;
        if (typeof target.closest !== 'function') return true;
        return !target.closest([
            'button',
            'a',
            'input',
            'textarea',
            'select',
            'label',
            'summary',
            '[role="button"]',
            '[role="link"]',
            '[contenteditable="true"]',
            '[data-report-slide-target]',
            '[data-report-jump-slide]',
            '[data-report-export-fullscreen]',
            '[data-report-export-print]',
            '[data-report-export-capture-zip]'
        ].join(', '));
    };
    const waitForDocumentImages = doc => Promise.all(Array.from(doc?.images || []).map(image => {
        const source = image.getAttribute?.('src') || image.currentSrc || image.src || '';
        if (!String(source || '').trim() || image.complete) return Promise.resolve();
        return new Promise(resolve => {
            image.addEventListener?.('load', resolve, { once: true });
            image.addEventListener?.('error', resolve, { once: true });
        });
    }));
    const escapeAttribute = value => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const captureWidth = ${parts.REPORT_DECK_CAPTURE_SLIDE_WIDTH};
    const captureHeight = ${parts.REPORT_DECK_CAPTURE_SLIDE_HEIGHT};
    const cleanPrintClone = slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('is-active');
        clone.setAttribute('aria-hidden', 'false');
        clone.removeAttribute('hidden');
        clone.dataset.reportPrintVisible = 'true';
        clone.querySelectorAll?.('[contenteditable]')?.forEach(element => {
            element.removeAttribute('contenteditable');
            element.removeAttribute('spellcheck');
        });
        clone.querySelectorAll?.('.report-plan-image-choice, .report-plan-count-control, .report-safety-add-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-memo-overview-toggle]')?.forEach(element => {
            element.remove();
        });
        return clone;
    };
    const getStyleText = () => Array.from(document.querySelectorAll('style'))
        .map(style => String(style.textContent || ''))
        .join('\\n');
    const buildCaptureCss = () => [
        'html, body { margin: 0 !important; padding: 0 !important; width: ' + captureWidth + 'px !important; height: ' + captureHeight + 'px !important; overflow: hidden !important; background: #ffffff !important; }',
        '.report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: 0 !important; top: 0 !important; width: ' + captureWidth + 'px !important; height: ' + captureHeight + 'px !important; max-width: none !important; min-width: 0 !important; min-height: 0 !important; aspect-ratio: auto !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; overflow: hidden !important; background: #ffffff !important; }',
        '.report-slide.is-active { display: block !important; }',
        '.report-plan-image-choice, .report-plan-count-control, .report-safety-add-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-export-print], [data-report-export-fullscreen], [data-report-fullscreen], [data-report-edit-toggle], [data-report-memo-overview-toggle], [data-report-print-pdf], [data-report-capture-zip], [data-report-capture-pdf], [data-report-export-html] { display: none !important; }',
        '[data-report-field] { outline: 0 !important; }'
    ].join('\\n');
    const buildCaptureHost = slide => {
        const host = document.createElement('div');
        host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        host.style.width = captureWidth + 'px';
        host.style.height = captureHeight + 'px';
        host.style.margin = '0';
        host.style.padding = '0';
        host.style.overflow = 'hidden';
        host.style.background = '#ffffff';
        const style = document.createElement('style');
        style.textContent = getStyleText() + '\\n' + buildCaptureCss();
        host.appendChild(style);
        host.appendChild(cleanPrintClone(slide));
        return host;
    };
    let printObjectUrls = [];
    const captureSlide = async slide => {
        await document.fonts?.ready?.catch?.(() => {});
        const host = buildCaptureHost(slide);
        const serializedHost = new XMLSerializer().serializeToString(host);
        const svgText = '<svg xmlns="http://www.w3.org/2000/svg" width="' + captureWidth + '" height="' + captureHeight + '" viewBox="0 0 ' + captureWidth + ' ' + captureHeight + '"><foreignObject width="100%" height="100%">' + serializedHost + '</foreignObject></svg>';
        const objectUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }));
        printObjectUrls.push(objectUrl);
        return objectUrl;
    };
    const buildPrintDeckHtml = async () => {
        const deck = document.createElement('main');
        deck.className = 'report-print-viewer';
        deck.dataset.reportPrintViewer = 'true';
        for (const [index, slide] of slides.entries()) {
            const page = document.createElement('section');
            page.className = 'report-print-page';
            page.dataset.reportPrintPage = String(index + 1);
            if (index === slides.length - 1) page.dataset.reportPrintLast = 'true';
            const frame = document.createElement('div');
            frame.className = 'report-print-slide-frame';
            const image = document.createElement('img');
            image.className = 'report-print-slide-image';
            image.alt = String(slide.dataset.reportSlideLabel || 'report slide ' + String(index + 1)).trim();
            image.src = await captureSlide(slide);
            frame.appendChild(image);
            page.appendChild(frame);
            deck.appendChild(page);
        }
        return deck.outerHTML;
    };
    const buildPrintHtml = async () => {
        const baseHref = String(document.baseURI || location.href || '').trim();
        const styleText = getStyleText();
        const printCss = ${printOnlyCss};
        return '<!doctype html><html lang="ko"><head><meta charset="utf-8">'
            + (baseHref ? '<base href="' + escapeAttribute(baseHref) + '">' : '')
            + '<style>' + styleText + '\\n' + printCss + '</style>'
            + '</head><body class="report-print-body">'
            + await buildPrintDeckHtml()
            + '</body></html>';
    };
    const cleanupPrintFrame = frame => {
        printObjectUrls.forEach(objectUrl => {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch (error) {
                void error;
            }
        });
        printObjectUrls = [];
        try {
            frame?.remove?.();
        } catch (error) {
            void error;
        }
    };
    const printSlides = () => {
        const frame = document.createElement('iframe');
        frame.setAttribute('title', 'report pdf print');
        frame.setAttribute('aria-hidden', 'true');
        frame.style.position = 'fixed';
        frame.style.right = '0';
        frame.style.bottom = '0';
        frame.style.width = '0';
        frame.style.height = '0';
        frame.style.border = '0';
        frame.style.opacity = '0';
        document.body?.appendChild(frame);
        const frameWindow = frame.contentWindow || null;
        const frameDocument = frame.contentDocument || frameWindow?.document || null;
        if (!frameWindow || !frameDocument || typeof frameWindow.print !== 'function') {
            cleanupPrintFrame(frame);
            return;
        }
        const runPrint = async () => {
            try {
                const html = await buildPrintHtml();
                frameDocument.open();
                frameDocument.write(html);
                frameDocument.close();
                void frameDocument.body?.offsetHeight;
                await frameDocument.fonts?.ready?.catch?.(() => {});
                await waitForDocumentImages(frameDocument);
            } catch (error) {
                void error;
                cleanupPrintFrame(frame);
                window.print?.();
                return;
            }
            void frameDocument.body?.offsetHeight;
            frameWindow.addEventListener?.('afterprint', () => cleanupPrintFrame(frame), { once: true });
            window.setTimeout?.(() => cleanupPrintFrame(frame), 60000);
            frameWindow.focus?.();
            frameWindow.print();
        };
        void runPrint();
    };
    root.addEventListener('click', event => {
        const jumpButton = event.target.closest?.('[data-report-jump-slide]');
        if (jumpButton) {
            event.preventDefault();
            setSlide(jumpButton.dataset.reportJumpSlide);
            stage?.focus?.();
            return;
        }
        const navButton = event.target.closest?.('[data-report-slide-target]');
        if (navButton) {
            event.preventDefault();
            setSlide(navButton.dataset.reportSlideTarget);
            stage?.focus?.();
            return;
        }
        const captureZipButton = event.target.closest?.('[data-report-export-capture-zip]');
        if (captureZipButton) {
            event.preventDefault();
            downloadEmbeddedCaptureZip();
            return;
        }
        const fullscreenButton = event.target.closest?.('[data-report-export-fullscreen]');
        if (fullscreenButton) {
            event.preventDefault();
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || null;
            if (fullscreenElement) {
                exitFullscreen();
            } else {
                const request = root.requestFullscreen || root.webkitRequestFullscreen;
                const result = request?.call(root);
                result?.catch?.(() => {});
                stage?.focus?.();
            }
            return;
        }
        const printButton = event.target.closest?.('[data-report-export-print]');
        if (printButton) {
            event.preventDefault();
            printSlides();
            return;
        }
        if (isReportDeckExportFullscreenAdvanceClick(event.target)) {
            event.preventDefault();
            moveSlide(1);
        }
    });
    document.addEventListener('keydown', event => {
        const tagName = String(event.target?.tagName || '').toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;
        if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
            event.preventDefault();
            moveSlide(1);
        } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            moveSlide(-1);
        } else if (event.key === 'Home') {
            event.preventDefault();
            setSlide(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setSlide(slides.length - 1);
        }
    });
    setSlide(0);
})();
        `;
    }

    async function buildReportDeckSingleHtml(editorRoot, options = {}) {
        const doc = editorRoot?.ownerDocument || root.document || globalScope?.document || null;
        if (!doc || typeof doc.createElement !== 'function') {
            throw new Error('report_deck_export_document_unavailable');
        }
        const allSlides = Array.from(editorRoot?.querySelectorAll?.('[data-report-slide-page]') || [])
            .filter(slide => slide.hidden !== true && String(slide?.dataset?.reportSlidePage || '') !== '-1');
        const preparedSlides = allSlides.filter(slide => String(slide?.dataset?.reportPrintVisible || '') === 'true');
        const hasViewMetadata = allSlides.some(slide => String(slide?.dataset?.reportSlideView || '').trim());
        const activeView = String(editorRoot?.dataset?.reportActiveView || '').trim();
        let slides = preparedSlides.length ? preparedSlides : allSlides;
        if (!preparedSlides.length && hasViewMetadata && activeView && activeView !== 'hq') {
            const viewSlides = allSlides.filter(slide => String(slide?.dataset?.reportSlideView || '').trim() === activeView);
            if (viewSlides.length) {
                slides = viewSlides;
            }
        }
        if (!slides.length) {
            throw new Error('report_deck_export_slides_unavailable');
        }
        const range = parts.normalizeReportDeckCapturePageRange(options.pageRange, slides.length);
        slides = slides.slice(range.start - 1, range.end);
        if (!slides.length) {
            throw new Error('report_deck_export_slides_unavailable');
        }
        const captureZipDataUrl = String(options.captureZipDataUrl || '').trim();
        const captureZipFileName = String(options.captureZipFileName || options.filename || 'report-capture.zip').replace(/\.html?$/i, '.zip');
        const deck = parts.buildReportDeckExportViewer(doc, editorRoot, slides, {
            includeCaptureButton: Boolean(captureZipDataUrl)
        });
        await parts.inlineReportDeckExportImages(deck);
        const title = String(options.title || '공무환경팀 실적보고서').trim() || '공무환경팀 실적보고서';
        return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${parts.escapeHtmlText(title)}</title>
<style>
${parts.getReportDeckExportStyleText(editorRoot)}
${parts.buildReportDeckExportCss()}
</style>
</head>
<body class="report-export-body">
${parts.getNodeOuterHtml(deck)}
<script>
${buildReportDeckExportScript({ captureZipDataUrl, captureZipFileName })}
</script>
</body>
</html>`;
    }

    function downloadBlobFile(fileName, blob) {
        const doc = root.document || globalScope?.document || null;
        const urlApi = root.URL || globalScope?.URL;
        if (!doc || typeof doc.createElement !== 'function' || !urlApi?.createObjectURL) {
            throw new Error('report_deck_export_download_unavailable');
        }
        const objectUrl = urlApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = objectUrl;
        link.download = String(fileName || 'report-download').trim() || 'report-download';
        link.style.display = 'none';
        doc.body?.appendChild?.(link);
        link.click?.();
        link.remove?.();
        root.setTimeout?.(() => {
            urlApi.revokeObjectURL?.(objectUrl);
        }, 0);
    }

    function downloadTextFile(fileName, content, mimeType = 'text/plain;charset=utf-8') {
        const BlobCtor = root.Blob || globalScope?.Blob;
        if (typeof BlobCtor !== 'function') {
            throw new Error('report_deck_export_download_unavailable');
        }
        downloadBlobFile(fileName, new BlobCtor([content], { type: mimeType }));
    }

    async function requestReportDeckCapture(editorRoot, options = {}) {
        const selection = parts.getReportDeckCaptureSelection(editorRoot, options);
        if (!selection.slides.length) {
            throw new Error('report_deck_capture_slides_unavailable');
        }
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_capture_fetch_unavailable');
        }
        const fileName = String(options.filename || 'report-capture.zip').trim() || 'report-capture.zip';
        const rawFormat = String(options.format || 'zip').trim().toLowerCase();
        const format = rawFormat === 'images' || rawFormat === 'pdf' ? rawFormat : 'zip';
        const capture = parts.getReportDeckCaptureViewport();
        const pages = [];
        options.onProgress?.({ phase: 'prepare', current: 0, total: selection.slides.length });
        for (const [index, slide] of selection.slides.entries()) {
            pages.push(await parts.buildReportDeckCapturePageHtml(editorRoot, slide, capture));
            options.onProgress?.({ phase: 'prepare', current: index + 1, total: selection.slides.length });
        }
        options.onProgress?.({ phase: 'render', current: 0, total: selection.slides.length });
        const response = await root.fetch(parts.buildReportDeckCaptureZipEndpoint(), {
            method: 'POST',
            headers: {
                Accept: format === 'images' ? 'application/json' : (format === 'pdf' ? 'application/pdf, application/json' : 'application/zip, application/json'),
                'Content-Type': 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                fileName,
                width: capture.width,
                height: capture.height,
                format,
                pageNumbers: selection.pageNumbers,
                pages
            })
        });
        if (!response.ok) {
            const error = new Error(`report_deck_capture_zip_failed:${response.status}`);
            error.status = response.status;
            error.detail = await response.text().catch(() => '');
            throw error;
        }
        if (format === 'images') {
            return {
                ok: true,
                fileName,
                imageCount: pages.length,
                pageStart: selection.start,
                pageEnd: selection.end,
                payload: await response.json()
            };
        }
        const resultBlob = await response.blob();
        return {
            ok: true,
            fileName,
            imageCount: pages.length,
            pageStart: selection.start,
            pageEnd: selection.end,
            blob: resultBlob
        };
    }

    async function exportReportDeckSingleHtml(editorRoot, options = {}) {
        const fileName = String(options.filename || '공무환경팀 실적보고서.html').trim() || '공무환경팀 실적보고서.html';
        let captureZipDataUrl = '';
        let captureImageCount = 0;
        const captureZipFileName = fileName.replace(/\.html?$/i, '.zip');
        if (options.includeCaptureFiles !== false) {
            try {
                const capture = await requestReportDeckCapture(editorRoot, {
                    filename: captureZipFileName,
                    format: 'zip',
                    pageRange: options.pageRange,
                    onProgress: options.onCaptureProgress
                });
                captureImageCount = capture.imageCount;
                captureZipDataUrl = await parts.readBlobAsDataUrl(capture.blob);
            } catch (error) {
                void error;
                captureZipDataUrl = '';
                captureImageCount = 0;
            }
        }
        const html = await buildReportDeckSingleHtml(editorRoot, { ...options, captureZipDataUrl, captureZipFileName });
        downloadTextFile(fileName, html, 'text/html;charset=utf-8');
        return {
            ok: true,
            fileName,
            htmlLength: html.length,
            captureImageCount
        };
    }

    async function exportReportDeckCaptureZip(editorRoot, options = {}) {
        const fileName = String(options.filename || 'report-capture.zip').trim() || 'report-capture.zip';
        const capture = await requestReportDeckCapture(editorRoot, {
            filename: fileName,
            format: 'zip',
            pageRange: options.pageRange,
            onProgress: options.onProgress
        });
        downloadBlobFile(fileName, capture.blob);
        return {
            ok: true,
            fileName,
            imageCount: capture.imageCount,
            bytes: Number(capture.blob?.size) || 0,
            destination: 'zip'
        };
    }

    async function exportReportDeckCapturePdf(editorRoot, options = {}) {
        const fileName = String(options.filename || 'report-capture.pdf').trim() || 'report-capture.pdf';
        const capture = await requestReportDeckCapture(editorRoot, {
            filename: fileName,
            format: 'pdf',
            pageRange: options.pageRange,
            onProgress: options.onProgress
        });
        downloadBlobFile(fileName, capture.blob);
        return {
            ok: true,
            fileName,
            imageCount: capture.imageCount,
            bytes: Number(capture.blob?.size) || 0,
            destination: 'pdf'
        };
    }

    function printReportDeckPdf(editorRoot) {
        const printWindow = editorRoot?.ownerDocument?.defaultView || root;
        if (typeof printWindow?.print !== 'function') {
            throw new Error('report_deck_print_unavailable');
        }
        const slides = parts.getReportDeckPrintableSlides(editorRoot);
        if (slides.length && parts.printReportDeckFrame(editorRoot, slides)) {
            return true;
        }
        printWindow.print();
        return true;
    }

    Object.assign(parts, {
        buildReportDeckExportScript,
        buildReportDeckSingleHtml,
        downloadBlobFile,
        downloadTextFile,
        requestReportDeckCapture,
        exportReportDeckSingleHtml,
        exportReportDeckCaptureZip,
        exportReportDeckCapturePdf,
        printReportDeckPdf
    });
})(globalThis);
