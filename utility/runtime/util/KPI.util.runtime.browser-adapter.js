(function registerKpiUtilRuntimeBrowserAdapter(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const REPORT_DECK_PRINT_PAGE_WIDTH = '297mm';
    const REPORT_DECK_PRINT_PAGE_HEIGHT = '210mm';
    const REPORT_DECK_PRINT_PAGE_MARGIN = '10mm';
    const REPORT_DECK_PRINT_SLIDE_CSS_WIDTH = '277mm';
    const REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT = '155.8125mm';
    const REPORT_DECK_CAPTURE_SLIDE_WIDTH = 2560;
    const REPORT_DECK_CAPTURE_SLIDE_HEIGHT = 1440;
    const REPORT_DECK_MEMO_TEAMS = Object.freeze([
        Object.freeze({ key: 'team_01_01', label: '1팀 1파트' }),
        Object.freeze({ key: 'team_01_02', label: '1팀 2파트' }),
        Object.freeze({ key: 'team_02', label: '2팀' }),
        Object.freeze({ key: 'team_03', label: '3팀' })
    ]);
    const REPORT_DECK_MEMO_METRICS = Object.freeze({
        production: Object.freeze({ key: 'production', label: '생산량', unit: 'kg' }),
        yusan_production_share: Object.freeze({ key: 'yusan_production_share', label: '유산 생산량 비율', unit: '%p', deltaMode: 'percentagePoint' }),
        electric: Object.freeze({ key: 'electric', label: '전력량', unit: 'kWh' }),
        electric_unit: Object.freeze({ key: 'electric_unit', label: '생산량 대비 전력량', unit: 'kWh/kg', decimals: 3 }),
        lng: Object.freeze({ key: 'lng', label: 'LNG 사용량', unit: 'm³' }),
        lng_unit: Object.freeze({ key: 'lng_unit', label: '생산량 대비 LNG', unit: 'm³/kg', decimals: 3 }),
        lpg: Object.freeze({ key: 'lpg', label: 'LPG 사용량', unit: 'kg' }),
        lpg_unit: Object.freeze({ key: 'lpg_unit', label: '생산량 대비 LPG', unit: 'kg/kg', decimals: 3 }),
        yield_rate: Object.freeze({ key: 'yield_rate', label: '수율', unit: '%p', deltaMode: 'percentagePoint' }),
        operation_rate: Object.freeze({ key: 'operation_rate', label: '가동률', unit: '%p', deltaMode: 'percentagePoint' }),
        work_time: Object.freeze({ key: 'work_time', label: '조업시간', unit: '시간', decimals: 1 }),
        operation_time: Object.freeze({ key: 'operation_time', label: '가동시간', unit: '시간', decimals: 1 }),
        production_days: Object.freeze({ key: 'production_days', label: '생산일수', unit: '일' }),
        off_days: Object.freeze({ key: 'off_days', label: '휴무일수', unit: '일' }),
        product_count: Object.freeze({ key: 'product_count', label: '고유 품목수', unit: '개' }),
        waste_usage: Object.freeze({ key: 'waste_usage', label: '폐수량', unit: 'm³', wasteValueKey: 'wasteUsage' }),
        waste_cost_total: Object.freeze({ key: 'waste_cost_total', label: '폐수 비용 총계', unit: '원', wasteDetailKey: '' }),
        waste_cost_water: Object.freeze({ key: 'waste_cost_water', label: '상수 비용', unit: '원', wasteDetailKey: 'water' }),
        waste_cost_share: Object.freeze({ key: 'waste_cost_share', label: '폐수 비용', unit: '원', wasteDetailKey: 'share' }),
        waste_cost_sludge: Object.freeze({ key: 'waste_cost_sludge', label: '폐수오니 비용', unit: '원', wasteDetailKey: 'sludge' }),
        waste_cost_resin: Object.freeze({ key: 'waste_cost_resin', label: '폐합성수지 비용', unit: '원', wasteDetailKey: 'resin' }),
        waste_cost_labor: Object.freeze({ key: 'waste_cost_labor', label: '인건비', unit: '원', wasteDetailKey: 'labor' })
    });
    const REPORT_DECK_MEMO_LINE_METRIC_PREFIX = 'production_line::';
    const REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY = 'yusan_production_share';
    const REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS = Object.freeze(['team_01_02', 'team_02', 'team_03']);
    const REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS = Object.freeze([
        'yield_rate',
        'operation_rate',
        'work_time',
        'operation_time',
        'production_days',
        'off_days',
        'product_count'
    ]);
    const REPORT_DECK_MEMO_WASTE_METRIC_KEYS = Object.freeze([
        'waste_usage',
        'waste_cost_total',
        'waste_cost_water',
        'waste_cost_share',
        'waste_cost_sludge',
        'waste_cost_resin',
        'waste_cost_labor'
    ]);
    const REPORT_DECK_MEMO_WASTE_MEMO_KEYS = Object.freeze(['slide6WasteMemo', 'slide7WasteMemo']);
    const REPORT_DECK_MEMO_UNIT_METRIC_BASE = Object.freeze({
        electric_unit: 'electric',
        lng_unit: 'lng',
        lpg_unit: 'lpg'
    });
    const REPORT_DECK_MEMO_WASTE_OVERVIEW_SCOPES = Object.freeze([
        Object.freeze({ key: 'waste_bukjeong', label: '북정 폐수', memoKey: 'slide6WasteMemo', teamKey: 'team_01_01' }),
        Object.freeze({ key: 'waste_yusan', label: '유산 폐수', memoKey: 'slide7WasteMemo', teamKey: 'team_01_02' })
    ]);
    const REPORT_DECK_MEMO_PRODUCTION_LINES = Object.freeze({
        team_01_01: Object.freeze(['SD', 'MSD']),
        team_01_02: Object.freeze(['지대', 'ICA']),
        team_02: Object.freeze(['로터리·버티컬', '스틱']),
        team_03: Object.freeze(['Bottle', '기타'])
    });
    const REPORT_DECK_MEMO_TEAM_METRIC_KEYS = Object.freeze({
        team_01_01: Object.freeze(['production', 'electric', 'electric_unit', 'lng', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_01_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', 'lng', 'lng_unit', 'lpg', 'lpg_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS]),
        team_03: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_unit', 'lng', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS])
    });

    function getRuntime() {
        return root.KpiRuntime || null;
    }

    function initIntegratedMetering(container) {
        return root.KpiMeteringBridge?.initIntegratedMetering?.(container);
    }

    function canManualSaveMetering() {
        return typeof root.KpiMeteringApp?.manualSave === 'function';
    }

    function getMeteringRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.metering || null;
    }

    function normalizeApiBase(value) {
        const apiBase = String(value || '/api').trim() || '/api';
        return apiBase.startsWith('/') ? apiBase : `/${apiBase.replace(/^\/+/, '')}`;
    }

    function getReportRuntimeConfig() {
        const runtimeConfig = root.__KPI_SERVER_RUNTIME_CONFIG__ || {};
        const reportConfig = runtimeConfig.report || {};
        const apiBase = normalizeApiBase(reportConfig.apiBase || runtimeConfig.apiBase || '/api');
        return {
            enabled: reportConfig.enabled !== false,
            apiBase,
            moduleKey: String(reportConfig.moduleKey || 'report_runtime').trim() || 'report_runtime',
            recordKey: String(reportConfig.recordKey || 'cover').trim() || 'cover',
            permissionKey: String(reportConfig.permissionKey || 'util.metering.app').trim() || 'util.metering.app',
            readEnabled: reportConfig.readEnabled !== false,
            writeEnabled: reportConfig.writeEnabled !== false
        };
    }

    function normalizeReportRecordKey(value, fallback = 'cover') {
        return String(value || fallback || 'cover').trim() || 'cover';
    }

    function buildReportDeckRecordEndpoint(options = {}) {
        const config = getReportRuntimeConfig();
        const recordKey = normalizeReportRecordKey(options.recordKey, config.recordKey);
        return `${config.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(config.moduleKey)}/records/${encodeURIComponent(recordKey)}`;
    }

    function buildReportDeckFileUploadEndpoint() {
        const config = getReportRuntimeConfig();
        return `${config.apiBase.replace(/\/+$/, '')}/files/base64`;
    }

    function buildMeteringSharedStoreEndpoint() {
        const runtimeConfig = root.__KPI_SERVER_RUNTIME_CONFIG__ || {};
        const meteringConfig = runtimeConfig.metering || {};
        const apiBase = normalizeApiBase(meteringConfig.apiBase || runtimeConfig.apiBase || '/api');
        return `${apiBase.replace(/\/+$/, '')}/shared-store`;
    }

    function isPlainObject(value) {
        return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function readBrowserFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const Reader = root.FileReader || globalScope?.FileReader;
            if (!file || typeof Reader !== 'function') {
                reject(new Error('report_deck_image_reader_unavailable'));
                return;
            }
            const reader = new Reader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('report_deck_image_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    function parseDataUrlPayload(dataUrl = '') {
        const raw = String(dataUrl || '').trim();
        const match = raw.match(/^data:([^;,]+)?;base64,(.*)$/);
        if (!match) {
            return { mimeType: '', base64Data: raw };
        }
        return {
            mimeType: String(match[1] || '').trim(),
            base64Data: String(match[2] || '').trim()
        };
    }

    function getReportDeckBase64ByteLength(base64Data = '') {
        const normalized = String(base64Data || '').replace(/\s+/g, '');
        const paddingLength = (normalized.match(/=+$/)?.[0] || '').length;
        return Math.max(0, Math.floor((normalized.length * 3) / 4) - paddingLength);
    }

    function replaceReportDeckImageExtension(fileName = '', extension = '.jpg') {
        const normalizedName = String(fileName || '').trim();
        if (!normalizedName) return `report-image${extension}`;
        return /\.[a-z0-9]{1,8}$/i.test(normalizedName)
            ? normalizedName.replace(/\.[a-z0-9]{1,8}$/i, extension)
            : `${normalizedName}${extension}`;
    }

    function loadReportDeckImageElement(dataUrl) {
        return new Promise((resolve, reject) => {
            const ImageCtor = root.Image || globalScope?.Image;
            if (typeof ImageCtor !== 'function') {
                reject(new Error('report_deck_image_compression_unavailable'));
                return;
            }
            const image = new ImageCtor();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('report_deck_image_compression_failed'));
            image.src = dataUrl;
        });
    }

    async function prepareReportDeckImageDataUrlForUpload(dataUrl, options = {}) {
        const rawDataUrl = String(dataUrl || '').trim();
        const parsed = parseDataUrlPayload(rawDataUrl);
        const sourceMimeType = String(options.mimeType || parsed.mimeType || '').trim().toLowerCase();
        const sourceBytes = getReportDeckBase64ByteLength(parsed.base64Data);
        const canUseCanvas = typeof root.document?.createElement === 'function';
        const shouldTryCompress = /^image\/(jpeg|jpg|png|webp|bmp)$/i.test(sourceMimeType || parsed.mimeType)
            && sourceBytes > 1024 * 1024
            && canUseCanvas;
        if (!shouldTryCompress) {
            return {
                dataUrl: rawDataUrl,
                mimeType: options.mimeType || parsed.mimeType || '',
                originalName: options.originalName || ''
            };
        }

        try {
            const image = await loadReportDeckImageElement(rawDataUrl);
            const width = Number(image.naturalWidth || image.width || 0);
            const height = Number(image.naturalHeight || image.height || 0);
            if (!(width > 0 && height > 0)) {
                throw new Error('report_deck_image_size_unavailable');
            }
            const maxEdge = 1600;
            const scale = Math.min(1, maxEdge / Math.max(width, height));
            const canvas = root.document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(width * scale));
            canvas.height = Math.max(1, Math.round(height * scale));
            const context = canvas.getContext?.('2d');
            if (!context || typeof canvas.toDataURL !== 'function') {
                throw new Error('report_deck_image_canvas_unavailable');
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            const compressedBytes = getReportDeckBase64ByteLength(parseDataUrlPayload(compressedDataUrl).base64Data);
            if (compressedBytes > 0 && compressedBytes < sourceBytes) {
                return {
                    dataUrl: compressedDataUrl,
                    mimeType: 'image/jpeg',
                    originalName: replaceReportDeckImageExtension(options.originalName || '', '.jpg')
                };
            }
        } catch (error) {
            void error;
        }
        return {
            dataUrl: rawDataUrl,
            mimeType: options.mimeType || parsed.mimeType || '',
            originalName: options.originalName || ''
        };
    }

    function cloneJson(value) {
        try {
            return JSON.parse(JSON.stringify(value ?? null));
        } catch (error) {
            return value ?? null;
        }
    }

    function escapeHtmlText(value = '') {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeHtmlAttribute(value = '') {
        return escapeHtmlText(value);
    }

    function getReportDeckExportStyleText(editorRoot) {
        const previous = editorRoot?.previousElementSibling || null;
        if (String(previous?.tagName || '').toLowerCase() === 'style') {
            return String(previous.textContent || '');
        }
        const parentStyles = Array.from(editorRoot?.parentNode?.querySelectorAll?.('style') || []);
        return parentStyles.map(style => String(style.textContent || '')).join('\n');
    }

    function getNodeOuterHtml(node) {
        if (typeof node?.outerHTML === 'string') return node.outerHTML;
        const Serializer = root.XMLSerializer || globalScope?.XMLSerializer;
        if (typeof Serializer === 'function') {
            return new Serializer().serializeToString(node);
        }
        return '';
    }

    function readBlobAsDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const Reader = root.FileReader || globalScope?.FileReader;
            if (typeof Reader !== 'function') {
                reject(new Error('report_deck_export_file_reader_unavailable'));
                return;
            }
            const reader = new Reader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('report_deck_export_image_read_failed'));
            reader.readAsDataURL(blob);
        });
    }

    async function fetchReportDeckImageAsDataUrl(src = '') {
        const rawSrc = String(src || '').trim();
        if (!rawSrc || rawSrc.startsWith('data:')) return rawSrc;
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_export_fetch_unavailable');
        }
        const absoluteUrl = new URL(rawSrc, root.location?.href || 'http://127.0.0.1/').href;
        const response = await root.fetch(absoluteUrl, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error(`report_deck_export_image_fetch_failed:${response.status}`);
        }
        const blob = await response.blob();
        return readBlobAsDataUrl(blob);
    }

    function cleanReportDeckExportSlide(slide, isActive = false) {
        slide?.classList?.toggle?.('is-active', isActive === true);
        slide?.setAttribute?.('aria-hidden', isActive === true ? 'false' : 'true');
        Array.from(slide?.querySelectorAll?.('[contenteditable]') || []).forEach(element => {
            element.removeAttribute?.('contenteditable');
            element.removeAttribute?.('spellcheck');
        });
        Array.from(slide?.querySelectorAll?.('.report-plan-image-choice, .report-plan-count-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear]') || []).forEach(element => {
            element.remove?.();
        });
    }

    function buildReportDeckExportNav(doc, editorRoot, slides = []) {
        const nav = doc.createElement('div');
        nav.className = 'report-slide-nav';
        const sourceButtons = Array.from(editorRoot?.querySelectorAll?.('[data-report-slide-target]') || []);
        slides.forEach((slide, index) => {
            const sourceButton = sourceButtons.find(button => (
                String(button?.dataset?.reportSlideTarget || '') === String(index)
            ));
            const button = sourceButton?.cloneNode?.(true) || doc.createElement('button');
            button.type = 'button';
            button.dataset.reportSlideTarget = String(index);
            button.classList?.toggle?.('is-active', index === 0);
            button.setAttribute?.('aria-current', index === 0 ? 'page' : 'false');
            if (!sourceButton) {
                const number = doc.createElement('span');
                number.textContent = String(index + 1).padStart(2, '0');
                const label = doc.createElement('strong');
                label.textContent = slide?.querySelector?.('[data-report-field$="Title"]')?.textContent || `${index + 1}`;
                button.appendChild(number);
                button.appendChild(label);
            }
            nav.appendChild(button);
        });
        return nav;
    }

    function buildReportDeckExportViewer(doc, editorRoot, slides = []) {
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
                <button type="button" class="report-deck-action-button" data-report-export-print>PDF인쇄</button>
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
        sidebar.appendChild(buildReportDeckExportNav(doc, editorRoot, slides));

        const stage = doc.createElement('section');
        stage.className = 'report-deck-stage';
        stage.dataset.reportStage = '';
        stage.setAttribute('aria-label', '보고서 슬라이드');
        stage.tabIndex = 0;
        slides.forEach((slide, index) => {
            const clone = slide.cloneNode(true);
            cleanReportDeckExportSlide(clone, index === 0);
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

    function buildReportDeckPrintOnlyCss() {
        return `
            @page { size: ${REPORT_DECK_PRINT_PAGE_WIDTH} ${REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0; }
            * { box-sizing: border-box; scrollbar-width: none !important; -ms-overflow-style: none !important; }
            *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
            html, body { width: ${REPORT_DECK_PRINT_PAGE_WIDTH}; min-height: ${REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0 !important; padding: 0 !important; overflow: visible !important; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body.report-print-body { font-family: Arial, "Malgun Gothic", sans-serif; }
            .report-print-viewer { display: block !important; width: ${REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
            .report-print-page { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; width: ${REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: ${REPORT_DECK_PRINT_PAGE_HEIGHT} !important; margin: 0 !important; padding: ${REPORT_DECK_PRINT_PAGE_MARGIN} !important; overflow: hidden !important; background: #ffffff !important; break-after: page; page-break-after: always; }
            .report-print-page:last-child, .report-print-page[data-report-print-last="true"] { break-after: auto; page-break-after: auto; }
            .report-print-slide-frame { position: relative !important; flex: 0 0 auto !important; width: ${REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: 100% !important; max-height: 100% !important; margin: 0 auto !important; padding: 0 !important; overflow: hidden !important; background: #ffffff !important; }
            .report-print-slide-image { display: block !important; width: 100% !important; height: 100% !important; object-fit: contain !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: #ffffff !important; }
            .report-print-viewer .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: ${REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: 100% !important; max-height: 100% !important; aspect-ratio: auto !important; border: 0 !important; box-shadow: none !important; break-after: auto !important; page-break-after: auto !important; overflow: hidden !important; background: #ffffff !important; }
            .report-print-viewer .report-plan-image-choice,
            .report-print-viewer .report-plan-count-control,
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

    function buildReportDeckCaptureCss() {
        return `
            html, body { margin: 0 !important; padding: 0 !important; width: ${REPORT_DECK_CAPTURE_SLIDE_WIDTH}px !important; height: ${REPORT_DECK_CAPTURE_SLIDE_HEIGHT}px !important; overflow: hidden !important; background: #ffffff !important; }
            .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; left: 0 !important; top: 0 !important; width: ${REPORT_DECK_CAPTURE_SLIDE_WIDTH}px !important; height: ${REPORT_DECK_CAPTURE_SLIDE_HEIGHT}px !important; max-width: none !important; min-width: 0 !important; min-height: 0 !important; aspect-ratio: auto !important; margin: 0 !important; border: 0 !important; box-shadow: none !important; transform: none !important; overflow: hidden !important; background: #ffffff !important; }
            .report-slide.is-active { display: block !important; }
            .report-plan-image-choice, .report-plan-count-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-export-print], [data-report-export-fullscreen], [data-report-fullscreen], [data-report-edit-toggle], [data-report-memo-overview-toggle], [data-report-print-pdf], [data-report-export-html] { display: none !important; }
            [data-report-field] { outline: 0 !important; }
        `;
    }

    function buildReportDeckCaptureHost(doc, editorRoot, slide) {
        const host = doc.createElement('div');
        host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
        host.style.width = `${REPORT_DECK_CAPTURE_SLIDE_WIDTH}px`;
        host.style.height = `${REPORT_DECK_CAPTURE_SLIDE_HEIGHT}px`;
        host.style.margin = '0';
        host.style.padding = '0';
        host.style.overflow = 'hidden';
        host.style.background = '#ffffff';

        const style = doc.createElement('style');
        style.textContent = `${getReportDeckExportStyleText(editorRoot)}\n${buildReportDeckCaptureCss()}`;
        host.appendChild(style);

        const clone = slide.cloneNode(true);
        cleanReportDeckExportSlide(clone, true);
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
                image.setAttribute?.('src', await fetchReportDeckImageAsDataUrl(source));
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

        const host = buildReportDeckCaptureHost(doc, editorRoot, slide);
        await inlineReportDeckCaptureImages(host);
        await doc.fonts?.ready?.catch?.(() => {});
        const serializedHost = new XMLSerializerCtor().serializeToString(host);
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" width="${REPORT_DECK_CAPTURE_SLIDE_WIDTH}" height="${REPORT_DECK_CAPTURE_SLIDE_HEIGHT}" viewBox="0 0 ${REPORT_DECK_CAPTURE_SLIDE_WIDTH} ${REPORT_DECK_CAPTURE_SLIDE_HEIGHT}"><foreignObject width="100%" height="100%">${serializedHost}</foreignObject></svg>`;
        return urlApi.createObjectURL(new BlobCtor([svgText], { type: 'image/svg+xml;charset=utf-8' }));
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
${baseHref ? `<base href="${escapeHtmlAttribute(baseHref)}">` : ''}
<style>
${getReportDeckExportStyleText(editorRoot)}
${buildReportDeckPrintOnlyCss()}
</style>
</head>
<body class="report-print-body">
${getNodeOuterHtml(deck)}
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
                image.setAttribute?.('src', await fetchReportDeckImageAsDataUrl(source));
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
            image.setAttribute?.('src', await fetchReportDeckImageAsDataUrl(source));
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
                @page { size: ${REPORT_DECK_PRINT_PAGE_WIDTH} ${REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0; }
                * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
                html, body { width: ${REPORT_DECK_PRINT_PAGE_WIDTH}; min-height: ${REPORT_DECK_PRINT_PAGE_HEIGHT}; margin: 0 !important; padding: 0 !important; overflow: visible; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .report-export-viewer { display: block !important; width: ${REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; background: #ffffff !important; }
                .report-export-viewer .report-deck-toolbar,
                .report-export-viewer .report-deck-sidebar { display: none !important; }
                .report-export-viewer .report-deck-workspace,
                .report-export-viewer .report-deck-stage { display: block !important; width: ${REPORT_DECK_PRINT_PAGE_WIDTH} !important; height: auto !important; min-height: 0 !important; padding: 0 !important; border: 0 !important; background: #ffffff !important; overflow: visible !important; }
                .report-export-viewer .report-slide { display: block !important; visibility: visible !important; opacity: 1 !important; position: relative !important; width: ${REPORT_DECK_PRINT_SLIDE_CSS_WIDTH} !important; height: ${REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT} !important; max-width: none !important; aspect-ratio: auto !important; margin: 27.09375mm ${REPORT_DECK_PRINT_PAGE_MARGIN} !important; border: 0 !important; box-shadow: none !important; break-after: page; page-break-after: always; overflow: hidden !important; }
                .report-export-viewer .report-slide:last-child { break-after: auto; page-break-after: auto; }
                .report-export-viewer img:not([src]),
                .report-export-viewer img[src=""] { visibility: hidden !important; }
            }
        `;
    }

    function buildReportDeckExportScript() {
        const printOnlyCss = JSON.stringify(buildReportDeckPrintOnlyCss());
        return `
(() => {
    const root = document.querySelector('[data-report-export-viewer]');
    if (!root) return;
    const slides = Array.from(root.querySelectorAll('[data-report-slide-page]'));
    const buttons = Array.from(root.querySelectorAll('[data-report-slide-target]'));
    const counter = root.querySelector('[data-report-slide-counter]');
    const stage = root.querySelector('[data-report-stage]');
    const getCurrent = () => Math.max(0, Math.min(slides.length - 1, Number.parseInt(root.dataset.reportActiveSlide || '0', 10) || 0));
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
    const captureWidth = ${REPORT_DECK_CAPTURE_SLIDE_WIDTH};
    const captureHeight = ${REPORT_DECK_CAPTURE_SLIDE_HEIGHT};
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
        clone.querySelectorAll?.('.report-plan-image-choice, .report-plan-count-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-memo-overview-toggle]')?.forEach(element => {
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
        '.report-plan-image-choice, .report-plan-count-control, .report-slide-date-input, .report-chart-highlight-controls, .report-chart-highlight-toggle, .report-chart-highlight-reset, .report-memo-overview-dialog, [data-report-plan-image-input], [data-report-plan-image-upload], [data-report-plan-image-paste], [data-report-plan-image-clear], [data-report-export-print], [data-report-export-fullscreen], [data-report-fullscreen], [data-report-edit-toggle], [data-report-memo-overview-toggle], [data-report-print-pdf], [data-report-export-html] { display: none !important; }',
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
        }
        const printButton = event.target.closest?.('[data-report-export-print]');
        if (printButton) {
            event.preventDefault();
            printSlides();
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
        const hasViewMetadata = allSlides.some(slide => String(slide?.dataset?.reportSlideView || '').trim());
        const activeView = String(editorRoot?.dataset?.reportActiveView || '').trim();
        let slides = allSlides;
        if (hasViewMetadata && activeView && activeView !== 'hq') {
            const viewSlides = allSlides.filter(slide => String(slide?.dataset?.reportSlideView || '').trim() === activeView);
            if (viewSlides.length) {
                slides = viewSlides;
            }
        }
        if (!slides.length) {
            throw new Error('report_deck_export_slides_unavailable');
        }
        const deck = buildReportDeckExportViewer(doc, editorRoot, slides);
        await inlineReportDeckExportImages(deck);
        const title = String(options.title || '공무환경팀 실적보고서').trim() || '공무환경팀 실적보고서';
        return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtmlText(title)}</title>
<style>
${getReportDeckExportStyleText(editorRoot)}
${buildReportDeckExportCss()}
</style>
</head>
<body class="report-export-body">
${getNodeOuterHtml(deck)}
<script>
${buildReportDeckExportScript()}
</script>
</body>
</html>`;
    }

    function downloadTextFile(fileName, content, mimeType = 'text/plain;charset=utf-8') {
        const doc = root.document || globalScope?.document || null;
        const BlobCtor = root.Blob || globalScope?.Blob;
        const urlApi = root.URL || globalScope?.URL;
        if (!doc || typeof doc.createElement !== 'function' || typeof BlobCtor !== 'function' || !urlApi?.createObjectURL) {
            throw new Error('report_deck_export_download_unavailable');
        }
        const blob = new BlobCtor([content], { type: mimeType });
        const objectUrl = urlApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = objectUrl;
        link.download = String(fileName || 'report.html').trim() || 'report.html';
        link.style.display = 'none';
        doc.body?.appendChild?.(link);
        link.click?.();
        link.remove?.();
        root.setTimeout?.(() => {
            urlApi.revokeObjectURL?.(objectUrl);
        }, 0);
    }

    async function exportReportDeckSingleHtml(editorRoot, options = {}) {
        const fileName = String(options.filename || '공무환경팀 실적보고서.html').trim() || '공무환경팀 실적보고서.html';
        const html = await buildReportDeckSingleHtml(editorRoot, options);
        downloadTextFile(fileName, html, 'text/html;charset=utf-8');
        return {
            ok: true,
            fileName,
            htmlLength: html.length
        };
    }

    function printReportDeckPdf(editorRoot) {
        const printWindow = editorRoot?.ownerDocument?.defaultView || root;
        if (typeof printWindow?.print !== 'function') {
            throw new Error('report_deck_print_unavailable');
        }
        const slides = getReportDeckPrintableSlides(editorRoot);
        if (slides.length && printReportDeckFrame(editorRoot, slides)) {
            return true;
        }
        printWindow.print();
        return true;
    }

    function applyMeteringSharedStoreSnapshot(store) {
        if (!isPlainObject(store)) return false;
        const localStore = cloneJson(store);
        root.__LOCAL_APP_STORE__ = localStore;
        root.__PRESET_ELECTRIC_ENTRIES__ = localStore?.resourceDatasets?.electric?.equipmentEntries
            || localStore?.equipmentEntries
            || {};
        root.__PRESET_GAS_ENTRIES__ = localStore?.resourceDatasets?.gas?.equipmentEntries || {};
        return true;
    }

    function normalizeReportDeckMonthKey(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})$/) || raw.match(/^(\d{4})(\d{2})$/);
        if (!match) return '';
        const year = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
            return '';
        }
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function parseReportDeckMonthKey(value) {
        const monthKey = normalizeReportDeckMonthKey(value);
        if (!monthKey) return null;
        return {
            key: monthKey,
            year: Number.parseInt(monthKey.slice(0, 4), 10),
            month: Number.parseInt(monthKey.slice(5, 7), 10)
        };
    }

    function toReportDeckMonthKey(year, month) {
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
    }

    function normalizeReportDeckMonthKeyList(values) {
        return Array.from(new Set((Array.isArray(values) ? values : [])
            .map(normalizeReportDeckMonthKey)
            .filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));
    }

    function getReportDeckMemoBuildCacheMap(cache, key) {
        if (!cache || typeof cache !== 'object') return null;
        if (!(cache[key] instanceof Map)) {
            cache[key] = new Map();
        }
        return cache[key];
    }

    function readReportDeckMemoBuildCache(cache, bucket, key, factory) {
        const map = getReportDeckMemoBuildCacheMap(cache, bucket);
        if (!map || !key) return factory();
        if (map.has(key)) return map.get(key);
        const value = factory();
        map.set(key, value);
        return value;
    }

    function collectReportDeckSettlementMonthsFromStore(store) {
        if (!isPlainObject(store?.resourceDatasets)) return [];
        return normalizeReportDeckMonthKeyList(Object.values(store.resourceDatasets).flatMap(dataset => (
            isPlainObject(dataset?.billingSettlementEntries)
                ? Object.keys(dataset.billingSettlementEntries)
                : []
        )));
    }

    function getReportDeckTimelineAvailableMonths(monthInfo, options = {}) {
        const directMonths = normalizeReportDeckMonthKeyList(options.availableMonths);
        const sourceMonths = directMonths.length
            ? directMonths
            : collectReportDeckSettlementMonthsFromStore(options.store);
        return sourceMonths.filter(monthKey => monthKey.localeCompare(monthInfo.key) <= 0);
    }

    function buildReportDeckMonthRange(fromMonthKey, toMonthKey) {
        const from = parseReportDeckMonthKey(fromMonthKey);
        const to = parseReportDeckMonthKey(toMonthKey);
        if (!from || !to || from.key.localeCompare(to.key) > 0) return [];
        const monthKeys = [];
        for (let year = from.year; year <= to.year; year += 1) {
            const startMonth = year === from.year ? from.month : 1;
            const endMonth = year === to.year ? to.month : 12;
            for (let month = startMonth; month <= endMonth; month += 1) {
                monthKeys.push(toReportDeckMonthKey(year, month));
            }
        }
        return monthKeys;
    }

    function buildReportDeckAnalysisTimeline(monthInfo, options = {}) {
        const availableMonths = getReportDeckTimelineAvailableMonths(monthInfo, options);
        const availableStartInfo = parseReportDeckMonthKey(availableMonths[0]);
        const startYear = Math.max(
            monthInfo.year - 2,
            availableStartInfo?.year || monthInfo.year - 2
        );
        const years = Array.from(
            { length: (monthInfo.year - startYear) + 1 },
            (_, index) => startYear + index
        );
        const from = toReportDeckMonthKey(startYear, 1);
        const to = monthInfo.key;
        const monthKeys = buildReportDeckMonthRange(from, to);
        return {
            years,
            monthKeys,
            from,
            to
        };
    }

    function toFiniteNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function parseReportDeckCostNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        const normalized = String(value || '').trim().replace(/,/g, '');
        if (!normalized) return null;
        const number = Number(normalized);
        return Number.isFinite(number) ? number : null;
    }

    function buildReportDeckMetricPair(referenceValue, currentValue) {
        const reference = toFiniteNumber(referenceValue);
        const current = toFiniteNumber(currentValue);
        const hasBoth = reference !== null && current !== null;
        const delta = hasBoth ? current - reference : null;
        const rate = hasBoth && reference !== 0 ? delta / Math.abs(reference) : null;
        return { reference, current, delta, rate };
    }

    function buildReportDeckMetricComparison(referenceValue, currentValue, previousValue) {
        const pair = buildReportDeckMetricPair(referenceValue, currentValue);
        const previous = toFiniteNumber(previousValue);
        const hasMonthComparison = previous !== null && pair.current !== null;
        const monthDelta = hasMonthComparison ? pair.current - previous : null;
        const monthRate = hasMonthComparison && previous !== 0 ? monthDelta / Math.abs(previous) : null;
        return {
            ...pair,
            previous,
            monthDelta,
            monthRate
        };
    }

    function normalizeReportDeckMemoTeamKey(value = '') {
        const key = String(value || '').trim();
        return REPORT_DECK_MEMO_TEAMS.some(team => team.key === key)
            ? key
            : REPORT_DECK_MEMO_TEAMS[0].key;
    }

    function getReportDeckMemoTeam(key = '') {
        const normalizedKey = normalizeReportDeckMemoTeamKey(key);
        return REPORT_DECK_MEMO_TEAMS.find(team => team.key === normalizedKey) || REPORT_DECK_MEMO_TEAMS[0];
    }

    function buildReportDeckMemoLineMetricKey(lineName = '') {
        const normalizedLineName = String(lineName || '').trim();
        return normalizedLineName ? `${REPORT_DECK_MEMO_LINE_METRIC_PREFIX}${normalizedLineName}` : '';
    }

    function getReportDeckMemoLineNameFromMetricKey(metricKey = '') {
        const key = String(metricKey || '').trim();
        return key.startsWith(REPORT_DECK_MEMO_LINE_METRIC_PREFIX)
            ? key.slice(REPORT_DECK_MEMO_LINE_METRIC_PREFIX.length).trim()
            : '';
    }

    function getReportDeckMemoLineNamesForTeam(teamKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        return Array.from(REPORT_DECK_MEMO_PRODUCTION_LINES[normalizedTeamKey] || []);
    }

    function isReportDeckMemoWasteMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        return REPORT_DECK_MEMO_WASTE_MEMO_KEYS.includes(normalizedMemoKey);
    }

    function isReportDeckMemoWasteMetricKey(metricKey = '') {
        return REPORT_DECK_MEMO_WASTE_METRIC_KEYS.includes(String(metricKey || '').trim());
    }

    function getReportDeckMemoUnitBaseMetricKey(metricKey = '') {
        return REPORT_DECK_MEMO_UNIT_METRIC_BASE[String(metricKey || '').trim()] || '';
    }

    function isReportDeckMemoUnitMetricKey(metricKey = '') {
        return Boolean(getReportDeckMemoUnitBaseMetricKey(metricKey));
    }

    function getReportDeckMemoWasteScopeKeyFromMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        if (normalizedMemoKey === 'slide7WasteMemo') return 'yusan';
        return 'bukjeong';
    }

    function getReportDeckMemoMetricKeysForTeam(teamKey = '', options = {}) {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        const metricKeys = Array.from(REPORT_DECK_MEMO_TEAM_METRIC_KEYS[normalizedTeamKey] || REPORT_DECK_MEMO_TEAM_METRIC_KEYS.team_01_01)
            .concat(getReportDeckMemoLineNamesForTeam(normalizedTeamKey).map(buildReportDeckMemoLineMetricKey).filter(Boolean));
        return isReportDeckMemoWasteMemoKey(options.memoKey)
            ? metricKeys.concat(Array.from(REPORT_DECK_MEMO_WASTE_METRIC_KEYS))
            : metricKeys;
    }

    function isReportDeckMemoMetricAllowed(teamKey = '', metricKey = '', options = {}) {
        return getReportDeckMemoMetricKeysForTeam(teamKey, options).includes(normalizeReportDeckMemoMetricKey(metricKey));
    }

    function getReportDeckMemoMetric(teamKey = '', metricKey = '') {
        const normalizedMetricKey = normalizeReportDeckMemoMetricKey(metricKey);
        const lineName = getReportDeckMemoLineNameFromMetricKey(normalizedMetricKey);
        if (lineName) {
            return {
                key: normalizedMetricKey,
                label: `${lineName} 생산량`,
                unit: 'kg',
                lineName
            };
        }
        return REPORT_DECK_MEMO_METRICS[normalizedMetricKey] || REPORT_DECK_MEMO_METRICS.production;
    }

    function normalizeReportDeckMemoMetricKey(value = '') {
        const key = String(value || '').trim();
        return Object.prototype.hasOwnProperty.call(REPORT_DECK_MEMO_METRICS, key) || getReportDeckMemoLineNameFromMetricKey(key)
            ? key
            : 'production';
    }

    function getReportDeckRelativeMonthKey(monthInfo, offset) {
        if (!monthInfo) return '';
        const date = new Date(monthInfo.year, monthInfo.month - 1 + offset, 1);
        return toReportDeckMonthKey(date.getFullYear(), date.getMonth() + 1);
    }

    function formatReportDeckMemoNumber(value, metric = {}) {
        const number = toFiniteNumber(value);
        if (number === null) return '';
        const absValue = Math.abs(number);
        const fixedDecimals = Number.isInteger(metric.decimals) ? Math.max(0, Math.min(metric.decimals, 6)) : null;
        const displayValue = fixedDecimals !== null
            ? Math.round((absValue + 1e-12) * (10 ** fixedDecimals)) / (10 ** fixedDecimals)
            : absValue;
        const maximumFractionDigits = fixedDecimals !== null
            ? fixedDecimals
            : metric.deltaMode === 'percentagePoint'
            ? 1
            : (metric.key === 'lng' || absValue < 100 ? 1 : 0);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatReportDeckMemoCurrentNumber(value, metric = {}) {
        const number = toFiniteNumber(value);
        if (number === null) return '';
        const absValue = Math.abs(number);
        const fixedDecimals = Number.isInteger(metric.decimals) ? Math.max(0, Math.min(metric.decimals, 6)) : null;
        const displayValue = fixedDecimals !== null
            ? Math.sign(number) * (Math.round((absValue + 1e-12) * (10 ** fixedDecimals)) / (10 ** fixedDecimals))
            : number;
        const maximumFractionDigits = fixedDecimals !== null
            ? fixedDecimals
            : metric.deltaMode === 'percentagePoint'
            ? 1
            : (metric.key === 'lng' || absValue < 100 ? 1 : 0);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatReportDeckMemoCurrentValue(metric = {}, value) {
        const text = formatReportDeckMemoCurrentNumber(value, metric);
        if (!text) return '';
        const unit = metric.deltaMode === 'percentagePoint' ? '%' : (metric.unit || '');
        return `${text}${unit}`;
    }

    function formatReportDeckMemoRate(rate) {
        const number = toFiniteNumber(rate);
        if (number === null) return '';
        return `${Math.abs(number * 100).toLocaleString('ko-KR', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        })}%`;
    }

    function getReportDeckMemoDirection(delta) {
        return delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat');
    }

    function getReportDeckMemoArrow(direction) {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '-';
    }

    function buildReportDeckMemoComparisonSegment(metric, basisLabel, referenceValue, currentValue) {
        const pair = buildReportDeckMetricPair(referenceValue, currentValue);
        if (pair.reference === null || pair.current === null || pair.delta === null) return null;
        const direction = getReportDeckMemoDirection(pair.delta);
        const arrow = getReportDeckMemoArrow(direction);
        const deltaText = `${formatReportDeckMemoNumber(pair.delta, metric)}${metric.unit || ''}`;
        if (direction === 'flat') {
            return {
                basis: basisLabel,
                direction,
                text: `${basisLabel} \uB3D9\uC77C`,
                reference: pair.reference,
                current: pair.current,
                delta: pair.delta,
                rate: pair.rate
            };
        }
        if (metric.deltaMode === 'percentagePoint') {
            return {
                basis: basisLabel,
                direction,
                text: `${basisLabel} ${deltaText} ${arrow}`,
                reference: pair.reference,
                current: pair.current,
                delta: pair.delta,
                rate: pair.rate
            };
        }
        const rateText = formatReportDeckMemoRate(pair.rate) || '-';
        return {
            basis: basisLabel,
            direction,
            text: `${basisLabel} ${deltaText}, ${rateText} ${arrow}`,
            reference: pair.reference,
            current: pair.current,
            delta: pair.delta,
            rate: pair.rate
        };
    }

    function getReportDeckMemoCombinedDirection(segments = []) {
        const directions = new Set((Array.isArray(segments) ? segments : [])
            .map(segment => segment?.direction)
            .filter(direction => direction === 'up' || direction === 'down'));
        if (directions.size > 1) return 'mixed';
        if (directions.has('up')) return 'up';
        if (directions.has('down')) return 'down';
        return 'flat';
    }

    function buildReportDeckMemoCandidate(team, metric, segments = []) {
        const normalizedSegments = (Array.isArray(segments) ? segments : []).filter(Boolean);
        if (!normalizedSegments.length) return null;
        const currentSegment = normalizedSegments.find(segment => toFiniteNumber(segment?.current) !== null) || null;
        const currentText = formatReportDeckMemoCurrentValue(metric, currentSegment?.current);
        const currentValueText = currentText ? ` ${currentText}` : '';
        return {
            direction: getReportDeckMemoCombinedDirection(normalizedSegments),
            text: `${team.label} ${metric.label}${currentValueText} ${normalizedSegments.map(segment => segment.text).join(', ')}`,
            segments: normalizedSegments
        };
    }

    function getReportDeckMemoGasTeamNames(team, metricKey, optionApi) {
        if (!isReportDeckMemoMetricAllowed(team?.key, metricKey)) return [];
        const option = optionApi?.getUtilGasAnalysisCategoryOption?.(team.key) || null;
        const configuredNames = option?.key === team.key && Array.isArray(option?.usageTeams?.[metricKey])
            ? option.usageTeams[metricKey].filter(Boolean)
            : [];
        if (configuredNames.length) return configuredNames;
        if (metricKey === 'lng') return [`${team.label} (LNG)`];
        if (metricKey === 'lpg') return team.key === 'team_01_02' ? [`${team.label} (LPG)`] : [];
        return [];
    }

    function getReportDeckMemoProductionValueForTeamNames(monthKey, teamNames = [], gasApi, memoBuildCache = null) {
        const normalizedTeamNames = (Array.isArray(teamNames) ? teamNames : [])
            .map(teamName => String(teamName || '').trim())
            .filter(Boolean);
        if (!normalizedTeamNames.length || typeof gasApi?.getUtilGasAnalysisProductionValue !== 'function') return null;
        const cacheKey = `${monthKey}|${normalizedTeamNames.join(',')}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'productionValues',
            cacheKey,
            () => toFiniteNumber(gasApi.getUtilGasAnalysisProductionValue(monthKey, normalizedTeamNames))
        );
    }

    function getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache = null) {
        return getReportDeckMemoProductionValueForTeamNames(monthKey, [team.label], gasApi, memoBuildCache);
    }

    function getReportDeckMemoYusanProductionShareValue(monthKey, team, gasApi, memoBuildCache = null) {
        const teamKey = normalizeReportDeckMemoTeamKey(team?.key);
        if (!REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS.includes(teamKey)) return null;
        const teamProduction = getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        const yusanTeamNames = REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS
            .map(key => getReportDeckMemoTeam(key).label);
        const yusanProduction = getReportDeckMemoProductionValueForTeamNames(monthKey, yusanTeamNames, gasApi, memoBuildCache);
        return teamProduction !== null && yusanProduction !== null && yusanProduction > 0
            ? (teamProduction / yusanProduction) * 100
            : null;
    }

    function getReportDeckMemoGasUsageValue(monthKey, team, metricKey, optionApi, gasApi) {
        const teamNames = getReportDeckMemoGasTeamNames(team, metricKey, optionApi);
        if (!teamNames.length || typeof gasApi?.getUtilGasAnalysisTeamUsageValue !== 'function') return null;
        const value = gasApi.getUtilGasAnalysisTeamUsageValue(monthKey, teamNames);
        return toFiniteNumber(value);
    }

    function getReportDeckMemoRatioValue(usage, production) {
        const usageValue = toFiniteNumber(usage);
        const productionValue = toFiniteNumber(production);
        return usageValue !== null && productionValue !== null && productionValue > 0
            ? usageValue / productionValue
            : null;
    }

    function getReportDeckMemoGasMetricMap(monthInfo, team, optionApi, gasApi, memoBuildCache = null) {
        if (!monthInfo || typeof gasApi?.buildUtilGasAnalysisMetricMap !== 'function') return null;
        const option = optionApi?.getUtilGasAnalysisCategoryOption?.(team.key) || { key: team.key };
        const monthKeys = [
            toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month),
            getReportDeckRelativeMonthKey(monthInfo, -1),
            monthInfo.key
        ];
        const cacheKey = `${team.key || team.label || ''}|${monthKeys.join(',')}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'gasMetricMaps',
            cacheKey,
            () => gasApi.buildUtilGasAnalysisMetricMap(monthKeys, option) || null
        );
    }

    function getReportDeckMemoGasUnitValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache = null, monthInfo = null) {
        const metricMap = getReportDeckMemoGasMetricMap(monthInfo, team, optionApi, gasApi, memoBuildCache);
        const metric = metricMap instanceof Map ? metricMap.get(monthKey) || {} : {};
        const usageFromMap = fuelKey === 'lpg' ? metric?.lpgUsage : metric?.lngUsage;
        const usage = toFiniteNumber(usageFromMap) ?? getReportDeckMemoGasUsageValue(monthKey, team, fuelKey, optionApi, gasApi);
        const production = toFiniteNumber(metric?.ratioProduction?.[fuelKey] ?? metric?.production)
            ?? getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        return getReportDeckMemoRatioValue(usage, production);
    }

    function getReportDeckMemoElectricRows(monthInfo, team, optionApi, electricApi, memoBuildCache = null) {
        if (!monthInfo || typeof electricApi?.buildUtilElectricAnalysisScopedRows !== 'function') return [];
        const option = optionApi?.getUtilElectricAnalysisTeamOption?.(team.key) || {
            key: team.key,
            label: team.label,
            reportTeamFilters: [team.label],
            productionTeamNames: [team.label]
        };
        const from = toReportDeckMonthKey(monthInfo.year - 1, monthInfo.month);
        const cacheKey = `${team.key || team.label || ''}|${from}|${monthInfo.key}`;
        return readReportDeckMemoBuildCache(
            memoBuildCache,
            'electricRows',
            cacheKey,
            () => electricApi.buildUtilElectricAnalysisScopedRows({ from, to: monthInfo.key }, option) || []
        );
    }

    function getReportDeckMemoElectricValue(rowMap, monthKey) {
        return toFiniteNumber(rowMap instanceof Map ? rowMap.get(monthKey)?.electricUsage : null);
    }

    function getReportDeckMemoElectricUnitValue(rowMap, monthKey, team, gasApi) {
        const usage = getReportDeckMemoElectricValue(rowMap, monthKey);
        const rowProduction = readReportDeckElectricRow(rowMap, monthKey, 'production');
        const production = rowProduction !== null ? rowProduction : getReportDeckMemoProductionValue(monthKey, team, gasApi);
        return getReportDeckMemoRatioValue(usage, production);
    }

    function getReportDeckMemoProductionLineValueMap(monthKeys = [], team, lineName = '', optionApi, electricApi, memoBuildCache = null) {
        if (!team || !lineName || typeof electricApi?.buildUtilElectricAnalysisLineRatioSeries !== 'function') {
            return new Map();
        }
        const option = optionApi?.getUtilElectricAnalysisTeamOption?.(team.key) || {
            key: team.key,
            label: team.label,
            reportTeamFilters: [team.label],
            productionTeamNames: [team.label]
        };
        const normalizedMonthKeys = Array.from(new Set((Array.isArray(monthKeys) ? monthKeys : [])
            .map(monthKey => String(monthKey || '').trim())
            .filter(Boolean)));
        const activeMonthKey = normalizedMonthKeys[normalizedMonthKeys.length - 1] || '';
        const referenceMonthKey = normalizedMonthKeys[0] || '';
        const cacheKey = `${team.key || team.label || ''}|${lineName}|${normalizedMonthKeys.join(',')}`;
        return readReportDeckMemoBuildCache(memoBuildCache, 'lineValueMaps', cacheKey, () => {
        const seriesList = electricApi.buildUtilElectricAnalysisLineRatioSeries(
            normalizedMonthKeys,
            option,
            activeMonthKey,
            referenceMonthKey
        );
        const targetSeries = (Array.isArray(seriesList) ? seriesList : []).find(series => (
            String(series?.title || '').trim() === String(lineName || '').trim()
        ));
        const valueMap = new Map();
        (Array.isArray(targetSeries?.points) ? targetSeries.points : []).forEach(point => {
            const monthKey = String(point?.monthKey || point?.key || '').trim();
            const value = toFiniteNumber(point?.amountValue);
            if (monthKey && value !== null) {
                valueMap.set(monthKey, value);
            }
        });
        return valueMap;
        });
    }

    function parseReportDeckProductionAmount(value) {
        const parsed = typeof parseUtilAmount === 'function' ? parseUtilAmount(value) : toFiniteNumber(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function parseReportDeckProductionPercent(value) {
        const parsed = typeof parseUtilPercentAmount === 'function' ? parseUtilPercentAmount(value) : toFiniteNumber(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function normalizeReportDeckProductionTeamName(value = '') {
        if (typeof normalizeUtilTeamName === 'function') return normalizeUtilTeamName(value);
        return String(value || '').trim();
    }

    function normalizeReportDeckProductionText(value = '') {
        const normalized = typeof normalizeUtilDedupeText === 'function'
            ? normalizeUtilDedupeText(value)
            : String(value || '').trim().replace(/\s+/g, ' ');
        return String(normalized || '').trim();
    }

    function normalizeReportDeckProductKey(value = '') {
        return normalizeReportDeckProductionText(value).toLowerCase();
    }

    function formatReportDeckDateKey(date) {
        if (!date || typeof date.getFullYear !== 'function' || typeof date.getTime !== 'function' || Number.isNaN(date.getTime())) return '';
        return [
            String(date.getFullYear()).padStart(4, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function normalizeReportDeckDateKey(value = '') {
        if (value && typeof value.getFullYear === 'function') return formatReportDeckDateKey(value);
        const raw = String(value || '').trim();
        const match = raw.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})$/);
        if (!match) return '';
        return [
            match[1],
            String(Number(match[2])).padStart(2, '0'),
            String(Number(match[3])).padStart(2, '0')
        ].join('-');
    }

    function getReportDeckProductionEntryDateKey(entry = {}) {
        return normalizeReportDeckDateKey(entry?.dateLabel || entry?.date || entry?.productionDate);
    }

    function getReportDeckProductionEntryDedupeKey(entry = {}, teamLabel = '') {
        const entryKey = String(entry?.entryKey || '').trim();
        if (entryKey) return entryKey;
        return [
            getReportDeckProductionEntryDateKey(entry),
            normalizeReportDeckProductionText(entry?.teamName || entry?.team || teamLabel),
            normalizeReportDeckProductionText(entry?.lineName || entry?.line || ''),
            normalizeReportDeckProductionText(entry?.productName || entry?.product || entry?.itemName || ''),
            String(parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value) ?? '')
        ].join('::');
    }

    function dedupeReportDeckProductionEntries(entries = [], teamLabel = '') {
        const seen = new Set();
        return (Array.isArray(entries) ? entries : []).filter(entry => {
            const amount = parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
            if (amount === null) return false;
            const dedupeKey = getReportDeckProductionEntryDedupeKey(entry, teamLabel);
            if (!dedupeKey || seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });
    }

    function getReportDeckMemoProductionEntries(monthKey = '', team = {}) {
        const monthInfo = parseReportDeckMonthKey(monthKey);
        if (!monthInfo) return { period: null, entries: [] };
        if (typeof listUtilDailyEntriesByMetric !== 'function') {
            return { period: null, entries: [] };
        }
        const listed = listUtilDailyEntriesByMetric(team.label, monthInfo.year, monthInfo.month, 'amount');
        return {
            period: listed?.period || null,
            entries: dedupeReportDeckProductionEntries(listed?.entries || [], team.label)
        };
    }

    function getReportDeckProductionIndexEntriesForTeam(team = {}) {
        const productionIndex = typeof UTIL_PRODUCTION_DAILY_INDEX !== 'undefined'
            ? UTIL_PRODUCTION_DAILY_INDEX
            : root.UTIL_PRODUCTION_DAILY_INDEX;
        if (!productionIndex || typeof productionIndex !== 'object') return [];
        const sourceTeams = typeof resolveUtilProductionSourceTeams === 'function'
            ? resolveUtilProductionSourceTeams(team.label)
            : [team.label];
        return (Array.isArray(sourceTeams) ? sourceTeams : [])
            .flatMap(sourceTeam => {
                const teamKey = normalizeReportDeckProductionTeamName(sourceTeam);
                return Array.isArray(productionIndex?.[teamKey]) ? productionIndex[teamKey] : [];
            });
    }

    function getReportDeckMemoProductionActiveDateRange(team = {}) {
        const dateKeys = getReportDeckProductionIndexEntriesForTeam(team)
            .map(getReportDeckProductionEntryDateKey)
            .filter(Boolean)
            .sort();
        if (!dateKeys.length) return null;
        return {
            first: dateKeys[0],
            last: dateKeys[dateKeys.length - 1]
        };
    }

    function buildReportDeckDateKeysForPeriod(period = null) {
        const startDate = period?.startDate && typeof period.startDate.getFullYear === 'function' ? period.startDate : null;
        const endDate = period?.endDate && typeof period.endDate.getFullYear === 'function' ? period.endDate : null;
        if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
        const dateKeys = [];
        const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        while (cursor.getTime() <= last.getTime()) {
            dateKeys.push(formatReportDeckDateKey(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
        return dateKeys;
    }

    function buildReportDeckMemoProductionStats(monthKey = '', team = {}) {
        const { period, entries } = getReportDeckMemoProductionEntries(monthKey, team);
        const activeEntries = entries
            .map(entry => ({
                entry,
                amount: parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value),
                dateKey: getReportDeckProductionEntryDateKey(entry),
                productKey: normalizeReportDeckProductKey(entry?.productName || entry?.product || entry?.itemName || ''),
                yieldRate: parseReportDeckProductionPercent(entry?.moistureExcludedYield),
                equipmentCapa: parseReportDeckProductionAmount(entry?.equipmentCapa),
                operationRate: parseReportDeckProductionPercent(entry?.equipmentUtilization),
                workTime: parseReportDeckProductionAmount(entry?.workTime ?? entry?.inputTime ?? entry?.feedTime ?? entry?.loadingTime ?? entry?.injectionTime),
                operationTime: parseReportDeckProductionAmount(entry?.operationTime ?? entry?.operatingTime ?? entry?.runtime ?? entry?.runTime ?? entry?.operationHours)
            }))
            .filter(item => item.amount !== null && item.amount > 0);

        const activeDateSet = new Set(activeEntries.map(item => item.dateKey).filter(Boolean));
        const productSet = new Set(activeEntries.map(item => item.productKey).filter(Boolean));
        let totalAmount = 0;
        let totalEquipmentCapa = 0;
        let hasEquipmentCapa = false;
        let yieldSum = 0;
        let yieldCount = 0;
        let weightedYieldSum = 0;
        let weightedYieldWeight = 0;
        let operationSum = 0;
        let operationCount = 0;
        let totalWorkTime = 0;
        let hasWorkTime = false;
        let totalOperationTime = 0;
        let hasOperationTime = false;

        activeEntries.forEach(item => {
            totalAmount += item.amount;
            if (item.yieldRate !== null) {
                yieldSum += item.yieldRate;
                yieldCount += 1;
                weightedYieldSum += item.yieldRate * item.amount;
                weightedYieldWeight += item.amount;
            }
            if (item.equipmentCapa !== null) {
                totalEquipmentCapa += item.equipmentCapa;
                hasEquipmentCapa = true;
            }
            if (item.operationRate !== null) {
                operationSum += item.operationRate;
                operationCount += 1;
            }
            if (item.workTime !== null) {
                totalWorkTime += item.workTime;
                hasWorkTime = true;
            }
            if (item.operationTime !== null) {
                totalOperationTime += item.operationTime;
                hasOperationTime = true;
            }
        });

        const activeRange = getReportDeckMemoProductionActiveDateRange(team);
        const offDays = activeRange
            ? buildReportDeckDateKeysForPeriod(period)
                .filter(dateKey => dateKey > activeRange.first && dateKey < activeRange.last && !activeDateSet.has(dateKey))
                .length
            : null;

        return {
            yieldRate: weightedYieldWeight > 0
                ? weightedYieldSum / weightedYieldWeight
                : (yieldCount > 0 ? yieldSum / yieldCount : null),
            operationRate: hasEquipmentCapa && totalEquipmentCapa > 0
                ? (totalAmount / totalEquipmentCapa) * 100
                : (operationCount > 0 ? operationSum / operationCount : null),
            workTime: hasWorkTime ? totalWorkTime : null,
            operationTime: hasOperationTime ? totalOperationTime : null,
            productionDays: activeDateSet.size,
            offDays,
            productCount: productSet.size
        };
    }

    function readReportDeckMemoProductionStatValue(monthKey = '', team = {}, metricKey = '', memoBuildCache = null) {
        const cacheKey = `${team.key || team.label || ''}|${monthKey}`;
        const stats = readReportDeckMemoBuildCache(
            memoBuildCache,
            'productionStats',
            cacheKey,
            () => buildReportDeckMemoProductionStats(monthKey, team)
        );
        if (metricKey === 'yield_rate') return toFiniteNumber(stats.yieldRate);
        if (metricKey === 'operation_rate') return toFiniteNumber(stats.operationRate);
        if (metricKey === 'work_time') return toFiniteNumber(stats.workTime);
        if (metricKey === 'operation_time') return toFiniteNumber(stats.operationTime);
        if (metricKey === 'production_days') return toFiniteNumber(stats.productionDays);
        if (metricKey === 'off_days') return toFiniteNumber(stats.offDays);
        if (metricKey === 'product_count') return toFiniteNumber(stats.productCount);
        return null;
    }

    function readReportDeckMemoWasteValue(rowMap, monthKey = '', metric = {}) {
        if (Object.prototype.hasOwnProperty.call(metric, 'wasteDetailKey')) {
            return readReportDeckWasteCostDetail(rowMap, monthKey, metric.wasteDetailKey);
        }
        return readReportDeckWasteRow(rowMap, monthKey, metric.wasteValueKey);
    }

    async function buildReportDeckMemoCandidates(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', candidates: [] };
        }
        const memoBuildCache = options.memoBuildCache && typeof options.memoBuildCache === 'object'
            ? options.memoBuildCache
            : null;
        if (options.skipUtilityReady !== true && isPlainObject(options.store)) {
            applyMeteringSharedStoreSnapshot(options.store);
        }
        if (options.skipUtilityReady !== true) {
            await ensureReportDeckUtilityDataReady();
        }

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        const electricApi = root.KPIUtilReportSheetAnalysisElectricModel || null;
        const team = getReportDeckMemoTeam(options.teamKey);
        const metricKey = normalizeReportDeckMemoMetricKey(options.metricKey);
        const availableMetricKeys = getReportDeckMemoMetricKeysForTeam(team.key, options);
        if (!isReportDeckMemoMetricAllowed(team.key, metricKey, options)) {
            return {
                ok: true,
                teamKey: team.key,
                metricKey,
                availableMetricKeys,
                monthKey: activeMonthInfo.key,
                candidates: []
            };
        }
        const metric = getReportDeckMemoMetric(team.key, metricKey);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const previousYearKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const currentMonthKey = activeMonthInfo.key;
        let readValue = () => null;
        let candidateSubject = team;
        const unitBaseMetricKey = getReportDeckMemoUnitBaseMetricKey(metricKey);

        if (metric.lineName) {
            const lineValueMap = getReportDeckMemoProductionLineValueMap(
                [previousYearKey, previousMonthKey, currentMonthKey],
                team,
                metric.lineName,
                optionApi,
                electricApi,
                memoBuildCache
            );
            readValue = monthKey => toFiniteNumber(lineValueMap.get(monthKey));
        } else if (metricKey === REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY) {
            readValue = monthKey => getReportDeckMemoYusanProductionShareValue(monthKey, team, gasApi, memoBuildCache);
        } else if (REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS.includes(metricKey)) {
            readValue = monthKey => readReportDeckMemoProductionStatValue(monthKey, team, metricKey, memoBuildCache);
        } else if (metricKey === 'electric' || metricKey === 'electric_unit') {
            const rows = getReportDeckMemoElectricRows(activeMonthInfo, team, optionApi, electricApi, memoBuildCache);
            const rowMap = new Map((Array.isArray(rows) ? rows : [])
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([key]) => key));
            readValue = metricKey === 'electric_unit'
                ? monthKey => getReportDeckMemoElectricUnitValue(rowMap, monthKey, team, gasApi)
                : monthKey => getReportDeckMemoElectricValue(rowMap, monthKey);
        } else if (metricKey === 'production') {
            readValue = monthKey => getReportDeckMemoProductionValue(monthKey, team, gasApi, memoBuildCache);
        } else if (metricKey === 'lng' || metricKey === 'lpg' || unitBaseMetricKey === 'lng' || unitBaseMetricKey === 'lpg') {
            const fuelKey = unitBaseMetricKey || metricKey;
            readValue = isReportDeckMemoUnitMetricKey(metricKey)
                ? monthKey => getReportDeckMemoGasUnitValue(monthKey, team, fuelKey, optionApi, gasApi, memoBuildCache, activeMonthInfo)
                : monthKey => getReportDeckMemoGasUsageValue(monthKey, team, fuelKey, optionApi, gasApi);
        } else if (isReportDeckMemoWasteMetricKey(metricKey)) {
            const wasteApi = root.KPIUtilReportSheetAnalysisWasteModel || null;
            const scopeConfig = getReportDeckWasteScopeConfig(getReportDeckMemoWasteScopeKeyFromMemoKey(options.memoKey));
            const wasteRows = readReportDeckMemoBuildCache(
                memoBuildCache,
                'wasteRows',
                `${scopeConfig.key || scopeConfig.label || ''}|${currentMonthKey}`,
                () => buildReportDeckWasteRows(wasteApi, scopeConfig, currentMonthKey)
            );
            const wasteRowMap = new Map((Array.isArray(wasteRows) ? wasteRows : [])
                .map(row => [String(row?.monthKey || '').trim(), row])
                .filter(([key]) => key));
            candidateSubject = { label: scopeConfig.label };
            readValue = monthKey => readReportDeckMemoWasteValue(wasteRowMap, monthKey, metric);
        }

        const currentValue = readValue(currentMonthKey);
        const comparisonSegments = [
            buildReportDeckMemoComparisonSegment(metric, '전월대비', readValue(previousMonthKey), currentValue),
            buildReportDeckMemoComparisonSegment(metric, '전년대비', readValue(previousYearKey), currentValue)
        ].filter(Boolean);
        const candidate = buildReportDeckMemoCandidate(candidateSubject, metric, comparisonSegments);
        const candidates = candidate ? [candidate] : [];

        return {
            ok: true,
            teamKey: team.key,
            metricKey,
            availableMetricKeys,
            monthKey: currentMonthKey,
            candidates
        };
    }

    function cloneReportDeckMemoOverviewCandidate(candidate = {}, meta = {}) {
        return {
            ...candidate,
            ...meta,
            segments: Array.isArray(candidate?.segments)
                ? candidate.segments.map(segment => ({ ...segment }))
                : []
        };
    }

    async function collectReportDeckMemoOverviewGroup(monthKey = '', group = {}, metricKeys = [], options = {}, seen = new Set()) {
        const candidates = [];
        for (const metricKey of Array.from(new Set((Array.isArray(metricKeys) ? metricKeys : []).filter(Boolean)))) {
            const result = await buildReportDeckMemoCandidates(monthKey, {
                store: options.store,
                teamKey: group.teamKey,
                metricKey,
                memoKey: group.memoKey || '',
                memoBuildCache: options.memoBuildCache || null,
                skipUtilityReady: options.skipUtilityReady === true
            });
            if (result?.ok !== true) continue;
            const metric = getReportDeckMemoMetric(group.teamKey, metricKey);
            (Array.isArray(result.candidates) ? result.candidates : []).forEach(candidate => {
                const text = String(candidate?.text || '').trim();
                const dedupeKey = `${group.key || group.teamKey}:${result.teamKey}:${metricKey}:${text}`;
                if (!text || seen.has(dedupeKey)) return;
                seen.add(dedupeKey);
                candidates.push(cloneReportDeckMemoOverviewCandidate(candidate, {
                    groupKey: group.key || group.teamKey,
                    groupLabel: group.label || getReportDeckMemoTeam(group.teamKey).label,
                    teamKey: result.teamKey,
                    teamLabel: getReportDeckMemoTeam(result.teamKey).label,
                    metricKey,
                    metricLabel: metric.label
                }));
            });
        }
        return {
            key: group.key || group.teamKey,
            label: group.label || getReportDeckMemoTeam(group.teamKey).label,
            candidates
        };
    }

    async function buildReportDeckMemoOverview(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', groups: [], candidates: [] };
        }
        if (isPlainObject(options.store)) {
            applyMeteringSharedStoreSnapshot(options.store);
        }
        await ensureReportDeckUtilityDataReady();

        const seen = new Set();
        const groups = [];
        const memoBuildCache = {};
        for (const team of REPORT_DECK_MEMO_TEAMS) {
            const group = await collectReportDeckMemoOverviewGroup(
                activeMonthInfo.key,
                { key: team.key, label: team.label, teamKey: team.key },
                getReportDeckMemoMetricKeysForTeam(team.key),
                { store: null, memoBuildCache, skipUtilityReady: true },
                seen
            );
            if (group.candidates.length) groups.push(group);
        }
        for (const scope of REPORT_DECK_MEMO_WASTE_OVERVIEW_SCOPES) {
            const group = await collectReportDeckMemoOverviewGroup(
                activeMonthInfo.key,
                scope,
                REPORT_DECK_MEMO_WASTE_METRIC_KEYS,
                { store: null, memoBuildCache, skipUtilityReady: true },
                seen
            );
            if (group.candidates.length) groups.push(group);
        }
        return {
            ok: true,
            monthKey: activeMonthInfo.key,
            groups,
            candidates: groups.flatMap(group => group.candidates)
        };
    }

    function readReportDeckMetric(map, monthKey, metricKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        return toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckGasLngCost(map, monthKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        const lngCost = toFiniteNumber(item?.lngCost);
        return lngCost !== null ? lngCost : toFiniteNumber(item?.gasCost);
    }

    function readReportDeckGasLpgCost(map, monthKey) {
        if (!map || typeof map.get !== 'function') return null;
        const item = map.get(monthKey) || null;
        return toFiniteNumber(item?.lpgCost);
    }

    function readReportDeckGasLpgConversionCost(map, monthKey) {
        if (map && typeof map.get === 'function') {
            const item = map.get(monthKey) || null;
            const metricValue = toFiniteNumber(item?.lpgConversionCost);
            if (metricValue !== null) return metricValue;
        }
        const billingApi = root.KPIUtilReportSheetBilling || null;
        const scopeKeys = root.KPIUtilReportSheetConfig?.UTIL_GAS_BILLING_SCOPE_KEYS || {};
        const getFields = typeof billingApi?.getUtilGasBillingScopeFields === 'function'
            ? billingApi.getUtilGasBillingScopeFields.bind(billingApi)
            : null;
        if (!getFields) return null;
        const fields = getFields(
            monthKey,
            scopeKeys.yusanLpgConversion || 'yusan_lpg_conversion'
        );
        return parseReportDeckCostNumber(fields?.billing_amount);
    }

    function divideReportDeckMetricValues(numeratorValue, denominatorValue) {
        const numerator = toFiniteNumber(numeratorValue);
        const denominator = toFiniteNumber(denominatorValue);
        return numerator !== null && denominator !== null && denominator !== 0 ? numerator / denominator : null;
    }

    function divideReportDeckPositiveMetricValues(numeratorValue, denominatorValue) {
        const numerator = toFiniteNumber(numeratorValue);
        const denominator = normalizeReportDeckPositiveMetric(denominatorValue);
        return numerator !== null && denominator !== null ? numerator / denominator : null;
    }

    function buildReportDeckRatioMetricComparison(
        referenceNumerator,
        currentNumerator,
        previousNumerator,
        referenceDenominator,
        currentDenominator,
        previousDenominator
    ) {
        return buildReportDeckMetricComparison(
            divideReportDeckPositiveMetricValues(referenceNumerator, referenceDenominator),
            divideReportDeckPositiveMetricValues(currentNumerator, currentDenominator),
            divideReportDeckPositiveMetricValues(previousNumerator, previousDenominator)
        );
    }

    function normalizeReportDeckPositiveMetric(value) {
        const number = toFiniteNumber(value);
        return number !== null && number > 0 ? number : null;
    }

    function getReportDeckGasBillingScopeKey(scopeConfig = {}) {
        const scopeKeys = root.KPIUtilReportSheetConfig?.UTIL_GAS_BILLING_SCOPE_KEYS || {};
        if (scopeConfig.key === 'yusan') {
            return scopeKeys.yusanLng || 'yusan_lng';
        }
        return scopeKeys.bukjeong || 'gas_bukjeong';
    }

    function readReportDeckGasUsageCharge(monthKey, scopeConfig = {}) {
        const billingApi = root.KPIUtilReportSheetBilling || null;
        const getFields = typeof billingApi?.getUtilGasBillingScopeFields === 'function'
            ? billingApi.getUtilGasBillingScopeFields.bind(billingApi)
            : null;
        if (!getFields) return null;
        const fields = getFields(monthKey, getReportDeckGasBillingScopeKey(scopeConfig));
        return parseReportDeckCostNumber(fields?.power_charge);
    }

    function readReportDeckElectricRow(rowMap, monthKey, metricKey) {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        return toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckWasteRow(rowMap, monthKey, metricKey) {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        return toFiniteNumber(item?.[metricKey]);
    }

    function readReportDeckWasteCostDetail(rowMap, monthKey, detailKey = '') {
        const item = rowMap instanceof Map ? rowMap.get(monthKey) : null;
        if (!detailKey) return toFiniteNumber(item?.wasteCost);
        return toFiniteNumber(item?.wasteCostDetails?.[detailKey]);
    }

    function calculateReportDeckWasteIntensity(row = {}) {
        const usage = toFiniteNumber(row?.wasteUsage);
        const production = toFiniteNumber(row?.production);
        if (usage === null || production === null || production <= 0) return null;
        return usage / (production / 1000);
    }

    function normalizeReportDeckUtilityScopeKey(value = '') {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'yusan' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckUtilityScopeConfig(scopeKey = '') {
        const normalized = normalizeReportDeckUtilityScopeKey(scopeKey);
        if (normalized === 'yusan') {
            return {
                key: 'yusan',
                label: '유산',
                gasCategoryKey: 'yusan',
                electricTeamKey: 'yusan',
                electricMeterTeamKey: 'combined',
                gasChartTitle: '유산 LNG (m³) / 생산량(kg)',
                electricChartTitle: '유산 전기 (kWh) / 생산량(kg)'
            };
        }
        return {
            key: 'bukjeong',
            label: '북정',
            gasCategoryKey: 'team_01_01',
            electricTeamKey: 'team_01_01',
            electricMeterTeamKey: '',
            gasChartTitle: '북정 LNG (m³) / 생산량(kg)',
            electricChartTitle: '북정 전기 (kWh) / 생산량(kg)'
        };
    }

    function normalizeReportDeckWasteScopeKey(value = '') {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'yusan' ? 'yusan' : 'bukjeong';
    }

    function getReportDeckWasteScopeConfig(scopeKey = '') {
        const normalized = normalizeReportDeckWasteScopeKey(scopeKey);
        if (normalized === 'yusan') {
            return {
                key: 'yusan',
                label: '유산',
                siteKey: 'yusan',
                chartTitle: '유산 폐수 (m³) / 톤'
            };
        }
        return {
            key: 'bukjeong',
            label: '북정',
            siteKey: 'bukjeong',
            chartTitle: '북정 폐수 (m³) / 톤'
        };
    }

    function buildReportDeckYusanElectricFallbackOption() {
        return {
            key: 'yusan',
            label: '유산',
            reportTeamFilters: ['1팀 2파트', '2팀', '3팀', '관리동'],
            productionTeamNames: ['1팀 2파트', '2팀', '3팀']
        };
    }

    function buildReportDeckWasteRows(wasteApi, scopeConfig, monthKey) {
        if (typeof wasteApi?.buildUtilWasteAnalysisScopedDatasetResult === 'function') {
            const result = wasteApi.buildUtilWasteAnalysisScopedDatasetResult(monthKey, scopeConfig.siteKey);
            if (Array.isArray(result?.allRows) && result.allRows.length) return result.allRows;
            if (Array.isArray(result?.rows) && result.rows.length) return result.rows;
        }
        if (typeof wasteApi?.buildUtilWasteAnalysisModel === 'function') {
            const model = wasteApi.buildUtilWasteAnalysisModel(monthKey, 'year', scopeConfig.siteKey);
            const rows = model?.datasetResult?.allRows || model?.datasetResult?.rows || [];
            if (Array.isArray(rows)) return rows;
        }
        return [];
    }

    function resolveReportDeckElectricOption(optionApi, scopeConfig) {
        if (scopeConfig.key === 'yusan') {
            const meterOption = typeof optionApi?.getUtilElectricMeterTeamOption === 'function'
                ? optionApi.getUtilElectricMeterTeamOption(scopeConfig.electricMeterTeamKey || 'combined')
                : null;
            const fallback = buildReportDeckYusanElectricFallbackOption();
            return {
                ...(meterOption || fallback),
                key: 'yusan',
                label: '유산'
            };
        }
        return optionApi?.getUtilElectricAnalysisTeamOption?.(scopeConfig.electricTeamKey) || { key: scopeConfig.electricTeamKey };
    }

    function buildReportDeckRatioSeries(timeline, activeMonthInfo, valueGetter) {
        const meta = [
            { color: '#5b9bd5', marker: 'triangle' },
            { color: '#70ad47', marker: 'square' },
            { color: '#e15759', marker: 'diamond' }
        ];
        const monthKeySet = new Set(Array.isArray(timeline?.monthKeys) ? timeline.monthKeys : []);
        return timeline.years.map((year, index) => ({
            key: String(year),
            label: `${String(year).slice(2)}년`,
            color: meta[index]?.color || '#64748b',
            marker: meta[index]?.marker || 'circle',
            points: Array.from({ length: 12 }, (_, pointIndex) => {
                const month = pointIndex + 1;
                const monthKey = toReportDeckMonthKey(year, month);
                const value = !monthKeySet.has(monthKey) || (year === activeMonthInfo.year && month > activeMonthInfo.month)
                    ? null
                    : toFiniteNumber(valueGetter(monthKey));
                return {
                    month,
                    monthKey,
                    value: value !== null && value > 0 ? value : null
                };
            })
        }));
    }

    const REPORT_DECK_PRODUCTION_START_CONFIGS = Object.freeze({
        team_01: Object.freeze({
            key: 'team_01',
            label: '1\uD300',
            parts: Object.freeze([
                Object.freeze({
                    key: 'part1',
                    order: 1,
                    label: '1\uD30C\uD2B8',
                    sourceTeamKey: 'team_01_01',
                    rows: Object.freeze([
                        Object.freeze({ key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' }),
                        Object.freeze({ key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' })
                    ])
                }),
                Object.freeze({
                    key: 'part2',
                    order: 2,
                    label: '2\uD30C\uD2B8',
                    sourceTeamKey: 'team_01_02',
                    rows: Object.freeze([
                        Object.freeze({ key: 'ica', label: 'ICA', color: '#4472c4', marker: 'circle' }),
                        Object.freeze({ key: 'jidae', label: '\uC9C0\uB300', color: '#ff0000', marker: 'circle' })
                    ])
                })
            ])
        })
    });

    function getReportDeckProductionStartConfig(teamKey = '') {
        const key = String(teamKey || 'team_01').trim() || 'team_01';
        return REPORT_DECK_PRODUCTION_START_CONFIGS[key] || REPORT_DECK_PRODUCTION_START_CONFIGS.team_01;
    }

    function buildReportDeckProductionStartMonthRange(activeMonthInfo) {
        if (!activeMonthInfo) return [];
        const from = toReportDeckMonthKey(activeMonthInfo.year - 2, activeMonthInfo.month);
        return buildReportDeckMonthRange(from, activeMonthInfo.key).slice(-25);
    }

    function normalizeReportDeckProductionStartTextToken(value = '') {
        return normalizeReportDeckProductionText(value)
            .replace(/[^a-z0-9가-힣]/gi, '')
            .toLowerCase();
    }

    function isReportDeckProductionStartBlankLineName(value = '') {
        const raw = String(value || '').trim();
        const token = normalizeReportDeckProductionStartTextToken(raw);
        return !token
            || raw === '-'
            || token === '없음'
            || token === '미입력'
            || token === '라인없음'
            || token === '라인미정'
            || token === 'na'
            || token === 'n/a';
    }

    function normalizeReportDeckProductionStartLineText(entry = {}, includeProduct = false) {
        return [
            entry?.lineKey,
            entry?.lineName,
            entry?.line,
            entry?.facilityName,
            entry?.equipmentName,
            ...(includeProduct ? [
                entry?.productName,
                entry?.product,
                entry?.itemName
            ] : [])
        ]
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
    }

    function resolveReportDeckProductionStartLineKey(part = {}, entry = {}) {
        const lineText = normalizeReportDeckProductionStartLineText(entry);
        const lineToken = normalizeReportDeckProductionStartTextToken(lineText);
        const mergedToken = normalizeReportDeckProductionStartTextToken(normalizeReportDeckProductionStartLineText(entry, true));
        if (part.key === 'part1') {
            if (isReportDeckProductionStartBlankLineName(lineText)) return 'msd';
            if (lineToken.includes('msd') || mergedToken.includes('msd')) return 'msd';
            if (lineToken.includes('sd') || mergedToken.includes('sd')) return 'sd';
            return lineToken || mergedToken ? '' : 'msd';
        }
        if (part.key === 'part2') {
            if (lineToken.includes('ica') || mergedToken.includes('ica') || lineToken.includes('\uC774\uCE74') || mergedToken.includes('\uC774\uCE74')) return 'ica';
            if (lineToken.includes('\uC9C0\uB300') || mergedToken.includes('\uC9C0\uB300') || lineToken.includes('jidae') || mergedToken.includes('jidae')) return 'jidae';
            return '';
        }
        return '';
    }

    function buildReportDeckProductionStartPartMonthMap(monthKeys = [], part = {}) {
        const team = getReportDeckMemoTeam(part.sourceTeamKey);
        const rowKeys = (Array.isArray(part.rows) ? part.rows : []).map(row => row.key).filter(Boolean);
        const monthMap = new Map();
        (Array.isArray(monthKeys) ? monthKeys : []).forEach(monthKey => {
            const totals = Object.fromEntries(rowKeys.map(rowKey => [rowKey, 0]));
            const { entries } = getReportDeckMemoProductionEntries(monthKey, team);
            let hasMatchedEntry = false;
            (Array.isArray(entries) ? entries : []).forEach(entry => {
                const rowKey = resolveReportDeckProductionStartLineKey(part, entry);
                if (!rowKey || !Object.prototype.hasOwnProperty.call(totals, rowKey)) return;
                const amount = parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
                if (amount === null) return;
                totals[rowKey] += amount;
                hasMatchedEntry = true;
            });
            const values = {};
            let totalKg = 0;
            rowKeys.forEach(rowKey => {
                const tons = hasMatchedEntry ? totals[rowKey] / 1000 : null;
                values[rowKey] = tons;
                if (tons !== null) totalKg += totals[rowKey];
            });
            values.total = hasMatchedEntry ? totalKg / 1000 : null;
            monthMap.set(monthKey, values);
        });
        return monthMap;
    }

    function readReportDeckProductionStartValue(monthMap, monthKey = '', rowKey = '') {
        const value = monthMap instanceof Map ? monthMap.get(monthKey)?.[rowKey] : null;
        return toFiniteNumber(value);
    }

    function hasReportDeckProductionStartMonthData(monthMap, monthKey = '', rows = []) {
        return (Array.isArray(rows) ? rows : []).some(row => (
            readReportDeckProductionStartValue(monthMap, monthKey, row?.key) !== null
        ));
    }

    function buildReportDeckProductionStartChartMonthKeys(monthKeys = [], monthMap, part = {}) {
        const rows = Array.isArray(part?.rows) ? part.rows : [];
        return (Array.isArray(monthKeys) ? monthKeys : [])
            .filter(monthKey => hasReportDeckProductionStartMonthData(monthMap, monthKey, rows))
            .slice(-25);
    }

    function buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, row = {}) {
        const referenceMonthKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const current = readReportDeckProductionStartValue(monthMap, activeMonthInfo.key, row.key);
        const previous = readReportDeckProductionStartValue(monthMap, previousMonthKey, row.key);
        const reference = readReportDeckProductionStartValue(monthMap, referenceMonthKey, row.key);
        const momIndex = current !== null && previous !== null && previous !== 0 ? (current / previous) * 100 : null;
        const yoyIndex = current !== null && reference !== null && reference !== 0 ? (current / reference) * 100 : null;
        const yoyRate = current !== null && reference !== null && reference !== 0 ? (current - reference) / Math.abs(reference) : null;
        return {
            key: row.key,
            label: row.label,
            current,
            previous,
            reference,
            momIndex,
            yoyIndex,
            yoyRate
        };
    }

    function formatReportDeckProductionStartNumber(value, decimals = 0) {
        const number = toFiniteNumber(value);
        if (number === null) return '';
        return number.toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    function buildReportDeckProductionStartCaption(part = {}, totalRow = {}) {
        const currentText = formatReportDeckProductionStartNumber(totalRow.current);
        const baseText = `${part.order || ''}) ${part.label || ''} \uC0DD\uC0B0\uB7C9 :${currentText ? ` ${currentText}\uD1A4` : ''}`;
        const rate = toFiniteNumber(totalRow.yoyRate);
        if (rate === null || rate === 0) return baseText;
        const directionText = rate > 0 ? '\uC99D\uAC00' : '\uAC10\uC18C';
        return `${baseText} (\uC804\uB144 \uB3D9\uC6D4\uB300\uBE44 \uAE30\uC900 ${formatReportDeckProductionStartNumber(Math.abs(rate) * 100, 1)}% ${directionText})`;
    }

    function buildReportDeckProductionStartChart(part = {}, monthKeys = [], monthMap) {
        return {
            title: `${part.label || ''} \uC0DD\uC0B0\uB7C9 \uD604\uD669`,
            unit: '\uD1A4',
            monthKeys: Array.from(monthKeys),
            series: (Array.isArray(part.rows) ? part.rows : []).map(row => ({
                key: row.key,
                label: row.label,
                color: row.color,
                marker: row.marker || 'circle',
                points: monthKeys.map((monthKey, index) => ({
                    index,
                    monthKey,
                    value: readReportDeckProductionStartValue(monthMap, monthKey, row.key)
                }))
            }))
        };
    }

    async function buildReportDeckProductionStartAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        const config = getReportDeckProductionStartConfig(options.teamKey);
        const fullMonthKeys = buildReportDeckProductionStartMonthRange(activeMonthInfo);
        const parts = config.parts.map(part => {
            const monthMap = buildReportDeckProductionStartPartMonthMap(fullMonthKeys, part);
            const chartMonthKeys = buildReportDeckProductionStartChartMonthKeys(fullMonthKeys, monthMap, part);
            const rows = part.rows.map(row => buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, row));
            const totalRow = buildReportDeckProductionStartRowModel(monthMap, activeMonthInfo, {
                key: 'total',
                label: '\uD569\uACC4'
            });
            return {
                key: part.key,
                label: part.label,
                sourceTeamKey: part.sourceTeamKey,
                caption: buildReportDeckProductionStartCaption(part, totalRow),
                rows: rows.concat(totalRow),
                chart: buildReportDeckProductionStartChart(part, chartMonthKeys, monthMap)
            };
        });
        const monthKeys = Array.from(new Set(parts.flatMap(part => part.chart?.monthKeys || []))).sort();
        return {
            ok: true,
            teamKey: config.key,
            teamLabel: config.label,
            monthKey: activeMonthInfo.key,
            monthKeys,
            referenceMonthKey: toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month),
            previousMonthKey: getReportDeckRelativeMonthKey(activeMonthInfo, -1),
            parts
        };
    }

    function buildReportDeckProductionYieldPartConfig(part = {}) {
        if (part.key === 'part1') {
            return {
                ...part,
                rows: [
                    { key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' },
                    { key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' },
                    { key: 'total', label: '\uD569\uACC4', color: '#70ad47', marker: 'circle' }
                ],
                chartRows: [
                    { key: 'sd', label: 'SD', color: '#4472c4', marker: 'circle' },
                    { key: 'msd', label: 'MSD', color: '#ff0000', marker: 'circle' }
                ]
            };
        }
        return {
            ...part,
            rows: [
                { key: 'total', label: `${part.label || ''} \uC218\uC728(%)`, color: '#70ad47', marker: 'circle' }
            ],
            chartRows: [
                { key: 'total', label: part.label || '\uC218\uC728', color: '#70ad47', marker: 'circle' }
            ]
        };
    }

    function getReportDeckProductionYieldConfig(teamKey = '') {
        const config = getReportDeckProductionStartConfig(teamKey);
        return {
            ...config,
            parts: config.parts.map(buildReportDeckProductionYieldPartConfig)
        };
    }

    function createReportDeckProductionYieldBucket() {
        return {
            weight: 0,
            weighted: 0,
            simple: 0,
            count: 0
        };
    }

    function addReportDeckProductionYieldBucketValue(bucket, yieldRate, amount) {
        const value = toFiniteNumber(yieldRate);
        if (!bucket || value === null) return;
        const weight = toFiniteNumber(amount);
        if (weight !== null && weight > 0) {
            bucket.weighted += value * weight;
            bucket.weight += weight;
        }
        bucket.simple += value;
        bucket.count += 1;
    }

    function readReportDeckProductionYieldBucketValue(bucket) {
        if (!bucket) return null;
        if (bucket.weight > 0) return bucket.weighted / bucket.weight;
        return bucket.count > 0 ? bucket.simple / bucket.count : null;
    }

    function buildReportDeckProductionYieldPartMonthMap(monthKeys = [], part = {}) {
        const team = getReportDeckMemoTeam(part.sourceTeamKey);
        const rowKeys = (Array.isArray(part.rows) ? part.rows : [])
            .map(row => row.key)
            .filter(key => key && key !== 'total');
        const monthMap = new Map();
        (Array.isArray(monthKeys) ? monthKeys : []).forEach(monthKey => {
            const buckets = Object.fromEntries(rowKeys.concat('total').map(rowKey => [rowKey, createReportDeckProductionYieldBucket()]));
            const { entries } = getReportDeckMemoProductionEntries(monthKey, team);
            let hasYieldEntry = false;
            (Array.isArray(entries) ? entries : []).forEach(entry => {
                const amount = parseReportDeckProductionAmount(entry?.amount ?? entry?.production ?? entry?.value);
                const yieldRate = parseReportDeckProductionPercent(entry?.moistureExcludedYield);
                if (yieldRate === null) return;
                hasYieldEntry = true;
                addReportDeckProductionYieldBucketValue(buckets.total, yieldRate, amount);
                if (part.key === 'part1') {
                    const rowKey = resolveReportDeckProductionStartLineKey(part, entry);
                    if (rowKey && Object.prototype.hasOwnProperty.call(buckets, rowKey)) {
                        addReportDeckProductionYieldBucketValue(buckets[rowKey], yieldRate, amount);
                    }
                }
            });
            const values = {};
            Object.keys(buckets).forEach(rowKey => {
                values[rowKey] = hasYieldEntry ? readReportDeckProductionYieldBucketValue(buckets[rowKey]) : null;
            });
            monthMap.set(monthKey, values);
        });
        return monthMap;
    }

    function readReportDeckProductionYieldValue(monthMap, monthKey = '', rowKey = '') {
        const value = monthMap instanceof Map ? monthMap.get(monthKey)?.[rowKey] : null;
        return toFiniteNumber(value);
    }

    function hasReportDeckProductionYieldMonthData(monthMap, monthKey = '', rows = []) {
        return (Array.isArray(rows) ? rows : []).some(row => (
            readReportDeckProductionYieldValue(monthMap, monthKey, row?.key) !== null
        ));
    }

    function buildReportDeckProductionYieldChartMonthKeys(monthKeys = [], monthMap, part = {}) {
        const rows = Array.isArray(part?.chartRows) ? part.chartRows : [];
        return (Array.isArray(monthKeys) ? monthKeys : [])
            .filter(monthKey => hasReportDeckProductionYieldMonthData(monthMap, monthKey, rows))
            .slice(-25);
    }

    function buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, row = {}) {
        const referenceMonthKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const current = readReportDeckProductionYieldValue(monthMap, activeMonthInfo.key, row.key);
        const previous = readReportDeckProductionYieldValue(monthMap, previousMonthKey, row.key);
        const reference = readReportDeckProductionYieldValue(monthMap, referenceMonthKey, row.key);
        const momIndex = current !== null && previous !== null && previous !== 0 ? (current / previous) * 100 : null;
        const yoyIndex = current !== null && reference !== null && reference !== 0 ? (current / reference) * 100 : null;
        const yoyDelta = current !== null && reference !== null ? current - reference : null;
        return {
            key: row.key,
            label: row.label,
            current,
            previous,
            reference,
            momIndex,
            yoyIndex,
            yoyDelta
        };
    }

    function buildReportDeckProductionYieldCaption(part = {}, totalRow = {}) {
        const currentText = formatReportDeckProductionStartNumber(totalRow.current, 1);
        const baseText = `${part.order || ''}) ${part.label || ''} \uC218\uC728 :${currentText ? ` ${currentText}%` : ''}`;
        const delta = toFiniteNumber(totalRow.yoyDelta);
        if (delta === null || delta === 0) return baseText;
        const directionText = delta > 0 ? '\uC99D\uAC00' : '\uAC10\uC18C';
        return `${baseText} (\uC804\uB144 \uB3D9\uC6D4\uB300\uBE44 \uAE30\uC900 ${formatReportDeckProductionStartNumber(Math.abs(delta), 1)}% ${directionText})`;
    }

    function buildReportDeckProductionYieldChart(part = {}, monthKeys = [], monthMap) {
        const chartRows = Array.isArray(part.chartRows) ? part.chartRows : [];
        return {
            title: `${part.label || ''} \uC218\uC728 \uD604\uD669`,
            unit: '%',
            monthKeys: Array.from(monthKeys),
            series: chartRows.map(row => ({
                key: row.key,
                label: row.label,
                color: row.color,
                marker: row.marker || 'circle',
                points: monthKeys.map((monthKey, index) => ({
                    index,
                    monthKey,
                    value: readReportDeckProductionYieldValue(monthMap, monthKey, row.key)
                }))
            }))
        };
    }

    async function buildReportDeckProductionYieldAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        const config = getReportDeckProductionYieldConfig(options.teamKey);
        const fullMonthKeys = buildReportDeckProductionStartMonthRange(activeMonthInfo);
        const parts = config.parts.map(part => {
            const monthMap = buildReportDeckProductionYieldPartMonthMap(fullMonthKeys, part);
            const chartMonthKeys = buildReportDeckProductionYieldChartMonthKeys(fullMonthKeys, monthMap, part);
            const rows = part.rows.map(row => buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, row));
            const totalRow = rows.find(row => row.key === 'total') || buildReportDeckProductionYieldRowModel(monthMap, activeMonthInfo, {
                key: 'total',
                label: '\uD569\uACC4'
            });
            return {
                key: part.key,
                label: part.label,
                sourceTeamKey: part.sourceTeamKey,
                caption: buildReportDeckProductionYieldCaption(part, totalRow),
                rows,
                chart: buildReportDeckProductionYieldChart(part, chartMonthKeys, monthMap)
            };
        });
        const monthKeys = Array.from(new Set(parts.flatMap(part => part.chart?.monthKeys || []))).sort();
        return {
            ok: true,
            teamKey: config.key,
            teamLabel: config.label,
            monthKey: activeMonthInfo.key,
            monthKeys,
            referenceMonthKey: toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month),
            previousMonthKey: getReportDeckRelativeMonthKey(activeMonthInfo, -1),
            parts
        };
    }

    function formatReportDeckShortMonthLabel(monthKey) {
        const parsed = parseReportDeckMonthKey(monthKey);
        if (!parsed) return '';
        return `${String(parsed.year).slice(2)}.${String(parsed.month).padStart(2, '0')}`;
    }

    async function ensureReportDeckUtilityDataReady() {
        try {
            await root.KpiMeteringBridge?.ensureIntegratedMeteringRuntime?.();
        } catch (error) {
            // The report can still render placeholders if the integrated runtime is unavailable.
        }

        const tasks = [];
        const electricSync = root.KPIUtilReportSheetElectricRuntimeSync?.ensureUtilElectricReportDataSync
            || root.syncUtilElectricDataFromMetering;
        const gasSync = root.KPIUtilReportSheetGasRuntimeSync?.ensureUtilGasReportDataSync
            || root.syncUtilGasDataFromMetering;
        const wasteSync = root.KPIUtilReportSheetWasteRuntimeSync?.ensureUtilWasteReportDataSync
            || root.syncUtilWasteDataFromMetering;
        if (typeof electricSync === 'function') {
            tasks.push(Promise.resolve().then(() => electricSync.call(root, { force: true })));
        }
        if (typeof gasSync === 'function') {
            tasks.push(Promise.resolve().then(() => gasSync.call(root, { force: true })));
        }
        if (typeof wasteSync === 'function') {
            tasks.push(Promise.resolve().then(() => wasteSync.call(root, { force: true })));
        }
        if (tasks.length) {
            await Promise.all(tasks.map(task => task.catch(() => null)));
        }
    }

    function buildReportDeckElectricRows(electricApi, option, timeline, monthKey) {
        if (typeof electricApi?.buildUtilElectricAnalysisScopedRows === 'function') {
            const rows = electricApi.buildUtilElectricAnalysisScopedRows({
                from: timeline.from,
                to: timeline.to
            }, option);
            if (Array.isArray(rows) && rows.length) return rows;
        }
        if (typeof electricApi?.buildUtilElectricAnalysisScopedDatasetResult === 'function') {
            const result = electricApi.buildUtilElectricAnalysisScopedDatasetResult(monthKey, 'team_01_01');
            return Array.isArray(result?.allRows) ? result.allRows : [];
        }
        return [];
    }

    async function buildReportDeckUtilityAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (isPlainObject(options.store)) {
            applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        const electricApi = root.KPIUtilReportSheetAnalysisElectricModel || null;
        if (!optionApi || !gasApi || !electricApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const scopeConfig = getReportDeckUtilityScopeConfig(options.scopeKey);
        const timeline = buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const gasOption = optionApi.getUtilGasAnalysisCategoryOption?.(scopeConfig.gasCategoryKey) || { key: scopeConfig.gasCategoryKey };
        const electricOption = resolveReportDeckElectricOption(optionApi, scopeConfig);
        const gasMetricMap = typeof gasApi.buildUtilGasAnalysisMetricMap === 'function'
            ? gasApi.buildUtilGasAnalysisMetricMap(timeline.monthKeys, gasOption)
            : new Map();
        const electricRows = buildReportDeckElectricRows(electricApi, electricOption, timeline, activeMonthInfo.key);
        const electricRowMap = new Map((Array.isArray(electricRows) ? electricRows : [])
            .map(row => [String(row?.monthKey || '').trim(), row])
            .filter(([key]) => key));
        const readGasCost = monthKey => {
            const usageCharge = readReportDeckGasUsageCharge(monthKey, scopeConfig);
            return usageCharge !== null ? usageCharge : readReportDeckGasLngCost(gasMetricMap, monthKey);
        };
        const readGasUnitProduction = monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            return toFiniteNumber(metric?.ratioProduction?.lng ?? metric.production);
        };

        const gasRows = {
            production: buildReportDeckMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'production'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'production'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'production')
            ),
            usage: buildReportDeckMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lngUsage'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lngUsage'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'lngUsage')
            ),
            unit: buildReportDeckRatioMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lngUsage'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lngUsage'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'lngUsage'),
                readGasUnitProduction(referenceMonthKey),
                readGasUnitProduction(activeMonthInfo.key),
                readGasUnitProduction(previousMonthKey)
            ),
            cost: buildReportDeckMetricComparison(
                readGasCost(referenceMonthKey),
                readGasCost(activeMonthInfo.key),
                readGasCost(previousMonthKey)
            )
        };
        const electricRowsModel = {
            production: buildReportDeckMetricComparison(
                readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'production'),
                readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'production'),
                readReportDeckElectricRow(electricRowMap, previousMonthKey, 'production')
            ),
            usage: buildReportDeckMetricComparison(
                readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricUsage'),
                readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricUsage'),
                readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricUsage')
            ),
            unit: buildReportDeckRatioMetricComparison(
                readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricUsage'),
                readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricUsage'),
                readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricUsage'),
                readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'production'),
                readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'production'),
                readReportDeckElectricRow(electricRowMap, previousMonthKey, 'production')
            ),
            cost: buildReportDeckMetricComparison(
                readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricCost'),
                readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricCost'),
                readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricCost')
            )
        };

        const gasSeries = buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            const usage = toFiniteNumber(metric.lngUsage);
            const production = toFiniteNumber(metric?.ratioProduction?.lng ?? metric.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });
        const electricSeries = buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const row = electricRowMap.get(monthKey) || {};
            const usage = toFiniteNumber(row.electricUsage);
            const production = toFiniteNumber(row.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });

        return {
            ok: true,
            scopeKey: scopeConfig.key,
            scopeLabel: scopeConfig.label,
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            gas: {
                rows: gasRows,
                chart: {
                    title: scopeConfig.gasChartTitle,
                    series: gasSeries
                }
            },
            electric: {
                rows: electricRowsModel,
                chart: {
                    title: scopeConfig.electricChartTitle,
                    series: electricSeries
                }
            }
        };
    }

    async function buildReportDeckBukjeongAnalysis(monthValue, options = {}) {
        return buildReportDeckUtilityAnalysis(monthValue, {
            ...options,
            scopeKey: 'bukjeong'
        });
    }

    async function buildReportDeckYusanLpgAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (isPlainObject(options.store)) {
            applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        if (!optionApi || !gasApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const timeline = buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const gasOption = optionApi.getUtilGasAnalysisCategoryOption?.('team_01_02') || { key: 'team_01_02' };
        const gasMetricMap = typeof gasApi.buildUtilGasAnalysisMetricMap === 'function'
            ? gasApi.buildUtilGasAnalysisMetricMap(timeline.monthKeys, gasOption)
            : new Map();
        const readLpgUnitProduction = monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            return toFiniteNumber(metric?.ratioProduction?.lpg ?? metric.production);
        };
        const readLpgConversionCost = monthKey => readReportDeckGasLpgConversionCost(gasMetricMap, monthKey);

        const rows = {
            production: buildReportDeckMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'production'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'production'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'production')
            ),
            usage: buildReportDeckMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lpgUsage'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lpgUsage'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'lpgUsage')
            ),
            unit: buildReportDeckRatioMetricComparison(
                readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lpgUsage'),
                readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lpgUsage'),
                readReportDeckMetric(gasMetricMap, previousMonthKey, 'lpgUsage'),
                readLpgUnitProduction(referenceMonthKey),
                readLpgUnitProduction(activeMonthInfo.key),
                readLpgUnitProduction(previousMonthKey)
            ),
            amount: buildReportDeckMetricComparison(
                readReportDeckGasLpgCost(gasMetricMap, referenceMonthKey),
                readReportDeckGasLpgCost(gasMetricMap, activeMonthInfo.key),
                readReportDeckGasLpgCost(gasMetricMap, previousMonthKey)
            )
        };
        const referenceLpgConversionCost = normalizeReportDeckPositiveMetric(readLpgConversionCost(referenceMonthKey));
        const currentLpgConversionCost = normalizeReportDeckPositiveMetric(readLpgConversionCost(activeMonthInfo.key));
        const previousLpgConversionCost = normalizeReportDeckPositiveMetric(readLpgConversionCost(previousMonthKey));
        const referenceActualLpgCost = readReportDeckGasLpgCost(gasMetricMap, referenceMonthKey);
        const currentActualLpgCost = readReportDeckGasLpgCost(gasMetricMap, activeMonthInfo.key);
        const previousActualLpgCost = readReportDeckGasLpgCost(gasMetricMap, previousMonthKey);
        const costRows = {
            0: buildReportDeckMetricComparison(
                referenceActualLpgCost,
                currentActualLpgCost,
                previousActualLpgCost
            ),
            1: buildReportDeckMetricComparison(
                referenceLpgConversionCost,
                currentLpgConversionCost,
                previousLpgConversionCost
            ),
            2: buildReportDeckMetricComparison(
                divideReportDeckMetricValues(referenceActualLpgCost, referenceLpgConversionCost),
                divideReportDeckMetricValues(currentActualLpgCost, currentLpgConversionCost),
                divideReportDeckMetricValues(previousActualLpgCost, previousLpgConversionCost)
            )
        };
        const unitSeries = buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            const usage = toFiniteNumber(metric.lpgUsage);
            const production = toFiniteNumber(metric?.ratioProduction?.lpg ?? metric.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });
        const costSeries = buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const actualLpgCost = readReportDeckGasLpgCost(gasMetricMap, monthKey);
            const lpgConversionCost = readLpgConversionCost(monthKey);
            return actualLpgCost !== null && lpgConversionCost !== null && lpgConversionCost > 0
                ? actualLpgCost / lpgConversionCost
                : null;
        });

        return {
            ok: true,
            scopeKey: 'yusan_lpg_team_01_02',
            scopeLabel: '1\ud300 2\ud30c\ud2b8 LPG',
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            rows,
            costRows,
            chart: {
                title: '1\ud300 2\ud30c\ud2b8 LPG (kg) / \uc0dd\uc0b0\ub7c9(kg)',
                series: unitSeries
            },
            costChart: {
                title: 'LPG 실제 금액 / LNG 환산 금액',
                series: costSeries
            }
        };
    }

    async function buildReportDeckWasteAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (isPlainObject(options.store)) {
            applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const wasteApi = root.KPIUtilReportSheetAnalysisWasteModel || null;
        if (!optionApi || !wasteApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const scopeConfig = getReportDeckWasteScopeConfig(options.scopeKey);
        const siteOption = optionApi.getUtilWasteAnalysisSiteOption?.(scopeConfig.siteKey) || {
            key: scopeConfig.siteKey,
            label: scopeConfig.label
        };
        const timeline = buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const wasteRows = buildReportDeckWasteRows(wasteApi, scopeConfig, activeMonthInfo.key);
        const wasteRowMap = new Map((Array.isArray(wasteRows) ? wasteRows : [])
            .map(row => [String(row?.monthKey || '').trim(), row])
            .filter(([key]) => key));

        const buildDetailPair = (detailKey) => buildReportDeckMetricComparison(
            readReportDeckWasteCostDetail(wasteRowMap, referenceMonthKey, detailKey),
            readReportDeckWasteCostDetail(wasteRowMap, activeMonthInfo.key, detailKey),
            readReportDeckWasteCostDetail(wasteRowMap, previousMonthKey, detailKey)
        );
        const rows = {
            production: buildReportDeckMetricComparison(
                readReportDeckWasteRow(wasteRowMap, referenceMonthKey, 'production'),
                readReportDeckWasteRow(wasteRowMap, activeMonthInfo.key, 'production'),
                readReportDeckWasteRow(wasteRowMap, previousMonthKey, 'production')
            ),
            usage: buildReportDeckMetricComparison(
                readReportDeckWasteRow(wasteRowMap, referenceMonthKey, 'wasteUsage'),
                readReportDeckWasteRow(wasteRowMap, activeMonthInfo.key, 'wasteUsage'),
                readReportDeckWasteRow(wasteRowMap, previousMonthKey, 'wasteUsage')
            ),
            unit: buildReportDeckMetricComparison(
                calculateReportDeckWasteIntensity(wasteRowMap.get(referenceMonthKey) || {}),
                calculateReportDeckWasteIntensity(wasteRowMap.get(activeMonthInfo.key) || {}),
                calculateReportDeckWasteIntensity(wasteRowMap.get(previousMonthKey) || {})
            ),
            water: buildDetailPair('water'),
            share: buildDetailPair('share'),
            sludge: buildDetailPair('sludge'),
            resin: buildDetailPair('resin'),
            labor: buildDetailPair('labor'),
            total: buildDetailPair('')
        };
        const chartSeries = buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const row = wasteRowMap.get(monthKey) || {};
            return calculateReportDeckWasteIntensity(row);
        });

        return {
            ok: true,
            scopeKey: scopeConfig.key,
            scopeLabel: siteOption.label || scopeConfig.label,
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            rows,
            chart: {
                title: scopeConfig.chartTitle,
                series: chartSeries
            }
        };
    }

    function performMeteringManualSave(options) {
        return root.KpiMeteringApp?.manualSave?.(options);
    }

    async function fetchReportDeckCover(options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_fetch_unavailable');
        }
        const response = await root.fetch(buildReportDeckRecordEndpoint(options), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (response.status === 404) {
            return { ok: true, record: null };
        }
        if (!response.ok) {
            throw new Error(`report_deck_fetch_failed:${response.status}`);
        }
        return response.json();
    }

    async function saveReportDeckCover(payload, options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_fetch_unavailable');
        }
        const response = await root.fetch(buildReportDeckRecordEndpoint(options), {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                payload: payload || {}
            })
        });
        if (!response.ok) {
            throw new Error(`report_deck_save_failed:${response.status}`);
        }
        return response.json();
    }

    async function uploadReportDeckImageDataUrl(dataUrl, options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_image_upload_unavailable');
        }
        const config = getReportRuntimeConfig();
        if (config.enabled === false || config.writeEnabled === false) {
            throw new Error('report_deck_image_upload_readonly');
        }
        const prepared = await prepareReportDeckImageDataUrlForUpload(dataUrl, options);
        const parsed = parseDataUrlPayload(prepared.dataUrl);
        const mimeType = String(prepared.mimeType || parsed.mimeType || 'application/octet-stream').trim();
        const recordKey = normalizeReportRecordKey(options.recordKey, config.recordKey);
        const fieldKey = String(options.fieldKey || 'image').trim() || 'image';
        const originalName = String(prepared.originalName || options.originalName || `${fieldKey}.png`).trim() || `${fieldKey}.png`;
        const response = await root.fetch(buildReportDeckFileUploadEndpoint(), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                permissionKey: config.permissionKey,
                ownerDomain: 'report.runtime',
                ownerKey: recordKey,
                fileCategory: 'image',
                originalName,
                mimeType,
                base64Data: parsed.base64Data,
                metadata: {
                    moduleKey: config.moduleKey,
                    recordKey,
                    fieldKey
                }
            })
        });
        if (!response.ok) {
            throw new Error(`report_deck_image_upload_failed:${response.status}`);
        }
        const payload = await response.json();
        const documentId = String(payload?.document?.id || '').trim();
        if (!documentId) {
            throw new Error('report_deck_image_upload_missing_id');
        }
        return `${config.apiBase.replace(/\/+$/, '')}/files/${encodeURIComponent(documentId)}/view`;
    }

    async function uploadReportDeckImage(file, options = {}) {
        const dataUrl = await readBrowserFileAsDataUrl(file);
        return uploadReportDeckImageDataUrl(dataUrl, {
            ...options,
            originalName: options.originalName || file?.name || '',
            mimeType: options.mimeType || file?.type || ''
        });
    }

    async function fetchMeteringSharedStore() {
        if (typeof root.fetch !== 'function') {
            throw new Error('metering_shared_store_fetch_unavailable');
        }
        const response = await root.fetch(buildMeteringSharedStoreEndpoint(), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error(`metering_shared_store_fetch_failed:${response.status}`);
        }
        const payload = await response.json();
        if (isPlainObject(payload?.store)) {
            applyMeteringSharedStoreSnapshot(payload.store);
        }
        return payload;
    }

    root.KpiUtilRuntimeBrowserAdapter = Object.freeze({
        getRuntime,
        initIntegratedMetering,
        canManualSaveMetering,
        getMeteringRuntimeConfig,
        getReportRuntimeConfig,
        fetchMeteringSharedStore,
        fetchReportDeckCover,
        saveReportDeckCover,
        uploadReportDeckImage,
        uploadReportDeckImageDataUrl,
        exportReportDeckSingleHtml,
        printReportDeckPdf,
        buildReportDeckUtilityAnalysis,
        buildReportDeckBukjeongAnalysis,
        buildReportDeckYusanLpgAnalysis,
        buildReportDeckProductionStartAnalysis,
        buildReportDeckProductionYieldAnalysis,
        buildReportDeckMemoCandidates,
        buildReportDeckMemoOverview,
        buildReportDeckWasteAnalysis,
        performMeteringManualSave
    });

    if (globalScope && globalScope !== root) {
        globalScope.KpiUtilRuntimeBrowserAdapter = root.KpiUtilRuntimeBrowserAdapter;
    }
})(globalThis);
