(function registerKpiReportDeckRuntimeChrome(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function getReportDeckRecordMeta(record) {
        const version = Number.parseInt(String(record?.version ?? ''), 10);
        return {
            version: Number.isInteger(version) && version >= 0 ? version : null,
            updatedAt: record?.updatedAt || record?.updated_at || ''
        };
    }

    function setReportDeckStatus(root, statusKey, text) {
        const status = root?.querySelector?.('[data-report-save-status]');
        if (status) {
            status.dataset.state = String(statusKey || 'idle');
            status.textContent = text || '';
            status.hidden = !text;
        }
    }

    function showReportDeckSavedPopup(root, message = parts.REPORT_DECK_SAVED_MESSAGE) {
        const popupMessage = String(message || '').trim();
        if (!popupMessage) return false;
        const scope = root?.ownerDocument?.defaultView
            || (typeof window !== 'undefined' ? window : null);
        if (typeof scope?.alert !== 'function') return false;
        scope.alert(popupMessage);
        return true;
    }

    function setReportDeckCaptureBusy(root, isBusy) {
        if (!root) return;
        if (isBusy) {
            root.dataset.reportCaptureBusy = 'true';
        } else {
            delete root.dataset.reportCaptureBusy;
        }
        Array.from(root.querySelectorAll?.('[data-report-capture-zip], [data-report-capture-pdf], [data-report-export-html]') || []).forEach(button => {
            button.disabled = Boolean(isBusy);
            button.setAttribute?.('aria-busy', isBusy ? 'true' : 'false');
        });
    }

    function getReportDeckSaveMenuElements(root) {
        return {
            menu: root?.querySelector?.('[data-report-save-menu]') || null,
            toggle: root?.querySelector?.('[data-report-save-menu-toggle]') || null,
            panel: root?.querySelector?.('[data-report-save-menu-panel]') || null
        };
    }

    function setReportDeckSaveMenuOpen(root, isOpen) {
        const open = isOpen === true;
        const elements = getReportDeckSaveMenuElements(root);
        if (elements.panel) {
            elements.panel.hidden = !open;
        }
        if (elements.menu?.dataset) {
            if (open) {
                elements.menu.dataset.reportSaveMenuOpen = 'true';
            } else {
                delete elements.menu.dataset.reportSaveMenuOpen;
            }
        }
        if (elements.toggle) {
            elements.toggle.classList?.toggle?.('is-active', open);
            elements.toggle.setAttribute?.('aria-expanded', open ? 'true' : 'false');
        }
    }

    function isReportDeckSaveMenuOpen(root) {
        const panel = getReportDeckSaveMenuElements(root).panel;
        return Boolean(panel && panel.hidden === false);
    }

    function toggleReportDeckSaveMenu(root, state = {}) {
        syncReportDeckCaptureControls(root, state);
        setReportDeckSaveMenuOpen(root, !isReportDeckSaveMenuOpen(root));
    }

    function closeReportDeckSaveMenu(root) {
        setReportDeckSaveMenuOpen(root, false);
    }

    function getReportDeckCaptureControls(root) {
        return {
            start: root?.querySelector?.('[data-report-capture-range-start]') || null,
            end: root?.querySelector?.('[data-report-capture-range-end]') || null,
            currentOnly: root?.querySelector?.('[data-report-capture-current-only]') || null
        };
    }

    function normalizeReportDeckCapturePage(value, fallback, total) {
        const max = Math.max(1, Number.parseInt(String(total ?? '1'), 10) || 1);
        const parsed = Number.parseInt(String(value ?? ''), 10);
        const page = Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
        return Math.max(1, Math.min(max, Number.parseInt(String(page ?? '1'), 10) || 1));
    }

    function getReportDeckActiveCapturePage(root, total) {
        const current = Number.parseInt(String(root?.dataset?.reportActiveSlide || '0'), 10) || 0;
        return normalizeReportDeckCapturePage(current + 1, 1, total);
    }

    function setReportDeckCaptureRangeInputs(root, startPage, endPage, total) {
        const controls = getReportDeckCaptureControls(root);
        const start = normalizeReportDeckCapturePage(startPage, 1, total);
        const end = normalizeReportDeckCapturePage(endPage, start, total);
        const from = Math.min(start, end);
        const to = Math.max(start, end);
        if (controls.start) {
            controls.start.min = '1';
            controls.start.max = String(Math.max(1, total));
            controls.start.inputMode = 'numeric';
            controls.start.pattern = '[0-9]*';
            controls.start.value = String(from);
        }
        if (controls.end) {
            controls.end.min = '1';
            controls.end.max = String(Math.max(1, total));
            controls.end.inputMode = 'numeric';
            controls.end.pattern = '[0-9]*';
            controls.end.value = String(to);
        }
    }

    function getReportDeckCapturePageTotal(root, state = {}) {
        const slides = parts.getReportDeckOutputSlides(root, state);
        return Math.max(0, slides.length);
    }

    function syncReportDeckCaptureControls(root, state = {}, options = {}) {
        const controls = getReportDeckCaptureControls(root);
        if (!controls.start || !controls.end) return;
        const total = getReportDeckCapturePageTotal(root, state);
        const activeView = parts.getReportDeckActiveView(root);
        const contextKey = `${activeView}|${total}`;
        const shouldReset = options.force === true
            || !root.dataset.reportCaptureRangeContext
            || root.dataset.reportCaptureRangeContext !== contextKey
            || !String(controls.start.value || '').trim()
            || !String(controls.end.value || '').trim();
        root.dataset.reportCaptureRangeContext = contextKey;
        root.dataset.reportCapturePageTotal = String(total);
        controls.start.disabled = total <= 0 || controls.currentOnly?.checked === true;
        controls.end.disabled = total <= 0 || controls.currentOnly?.checked === true;
        if (total <= 0) {
            setReportDeckCaptureRangeInputs(root, 1, 1, 1);
            if (controls.currentOnly) controls.currentOnly.disabled = true;
            return;
        }
        if (controls.currentOnly) controls.currentOnly.disabled = false;
        if (controls.currentOnly?.checked === true) {
            const currentPage = getReportDeckActiveCapturePage(root, total);
            setReportDeckCaptureRangeInputs(root, currentPage, currentPage, total);
            return;
        }
        if (shouldReset) {
            setReportDeckCaptureRangeInputs(root, 1, total, total);
            return;
        }
        const start = normalizeReportDeckCapturePage(controls.start.value, 1, total);
        const end = normalizeReportDeckCapturePage(controls.end.value, total, total);
        setReportDeckCaptureRangeInputs(root, start, end, total);
    }

    function handleReportDeckCaptureControlInput(root, state = {}, target, eventType = '') {
        const controls = getReportDeckCaptureControls(root);
        if (!controls.start || !controls.end) return false;
        const isCurrentOnly = target === controls.currentOnly || target?.closest?.('[data-report-capture-current-only]') === controls.currentOnly;
        const isRangeInput = target === controls.start || target === controls.end;
        if (!isCurrentOnly && !isRangeInput) return false;
        const total = Math.max(1, getReportDeckCapturePageTotal(root, state));
        if (isCurrentOnly) {
            if (controls.currentOnly?.checked === true) {
                const currentPage = getReportDeckActiveCapturePage(root, total);
                setReportDeckCaptureRangeInputs(root, currentPage, currentPage, total);
            } else {
                setReportDeckCaptureRangeInputs(root, 1, total, total);
            }
            syncReportDeckCaptureControls(root, state);
            return true;
        }
        if (controls.currentOnly) controls.currentOnly.checked = false;
        sanitizeReportDeckCaptureRangeInput(target);
        if (eventType === 'change') {
            const start = normalizeReportDeckCapturePage(controls.start.value, 1, total);
            const end = normalizeReportDeckCapturePage(controls.end.value, total, total);
            setReportDeckCaptureRangeInputs(root, start, end, total);
        } else {
            controls.start.disabled = false;
            controls.end.disabled = false;
        }
        return true;
    }

    function resolveReportDeckCaptureRange(root, state = {}) {
        const total = getReportDeckCapturePageTotal(root, state);
        if (total <= 0) return null;
        const controls = getReportDeckCaptureControls(root);
        if (controls.currentOnly?.checked === true) {
            const currentPage = getReportDeckActiveCapturePage(root, total);
            return { start: currentPage, end: currentPage, total, mode: 'current' };
        }
        const start = normalizeReportDeckCapturePage(controls.start?.value, 1, total);
        const end = normalizeReportDeckCapturePage(controls.end?.value, total, total);
        return {
            start: Math.min(start, end),
            end: Math.max(start, end),
            total,
            mode: 'range'
        };
    }

    function sanitizeReportDeckCaptureRangeInput(input) {
        if (!input) return;
        const digits = String(input.value || '').replace(/\D+/g, '');
        if (String(input.value || '') !== digits) {
            input.value = digits;
        }
    }

    function handleReportDeckCaptureRangeKeydown(event) {
        const target = event.target?.closest?.('[data-report-capture-range-start], [data-report-capture-range-end]');
        if (!target) return false;
        if (event.ctrlKey || event.metaKey || event.altKey) return false;
        const allowedKeys = new Set(['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
        if (allowedKeys.has(event.key)) return false;
        if (/^\d$/.test(String(event.key || ''))) return false;
        event.preventDefault();
        return true;
    }

    function syncReportDeckMonthSelect(root, meta = {}) {
        const select = root?.querySelector?.('[data-report-month-select]');
        if (!select) return;
        const selectedMonth = parts.normalizeReportDeckMonth(meta.selectedMonth);
        const months = Array.isArray(meta.months)
            ? meta.months.map(parts.normalizeReportDeckMonth).filter(Boolean)
            : [];
        meta.months = months;
        meta.selectedMonth = months.includes(selectedMonth) ? selectedMonth : months[0] || '';
        meta.recordKey = parts.buildReportDeckMonthRecordKey(meta.selectedMonth);
        select.innerHTML = months.length > 0
            ? months.map(month => `<option value="${month}">${parts.formatReportDeckMonthLabel(month)}</option>`).join('')
            : `<option value="">${meta.monthPlaceholder || '선택 가능 월 없음'}</option>`;
        select.disabled = months.length === 0;
        select.value = meta.selectedMonth || '';
        root.dataset.reportMonth = meta.selectedMonth || '';
        root.dataset.reportRecordKey = meta.recordKey || '';
    }

    function syncReportDeckJson(root, state, meta = {}) {
        const json = root?.querySelector?.('[data-report-json]');
        if (!json) return;
        const config = parts.getReportDeckRuntimeConfig();
        parts.applyReportDeckDerivedFields(state, meta);
        json.textContent = JSON.stringify({
            table: 'app_module_records',
            moduleKey: config.moduleKey || parts.REPORT_DECK_FALLBACK_CONFIG.moduleKey,
            recordKey: meta.recordKey || config.recordKey || parts.REPORT_DECK_FALLBACK_CONFIG.recordKey,
            month: meta.selectedMonth || '',
            permissionKey: config.permissionKey || parts.REPORT_DECK_FALLBACK_CONFIG.permissionKey,
            version: meta.version ?? null,
            updatedAt: meta.updatedAt || '',
            payload: parts.normalizeReportDeckState(state)
        }, null, 2);
    }

    function syncReportDeckFieldRefs(root, state, targetKey = '') {
        const normalizedTargetKey = String(targetKey || '').trim();
        Array.from(root?.querySelectorAll?.('[data-report-field-ref]') || []).forEach(field => {
            const key = String(field.dataset.reportFieldRef || '').trim();
            if (!key) return;
            if (normalizedTargetKey && key !== normalizedTargetKey) return;
            field.textContent = state[key] || '';
        });
    }

    function syncReportDeckFields(root, state, meta = {}) {
        parts.applyReportDeckDerivedFields(state, meta);
        Array.from(root?.querySelectorAll?.('[data-report-field]') || []).forEach(field => {
            const key = String(field.dataset.reportField || '').trim();
            if (!key) return;
            field.textContent = state[key] || '';
        });
        syncReportDeckFieldRefs(root, state);
        const nextMonth = parts.getReportDeckMonthNumber(meta.selectedMonth, 1);
        Array.from(root?.querySelectorAll?.('[data-report-next-month-label]') || []).forEach(field => {
            field.textContent = Number.isInteger(nextMonth) ? `${nextMonth}월` : '';
        });
        Array.from(root?.querySelectorAll?.('[data-report-date-input]') || []).forEach(input => {
            input.value = parts.toReportDeckDateInputValue(state.reportDate);
        });
    }

    function escapeReportDeckHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getReportDeckWindow(root) {
        return root?.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
    }
    Object.assign(parts, {
        closeReportDeckSaveMenu,
        escapeReportDeckHtml,
        getReportDeckActiveCapturePage,
        getReportDeckCaptureControls,
        getReportDeckCapturePageTotal,
        getReportDeckRecordMeta,
        getReportDeckSaveMenuElements,
        getReportDeckWindow,
        handleReportDeckCaptureControlInput,
        handleReportDeckCaptureRangeKeydown,
        isReportDeckSaveMenuOpen,
        normalizeReportDeckCapturePage,
        resolveReportDeckCaptureRange,
        sanitizeReportDeckCaptureRangeInput,
        setReportDeckCaptureBusy,
        setReportDeckCaptureRangeInputs,
        setReportDeckSaveMenuOpen,
        setReportDeckStatus,
        showReportDeckSavedPopup,
        syncReportDeckCaptureControls,
        syncReportDeckFieldRefs,
        syncReportDeckFields,
        syncReportDeckJson,
        syncReportDeckMonthSelect,
        toggleReportDeckSaveMenu,
    });
})(this);
