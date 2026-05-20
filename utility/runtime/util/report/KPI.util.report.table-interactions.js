        function getUtilReportTableRuntimeAdapter() {
            return typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
                ? KPIUtilReportRuntimeAdapter
                : null;
        }

        function getUtilReportTableComputedStyle(element) {
            const adapter = getUtilReportTableRuntimeAdapter();
            return typeof adapter?.getComputedStyle === 'function'
                ? adapter.getComputedStyle(element)
                : null;
        }

        function getUtilReportTableViewportSize() {
            const adapter = getUtilReportTableRuntimeAdapter();
            if (typeof adapter?.getViewportSize === 'function') {
                return adapter.getViewportSize(document);
            }
            return {
                width: Number(document.documentElement?.clientWidth) || 0,
                height: Number(document.documentElement?.clientHeight) || 0
            };
        }

        function requestUtilReportTableAnimationFrame(callback) {
            const adapter = getUtilReportTableRuntimeAdapter();
            return typeof adapter?.requestAnimationFrame === 'function'
                ? adapter.requestAnimationFrame(callback)
                : null;
        }

        function bindUtilReportModalBodyDrag(modal) {
            if (!modal || modal.dataset.bodyDragBound === 'true') return;
            const bodyEl = modal.querySelector('.util-report-modal-body');
            if (!bodyEl) return;
            modal.dataset.bodyDragBound = 'true';

            let activePointerId = null;
            let startX = 0;
            let startY = 0;
            let startScrollTop = 0;
            let moved = false;

            const endDrag = () => {
                if (activePointerId === null) return;
                activePointerId = null;
                bodyEl.classList.remove('is-dragging');
            };

            const isInteractiveTarget = (target) => !!target?.closest?.('input, select, textarea, button, label, a, summary, details, [contenteditable], [data-role="util-report-inline-body"]');

            bodyEl.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (!modal.classList.contains('is-chart-fullscreen')) return;
                if (modal.classList.contains('is-inline-table-detached')) return;
                if (isInteractiveTarget(event.target)) return;
                if (bodyEl.scrollHeight <= (bodyEl.clientHeight + 1)) return;
                activePointerId = event.pointerId;
                startX = event.clientX;
                startY = event.clientY;
                startScrollTop = bodyEl.scrollTop;
                moved = false;
                bodyEl.classList.add('is-dragging');
                if (typeof bodyEl.setPointerCapture === 'function') {
                    try { bodyEl.setPointerCapture(activePointerId); } catch (err) {}
                }
            });

            bodyEl.addEventListener('pointermove', event => {
                if (activePointerId === null || event.pointerId !== activePointerId) return;
                const diffY = event.clientY - startY;
                if (Math.abs(event.clientX - startX) > 2 || Math.abs(diffY) > 2) moved = true;
                bodyEl.scrollTop = startScrollTop - diffY;
                if (moved) event.preventDefault();
            });

            bodyEl.addEventListener('pointerup', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            bodyEl.addEventListener('pointercancel', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            bodyEl.addEventListener('lostpointercapture', endDrag);
            bodyEl.addEventListener('dragstart', event => event.preventDefault());
        }

        function bindUtilReportDonutRowDrag(modal) {
            if (!modal || modal.dataset.donutRowDragBound === 'true') return;
            const donutRow = modal.querySelector('.util-report-donut-row');
            const bodyEl = modal.querySelector('.util-report-modal-body');
            if (!donutRow) return;
            modal.dataset.donutRowDragBound = 'true';

            let activePointerId = null;
            let startX = 0;
            let startY = 0;
            let startScrollTop = 0;
            let moved = false;
            let scrollTarget = donutRow;

            const endDrag = () => {
                if (activePointerId === null) return;
                activePointerId = null;
                donutRow.classList.remove('is-dragging');
            };

            const isInteractiveTarget = (target) => !!target?.closest?.('button, input, select, textarea, label, a, summary, details, [contenteditable]');

            donutRow.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (isInteractiveTarget(event.target)) return;
                const useBodyScroll = !donutRow
                    || donutRow.scrollHeight <= (donutRow.clientHeight + 1)
                    || getUtilReportTableComputedStyle(donutRow)?.overflowY === 'visible';
                scrollTarget = useBodyScroll && bodyEl ? bodyEl : donutRow;
                if (!scrollTarget || scrollTarget.scrollHeight <= (scrollTarget.clientHeight + 1)) return;
                activePointerId = event.pointerId;
                startX = event.clientX;
                startY = event.clientY;
                startScrollTop = scrollTarget.scrollTop;
                moved = false;
                donutRow.classList.add('is-dragging');
                if (typeof donutRow.setPointerCapture === 'function') {
                    try { donutRow.setPointerCapture(activePointerId); } catch (err) {}
                }
            });

            donutRow.addEventListener('pointermove', event => {
                if (activePointerId === null || event.pointerId !== activePointerId) return;
                const diffX = event.clientX - startX;
                const diffY = event.clientY - startY;
                if (Math.abs(diffX) > 2 || Math.abs(diffY) > 2) moved = true;
                if (scrollTarget) {
                    scrollTarget.scrollTop = startScrollTop - diffY;
                }
                if (moved) event.preventDefault();
            });

            donutRow.addEventListener('pointerup', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            donutRow.addEventListener('pointercancel', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            donutRow.addEventListener('lostpointercapture', endDrag);
            donutRow.addEventListener('dragstart', event => event.preventDefault());
        }

        function bindUtilReportBuilderVizViewportDrag(modal) {
            if (!modal || modal.dataset.viewportDragBound === 'true') return;
            const card = modal.querySelector('.util-report-builder-viz-card');
            const body = modal.querySelector('.util-report-builder-viz-body');
            if (!card || !body) return;
            modal.dataset.viewportDragBound = 'true';
            card.classList.add('is-drag-ready');

            let activePointerId = null;
            let startX = 0;
            let startY = 0;
            let startScrollLeft = 0;
            let startScrollTop = 0;

            const endDrag = () => {
                if (activePointerId === null) return;
                activePointerId = null;
                card.classList.remove('is-dragging');
            };

            const isInteractiveTarget = (target) => !!target?.closest?.('input, select, textarea, button, label, a, summary, details, [contenteditable], [data-role="util-chart-month-hit"]');

            card.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                if (isInteractiveTarget(event.target)) return;
                activePointerId = event.pointerId;
                startX = event.clientX;
                startY = event.clientY;
                startScrollLeft = body.scrollLeft;
                startScrollTop = body.scrollTop;
                card.classList.add('is-dragging');
                if (typeof card.setPointerCapture === 'function') {
                    try { card.setPointerCapture(activePointerId); } catch (err) {}
                }
            });

            card.addEventListener('pointermove', event => {
                if (activePointerId === null || event.pointerId !== activePointerId) return;
                const diffX = event.clientX - startX;
                const diffY = event.clientY - startY;
                body.scrollLeft = startScrollLeft - diffX;
                body.scrollTop = startScrollTop - diffY;
                if (Math.abs(diffX) > 2 || Math.abs(diffY) > 2) event.preventDefault();
            });

            card.addEventListener('pointerup', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            card.addEventListener('pointercancel', event => {
                if (event.pointerId !== activePointerId) return;
                endDrag();
            });
            card.addEventListener('lostpointercapture', endDrag);
            card.addEventListener('dragstart', event => event.preventDefault());
        }

        function getUtilReportScrollableAncestors(target) {
            const containers = [];
            const seen = new Set();
            let node = target?.parentElement || null;
            while (node && node !== document.body && node !== document.documentElement) {
                const style = getUtilReportTableComputedStyle(node);
                const overflowY = style?.overflowY || '';
                const overflowX = style?.overflowX || '';
                const canScrollY = /(auto|scroll|overlay)/.test(overflowY) && node.scrollHeight > (node.clientHeight + 1);
                const canScrollX = /(auto|scroll|overlay)/.test(overflowX) && node.scrollWidth > (node.clientWidth + 1);
                if ((canScrollY || canScrollX) && !seen.has(node)) {
                    containers.push(node);
                    seen.add(node);
                }
                node = node.parentElement;
            }
            const docScroller = document.scrollingElement || document.documentElement;
            if (docScroller && !seen.has(docScroller)) {
                containers.push(docScroller);
            }
            return containers;
        }

        function scrollUtilReportElementIntoContainer(container, target, options = {}) {
            if (!container || !target) return false;
            const behavior = options.behavior || 'smooth';
            const block = options.block || 'center';
            const inline = options.inline || 'center';
            const margin = Number.isFinite(options.margin) ? options.margin : 20;
            const isViewport = container === (document.scrollingElement || document.documentElement);
            const viewportSize = getUtilReportTableViewportSize();
            const containerRect = isViewport
                ? { top: 0, left: 0, width: viewportSize.width, height: viewportSize.height }
                : container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const deltaTop = targetRect.top - containerRect.top;
            const deltaLeft = targetRect.left - containerRect.left;
            let nextTop = container.scrollTop;
            let nextLeft = container.scrollLeft;

            if (block === 'start') {
                nextTop += deltaTop - margin;
            } else if (block === 'nearest') {
                const topVisible = deltaTop >= margin;
                const bottomVisible = (deltaTop + targetRect.height) <= (containerRect.height - margin);
                if (!topVisible) nextTop += deltaTop - margin;
                else if (!bottomVisible) nextTop += (deltaTop + targetRect.height) - containerRect.height + margin;
            } else {
                nextTop += deltaTop - ((containerRect.height - targetRect.height) / 2);
            }

            if (inline === 'start' || inline === 'nearest') {
                const leftVisible = deltaLeft >= margin;
                const rightVisible = (deltaLeft + targetRect.width) <= (containerRect.width - margin);
                if (!leftVisible) nextLeft += deltaLeft - margin;
                else if (!rightVisible) nextLeft += (deltaLeft + targetRect.width) - containerRect.width + margin;
            } else {
                nextLeft += deltaLeft - ((containerRect.width - targetRect.width) / 2);
            }

            const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
            const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
            nextTop = Math.max(0, Math.min(maxTop, nextTop));
            nextLeft = Math.max(0, Math.min(maxLeft, nextLeft));
            if (Math.abs(nextTop - container.scrollTop) < 1 && Math.abs(nextLeft - container.scrollLeft) < 1) {
                return false;
            }
            if (typeof container.scrollTo === 'function') {
                container.scrollTo({ top: nextTop, left: nextLeft, behavior });
            } else {
                container.scrollTop = nextTop;
                container.scrollLeft = nextLeft;
            }
            return true;
        }

        function scrollUtilReportFocusTarget(target, options = {}) {
            if (!target) return false;
            const mergedOptions = {
                block: 'start',
                inline: 'nearest',
                margin: 76,
                behavior: options.behavior || 'smooth',
                ...options
            };
            const containers = getUtilReportScrollableAncestors(target);
            if (!containers.length && typeof target.scrollIntoView === 'function') {
                try {
                    target.scrollIntoView({
                        behavior: mergedOptions.behavior,
                        block: mergedOptions.block,
                        inline: mergedOptions.inline
                    });
                } catch (err) {
                    target.scrollIntoView();
                }
                return true;
            }
            const runScroll = (behaviorValue) => {
                let didScroll = false;
                containers.forEach(container => {
                    didScroll = scrollUtilReportElementIntoContainer(container, target, {
                        ...mergedOptions,
                        behavior: behaviorValue
                    }) || didScroll;
                });
                return didScroll;
            };
            const didScroll = runScroll(mergedOptions.behavior);
            requestUtilReportTableAnimationFrame(() => runScroll('auto'));
            return didScroll;
        }

        function scrollUtilReportFocusedElementIntoView(scope, options = {}) {
            if (!scope || typeof scope.querySelector !== 'function') return false;
            const target = scope.querySelector('.is-cell-focused')
                || scope.querySelector('tbody tr.is-row-focused td.is-cell-focused')
                || scope.querySelector('tbody tr.is-focused td.is-cell-focused')
                || scope.querySelector('tbody tr.is-row-focused')
                || scope.querySelector('tbody tr.is-focused');
            return scrollUtilReportFocusTarget(target, options);
        }

        function resolveUtilReportYoYFocusCell(tableEl, targetRow, options = {}) {
            if (!tableEl || !targetRow) return null;
            const cells = Array.from(targetRow.querySelectorAll('td'));
            if (!cells.length) return null;
            if (cells.length === 1) return cells[0];
            const compareYear = String(UtilReportState.compareYear || '').trim();
            const seriesKey = String(options.seriesKey || UtilReportState.focusSeriesKey || '').trim().toLowerCase();
            if (compareYear) {
                if (seriesKey === 'prev') return cells[2] || cells[1] || cells[cells.length - 1] || null;
                if (seriesKey === 'delta') return cells[3] || cells[1] || cells[cells.length - 1] || null;
                if (seriesKey === 'rate') return cells[4] || cells[cells.length - 1] || null;
                return cells[1] || cells[cells.length - 1] || null;
            }
            const chartYear = String(UtilReportState.chartYear || '').trim();
            const headers = Array.from(tableEl.querySelectorAll('thead th'));
            if (chartYear && headers.length > 1) {
                const headerIndex = headers.findIndex((cell, index) => index > 0 && String(cell.textContent || '').trim().startsWith(chartYear));
                if (headerIndex > 0 && headerIndex < cells.length) {
                    return cells[headerIndex];
                }
            }
            return cells[cells.length - 1] || cells[1] || null;
        }

        function syncUtilAnalyticsChartHostHeight(host, extraPadding = 20) {
            if (!host || typeof host.querySelector !== 'function') return;
            const applyHeight = () => {
                const chart = host.querySelector('.util-analytics-chart');
                if (!chart) {
                    host.style.minHeight = '';
                    return;
                }
                const scrollHeight = Math.ceil(chart.scrollHeight || 0);
                const rectHeight = Math.ceil(chart.getBoundingClientRect?.().height || 0);
                const childHeight = Array.from(chart.children || []).reduce((sum, child) => {
                    return sum + Math.ceil(child.getBoundingClientRect?.().height || 0);
                }, 0);
                const nextHeight = Math.max(scrollHeight, rectHeight, childHeight);
                if (nextHeight > 0) {
                    host.style.minHeight = `${nextHeight + extraPadding}px`;
                }
            };
            applyHeight();
            requestUtilReportTableAnimationFrame(() => {
                applyHeight();
                requestUtilReportTableAnimationFrame(applyHeight);
            });
        }

        function focusUtilReportDetailTableByMonth(tableEl, selection, options = {}) {
            if (!tableEl) return false;
            const normalizedMonthKey = normalizeUtilReportMonthKey(
                typeof selection === 'object' && selection !== null
                    ? (selection.monthKey || '')
                    : ''
            );
            const normalizedToken = normalizeUtilReportMonthToken(
                typeof selection === 'object' && selection !== null
                    ? (selection.monthToken || selection.monthKey || '')
                    : selection
            );
            const seriesKey = String(
                typeof selection === 'object' && selection !== null
                    ? (selection.seriesKey || '')
                    : ''
            ).trim().toLowerCase();
            if (!normalizedMonthKey && !normalizedToken) return false;
            const rows = Array.from(tableEl.querySelectorAll('tbody tr[data-month-token]'));
            rows.forEach(row => row.classList.remove('is-focused'));
            Array.from(tableEl.querySelectorAll('.is-cell-focused')).forEach(cell => cell.classList.remove('is-cell-focused'));
            const targetRow = rows.find(row => {
                const rowMonthKey = normalizeUtilReportMonthKey(row.getAttribute('data-month-key') || '');
                if (normalizedMonthKey && rowMonthKey) return rowMonthKey === normalizedMonthKey;
                return normalizeUtilReportMonthToken(row.getAttribute('data-month-token')) === normalizedToken;
            }) || null;
            if (!targetRow) return false;
            targetRow.classList.add('is-focused');
            const focusCell = resolveUtilReportYoYFocusCell(tableEl, targetRow, { seriesKey });
            if (focusCell) focusCell.classList.add('is-cell-focused');
            if (options.scroll !== false) {
                scrollUtilReportFocusTarget(focusCell || targetRow, { block: 'start', inline: 'nearest', margin: 84 });
            }
            return true;
        }

        function getUtilReportDetachedTableWindow() {
            const popup = UtilReportDetachedTableState.win;
            if (popup && !popup.closed) return popup;
            UtilReportDetachedTableState.win = null;
            return null;
        }

        function focusUtilReportDetachedTableByMonth(selection, options = {}) {
            const popup = getUtilReportDetachedTableWindow();
            const popupTable = popup?.document?.querySelector?.('[data-role="util-report-modal-yoy-table"]');
            if (!popupTable) return false;
            return focusUtilReportDetailTableByMonth(popupTable, selection, options);
        }

        function focusUtilReportDetailRowByMonth(modal, selection, options = {}) {
            const rawSelection = typeof selection === 'object' && selection !== null
                ? selection
                : { monthToken: selection };
            const normalizedMonthKey = normalizeUtilReportMonthKey(rawSelection.monthKey || '');
            const normalizedToken = normalizeUtilReportMonthToken(rawSelection.monthToken || rawSelection.monthKey || '');
            const normalizedSeriesKey = String(rawSelection.seriesKey || '').trim().toLowerCase();
            if (!normalizedMonthKey && !normalizedToken) return false;
            UtilReportDetachedTableState.focusMonthToken = normalizedToken;
            UtilReportDetachedTableState.focusMonthKey = normalizedMonthKey;
            UtilReportDetachedTableState.focusSeriesKey = normalizedSeriesKey;
            UtilReportState.focusMonthKey = normalizedMonthKey;
            UtilReportState.focusSeriesKey = normalizedSeriesKey;
            if (UtilReportDetachedTableState.detached) {
                return focusUtilReportDetachedTableByMonth({
                    monthToken: normalizedToken,
                    monthKey: normalizedMonthKey,
                    seriesKey: normalizedSeriesKey
                }, {
                    scroll: options.detachedScroll !== false
                });
            }
            if (!modal) return false;
            const tableEl = modal.querySelector('[data-role="util-report-modal-yoy-table"]');
            return focusUtilReportDetailTableByMonth(tableEl, {
                monthToken: normalizedToken,
                monthKey: normalizedMonthKey,
                seriesKey: normalizedSeriesKey
            }, options);
        }
