        function getDeepActiveElement(root = document) {
            let active = root?.activeElement || null;
            while (active?.shadowRoot?.activeElement) {
                active = active.shadowRoot.activeElement;
            }
            return active;
        }

        function isEditableTarget(target) {
            const candidate = target || getDeepActiveElement(document);
            if (!candidate) return false;
            const tag = (candidate.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
            if (candidate.isContentEditable) return true;
            if (typeof candidate.closest === 'function' && candidate.closest('[contenteditable=\"true\"]')) return true;
            const deepActive = getDeepActiveElement(document);
            if (deepActive && deepActive !== candidate) {
                return isEditableTarget(deepActive);
            }
            return false;
        }

        function getGlobalSaveElements() {
            const dock = document.getElementById('global-save-dock');
            const button = document.getElementById('global-save-button');
            return {
                dock,
                status: dock?.querySelector?.('#global-save-status') || null,
                recentChip: dock?.querySelector?.('#global-save-recent-chip') || null,
                recentValue: dock?.querySelector?.('#global-save-recent-value') || null,
                dateChip: dock?.querySelector?.('#global-save-date-chip') || null,
                dateValue: dock?.querySelector?.('#global-save-date-value') || null,
                button,
                buttonLabel: button?.querySelector?.('#global-save-button-label') || dock?.querySelector?.('#global-save-button-label') || null
            };
        }

        function formatViewerHeaderDate(value = new Date()) {
            const date = parseDashboardDate(value);
            if (!date) return '-';
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${month}.${day}`;
        }

        function formatViewerHeaderRecentDate(value) {
            const date = parseDashboardDate(value);
            if (!date) return '-';
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${formatViewerHeaderDate(date)} ${hours}:${minutes}`;
        }

        function shouldShowGlobalSaveDateChip() {
            return true;
        }

        function getDashboardHiddenState() {
            return document.getElementById('dashboard')?.classList.contains('hidden-view') === true;
        }

        function getDefaultGlobalSaveStatus(action) {
            if (!getDashboardHiddenState()) {
                return '대시보드에서는 저장 작업이 없습니다.';
            }
            if (!action) {
                return '현재 화면은 저장 대상이 없습니다.';
            }
            return action.statusText || '현재 화면 데이터를 중앙 서버에 저장합니다.';
        }

        function getDefaultGlobalSaveButtonLabel(action) {
            return action?.buttonLabel || '저장';
        }

        function resolveGlobalSaveAction() {
            if (!getDashboardHiddenState()) return null;
            return KpiRuntime?.resolveSaveAction?.(activeRenderContext || {}) || null;
        }

        function renderGlobalSaveUi(options = {}) {
            const { dock, status, button, buttonLabel, recentValue, dateChip, dateValue } = getGlobalSaveElements();
            if (!dock || !status || !button || !buttonLabel) return;
            const action = resolveGlobalSaveAction();
            const providerChanged = String(action?.providerKey || '') !== String(GlobalSaveUiState.providerKey || '');
            GlobalSaveUiState.activeAction = action;
            if (options.forceDefault === true || providerChanged) {
                GlobalSaveUiState.providerKey = String(action?.providerKey || '');
                GlobalSaveUiState.message = getDefaultGlobalSaveStatus(action);
                GlobalSaveUiState.tone = '';
            }

            const canSave = !!(action && action.canSave !== false && typeof action.perform === 'function');
            button.disabled = GlobalSaveUiState.busy || !canSave;
            button.classList.toggle('is-saving', GlobalSaveUiState.busy);
            button.classList.toggle('is-success', !GlobalSaveUiState.busy && GlobalSaveUiState.tone === 'success');
            button.classList.toggle('is-error', !GlobalSaveUiState.busy && GlobalSaveUiState.tone === 'error');
            button.setAttribute('aria-disabled', button.disabled ? 'true' : 'false');
            buttonLabel.textContent = GlobalSaveUiState.busy
                ? '저장 중...'
                : getDefaultGlobalSaveButtonLabel(action);
            button.title = action?.title || GlobalSaveUiState.message || '저장';
            status.textContent = GlobalSaveUiState.message;
            status.classList.toggle('is-success', GlobalSaveUiState.tone === 'success');
            status.classList.toggle('is-error', GlobalSaveUiState.tone === 'error');
            if (recentValue) {
                recentValue.textContent = formatViewerHeaderRecentDate(getLatestRecentUpdateValue());
            }
            if (dateChip && dateValue) {
                const shouldShowDateChip = shouldShowGlobalSaveDateChip();
                dateChip.classList.toggle('is-hidden', !shouldShowDateChip);
                if (shouldShowDateChip) {
                    dateValue.textContent = formatViewerHeaderDate();
                }
            }
        }

        function resetGlobalSaveUiToDefault() {
            const action = resolveGlobalSaveAction();
            GlobalSaveUiState.activeAction = action;
            GlobalSaveUiState.providerKey = String(action?.providerKey || '');
            GlobalSaveUiState.message = getDefaultGlobalSaveStatus(action);
            GlobalSaveUiState.tone = '';
            renderGlobalSaveUi();
        }

        function isGlobalSaveShortcut(evt) {
            const key = String(evt?.key || '').toLowerCase();
            const code = String(evt?.code || '');
            return (key === 's' || code === 'KeyS') && (evt.ctrlKey || evt.metaKey) && !evt.altKey && !evt.shiftKey;
        }

        function completeReportDeckEditShortcut(evt) {
            const targetRoot = typeof evt?.target?.closest === 'function'
                ? evt.target.closest('[data-report-deck-editor][data-report-edit-mode="editing"]')
                : null;
            const activeRoot = targetRoot || (
                typeof document !== 'undefined'
                    ? document.querySelector?.('[data-report-deck-editor][data-report-edit-mode="editing"]')
                    : null
            );
            if (!activeRoot) return false;
            let completeEvent = null;
            if (typeof CustomEvent === 'function') {
                completeEvent = new CustomEvent('kpi:report-deck-complete-edit', {
                    cancelable: true
                });
            } else if (typeof document !== 'undefined' && typeof document.createEvent === 'function') {
                completeEvent = document.createEvent('Event');
                completeEvent.initEvent('kpi:report-deck-complete-edit', false, true);
            }
            if (!completeEvent) return false;
            activeRoot.dispatchEvent(completeEvent);
            return completeEvent.defaultPrevented === true || activeRoot.dataset?.reportEditMode !== 'editing';
        }

        function scheduleGlobalSaveUiRefresh(options = {}) {
            if (globalSaveRefreshTimer) {
                clearTimeout(globalSaveRefreshTimer);
            }
            globalSaveRefreshTimer = setTimeout(() => {
                globalSaveRefreshTimer = null;
                renderGlobalSaveUi(options);
            }, 0);
        }

        async function triggerGlobalSave(options = {}) {
            const action = resolveGlobalSaveAction();
            if (!action || action.canSave === false || typeof action.perform !== 'function') {
                GlobalSaveUiState.activeAction = null;
                GlobalSaveUiState.providerKey = '';
                GlobalSaveUiState.message = getDefaultGlobalSaveStatus(null);
                GlobalSaveUiState.tone = 'error';
                renderGlobalSaveUi();
                return false;
            }

            GlobalSaveUiState.busy = true;
            GlobalSaveUiState.activeAction = action;
            GlobalSaveUiState.providerKey = String(action.providerKey || '');
            GlobalSaveUiState.message = '중앙 서버에 저장 중입니다...';
            GlobalSaveUiState.tone = '';
            renderGlobalSaveUi();

            let successAlertMessage = '';
            try {
                const result = await action.perform({
                    trigger: options.trigger || 'manual',
                    context: activeRenderContext || {},
                    action
                });
                if (result === false) {
                    throw new Error('save_rejected');
                }
                const savedRecord = KpiRuntime?.recordSaveHistory?.({
                    providerKey: action.providerKey,
                    sectionId: activeSectionId,
                    categoryTitle: activeRenderContext?.category?.title || '',
                    label: action.historyLabel || action.buttonLabel || action.label || '저장',
                    trigger: options.trigger || 'manual'
                });
                persistGlobalRecentUpdateRecord(savedRecord);
                const savedTime = savedRecord?.savedAt
                    ? new Date(savedRecord.savedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
                    : '';
                GlobalSaveUiState.message = savedTime
                    ? `저장되었습니다. ${savedTime}`
                    : '저장되었습니다.';
                GlobalSaveUiState.tone = 'success';
                successAlertMessage = '저장되었습니다';
                return true;
            } catch (error) {
                console.error('KPI global save failed.', error);
                GlobalSaveUiState.message = action.errorMessage || '저장에 실패했습니다.';
                GlobalSaveUiState.tone = 'error';
                return false;
            } finally {
                GlobalSaveUiState.busy = false;
                if (successAlertMessage) {
                    renderGlobalSaveUi();
                    browser?.showAlert?.(successAlertMessage);
                } else {
                    renderGlobalSaveUi();
                }
            }
        }

        function bindGlobalSaveButton() {
            if (browser?.getFlag?.('__globalSaveButtonListener')) return;
            browser?.setFlag?.('__globalSaveButtonListener');
            const { button } = getGlobalSaveElements();
            button?.addEventListener('click', () => {
                void triggerGlobalSave({ trigger: 'button' });
            });
        }

        function bindGlobalSaveHotkey() {
            if (browser?.getFlag?.('__globalSaveHotkeyListener')) return;
            browser?.setFlag?.('__globalSaveHotkeyListener');
            browser?.addWindowEventListener?.('keydown', evt => {
                if (evt.defaultPrevented) return;
                if (!isGlobalSaveShortcut(evt)) return;
                if (completeReportDeckEditShortcut(evt)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    return;
                }
                evt.preventDefault();
                evt.stopPropagation();
                void triggerGlobalSave({ trigger: 'shortcut' });
            }, true);
        }

        function bindGlobalSaveRefreshHooks() {
            if (browser?.getFlag?.('__globalSaveRefreshHooks')) return;
            browser?.setFlag?.('__globalSaveRefreshHooks');
            const schedule = () => scheduleGlobalSaveUiRefresh();
            document.addEventListener('click', schedule, true);
            document.addEventListener('input', schedule, true);
            document.addEventListener('change', schedule, true);
            document.addEventListener('focusin', schedule, true);
            browser?.addWindowEventListener?.('kpi:metering-store-updated', schedule);
            browser?.addWindowEventListener?.('util-production-data-updated', schedule);
            browser?.addWindowEventListener?.('storage', event => {
                if (String(event?.key || '') !== GLOBAL_RECENT_UPDATE_STORAGE_KEY) return;
                schedule();
            });
        }

        function bindBackspaceGoHomeHotkey() {
            if (browser?.getFlag?.('__backspaceGoHomeListener')) return;
            browser?.setFlag?.('__backspaceGoHomeListener');
            document.addEventListener('keydown', evt => {
                if (evt.key !== 'Backspace') return;
                if (evt.defaultPrevented) return;
                if (isEditableTarget(evt.target)) return;
                const dashboard = document.getElementById('dashboard');
                if (!dashboard || !dashboard.classList.contains('hidden-view')) return;
                if (hasOpenModalLayer()) {
                    closeGlobalSectionShortcutLayers({ confirm: true });
                    evt.preventDefault();
                    return;
                }
                if (navigateAppBack()) {
                    evt.preventDefault();
                }
            });
        }

        function closeGlobalSectionShortcutLayers(options = {}) {
            const closeResult = KpiRuntime?.closeShortcutLayers?.(options);
            if (closeResult === false) return false;
            document.querySelectorAll('[id$="-modal"].is-open').forEach(modal => {
                modal.classList.remove('is-open');
                modal.classList.remove('is-chart-fullscreen');
            });
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
            document.body.style.overflow = '';
            return true;
        }

        function hasOpenModalLayer() {
            return Boolean(document.querySelector('[id$="-modal"].is-open, .modal.show'));
        }
