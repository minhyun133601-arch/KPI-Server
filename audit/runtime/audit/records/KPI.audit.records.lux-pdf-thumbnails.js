        const auditLuxPdfBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : null;

        if (!auditLuxPdfBrowser) {
            throw new Error('KpiAuditRecordsBrowserAdapter must load before KPI.audit.records.lux-pdf-thumbnails.js');
        }

        const AUDIT_LUX_PDFJS_MODULE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
        const AUDIT_LUX_PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
        let AuditLuxPdfJsLoadPromise = null;
        const AuditLuxPdfThumbnailCache = new Map();

        function getAuditLuxPdfDocument() {
            return typeof auditLuxPdfBrowser.getDocument === 'function'
                ? auditLuxPdfBrowser.getDocument()
                : null;
        }

        function getAuditLuxPdfDevicePixelRatio() {
            const ratio = Number(getAuditLuxPdfDocument()?.defaultView?.devicePixelRatio || 1);
            return Number.isFinite(ratio)
                ? Math.max(1, Math.min(2, ratio))
                : 1;
        }

        function configureAuditLuxPdfJs(pdfjs) {
            if (!pdfjs || typeof pdfjs.getDocument !== 'function') return null;
            if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = AUDIT_LUX_PDFJS_WORKER_URL;
            }
            return pdfjs;
        }

        async function loadAuditLuxPdfJs() {
            const existing = configureAuditLuxPdfJs(
                auditLuxPdfBrowser.getRootValue('KpiAuditLuxPdfJs') || auditLuxPdfBrowser.getRootValue('pdfjsLib')
            );
            if (existing) return existing;
            if (!AuditLuxPdfJsLoadPromise) {
                AuditLuxPdfJsLoadPromise = import(AUDIT_LUX_PDFJS_MODULE_URL)
                    .then((module) => {
                        const pdfjs = configureAuditLuxPdfJs(module);
                        if (pdfjs && typeof auditLuxPdfBrowser.expose === 'function') {
                            auditLuxPdfBrowser.expose('KpiAuditLuxPdfJs', pdfjs);
                        }
                        return pdfjs;
                    })
                    .catch((error) => {
                        console.warn('[kpi] audit lux pdf preview unavailable', error);
                        return null;
                    });
            }
            return AuditLuxPdfJsLoadPromise;
        }

        function getAuditLuxPdfThumbBounds(element) {
            const rect = typeof element.getBoundingClientRect === 'function'
                ? element.getBoundingClientRect()
                : {};
            const width = Math.max(180, Math.min(360, Math.floor(rect.width || element.clientWidth || 240)));
            const height = Math.max(96, Math.min(220, Math.floor(rect.height || element.clientHeight || 120)));
            return { width, height };
        }

        async function getAuditLuxPdfThumbnailDataUrl(pdfUrl, bounds) {
            const cacheKey = `${pdfUrl}::${bounds.width}x${bounds.height}`;
            const cached = AuditLuxPdfThumbnailCache.get(cacheKey);
            if (cached) return Promise.resolve(cached);
            const renderPromise = (async () => {
                const pdfjs = await loadAuditLuxPdfJs();
                if (!pdfjs) throw new Error('pdfjs_unavailable');
                const loadingTask = pdfjs.getDocument({ url: pdfUrl, withCredentials: true });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);
                const baseViewport = page.getViewport({ scale: 1 });
                const fitScale = Math.min(bounds.width / baseViewport.width, bounds.height / baseViewport.height);
                const pixelRatio = getAuditLuxPdfDevicePixelRatio();
                const viewport = page.getViewport({ scale: Math.max(0.1, fitScale * pixelRatio) });
                const documentRef = getAuditLuxPdfDocument();
                if (!documentRef || typeof documentRef.createElement !== 'function') {
                    throw new Error('document_unavailable');
                }
                const canvas = documentRef.createElement('canvas');
                canvas.width = Math.max(1, Math.floor(viewport.width));
                canvas.height = Math.max(1, Math.floor(viewport.height));
                const context = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d');
                if (!context) throw new Error('canvas_context_unavailable');
                await page.render({ canvasContext: context, viewport }).promise;
                const dataUrl = canvas.toDataURL('image/png');
                if (typeof pdf.cleanup === 'function') pdf.cleanup();
                return dataUrl;
            })();
            AuditLuxPdfThumbnailCache.set(cacheKey, renderPromise);
            try {
                const dataUrl = await renderPromise;
                AuditLuxPdfThumbnailCache.set(cacheKey, dataUrl);
                return dataUrl;
            } catch (error) {
                AuditLuxPdfThumbnailCache.delete(cacheKey);
                throw error;
            }
        }

        async function renderAuditLuxPdfThumbnail(element) {
            const htmlElement = getAuditLuxPdfDocument()?.defaultView?.HTMLElement;
            if (!element || (htmlElement && !(element instanceof htmlElement))) return;
            const pdfUrl = String(element.dataset.auditLuxPdfUrl || element.dataset.auditLuxPdfThumb || '').trim();
            if (!pdfUrl || element.dataset.auditLuxPdfState) return;
            element.dataset.auditLuxPdfState = 'loading';
            try {
                const dataUrl = await getAuditLuxPdfThumbnailDataUrl(pdfUrl, getAuditLuxPdfThumbBounds(element));
                const documentRef = getAuditLuxPdfDocument();
                if (!documentRef || typeof documentRef.createElement !== 'function') {
                    throw new Error('document_unavailable');
                }
                const image = documentRef.createElement('img');
                image.className = 'audit-lux-index-thumb-image';
                image.src = dataUrl;
                image.alt = String(element.dataset.auditLuxPdfAlt || 'PDF preview');
                image.loading = 'lazy';
                image.decoding = 'async';
                element.replaceWith(image);
            } catch (error) {
                element.dataset.auditLuxPdfState = 'fallback';
                console.warn('[kpi] audit lux pdf thumbnail fallback', error);
            }
        }

        function initAuditLuxPdfThumbnails(dataKey) {
            const selector = `[data-audit-lux-pdf-thumb="${dataKey}"]`;
            const documentRef = getAuditLuxPdfDocument();
            if (!documentRef || typeof documentRef.querySelectorAll !== 'function') return;
            Array.from(documentRef.querySelectorAll(selector)).forEach((element) => {
                renderAuditLuxPdfThumbnail(element);
            });
        }
