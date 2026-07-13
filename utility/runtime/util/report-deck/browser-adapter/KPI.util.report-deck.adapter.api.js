(function registerKpiReportDeckAdapterApi(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    const REPORT_DECK_PRINT_PAGE_WIDTH = '297mm';
    const REPORT_DECK_PRINT_PAGE_HEIGHT = '210mm';
    const REPORT_DECK_PRINT_PAGE_MARGIN = '10mm';
    const REPORT_DECK_PRINT_SLIDE_CSS_WIDTH = '277mm';
    const REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT = '155.8125mm';
    const REPORT_DECK_CAPTURE_SLIDE_WIDTH = 1920;
    const REPORT_DECK_CAPTURE_SLIDE_HEIGHT = 1080;
    const REPORT_DECK_MEMO_TEAMS = Object.freeze([
        Object.freeze({ key: 'team_01_01', label: '1팀 1파트' }),
        Object.freeze({ key: 'team_01_02', label: '1팀 2파트' }),
        Object.freeze({ key: 'team_02', label: '2팀' }),
        Object.freeze({ key: 'team_03', label: '3팀' }),
        Object.freeze({ key: 'site_yusan', label: '유산' }),
        Object.freeze({ key: 'site_total', label: '전체' }),
        Object.freeze({ key: 'other', label: '기타' })
    ]);
    const REPORT_DECK_MEMO_METRICS = Object.freeze({
        production: Object.freeze({ key: 'production', label: '생산량', unit: 'kg' }),
        yusan_production_share: Object.freeze({ key: 'yusan_production_share', label: '유산 생산량 비율', unit: '%p', deltaMode: 'percentagePoint' }),
        electric: Object.freeze({ key: 'electric', label: '전력량', unit: 'kWh' }),
        electric_cost: Object.freeze({ key: 'electric_cost', label: '전기 비용', unit: '원', decimals: 0 }),
        electric_unit: Object.freeze({ key: 'electric_unit', label: '생산량 대비 전력량', unit: 'kWh/kg', decimals: 3 }),
        lng: Object.freeze({ key: 'lng', label: 'LNG 사용량', unit: 'm³' }),
        lng_cost: Object.freeze({ key: 'lng_cost', label: 'LNG 비용', unit: '원', decimals: 0 }),
        lng_unit: Object.freeze({ key: 'lng_unit', label: '생산량 대비 LNG', unit: 'm³/kg', decimals: 3 }),
        lpg: Object.freeze({ key: 'lpg', label: 'LPG 사용량', unit: 'kg' }),
        lpg_cost: Object.freeze({ key: 'lpg_cost', label: 'LPG 비용', unit: '원', decimals: 0 }),
        gas_cost: Object.freeze({ key: 'gas_cost', label: '가스 비용', unit: '원', decimals: 0 }),
        lpg_unit: Object.freeze({ key: 'lpg_unit', label: '생산량 대비 LPG', unit: 'kg/kg', decimals: 3 }),
        yield_rate: Object.freeze({ key: 'yield_rate', label: '수율', unit: '%p', deltaMode: 'percentagePoint' }),
        operation_rate: Object.freeze({ key: 'operation_rate', label: '가동률', unit: '%p', deltaMode: 'percentagePoint' }),
        work_time: Object.freeze({ key: 'work_time', label: '조업시간', unit: '시간', decimals: 1 }),
        operation_time: Object.freeze({ key: 'operation_time', label: '가동시간', unit: '시간', decimals: 1 }),
        rework_production: Object.freeze({ key: 'rework_production', label: '재가공품 생산량', unit: 'kg' }),
        rework_production_share: Object.freeze({ key: 'rework_production_share', label: '재가공품 비율', unit: '%p', deltaMode: 'percentagePoint' }),
        production_days: Object.freeze({ key: 'production_days', label: '생산일수', unit: '일' }),
        off_days: Object.freeze({ key: 'off_days', label: '휴무일수', unit: '일' }),
        product_count: Object.freeze({ key: 'product_count', label: '고유 품목수', unit: '개' }),
        cip_count: Object.freeze({ key: 'cip_count', label: 'CIP 횟수', unit: '회', decimals: 0, omitRate: true, otherTeamMonthlyFieldKey: 'cip_count' }),
        cip_time: Object.freeze({ key: 'cip_time', label: 'CIP 시간', unit: '시간', decimals: 1, omitRate: true, otherTeamMonthlyFieldKey: 'cip_time' }),
        waste_usage: Object.freeze({ key: 'waste_usage', label: '폐수량', unit: 'm³', wasteValueKey: 'wasteUsage' }),
        waste_cost_total: Object.freeze({ key: 'waste_cost_total', label: '폐수 비용 총계', unit: '원', wasteDetailKey: '' }),
        waste_cost_water: Object.freeze({ key: 'waste_cost_water', label: '상수 비용', unit: '원', wasteDetailKey: 'water' }),
        waste_cost_share: Object.freeze({ key: 'waste_cost_share', label: '폐수 비용', unit: '원', wasteDetailKey: 'share' }),
        waste_cost_sludge: Object.freeze({ key: 'waste_cost_sludge', label: '폐수오니 비용', unit: '원', wasteDetailKey: 'sludge' }),
        waste_cost_resin: Object.freeze({ key: 'waste_cost_resin', label: '폐합성수지 비용', unit: '원', wasteDetailKey: 'resin' }),
        waste_cost_labor: Object.freeze({ key: 'waste_cost_labor', label: '인건비', unit: '원', wasteDetailKey: 'labor' }),
        monthly_average_temperature: Object.freeze({ key: 'monthly_average_temperature', label: '월간 평균온도', unit: '℃', decimals: 1, omitRate: true, otherMonthlyFieldKey: 'average_temperature' })
    });
    const REPORT_DECK_MEMO_LINE_METRIC_PREFIX = 'production_line::';
    const REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY = 'yusan_production_share';
    const REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS = Object.freeze(['team_01_02', 'team_02', 'team_03']);
    const REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP = Object.freeze({ key: 'site_yusan', label: '유산' });
    const REPORT_DECK_MEMO_TOTAL_OVERVIEW_GROUP = Object.freeze({ key: 'site_total', label: '전체' });
    const REPORT_DECK_MEMO_TOTAL_TEAM_KEYS = Object.freeze(['team_01_01', 'team_01_02', 'team_02', 'team_03']);
    const REPORT_DECK_MEMO_AGGREGATE_TEAM_KEYS = Object.freeze([
        REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP.key,
        REPORT_DECK_MEMO_TOTAL_OVERVIEW_GROUP.key
    ]);
    const REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY = 'yusan';
    const REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS = Object.freeze([
        'production',
        'electric',
        'electric_cost',
        'electric_unit',
        'lng',
        'lng_cost',
        'lng_unit',
        'lpg',
        'lpg_cost',
        'gas_cost',
        'lpg_unit',
        'cip_count',
        'cip_time'
    ]);
    const REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS = Object.freeze([
        'yield_rate',
        'operation_rate',
        'work_time',
        'operation_time',
        'rework_production',
        'rework_production_share',
        'production_days',
        'off_days',
        'product_count'
    ]);
    const REPORT_DECK_MEMO_CIP_METRIC_KEYS = Object.freeze(['cip_count', 'cip_time']);
    const REPORT_DECK_MEMO_WASTE_METRIC_KEYS = Object.freeze([
        'waste_usage',
        'waste_cost_total',
        'waste_cost_water',
        'waste_cost_share',
        'waste_cost_sludge',
        'waste_cost_resin',
        'waste_cost_labor'
    ]);
    const REPORT_DECK_MEMO_OTHER_METRIC_KEYS = Object.freeze([
        'monthly_average_temperature'
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
        team_01_01: Object.freeze(['production', 'electric', 'electric_cost', 'electric_unit', 'lng', 'lng_cost', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS, 'cip_count', 'cip_time']),
        team_01_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_cost', 'electric_unit', 'lng', 'lng_cost', 'lng_unit', 'lpg', 'lpg_cost', 'gas_cost', 'lpg_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS, 'cip_count', 'cip_time']),
        team_02: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_cost', 'electric_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS, 'cip_count', 'cip_time']),
        team_03: Object.freeze(['production', REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY, 'electric', 'electric_cost', 'electric_unit', 'lng', 'lng_cost', 'lng_unit', ...REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS, 'cip_count', 'cip_time']),
        site_yusan: Object.freeze(REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS),
        site_total: Object.freeze(REPORT_DECK_MEMO_CIP_METRIC_KEYS),
        other: Object.freeze(REPORT_DECK_MEMO_OTHER_METRIC_KEYS)
    });

    function getRuntime() {
        return root.KpiRuntime || null;
    }

    function getUtilityEntryRuntimeConfig() {
        return root.__KPI_SERVER_RUNTIME_CONFIG__?.metering || null;
    }

    function saveUtilityEntryExperiment(host, period) {
        return root.KpiUtilityEntryExperiment?.save?.(host, period);
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

    function buildReportDeckCaptureZipEndpoint() {
        const config = getReportRuntimeConfig();
        return `${config.apiBase.replace(/\/+$/, '')}/report-deck/capture-zip`;
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

    function serializeReportDeckScriptJson(value) {
        return JSON.stringify(value ?? null)
            .replace(/</g, '\\u003c')
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');
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

    function applyReportDeckPreparedOutputState(clone, sourceSlide = null, editorRoot = null) {
        clone?.setAttribute?.('data-report-output-prepared', 'true');
        const pageText = String(sourceSlide?.dataset?.reportPrintPageText || '').trim();
        if (pageText) {
            const pageNumber = clone?.querySelector?.('[data-report-page-number]');
            if (pageNumber) pageNumber.textContent = pageText;
        }
        const optionalVisibility = {
            slide8: String(editorRoot?.dataset?.reportPrintSlide8Visible || '') === 'true',
            slide9: String(editorRoot?.dataset?.reportPrintSlide9Visible || '') === 'true',
            slide10: String(editorRoot?.dataset?.reportPrintSlide10Visible || '') === 'true'
        };
        Array.from(clone?.querySelectorAll?.('[data-report-optional-content]') || []).forEach(element => {
            const optionalKey = String(element?.dataset?.reportOptionalContent || '').trim();
            if (Object.prototype.hasOwnProperty.call(optionalVisibility, optionalKey)) {
                element.hidden = !optionalVisibility[optionalKey];
            }
        });
    }

    Object.assign(parts, {
        REPORT_DECK_PRINT_PAGE_WIDTH,
        REPORT_DECK_PRINT_PAGE_HEIGHT,
        REPORT_DECK_PRINT_PAGE_MARGIN,
        REPORT_DECK_PRINT_SLIDE_CSS_WIDTH,
        REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT,
        REPORT_DECK_CAPTURE_SLIDE_WIDTH,
        REPORT_DECK_CAPTURE_SLIDE_HEIGHT,
        REPORT_DECK_MEMO_TEAMS,
        REPORT_DECK_MEMO_METRICS,
        REPORT_DECK_MEMO_LINE_METRIC_PREFIX,
        REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_KEY,
        REPORT_DECK_MEMO_YUSAN_PRODUCTION_SHARE_TEAM_KEYS,
        REPORT_DECK_MEMO_YUSAN_OVERVIEW_GROUP,
        REPORT_DECK_MEMO_TOTAL_OVERVIEW_GROUP,
        REPORT_DECK_MEMO_TOTAL_TEAM_KEYS,
        REPORT_DECK_MEMO_AGGREGATE_TEAM_KEYS,
        REPORT_DECK_MEMO_YUSAN_GAS_CATEGORY_KEY,
        REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS,
        REPORT_DECK_MEMO_PRODUCTION_STAT_KEYS,
        REPORT_DECK_MEMO_CIP_METRIC_KEYS,
        REPORT_DECK_MEMO_WASTE_METRIC_KEYS,
        REPORT_DECK_MEMO_OTHER_METRIC_KEYS,
        REPORT_DECK_MEMO_WASTE_MEMO_KEYS,
        REPORT_DECK_MEMO_UNIT_METRIC_BASE,
        REPORT_DECK_MEMO_WASTE_OVERVIEW_SCOPES,
        REPORT_DECK_MEMO_PRODUCTION_LINES,
        REPORT_DECK_MEMO_TEAM_METRIC_KEYS,
        getRuntime,
        getUtilityEntryRuntimeConfig,
        saveUtilityEntryExperiment,
        normalizeApiBase,
        getReportRuntimeConfig,
        normalizeReportRecordKey,
        buildReportDeckRecordEndpoint,
        buildReportDeckFileUploadEndpoint,
        buildReportDeckCaptureZipEndpoint,
        buildMeteringSharedStoreEndpoint,
        isPlainObject,
        readBrowserFileAsDataUrl,
        parseDataUrlPayload,
        getReportDeckBase64ByteLength,
        replaceReportDeckImageExtension,
        loadReportDeckImageElement,
        prepareReportDeckImageDataUrlForUpload,
        cloneJson,
        escapeHtmlText,
        escapeHtmlAttribute,
        serializeReportDeckScriptJson,
        getReportDeckExportStyleText,
        getNodeOuterHtml,
        readBlobAsDataUrl,
        fetchReportDeckImageAsDataUrl,
        applyReportDeckPreparedOutputState
    });
})(globalThis);
