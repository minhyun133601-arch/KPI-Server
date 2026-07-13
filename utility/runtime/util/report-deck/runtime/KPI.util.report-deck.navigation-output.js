(function registerKpiReportDeckRuntimeNavigationOutput(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function setReportDeckEditMode(root, enabled) {
        const isEditing = enabled === true;
        root.dataset.reportEditMode = isEditing ? 'editing' : 'view';
        Array.from(root?.querySelectorAll?.('[data-report-field]') || []).forEach(field => {
            const key = String(field.dataset.reportField || '');
            const editable = isEditing
                && !parts.isReportDeckLockedFieldKey(key)
                && !parts.isReportDeckSlide8OverviewKey(key)
                && !parts.isReportDeckSlide9OverviewKey(key)
                && !parts.isReportDeckSlide10OverviewKey(key);
            field.setAttribute?.('contenteditable', editable ? 'true' : 'false');
            field.contentEditable = editable ? 'true' : 'false';
            if (!editable) {
                field.blur?.();
            }
        });
        Array.from(root?.querySelectorAll?.('[data-report-plan-summary]') || []).forEach(field => {
            const editable = false;
            field.setAttribute?.('contenteditable', editable ? 'true' : 'false');
            field.contentEditable = editable ? 'true' : 'false';
            if (!editable) {
                field.blur?.();
            }
        });
        if (!isEditing) {
            parts.closeReportDeckOverviewDialog(root);
            parts.closeReportDeckMemoDialog(root);
        }
        Array.from(root?.querySelectorAll?.('[data-report-memo-key]') || []).forEach(box => {
            box.setAttribute?.('aria-disabled', isEditing ? 'false' : 'true');
            box.setAttribute?.('tabindex', isEditing ? '0' : '-1');
        });
        Array.from(root?.querySelectorAll?.('[data-report-date-input]') || []).forEach(input => {
            input.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-plan-add-slot]') || []).forEach(input => {
            input.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-safety-team-select]') || []).forEach(input => {
            input.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-safety-add-toggle]') || []).forEach(button => {
            button.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-safety-team-option]') || []).forEach(button => {
            button.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-safety-table-move]') || []).forEach(button => {
            button.disabled = !isEditing;
        });
        Array.from(root?.querySelectorAll?.('[data-report-add-page]') || []).forEach(button => {
            button.disabled = String(button.dataset.reportAddPage || '').trim() === 'slide10' || !isEditing;
        });
        if (!isEditing) {
            parts.closeReportDeckSafetyTeamPickers(root);
            Array.from(root?.querySelectorAll?.('[data-report-undo-delete]') || []).forEach(button => {
                button.disabled = true;
            });
        }
        parts.closeReportDeckSaveMenu(root);
        parts.syncReportDeckPlanImageModeHints(root);
        if (!isEditing) {
            parts.setReportDeckActivePlanImageFrame(root, null);
        }
        Array.from(root?.querySelectorAll?.('[data-report-edit-toggle]') || []).forEach(button => {
            button.classList?.toggle?.('is-active', isEditing);
            button.setAttribute?.('aria-pressed', isEditing ? 'true' : 'false');
            button.textContent = isEditing ? '완료' : '수정';
        });
        syncReportDeckFullscreenControls(root);
    }

    function isReportDeckSaveShortcut(event) {
        const key = String(event?.key || '').toLowerCase();
        const code = String(event?.code || '');
        return (key === 's' || code === 'KeyS')
            && (event?.ctrlKey || event?.metaKey)
            && !event?.altKey
            && !event?.shiftKey;
    }

    function getReportDeckSlideView(slide) {
        return String(slide?.dataset?.reportSlideView || '').trim();
    }

    function hasReportDeckViewMetadata(root) {
        return Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .some(slide => !!getReportDeckSlideView(slide));
    }

    function normalizeReportDeckView(root, view) {
        const candidate = String(view || '').trim() || parts.REPORT_DECK_DEFAULT_VIEW;
        if (!hasReportDeckViewMetadata(root)) return candidate;
        const hasCandidate = Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .some(slide => slide.hidden !== true && getReportDeckSlideView(slide) === candidate);
        return hasCandidate ? candidate : parts.REPORT_DECK_DEFAULT_VIEW;
    }

    function getReportDeckActiveView(root) {
        return normalizeReportDeckView(root, root?.dataset?.reportActiveView);
    }

    function isReportDeckSlideInView(root, slide, view = getReportDeckActiveView(root)) {
        if (!hasReportDeckViewMetadata(root)) return true;
        return getReportDeckSlideView(slide) === view;
    }

    function getReportDeckVisibleSlides(root, view = getReportDeckActiveView(root)) {
        return Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
            .filter(slide => slide.hidden !== true && String(slide.dataset.reportSlidePage || '') !== '-1')
            .filter(slide => (
                root?.dataset?.reportFullscreenOutputMode !== 'true'
                || String(slide?.dataset?.reportPrintVisible || '') === 'true'
            ))
            .filter(slide => isReportDeckSlideInView(root, slide, view));
    }

    function getReportDeckSlideCount(root) {
        return getReportDeckVisibleSlides(root).length;
    }

    function getReportDeckSlideLabel(slide, visibleIndex, button = null) {
        const label = String(slide?.dataset?.reportSlideLabel || '').trim();
        if (label) return label;
        const titleField = slide?.querySelector?.('[data-report-field$="Title"]');
        const titleLabel = String(titleField?.textContent || '').trim();
        if (titleLabel) return titleLabel;
        const navLabel = String(button?.dataset?.reportNavLabel || '').trim();
        if (navLabel) return navLabel;
        return `${visibleIndex + 1}`;
    }

    function formatReportDeckPageRange(startPage, endPage) {
        if (!Number.isInteger(startPage) || !Number.isInteger(endPage)) return '';
        return startPage === endPage ? String(startPage) : `${startPage}-${endPage}`;
    }

    function syncReportDeckContentsPageRanges(root, visibleSlides = []) {
        const ranges = new Map();
        visibleSlides.forEach((slide, index) => {
            const view = getReportDeckSlideView(slide);
            if (!view || view === parts.REPORT_DECK_DEFAULT_VIEW) return;
            const page = index + 1;
            const range = ranges.get(view) || { start: page, end: page };
            range.end = page;
            ranges.set(view, range);
        });

        Array.from(root?.querySelectorAll?.('[data-report-contents-page-range]') || []).forEach(element => {
            const view = String(element?.dataset?.reportContentsPageRange || '').trim();
            const range = ranges.get(view);
            const label = range ? formatReportDeckPageRange(range.start, range.end) : '';
            element.textContent = label;
        });
    }

    function syncReportDeckReturnControls(root, activeView) {
        Array.from(root?.querySelectorAll?.('[data-report-return-hq]') || []).forEach(button => {
            button.hidden = !activeView || activeView === parts.REPORT_DECK_DEFAULT_VIEW;
        });
    }

    function ensureReportDeckSlideNavCapacity(root, targetCount = 0) {
        const nav = root?.querySelector?.('.report-slide-nav');
        if (!nav?.querySelectorAll || !nav?.appendChild) return;
        const buttons = Array.from(nav.querySelectorAll('[data-report-slide-target]') || []);
        const template = buttons[buttons.length - 1] || null;
        if (!template?.cloneNode) return;
        while (buttons.length < targetCount) {
            const clone = template.cloneNode(true);
            clone.hidden = true;
            clone.dataset.reportSlideTarget = '-1';
            const number = clone.querySelector?.('span');
            const label = clone.querySelector?.('strong');
            if (number) number.textContent = String(buttons.length + 1).padStart(2, '0');
            if (label) label.textContent = '';
            nav.appendChild(clone);
            buttons.push(clone);
        }
    }

    function syncReportDeckDynamicSlides(root) {
        const slides = Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []);
        const usePreparedOutputSlides = root?.dataset?.reportFullscreenOutputMode === 'true';
        const visibleSlides = slides.filter(slide => (
            slide.hidden !== true
            && (!usePreparedOutputSlides || String(slide?.dataset?.reportPrintVisible || '') === 'true')
        ));
        const visibleSlideSet = new Set(visibleSlides);
        syncReportDeckOutputOptionalContents(
            root,
            parts.getReportDeckOptionalContentVisibility(root?.__reportDeckState || {})
        );
        visibleSlides.forEach((slide, index) => {
            slide.dataset.reportSlidePage = String(index);
        });
        slides.filter(slide => slide.hidden === true || !visibleSlideSet.has(slide)).forEach(slide => {
            slide.dataset.reportSlidePage = '-1';
            slide.dataset.reportSlideViewPage = '-1';
            slide.classList?.toggle?.('is-active', false);
            slide.setAttribute?.('aria-hidden', 'true');
        });
        syncReportDeckContentsPageRanges(root, visibleSlides);

        const hasViewMetadata = hasReportDeckViewMetadata(root);
        if (hasViewMetadata) {
            Array.from(new Set(visibleSlides.map(getReportDeckSlideView).filter(Boolean))).forEach(view => {
                const viewSlides = visibleSlides.filter(slide => getReportDeckSlideView(slide) === view);
                viewSlides.forEach((slide, index) => {
                    slide.dataset.reportSlideViewPage = String(index);
                    const pageNumber = slide.querySelector?.('[data-report-page-number]');
                    if (pageNumber) {
                        pageNumber.textContent = `${index + 1}/${viewSlides.length}`;
                    }
                });
            });
        } else {
            visibleSlides.forEach((slide, index) => {
                slide.dataset.reportSlideViewPage = String(index);
                const pageNumber = slide.querySelector?.('[data-report-page-number]');
                if (pageNumber) {
                    pageNumber.textContent = `${index + 1}/${visibleSlides.length}`;
                }
            });
        }

        const activeView = getReportDeckActiveView(root);
        ensureReportDeckSlideNavCapacity(root, getReportDeckVisibleSlides(root, activeView).length);
        const buttons = Array.from(root?.querySelectorAll?.('[data-report-slide-target]') || []);
        root.dataset.reportActiveView = activeView;
        syncReportDeckReturnControls(root, activeView);
        const activeSlides = getReportDeckVisibleSlides(root, activeView);
        buttons.forEach((button, index) => {
            const slide = activeSlides[index] || null;
            button.hidden = !slide;
            button.dataset.reportSlideTarget = slide ? String(index) : '-1';
            button.dataset.reportSlideView = activeView;
            if (!slide) {
                button.classList?.toggle?.('is-active', false);
                button.setAttribute?.('aria-current', 'false');
                return;
            }
            const number = button.querySelector?.('span');
            const label = button.querySelector?.('strong');
            if (number) number.textContent = String(index + 1).padStart(2, '0');
            if (label) label.textContent = getReportDeckSlideLabel(slide, index, button);
        });

        const current = Number.parseInt(String(root?.dataset?.reportActiveSlide || '0'), 10) || 0;
        setReportDeckSlide(root, Math.min(current, Math.max(0, activeSlides.length - 1)));
    }

    function setReportDeckSlide(root, slideIndex) {
        const slideCount = getReportDeckSlideCount(root);
        if (!slideCount) return;
        const nextIndex = Math.max(0, Math.min(slideCount - 1, Number.parseInt(String(slideIndex), 10) || 0));
        const activeView = getReportDeckActiveView(root);
        const activeSlides = getReportDeckVisibleSlides(root, activeView);
        const activeSlide = activeSlides[nextIndex] || null;
        root.dataset.reportActiveView = activeView;
        root.dataset.reportActiveSlide = String(nextIndex);

        Array.from(root.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            const active = slide === activeSlide;
            slide.classList?.toggle?.('is-active', active);
            slide.setAttribute?.('aria-hidden', active ? 'false' : 'true');
        });

        Array.from(root.querySelectorAll?.('[data-report-slide-target]') || []).forEach(button => {
            const buttonView = String(button.dataset.reportSlideView || activeView).trim() || activeView;
            const active = button.hidden !== true
                && buttonView === activeView
                && Number.parseInt(String(button.dataset.reportSlideTarget || '0'), 10) === nextIndex;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-current', active ? 'page' : 'false');
        });

        const counter = root.querySelector?.('[data-report-slide-counter]');
        if (counter) {
            counter.textContent = `${nextIndex + 1} / ${slideCount}`;
        }
        parts.syncReportDeckCaptureControls(root, root.__reportDeckState || {});
    }

    function setReportDeckView(root, view, slideIndex = 0) {
        root.dataset.reportActiveView = normalizeReportDeckView(root, view);
        root.dataset.reportActiveSlide = String(Number.parseInt(String(slideIndex), 10) || 0);
        syncReportDeckDynamicSlides(root);
        setReportDeckSlide(root, slideIndex);
    }

    function moveReportDeckSlide(root, direction) {
        const slideCount = getReportDeckSlideCount(root);
        if (!slideCount) return;
        const current = Number.parseInt(String(root.dataset.reportActiveSlide || '0'), 10) || 0;
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        if (fullscreenElement && direction > 0 && current >= slideCount - 1) {
            setReportDeckSlide(root, 0);
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            clearReportDeckFullscreenOutputState(root, root.__reportDeckState || {});
            return;
        }
        const next = (current + direction + slideCount) % slideCount;
        setReportDeckSlide(root, next);
    }

    function isReportDeckFullscreenAdvanceClick(root, target) {
        if (!root || !target || root.dataset.reportEditMode === 'editing') return false;
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
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
            '[data-report-fullscreen]',
            '[data-report-save-menu]',
            '[data-report-save-menu-toggle]',
            '[data-report-export-html]',
            '[data-report-capture-pdf]',
            '[data-report-capture-zip]',
            '[data-report-print-pdf]',
            '[data-report-edit-toggle]',
            '[data-report-contents-toggle]',
            '[data-report-memo-overview-toggle]',
            '[data-report-plan-image-input]',
            '[data-report-plan-image-upload]',
            '[data-report-plan-image-clear]',
            '[data-report-chart-highlight-toggle]',
            '[data-report-chart-highlight-reset]'
        ].join(', '));
    }

    function applyReportDeckFullscreenOutputPreparedState(root) {
        const optionalVisibility = {
            slide8: String(root?.dataset?.reportPrintSlide8Visible || '') === 'true',
            slide9: String(root?.dataset?.reportPrintSlide9Visible || '') === 'true',
            slide10: String(root?.dataset?.reportPrintSlide10Visible || '') === 'true'
        };
        syncReportDeckOutputOptionalContents(root, optionalVisibility);
        Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            const printable = String(slide?.dataset?.reportPrintVisible || '') === 'true';
            if (!printable) {
                delete slide.dataset.reportOutputPrepared;
                return;
            }
            slide.dataset.reportOutputPrepared = 'true';
            const pageText = String(slide?.dataset?.reportPrintPageText || '').trim();
            const pageNumber = slide.querySelector?.('[data-report-page-number]');
            if (pageNumber && pageText) pageNumber.textContent = pageText;
        });
    }

    function clearReportDeckPrintOutputState(root) {
        if (!root?.dataset) return;
        delete root.dataset.reportPrintMode;
        delete root.dataset.reportPrintView;
        delete root.dataset.reportPrintSlide8Visible;
        delete root.dataset.reportPrintSlide9Visible;
        delete root.dataset.reportPrintSlide10Visible;
        Array.from(root.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            delete slide.dataset.reportPrintVisible;
            delete slide.dataset.reportPrintLast;
            delete slide.dataset.reportPrintPageText;
        });
    }

    function clearReportDeckFullscreenOutputState(root, state = {}) {
        if (!root?.dataset || root.dataset.reportFullscreenOutputMode !== 'true') return;
        const hadPrintMode = root.dataset.reportFullscreenHadPrintMode === 'true';
        delete root.dataset.reportFullscreenOutputMode;
        delete root.dataset.reportFullscreenHadPrintMode;
        Array.from(root.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            delete slide.dataset.reportOutputPrepared;
        });
        if (!hadPrintMode) {
            clearReportDeckPrintOutputState(root);
        }
        parts.syncReportDeckFields(root, state, { selectedMonth: root.dataset.reportMonth || '' });
        parts.syncReportDeckPlanControls(root, state);
    }

    function syncReportDeckFullscreenControls(root) {
        const isEditFullscreen = root?.dataset?.reportEditFullscreenMode === 'true';
        const isContentsCollapsed = root?.dataset?.reportContentsCollapsed === 'true';
        Array.from(root?.querySelectorAll?.('[data-report-edit-fullscreen-toggle]') || []).forEach(button => {
            button.classList?.toggle?.('is-active', isEditFullscreen);
            button.setAttribute?.('aria-pressed', isEditFullscreen ? 'true' : 'false');
            button.title = isEditFullscreen ? '편집 전체화면 종료' : '편집 전체화면';
            button.setAttribute?.('aria-label', isEditFullscreen ? '편집 전체화면 종료' : '편집 전체화면');
        });
        Array.from(root?.querySelectorAll?.('[data-report-contents-toggle]') || []).forEach(button => {
            button.hidden = !isEditFullscreen;
            button.classList?.toggle?.('is-active', isEditFullscreen && isContentsCollapsed);
            button.setAttribute?.('aria-pressed', isContentsCollapsed ? 'true' : 'false');
            button.title = isContentsCollapsed ? '목차 열기' : '목차 닫기';
            button.setAttribute?.('aria-label', isContentsCollapsed ? '목차 열기' : '목차 닫기');
        });
    }

    function clearReportDeckContentsCollapsedState(root) {
        if (!root?.dataset) return;
        delete root.dataset.reportContentsCollapsed;
    }

    function clearReportDeckEditFullscreenState(root) {
        if (!root?.dataset) return;
        delete root.dataset.reportEditFullscreenMode;
        clearReportDeckContentsCollapsedState(root);
        syncReportDeckFullscreenControls(root);
    }

    function toggleReportDeckContents(root) {
        if (!root?.dataset || root.dataset.reportEditFullscreenMode !== 'true') return false;
        if (root.dataset.reportContentsCollapsed === 'true') {
            clearReportDeckContentsCollapsedState(root);
        } else {
            root.dataset.reportContentsCollapsed = 'true';
        }
        syncReportDeckFullscreenControls(root);
        return true;
    }

    function prepareReportDeckFullscreenOutputState(root, state = {}) {
        if (!root?.dataset) return false;
        root.dataset.reportFullscreenHadPrintMode = root.dataset.reportPrintMode === 'true' ? 'true' : 'false';
        const outputCount = prepareReportDeckPdfPrint(root, state);
        if (outputCount <= 0) {
            root.dataset.reportFullscreenOutputMode = 'true';
            clearReportDeckFullscreenOutputState(root, state);
            parts.setReportDeckStatus(root, 'error', '전체화면으로 볼 페이지 없음');
            return false;
        }
        root.dataset.reportFullscreenOutputMode = 'true';
        syncReportDeckDynamicSlides(root);
        applyReportDeckFullscreenOutputPreparedState(root);
        return true;
    }

    function toggleReportDeckFullscreen(root) {
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        if (fullscreenElement) {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            clearReportDeckFullscreenOutputState(root, root.__reportDeckState || {});
            clearReportDeckEditFullscreenState(root);
            return;
        }
        if (!prepareReportDeckFullscreenOutputState(root, root.__reportDeckState || {})) return;
        const request = root?.requestFullscreen || root?.webkitRequestFullscreen;
        if (typeof request !== 'function') {
            clearReportDeckFullscreenOutputState(root, root.__reportDeckState || {});
            return;
        }
        const result = request?.call?.(root);
        result?.catch?.(() => {
            clearReportDeckFullscreenOutputState(root, root.__reportDeckState || {});
        });
        const stage = root?.querySelector?.('[data-report-stage]');
        stage?.focus?.();
    }

    async function presentReportDeck(root, state = {}, meta = {}) {
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        const wasEditFullscreen = fullscreenElement === root && root?.dataset?.reportEditFullscreenMode === 'true';
        if (root?.dataset?.reportEditMode === 'editing') {
            const completed = await parts.completeReportDeckEdit(root, state, meta);
            if (completed !== true || root?.dataset?.reportEditMode === 'editing') return false;
        }
        if (wasEditFullscreen) {
            clearReportDeckEditFullscreenState(root);
            if (!prepareReportDeckFullscreenOutputState(root, state)) return false;
            const stage = root?.querySelector?.('[data-report-stage]');
            stage?.focus?.();
            return true;
        }
        toggleReportDeckFullscreen(root);
        return true;
    }

    function toggleReportDeckEditFullscreen(root, state = {}, meta = {}) {
        const doc = root?.ownerDocument;
        const fullscreenElement = doc?.fullscreenElement || doc?.webkitFullscreenElement || null;
        if (fullscreenElement === root && root?.dataset?.reportEditFullscreenMode === 'true') {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            clearReportDeckEditFullscreenState(root);
            return;
        }
        if (fullscreenElement) {
            const exit = doc.exitFullscreen || doc.webkitExitFullscreen;
            const result = exit?.call?.(doc);
            result?.catch?.(() => {});
            clearReportDeckFullscreenOutputState(root, state);
            clearReportDeckEditFullscreenState(root);
            return;
        }
        clearReportDeckFullscreenOutputState(root, state);
        root.dataset.reportEditFullscreenMode = 'true';
        setReportDeckEditMode(root, true);
        parts.syncReportDeckPlanControls(root, state);
        parts.setReportDeckStatus(root, meta.dirty ? 'dirty' : 'idle', meta.dirty ? '저장 필요' : '');
        syncReportDeckFullscreenControls(root);
        const request = root?.requestFullscreen || root?.webkitRequestFullscreen;
        if (typeof request !== 'function') {
            clearReportDeckEditFullscreenState(root);
            return;
        }
        const result = request?.call?.(root);
        result?.catch?.(() => {
            clearReportDeckEditFullscreenState(root);
        });
        const stage = root?.querySelector?.('[data-report-stage]');
        stage?.focus?.();
    }

    function shouldIncludeReportDeckSlideInOutput(slide, state = {}) {
        const optionalPageKey = String(slide?.dataset?.reportOptionalPage || '').trim();
        if (optionalPageKey === 'slide8' || optionalPageKey === 'slide9' || optionalPageKey === 'slide10') {
            const pageIndex = Number.parseInt(String(slide?.dataset?.reportDynamicPage || '0'), 10) || 0;
            return parts.hasReportDeckPlanPageContent(state, optionalPageKey, pageIndex);
        }
        return true;
    }

    function getReportDeckOutputCandidateSlides(root) {
        const activeView = getReportDeckActiveView(root);
        return activeView === parts.REPORT_DECK_DEFAULT_VIEW
            ? Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || [])
                .filter(slide => slide.hidden !== true && String(slide.dataset.reportSlidePage || '') !== '-1')
            : getReportDeckVisibleSlides(root, activeView);
    }

    function getReportDeckOutputSlides(root, state = {}) {
        return getReportDeckOutputCandidateSlides(root)
            .filter(slide => shouldIncludeReportDeckSlideInOutput(slide, state));
    }

    function setReportDeckOutputPageNumbers(root, printSlides = []) {
        const pageCount = printSlides.length;
        const printSlideSet = new Set(printSlides);
        Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            if (!printSlideSet.has(slide)) {
                delete slide.dataset.reportPrintPageText;
                return;
            }
            const index = printSlides.indexOf(slide);
            slide.dataset.reportPrintPageText = `${index + 1}/${pageCount}`;
        });
    }

    function getReportDeckOutputOptionalPages(printSlides = []) {
        const includedPages = new Set();
        printSlides.forEach(slide => {
            const optionalPageKey = String(slide?.dataset?.reportOptionalPage || '').trim();
            if (parts.REPORT_DECK_OPTIONAL_SECTION_ORDER.includes(optionalPageKey)) {
                includedPages.add(optionalPageKey);
            }
        });
        return includedPages;
    }

    function syncReportDeckOutputOptionalSectionFields(root, state = {}, printSlides = []) {
        const outputOptionalPages = getReportDeckOutputOptionalPages(printSlides);
        const fieldValues = parts.buildReportDeckOptionalSectionFields(
            root?.dataset?.reportMonth || '',
            parts.getReportDeckOptionalSectionNumbers(state, outputOptionalPages)
        );
        Object.entries(fieldValues).forEach(([key, value]) => {
            Array.from(root?.querySelectorAll?.(`[data-report-field="${key}"]`) || []).forEach(field => {
                field.textContent = value || '';
            });
            Array.from(root?.querySelectorAll?.(`[data-report-field-ref="${key}"]`) || []).forEach(field => {
                field.textContent = value || '';
            });
        });
        return outputOptionalPages;
    }

    function syncReportDeckOutputOptionalContents(root, visibility = {}) {
        Array.from(root?.querySelectorAll?.('[data-report-optional-content]') || []).forEach(element => {
            const optionalKey = String(element?.dataset?.reportOptionalContent || '').trim();
            if (!Object.prototype.hasOwnProperty.call(visibility, optionalKey)) return;
            element.hidden = visibility[optionalKey] !== true;
        });
    }

    function prepareReportDeckPdfPrint(root, state = {}) {
        parts.syncReportDeckFields(root, state, { selectedMonth: root?.dataset?.reportMonth || '' });
        parts.syncReportDeckPlanControls(root, state);
        syncReportDeckDynamicSlides(root);
        const activeView = getReportDeckActiveView(root);
        const printSlides = getReportDeckOutputSlides(root, state);
        const printSlideSet = new Set(printSlides);
        const lastPrintSlide = printSlides[printSlides.length - 1] || null;
        root.dataset.reportPrintMode = 'true';
        root.dataset.reportPrintView = activeView === parts.REPORT_DECK_DEFAULT_VIEW ? 'all' : activeView;
        const outputOptionalPages = syncReportDeckOutputOptionalSectionFields(root, state, printSlides);
        const optionalVisibility = {
            slide8: outputOptionalPages.has('slide8'),
            slide9: outputOptionalPages.has('slide9'),
            slide10: outputOptionalPages.has('slide10')
        };
        root.dataset.reportPrintSlide8Visible = optionalVisibility.slide8 ? 'true' : 'false';
        root.dataset.reportPrintSlide9Visible = optionalVisibility.slide9 ? 'true' : 'false';
        root.dataset.reportPrintSlide10Visible = optionalVisibility.slide10 ? 'true' : 'false';
        syncReportDeckOutputOptionalContents(root, optionalVisibility);
        syncReportDeckContentsPageRanges(root, printSlides);
        setReportDeckOutputPageNumbers(root, printSlides);
        Array.from(root?.querySelectorAll?.('[data-report-slide-page]') || []).forEach(slide => {
            const printable = printSlideSet.has(slide);
            slide.dataset.reportPrintVisible = printable ? 'true' : 'false';
            if (printable && slide === lastPrintSlide) {
                slide.dataset.reportPrintLast = 'true';
            } else {
                delete slide.dataset.reportPrintLast;
            }
        });
        parts.syncReportDeckCaptureControls(root, state);
        return printSlides.length;
    }

    function printReportDeckPdf(root, state = {}) {
        if (typeof browser?.printReportDeckPdf !== 'function') {
            parts.setReportDeckStatus(root, 'error', 'PDF 인쇄 불가');
            return false;
        }
        const printCount = prepareReportDeckPdfPrint(root, state);
        if (printCount <= 0) {
            parts.setReportDeckStatus(root, 'error', '인쇄할 슬라이드 없음');
            return false;
        }
        try {
            browser.printReportDeckPdf(root);
            parts.setReportDeckStatus(root, 'idle', '');
            return true;
        } catch (error) {
            void error;
            parts.setReportDeckStatus(root, 'error', 'PDF 인쇄 실패');
            return false;
        }
    }

    function buildReportDeckExportDateToken(state = {}, meta = {}) {
        const normalizedDate = parts.normalizeReportDeckDate(state.reportDate);
        if (normalizedDate) return normalizedDate.replace(/\./g, '');
        const selectedMonth = parts.normalizeReportDeckMonth(meta.selectedMonth);
        if (selectedMonth) return selectedMonth.replace('-', '');
        return new Date().toISOString().slice(0, 10).replace(/-/g, '');
    }

    function buildReportDeckExportFileName(state = {}, meta = {}) {
        return `공무환경팀 실적보고서 ${buildReportDeckExportDateToken(state, meta)}.html`;
    }

    function buildReportDeckExportTimeMinuteToken(date = new Date()) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}${minutes}`;
    }

    function buildReportDeckCaptureZipFileName(state = {}, meta = {}) {
        return `KPI-report-capture-${buildReportDeckExportDateToken(state, meta)}-${buildReportDeckExportTimeMinuteToken()}.zip`;
    }

    function buildReportDeckCapturePdfFileName(state = {}, meta = {}) {
        return `KPI-report-capture-${buildReportDeckExportDateToken(state, meta)}-${buildReportDeckExportTimeMinuteToken()}.pdf`;
    }

    function getReportDeckCaptureProgressText(progress = {}) {
        const current = Math.max(0, Number.parseInt(String(progress.current ?? '0'), 10) || 0);
        const total = Math.max(0, Number.parseInt(String(progress.total ?? '0'), 10) || 0);
        const suffix = total > 0 ? ` ${current}/${total}` : '';
        if (progress.phase === 'prepare') return `캡쳐 페이지 준비 중${suffix}`;
        if (progress.phase === 'render') return '캡쳐 이미지 생성 중';
        return '캡쳐 진행 중';
    }

    async function exportReportDeckSingleHtml(root, state, meta) {
        if (typeof browser?.exportReportDeckSingleHtml !== 'function') {
            parts.setReportDeckStatus(root, 'error', 'HTML 추출 불가');
            return false;
        }
        if (root?.dataset?.reportCaptureBusy === 'true') {
            return false;
        }
        parts.setReportDeckStatus(root, 'saving', 'HTML 추출 중');
        try {
            const exportCount = prepareReportDeckPdfPrint(root, state);
            if (exportCount <= 0) {
                parts.setReportDeckStatus(root, 'error', 'HTML 추출할 페이지 없음');
                return false;
            }
            parts.syncReportDeckCaptureControls(root, state);
            const pageRange = parts.resolveReportDeckCaptureRange(root, state);
            if (!pageRange) {
                parts.setReportDeckStatus(root, 'error', 'HTML 범위 확인 필요');
                return false;
            }
            parts.setReportDeckCaptureBusy(root, true);
            await browser.exportReportDeckSingleHtml(root, {
                filename: buildReportDeckExportFileName(state, meta),
                title: '공무환경팀 실적보고서',
                includeCaptureFiles: false,
                pageRange,
                onCaptureProgress: progress => {
                    parts.setReportDeckStatus(root, 'saving', `HTML 추출용 ${getReportDeckCaptureProgressText(progress)}`);
                }
            });
            parts.setReportDeckStatus(root, 'saved', `HTML 추출 완료 (${pageRange.end - pageRange.start + 1}p)`);
            return true;
        } catch (error) {
            void error;
            parts.setReportDeckStatus(root, 'error', 'HTML 추출 실패');
            return false;
        } finally {
            parts.setReportDeckCaptureBusy(root, false);
        }
    }

    async function captureReportDeckZip(root, state, meta) {
        if (typeof browser?.exportReportDeckCaptureZip !== 'function') {
            parts.setReportDeckStatus(root, 'error', '\uCEA1\uCC98 \uBD88\uAC00');
            return false;
        }
        if (root?.dataset?.reportCaptureBusy === 'true') {
            return false;
        }
        const captureCount = prepareReportDeckPdfPrint(root, state);
        if (captureCount <= 0) {
            parts.setReportDeckStatus(root, 'error', '\uCEA1\uCC98\uD560 \uD398\uC774\uC9C0 \uC5C6\uC74C');
            return false;
        }
        parts.syncReportDeckCaptureControls(root, state);
        const pageRange = parts.resolveReportDeckCaptureRange(root, state);
        if (!pageRange) {
            parts.setReportDeckStatus(root, 'error', '캡쳐 범위 확인 필요');
            return false;
        }
        parts.setReportDeckCaptureBusy(root, true);
        parts.setReportDeckStatus(root, 'saving', '\uCEA1\uCC98 \uC900\uBE44 \uC911');
        try {
            const result = await browser.exportReportDeckCaptureZip(root, {
                filename: buildReportDeckCaptureZipFileName(state, meta),
                pageRange,
                onProgress: progress => {
                    parts.setReportDeckStatus(root, 'saving', getReportDeckCaptureProgressText(progress));
                }
            });
            parts.setReportDeckStatus(root, 'saved', `\uCEA1\uCC98 ZIP \uB2E4\uC6B4\uB85C\uB4DC \uC644\uB8CC (${result?.imageCount || (pageRange.end - pageRange.start + 1)}\uC7A5)`);
            return true;
        } catch (error) {
            if (String(error?.name || '') === 'AbortError') {
                parts.setReportDeckStatus(root, 'idle', '\uCEA1\uCC98 \uCDE8\uC18C');
                return false;
            }
            const status = Number(error?.status) || 0;
            const message = status === 401
                ? '\uCEA1\uCC98 ZIP \uC2E4\uD328: \uB2E4\uC2DC \uB85C\uADF8\uC778 \uD544\uC694'
                : status === 404
                    ? '\uCEA1\uCC98 ZIP \uC2E4\uD328: \uC11C\uBC84 \uC7AC\uC2DC\uC791 \uD544\uC694'
                    : status === 413
                        ? '\uCEA1\uCC98 ZIP \uC2E4\uD328: \uBCF4\uACE0\uC11C \uC774\uBBF8\uC9C0 \uC6A9\uB7C9 \uD07C'
                        : status
                            ? `\uCEA1\uCC98 ZIP \uC2E4\uD328: HTTP ${status}`
                            : '\uCEA1\uCC98 ZIP \uC2E4\uD328';
            parts.setReportDeckStatus(root, 'error', message);
            return false;
        } finally {
            parts.setReportDeckCaptureBusy(root, false);
        }
    }

    async function captureReportDeckPdf(root, state, meta) {
        if (typeof browser?.exportReportDeckCapturePdf !== 'function') {
            parts.setReportDeckStatus(root, 'error', 'PDF 변환 불가');
            return false;
        }
        if (root?.dataset?.reportCaptureBusy === 'true') {
            return false;
        }
        const captureCount = prepareReportDeckPdfPrint(root, state);
        if (captureCount <= 0) {
            parts.setReportDeckStatus(root, 'error', 'PDF로 만들 페이지 없음');
            return false;
        }
        parts.syncReportDeckCaptureControls(root, state);
        const pageRange = parts.resolveReportDeckCaptureRange(root, state);
        if (!pageRange) {
            parts.setReportDeckStatus(root, 'error', 'PDF 범위 확인 필요');
            return false;
        }
        parts.setReportDeckCaptureBusy(root, true);
        parts.setReportDeckStatus(root, 'saving', 'PDF 변환 준비 중');
        try {
            const result = await browser.exportReportDeckCapturePdf(root, {
                filename: buildReportDeckCapturePdfFileName(state, meta),
                pageRange,
                onProgress: progress => {
                    parts.setReportDeckStatus(root, 'saving', `PDF 변환용 ${getReportDeckCaptureProgressText(progress)}`);
                }
            });
            parts.setReportDeckStatus(root, 'saved', `PDF 다운로드 완료 (${result?.imageCount || (pageRange.end - pageRange.start + 1)}p)`);
            return true;
        } catch (error) {
            if (String(error?.name || '') === 'AbortError') {
                parts.setReportDeckStatus(root, 'idle', 'PDF 변환 취소');
                return false;
            }
            const status = Number(error?.status) || 0;
            const message = status === 401
                ? 'PDF 변환 실패: 다시 로그인 필요'
                : status === 404
                    ? 'PDF 변환 실패: 서버 재시작 필요'
                    : status === 413
                        ? 'PDF 변환 실패: 보고서 이미지 용량 큼'
                        : status
                            ? `PDF 변환 실패: HTTP ${status}`
                            : 'PDF 변환 실패';
            parts.setReportDeckStatus(root, 'error', message);
            return false;
        } finally {
            parts.setReportDeckCaptureBusy(root, false);
        }
    }
    Object.assign(parts, {
        applyReportDeckFullscreenOutputPreparedState,
        buildReportDeckCapturePdfFileName,
        buildReportDeckCaptureZipFileName,
        buildReportDeckExportDateToken,
        buildReportDeckExportFileName,
        buildReportDeckExportTimeMinuteToken,
        captureReportDeckPdf,
        captureReportDeckZip,
        clearReportDeckContentsCollapsedState,
        clearReportDeckEditFullscreenState,
        clearReportDeckFullscreenOutputState,
        clearReportDeckPrintOutputState,
        ensureReportDeckSlideNavCapacity,
        exportReportDeckSingleHtml,
        formatReportDeckPageRange,
        getReportDeckActiveView,
        getReportDeckCaptureProgressText,
        getReportDeckOutputCandidateSlides,
        getReportDeckOutputOptionalPages,
        getReportDeckOutputSlides,
        getReportDeckSlideCount,
        getReportDeckSlideLabel,
        getReportDeckSlideView,
        getReportDeckVisibleSlides,
        hasReportDeckViewMetadata,
        isReportDeckFullscreenAdvanceClick,
        isReportDeckSaveShortcut,
        isReportDeckSlideInView,
        moveReportDeckSlide,
        normalizeReportDeckView,
        prepareReportDeckFullscreenOutputState,
        prepareReportDeckPdfPrint,
        presentReportDeck,
        printReportDeckPdf,
        setReportDeckEditMode,
        setReportDeckOutputPageNumbers,
        setReportDeckSlide,
        setReportDeckView,
        shouldIncludeReportDeckSlideInOutput,
        syncReportDeckContentsPageRanges,
        syncReportDeckDynamicSlides,
        syncReportDeckFullscreenControls,
        syncReportDeckOutputOptionalContents,
        syncReportDeckOutputOptionalSectionFields,
        syncReportDeckReturnControls,
        toggleReportDeckContents,
        toggleReportDeckEditFullscreen,
        toggleReportDeckFullscreen,
    });
})(this);
