        function selectWorkTeamCalendarSingle(memberName, options = {}) {
            const dataKey = options.dataKey || WorkState.teamCalendarModal;
            if (!dataKey) return false;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const dateKeys = options.dateKeys || getWorkTeamCalendarEditorDateKeys(dataKey, monthKey);
            if (!dateKeys.length) return false;
            const primaryDateKey = options.dateKey || getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey);
            const draft = getWorkTeamCalendarDraftForDates(dataKey, dateKeys);
            const nextMembers = draft.members.length === 1 && draft.members[0] === memberName ? [] : [memberName];
            const changed = applyWorkTeamCalendarMembersToDates(dataKey, dateKeys, nextMembers, {
                markModified: options.markModified !== false,
                render: options.render === true
            });
            if (nextMembers.length) {
                setWorkTeamCalendarAnchor(dataKey, primaryDateKey, memberName);
            }
            return changed;
        }

        function selectWorkTeamCalendarRange(memberName, options = {}) {
            return selectWorkTeamCalendarSingle(memberName, options);
        }

        function selectWorkTeamCalendarDraggedMembers(dataKey, dateKey, members, options = {}) {
            const normalizedMembers = normalizeWorkTeamCalendarMembers(members);
            if (!normalizedMembers.length) return false;
            return applyWorkTeamCalendarMembers(dataKey, dateKey, normalizedMembers, options);
        }

        function formatWorkTeamCalendarDateLabel(dateKey) {
            const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
            if (!match) return '-';
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            const date = new Date(year, month - 1, day);
            const weekday = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'][date.getDay()];
            return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')} (${weekday})`;
        }

        function getWorkTeamCalendarCategories() {
            return typeof getWorkTeamCalendarCategoryList === 'function'
                ? getWorkTeamCalendarCategoryList()
                : (AppData?.work?.categories || []).filter(cat => cat.view === 'team_calendar');
        }

        function getWorkTeamCalendarCategory(dataKey) {
            return getWorkTeamCalendarCategories().find(cat => cat.dataKey === dataKey) || null;
        }

        function getWorkTeamCalendarCategoryIndex(dataKey) {
            return getWorkTeamCalendarCategories().findIndex(cat => cat.dataKey === dataKey);
        }

        function formatWorkTeamCalendarMonthOptionLabel(monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return monthKey || '';
            return `${parsed.year}.${String(parsed.monthIndex + 1).padStart(2, '0')}`;
        }

        function formatWorkTeamCalendarMonthShortLabel(monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return monthKey || '';
            return String(parsed.monthIndex + 1).padStart(2, '0') + '\uC6D4';
        }

        function getWorkTeamCalendarYearOptions() {
            return Array.from(new Set(getWorkTeamCalendarMonthOptions().map(key => key.slice(0, 4))));
        }

        function getWorkTeamCalendarMonthOptionsForYear(year) {
            const yearText = String(year || '').trim();
            return getWorkTeamCalendarMonthOptions().filter(key => key.startsWith(`${yearText}-`));
        }

        function renderWorkTeamCalendarGlyph(type, size = 'md') {
            const visual = String(type || '').trim() || 'dry';
            let svg = '';
            if (visual === 'stick') {
                svg = `
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="11" y="14" width="16" height="36" rx="7" stroke="currentColor" stroke-width="3"/>
                        <rect x="37" y="10" width="16" height="40" rx="7" stroke="currentColor" stroke-width="3"/>
                        <path d="M15 24H23" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <path d="M41 20H49" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <path d="M41 28H49" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <path d="M15 32H23" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <circle cx="32" cy="48" r="4" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="2"/>
                    </svg>
                `;
            } else if (visual === 'liquid') {
                svg = `
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M26 11H38V18L42 22V48C42 52.418 38.418 56 34 56H30C25.582 56 22 52.418 22 48V22L26 18V11Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
                        <path d="M28 28H36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <path d="M32 30C36.418 35.042 38 37.653 38 40.5C38 43.538 35.538 46 32.5 46C29.462 46 27 43.538 27 40.5C27 37.653 28.582 35.042 32 30Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="2"/>
                    </svg>
                `;
            } else {
                svg = `
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="16" y="10" width="32" height="44" rx="10" stroke="currentColor" stroke-width="3"/>
                        <path d="M21 22H43" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <path d="M22 42C26 35 38 35 42 42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                        <circle cx="27" cy="33" r="2.5" fill="currentColor"/>
                        <circle cx="36" cy="30" r="2" fill="currentColor" fill-opacity="0.55"/>
                        <circle cx="40" cy="36" r="1.8" fill="currentColor" fill-opacity="0.55"/>
                    </svg>
                `;
            }
            return `<span class="work-team-glyph is-${escapeHtml(size)}" aria-hidden="true">${svg}</span>`;
        }

        function getWorkTeamCalendarDialog() {
            return document.querySelector('#work-team-calendar-modal .work-team-calendar-dialog');
        }

        function getWorkTeamCalendarFullscreenTarget() {
            return document.getElementById('work-team-calendar-modal');
        }

        function getWorkTeamCalendarFullscreenIconSvg(isActive = false) {
            if (isActive) {
                return `
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9.5 4.5v4h-4" />
                        <path d="M14.5 4.5v4h4" />
                        <path d="M9.5 19.5v-4h-4" />
                        <path d="M14.5 19.5v-4h4" />
                    </svg>
                `;
            }
            return `
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 4.5H4.5V8" />
                    <path d="M16 4.5h3.5V8" />
                    <path d="M8 19.5H4.5V16" />
                    <path d="M16 19.5h3.5V16" />
                </svg>
            `;
        }

        function isWorkTeamCalendarFullscreen(target = getWorkTeamCalendarFullscreenTarget()) {
            return !!target && document.fullscreenElement === target;
        }

        function getWorkTeamCalendarFullscreenLabel(isActive = isWorkTeamCalendarFullscreen()) {
            return isActive ? '\uC804\uCCB4\uD654\uBA74 \uD574\uC81C' : '\uC804\uCCB4\uD654\uBA74';
        }

        function syncWorkTeamCalendarFullscreenUi() {
            const modal = getWorkTeamCalendarFullscreenTarget();
            const dialog = getWorkTeamCalendarDialog();
            const isActive = isWorkTeamCalendarFullscreen(modal);
            if (modal) {
                modal.classList.toggle('is-browser-fullscreen', isActive);
            }
            if (dialog) {
                dialog.classList.toggle('is-browser-fullscreen', isActive);
            }
            document.querySelectorAll('[data-action="work-team-calendar-toggle-fullscreen"]').forEach(button => {
                const label = getWorkTeamCalendarFullscreenLabel(isActive);
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                button.setAttribute('aria-label', label);
                button.setAttribute('title', label);
                const icon = button.querySelector('[data-work-team-fullscreen-icon]');
                if (icon) {
                    icon.innerHTML = getWorkTeamCalendarFullscreenIconSvg(isActive);
                }
            });
        }

        async function exitWorkTeamCalendarFullscreen() {
            if (!isWorkTeamCalendarFullscreen()) return;
            try {
                await document.exitFullscreen?.();
            } catch (error) {
                console.warn('[KPI work team calendar] fullscreen exit failed', error);
            } finally {
                syncWorkTeamCalendarFullscreenUi();
            }
        }

        async function toggleWorkTeamCalendarFullscreen() {
            const target = getWorkTeamCalendarFullscreenTarget();
            if (!target) return;
            if (isWorkTeamCalendarFullscreen(target)) {
                await exitWorkTeamCalendarFullscreen();
                return;
            }
            if (typeof target.requestFullscreen !== 'function') {
                showToast('이 브라우저에서는 전체화면 기능을 지원하지 않습니다.');
                return;
            }
            try {
                if (document.fullscreenElement && document.fullscreenElement !== target) {
                    await document.exitFullscreen?.();
                }
                await target.requestFullscreen();
            } catch (error) {
                console.warn('[KPI work team calendar] fullscreen toggle failed', error);
                showToast('전체화면 전환에 실패했습니다.');
            } finally {
                syncWorkTeamCalendarFullscreenUi();
            }
        }

        function ensureWorkTeamCalendarModal() {
            ensureWorkTeamCalendarDateRolloverWatcher();
            let modal = document.getElementById('work-team-calendar-modal');
            if (modal) return modal;
            modal = document.createElement('div');
            modal.id = 'work-team-calendar-modal';
            modal.className = 'work-team-calendar-modal';
            modal.addEventListener('click', event => {
                if (event.target === modal) return;
            });
            if (!window.__workTeamCalendarEscBound) {
                window.__workTeamCalendarEscBound = true;
                document.addEventListener('keydown', event => {
                    if (!document.getElementById('work-team-calendar-modal')?.classList.contains('is-open')) return;
                    if (event.key === 'Escape') {
                        if (isWorkTeamCalendarFullscreen()) {
                            event.preventDefault();
                            event.stopPropagation();
                            void exitWorkTeamCalendarFullscreen();
                            return;
                        }
                        event.preventDefault();
                        event.stopPropagation();
                        const dataKey = WorkState.teamCalendarModal;
                        if (!dataKey) return;
                        if (closeWorkTeamCalendarUtilityPopup(dataKey, { render: false })) {
                            renderWorkTeamCalendarModal();
                            return;
                        }
                        const cleared = clearWorkTeamCalendarSelection(dataKey, { render: false });
                        if (cleared) {
                            renderWorkTeamCalendarModal();
                        } else if (!isWorkTeamCalendarInlineMode()) {
                            closeWorkTeamCalendarModal();
                        }
                        return;
                    }
                    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
                    if (isEditableTarget(event.target)) return;
                    if (event.key >= '1' && event.key <= '9') {
                        if (switchWorkTeamCalendarTeamByNumber(event.key)) {
                            event.preventDefault();
                        }
                    } else if (event.key === 'Delete') {
                        event.preventDefault();
                        void deleteWorkTeamCalendarSelectedEntries();
                    } else if (event.key === 'ArrowLeft') {
                        event.preventDefault();
                        workTeamCalendarNavigateArrow(-1);
                    } else if (event.key === 'ArrowRight') {
                        event.preventDefault();
                        workTeamCalendarNavigateArrow(1);
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        workTeamCalendarNavigateArrow(-7);
                    } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        workTeamCalendarNavigateArrow(7);
                    }
                });
            }
            if (!window.__workTeamCalendarFullscreenBound) {
                window.__workTeamCalendarFullscreenBound = true;
                document.addEventListener('fullscreenchange', () => {
                    syncWorkTeamCalendarFullscreenUi();
                });
            }
            document.body.appendChild(modal);
            return modal;
        }

        function getWorkTeamCalendarInlineHost() {
            return document.getElementById('work-team-calendar-inline-host');
        }

        function isWorkTeamCalendarInlineMode() {
            return WorkState.teamCalendarInline === true && !!getWorkTeamCalendarInlineHost();
        }

        function mountWorkTeamCalendarSurface(options = {}) {
            const modal = ensureWorkTeamCalendarModal();
            const inline = options.inline === true;
            const inlineHost = inline ? getWorkTeamCalendarInlineHost() : null;
            if (inline && inlineHost) {
                if (modal.parentElement !== inlineHost) {
                    inlineHost.appendChild(modal);
                }
                modal.classList.add('is-inline');
                WorkState.teamCalendarInline = true;
                return modal;
            }
            if (modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
            modal.classList.remove('is-inline');
            WorkState.teamCalendarInline = false;
            return modal;
        }

        function syncWorkTeamCalendarInlineIndex(activeDataKey = '') {
            document.querySelectorAll('[data-work-team-index-key]').forEach(button => {
                const isActive = String(button.getAttribute('data-work-team-index-key') || '').trim() === String(activeDataKey || '').trim();
                button.classList.toggle('is-active', isActive);
                button.setAttribute('aria-current', isActive ? 'page' : 'false');
            });
        }

        function getWorkTeamCalendarUtilityPopupMetric(dataKey = WorkState.teamCalendarModal) {
            const raw = String(WorkState.teamCalendarUtilityPopup?.[dataKey] || '').trim().toLowerCase();
            return ['electric', 'gas', 'work'].includes(raw) ? raw : '';
        }

        function closeWorkTeamCalendarUtilityPopup(dataKey = WorkState.teamCalendarModal, options = {}) {
            if (!dataKey || !WorkState.teamCalendarUtilityPopup) return false;
            const hadPopup = !!WorkState.teamCalendarUtilityPopup[dataKey];
            WorkState.teamCalendarUtilityPopup[dataKey] = '';
            if (hadPopup && options.render !== false) {
                renderWorkTeamCalendarModal();
            }
            return hadPopup;
        }

        function openWorkTeamCalendarUtilityPopup(metricKey, options = {}) {
            const dataKey = options.dataKey || WorkState.teamCalendarModal;
            if (!dataKey) return false;
            const normalizedMetric = String(metricKey || '').trim().toLowerCase();
            const isOverviewCalendar = typeof isWorkTeamCalendarOverview === 'function'
                ? isWorkTeamCalendarOverview(dataKey)
                : false;
            const allowedMetrics = isOverviewCalendar ? ['electric', 'gas', 'work'] : ['work'];
            if (!allowedMetrics.includes(normalizedMetric)) return false;
            if (!normalizedMetric) return false;
            const currentMetric = getWorkTeamCalendarUtilityPopupMetric(dataKey);
            const nextMetric = currentMetric === normalizedMetric ? '' : normalizedMetric;
            WorkState.teamCalendarUtilityPopup[dataKey] = nextMetric;
            if (nextMetric) {
                const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
                const state = getWorkTeamCalendarEditorState(dataKey);
                state.open = false;
                state.dateKey = '';
                state.manual = false;
                WorkState.teamCalendarDate[dataKey] = '';
                setWorkTeamCalendarSelectedDateKeys(dataKey, [], monthKey);
                setWorkTeamCalendarExplicitDateSelection(dataKey, false);
            }
            if (options.render !== false) {
                renderWorkTeamCalendarModal();
            }
            return !!nextMetric;
        }

        function renderWorkTeamCalendarInlineContent(category, headerHtml, options = {}) {
            const contentContainer = document.getElementById('content-container');
            const teamCategories = getWorkTeamCalendarCategories();
            const defaultDataKey = String(teamCategories[0]?.dataKey || category.dataKey || '').trim();
            const preferredDataKey = String(options.teamDataKey || WorkState.teamCalendarHubDataKey || category.dataKey || '').trim();
            const activeDataKey = teamCategories.some(item => item?.dataKey === preferredDataKey)
                ? preferredDataKey
                : defaultDataKey;
            contentContainer.innerHTML = `
                <div class="work-team-calendar-inline-shell">
                    <section class="work-team-inline-stage">
                        <div id="work-team-calendar-inline-host" class="work-team-calendar-inline-host"></div>
                    </section>
                </div>
            `;
            if (options.autoOpenModal === false) {
                closeWorkTeamCalendarModal();
            } else {
                syncWorkTeamCalendarInlineIndex(activeDataKey);
                openWorkTeamCalendarModal(activeDataKey, { inline: true });
            }
        }

        function renderWorkTeamCalendarContent(category, headerHtml, options = {}) {
            return renderWorkTeamCalendarInlineContent(category, headerHtml, options);
        }

        function renderWorkTeamCalendarModal() {
            const modal = ensureWorkTeamCalendarModal();
            const dataKey = WorkState.teamCalendarModal;
            const category = getWorkTeamCalendarCategory(dataKey);
            if (!category) {
                closeWorkTeamCalendarModal();
                return;
            }
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return;
            const todayKey = formatDateKey(new Date());
            const focusedDate = getWorkTeamCalendarSelectedDate(dataKey, monthKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            const hasDateSelection = selectedDateKeys.length > 0;
            const isBatchSelection = selectedDateKeys.length > 1;
            const selectedDate = getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey);
            const selectedDateLocked = hasDateSelection && isWorkTeamCalendarDateLocked(selectedDate, todayKey);
            const isOverviewCalendar = typeof isWorkTeamCalendarOverview === 'function'
                ? isWorkTeamCalendarOverview(dataKey)
                : false;
            const utilityPopupMetric = getWorkTeamCalendarUtilityPopupMetric(dataKey);
            const hasUtilityPopup = !!utilityPopupMetric;
            const prevDisabled = monthKey === WORK_TEAM_CALENDAR_RANGE.start ? 'disabled' : '';
            const nextDisabled = monthKey === WORK_TEAM_CALENDAR_RANGE.end ? 'disabled' : '';
            const editorState = getWorkTeamCalendarEditorState(dataKey);
            if (!hasDateSelection || selectedDateLocked) {
                editorState.open = false;
                editorState.dateKey = '';
                editorState.manual = false;
            } else if (editorState.open) {
                editorState.dateKey = selectedDate;
            }
            const workInputActive = false;
            const detailOverlayActive = hasDateSelection && !selectedDateLocked;
            const draft = getWorkTeamCalendarDraftForDates(dataKey, selectedDateKeys);
            const selectedHistoryRecords = getWorkTeamCalendarHistoryRecordsForDates(dataKey, selectedDateKeys);
            const isHistoryKpiRecord = (record) => {
                if (typeof isWorkTeamCalendarHistoryKpi === 'function') {
                    return isWorkTeamCalendarHistoryKpi(record);
                }
                if (typeof window.KpiWorkHistory?.isImportantRecord === 'function') {
                    return window.KpiWorkHistory.isImportantRecord(record);
                }
                if (typeof window.KpiWorkHistory?.isKpiRecord === 'function') {
                    return window.KpiWorkHistory.isKpiRecord(record);
                }
                return String(record?.category || '').trim() === 'KPI'
                    || String(record?.categoryGroup || record?.categoryType || '').trim() === 'report';
            };
            const hasSelectedEntryContent = selectedHistoryRecords.length > 0;
            const hasReadonlyEntryContent = hasSelectedEntryContent && !isOverviewCalendar;
            const selectedHistoryHasKpi = hasSelectedEntryContent && selectedHistoryRecords.some(isHistoryKpiRecord);
            const selectedHistoryKpiCount = hasSelectedEntryContent
                ? selectedHistoryRecords.filter(isHistoryKpiRecord).length
                : 0;
            const historyKpiLabel = window.KpiWorkHistory?.IMPORTANT_FLAG_LABEL || '★';
            const historyKpiPillLabel = window.KpiWorkHistory?.IMPORTANT_FLAG_PILL_LABEL || '★';
            const selectedHistoryCostSummary = hasSelectedEntryContent && typeof getWorkTeamCalendarHistoryCostSummary === 'function'
                ? getWorkTeamCalendarHistoryCostSummary(selectedHistoryRecords)
                : { totalCost: 0, costText: '-' };
            const readonlyEntriesHtml = hasReadonlyEntryContent
                ? (
                    renderWorkTeamCalendarReadonlyEntriesHtml(dataKey, selectedDateKeys)
                )
                : '';
            const memberCountText = getWorkTeamCalendarMemberCountLabel(draft.members.length);
            const selectedMembersHtml = renderWorkTeamCalendarSelectedMembersHtml(draft.members);
            const attachmentListHtml = renderWorkTeamCalendarAttachmentListHtml(draft.attachments, { batch: isBatchSelection });
            const entryTitlePreview = buildWorkTeamCalendarEntryTitle(selectedDate, draft.title);
            const attachmentPreviewLabel = getWorkTeamCalendarAttachmentPreviewLabel(selectedDate, draft.title);
            const monthDates = getMonthMatrix(parsed.year, parsed.monthIndex);
            const monthDateKeys = monthDates
                .filter(date => date.getMonth() === parsed.monthIndex)
                .map(date => formatDateKey(date));
            const productionSummaryMap = getWorkTeamCalendarProductionSummaryMap(dataKey, monthDateKeys);
            const historySummaryMap = getWorkTeamCalendarHistorySummaryMap(dataKey, monthDateKeys);
            const productionGroups = getWorkTeamCalendarProductionGroups(dataKey, selectedDateKeys);
            const productionGroupsHtml = isOverviewCalendar && typeof renderWorkTeamCalendarProductionTeamGroupsHtml === 'function'
                ? renderWorkTeamCalendarProductionTeamGroupsHtml(dataKey, selectedDateKeys, category)
                : renderWorkTeamCalendarProductionGroupsHtml(productionGroups, category, productionSummaryMap);
            const utilityBreakdownHtml = '';
            const productionItemCount = productionGroups.reduce((sum, group) => (
                sum + (Array.isArray(group?.items) ? group.items.length : 0)
            ), 0);
            const productionOverallSummary = summarizeWorkTeamCalendarProductionMetrics(
                productionGroups.flatMap(group => Array.isArray(group?.items) ? group.items : [])
            );
            const selectedProductionSummary = (!isBatchSelection && selectedDate)
                ? (productionSummaryMap.get(selectedDate) || null)
                : null;
            const productionMetricText = productionItemCount > 0
                ? getWorkTeamCalendarProductionMetricLine(productionOverallSummary)
                : (selectedProductionSummary?.isOffday ? '\uD734\uBB34' : '');
            const productionMetricClass = productionItemCount > 0
                ? ''
                : (selectedProductionSummary?.isOffday ? ' is-offday' : '');
            const detailTitle = hasDateSelection
                ? getWorkTeamCalendarSelectionLabel(selectedDateKeys, selectedDate)
                : '';
            let detailSub = isOverviewCalendar
                ? '\uD300\uBCC4 \uC0DD\uC0B0 \uD488\uBAA9 \uBCF4\uAE30'
                : (hasSelectedEntryContent ? '\uC791\uC5C5\uB0B4\uC5ED \uC0C1\uC138' : '');
            let detailCountText = hasSelectedEntryContent
                ? `${formatUtilNumber(selectedHistoryRecords.length, 0)}\uAC74`
                : (
                    productionItemCount > 0
                        ? `${formatUtilNumber(productionOverallSummary.totalAmount || 0, 0)}kg \u00B7 ${formatUtilNumber(productionItemCount, 0)}\uD488\uBAA9`
                        : (selectedProductionSummary?.isOffday ? '-' : (category.emptyProductionLabel || '\uD488\uBAA9 \uC5C6\uC74C'))
                );
            let detailCountBadgeText = hasSelectedEntryContent
                ? (formatUtilNumber(selectedHistoryRecords.length, 0) + '\uAC74' + (selectedHistoryHasKpi ? (' \u00B7 ' + historyKpiLabel + (selectedHistoryKpiCount > 1 ? (' ' + formatUtilNumber(selectedHistoryKpiCount, 0)) : '')) : '') + ' \u00B7 \uBE44\uC6A9 ' + (selectedHistoryCostSummary.costText || '-'))
                : detailCountText;
            if (isOverviewCalendar) {
                detailSub = '\uD300\uBCC4 \uC0DD\uC0B0 \uD488\uBAA9 \uBCF4\uAE30';
                detailCountText = productionItemCount > 0
                    ? `${formatUtilNumber(productionOverallSummary.totalAmount || 0, 0)}kg \u00B7 ${formatUtilNumber(productionItemCount, 0)}\uD488\uBAA9`
                    : (selectedProductionSummary?.isOffday ? '-' : (category.emptyProductionLabel || '\uD488\uBAA9 \uC5C6\uC74C'));
                detailCountBadgeText = detailCountText;
            }
            const isInline = isWorkTeamCalendarInlineMode();
            const isFullscreenActive = isWorkTeamCalendarFullscreen();
            const fullscreenToggleLabel = getWorkTeamCalendarFullscreenLabel(isFullscreenActive);
            const fullscreenToggleHtml = `
                <button
                    type="button"
                    class="work-team-calendar-fullscreen-toggle ${isFullscreenActive ? 'is-active' : ''}"
                    onclick="toggleWorkTeamCalendarFullscreen()"
                    data-action="work-team-calendar-toggle-fullscreen"
                    aria-pressed="${isFullscreenActive ? 'true' : 'false'}"
                    aria-label="${escapeHtml(fullscreenToggleLabel)}"
                    title="${escapeHtml(fullscreenToggleLabel)}"
                >
                    <span class="work-team-calendar-fullscreen-toggle-icon" data-work-team-fullscreen-icon>${getWorkTeamCalendarFullscreenIconSvg(isFullscreenActive)}</span>
                </button>
            `;
            const dialogRole = isInline ? 'region' : 'dialog';
            const dialogModalAttr = isInline ? '' : 'aria-modal="true"';
            const memberToggleHtml = WORK_TEAM_CALENDAR_MEMBERS.map(name => {
                const isActive = draft.members.includes(name);
                return `<button type="button" class="work-team-calendar-member-toggle ${isActive ? 'is-active' : ''}" data-work-team-member-name="${escapeHtml(name)}" aria-pressed="${isActive ? 'true' : 'false'}" ${!hasDateSelection || selectedDateLocked ? 'disabled' : ''}>${escapeHtml(name)}</button>`;
            }).join('');
            const teamSwitchHtml = getWorkTeamCalendarCategories().map(item => `
                <button type="button" class="work-team-calendar-switch ${item.dataKey === dataKey ? 'is-active' : ''}" onclick="switchWorkTeamCalendarTeam('${item.dataKey}')" style="--switch-accent:${item.color || '#2563eb'}; --switch-accent-2:${item.secondaryColor || item.color || '#38bdf8'}; --switch-soft:${item.tint || '#eff6ff'};">
                    <span class="work-team-calendar-switch-glyph">${renderWorkTeamCalendarGlyph(item.productVisual, 'sm')}</span>
                    <span class="work-team-calendar-switch-copy">
                        <span class="work-team-calendar-switch-text">${escapeHtml(item.title)}</span>
                        <span class="work-team-calendar-switch-sub">${escapeHtml(item.processLabel || item.title)}</span>
                    </span>
                </button>
            `).join('');
            const yearOptionHtml = getWorkTeamCalendarYearOptions().map(year => (
                `<option value="${year}" ${String(parsed.year) === String(year) ? 'selected' : ''}>${escapeHtml(String(year))}년</option>`
            )).join('');
            const monthOptionHtml = getWorkTeamCalendarMonthOptionsForYear(parsed.year).map(optionKey => (
                `<option value="${optionKey}" ${optionKey === monthKey ? 'selected' : ''}>${formatWorkTeamCalendarMonthShortLabel(optionKey)}</option>`
            )).join('');
            const utilitySummary = getWorkTeamCalendarUtilitySummary(dataKey, monthKey);
            const isOverviewSummary = isOverviewCalendar === true;
            const isWasteOnlySummary = !isOverviewSummary && !!utilitySummary.waste && !utilitySummary.electric && !utilitySummary.gas;
            const gasChoiceHtml = !isWasteOnlySummary && !isOverviewSummary && utilitySummary.gas.canSelect
                ? `
                    <div class="work-team-calendar-utility-choices" aria-label="가스 기준 선택">
                        <button type="button" class="work-team-calendar-utility-choice ${utilitySummary.gas.mode === 'all' ? 'is-active' : ''}" onclick="setWorkTeamCalendarGasMode('all')">전체</button>
                        <button type="button" class="work-team-calendar-utility-choice ${utilitySummary.gas.mode === 'lng' ? 'is-active' : ''}" onclick="setWorkTeamCalendarGasMode('lng')">LNG</button>
                        <button type="button" class="work-team-calendar-utility-choice ${utilitySummary.gas.mode === 'lpg' ? 'is-active' : ''}" onclick="setWorkTeamCalendarGasMode('lpg')">LPG</button>
                    </div>
                `
                : '';
            const isWorkPopupActive = utilityPopupMetric === 'work';
            const workUtilityChipHtml = `
                <button
                    type="button"
                    class="work-team-calendar-utility-chip is-button${isWorkPopupActive ? ' is-active' : ''}"
                    onclick="openWorkTeamCalendarUtilityPopup('work')"
                    aria-pressed="${isWorkPopupActive ? 'true' : 'false'}"
                    aria-label="작업내역 열기"
                >
                    <span class="work-team-calendar-utility-label">${escapeHtml(utilitySummary.workEntryLabel || '작업내역')}</span>
                    <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.workEntryCountText || '0건')}</span>
                    <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.workCostText || '-')}</span>
                    <span class="work-team-calendar-utility-hint">클릭하여 작업내역 보기</span>
                </button>
            `;
            const wasteUtilityChipHtml = utilitySummary.waste
                ? `
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">폐수 방류량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.waste?.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.waste?.costText || '-')}</span>
                        </div>
                    `
                : '';
            const utilitySummaryHtml = isWasteOnlySummary
                ? `
                    <div class="work-team-calendar-utility-strip">
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">폐수 방류량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.waste?.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.waste?.costText || '-')}</span>
                        </div>
                        ${workUtilityChipHtml}
                    </div>
                `
                : `
                    <div class="work-team-calendar-utility-strip">
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">전기 사용량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.electric.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.electric.costText || '-')}</span>
                        </div>
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">가스 사용량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.gas.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.gas.costText || '-')}</span>
                            ${gasChoiceHtml}
                        </div>
                        ${wasteUtilityChipHtml}
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">총 생산량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.production?.totalAmountText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">${escapeHtml(utilitySummary.production?.itemCountText || '-')}</span>
                        </div>
                        ${workUtilityChipHtml}
                    </div>
                `;
            let utilitySummaryHtmlResolved = isOverviewSummary
                ? `
                    <div class="work-team-calendar-utility-strip">
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">전기 사용량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.electric?.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.electric?.costText || '-')}</span>
                        </div>
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">가스 사용량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.gas?.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.gas?.costText || '-')}</span>
                            ${gasChoiceHtml}
                        </div>
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">폐수 방류량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.waste?.usageText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.waste?.costText || '-')}</span>
                        </div>
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">총생산량</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.production?.totalAmountText || '-')}</span>
                            <span class="work-team-calendar-utility-meta">${escapeHtml(utilitySummary.production?.itemCountText || '-')}</span>
                        </div>
                        <div class="work-team-calendar-utility-chip">
                            <span class="work-team-calendar-utility-label">작업내역</span>
                            <span class="work-team-calendar-utility-value">${escapeHtml(utilitySummary.workEntryCountText || '0 items')}</span>
                            <span class="work-team-calendar-utility-meta">비용 ${escapeHtml(utilitySummary.workCostText || '-')}</span>
                        </div>
                    </div>
                `
                : utilitySummaryHtml;
            let utilityPopupHtml = '';
            if (isOverviewSummary) {
                const utilityBreakdown = typeof buildWorkTeamCalendarOverviewUtilityBreakdown === 'function'
                    ? buildWorkTeamCalendarOverviewUtilityBreakdown(monthKey)
                    : { monthLabel: '', electric: [], gas: [] };
                const renderOverviewUtilityChip = (metricKey, label, valueText, metaText) => {
                    const isActionMetric = metricKey === 'electric' || metricKey === 'gas' || metricKey === 'work';
                    const activeClass = utilityPopupMetric === metricKey ? ' is-active' : '';
                    const hintText = metricKey === 'work'
                        ? '클릭하여 작업내역 보기'
                        : '클릭하여 팀별 상세 보기';
                    const bodyHtml = `
                        <span class="work-team-calendar-utility-label">${escapeHtml(label)}</span>
                        <span class="work-team-calendar-utility-value">${escapeHtml(valueText || '-')}</span>
                        <span class="work-team-calendar-utility-meta">${escapeHtml(metaText || '-')}</span>
                        ${isActionMetric ? `<span class="work-team-calendar-utility-hint">${escapeHtml(hintText)}</span>` : ''}
                    `;
                    if (!isActionMetric) {
                        return `<div class="work-team-calendar-utility-chip">${bodyHtml}</div>`;
                    }
                    return `
                        <button
                            type="button"
                            class="work-team-calendar-utility-chip is-button${activeClass}"
                            onclick="openWorkTeamCalendarUtilityPopup('${metricKey}')"
                            aria-pressed="${utilityPopupMetric === metricKey ? 'true' : 'false'}"
                        >
                            ${bodyHtml}
                        </button>
                    `;
                };
                utilitySummaryHtmlResolved = `
                    <div class="work-team-calendar-utility-strip">
                        ${renderOverviewUtilityChip('electric', '전기 사용량', utilitySummary.electric?.usageText || '-', `비용 ${utilitySummary.electric?.costText || '-'}`)}
                        ${renderOverviewUtilityChip('gas', '가스 사용량', utilitySummary.gas?.usageText || '-', `비용 ${utilitySummary.gas?.costText || '-'}`)}
                        ${renderOverviewUtilityChip('waste', '폐수 방류량', utilitySummary.waste?.usageText || '-', `비용 ${utilitySummary.waste?.costText || '-'}`)}
                        ${renderOverviewUtilityChip('production', '총생산량', utilitySummary.production?.totalAmountText || '-', utilitySummary.production?.itemCountText || '-')}
                        ${renderOverviewUtilityChip('work', '작업내역', utilitySummary.workEntryCountText || '0건', `비용 ${utilitySummary.workCostText || '-'}`)}
                    </div>
                `;
                if (hasUtilityPopup) {
                    if (utilityPopupMetric === 'work') {
                        const workPopupMonthLabel = utilityBreakdown.monthLabel || formatWorkTeamCalendarMonthOptionLabel(monthKey);
                        const workPopupHistoryHtml = renderWorkTeamCalendarGroupedHistoryHtml(dataKey, monthDateKeys);
                        utilityPopupHtml = `
                            <div class="work-team-calendar-overlay-layer">
                                <button type="button" class="work-team-calendar-overlay-backdrop" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="작업내역 팝업 닫기"></button>
                                <div class="work-team-calendar-editor is-floating is-utility-popup" data-work-team-editor>
                                    <div class="work-team-calendar-editor-head">
                                        <div class="work-team-calendar-editor-handle" data-work-team-editor-handle>
                                            <div class="work-team-calendar-editor-title">작업내역</div>
                                            <div class="work-team-calendar-editor-sub">${escapeHtml(workPopupMonthLabel + ' 정리')}</div>
                                        </div>
                                        <div class="work-team-calendar-editor-actions">
                                            <span class="work-team-calendar-editor-count">${escapeHtml(utilitySummary.workEntryCountText || '0건')}</span>
                                            <button type="button" class="work-team-calendar-editor-btn" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="작업내역 팝업 닫기"><i class="fas fa-xmark"></i>닫기</button>
                                        </div>
                                    </div>
                                    <div class="work-team-calendar-field">
                                        <div class="work-team-calendar-field-head">
                                            <span class="work-team-calendar-field-label">월간 작업내역</span>
                                        </div>
                                        <div class="work-team-calendar-utility-popup-total">
                                            <span class="work-team-calendar-utility-popup-total-value">${escapeHtml(utilitySummary.workEntryCountText || '0건')}</span>
                                            <span class="work-team-calendar-utility-popup-total-meta">${escapeHtml(`비용 ${utilitySummary.workCostText || '-'}`)}</span>
                                        </div>
                                        ${workPopupHistoryHtml || '<div class="work-team-calendar-production-empty">조회 가능한 작업내역이 없습니다.</div>'}
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        const utilityPopupItems = (utilityPopupMetric === 'electric'
                            ? (utilityBreakdown.electric || [])
                            : (utilityBreakdown.gas || []))
                            .filter(item => {
                                const detailRows = Array.isArray(item?.detailRows) ? item.detailRows.filter(detail => String(detail?.valueText || '').trim()) : [];
                                if (detailRows.length) return true;
                                return String(item?.valueText || '').trim() && String(item?.valueText || '').trim() !== '-';
                            });
                        const utilityPopupTitle = utilityPopupMetric === 'electric' ? '전기 사용량' : '가스 사용량';
                        const utilityPopupValue = utilityPopupMetric === 'electric'
                            ? (utilitySummary.electric?.usageText || '-')
                            : (utilitySummary.gas?.usageText || '-');
                        const utilityPopupCost = utilityPopupMetric === 'electric'
                            ? (utilitySummary.electric?.costText || '-')
                            : (utilitySummary.gas?.costText || '-');
                        const utilityPopupModeChoices = '';
                        const utilityPopupRowsHtml = utilityPopupItems.length
                            ? utilityPopupItems.map(item => {
                                const detailRows = Array.isArray(item?.detailRows)
                                    ? item.detailRows.filter(detail => String(detail?.valueText || '').trim())
                                    : [];
                                const hasDetailRows = detailRows.length > 0;
                                return `
                                    <div class="work-team-calendar-production-item${hasDetailRows ? ' is-utility-detail-card' : ''}">
                                        <div class="work-team-calendar-production-main">
                                            <div class="work-team-calendar-production-name">${escapeHtml(item.teamLabel || 'Unknown')}</div>
                                            ${hasDetailRows ? `
                                                <div class="work-team-calendar-utility-detail-list">
                                                    ${detailRows.map(detail => `
                                                        <div class="work-team-calendar-utility-detail-row">
                                                            <span class="work-team-calendar-utility-detail-label">${escapeHtml(detail.label || '')}</span>
                                                            <span class="work-team-calendar-utility-detail-value">${escapeHtml(detail.valueText || '-')}</span>
                                                            ${detail.metaText ? `<span class="work-team-calendar-utility-detail-meta">${escapeHtml(detail.metaText)}</span>` : ''}
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            ` : `
                                                <div class="work-team-calendar-production-meta">${escapeHtml(item.metaText || '')}</div>
                                            `}
                                        </div>
                                        ${hasDetailRows ? '' : `<div class="work-team-calendar-production-amount">${escapeHtml(item.valueText || '-')}</div>`}
                                    </div>
                                `;
                            }).join('')
                            : `<div class="work-team-calendar-production-empty">조회 가능한 데이터가 없습니다.</div>`;
                        utilityPopupHtml = `
                            <div class="work-team-calendar-overlay-layer">
                                <button type="button" class="work-team-calendar-overlay-backdrop" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="유틸리티 팝업 닫기"></button>
                                <div class="work-team-calendar-editor is-floating is-utility-popup" data-work-team-editor>
                                    <div class="work-team-calendar-editor-head">
                                        <div class="work-team-calendar-editor-handle" data-work-team-editor-handle>
                                            <div class="work-team-calendar-editor-title">${escapeHtml(utilityPopupTitle)}</div>
                                            <div class="work-team-calendar-editor-sub">${escapeHtml((utilityBreakdown.monthLabel || formatWorkTeamCalendarMonthOptionLabel(monthKey)) + ' 상세')}</div>
                                        </div>
                                        <div class="work-team-calendar-editor-actions">
                                            <span class="work-team-calendar-editor-count">${escapeHtml(`${formatUtilNumber(utilityPopupItems.length, 0)}개`)}</span>
                                            <button type="button" class="work-team-calendar-editor-btn" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="유틸리티 팝업 닫기"><i class="fas fa-xmark"></i>닫기</button>
                                        </div>
                                    </div>
                                    <div class="work-team-calendar-field">
                                        <div class="work-team-calendar-field-head">
                                            <span class="work-team-calendar-field-label">${escapeHtml(utilityPopupTitle)} 상세</span>
                                        </div>
                                        ${utilityPopupModeChoices}
                                        <div class="work-team-calendar-utility-popup-total">
                                            <span class="work-team-calendar-utility-popup-total-value">${escapeHtml(utilityPopupValue)}</span>
                                            <span class="work-team-calendar-utility-popup-total-meta">${escapeHtml(`비용 ${utilityPopupCost}`)}</span>
                                        </div>
                                        <div class="work-team-calendar-team-groups">
                                            <div class="work-team-calendar-team-group">
                                                <div class="work-team-calendar-team-group-head">
                                                    <div class="work-team-calendar-team-group-title">${escapeHtml(utilityPopupTitle)}</div>
                                                    <div class="work-team-calendar-team-group-meta">${escapeHtml((utilityBreakdown.monthLabel || formatWorkTeamCalendarMonthOptionLabel(monthKey)) + ' 합계')}</div>
                                                </div>
                                                <div class="work-team-calendar-production-list">${utilityPopupRowsHtml}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }
            }
            if (!isOverviewSummary && hasUtilityPopup && utilityPopupMetric === 'work') {
                const workPopupMonthLabel = formatWorkTeamCalendarMonthOptionLabel(monthKey);
                const workPopupHistoryHtml = renderWorkTeamCalendarGroupedHistoryHtml(dataKey, monthDateKeys);
                utilityPopupHtml = `
                    <div class="work-team-calendar-overlay-layer">
                        <button type="button" class="work-team-calendar-overlay-backdrop" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="작업내역 팝업 닫기"></button>
                        <div class="work-team-calendar-editor is-floating is-utility-popup" data-work-team-editor>
                            <div class="work-team-calendar-editor-head">
                                <div class="work-team-calendar-editor-handle" data-work-team-editor-handle>
                                    <div class="work-team-calendar-editor-title">${escapeHtml((category.title || '팀') + ' 작업내역')}</div>
                                    <div class="work-team-calendar-editor-sub">${escapeHtml(workPopupMonthLabel + ' 정리')}</div>
                                </div>
                                <div class="work-team-calendar-editor-actions">
                                    <span class="work-team-calendar-editor-count">${escapeHtml(utilitySummary.workEntryCountText || '0건')}</span>
                                    <button type="button" class="work-team-calendar-editor-btn" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="작업내역 팝업 닫기"><i class="fas fa-xmark"></i>닫기</button>
                                </div>
                            </div>
                            <div class="work-team-calendar-field">
                                <div class="work-team-calendar-field-head">
                                    <span class="work-team-calendar-field-label">월간 작업내역</span>
                                </div>
                                <div class="work-team-calendar-utility-popup-total">
                                    <span class="work-team-calendar-utility-popup-total-value">${escapeHtml(utilitySummary.workEntryCountText || '0건')}</span>
                                    <span class="work-team-calendar-utility-popup-total-meta">${escapeHtml(`비용 ${utilitySummary.workCostText || '-'}`)}</span>
                                </div>
                                ${workPopupHistoryHtml || '<div class="work-team-calendar-production-empty">조회 가능한 작업내역이 없습니다.</div>'}
                            </div>
                        </div>
                    </div>
                `;
            }
            function buildWorkTeamCalendarHistoryCueHtml(count, kpiCount) {
                const historyCount = Number(count || 0);
                const historyKpiCount = Number(kpiCount || 0);
                if (historyCount <= 0) return '';
                if (historyCount === 1 && historyKpiCount === 1) return '';
                return `<span class="work-team-calendar-day-summary">${escapeHtml(formatUtilNumber(historyCount, 0) + '건')}</span>`;
            }
            const weekdayHtml = WORK_DAY_LABELS.map(label => `<div class="work-team-calendar-weekday">${label}</div>`).join('');
            const dayCells = monthDates.map(date => {
                const dateKey = formatDateKey(date);
                const inMonth = date.getMonth() === parsed.monthIndex;
                const isLocked = inMonth && isWorkTeamCalendarDateLocked(dateKey, todayKey);
                const productionSummary = inMonth ? (productionSummaryMap.get(dateKey) || null) : null;
                const historySummary = inMonth ? (historySummaryMap.get(dateKey) || null) : null;
                const historyCount = Number(historySummary?.count || 0);
                const historyKpiCount = Number(historySummary?.kpiCount || 0);
                const historyHasKpi = inMonth && historyKpiCount > 0;
                const hasHistory = inMonth && historyCount > 0;
                const isOffday = inMonth && !!productionSummary?.isOffday;
                const classes = [
                    'work-team-calendar-day',
                    inMonth ? '' : 'is-out',
                    dateKey === todayKey ? 'is-today' : '',
                    selectedDateKeys.includes(dateKey) ? 'is-selected' : '',
                    isLocked ? 'is-locked' : '',
                    hasHistory ? 'is-filled' : '',
                    isOffday ? 'is-offday' : ''
                ].filter(Boolean).join(' ');
                const flagParts = [];
                if (inMonth && isLocked) {
                    flagParts.push(`<span class="work-team-calendar-day-flag">잠금</span>`);
                } else if (inMonth && isOffday) {
                    flagParts.push(`<span class="work-team-calendar-day-flag is-offday"><i class="fas fa-calendar-minus"></i>휴무</span>`);
                } else {
                    if (inMonth && dateKey === todayKey) {
                        flagParts.push(`<span class="work-team-calendar-day-flag">오늘</span>`);
                    }
                    if (historyHasKpi) {
                        const kpiFlagLabel = historyKpiCount > 1 ? `${historyKpiPillLabel} ${formatUtilNumber(historyKpiCount, 0)}` : historyKpiPillLabel;
                        flagParts.push(`<span class="work-team-calendar-day-flag is-kpi">${escapeHtml(kpiFlagLabel)}</span>`);
                    }
                }
                const productionCount = Number(productionSummary?.count || 0);
                const totalAmount = Number(productionSummary?.totalAmount || 0);
                let cueHtml = '';
                if (isOffday) {
                    cueHtml = '';
                } else if (productionCount > 0) {
                    const productionLabel = totalAmount > 0
                        ? `${formatUtilNumber(totalAmount, 0)}kg`
                        : `${formatUtilNumber(productionCount, 0)}\uD488\uBAA9`;
                    cueHtml = `<span class="work-team-calendar-day-summary">${escapeHtml(productionLabel)}</span>`;
                } else if (hasHistory) {
                    cueHtml = '';
                } else if (isLocked) {
                    cueHtml = `<span class="work-team-calendar-day-summary">\uAE30\uB85D \uC5C6\uC74C</span>`;
                }
                if (!isOffday && hasHistory) {
                    const historyCueHtml = buildWorkTeamCalendarHistoryCueHtml(historyCount, historyKpiCount);
                    if (productionCount > 0) {
                        const productionCueMatch = String(cueHtml || '').match(/^(<span class="work-team-calendar-day-summary">.*?<\/span>)/);
                        const productionCueHtml = productionCueMatch ? productionCueMatch[1] : '';
                        cueHtml = `${productionCueHtml}${historyCueHtml}`;
                    } else {
                        cueHtml = historyCueHtml;
                    }
                }
                return `
                    <button type="button" class="${classes}" data-work-team-date="${inMonth ? escapeHtml(dateKey) : ''}" ${inMonth && !isLocked ? `onclick="workTeamCalendarSelectDate('${dateKey}', event)"` : 'disabled'}>
                        <div class="work-team-calendar-day-top">
                            <div class="work-team-calendar-day-main">
                                <span class="work-team-calendar-day-number">${date.getDate()}</span>
                                ${cueHtml}
                            </div>
                            <span class="work-team-calendar-day-flag-slot">${flagParts.join('') || '<span class="work-team-calendar-day-flag is-placeholder" aria-hidden="true">.</span>'}</span>
                        </div>
                    </button>
                `;
            }).join('');
            modal.innerHTML = `
                <div class="work-team-calendar-dialog ${isInline ? 'is-inline' : ''}" role="${dialogRole}" ${dialogModalAttr} aria-label="${escapeHtml(category.title)} \uCE98\uB9B0\uB354" style="--team-accent:${category.color || '#2563eb'}; --team-accent-2:${category.secondaryColor || category.color || '#38bdf8'}; --team-tint:${category.tint || '#eff6ff'};">
                    <div class="work-team-calendar-topbar">
                        <div class="work-team-calendar-head">
                            <div class="work-team-calendar-brand">
                                <div class="work-team-calendar-brand-copy">
                                    <div class="work-team-calendar-brand-title">${escapeHtml(category.title)} \uCE98\uB9B0\uB354</div>
                                    <div class="work-team-calendar-brand-sub">${escapeHtml(category.processLabel || category.title)} \u00B7 ${getWorkTeamCalendarRangeLabel()}</div>
                                </div>
                            </div>
                            ${isInline ? '' : `<div class="work-team-calendar-switches">${teamSwitchHtml}</div>`}
                            <div class="work-team-calendar-head-actions">
                                ${fullscreenToggleHtml}
                                ${isInline ? '' : `<button type="button" class="work-team-calendar-close" onclick="closeWorkTeamCalendarModal()" aria-label="\uB2EB\uAE30"><i class="fas fa-xmark"></i></button>`}
                            </div>
                        </div>
                        <div class="work-team-calendar-toolbar">
                            <div class="work-team-calendar-nav">
                                <button type="button" class="work-team-calendar-arrow" data-work-team-arrow-step="-1" onclick="workTeamCalendarMoveMonth(-1)" ${prevDisabled} aria-label="\uC774\uC804\uB2EC"><i class="fas fa-chevron-left"></i></button>
                                <select class="work-team-calendar-select" onchange="workTeamCalendarSelectYear(this.value)">${yearOptionHtml}</select>
                                <select class="work-team-calendar-select" onchange="workTeamCalendarSelectMonth(this.value)">${monthOptionHtml}</select>
                                <button type="button" class="work-team-calendar-arrow" data-work-team-arrow-step="1" onclick="workTeamCalendarMoveMonth(1)" ${nextDisabled} aria-label="\uB2E4\uC74C\uB2EC"><i class="fas fa-chevron-right"></i></button>
                                ${utilitySummaryHtmlResolved}
                            </div>
                            <div class="work-team-calendar-meta"></div>
                        </div>
                    </div>
                    <div class="work-team-calendar-main">
                        <div class="work-team-calendar-board" data-work-team-board>
                            <div class="work-team-calendar-grid">
                                ${weekdayHtml}
                                ${dayCells}
                            </div>
                            ${detailOverlayActive ? `
                                <div class="work-team-calendar-overlay-layer">
                                    <button type="button" class="work-team-calendar-overlay-backdrop" onclick="clearWorkTeamCalendarSelection()" aria-label="선택 닫기"></button>
                                    <div class="work-team-calendar-editor is-floating ${workInputActive ? 'is-work-active' : ''}" data-work-team-editor>
                                        <div class="work-team-calendar-editor-head">
                                            <div class="work-team-calendar-editor-handle" data-work-team-editor-handle>
                                                ${detailTitle ? `<div class="work-team-calendar-editor-title">${escapeHtml(detailTitle)}</div>` : ''}
                                                ${detailSub ? `<div class="work-team-calendar-editor-sub">${escapeHtml(detailSub)}</div>` : ''}
                                            </div>
                                            <div class="work-team-calendar-editor-actions">
                                                <span class="work-team-calendar-editor-count" data-work-team-member-count>${escapeHtml(detailCountBadgeText)}</span>
                                                ${workInputActive ? `
                                                    <label class="work-team-calendar-editor-btn">
                                                        <i class="fas fa-paperclip"></i>첨부
                                                        <input type="file" class="work-team-calendar-file-input" accept=".ppt,.pptx,.xls,.xlsx,.pdf,.doc,.docx,.hwp,.hwpx" multiple onchange="handleWorkTeamCalendarAttachmentInput(this)">
                                                    </label>
                                                    <button type="button" class="work-team-calendar-editor-btn is-danger" onclick="deleteWorkTeamCalendarSelectedEntries()" ${hasSelectedEntryContent ? 'title="\uC120\uD0DD\uD55C \uC791\uC5C5\uB0B4\uC5ED\uC744 \uC0AD\uC81C\uD569\uB2C8\uB2E4."' : 'disabled title="\uC0AD\uC81C\uD560 \uC791\uC5C5\uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."'}><i class="fas fa-trash-can"></i>${escapeHtml(isBatchSelection ? '\uC120\uD0DD \uC0AD\uC81C' : '\uC791\uC5C5\uB0B4\uC5ED \uC0AD\uC81C')}</button>
                                                    <button type="button" class="work-team-calendar-editor-btn is-primary" onclick="completeWorkTeamCalendarEditor()"><i class="fas fa-check"></i>완료</button>
                                                    <button type="button" class="work-team-calendar-editor-btn" onclick="closeWorkTeamCalendarEditor()" aria-label="닫기"><i class="fas fa-xmark"></i></button>
                                                ` : ''}
                                            </div>
                                        </div>
                                        ${workInputActive ? `
                                            <div class="work-team-calendar-field">
                                                <div class="work-team-calendar-field-head">
                                                    <span class="work-team-calendar-field-label">인원</span>
                                                    <span class="work-team-calendar-field-hint">Ctrl+클릭으로 여러 날짜를 함께 선택할 수 있습니다.</span>
                                                </div>
                                                <div class="work-team-calendar-member-grid" data-work-team-member-grid>
                                                    ${memberToggleHtml}
                                                </div>
                                                <div class="work-team-calendar-selected-list" data-work-team-selected-list>${selectedMembersHtml}</div>
                                            </div>
                                            <div class="work-team-calendar-field is-split">
                                                <label class="work-team-calendar-field">
                                                    <span class="work-team-calendar-field-label">제목</span>
                                                    <input type="text" class="work-team-calendar-input" placeholder="제목 입력" value="${escapeHtml(draft.title)}" oninput="updateWorkTeamCalendarTitle(this.value)">
                                                </label>
                                                <div class="work-team-calendar-field">
                                                    <span class="work-team-calendar-field-label">제목 미리보기</span>
                                                    <span class="work-team-calendar-title-preview"><i class="fas fa-tag"></i><span data-work-team-title-preview>${escapeHtml(entryTitlePreview)}</span></span>
                                                </div>
                                            </div>
                                            <label class="work-team-calendar-field">
                                                <span class="work-team-calendar-field-label">작업내역</span>
                                                <textarea class="work-team-calendar-textarea is-main" placeholder="작업내역 입력" oninput="updateWorkTeamCalendarNote(this.value)">${escapeHtml(draft.note)}</textarea>
                                            </label>
                                            <div class="work-team-calendar-field">
                                                <div class="work-team-calendar-field-head">
                                                    <span class="work-team-calendar-field-label">첨부파일</span>
                                                    <span class="work-team-calendar-field-hint">작업내역 폴더를 연결해 첨부파일을 관리합니다.</span>
                                                </div>
                                                <div class="work-team-calendar-storage-actions">
                                                    <button type="button" class="work-team-calendar-attachment-btn" data-work-team-connect-btn onclick="connectWorkEntryFolderFromCalendar()"><i class="fas fa-link"></i>폴더 연결</button>
                                                    <span class="work-team-calendar-storage-status ${WorkState.workEntryRootConnected ? 'is-connected' : ''}" data-work-team-storage-status>${WorkState.workEntryRootConnected ? '폴더 연결됨' : '폴더 미연결'}</span>
                                                </div>
                                                <div class="work-team-calendar-storage-note">폴더: <strong>${escapeHtml(WORK_ENTRY_FOLDER_NAME)}</strong> / 미리보기: <strong data-work-team-file-preview>${escapeHtml(attachmentPreviewLabel)}</strong></div>
                                                <div class="work-team-calendar-attachment-list" data-work-team-attachment-list>${attachmentListHtml}</div>
                                            </div>
                                            <div class="work-team-calendar-field">
                                                <span class="work-team-calendar-field-label">특이사항</span>
                                                <textarea class="work-team-calendar-textarea is-remark" placeholder="특이사항 입력" oninput="updateWorkTeamCalendarRemark(this.value)">${escapeHtml(draft.remark)}</textarea>
                                            </div>
                                        ` : ''}
                                        ${utilityBreakdownHtml ? `
                                            <div class="work-team-calendar-field">
                                                <div class="work-team-calendar-field-head">
                                                    <span class="work-team-calendar-field-label">팀별 유틸리티 합계</span>
                                                </div>
                                                ${utilityBreakdownHtml}
                                            </div>
                                        ` : ''}
                                        ${readonlyEntriesHtml ? `
                                            <div class="work-team-calendar-field">
                                                <div class="work-team-calendar-field-head">
                                                    <span class="work-team-calendar-field-label">${isOverviewCalendar ? '통합 작업내역' : '작업내역'}</span>
                                                </div>
                                                ${readonlyEntriesHtml}
                                            </div>
                                        ` : ''}
                                        <div class="work-team-calendar-field">
                                            <div class="work-team-calendar-field-head" style="justify-content:${isOverviewCalendar ? 'space-between' : 'flex-end'};">
                                                ${isOverviewCalendar ? '<span class="work-team-calendar-field-label">팀별 생산 품목</span>' : ''}
                                                <button type="button" class="work-team-calendar-editor-btn" onclick="clearWorkTeamCalendarSelection()" aria-label="선택 해제"><i class="fas fa-xmark"></i>선택 해제</button>
                                            </div>
                                            ${productionMetricText ? `<div class="work-team-calendar-production-summary${productionMetricClass}">${escapeHtml(productionMetricText)}</div>` : ''}
                                            <div class="work-team-calendar-production-groups">${productionGroupsHtml}</div>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                            ${utilityPopupHtml}
                        </div>
                    </div>
                </div>
            `;
            bindWorkTeamCalendarMemberPicker(modal, dataKey, selectedDate);
            bindWorkTeamCalendarEditorOverlay(modal, dataKey);
            refreshWorkTeamCalendarStorageStatus(modal);
            syncWorkTeamCalendarInlineIndex(dataKey);
            syncWorkTeamCalendarFullscreenUi();
        }

        function openWorkTeamCalendarEditor(dateKey, options = {}) {
            const dataKey = options.dataKey || WorkState.teamCalendarModal;
            const normalizedDateKey = String(dateKey || '').trim();
            if (!dataKey || !normalizedDateKey || isWorkTeamCalendarDateLocked(normalizedDateKey)) return false;
            WorkState.teamCalendarDate[dataKey] = normalizedDateKey;
            if (Array.isArray(options.members)) {
                applyWorkTeamCalendarMembers(dataKey, normalizedDateKey, options.members, {
                    markModified: options.markModified !== false,
                    render: false
                });
            }
            const state = getWorkTeamCalendarEditorState(dataKey);
            const dateChanged = state.dateKey !== normalizedDateKey;
            state.open = true;
            state.dateKey = normalizedDateKey;
            state.manual = options.manual === true;
            if (options.resetPosition === true || dateChanged) {
                resetWorkTeamCalendarEditorPosition(dataKey);
            }
            if (options.render !== false) {
                renderWorkTeamCalendarModal();
            }
            return true;
        }

        function closeWorkTeamCalendarEditor(dataKey = WorkState.teamCalendarModal, options = {}) {
            if (!dataKey) return;
            const state = getWorkTeamCalendarEditorState(dataKey);
            state.open = false;
            state.dateKey = '';
            state.manual = false;
            if (options.render !== false) {
                renderWorkTeamCalendarModal();
            }
        }

        function completeWorkTeamCalendarEditor() {
            closeWorkTeamCalendarEditor();
        }

        function clearWorkTeamCalendarSelection(dataKey = WorkState.teamCalendarModal, options = {}) {
            if (!dataKey) return false;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            const hadSelection = selectedDateKeys.length > 0 || hasWorkTeamCalendarExplicitDateSelection(dataKey);
            const state = getWorkTeamCalendarEditorState(dataKey);
            state.open = false;
            state.dateKey = '';
            state.manual = false;
            WorkState.teamCalendarDate[dataKey] = '';
            setWorkTeamCalendarSelectedDateKeys(dataKey, [], monthKey);
            setWorkTeamCalendarExplicitDateSelection(dataKey, false);
            if (options.render !== false) {
                renderWorkTeamCalendarModal();
            }
            return hadSelection;
        }

        function openWorkTeamCalendarModal(dataKey, options = {}) {
            const inline = options.inline === true || (options.inline !== false && isWorkTeamCalendarInlineMode());
            WorkState.teamCalendarModal = dataKey;
            WorkState.teamCalendarHubDataKey = dataKey;
            WorkState.teamCalendarUtilityPopup[dataKey] = '';
            const modal = mountWorkTeamCalendarSurface({ inline });
            const state = getWorkTeamCalendarEditorState(dataKey);
            state.open = false;
            state.dateKey = '';
            state.manual = false;
            setWorkTeamCalendarSelectedDateKeys(dataKey, [], getWorkTeamCalendarActiveMonth(dataKey));
            setWorkTeamCalendarExplicitDateSelection(dataKey, false);
            modal.classList.add('is-open');
            document.body.style.overflow = inline ? '' : 'hidden';
            renderWorkTeamCalendarModal();
        }

        async function closeWorkTeamCalendarModal() {
            await exitWorkTeamCalendarFullscreen();
            const currentKey = WorkState.teamCalendarModal;
            if (currentKey) {
                const state = getWorkTeamCalendarEditorState(currentKey);
                state.open = false;
                state.dateKey = '';
                state.manual = false;
                setWorkTeamCalendarSelectedDateKeys(currentKey, [], getWorkTeamCalendarActiveMonth(currentKey));
                setWorkTeamCalendarExplicitDateSelection(currentKey, false);
                WorkState.teamCalendarUtilityPopup[currentKey] = '';
            }
            const modal = document.getElementById('work-team-calendar-modal');
            if (modal) {
                modal.classList.remove('is-open');
                modal.classList.remove('is-inline');
                if (modal.parentElement && modal.parentElement !== document.body) {
                    modal.remove();
                }
            }
            WorkState.teamCalendarModal = '';
            WorkState.teamCalendarInline = false;
            document.body.style.overflow = '';
            syncWorkTeamCalendarInlineIndex('');
        }

        function switchWorkTeamCalendarTeam(targetDataKey) {
            const currentKey = WorkState.teamCalendarModal;
            const currentMonth = currentKey ? getWorkTeamCalendarActiveMonth(currentKey) : getWorkTeamCalendarDefaultMonth();
            const currentDate = currentKey ? getWorkTeamCalendarSelectedDate(currentKey, currentMonth) : `${currentMonth}-01`;
            const inline = isWorkTeamCalendarInlineMode();
            setWorkTeamCalendarActiveMonthState(targetDataKey, currentMonth);
            setWorkTeamCalendarFocusedDateState(targetDataKey, currentDate);
            WorkState.teamCalendarHubDataKey = targetDataKey;
            setWorkTeamCalendarSelectedDateKeys(targetDataKey, [], currentMonth);
            const nextEditorState = getWorkTeamCalendarEditorState(targetDataKey);
            nextEditorState.open = false;
            nextEditorState.dateKey = '';
            nextEditorState.manual = false;
            setWorkTeamCalendarExplicitDateSelection(targetDataKey, false);
            openWorkTeamCalendarModal(targetDataKey, { inline });
            if (typeof renderSidebar === 'function') {
                renderSidebar();
            }
        }

        function switchWorkTeamCalendarTeamByNumber(numberKey) {
            const index = Number(numberKey) - 1;
            if (!Number.isFinite(index) || index < 0) return false;
            if (activeSectionId !== 'work') return false;
            const target = getWorkTeamCalendarCategories()[index] || null;
            if (!target?.dataKey) return false;
            switchWorkTeamCalendarTeam(target.dataKey);
            return true;
        }

        function toggleWorkTeamCalendarWorkInput() {
            return false;
        }

        function updateWorkTeamCalendarAttachments(dataKey, dateKey, attachments, options = {}) {
            if (!dataKey || !dateKey || isWorkTeamCalendarDateLocked(dateKey)) return false;
            const nextAttachments = normalizeWorkTeamCalendarAttachments(attachments);
            const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
            if (JSON.stringify(currentDraft.attachments) === JSON.stringify(nextAttachments)) return false;
            const data = getWorkTeamCalendarData(dataKey);
            const draft = ensureWorkTeamCalendarDraft(dataKey, dateKey);
            draft.attachments = nextAttachments;
            cleanupWorkTeamCalendarDraft(dataKey, dateKey);
            saveWorkData(dataKey, data);
            syncWorkTeamCalendarDraftUi(dataKey, dateKey);
            if (options.markModified !== false) {
                const category = getWorkTeamCalendarCategory(dataKey);
                setLastModified(category?.title || AppData?.work?.name || 'Work Calendar');
            }
            if (options.render === true) {
                renderWorkTeamCalendarModal();
            }
            return true;
        }

        async function handleWorkTeamCalendarAttachmentInput(input) {
            const files = Array.from(input?.files || []);
            if (input) input.value = '';
            if (!files.length) return;
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const dateKeys = getWorkTeamCalendarEditorDateKeys(dataKey, monthKey);
            if (!dateKeys.length) {
                alert('날짜를 먼저 선택해 주세요.');
                return;
            }
            try {
                const serverRuntime = getWorkAttachmentServerRuntimeConfig(dataKey);
                const useServerStorage = !!(serverRuntime && serverRuntime.writeEnabled === true);
                const folderHandle = useServerStorage ? null : await getWorkEntryFolderHandle({ prompt: true });
                if (!useServerStorage && !folderHandle) {
                    throw new Error('작업내역 폴더를 찾을 수 없습니다.');
                }
                for (const dateKey of dateKeys) {
                    if (isWorkTeamCalendarDateLocked(dateKey)) continue;
                    const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
                    const nextAttachments = currentDraft.attachments.slice();
                    for (const file of files) {
                        const extensionMatch = /(\.[^.]+)$/.exec(file.name || '');
                        const requestedName = `${buildWorkTeamCalendarAttachmentBaseName(dateKey, currentDraft.title, file.name || '')}${extensionMatch ? extensionMatch[1] : ''}`;
                        if (useServerStorage) {
                            const uploaded = await uploadWorkAttachmentToServer(dataKey, dateKey, file, {
                                fileName: requestedName
                            });
                            if (!uploaded) {
                                throw new Error('work_attachment_server_upload_failed');
                            }
                            nextAttachments.push(uploaded);
                        } else {
                            const finalName = await ensureUniqueWorkEntryFileName(folderHandle, requestedName);
                            const fileHandle = await folderHandle.getFileHandle(finalName, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(file);
                            await writable.close();
                            nextAttachments.push({
                                fileName: finalName,
                                name: finalName,
                                type: normalizeAreaAssetType(file.type, finalName),
                                relativePath: `${WORK_ENTRY_FOLDER_NAME}/${finalName}`,
                                storage: 'directory',
                                originalName: file.name || finalName
                            });
                        }
                    }
                    updateWorkTeamCalendarAttachments(dataKey, dateKey, nextAttachments, { render: false, markModified: false });
                }
                const category = getWorkTeamCalendarCategory(dataKey);
                setLastModified(category?.title || AppData?.work?.name || 'Work Calendar');
                renderWorkTeamCalendarModal();
            } catch (error) {
                alert(`Attachment update failed: ${error?.message || 'Unknown error'}`);
            }
        }

        function isLegacyWorkTeamCalendarDirectoryAttachment(target) {
            if (!target) return false;
            if (target.documentId || target.assetId || target.storage === 'server') return false;
            return !!String(target.fileName || '').trim();
        }

        function assertWorkTeamCalendarLegacyAttachmentAllowed(dataKey, target) {
            const serverRuntime = getWorkAttachmentServerRuntimeConfig(dataKey);
            const serverAuthorityEnabled = !!(serverRuntime && (serverRuntime.readEnabled === true || serverRuntime.writeEnabled === true));
            if (!serverAuthorityEnabled || !isLegacyWorkTeamCalendarDirectoryAttachment(target)) return;
            throw new Error('서버화 이전 로컬 폴더 첨부입니다. 현재 서버 모드에서는 로컬 폴더 fallback을 다시 열지 않습니다. 원본 파일을 서버 첨부로 다시 올려 주세요.');
        }

        async function deleteWorkTeamCalendarAttachmentStorage(target, folderHandle = null, dataKey = WorkState.teamCalendarModal) {
            if (!target) return;
            assertWorkTeamCalendarLegacyAttachmentAllowed(dataKey, target);
            if (target.documentId || target.storage === 'server') {
                await deleteWorkAttachmentFromServer(target);
                return;
            }
            if (target.assetId) {
                await deleteAreaAssetRecord(target.assetId);
                return;
            }
            if (!target.fileName) return;
            const resolvedFolderHandle = folderHandle || await getWorkEntryFolderHandle({ prompt: true });
            if (!resolvedFolderHandle) {
                throw new Error('작업내역 폴더를 찾을 수 없습니다.');
            }
            try {
                await resolvedFolderHandle.removeEntry(target.fileName);
            } catch (error) {
                const message = String(error?.message || '').toLowerCase();
                if (error?.name === 'NotFoundError' || message.includes('not found')) {
                    return;
                }
                throw error;
            }
        }

        async function deleteWorkTeamCalendarSelectedEntries() {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            if (!selectedDateKeys.length) return;
            const deletableDateKeys = selectedDateKeys.filter(dateKey => !isWorkTeamCalendarDateLocked(dateKey));
            if (!deletableDateKeys.length) {
                alert('삭제할 수 있는 작업내역이 없습니다.');
                return;
            }
            const entries = deletableDateKeys.map(dateKey => ({
                dateKey,
                draft: getWorkTeamCalendarDraftSnapshot(dataKey, dateKey)
            })).filter(item => hasWorkTeamCalendarDraftContent(item.draft));
            if (!entries.length) {
                alert('삭제할 작업내역이 없습니다.');
                return;
            }
            const isBatch = entries.length > 1;
            const message = isBatch
                ? `${entries.length}개 날짜의 작업내역을 삭제할까요? 첨부파일도 함께 삭제됩니다.`
                : `${formatWorkTeamCalendarDateLabel(entries[0].dateKey)} 작업내역을 삭제할까요? 첨부파일도 함께 삭제됩니다.`;
            if (!confirm(message)) return;
            let folderHandle = null;
            try {
                const hasLegacyDirectoryAttachment = entries.some(item => normalizeWorkTeamCalendarAttachments(item.draft.attachments).some(att => {
                    try {
                        assertWorkTeamCalendarLegacyAttachmentAllowed(dataKey, att);
                        return false;
                    } catch (error) {
                        return true;
                    }
                }));
                if (hasLegacyDirectoryAttachment) {
                    throw new Error('서버화 이전 로컬 폴더 첨부가 포함되어 있습니다. 이 첨부는 먼저 서버 첨부로 다시 올린 뒤 정리해 주세요.');
                }
                const needsFolderAccess = entries.some(item => normalizeWorkTeamCalendarAttachments(item.draft.attachments).some(att => !att.documentId && !att.assetId && att.fileName));
                if (needsFolderAccess) {
                    folderHandle = await getWorkEntryFolderHandle({ prompt: true });
                }
                for (const entry of entries) {
                    const attachments = normalizeWorkTeamCalendarAttachments(entry.draft.attachments);
                    for (const attachment of attachments) {
                        await deleteWorkTeamCalendarAttachmentStorage(attachment, folderHandle, dataKey);
                    }
                    const data = getWorkTeamCalendarData(dataKey);
                    const workEntries = ensureWorkTeamCalendarEntries(dataKey);
                    delete workEntries[entry.dateKey];
                    saveWorkData(dataKey, data);
                }
                closeWorkTeamCalendarEditor(dataKey, { render: false });
                const category = getWorkTeamCalendarCategory(dataKey);
                setLastModified(category?.title || AppData?.work?.name || 'Work Calendar');
                renderWorkTeamCalendarModal();
            } catch (error) {
                alert(`Save failed: ${error?.message || 'Unknown error'}`);
            }
        }

        async function removeWorkTeamCalendarAttachment(refKey) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            if (selectedDateKeys.length !== 1) {
                alert('첨부 삭제는 날짜를 하나만 선택했을 때 가능합니다.');
                return;
            }
            const dateKey = selectedDateKeys[0];
            const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
            const target = findWorkTeamCalendarAttachment(currentDraft, refKey);
            if (!target) return;
            const targetKey = target.documentId || target.assetId || target.fileName || target.relativePath;
            const nextAttachments = currentDraft.attachments.filter(item => (item.documentId || item.assetId || item.fileName || item.relativePath) !== targetKey);
            try {
                await deleteWorkTeamCalendarAttachmentStorage(target, null, dataKey);
            } catch (error) {
                alert(`Attachment delete failed: ${error?.message || 'Unknown error'}`);
                return;
            }
            updateWorkTeamCalendarAttachments(dataKey, dateKey, nextAttachments, { render: true });
        }

        async function openWorkTeamCalendarAttachment(refKey) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            if (selectedDateKeys.length !== 1) {
                alert('첨부 열기는 날짜를 하나만 선택했을 때 가능합니다.');
                return;
            }
            const dateKey = selectedDateKeys[0];
            const currentDraft = getWorkTeamCalendarDraftSnapshot(dataKey, dateKey);
            const target = findWorkTeamCalendarAttachment(currentDraft, refKey);
            if (!target) {
                alert('첨부 파일을 찾을 수 없습니다.');
                return;
            }
            let url = '';
            try {
                assertWorkTeamCalendarLegacyAttachmentAllowed(dataKey, target);
                if (target.documentId || target.storage === 'server') {
                    url = getWorkAttachmentViewUrl(target);
                } else if (target.assetId) {
                    url = await getAreaAssetObjectUrl(target.assetId);
                } else {
                    const folderHandle = await getWorkEntryFolderHandle({ prompt: true });
                    if (folderHandle && target.fileName) {
                        const fileHandle = await folderHandle.getFileHandle(target.fileName);
                        const file = await fileHandle.getFile();
                        url = URL.createObjectURL(file);
                    }
                }
            } catch (error) {
                alert(`Attachment preview failed: ${error?.message || 'Unknown error'}`);
                return;
            }
            if (!url) {
                alert('첨부 파일을 열 수 없습니다.');
                return;
            }
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (!opened) {
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.click();
            }
            if (!target.assetId && !target.documentId && target.storage !== 'server') {
                window.setTimeout(() => URL.revokeObjectURL(url), 30000);
            }
        }

        function bindWorkTeamCalendarMemberPicker(modal, dataKey, dateKey) {
            const grid = modal?.querySelector?.('[data-work-team-member-grid]');
            if (!grid) return;
            const getButton = target => target?.closest?.('[data-work-team-member-name]');
            const getMemberName = target => String(getButton(target)?.getAttribute('data-work-team-member-name') || '').trim();
            grid.addEventListener('click', event => {
                const memberName = getMemberName(event.target);
                if (!memberName) return;
                event.preventDefault();
                if (event.ctrlKey || event.metaKey) {
                    toggleWorkTeamCalendarMember(memberName, { dataKey, dateKey, render: true });
                    return;
                }
                selectWorkTeamCalendarSingle(memberName, { dataKey, dateKey, render: true });
            });
        }

        function bindWorkTeamCalendarEditorOverlay(modal, dataKey) {
            const editor = modal?.querySelector?.('[data-work-team-editor]');
            const handle = modal?.querySelector?.('[data-work-team-editor-handle]');
            const board = modal?.querySelector?.('[data-work-team-board]');
            if (!editor || !handle || !board || !editor.classList.contains('is-floating')) return;
            const clampPosition = (left, top) => {
                const margin = 12;
                const boardRect = board.getBoundingClientRect();
                const editorRect = editor.getBoundingClientRect();
                const maxLeft = Math.max(margin, boardRect.width - editorRect.width - margin);
                const maxTop = Math.max(margin, boardRect.height - editorRect.height - margin);
                return {
                    left: Math.min(Math.max(margin, left), maxLeft),
                    top: Math.min(Math.max(margin, top), maxTop)
                };
            };
            const syncPosition = () => {
                const state = getWorkTeamCalendarEditorState(dataKey);
                const next = clampPosition(state.x, state.y);
                editor.style.left = `${next.left}px`;
                editor.style.top = `${next.top}px`;
                state.x = next.left;
                state.y = next.top;
            };
            let drag = null;
            const finishDrag = () => {
                if (!drag) return;
                editor.classList.remove('is-dragging');
                if (drag.pointerId != null) {
                    try { handle.releasePointerCapture(drag.pointerId); } catch (error) {}
                }
                drag = null;
            };
            syncPosition();
            handle.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                const editorRect = editor.getBoundingClientRect();
                drag = {
                    pointerId: event.pointerId,
                    offsetX: event.clientX - editorRect.left,
                    offsetY: event.clientY - editorRect.top
                };
                editor.classList.add('is-dragging');
                try { handle.setPointerCapture(event.pointerId); } catch (error) {}
                event.preventDefault();
            });
            handle.addEventListener('pointermove', event => {
                if (!drag || drag.pointerId !== event.pointerId) return;
                const boardRect = board.getBoundingClientRect();
                const next = clampPosition(
                    event.clientX - boardRect.left - drag.offsetX,
                    event.clientY - boardRect.top - drag.offsetY
                );
                editor.style.left = `${next.left}px`;
                editor.style.top = `${next.top}px`;
                const state = getWorkTeamCalendarEditorState(dataKey);
                state.x = next.left;
                state.y = next.top;
                event.preventDefault();
            });
            handle.addEventListener('pointerup', finishDrag);
            handle.addEventListener('pointercancel', finishDrag);
            handle.addEventListener('lostpointercapture', finishDrag);
        }

        function resetWorkTeamCalendarMonthSelection(dataKey, nextMonth, options = {}) {
            setWorkTeamCalendarActiveMonthState(dataKey, nextMonth);
            setWorkTeamCalendarFocusedDateState(dataKey, '');
            setWorkTeamCalendarSelectedDateKeys(dataKey, [], nextMonth);
            setWorkTeamCalendarExplicitDateSelection(dataKey, false);
            if (options.closeEditor !== false) {
                closeWorkTeamCalendarEditor(dataKey, { render: false });
            }
        }

        function workTeamCalendarMoveMonth(step) {
            const dataKey = WorkState.teamCalendarModal;
            const current = getWorkTeamCalendarActiveMonth(dataKey);
            const parsed = parseMonthKey(current);
            if (!parsed) return;
            const nextDate = new Date(parsed.year, parsed.monthIndex + Number(step || 0), 1);
            const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
            const clamped = clampWorkTeamCalendarMonthKey(nextKey);
            if (clamped === current) return;
            resetWorkTeamCalendarMonthSelection(dataKey, clamped);
            renderWorkTeamCalendarModal();
        }

        function workTeamCalendarNavigateArrow(step) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            if (Math.abs(step) === 1) {
                workTeamCalendarMoveMonth(step);
                return;
            }
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const selectedDateKeys = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            const selectedDate = getWorkTeamCalendarPrimarySelectedDate(dataKey, monthKey);
            if (!hasWorkTeamCalendarExplicitDateSelection(dataKey) || selectedDateKeys.length !== 1) {
                return;
            }
            const nextDateKey = getWorkTeamCalendarNavigationTarget(selectedDate, step);
            if (!nextDateKey) return;
            setWorkTeamCalendarActiveMonthState(dataKey, nextDateKey.slice(0, 7));
            setWorkTeamCalendarFocusedDateState(dataKey, nextDateKey);
            setWorkTeamCalendarSelectedDateKeys(dataKey, [nextDateKey], nextDateKey.slice(0, 7));
            const state = getWorkTeamCalendarEditorState(dataKey);
            if (state.open) {
                state.dateKey = nextDateKey;
            }
            setWorkTeamCalendarExplicitDateSelection(dataKey, true);
            renderWorkTeamCalendarModal();
        }

        function workTeamCalendarSelectYear(year) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const currentMonth = getWorkTeamCalendarActiveMonth(dataKey);
            const currentMonthLabel = currentMonth.slice(5);
            const options = getWorkTeamCalendarMonthOptionsForYear(year);
            if (!options.length) return;
            const nextMonth = options.find(optionKey => optionKey.endsWith(currentMonthLabel)) || options[0];
            resetWorkTeamCalendarMonthSelection(dataKey, nextMonth);
            renderWorkTeamCalendarModal();
        }

        function workTeamCalendarSelectMonth(monthKey) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            const nextMonth = clampWorkTeamCalendarMonthKey(monthKey);
            resetWorkTeamCalendarMonthSelection(dataKey, nextMonth);
            renderWorkTeamCalendarModal();
        }

        function workTeamCalendarSelectDate(dateKey, event = null) {
            const dataKey = WorkState.teamCalendarModal;
            if (!dataKey) return;
            if (isWorkTeamCalendarDateLocked(dateKey)) return;
            const monthKey = getWorkTeamCalendarActiveMonth(dataKey);
            const currentDates = getWorkTeamCalendarSelectedDateKeys(dataKey, monthKey);
            const withModifier = !!(event?.ctrlKey || event?.metaKey);
            let nextDates = [];
            if (withModifier) {
                nextDates = currentDates.includes(dateKey)
                    ? currentDates.filter(key => key !== dateKey)
                    : [...currentDates, dateKey];
            } else {
                nextDates = currentDates.length === 1 && currentDates[0] === dateKey ? [] : [dateKey];
            }
            setWorkTeamCalendarFocusedDateState(dataKey, dateKey);
            const normalizedDates = setWorkTeamCalendarSelectedDateKeys(dataKey, nextDates, monthKey);
            setWorkTeamCalendarExplicitDateSelection(dataKey, normalizedDates.length === 1);
            closeWorkTeamCalendarUtilityPopup(dataKey, { render: false });
            const state = getWorkTeamCalendarEditorState(dataKey);
            state.open = false;
            state.dateKey = '';
            state.manual = false;
            renderWorkTeamCalendarModal();
        }

        function getMonthlyFilterState(dataKey) {
            if (!WorkState.monthFilters[dataKey]) {
                const current = getCurrentMonthKey();
                WorkState.monthFilters[dataKey] = { startMonth: current, endMonth: current, team: '', room: '', owner: '', keyword: '' };
            }
            return WorkState.monthFilters[dataKey];
        }

        function updateMonthlyFilter(dataKey, field, value) {
            const filter = getMonthlyFilterState(dataKey);
            filter[field] = value;
            if (field === 'startMonth' || field === 'endMonth') {
                const normalized = normalizeMonthRange(filter.startMonth, filter.endMonth);
                filter.startMonth = normalized.start;
                filter.endMonth = normalized.end;
                WorkState.activeMonth[dataKey] = filter.startMonth;
            }
            if (field === 'team') {
                const rooms = value ? getEquipRooms(value) : [];
                if (!rooms.length || !rooms.includes(filter.room)) {
                    filter.room = '';
                }
            }
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function clearMonthlyFilter(dataKey) {
            const current = getCurrentMonthKey();
            WorkState.monthFilters[dataKey] = { startMonth: current, endMonth: current, team: '', room: '', owner: '', keyword: '' };
            const category = getWorkCategory(dataKey);
            if (category) renderWorkContent(category);
        }

        function entryMatchesFilter(entry, filter) {
            if (filter.team && normalizeWorkTeamName(entry.team) !== normalizeWorkTeamName(filter.team)) return false;
            if (filter.room && entry.room !== filter.room) return false;
            if (filter.owner && entry.owner !== filter.owner) return false;
            if (filter.keyword) {
                const hay = `${entry.team || ''} ${entry.room || ''} ${entry.task || ''} ${entry.owner || ''}`.toLowerCase();
                if (!hay.includes(filter.keyword.toLowerCase())) return false;
            }
            return true;
        }

        function getWorkOwners() {
            const categories = typeof getWorkAllCategories === 'function'
                ? getWorkAllCategories()
                : (AppData?.work?.categories || []);
            return categories
                .filter(cat => cat.dataKey && cat.dataKey !== 'work_monthly_plan')
                .map(cat => cat.title);
        }
