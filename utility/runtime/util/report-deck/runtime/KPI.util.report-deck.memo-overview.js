(function registerKpiReportDeckRuntimeMemoOverview(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function closeReportDeckMemoDialog(root) {
        const dialog = parts.getReportDeckMemoDialog(root);
        if (!dialog) return;
        stopReportDeckMemoDialogDrag(dialog);
        dialog.hidden = true;
        delete dialog.dataset.reportMemoTarget;
        dialog.__reportMemoCandidates = [];
    }

    const REPORT_DECK_MEMO_DIALOG_MARGIN = 12;

    function getReportDeckMemoDialogWindow(dialog) {
        return dialog?.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    }

    function getReportDeckMemoDialogViewport(dialog) {
        const ownerWindow = getReportDeckMemoDialogWindow(dialog);
        const width = Number(ownerWindow?.innerWidth)
            || Number(dialog?.ownerDocument?.documentElement?.clientWidth)
            || 0;
        const height = Number(ownerWindow?.innerHeight)
            || Number(dialog?.ownerDocument?.documentElement?.clientHeight)
            || 0;
        return {
            width: Math.max(0, width),
            height: Math.max(0, height)
        };
    }

    function getReportDeckMemoDialogRect(dialog) {
        const rect = dialog?.getBoundingClientRect?.();
        return {
            left: Number(rect?.left) || 0,
            top: Number(rect?.top) || 0,
            width: Math.max(0, Number(rect?.width) || Number(dialog?.offsetWidth) || 0),
            height: Math.max(0, Number(rect?.height) || Number(dialog?.offsetHeight) || 0)
        };
    }

    function clampReportDeckMemoDialogPosition(dialog, left, top) {
        const viewport = getReportDeckMemoDialogViewport(dialog);
        const rect = getReportDeckMemoDialogRect(dialog);
        const maxLeft = Math.max(
            REPORT_DECK_MEMO_DIALOG_MARGIN,
            viewport.width - rect.width - REPORT_DECK_MEMO_DIALOG_MARGIN
        );
        const maxTop = Math.max(
            REPORT_DECK_MEMO_DIALOG_MARGIN,
            viewport.height - rect.height - REPORT_DECK_MEMO_DIALOG_MARGIN
        );
        const safeLeft = Number.isFinite(left) ? left : rect.left;
        const safeTop = Number.isFinite(top) ? top : rect.top;
        return {
            left: Math.min(Math.max(safeLeft, REPORT_DECK_MEMO_DIALOG_MARGIN), maxLeft),
            top: Math.min(Math.max(safeTop, REPORT_DECK_MEMO_DIALOG_MARGIN), maxTop)
        };
    }

    function setReportDeckMemoDialogPosition(dialog, left, top) {
        if (!dialog?.style) return;
        const position = clampReportDeckMemoDialogPosition(dialog, left, top);
        dialog.style.left = `${position.left}px`;
        dialog.style.top = `${position.top}px`;
        dialog.style.right = 'auto';
        if (dialog.dataset) {
            dialog.dataset.reportMemoFloating = 'true';
        }
    }

    function syncReportDeckMemoDialogFloatingPosition(dialog) {
        if (!dialog || dialog.hidden || dialog.dataset?.reportMemoFloating !== 'true') return;
        const rect = getReportDeckMemoDialogRect(dialog);
        setReportDeckMemoDialogPosition(dialog, rect.left, rect.top);
    }

    function stopReportDeckMemoDialogDrag(dialog) {
        dialog?.__reportMemoDialogDragCleanup?.();
        if (dialog) delete dialog.__reportMemoDialogDragCleanup;
        dialog?.classList?.remove?.('is-dragging');
    }

    function startReportDeckMemoDialogDrag(root, event) {
        if (!event || Number(event.button) > 0) return false;
        const handle = event.target?.closest?.('[data-report-memo-drag-handle]');
        if (!handle || event.target?.closest?.('[data-report-memo-close]')) return false;
        const dialog = parts.getReportDeckMemoDialog(root);
        if (!dialog || dialog.hidden) return false;
        const ownerWindow = getReportDeckMemoDialogWindow(dialog);
        if (!ownerWindow?.addEventListener) return false;
        const startX = Number(event.clientX);
        const startY = Number(event.clientY);
        if (!Number.isFinite(startX) || !Number.isFinite(startY)) return false;
        const rect = getReportDeckMemoDialogRect(dialog);
        const pointerId = event.pointerId;
        let dragging = true;
        const move = moveEvent => {
            if (!dragging) return;
            const nextX = Number(moveEvent?.clientX);
            const nextY = Number(moveEvent?.clientY);
            if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
            setReportDeckMemoDialogPosition(dialog, rect.left + nextX - startX, rect.top + nextY - startY);
            moveEvent?.preventDefault?.();
        };
        const cleanup = () => {
            if (!dragging) return;
            dragging = false;
            dialog.classList?.remove?.('is-dragging');
            ownerWindow.removeEventListener?.('pointermove', move);
            ownerWindow.removeEventListener?.('pointerup', cleanup);
            ownerWindow.removeEventListener?.('pointercancel', cleanup);
            if (pointerId !== undefined) {
                handle.releasePointerCapture?.(pointerId);
            }
            delete dialog.__reportMemoDialogDragCleanup;
        };
        stopReportDeckMemoDialogDrag(dialog);
        dialog.classList?.add?.('is-dragging');
        dialog.__reportMemoDialogDragCleanup = cleanup;
        if (pointerId !== undefined) {
            handle.setPointerCapture?.(pointerId);
        }
        ownerWindow.addEventListener('pointermove', move);
        ownerWindow.addEventListener('pointerup', cleanup);
        ownerWindow.addEventListener('pointercancel', cleanup);
        event.preventDefault?.();
        return true;
    }

    function getReportDeckMemoOverviewDialog(root) {
        return root?.querySelector?.('[data-report-memo-overview-dialog]') || null;
    }

    const REPORT_DECK_MEMO_OVERVIEW_POPUP_NAME = 'kpi_report_memo_overview';
    const REPORT_DECK_MEMO_OVERVIEW_POPUP_FEATURES = [
        'popup=yes',
        'width=920',
        'height=680',
        'left=80',
        'top=80',
        'resizable=yes',
        'scrollbars=yes'
    ].join(',');
    const REPORT_DECK_MEMO_OVERVIEW_MARGIN = 12;

    function getReportDeckMemoOverviewWindow(dialog) {
        return dialog?.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    }

    function getReportDeckMemoOverviewViewport(dialog) {
        const ownerWindow = getReportDeckMemoOverviewWindow(dialog);
        const width = Number(ownerWindow?.innerWidth)
            || Number(dialog?.ownerDocument?.documentElement?.clientWidth)
            || 0;
        const height = Number(ownerWindow?.innerHeight)
            || Number(dialog?.ownerDocument?.documentElement?.clientHeight)
            || 0;
        return {
            width: Math.max(0, width),
            height: Math.max(0, height)
        };
    }

    function getReportDeckMemoOverviewRect(dialog) {
        const rect = dialog?.getBoundingClientRect?.();
        return {
            left: Number(rect?.left) || 0,
            top: Number(rect?.top) || 0,
            width: Math.max(0, Number(rect?.width) || Number(dialog?.offsetWidth) || 0),
            height: Math.max(0, Number(rect?.height) || Number(dialog?.offsetHeight) || 0)
        };
    }

    function clampReportDeckMemoOverviewPosition(dialog, left, top) {
        const viewport = getReportDeckMemoOverviewViewport(dialog);
        const rect = getReportDeckMemoOverviewRect(dialog);
        const maxLeft = Math.max(
            REPORT_DECK_MEMO_OVERVIEW_MARGIN,
            viewport.width - rect.width - REPORT_DECK_MEMO_OVERVIEW_MARGIN
        );
        const maxTop = Math.max(
            REPORT_DECK_MEMO_OVERVIEW_MARGIN,
            viewport.height - rect.height - REPORT_DECK_MEMO_OVERVIEW_MARGIN
        );
        const safeLeft = Number.isFinite(left) ? left : rect.left;
        const safeTop = Number.isFinite(top) ? top : rect.top;
        return {
            left: Math.min(Math.max(safeLeft, REPORT_DECK_MEMO_OVERVIEW_MARGIN), maxLeft),
            top: Math.min(Math.max(safeTop, REPORT_DECK_MEMO_OVERVIEW_MARGIN), maxTop)
        };
    }

    function setReportDeckMemoOverviewPosition(dialog, left, top) {
        if (!dialog?.style) return;
        const position = clampReportDeckMemoOverviewPosition(dialog, left, top);
        dialog.style.left = `${position.left}px`;
        dialog.style.top = `${position.top}px`;
        dialog.style.right = 'auto';
        if (dialog.dataset) {
            dialog.dataset.reportMemoOverviewFloating = 'true';
        }
    }

    function syncReportDeckMemoOverviewFloatingPosition(dialog) {
        if (!dialog || dialog.hidden || dialog.dataset?.reportMemoOverviewFloating !== 'true') return;
        const rect = getReportDeckMemoOverviewRect(dialog);
        setReportDeckMemoOverviewPosition(dialog, rect.left, rect.top);
    }

    function stopReportDeckMemoOverviewDrag(dialog) {
        dialog?.__reportMemoOverviewDragCleanup?.();
        delete dialog?.__reportMemoOverviewDragCleanup;
        dialog?.classList?.remove?.('is-dragging');
    }

    function startReportDeckMemoOverviewDrag(root, event) {
        if (!event || Number(event.button) > 0) return false;
        const handle = event.target?.closest?.('[data-report-memo-overview-drag-handle]');
        if (!handle || event.target?.closest?.('[data-report-memo-overview-close]')) return false;
        const dialog = getReportDeckMemoOverviewDialog(root);
        if (!dialog || dialog.hidden) return false;
        const ownerWindow = getReportDeckMemoOverviewWindow(dialog);
        if (!ownerWindow?.addEventListener) return false;
        const startX = Number(event.clientX);
        const startY = Number(event.clientY);
        if (!Number.isFinite(startX) || !Number.isFinite(startY)) return false;
        const rect = getReportDeckMemoOverviewRect(dialog);
        const pointerId = event.pointerId;
        let dragging = true;
        const move = moveEvent => {
            if (!dragging) return;
            const nextX = Number(moveEvent?.clientX);
            const nextY = Number(moveEvent?.clientY);
            if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
            setReportDeckMemoOverviewPosition(dialog, rect.left + nextX - startX, rect.top + nextY - startY);
            moveEvent?.preventDefault?.();
        };
        const cleanup = () => {
            if (!dragging) return;
            dragging = false;
            dialog.classList?.remove?.('is-dragging');
            ownerWindow.removeEventListener?.('pointermove', move);
            ownerWindow.removeEventListener?.('pointerup', cleanup);
            ownerWindow.removeEventListener?.('pointercancel', cleanup);
            if (pointerId !== undefined) {
                handle.releasePointerCapture?.(pointerId);
            }
            delete dialog.__reportMemoOverviewDragCleanup;
        };
        stopReportDeckMemoOverviewDrag(dialog);
        dialog.classList?.add?.('is-dragging');
        dialog.__reportMemoOverviewDragCleanup = cleanup;
        if (pointerId !== undefined) {
            handle.setPointerCapture?.(pointerId);
        }
        ownerWindow.addEventListener('pointermove', move);
        ownerWindow.addEventListener('pointerup', cleanup);
        ownerWindow.addEventListener('pointercancel', cleanup);
        event.preventDefault?.();
        return true;
    }

    async function copyReportDeckTextToClipboard(root, text = '') {
        const value = String(text || '');
        if (!value) return false;
        const ownerWindow = parts.getReportDeckWindow(root);
        const clipboard = ownerWindow?.navigator?.clipboard
            || (typeof navigator !== 'undefined' ? navigator.clipboard : null);
        if (typeof clipboard?.writeText === 'function') {
            await clipboard.writeText(value);
            return true;
        }
        const ownerDocument = root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
        if (!ownerDocument?.createElement || typeof ownerDocument?.execCommand !== 'function') return false;
        const textarea = ownerDocument.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute?.('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        ownerDocument.body?.appendChild?.(textarea);
        textarea.focus?.();
        textarea.select?.();
        let copied = false;
        try {
            copied = ownerDocument.execCommand('copy') === true;
        } finally {
            textarea.remove?.();
        }
        return copied;
    }

    function markReportDeckMemoCopyButton(button, copied) {
        if (!button) return;
        button.textContent = copied ? '복사됨' : '실패';
        if (button.dataset) {
            button.dataset.reportMemoCopyState = copied ? 'copied' : 'failed';
        }
        const schedule = typeof setTimeout === 'function' ? setTimeout : null;
        if (typeof schedule !== 'function') return;
        schedule(() => {
            button.textContent = '복사';
            if (button.dataset) {
                delete button.dataset.reportMemoCopyState;
            }
        }, copied ? 900 : 1400);
    }

    async function copyReportDeckMemoOverviewText(root, button) {
        const text = String(button?.dataset?.reportMemoCopyText || '').trim();
        const copied = await copyReportDeckTextToClipboard(root, text);
        markReportDeckMemoCopyButton(button, copied);
        return copied;
    }

    function buildReportDeckMemoOverviewPopupHtml(contentHtml = '') {
        return '<!doctype html>'
            + '<html lang="ko">'
            + '<head>'
            + '<meta charset="utf-8">'
            + '<meta name="viewport" content="width=device-width, initial-scale=1">'
            + '<title>특이사항 전체 확인</title>'
            + '<style>'
            + 'html,body{margin:0;min-height:100%;background:#f8fafc;color:#0f172a;font-family:Arial,"Malgun Gothic","맑은 고딕",sans-serif;}'
            + 'body{display:grid;grid-template-rows:auto minmax(0,1fr);height:100vh;overflow:hidden;}'
            + '.report-memo-overview-popup-head{min-height:48px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #cbd5e1;background:#fff;padding:0 14px;box-sizing:border-box;}'
            + '.report-memo-overview-popup-head strong{font-size:14px;font-weight:900;}'
            + '.report-memo-overview-popup-head button{min-width:48px;height:30px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#334155;font-size:12px;font-weight:900;cursor:pointer;}'
            + '.report-memo-overview-body{min-height:0;padding:12px 14px 14px;overflow:auto;box-sizing:border-box;}'
            + '.report-memo-overview-group + .report-memo-overview-group{margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;}'
            + '.report-memo-overview-group-title{margin:0 0 7px;color:#0f172a;font-size:12px;font-weight:900;}'
            + '.report-memo-overview-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 6px;}'
            + '.report-memo-overview-row{display:grid;grid-template-columns:minmax(48px,max-content) minmax(0,1fr) auto;align-items:center;gap:4px;min-height:18px;border:1px solid #e5e7eb;border-radius:3px;background:#fbfdff;padding:2px 3px;color:#111827;font-size:5.2px;font-weight:900;line-height:1.08;}'
            + '.report-memo-overview-row-label{color:#334155;white-space:normal;overflow:visible;text-overflow:clip;word-break:keep-all;}'
            + '.report-memo-overview-row-text{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
            + '.report-memo-overview-copy{min-width:23px;height:14px;border:1px solid #cbd5e1;border-radius:3px;background:#fff;color:#334155;padding:0 3px;font-size:5.2px;font-weight:900;line-height:1;cursor:pointer;}'
            + '.report-memo-overview-copy[data-report-memo-copy-state="copied"]{border-color:#94a3b8;color:#111827;}'
            + '.report-memo-overview-copy[data-report-memo-copy-state="failed"]{border-color:#fecaca;color:#b91c1c;}'
            + '.report-auto-memo-change{font-weight:900;}'
            + '.report-auto-memo-change.is-up{color:#c00000;}'
            + '.report-auto-memo-change.is-down{color:#2f75b5;}'
            + '.report-auto-memo-change.is-flat{color:#111827;}'
            + '.report-memo-overview-empty{min-height:120px;display:grid;place-items:center;border:1px dashed #cbd5e1;border-radius:6px;background:#fff;color:#64748b;font-size:12px;font-weight:900;text-align:center;}'
            + '</style>'
            + '</head>'
            + '<body>'
            + '<header class="report-memo-overview-popup-head"><strong>특이사항 전체 확인</strong><button type="button" data-report-memo-overview-popup-close aria-label="닫기">닫기</button></header>'
            + `<main class="report-memo-overview-body" data-report-memo-overview-list>${contentHtml}</main>`
            + '<script>(()=>{const copyFallback=(text)=>{const area=document.createElement("textarea");area.value=text;area.setAttribute("readonly","");area.style.position="fixed";area.style.left="-9999px";document.body.appendChild(area);area.focus();area.select();let ok=false;try{ok=document.execCommand("copy")===true;}finally{area.remove();}return ok;};const mark=(button,ok)=>{button.textContent=ok?"복사됨":"실패";button.dataset.reportMemoCopyState=ok?"copied":"failed";setTimeout(()=>{button.textContent="복사";delete button.dataset.reportMemoCopyState;},ok?900:1400);};document.querySelector("[data-report-memo-overview-popup-close]")?.addEventListener("click",()=>self.close());document.addEventListener("click",async(event)=>{const button=event.target?.closest?.("[data-report-memo-overview-copy]");if(!button)return;event.preventDefault();const text=String(button.dataset.reportMemoCopyText||"").trim();if(!text){mark(button,false);return;}let ok=false;try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);ok=true;}else{ok=copyFallback(text);}}catch(error){try{ok=copyFallback(text);}catch(fallbackError){ok=false;}}mark(button,ok);});})();</script>'
            + '</body>'
            + '</html>';
    }

    function writeReportDeckMemoOverviewPopup(popup, contentHtml = '') {
        const doc = popup?.document;
        if (!doc?.open || !doc?.write || !doc?.close) return false;
        doc.open();
        doc.write(buildReportDeckMemoOverviewPopupHtml(contentHtml));
        doc.close();
        popup.focus?.();
        return true;
    }

    function openReportDeckMemoOverviewPopup(root, meta = {}) {
        const ownerWindow = getReportDeckMemoOverviewWindow(root);
        if (!ownerWindow?.open) return null;
        let popup = meta.memoOverviewPopup;
        if (!popup || popup.closed) {
            popup = ownerWindow.open(
                '',
                REPORT_DECK_MEMO_OVERVIEW_POPUP_NAME,
                REPORT_DECK_MEMO_OVERVIEW_POPUP_FEATURES
            );
            if (!popup || popup.closed) return null;
            meta.memoOverviewPopup = popup;
        }
        return popup;
    }

    function waitReportDeckUiFrame() {
        return new Promise(resolve => {
            const schedule = typeof requestAnimationFrame === 'function'
                ? requestAnimationFrame
                : callback => setTimeout(callback, 0);
            schedule(() => resolve());
        });
    }

    function getReportDeckMemoCandidateCache(meta = {}) {
        if (!(meta.memoCandidateCache instanceof Map)) {
            meta.memoCandidateCache = new Map();
        }
        return meta.memoCandidateCache;
    }

    function getReportDeckMemoOverviewCache(meta = {}) {
        if (!(meta.memoOverviewCache instanceof Map)) {
            meta.memoOverviewCache = new Map();
        }
        return meta.memoOverviewCache;
    }

    function buildReportDeckMemoCandidateCacheKey(monthKey = '', teamKey = '', metricKey = '', memoKey = '') {
        return [
            parts.normalizeReportDeckMonth(monthKey),
            parts.normalizeReportDeckMemoTeamKey(teamKey),
            parts.normalizeReportDeckMemoMetricKey(metricKey),
            String(memoKey || '').trim()
        ].join('|');
    }

    function clearReportDeckMemoCaches(meta = {}) {
        if (!meta) return;
        meta.memoCandidateCache = new Map();
        meta.memoOverviewCache = new Map();
    }

    function closeReportDeckMemoOverviewDialog(root) {
        const dialog = getReportDeckMemoOverviewDialog(root);
        if (!dialog) return;
        stopReportDeckMemoOverviewDrag(dialog);
        dialog.hidden = true;
        delete dialog.dataset.reportMemoOverviewSequence;
    }

    function setReportDeckMemoOverviewMessage(dialog, message) {
        const list = dialog?.querySelector?.('[data-report-memo-overview-list]');
        if (!list) return;
        list.innerHTML = `<div class="report-memo-overview-empty">${parts.escapeReportDeckHtml(message)}</div>`;
    }

    function renderReportDeckMemoOverviewDialog(dialog, groups = []) {
        const list = dialog?.querySelector?.('[data-report-memo-overview-list]');
        if (!list) return;
        const normalizedGroups = (Array.isArray(groups) ? groups : [])
            .map(group => ({
                ...group,
                candidates: Array.isArray(group?.candidates) ? group.candidates : []
            }))
            .filter(group => group.candidates.length);
        if (!normalizedGroups.length) {
            setReportDeckMemoOverviewMessage(dialog, '해당 월에 확인 가능한 특이사항 항목이 없습니다.');
            return;
        }
        list.innerHTML = normalizedGroups.map(group => (
            `<section class="report-memo-overview-group" data-report-memo-overview-group="${parts.escapeReportDeckHtml(group.key || '')}">`
                + `<h3 class="report-memo-overview-group-title">${parts.escapeReportDeckHtml(group.label || '')}</h3>`
                + '<div class="report-memo-overview-rows">'
                + group.candidates.map(candidate => {
                    const direction = String(candidate?.direction || 'flat').trim() || 'flat';
                    const metricLabel = String(candidate?.metricLabel || '').trim();
                    const memoText = String(candidate?.text || '').trim();
                    return `<div class="report-memo-overview-row is-${parts.escapeReportDeckHtml(direction)}">`
                        + `<span class="report-memo-overview-row-label" title="${parts.escapeReportDeckHtml(metricLabel)}">${parts.escapeReportDeckHtml(metricLabel)}</span>`
                        + `<span class="report-memo-overview-row-text" title="${parts.escapeReportDeckHtml(memoText)}">${parts.renderReportDeckMemoLineHtml(memoText)}</span>`
                        + `<button type="button" class="report-memo-overview-copy" data-report-memo-overview-copy data-report-memo-copy-text="${parts.escapeReportDeckHtml(memoText)}" aria-label="특이사항 문장 복사" title="특이사항 문장 복사">복사</button>`
                    + '</div>';
                }).join('')
                + '</div>'
            + '</section>'
        )).join('');
    }

    async function openReportDeckMemoOverviewDialog(root, meta) {
        const dialog = getReportDeckMemoOverviewDialog(root);
        if (!dialog) return false;
        dialog.hidden = false;
        syncReportDeckMemoOverviewFloatingPosition(dialog);
        dialog.dataset.reportMemoOverviewSequence = String((Number(dialog.dataset.reportMemoOverviewSequence || '0') || 0) + 1);
        const sequence = dialog.dataset.reportMemoOverviewSequence;
        setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러오는 중입니다.');
        if (!meta?.selectedMonth || typeof browser?.buildReportDeckMemoOverview !== 'function') {
            setReportDeckMemoOverviewMessage(dialog, '보고서 월 데이터가 준비되지 않았습니다.');
            return true;
        }
        const cacheKey = parts.normalizeReportDeckMonth(meta.selectedMonth);
        const overviewCache = getReportDeckMemoOverviewCache(meta);
        if (cacheKey && overviewCache.has(cacheKey)) {
            renderReportDeckMemoOverviewDialog(dialog, overviewCache.get(cacheKey)?.groups || []);
            return true;
        }
        await waitReportDeckUiFrame();
        if (dialog.dataset.reportMemoOverviewSequence !== sequence) return true;
        try {
            const result = await browser.buildReportDeckMemoOverview(meta.selectedMonth, {
                store: meta.sharedStore
            });
            if (dialog.dataset.reportMemoOverviewSequence !== sequence) return true;
            if (result?.ok !== true) {
                setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러올 수 없습니다.');
                return true;
            }
            if (cacheKey) {
                overviewCache.set(cacheKey, {
                    groups: Array.isArray(result.groups) ? result.groups : []
                });
            }
            renderReportDeckMemoOverviewDialog(dialog, result.groups || []);
        } catch (error) {
            void error;
            if (dialog.dataset.reportMemoOverviewSequence === sequence) {
                setReportDeckMemoOverviewMessage(dialog, '특이사항 항목을 불러오지 못했습니다.');
            }
        }
        return true;
    }

    function buildReportDeckMemoOverviewDialogHtml(groups = []) {
        const list = { innerHTML: '' };
        renderReportDeckMemoOverviewDialog({
            querySelector(selector) {
                return selector === '[data-report-memo-overview-list]' ? list : null;
            }
        }, groups);
        return list.innerHTML;
    }

    function buildReportDeckMemoOverviewPopupMessageHtml(message) {
        return `<div class="report-memo-overview-empty">${parts.escapeReportDeckHtml(message)}</div>`;
    }

    async function openReportDeckMemoOverviewPopupOrDialog(root, meta) {
        meta = meta || {};
        const popup = openReportDeckMemoOverviewPopup(root, meta);
        if (!popup) {
            return openReportDeckMemoOverviewDialog(root, meta);
        }
        closeReportDeckMemoOverviewDialog(root);
        meta.memoOverviewPopupSequence = (Number(meta.memoOverviewPopupSequence || 0) || 0) + 1;
        const sequence = meta.memoOverviewPopupSequence;
        if (!writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewPopupMessageHtml('특이사항 항목을 불러오는 중입니다.'))) {
            return openReportDeckMemoOverviewDialog(root, meta);
        }
        if (!meta?.selectedMonth || typeof browser?.buildReportDeckMemoOverview !== 'function') {
            writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewPopupMessageHtml('보고서용 데이터가 준비되지 않았습니다.'));
            return true;
        }
        const cacheKey = parts.normalizeReportDeckMonth(meta.selectedMonth);
        const overviewCache = getReportDeckMemoOverviewCache(meta);
        if (cacheKey && overviewCache.has(cacheKey)) {
            writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewDialogHtml(overviewCache.get(cacheKey)?.groups || []));
            return true;
        }
        await waitReportDeckUiFrame();
        if (meta.memoOverviewPopupSequence !== sequence || popup.closed === true) return true;
        try {
            const result = await browser.buildReportDeckMemoOverview(meta.selectedMonth, {
                store: meta.sharedStore
            });
            if (meta.memoOverviewPopupSequence !== sequence || popup.closed === true) return true;
            if (result?.ok !== true) {
                writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewPopupMessageHtml('특이사항 항목을 불러오지 못했습니다.'));
                return true;
            }
            if (cacheKey) {
                overviewCache.set(cacheKey, {
                    groups: Array.isArray(result.groups) ? result.groups : []
                });
            }
            writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewDialogHtml(result.groups || []));
        } catch (error) {
            void error;
            if (meta.memoOverviewPopupSequence === sequence && popup.closed !== true) {
                writeReportDeckMemoOverviewPopup(popup, buildReportDeckMemoOverviewPopupMessageHtml('특이사항 항목을 불러오지 못했습니다.'));
            }
        }
        return true;
    }
    Object.assign(parts, {
        REPORT_DECK_MEMO_DIALOG_MARGIN,
        REPORT_DECK_MEMO_OVERVIEW_MARGIN,
        REPORT_DECK_MEMO_OVERVIEW_POPUP_FEATURES,
        REPORT_DECK_MEMO_OVERVIEW_POPUP_NAME,
        buildReportDeckMemoCandidateCacheKey,
        buildReportDeckMemoOverviewDialogHtml,
        buildReportDeckMemoOverviewPopupHtml,
        buildReportDeckMemoOverviewPopupMessageHtml,
        clampReportDeckMemoDialogPosition,
        clampReportDeckMemoOverviewPosition,
        clearReportDeckMemoCaches,
        closeReportDeckMemoDialog,
        closeReportDeckMemoOverviewDialog,
        copyReportDeckMemoOverviewText,
        copyReportDeckTextToClipboard,
        getReportDeckMemoCandidateCache,
        getReportDeckMemoDialogRect,
        getReportDeckMemoDialogViewport,
        getReportDeckMemoDialogWindow,
        getReportDeckMemoOverviewCache,
        getReportDeckMemoOverviewDialog,
        getReportDeckMemoOverviewRect,
        getReportDeckMemoOverviewViewport,
        getReportDeckMemoOverviewWindow,
        markReportDeckMemoCopyButton,
        openReportDeckMemoOverviewDialog,
        openReportDeckMemoOverviewPopup,
        openReportDeckMemoOverviewPopupOrDialog,
        renderReportDeckMemoOverviewDialog,
        setReportDeckMemoDialogPosition,
        setReportDeckMemoOverviewMessage,
        setReportDeckMemoOverviewPosition,
        startReportDeckMemoDialogDrag,
        startReportDeckMemoOverviewDrag,
        stopReportDeckMemoDialogDrag,
        stopReportDeckMemoOverviewDrag,
        syncReportDeckMemoDialogFloatingPosition,
        syncReportDeckMemoOverviewFloatingPosition,
        waitReportDeckUiFrame,
        writeReportDeckMemoOverviewPopup,
    });
})(this);
