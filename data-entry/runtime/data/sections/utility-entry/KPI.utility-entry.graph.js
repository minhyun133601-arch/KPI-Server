(function registerKpiUtilityEntryGraph(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH, UTILITY_ENTRY_EXPERIMENT_GRAPH_DEFINITIONS, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT, UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF } = parts.constants;

    const utilityEntryExperimentRoot = typeof window !== 'undefined' ? window : null;
    let utilityEntryExperimentGraphCaptureStylePromise = null;

    function ensureUtilityEntryExperimentGraphModal() {
        if (!utilityEntryExperimentRoot?.document) return null;
        let modal = utilityEntryExperimentRoot.document.getElementById('utility-entry-experiment-graph-modal');
        if (modal) return modal;

        modal = utilityEntryExperimentRoot.document.createElement('section');
        modal.id = 'utility-entry-experiment-graph-modal';
        modal.className = 'utility-entry-experiment-graph-modal';
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = `
            <div class="utility-entry-experiment-graph-modal-backdrop" data-role="utility-entry-experiment-graph-close"></div>
            <div class="utility-entry-experiment-graph-modal-card" role="dialog" aria-modal="true" aria-label="정산 그래프">
                <header class="utility-entry-experiment-graph-modal-head">
                    <strong data-role="utility-entry-experiment-graph-title">정산 그래프</strong>
                    <button type="button" class="utility-entry-experiment-graph-modal-pdf" data-role="utility-entry-experiment-graph-capture-pdf" aria-label="PDF 인쇄" title="PDF 인쇄">
                        <i class="fa-solid fa-file-pdf" data-role="utility-entry-experiment-graph-capture-pdf-icon" aria-hidden="true"></i>
                        <span data-role="utility-entry-experiment-graph-capture-pdf-label">PDF 인쇄</span>
                    </button>
                    <button type="button" class="utility-entry-experiment-graph-modal-fullscreen" data-role="utility-entry-experiment-graph-fullscreen" aria-label="전체화면" title="전체화면">
                        <i class="fa-solid fa-expand" data-role="utility-entry-experiment-graph-fullscreen-icon" aria-hidden="true"></i>
                        <span data-role="utility-entry-experiment-graph-fullscreen-label">전체화면</span>
                    </button>
                    <button type="button" class="utility-entry-experiment-graph-modal-memo-overview" data-role="utility-entry-experiment-graph-memo-overview" aria-label="특이사항 전체 확인" title="특이사항">
                        <i class="fa-solid fa-list" aria-hidden="true"></i>
                        <span>특이사항</span>
                    </button>
                    <button type="button" data-role="utility-entry-experiment-graph-close" aria-label="닫기" title="닫기">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </header>
                <div class="utility-entry-experiment-graph-modal-body" data-role="utility-entry-experiment-graph-template"></div>
            </div>
        `;
        modal.addEventListener('click', event => {
            const pdfButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-capture-pdf"]');
            if (pdfButton) {
                event.preventDefault();
                void captureUtilityEntryExperimentGraphPdf(modal);
                return;
            }
            const fullscreenButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-fullscreen"]');
            if (fullscreenButton) {
                event.preventDefault();
                void toggleUtilityEntryExperimentGraphFullscreen(modal);
                return;
            }
            const memoOverviewButton = event.target?.closest?.('[data-role="utility-entry-experiment-graph-memo-overview"]');
            if (memoOverviewButton) {
                event.preventDefault();
                toggleUtilityEntryExperimentGraphMemoOverview(modal);
                return;
            }
            if (event.target?.closest?.('[data-role="utility-entry-experiment-graph-close"]')) {
                closeUtilityEntryExperimentGraphModal(modal);
            }
        });
        modal.addEventListener('utility-graph-memo-overview-state', event => {
            syncUtilityEntryExperimentGraphMemoOverviewState(modal, event.detail?.open === true);
        });
        utilityEntryExperimentRoot.document.body.appendChild(modal);
        return modal;
    }

    function syncUtilityEntryExperimentGraphMemoOverviewState(modal = null, active = false) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const button = target?.querySelector?.('[data-role="utility-entry-experiment-graph-memo-overview"]');
        if (!button) return;
        const pressed = active === true;
        button.classList.toggle('is-active', pressed);
        button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
        button.setAttribute('aria-label', pressed ? '특이사항 닫기' : '특이사항 전체 확인');
        button.setAttribute('title', pressed ? '특이사항 닫기' : '특이사항');
    }

    function toggleUtilityEntryExperimentGraphMemoOverview(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const templateRoot = target?.querySelector?.('[data-role="utility-graph-template-root"]');
        if (!templateRoot) return false;
        let eventObject = null;
        const CustomEventCtor = utilityEntryExperimentRoot?.CustomEvent;
        const EventCtor = utilityEntryExperimentRoot?.Event;
        if (typeof CustomEventCtor === 'function') {
            eventObject = new CustomEventCtor('utility-graph-memo-overview-toggle', { bubbles: true });
        } else if (typeof EventCtor === 'function') {
            eventObject = new EventCtor('utility-graph-memo-overview-toggle', { bubbles: true });
        } else if (typeof utilityEntryExperimentRoot?.document?.createEvent === 'function') {
            eventObject = utilityEntryExperimentRoot.document.createEvent('Event');
            eventObject.initEvent('utility-graph-memo-overview-toggle', true, false);
        }
        if (!eventObject) return false;
        templateRoot.dispatchEvent(eventObject);
        return true;
    }

    function getUtilityEntryExperimentGraphFullscreenElement() {
        const doc = utilityEntryExperimentRoot?.document || null;
        return doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
    }

    function isUtilityEntryExperimentGraphFullscreen(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        return !!target && getUtilityEntryExperimentGraphFullscreenElement() === target;
    }

    function syncUtilityEntryExperimentGraphFullscreenState(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        const active = isUtilityEntryExperimentGraphFullscreen(target);
        const button = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen"]');
        const icon = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen-icon"]');
        const labelNode = target.querySelector?.('[data-role="utility-entry-experiment-graph-fullscreen-label"]');
        const label = active ? '전체화면 종료' : '전체화면';
        target.classList.toggle('is-browser-fullscreen', active);
        if (button) {
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        }
        if (icon) icon.className = `fa-solid ${active ? 'fa-compress' : 'fa-expand'}`;
        if (labelNode) labelNode.textContent = label;
    }

    async function toggleUtilityEntryExperimentGraphFullscreen(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const doc = utilityEntryExperimentRoot?.document || null;
        if (!target || !doc) return false;

        const fullscreenElement = getUtilityEntryExperimentGraphFullscreenElement();
        try {
            if (fullscreenElement === target) {
                const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
            } else {
                if (fullscreenElement) {
                    const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                    if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
                }
                const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
                if (typeof requestFullscreen !== 'function') {
                    utilityEntryExperimentRoot?.alert?.('브라우저 전체화면을 사용할 수 없습니다.');
                    return false;
                }
                await requestFullscreen.call(target);
            }
        } catch (error) {
            void error;
            return false;
        } finally {
            syncUtilityEntryExperimentGraphFullscreenState(target);
            scheduleUtilityEntryExperimentGraphModalResize(target);
        }
        return true;
    }

    function closeUtilityEntryExperimentGraphModal(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        if (isUtilityEntryExperimentGraphFullscreen(target)) {
            const doc = utilityEntryExperimentRoot?.document || null;
            const exitFullscreen = doc?.exitFullscreen || doc?.webkitExitFullscreen;
            const result = typeof exitFullscreen === 'function' ? exitFullscreen.call(doc) : null;
            result?.catch?.(() => {});
        }
        target.classList.remove('is-open');
        target.classList.remove('is-browser-fullscreen');
        target.setAttribute('aria-hidden', 'true');
        syncUtilityEntryExperimentGraphFullscreenState(target);
        syncUtilityEntryExperimentGraphMemoOverviewState(target, false);
    }

    function resizeUtilityEntryExperimentGraphModalContent(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const body = target?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]');
        const template = body?.querySelector?.('[data-role="utility-graph-template-root"], .utility-graph-template');
        if (!target?.classList?.contains?.('is-open') || !body || !template) return false;

        const bodyRect = typeof body.getBoundingClientRect === 'function'
            ? body.getBoundingClientRect()
            : null;
        const bodyWidth = Math.floor(Number(body.clientWidth || bodyRect?.width || 0));
        const bodyHeight = Math.floor(Number(body.clientHeight || bodyRect?.height || 0));
        if (bodyWidth <= 0 || bodyHeight <= 0) return false;

        template.style.width = `${UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH}px`;
        template.style.minHeight = `${UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT}px`;
        template.style.height = 'auto';
        template.style.margin = '0';
        template.style.transformOrigin = 'top left';
        template.style.transform = 'none';

        const naturalHeight = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.ceil(Number(template.scrollHeight || template.getBoundingClientRect?.().height || 0))
        ) + 12;
        const scaleX = bodyWidth / UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH;
        const scaleY = bodyHeight / naturalHeight;
        template.style.height = `${naturalHeight}px`;
        template.style.transform = `scale(${scaleX}, ${scaleY})`;
        return true;
    }

    function scheduleUtilityEntryExperimentGraphModalResize(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!target) return;
        const run = () => resizeUtilityEntryExperimentGraphModalContent(target);
        if (typeof utilityEntryExperimentRoot?.requestAnimationFrame === 'function') {
            utilityEntryExperimentRoot.requestAnimationFrame(() => {
                run();
                utilityEntryExperimentRoot.requestAnimationFrame(run);
            });
            return;
        }
        if (typeof utilityEntryExperimentRoot?.setTimeout === 'function') {
            utilityEntryExperimentRoot.setTimeout(run, 0);
            return;
        }
        run();
    }

    function bindUtilityEntryExperimentGraphModalResize() {
        if (!utilityEntryExperimentRoot || utilityEntryExperimentRoot.__utilityEntryExperimentGraphResizeBound) return;
        if (typeof utilityEntryExperimentRoot.addEventListener !== 'function') return;
        utilityEntryExperimentRoot.__utilityEntryExperimentGraphResizeBound = true;
        utilityEntryExperimentRoot.addEventListener('resize', () => {
            const modal = utilityEntryExperimentRoot.document?.getElementById?.('utility-entry-experiment-graph-modal');
            if (modal?.classList?.contains?.('is-open')) scheduleUtilityEntryExperimentGraphModalResize(modal);
        });
        const doc = utilityEntryExperimentRoot.document || null;
        const handleFullscreenChange = () => {
            const modal = doc?.getElementById?.('utility-entry-experiment-graph-modal');
            if (!modal) return;
            syncUtilityEntryExperimentGraphFullscreenState(modal);
            if (modal.classList?.contains?.('is-open')) scheduleUtilityEntryExperimentGraphModalResize(modal);
        };
        doc?.addEventListener?.('fullscreenchange', handleFullscreenChange);
        doc?.addEventListener?.('webkitfullscreenchange', handleFullscreenChange);
    }

    function getUtilityEntryExperimentGraphCaptureTarget(modal = null) {
        return modal?.querySelector?.('[data-role="utility-graph-template-root"], .utility-graph-template') || null;
    }

    function normalizeUtilityEntryExperimentGraphCaptureEdge(value, fallback) {
        const parsed = Number.parseInt(String(value ?? ''), 10);
        const resolved = Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
        return Math.min(4096, Math.max(320, resolved));
    }

    function getUtilityEntryExperimentGraphTemplateCaptureSize(target) {
        const rect = typeof target?.getBoundingClientRect === 'function'
            ? target.getBoundingClientRect()
            : null;
        const width = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH,
            Math.ceil(Number(target?.scrollWidth || target?.offsetWidth || rect?.width || 0))
        );
        const height = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.ceil(Number(target?.scrollHeight || target?.offsetHeight || rect?.height || 0))
        );
        return {
            width: Math.min(4096, Math.max(320, width)),
            height: Math.min(4096, Math.max(320, height))
        };
    }

    function getUtilityEntryExperimentGraphCaptureSize(modal = null) {
        const body = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]') || null;
        const bodyRect = typeof body?.getBoundingClientRect === 'function'
            ? body.getBoundingClientRect()
            : null;
        const screenWidth = Number.parseInt(String(utilityEntryExperimentRoot?.screen?.width ?? ''), 10) || 0;
        const screenHeight = Number.parseInt(String(utilityEntryExperimentRoot?.screen?.height ?? ''), 10) || 0;
        const innerWidth = Number.parseInt(String(utilityEntryExperimentRoot?.innerWidth ?? ''), 10) || 0;
        const innerHeight = Number.parseInt(String(utilityEntryExperimentRoot?.innerHeight ?? ''), 10) || 0;
        const bodyWidth = Math.ceil(Number(body?.clientWidth || bodyRect?.width || 0));
        const bodyHeight = Math.ceil(Number(body?.clientHeight || bodyRect?.height || 0));
        return {
            width: normalizeUtilityEntryExperimentGraphCaptureEdge(screenWidth || bodyWidth || innerWidth, 1920),
            height: normalizeUtilityEntryExperimentGraphCaptureEdge(screenHeight || bodyHeight || innerHeight, 1080)
        };
    }

    function waitUtilityEntryExperimentGraphCaptureFrame() {
        return new Promise(resolve => {
            if (typeof utilityEntryExperimentRoot?.requestAnimationFrame === 'function') {
                utilityEntryExperimentRoot.requestAnimationFrame(() => {
                    utilityEntryExperimentRoot.requestAnimationFrame(resolve);
                });
                return;
            }
            if (typeof utilityEntryExperimentRoot?.setTimeout === 'function') {
                utilityEntryExperimentRoot.setTimeout(resolve, 50);
                return;
            }
            resolve();
        });
    }

    async function ensureUtilityEntryExperimentGraphFullscreenForCapture(modal = null) {
        const target = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        const doc = utilityEntryExperimentRoot?.document || null;
        if (!target || !doc) return false;

        if (!isUtilityEntryExperimentGraphFullscreen(target)) {
            try {
                const fullscreenElement = getUtilityEntryExperimentGraphFullscreenElement();
                if (fullscreenElement && fullscreenElement !== target) {
                    const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;
                    if (typeof exitFullscreen === 'function') await exitFullscreen.call(doc);
                }
                const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;
                if (typeof requestFullscreen === 'function') await requestFullscreen.call(target);
            } catch (error) {
                void error;
            }
        }

        syncUtilityEntryExperimentGraphFullscreenState(target);
        scheduleUtilityEntryExperimentGraphModalResize(target);
        await waitUtilityEntryExperimentGraphCaptureFrame();
        return isUtilityEntryExperimentGraphFullscreen(target);
    }

    function collectUtilityEntryExperimentGraphStylesheetText() {
        const sheets = Array.from(utilityEntryExperimentRoot?.document?.styleSheets || []);
        return sheets
            .filter(sheet => String(sheet?.href || '').includes('utility-graph-template/styles.css'))
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules || [])
                        .map(rule => String(rule.cssText || ''))
                        .join('\n');
                } catch (error) {
                    void error;
                    return '';
                }
            })
            .filter(Boolean)
            .join('\n');
    }

    async function loadUtilityEntryExperimentGraphCaptureStyleText() {
        const styleText = collectUtilityEntryExperimentGraphStylesheetText();
        if (String(styleText || '').trim()) return styleText;
        if (typeof utilityEntryExperimentRoot?.fetch !== 'function') return '';
        if (!utilityEntryExperimentGraphCaptureStylePromise) {
            const URLCtor = utilityEntryExperimentRoot?.URL;
            const href = typeof URLCtor === 'function'
                ? new URLCtor(UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF, utilityEntryExperimentRoot.document?.baseURI || utilityEntryExperimentRoot.location?.href || '').toString()
                : UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_STYLE_HREF;
            utilityEntryExperimentGraphCaptureStylePromise = utilityEntryExperimentRoot.fetch(href, {
                cache: 'no-store',
                credentials: 'same-origin'
            })
                .then(response => (response.ok ? response.text() : ''))
                .catch(() => '');
        }
        return utilityEntryExperimentGraphCaptureStylePromise;
    }

    function cleanUtilityEntryExperimentGraphCaptureClone(target, templateSize) {
        const clone = target?.cloneNode?.(true);
        if (!clone) return null;
        const width = Math.max(320, Math.min(4096, Number(templateSize?.width) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH));
        const height = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.min(4096, Number(templateSize?.height) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT)
        );
        clone.querySelectorAll?.([
            '[data-role="utility-graph-memo-dialog"]',
            '[data-role="utility-graph-memo-overview-dialog"]',
            '[data-role="utility-graph-memo-add"]',
            '[data-role="utility-graph-memo-delete-line"]',
            '[data-role="utility-graph-memo-dialog-delete-line"]',
            '.report-auto-memo-add',
            '.report-auto-memo-delete'
        ].join(', '))?.forEach(element => element.remove());
        clone.querySelectorAll?.('[contenteditable]')?.forEach(element => {
            element.removeAttribute('contenteditable');
            element.removeAttribute('spellcheck');
        });
        clone.style.setProperty('--utility-graph-page-w', `${width}px`);
        clone.style.width = `${width}px`;
        clone.style.minHeight = `${height}px`;
        clone.style.height = `${height}px`;
        clone.style.margin = '0';
        clone.style.transform = 'none';
        clone.style.transformOrigin = 'top left';
        return clone;
    }

    async function buildUtilityEntryExperimentGraphCapturePageHtml(target, captureSize, templateSize = null) {
        const sourceSize = templateSize || getUtilityEntryExperimentGraphTemplateCaptureSize(target);
        const templateWidth = Math.max(320, Math.min(4096, Number(sourceSize?.width) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_WIDTH));
        const templateHeight = Math.max(
            UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT,
            Math.min(4096, Number(sourceSize?.height) || UTILITY_ENTRY_EXPERIMENT_GRAPH_TEMPLATE_HEIGHT)
        );
        const size = {
            width: normalizeUtilityEntryExperimentGraphCaptureEdge(captureSize?.width, 1920),
            height: normalizeUtilityEntryExperimentGraphCaptureEdge(captureSize?.height, 1080)
        };
        const scaleX = size.width / templateWidth;
        const scaleY = size.height / templateHeight;
        const clone = cleanUtilityEntryExperimentGraphCaptureClone(target, { width: templateWidth, height: templateHeight });
        if (!clone) throw new Error('utility_entry_graph_capture_target_unavailable');
        const styleText = await loadUtilityEntryExperimentGraphCaptureStyleText();
        return `<style>
${styleText}
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: ${size.width}px !important;
  height: ${size.height}px !important;
  background: #ffffff !important;
  overflow: hidden !important;
}
.utility-entry-experiment-graph-capture-page {
  width: ${size.width}px !important;
  height: ${size.height}px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #ffffff !important;
}
.utility-entry-experiment-graph-capture-page .utility-graph-template {
  --utility-graph-page-w: ${templateWidth}px !important;
  width: ${templateWidth}px !important;
  min-height: ${templateHeight}px !important;
  height: ${templateHeight}px !important;
  margin: 0 !important;
  transform: scale(${scaleX}, ${scaleY}) !important;
  transform-origin: top left !important;
  box-shadow: none !important;
}
.utility-entry-experiment-graph-capture-page .report-auto-memo-add,
.utility-entry-experiment-graph-capture-page .report-auto-memo-delete,
.utility-entry-experiment-graph-capture-page [data-role="utility-graph-memo-dialog"],
.utility-entry-experiment-graph-capture-page [data-role="utility-graph-memo-overview-dialog"] {
  display: none !important;
}
</style><div class="utility-entry-experiment-graph-capture-page">${clone.outerHTML}</div>`;
    }

    function buildUtilityEntryExperimentGraphCaptureEndpoint() {
        const runtimeConfig = utilityEntryExperimentRoot?.__KPI_SERVER_RUNTIME_CONFIG__ || {};
        const apiBase = String(runtimeConfig.apiBase || '/api').trim() || '/api';
        return `${apiBase.replace(/\/+$/, '')}/report-deck/capture-zip`;
    }

    function normalizeUtilityEntryExperimentGraphPdfFileName(value, fallback = 'utility-graph.pdf') {
        const normalized = String(value || fallback)
            .trim()
            .replace(/[\\/:*?"<>|\r\n]+/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_');
        const fileName = normalized || fallback;
        return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    }

    function buildUtilityEntryExperimentGraphPdfFileName(modal = null) {
        const data = modal?._utilityEntryExperimentGraphData || {};
        const title = String(data?.title || modal?.querySelector?.('[data-role="utility-entry-experiment-graph-title"]')?.textContent || '정산 그래프').trim();
        const monthKey = String(data?.memo?.monthKey || '').trim();
        return normalizeUtilityEntryExperimentGraphPdfFileName([monthKey, title].filter(Boolean).join(' '), 'utility-graph.pdf');
    }

    function downloadUtilityEntryExperimentGraphCaptureBlob(fileName, blob) {
        const doc = utilityEntryExperimentRoot?.document || null;
        const URLApi = utilityEntryExperimentRoot?.URL;
        if (!doc || typeof doc.createElement !== 'function' || typeof URLApi?.createObjectURL !== 'function') {
            throw new Error('utility_entry_graph_capture_download_unavailable');
        }
        const objectUrl = URLApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.style.display = 'none';
        doc.body?.appendChild?.(link);
        link.click?.();
        link.remove?.();
        utilityEntryExperimentRoot?.setTimeout?.(() => {
            URLApi.revokeObjectURL?.(objectUrl);
        }, 0);
    }

    function setUtilityEntryExperimentGraphPdfBusy(modal = null, busy = false) {
        const button = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf"]');
        const icon = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf-icon"]');
        const labelNode = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-capture-pdf-label"]');
        const label = busy ? 'PDF 변환 중' : 'PDF 인쇄';
        if (modal) modal.dataset.utilityEntryExperimentGraphPdfBusy = busy ? 'true' : 'false';
        if (button) {
            button.disabled = busy;
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
        }
        if (icon) icon.className = `fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-file-pdf'}`;
        if (labelNode) labelNode.textContent = label;
    }

    async function captureUtilityEntryExperimentGraphPdf(modal = null) {
        const targetModal = modal || utilityEntryExperimentRoot?.document?.getElementById?.('utility-entry-experiment-graph-modal');
        if (!targetModal || targetModal.dataset.utilityEntryExperimentGraphPdfBusy === 'true') return false;
        const target = getUtilityEntryExperimentGraphCaptureTarget(targetModal);
        if (!target) {
            utilityEntryExperimentRoot?.alert?.('PDF로 변환할 그래프가 없습니다.');
            return false;
        }
        setUtilityEntryExperimentGraphPdfBusy(targetModal, true);
        try {
            await ensureUtilityEntryExperimentGraphFullscreenForCapture(targetModal);
            await utilityEntryExperimentRoot?.document?.fonts?.ready?.catch?.(() => {});
            const size = getUtilityEntryExperimentGraphCaptureSize(targetModal);
            const templateSize = getUtilityEntryExperimentGraphTemplateCaptureSize(target);
            const fileName = buildUtilityEntryExperimentGraphPdfFileName(targetModal);
            const pageHtml = await buildUtilityEntryExperimentGraphCapturePageHtml(target, size, templateSize);
            const response = await utilityEntryExperimentRoot.fetch(buildUtilityEntryExperimentGraphCaptureEndpoint(), {
                method: 'POST',
                headers: {
                    Accept: 'application/pdf, application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                body: JSON.stringify({
                    fileName,
                    width: size.width,
                    height: size.height,
                    format: 'pdf',
                    pageNumbers: [1],
                    pages: [pageHtml]
                })
            });
            if (!response.ok) {
                const error = new Error(`utility_entry_graph_capture_failed:${response.status}`);
                error.detail = await response.text().catch(() => '');
                throw error;
            }
            downloadUtilityEntryExperimentGraphCaptureBlob(fileName, await response.blob());
            return true;
        } catch (error) {
            void error;
            utilityEntryExperimentRoot?.alert?.('그래프 PDF 변환에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            return false;
        } finally {
            setUtilityEntryExperimentGraphPdfBusy(targetModal, false);
        }
    }

    function openUtilityEntryExperimentGraphModal(data) {
        const renderer = utilityEntryExperimentRoot?.KpiUtilityGraphTemplate;
        if (!renderer || typeof renderer.render !== 'function') {
            utilityEntryExperimentRoot?.alert?.('그래프 양식을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
            return false;
        }

        const modal = ensureUtilityEntryExperimentGraphModal();
        const body = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-template"]');
        const title = modal?.querySelector?.('[data-role="utility-entry-experiment-graph-title"]');
        if (!modal || !body) return false;

        if (title) title.textContent = data?.title || '정산 그래프';
        renderer.render(body, data || {});
        modal._utilityEntryExperimentGraphData = data || {};
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        bindUtilityEntryExperimentGraphModalResize();
        syncUtilityEntryExperimentGraphFullscreenState(modal);
        syncUtilityEntryExperimentGraphMemoOverviewState(modal, false);
        scheduleUtilityEntryExperimentGraphModalResize(modal);
        return true;
    }

    function setUtilityEntryExperimentGraphTogglePressed(host, activeButton) {
        Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-graph-toggle"]') || []).forEach(button => {
            const isActive = button === activeButton;
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            button.classList.toggle('is-active', isActive);
        });
    }

    function getUtilityEntryExperimentMonthOffset(monthValue = '', offset = 0) {
        if (!/^\d{4}-\d{2}$/.test(String(monthValue || ''))) return '';
        const [year, month] = monthValue.split('-').map(Number);
        const date = new Date(year, month - 1 + Number(offset || 0), 1);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function buildUtilityEntryExperimentGraphEmptyMonthList(endMonthValue = '', count = 13) {
        const normalizedEnd = /^\d{4}-\d{2}$/.test(String(endMonthValue || ''))
            ? String(endMonthValue)
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => {
            const key = getUtilityEntryExperimentMonthOffset(normalizedEnd, index - count + 1);
            const [year, month] = key.split('-').map(Number);
            return {
                key,
                year,
                month,
                monthLabel: `${month}월`,
                label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
            };
        });
    }

    function getUtilityEntryExperimentGraphDefinition(graphKey = '') {
        const normalizedKey = String(graphKey || '').trim();
        return UTILITY_ENTRY_EXPERIMENT_GRAPH_DEFINITIONS[normalizedKey] || null;
    }

    function buildUtilityEntryExperimentGraphTemplateEmptyData(_records, graphKey = '', monthValue = '') {
        const definition = getUtilityEntryExperimentGraphDefinition(graphKey);
        if (!definition) return null;

        const topMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 13);
        const tableMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 25);
        const topMonthKeys = new Set(topMonths.map(month => month.key));
        const usageSeries = {};
        const amountSeries = {};
        const productionSeries = {};
        const bottomSeries = {};

        tableMonths.forEach(month => {
            if (topMonthKeys.has(month.key)) {
                usageSeries[month.key] = null;
                amountSeries[month.key] = null;
                productionSeries[month.key] = null;
            }
            bottomSeries[month.key] = null;
            month.value = null;
            month.highlight = month.key === monthValue || month.key === getUtilityEntryExperimentMonthOffset(monthValue, -12);
        });

        return {
            title: definition.title,
            rangeText: '',
            labels: {
                ...definition.labels,
                leftAxis: '금액',
                rightAxis: definition.labels?.usage || '사용량',
                amount: '금액',
                amountUnit: '원',
                production: '생산량',
                productionUnit: 'Kg',
                bottomCaption: ''
            },
            topMonths,
            tableMonths,
            bottomMonths: tableMonths,
            replaceTableMonths: true,
            topSeries: {
                usage: usageSeries,
                amount: amountSeries,
                production: productionSeries
            },
            bottomSeries,
            options: {
                top: {
                    autoScale: true,
                    showDataLabels: true
                },
                bottom: {
                    showDataLabels: true
                }
            },
            remark: ''
        };
    }

    function buildUtilityEntryExperimentGraphMonthList(endMonthValue = '', count = 13) {
        const normalizedEnd = /^\d{4}-\d{2}$/.test(String(endMonthValue || ''))
            ? String(endMonthValue)
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        return Array.from({ length: Math.max(1, Number(count) || 1) }, (_, index) => {
            const key = getUtilityEntryExperimentMonthOffset(normalizedEnd, index - count + 1);
            const [year, month] = key.split('-').map(Number);
            return {
                key,
                year,
                month,
                monthLabel: `${month}월`,
                label: `${String(year).slice(2)}.${String(month).padStart(2, '0')}`
            };
        });
    }

    function getUtilityEntryExperimentGraphMonthParts(monthValue = '') {
        const match = String(monthValue || '').trim().match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        return {
            year: Number(match[1]),
            month: Number(match[2])
        };
    }

    function getUtilityEntryExperimentGraphMonthlyProduction(definition, monthValue = '') {
        const teams = Array.isArray(definition?.productionTeamNames) ? definition.productionTeamNames : [];
        const monthParts = getUtilityEntryExperimentGraphMonthParts(monthValue);
        const productionGetter = utilityEntryExperimentRoot?.getUtilDailyProductionValue;
        if (!teams.length || !monthParts || typeof productionGetter !== 'function') return null;

        let total = 0;
        let hasValue = false;
        teams.forEach(teamName => {
            const result = productionGetter(teamName, monthParts.year, monthParts.month);
            const value = parts.parseUtilityEntryExperimentNumber(result?.value ?? result);
            if (!Number.isFinite(value)) return;
            total += value;
            hasValue = true;
        });
        return hasValue ? parts.roundUtilityEntryExperimentWholeNumber(total) : null;
    }

    function getUtilityEntryExperimentWasteProductionTeamNames(scopeKey = '') {
        return String(scopeKey || '').trim() === 'waste_bukjeong'
            ? ['1팀 1파트']
            : ['1팀 2파트', '2팀', '3팀'];
    }

    function getUtilityEntryExperimentWasteMonthlyProduction(scopeKey = '', monthValue = '') {
        return getUtilityEntryExperimentGraphMonthlyProduction({
            productionTeamNames: getUtilityEntryExperimentWasteProductionTeamNames(scopeKey)
        }, monthValue);
    }

    function calculateUtilityEntryExperimentWastePerProductionTon(usage, productionKg) {
        const productionTon = Number.isFinite(productionKg) ? productionKg / 1000 : null;
        return Number.isFinite(usage) && Number.isFinite(productionTon) && productionTon > 0
            ? parts.roundUtilityEntryExperimentNumber(usage / productionTon, 3)
            : null;
    }

    function getUtilityEntryExperimentGraphAmountValue(fields = {}) {
        const billingAmount = parts.parseUtilityEntryExperimentNumber(fields.billing_amount);
        if (Number.isFinite(billingAmount)) return parts.roundUtilityEntryExperimentWholeNumber(billingAmount);
        const electricityChargeTotal = parts.parseUtilityEntryExperimentNumber(fields.electricity_charge_total);
        if (Number.isFinite(electricityChargeTotal)) return parts.roundUtilityEntryExperimentWholeNumber(electricityChargeTotal);
        return null;
    }

    function buildUtilityEntryExperimentGraphMemoConfig(definition, records, monthValue) {
        return {
            key: String(definition?.memoKey || '').trim(),
            monthKey: /^\d{4}-\d{2}$/.test(String(monthValue || '')) ? String(monthValue) : '',
            defaultTeam: String(definition?.memoDefaultTeam || '').trim(),
            defaultMetric: String(definition?.memoDefaultMetric || '').trim(),
            store: {
                resourceDatasets: {
                    electric: records?.electric || {},
                    gas: records?.gas || {},
                    waste: records?.waste || {},
                    other: records?.other || {}
                }
            }
        };
    }

    function getUtilityEntryExperimentReportRecordKey(monthValue = '') {
        const normalizedMonth = String(monthValue || '').trim();
        return /^\d{4}-\d{2}$/.test(normalizedMonth)
            ? `report_${normalizedMonth.replace('-', '_')}`
            : '';
    }

    async function saveUtilityEntryExperimentGraphReportMemo(monthValue, memoKey, text) {
        const recordKey = getUtilityEntryExperimentReportRecordKey(monthValue);
        const key = String(memoKey || '').trim();
        const adapter = utilityEntryExperimentRoot?.KpiUtilRuntimeBrowserAdapter;
        if (!recordKey || !key || typeof adapter?.fetchReportDeckCover !== 'function' || typeof adapter?.saveReportDeckCover !== 'function') return false;
        try {
            const result = await adapter.fetchReportDeckCover({ recordKey });
            const payload = {
                ...(result?.record?.payload || {})
            };
            payload[key] = String(text || '').trim();
            await adapter.saveReportDeckCover(payload, { recordKey });
            return true;
        } catch (error) {
            void error;
            return false;
        }
    }

    function buildUtilityEntryExperimentGraphTemplateData(records, graphKey = '', monthValue = '') {
        const definition = getUtilityEntryExperimentGraphDefinition(graphKey);
        if (!definition) return null;

        const normalizedRecords = {
            electric: records?.electric || {},
            gas: records?.gas || {},
            waste: records?.waste || {},
            other: records?.other || {}
        };
        const topMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 13);
        const tableMonths = buildUtilityEntryExperimentGraphMonthList(monthValue, 25);
        const topMonthKeys = new Set(topMonths.map(month => month.key));
        const previousYearMonth = getUtilityEntryExperimentMonthOffset(monthValue, -12);
        const comparisonKeys = [previousYearMonth, monthValue].filter(Boolean);
        const usageSeries = {};
        const amountSeries = {};
        const productionSeries = {};
        const bottomSeries = {};
        const resourceType = definition.resourceType || 'electric';
        const scopeKey = definition.scopeKey || (graphKey === 'electric_bukjeong' ? 'bukjeong' : 'yusan');
        const dataset = normalizedRecords[resourceType] || {};

        tableMonths.forEach(month => {
            const usage = parts.getUtilityEntryExperimentSettlementUsageBase(normalizedRecords, scopeKey, month.key);
            const fields = parts.resolveUtilityEntryExperimentSettlementFields(normalizedRecords, dataset, month.key, scopeKey);
            const amount = getUtilityEntryExperimentGraphAmountValue(fields);
            const production = getUtilityEntryExperimentGraphMonthlyProduction(definition, month.key);
            const ratio = Number.isFinite(usage) && Number.isFinite(production) && production > 0
                ? parts.roundUtilityEntryExperimentNumber(usage / production, 3)
                : null;

            if (topMonthKeys.has(month.key)) {
                usageSeries[month.key] = Number.isFinite(usage) ? parts.roundUtilityEntryExperimentWholeNumber(usage) : null;
                amountSeries[month.key] = Number.isFinite(amount) ? amount : null;
                productionSeries[month.key] = Number.isFinite(production) ? production : null;
            }
            bottomSeries[month.key] = Number.isFinite(ratio) ? ratio : null;
            month.value = Number.isFinite(ratio) ? ratio : null;
            month.highlight = month.key === monthValue || month.key === previousYearMonth;
        });

        const ratioLabel = definition.labels?.ratio || '생산량 대비';
        const ratioUnit = definition.labels?.ratioUnit || '';
        const bottomPoints = tableMonths.map(month => ({
            key: month.key,
            label: month.label,
            value: bottomSeries[month.key]
        }));

        return {
            title: definition.title,
            rangeText: '',
            labels: {
                ...definition.labels,
                leftAxis: '금액',
                rightAxis: definition.labels?.usage || '사용량',
                amount: '금액',
                amountUnit: '원',
                production: '생산량',
                productionUnit: 'Kg',
                bottomCaption: ''
            },
            topMonths,
            tableMonths,
            bottomMonths: tableMonths,
            replaceTableMonths: true,
            topSeries: {
                usage: usageSeries,
                amount: amountSeries,
                production: productionSeries
            },
            bottomSeries,
            reportBottomChart: {
                points: bottomPoints,
                metricLabel: ratioUnit,
                axisYLabel: ratioLabel,
                focusMonthKey: monthValue,
                comparisonKeys,
                decimals: 3,
                showLabels: true,
                maxXAxisLabels: 25
            },
            options: {
                top: {
                    autoScale: true,
                    showDataLabels: true
                },
                bottom: {
                    comparisonKeys,
                    showDataLabels: true
                }
            },
            memo: buildUtilityEntryExperimentGraphMemoConfig(definition, normalizedRecords, monthValue),
            remark: ''
        };
    }

    function attachUtilityEntryExperimentGraphMemoSave(data, monthValue = '') {
        if (!data?.memo?.key) return data;
        let memoSaveQueue = Promise.resolve();
        data.memo.onChange = text => {
            memoSaveQueue = memoSaveQueue
                .catch(() => {})
                .then(() => saveUtilityEntryExperimentGraphReportMemo(monthValue, data.memo.key, text));
            return memoSaveQueue;
        };
        return data;
    }

    async function openUtilityEntryExperimentGraphTemplateByKey(graphKey = '', monthValue = '') {
        const normalizedGraphKey = String(graphKey || '').trim();
        const normalizedMonth = /^\d{4}-\d{2}$/.test(String(monthValue || '')) ? String(monthValue) : '';
        if (!normalizedGraphKey) return false;

        let records = null;
        try {
            records = await parts.loadUtilityEntryExperimentActualRecords();
        } catch (error) {
            void error;
            utilityEntryExperimentRoot?.alert?.('그래프 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
            return false;
        }

        const data = buildUtilityEntryExperimentGraphTemplateData(records, normalizedGraphKey, normalizedMonth);
        if (!data) {
            utilityEntryExperimentRoot?.alert?.('그래프 양식을 만들 수 없습니다.');
            return false;
        }
        attachUtilityEntryExperimentGraphMemoSave(data, normalizedMonth);
        return openUtilityEntryExperimentGraphModal(data);
    }

    async function openUtilityEntryExperimentGraphTemplate(host, button) {
        const graphKey = String(button?.dataset?.utilityEntryExperimentGraph || '').trim();
        const monthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
        if (!graphKey) return false;
        const opened = await openUtilityEntryExperimentGraphTemplateByKey(graphKey, monthValue);
        if (opened) setUtilityEntryExperimentGraphTogglePressed(host, button);
        return opened;
    }


    Object.assign(parts, { ensureUtilityEntryExperimentGraphModal, syncUtilityEntryExperimentGraphMemoOverviewState, toggleUtilityEntryExperimentGraphMemoOverview, getUtilityEntryExperimentGraphFullscreenElement, isUtilityEntryExperimentGraphFullscreen, syncUtilityEntryExperimentGraphFullscreenState, toggleUtilityEntryExperimentGraphFullscreen, closeUtilityEntryExperimentGraphModal, resizeUtilityEntryExperimentGraphModalContent, scheduleUtilityEntryExperimentGraphModalResize, bindUtilityEntryExperimentGraphModalResize, getUtilityEntryExperimentGraphCaptureTarget, normalizeUtilityEntryExperimentGraphCaptureEdge, getUtilityEntryExperimentGraphTemplateCaptureSize, getUtilityEntryExperimentGraphCaptureSize, waitUtilityEntryExperimentGraphCaptureFrame, ensureUtilityEntryExperimentGraphFullscreenForCapture, collectUtilityEntryExperimentGraphStylesheetText, loadUtilityEntryExperimentGraphCaptureStyleText, cleanUtilityEntryExperimentGraphCaptureClone, buildUtilityEntryExperimentGraphCapturePageHtml, buildUtilityEntryExperimentGraphCaptureEndpoint, normalizeUtilityEntryExperimentGraphPdfFileName, buildUtilityEntryExperimentGraphPdfFileName, downloadUtilityEntryExperimentGraphCaptureBlob, setUtilityEntryExperimentGraphPdfBusy, captureUtilityEntryExperimentGraphPdf, openUtilityEntryExperimentGraphModal, setUtilityEntryExperimentGraphTogglePressed, getUtilityEntryExperimentMonthOffset, buildUtilityEntryExperimentGraphEmptyMonthList, getUtilityEntryExperimentGraphDefinition, buildUtilityEntryExperimentGraphTemplateEmptyData, buildUtilityEntryExperimentGraphMonthList, getUtilityEntryExperimentGraphMonthParts, getUtilityEntryExperimentGraphMonthlyProduction, getUtilityEntryExperimentWasteProductionTeamNames, getUtilityEntryExperimentWasteMonthlyProduction, calculateUtilityEntryExperimentWastePerProductionTon, getUtilityEntryExperimentGraphAmountValue, buildUtilityEntryExperimentGraphMemoConfig, getUtilityEntryExperimentReportRecordKey, saveUtilityEntryExperimentGraphReportMemo, buildUtilityEntryExperimentGraphTemplateData, attachUtilityEntryExperimentGraphMemoSave, openUtilityEntryExperimentGraphTemplateByKey, openUtilityEntryExperimentGraphTemplate });
})(this);
