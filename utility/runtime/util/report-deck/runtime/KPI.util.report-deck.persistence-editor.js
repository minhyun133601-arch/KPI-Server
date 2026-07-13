(function registerKpiReportDeckRuntimePersistenceEditor(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function applyReportDeckState(root, state, meta) {
        parts.applyReportDeckDerivedFields(state, meta);
        parts.syncReportDeckFields(root, state, meta);
        parts.syncReportDeckPlanControls(root, state);
        parts.syncReportDeckMemoControls(root, state);
        parts.syncReportDeckChartHighlightControls(root, state, meta);
        parts.syncReportDeckChartHighlightPointStates(root, state, meta);
        parts.syncReportDeckCaptureControls(root, state);
        parts.syncReportDeckJson(root, state, meta);
    }

    function resetReportDeckStateForMonth(root, state, meta) {
        const nextState = parts.createReportDeckStateForMonth(meta.selectedMonth);
        Object.keys(nextState).forEach(key => {
            state[key] = nextState[key];
        });
        Object.assign(meta, { version: null, updatedAt: '', dirty: false, highlightChartKey: '', highlightChartMode: 'point', highlightRangeChartKey: '', highlightRangeStartMonth: '' });
        parts.clearReportDeckMemoCaches(meta);
        applyReportDeckState(root, state, meta);
    }

    async function loadReportDeckStateFromServer(root, state, meta) {
        const config = parts.getReportDeckRuntimeConfig();
        if (!meta.recordKey) {
            parts.setReportDeckStatus(root, 'offline', '월을 선택해 주세요');
            return false;
        }
        if (config.enabled === false || config.readEnabled === false || typeof browser?.fetchReportDeckCover !== 'function') {
            parts.setReportDeckStatus(root, 'offline', '서버 연결 없음');
            return false;
        }

        meta.loadSequence += 1;
        const loadSequence = meta.loadSequence;
        parts.setReportDeckStatus(root, 'loading', '불러오는 중');
        try {
            const result = await browser.fetchReportDeckCover({ recordKey: meta.recordKey });
            if (loadSequence !== meta.loadSequence) return false;
            const record = result?.record || null;
            if (record?.payload) {
                Object.assign(state, parts.normalizeReportDeckState({
                    ...parts.createReportDeckStateForMonth(meta.selectedMonth),
                    ...record.payload
                }));
                Object.assign(meta, parts.getReportDeckRecordMeta(record));
                meta.dirty = false;
                applyReportDeckState(root, state, meta);
                parts.setReportDeckStatus(root, 'idle', '');
                return true;
            }
            Object.assign(meta, { version: null, updatedAt: '' });
            meta.dirty = false;
            resetReportDeckStateForMonth(root, state, meta);
            parts.setReportDeckStatus(root, 'idle', '');
            return true;
        } catch (error) {
            if (loadSequence === meta.loadSequence) {
                parts.setReportDeckStatus(root, 'error', '불러오기 실패');
            }
            return false;
        }
    }

    async function saveReportDeckStateToServer(root, state, meta, saveSequence, options = {}) {
        const config = parts.getReportDeckRuntimeConfig();
        if (!meta.recordKey) {
            parts.setReportDeckStatus(root, 'offline', '월을 선택해 주세요');
            return false;
        }
        if (config.enabled === false || config.writeEnabled === false || typeof browser?.saveReportDeckCover !== 'function') {
            parts.setReportDeckStatus(root, 'readonly', '서버 쓰기 권한 없음');
            return false;
        }

        parts.setReportDeckStatus(root, 'saving', '저장 중');
        try {
            await parts.externalizeReportDeckInlineImages(root, state, meta);
            parts.applyReportDeckDerivedFields(state, meta);
            const result = await browser.saveReportDeckCover(parts.normalizeReportDeckState(state), { recordKey: meta.recordKey });
            if (saveSequence !== meta.saveSequence) return false;
            if (result?.record) {
                Object.assign(meta, parts.getReportDeckRecordMeta(result.record));
            }
            meta.dirty = false;
            parts.syncReportDeckJson(root, state, meta);
            parts.setReportDeckStatus(root, 'saved', options.showSavedMessage === false ? '' : parts.REPORT_DECK_SAVED_MESSAGE);
            if (options.showSavedPopup === true) {
                parts.showReportDeckSavedPopup(root);
            }
            return true;
        } catch (error) {
            if (saveSequence === meta.saveSequence) {
                parts.setReportDeckStatus(root, 'error', parts.getReportDeckSaveErrorText(error));
            }
            return false;
        }
    }

    function markReportDeckDirty(root, state, meta) {
        meta.dirty = true;
        parts.syncReportDeckJson(root, state, meta);
        parts.setReportDeckStatus(root, 'dirty', '저장 필요');
    }

    function readReportDeckImageFile(file, meta = {}, fieldKey = '') {
        if (typeof browser?.uploadReportDeckImage === 'function') {
            return browser.uploadReportDeckImage(file, {
                recordKey: meta.recordKey,
                fieldKey,
                originalName: file?.name || `${fieldKey || 'image'}.png`,
                mimeType: file?.type || ''
            });
        }
        return new Promise((resolve, reject) => {
            if (!file || typeof FileReader !== 'function') {
                reject(new Error('report_deck_image_reader_unavailable'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('report_deck_image_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    async function updateReportDeckPlanImageFile(root, state, meta, key, file, input = null, options = {}) {
        if (
            !key
            || !Object.prototype.hasOwnProperty.call(state, key)
            || parts.hasReportDeckPlanImageValue(state, key)
            || !parts.isReportDeckImageFile(file)
        ) {
            if (input) input.value = '';
            if (key && parts.hasReportDeckPlanImageValue(state, key)) {
                parts.setReportDeckStatus(root, 'dirty', '이미지는 삭제 후 다시 등록하세요');
            }
            return false;
        }
        try {
            const imageData = await readReportDeckImageFile(file, meta, key);
            if (!imageData) return false;
            state[key] = imageData;
            const sourceKey = parts.getReportDeckPlanImageSourceKey(key);
            const sourceValue = parts.normalizeReportDeckPlanImageSource(options.source);
            if (sourceKey && sourceValue) {
                state[sourceKey] = sourceValue;
            }
            const slide10ImageIndex = parts.getReportDeckSlide10ImageSourceIndex(key);
            if (slide10ImageIndex) {
                parts.ensureReportDeckSlide10TeamForSourceIndex(state, slide10ImageIndex);
                parts.recomputeReportDeckSlide10SlotCount(state);
            }
            parts.syncReportDeckPlanControls(root, state);
            markReportDeckDirty(root, state, meta);
            if (input) input.value = '';
            if (options.saveImmediately === true) {
                meta.saveSequence += 1;
                await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
                    showSavedMessage: true
                });
            }
            return true;
        } catch (error) {
            parts.setReportDeckStatus(root, 'error', parts.getReportDeckImageErrorText(error));
            return false;
        }
    }

    function clearReportDeckPlanImageValue(state, key) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        state[normalizedKey] = '';
        const slide10ImageIndex = parts.getReportDeckSlide10ImageSourceIndex(normalizedKey);
        if (slide10ImageIndex) {
            parts.clearReportDeckSlide10TeamIfImageOnly(state, slide10ImageIndex);
            parts.recomputeReportDeckSlide10SlotCount(state);
        }
        return true;
    }

    async function updateReportDeckPlanImage(root, state, meta, input) {
        const key = String(input?.dataset?.reportPlanImageKey || '').trim();
        const file = input?.files?.[0] || null;
        const frame = parts.getReportDeckPlanImageFrameFromTarget(input);
        const isEditing = root?.dataset?.reportEditMode === 'editing';
        const canAttach = parts.canUseReportDeckPlanImageAttachment(root, frame);
        if (!canAttach) return false;
        return updateReportDeckPlanImageFile(root, state, meta, key, file, input, {
            source: 'upload',
            saveImmediately: !isEditing
        });
    }

    async function pasteReportDeckPlanImage(root, state, meta, event) {
        const file = parts.getReportDeckClipboardImageFile(event);
        if (!file) return false;
        const targetFrame = parts.getReportDeckPlanImageFrameFromTarget(event?.target);
        const targetKey = parts.getReportDeckPlanImageKeyFromFrame(targetFrame);
        const activeKey = parts.getReportDeckPlanImageKeyFromFrame(root.__reportDeckActivePlanImageFrame);
        if (
            (parts.isReportDeckUsablePlanImageFrame(targetFrame, state) && parts.hasReportDeckPlanImageValue(state, targetKey))
            || (!targetFrame && parts.isReportDeckUsablePlanImageFrame(root.__reportDeckActivePlanImageFrame, state) && parts.hasReportDeckPlanImageValue(state, activeKey))
        ) {
            event?.preventDefault?.();
            parts.setReportDeckStatus(root, 'dirty', '이미지는 삭제 후 다시 등록하세요');
            return false;
        }
        const frame = parts.resolveReportDeckPasteImageFrame(root, state, event?.target);
        const key = parts.getReportDeckPlanImageKeyFromFrame(frame);
        if (!key) return false;
        event?.preventDefault?.();
        parts.setReportDeckActivePlanImageFrame(root, frame);
        frame?.focus?.();
        return updateReportDeckPlanImageFile(root, state, meta, key, file, null, {
            source: 'paste'
        });
    }

    async function completeReportDeckEdit(root, state, meta) {
        if (root?.dataset?.reportEditMode !== 'editing') return false;
        if (!parts.captureReportDeckPendingEdits(root, state, meta)) return false;
        if (meta.dirty !== true) {
            meta.dirty = false;
            parts.syncReportDeckJson(root, state, meta);
            parts.setReportDeckStatus(root, 'saved', parts.REPORT_DECK_SAVED_MESSAGE);
            parts.showReportDeckSavedPopup(root);
            meta.highlightChartKey = '';
            meta.highlightChartMode = 'point';
            meta.highlightRangeChartKey = '';
            meta.highlightRangeStartMonth = '';
            parts.syncReportDeckChartHighlightControls(root, state, meta);
            parts.setReportDeckEditMode(root, false);
            return true;
        }
        meta.saveSequence += 1;
        const saved = await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
            showSavedMessage: true,
            showSavedPopup: true
        });
        if (saved) {
            meta.highlightChartKey = '';
            meta.highlightChartMode = 'point';
            meta.highlightRangeChartKey = '';
            meta.highlightRangeStartMonth = '';
            parts.syncReportDeckChartHighlightControls(root, state, meta);
            parts.setReportDeckEditMode(root, false);
        }
        return saved;
    }

    async function selectReportDeckMonth(root, state, meta, monthValue) {
        const nextMonth = parts.normalizeReportDeckMonth(monthValue);
        if (!nextMonth || nextMonth === meta.selectedMonth) {
            parts.syncReportDeckMonthSelect(root, meta);
            return;
        }
        if (!Array.isArray(meta.months) || !meta.months.includes(nextMonth)) {
            parts.syncReportDeckMonthSelect(root, meta);
            return;
        }
        if (root?.dataset?.reportEditMode === 'editing' && !parts.captureReportDeckPendingEdits(root, state, meta)) {
            parts.syncReportDeckMonthSelect(root, meta);
            return;
        }
        if (meta.dirty === true) {
            meta.saveSequence += 1;
            const saved = await saveReportDeckStateToServer(root, state, meta, meta.saveSequence, {
                showSavedMessage: false
            });
            if (!saved) {
                parts.syncReportDeckMonthSelect(root, meta);
                return;
            }
        }
        meta.selectedMonth = nextMonth;
        meta.recordKey = parts.buildReportDeckMonthRecordKey(nextMonth);
        parts.syncReportDeckMonthSelect(root, meta);
        parts.setReportDeckEditMode(root, false);
        resetReportDeckStateForMonth(root, state, meta);
        await loadReportDeckStateFromServer(root, state, meta);
        void parts.renderReportDeckAutoSlides(root, meta, state);
    }

    async function loadReportDeckMonthOptions(root, state, meta) {
        meta.monthPlaceholder = '월 확인 중';
        parts.syncReportDeckMonthSelect(root, meta);
        if (typeof browser?.fetchMeteringSharedStore !== 'function') {
            meta.monthPlaceholder = '선택 가능 월 없음';
            parts.syncReportDeckMonthSelect(root, meta);
            parts.setReportDeckStatus(root, 'offline', '정산 월 확인 불가');
            return false;
        }
        parts.setReportDeckStatus(root, 'loading', '월 확인 중');
        try {
            const result = await browser.fetchMeteringSharedStore();
            meta.sharedStore = result?.store || null;
            const months = parts.buildReportDeckOpenMonthsUntilCurrent();
            meta.months = months;
            meta.monthPlaceholder = months.length ? '' : '선택 가능 월 없음';
            meta.selectedMonth = months.includes(meta.selectedMonth)
                ? meta.selectedMonth
                : (months[0] || '');
            meta.recordKey = meta.selectedMonth ? parts.buildReportDeckMonthRecordKey(meta.selectedMonth) : '';
            parts.syncReportDeckMonthSelect(root, meta);
            if (!meta.selectedMonth) {
                parts.clearReportDeckBukjeongAnalysis(root);
                parts.setReportDeckStatus(root, 'idle', '');
                return false;
            }
            resetReportDeckStateForMonth(root, state, meta);
            const loaded = await loadReportDeckStateFromServer(root, state, meta);
            void parts.renderReportDeckAutoSlides(root, meta, state);
            return loaded;
        } catch (error) {
            meta.months = [];
            meta.selectedMonth = '';
            meta.recordKey = '';
            meta.sharedStore = null;
            meta.monthPlaceholder = '월 목록 불러오기 실패';
            parts.syncReportDeckMonthSelect(root, meta);
            parts.setReportDeckStatus(root, 'error', '월 목록 불러오기 실패');
            return false;
        }
    }

    function initReportDeckEditor(container) {
        const root = container?.querySelector?.('[data-report-deck-editor]');
        if (!root || root.dataset.bound === 'true') return;
        root.dataset.bound = 'true';
        const state = parts.normalizeReportDeckState();
        const meta = {
            version: null,
            updatedAt: '',
            saveSequence: 0,
            loadSequence: 0,
            dirty: false,
            selectedMonth: '',
            recordKey: '',
            months: [],
            sharedStore: null,
            autoRenderSequence: 0,
            highlightChartKey: '',
            highlightChartMode: 'point',
            highlightRangeChartKey: '',
            highlightRangeStartMonth: '',
            memoCandidateCache: new Map(),
            memoOverviewCache: new Map(),
            monthPlaceholder: '월 확인 중'
        };
        root.__reportDeckState = state;
        root.__reportDeckMeta = meta;
        parts.syncReportDeckMonthSelect(root, meta);
        applyReportDeckState(root, state, meta);
        parts.setReportDeckStatus(root, 'loading', '불러오는 중');
        parts.setReportDeckEditMode(root, false);
        parts.setReportDeckSlide(root, 0);
        void loadReportDeckMonthOptions(root, state, meta);

        root.addEventListener?.('pointerdown', event => {
            if (parts.startReportDeckMemoDialogDrag(root, event)) return;
            parts.startReportDeckMemoOverviewDrag(root, event);
        });

        parts.getReportDeckMemoOverviewWindow(root)?.addEventListener?.('resize', () => {
            parts.syncReportDeckMemoDialogFloatingPosition(parts.getReportDeckMemoDialog(root));
            parts.syncReportDeckMemoOverviewFloatingPosition(parts.getReportDeckMemoOverviewDialog(root));
        });

        root.addEventListener?.('click', event => {
            const saveMenuToggle = event.target?.closest?.('[data-report-save-menu-toggle]');
            if (saveMenuToggle) {
                event.preventDefault();
                parts.toggleReportDeckSaveMenu(root, state);
                return;
            }
            if (!event.target?.closest?.('[data-report-save-menu]')) {
                parts.closeReportDeckSaveMenu(root);
            }

            const editButton = event.target?.closest?.('[data-report-edit-toggle]');
            if (editButton) {
                event.preventDefault();
                if (root.dataset.reportEditMode === 'editing') {
                    void completeReportDeckEdit(root, state, meta);
                } else {
                    parts.setReportDeckEditMode(root, true);
                    parts.syncReportDeckPlanControls(root, state);
                    parts.setReportDeckStatus(root, meta.dirty ? 'dirty' : 'idle', meta.dirty ? '저장 필요' : '');
                }
                return;
            }

            const chartHighlightButton = event.target?.closest?.('[data-report-chart-highlight-toggle]');
            if (chartHighlightButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightButton.dataset.reportChartHighlightKey || '').trim();
                const mode = parts.normalizeReportDeckChartHighlightMode(chartHighlightButton.dataset.reportChartHighlightMode);
                const isSameTarget = meta.highlightChartKey === chartKey && parts.normalizeReportDeckChartHighlightMode(meta.highlightChartMode) === mode;
                meta.highlightChartKey = isSameTarget ? '' : chartKey;
                meta.highlightChartMode = isSameTarget ? 'point' : mode;
                meta.highlightRangeChartKey = '';
                meta.highlightRangeStartMonth = '';
                parts.syncReportDeckChartHighlightControls(root, state, meta);
                parts.syncReportDeckChartHighlightPointStates(root, state, meta);
                return;
            }

            const chartHighlightResetButton = event.target?.closest?.('[data-report-chart-highlight-reset]');
            if (chartHighlightResetButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightResetButton.dataset.reportChartHighlightKey || '').trim();
                if (chartKey) {
                    const changed = parts.clearReportDeckChartHighlights(state, chartKey);
                    meta.highlightChartKey = '';
                    meta.highlightChartMode = 'point';
                    meta.highlightRangeChartKey = '';
                    meta.highlightRangeStartMonth = '';
                    if (changed) {
                        markReportDeckDirty(root, state, meta);
                    }
                    parts.syncReportDeckChartHighlightControls(root, state, meta);
                    parts.syncReportDeckChartHighlightPointStates(root, state, meta);
                    void parts.renderReportDeckAutoSlides(root, meta, state);
                }
                return;
            }

            const chartHighlightPoint = event.target?.closest?.('[data-report-chart-highlight-point]');
            if (chartHighlightPoint && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const chartKey = String(chartHighlightPoint.dataset.reportChartHighlightKey || '').trim();
                const monthKey = parts.normalizeReportDeckMonth(chartHighlightPoint.dataset.reportChartHighlightMonth);
                if (chartKey && monthKey && chartKey === String(meta.highlightChartKey || '').trim()) {
                    if (parts.normalizeReportDeckChartHighlightMode(meta.highlightChartMode) === 'range') {
                        const startMonth = parts.normalizeReportDeckMonth(meta.highlightRangeStartMonth);
                        if (!startMonth || String(meta.highlightRangeChartKey || '').trim() !== chartKey) {
                            meta.highlightRangeChartKey = chartKey;
                            meta.highlightRangeStartMonth = monthKey;
                            parts.syncReportDeckChartHighlightPointStates(root, state, meta);
                        } else {
                            parts.toggleReportDeckChartHighlightRange(state, chartKey, startMonth, monthKey);
                            meta.highlightRangeChartKey = '';
                            meta.highlightRangeStartMonth = '';
                            markReportDeckDirty(root, state, meta);
                            parts.syncReportDeckChartHighlightControls(root, state, meta);
                            parts.syncReportDeckChartHighlightPointStates(root, state, meta);
                            void parts.renderReportDeckAutoSlides(root, meta, state);
                        }
                    } else {
                        parts.toggleReportDeckChartHighlightMonth(state, chartKey, monthKey);
                        markReportDeckDirty(root, state, meta);
                        parts.syncReportDeckChartHighlightControls(root, state, meta);
                        parts.syncReportDeckChartHighlightPointStates(root, state, meta);
                        void parts.renderReportDeckAutoSlides(root, meta, state);
                    }
                }
                return;
            }

            const memoOverviewButton = event.target?.closest?.('[data-report-memo-overview-toggle]');
            if (memoOverviewButton) {
                event.preventDefault();
                void parts.openReportDeckMemoOverviewPopupOrDialog(root, meta);
                return;
            }

            const memoOverviewCopyButton = event.target?.closest?.('[data-report-memo-overview-copy]');
            if (memoOverviewCopyButton) {
                event.preventDefault();
                void parts.copyReportDeckMemoOverviewText(root, memoOverviewCopyButton);
                return;
            }

            const memoOverviewCloseButton = event.target?.closest?.('[data-report-memo-overview-close]');
            if (memoOverviewCloseButton) {
                event.preventDefault();
                parts.closeReportDeckMemoOverviewDialog(root);
                return;
            }

            const memoCloseButton = event.target?.closest?.('[data-report-memo-close]');
            if (memoCloseButton) {
                event.preventDefault();
                parts.closeReportDeckMemoDialog(root);
                return;
            }

            const memoNotepadFontSizeButton = event.target?.closest?.('[data-report-memo-notepad-font-size-delta]');
            if (memoNotepadFontSizeButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                parts.adjustReportDeckMemoNotepadFontSize(root, state, meta, dialog, key, memoNotepadFontSizeButton.dataset.reportMemoNotepadFontSizeDelta);
                return;
            }

            const memoNotepadColorButton = event.target?.closest?.('[data-report-memo-notepad-color]');
            if (memoNotepadColorButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                parts.applyReportDeckMemoNotepadColor(root, state, meta, dialog, key, memoNotepadColorButton.dataset.reportMemoNotepadColor);
                return;
            }

            const memoClearButton = event.target?.closest?.('[data-report-memo-clear]');
            if (memoClearButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                if (key && Object.prototype.hasOwnProperty.call(state, key)) {
                    parts.setReportDeckMemoLines(root, state, meta, dialog, key, []);
                }
                return;
            }

            const memoLineMoveButton = event.target?.closest?.('[data-report-memo-move-line]');
            if (memoLineMoveButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                const index = Number.parseInt(String(memoLineMoveButton.dataset.reportMemoMoveLine || ''), 10);
                parts.moveReportDeckMemoLine(root, state, meta, dialog, key, index, memoLineMoveButton.dataset.reportMemoMoveDirection);
                return;
            }

            const memoLineFontSizeButton = event.target?.closest?.('[data-report-memo-line-font-size]');
            if (memoLineFontSizeButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                const index = Number.parseInt(String(memoLineFontSizeButton.dataset.reportMemoLineFontSize || ''), 10);
                parts.adjustReportDeckMemoLineFontSize(root, state, meta, dialog, key, index, memoLineFontSizeButton.dataset.reportMemoLineFontSizeDelta, memoLineFontSizeButton);
                return;
            }

            const memoLineColorButton = event.target?.closest?.('[data-report-memo-line-color]');
            if (memoLineColorButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                const index = Number.parseInt(String(memoLineColorButton.dataset.reportMemoLineColor || ''), 10);
                parts.applyReportDeckMemoLineColor(root, state, meta, dialog, key, index, memoLineColorButton.dataset.reportMemoLineColorValue, memoLineColorButton);
                return;
            }

            const memoAddButton = event.target?.closest?.('[data-report-memo-add-key]');
            if (memoAddButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const key = String(memoAddButton.dataset.reportMemoAddKey || '').trim();
                const memoTarget = key
                    ? root.querySelector?.(`[data-report-memo-key="${key}"]`)
                    : memoAddButton.closest?.('[data-report-memo-key]');
                if (memoTarget) {
                    parts.openReportDeckMemoDialog(root, state, meta, memoTarget);
                }
                return;
            }

            const memoManualAddButton = event.target?.closest?.('[data-report-memo-manual-add]');
            if (memoManualAddButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                const input = dialog?.querySelector?.('[data-report-memo-manual-input]');
                const addedLines = parts.getReportDeckMemoLines(input?.value || '');
                if (key && addedLines.length) {
                    parts.appendReportDeckMemoLines(root, state, meta, dialog, key, addedLines);
                    parts.clearReportDeckMemoManualInput(dialog);
                }
                return;
            }

            const memoCandidateButton = event.target?.closest?.('[data-report-memo-candidate]');
            if (memoCandidateButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckMemoDialog(root);
                const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                const index = Number.parseInt(String(memoCandidateButton.dataset.reportMemoCandidate || ''), 10);
                const candidate = Array.isArray(dialog?.__reportMemoCandidates) ? dialog.__reportMemoCandidates[index] : null;
                if (key && candidate?.text && Object.prototype.hasOwnProperty.call(state, key)) {
                    parts.insertReportDeckMemoCandidateAtNotepadCursor(root, state, meta, dialog, key, candidate.text);
                }
                return;
            }

            const memoTarget = event.target?.closest?.('[data-report-memo-key]');
            if (memoTarget && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.openReportDeckMemoDialog(root, state, meta, memoTarget);
                return;
            }

            const overviewSaveButton = event.target?.closest?.('[data-report-overview-save]');
            if (overviewSaveButton) {
                event.preventDefault();
                parts.saveReportDeckOverviewDialog(root, state, meta);
                return;
            }

            const overviewCancelButton = event.target?.closest?.('[data-report-overview-cancel]');
            if (overviewCancelButton) {
                event.preventDefault();
                parts.closeReportDeckOverviewDialog(root);
                return;
            }

            const overviewKindButton = event.target?.closest?.('[data-report-overview-kind-option]');
            if (overviewKindButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const dialog = parts.getReportDeckOverviewDialog(root);
                if (dialog) {
                    parts.setReportDeckOverviewKindControls(dialog, overviewKindButton.dataset.reportOverviewKindOption);
                }
                return;
            }

            const undoDeleteButton = event.target?.closest?.('[data-report-undo-delete]');
            if (undoDeleteButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.restoreReportDeckDeletedPlanSlot(root, state, meta);
                return;
            }

            const safetyAddToggle = event.target?.closest?.('[data-report-safety-add-toggle]');
            if (safetyAddToggle && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.toggleReportDeckSafetyTeamPicker(root, safetyAddToggle);
                return;
            }

            const safetyTeamOption = event.target?.closest?.('[data-report-safety-team-option]');
            if (safetyTeamOption && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const control = parts.getReportDeckSafetyAddControl(safetyTeamOption);
                const rowIndex = parts.normalizeReportDeckSlide10SourceRowIndex(safetyTeamOption.dataset.reportSafetyTeamOption);
                const select = control?.querySelector?.('[data-report-safety-team-select]');
                if (select) select.value = String(rowIndex);
                parts.closeReportDeckSafetyTeamPickers(root);
                parts.addReportDeckPlanSlot(root, state, meta, 'slide10', {
                    rowIndex,
                    team: parts.REPORT_DECK_SLIDE10_TEAM_ROWS[rowIndex] || ''
                });
                return;
            }

            const addSlotButton = event.target?.closest?.('[data-report-plan-add-slot]');
            if (addSlotButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.addReportDeckPlanSlot(root, state, meta, addSlotButton.dataset.reportPlanAddSlot, {
                    rowIndex: parts.getReportDeckSlide10AddRowIndex(root, addSlotButton),
                    team: parts.getReportDeckSlide10AddTeam(root, addSlotButton)
                });
                return;
            }

            const addPageButton = event.target?.closest?.('[data-report-add-page]');
            if (addPageButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.addReportDeckOptionalPage(root, state, meta, addPageButton.dataset.reportAddPage);
                return;
            }

            const safetyTableMoveButton = event.target?.closest?.('[data-report-safety-table-move]');
            if (safetyTableMoveButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.moveReportDeckSlide10Table(root, state, meta, safetyTableMoveButton, safetyTableMoveButton.dataset.reportSafetyTableMove);
                return;
            }

            const deleteSlotButton = event.target?.closest?.('[data-report-plan-delete-slot]');
            if (deleteSlotButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const sourceSlot = deleteSlotButton.dataset.reportPlanSourceSlot
                    || deleteSlotButton.closest?.('[data-report-plan-slot]')?.dataset.reportPlanSourceSlot
                    || deleteSlotButton.dataset.reportPlanLocalSlot;
                parts.deleteReportDeckPlanSlot(root, state, meta, deleteSlotButton.dataset.reportPlanDeleteSlot, sourceSlot);
                return;
            }

            const overviewTarget = event.target?.closest?.('[data-report-slide8-overview]');
            if (overviewTarget && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                parts.openReportDeckOverviewDialog(root, state, overviewTarget.dataset.reportSlide8Overview);
                return;
            }

            const planSummaryTarget = event.target?.closest?.('[data-report-plan-summary]');
            if (planSummaryTarget && root.dataset.reportEditMode === 'editing') {
                const slideKey = String(planSummaryTarget.dataset.reportPlanSummary || '').trim();
                if (slideKey === 'slide9' || slideKey === 'slide10') {
                    event.preventDefault();
                    parts.openReportDeckOverviewDialog(root, state, planSummaryTarget.dataset.reportPlanSourceSlot, slideKey);
                    return;
                }
            }

            const safetySummaryCell = event.target?.closest?.('.report-safety-summary-cell');
            if (safetySummaryCell && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const sourceSlot = safetySummaryCell.dataset.reportPlanSourceSlot || safetySummaryCell.dataset.reportPlanLocalSlot;
                parts.openReportDeckOverviewDialog(root, state, sourceSlot, 'slide10');
                return;
            }

            const imageClearButton = event.target?.closest?.('[data-report-plan-image-clear]');
            if (imageClearButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                const key = String(imageClearButton.dataset.reportPlanImageClear || '').trim();
                if (clearReportDeckPlanImageValue(state, key)) {
                    parts.syncReportDeckPlanControls(root, state);
                    markReportDeckDirty(root, state, meta);
                }
                return;
            }

            const imagePasteButton = event.target?.closest?.('[data-report-plan-image-paste]');
            if (imagePasteButton && root.dataset.reportEditMode === 'editing') {
                event.preventDefault();
                if (imagePasteButton.disabled) return;
                const imageFrame = parts.getReportDeckPlanImageFrameFromTarget(imagePasteButton);
                if (imageFrame && parts.canUseReportDeckPlanImagePaste(root, imageFrame)) {
                    parts.setReportDeckActivePlanImageFrame(root, imageFrame);
                    imageFrame.focus?.();
                    parts.setReportDeckStatus(root, 'dirty', '붙여넣을 이미지 칸 선택됨');
                }
                return;
            }

            const imageFrame = parts.getReportDeckPlanImageFrameFromTarget(event.target);
            const imageFrameAction = event.target?.closest?.('[data-report-plan-image-choice], [data-report-plan-image-clear]');
            if (imageFrame && !imageFrameAction && root.dataset.reportEditMode === 'editing' && parts.getReportDeckPlanImageKeyFromFrame(imageFrame)) {
                event.preventDefault();
                if (parts.canUseReportDeckPlanImagePaste(root, imageFrame)) {
                    parts.setReportDeckActivePlanImageFrame(root, imageFrame);
                    imageFrame.focus?.();
                }
                return;
            }

            const fullscreenButton = event.target?.closest?.('[data-report-fullscreen]');
            if (fullscreenButton) {
                event.preventDefault();
                void parts.presentReportDeck(root, state, meta);
                return;
            }

            const editFullscreenButton = event.target?.closest?.('[data-report-edit-fullscreen-toggle]');
            if (editFullscreenButton) {
                event.preventDefault();
                parts.toggleReportDeckEditFullscreen(root, state, meta);
                return;
            }

            const contentsToggleButton = event.target?.closest?.('[data-report-contents-toggle]');
            if (contentsToggleButton) {
                event.preventDefault();
                parts.toggleReportDeckContents(root);
                return;
            }

            const exportButton = event.target?.closest?.('[data-report-export-html]');
            if (exportButton) {
                event.preventDefault();
                parts.closeReportDeckSaveMenu(root);
                void parts.exportReportDeckSingleHtml(root, state, meta);
                return;
            }

            const pdfButton = event.target?.closest?.('[data-report-capture-pdf]');
            if (pdfButton) {
                event.preventDefault();
                parts.closeReportDeckSaveMenu(root);
                void parts.captureReportDeckPdf(root, state, meta);
                return;
            }

            const captureButton = event.target?.closest?.('[data-report-capture-zip]');
            if (captureButton) {
                event.preventDefault();
                parts.closeReportDeckSaveMenu(root);
                void parts.captureReportDeckZip(root, state, meta);
                return;
            }

            const printButton = event.target?.closest?.('[data-report-print-pdf]');
            if (printButton) {
                event.preventDefault();
                parts.printReportDeckPdf(root, state);
                return;
            }

            const jumpButton = event.target?.closest?.('[data-report-jump-slide]');
            if (jumpButton) {
                event.preventDefault();
                const jumpView = String(jumpButton.dataset.reportJumpView || '').trim();
                if (jumpView) {
                    parts.setReportDeckView(root, jumpView, jumpButton.dataset.reportJumpSlide);
                } else {
                    parts.setReportDeckSlide(root, jumpButton.dataset.reportJumpSlide);
                }
                root.querySelector?.('[data-report-stage]')?.focus?.();
                return;
            }

            const slideButton = event.target?.closest?.('[data-report-slide-target]');
            if (slideButton) {
                event.preventDefault();
                parts.setReportDeckSlide(root, slideButton.dataset.reportSlideTarget);
                return;
            }

            if (parts.isReportDeckFullscreenAdvanceClick(root, event.target)) {
                event.preventDefault?.();
                parts.moveReportDeckSlide(root, 1);
            }
        });

        function handleReportDeckInput(event) {
            const monthSelect = event.target?.closest?.('[data-report-month-select]');
            if (monthSelect) {
                void selectReportDeckMonth(root, state, meta, monthSelect.value);
                return;
            }
            if (parts.handleReportDeckCaptureControlInput(root, state, event.target, event.type)) {
                return;
            }
            const overviewTeamField = event.target?.closest?.('[data-report-overview-team]');
            if (overviewTeamField) {
                parts.syncReportDeckOverviewCustomTeamRow(parts.getReportDeckOverviewDialog(root));
                return;
            }
            const overviewCustomTeamField = event.target?.closest?.('[data-report-overview-custom-team]');
            if (overviewCustomTeamField) {
                overviewCustomTeamField.setCustomValidity?.('');
                return;
            }
            const overviewAmountField = event.target?.closest?.('[data-report-overview-amount], [data-report-overview-amount-text]');
            if (overviewAmountField) {
                parts.syncReportDeckOverviewAmountFields(parts.getReportDeckOverviewDialog(root));
                return;
            }
            const memoSelector = event.target?.closest?.('[data-report-memo-team], [data-report-memo-metric]');
            if (memoSelector) {
                if (root.dataset.reportEditMode === 'editing') {
                    void parts.refreshReportDeckMemoDialog(root, state, meta);
                }
                return;
            }
            const memoNotepadFontSizeInput = event.target?.closest?.('[data-report-memo-notepad-font-size-input]');
            if (memoNotepadFontSizeInput) {
                if (root.dataset.reportEditMode === 'editing' && event.type === 'change') {
                    const dialog = parts.getReportDeckMemoDialog(root);
                    const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                    parts.setReportDeckMemoNotepadFontSize(root, state, meta, dialog, key, memoNotepadFontSizeInput.value);
                }
                return;
            }
            const memoNotepadInput = event.target?.closest?.('[data-report-memo-notepad]');
            if (memoNotepadInput) {
                const dialog = parts.getReportDeckMemoDialog(root);
                parts.rememberReportDeckMemoNotepadSelection(dialog, memoNotepadInput);
                if (event.type === 'select') {
                    parts.syncReportDeckMemoNotepadFontSizeControl(dialog, state);
                    return;
                }
                if (root.dataset.reportEditMode === 'editing') {
                    const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                    parts.syncReportDeckMemoNotepadToState(root, state, meta, dialog, key, { syncDialog: false });
                }
                parts.syncReportDeckMemoDialogPreview(dialog, state);
                parts.syncReportDeckMemoNotepadFontSizeControl(dialog, state);
                return;
            }
            const memoLineInput = event.target?.closest?.('[data-report-memo-line-input]');
            if (memoLineInput) {
                if (root.dataset.reportEditMode === 'editing') {
                    const dialog = parts.getReportDeckMemoDialog(root);
                    const key = parts.getReportDeckMemoDialogTargetKey(dialog);
                    const index = Number.parseInt(String(memoLineInput.dataset.reportMemoLineInput || ''), 10);
                    if (key && Number.isInteger(index) && Object.prototype.hasOwnProperty.call(state, key)) {
                        const lines = parts.getReportDeckMemoLines(state[key]);
                        if (index >= 0) {
                            lines[index] = String(memoLineInput.value || '');
                            parts.setReportDeckMemoLines(root, state, meta, dialog, key, lines, { syncDialog: false });
                        }
                    }
                }
                return;
            }
            const overviewField = event.target?.closest?.('[data-report-slide8-overview]');
            if (overviewField) {
                parts.syncReportDeckFields(root, state, meta);
                return;
            }
            const fieldTarget = event.target?.closest?.('[data-report-field]');
            const fieldTargetKey = String(fieldTarget?.dataset?.reportField || '').trim();
            if (parts.isReportDeckLockedFieldKey(fieldTargetKey)) {
                parts.syncReportDeckFields(root, state, meta);
                return;
            }
            const planImageInput = event.target?.closest?.('[data-report-plan-image-input]');
            if (planImageInput) {
                void updateReportDeckPlanImage(root, state, meta, planImageInput);
                return;
            }
            if (root.dataset.reportEditMode !== 'editing') return;
            const dateInput = event.target?.closest?.('[data-report-date-input]');
            if (dateInput) {
                state.reportDate = parts.normalizeReportDeckDate(dateInput.value) || parts.REPORT_DECK_DEFAULT.reportDate;
                parts.syncReportDeckFields(root, state, meta);
                markReportDeckDirty(root, state, meta);
                return;
            }
            const planCountSelect = event.target?.closest?.('[data-report-plan-count-select]');
            if (planCountSelect) {
                const key = String(planCountSelect.dataset.reportPlanCountSelect || '').trim();
                if (key && Object.prototype.hasOwnProperty.call(state, key)) {
                    state[key] = String(parts.normalizeReportDeckPlanSlotCount(planCountSelect.value));
                    parts.syncReportDeckPlanControls(root, state);
                    markReportDeckDirty(root, state, meta);
                }
                return;
            }
            const safetyTeamSelect = event.target?.closest?.('[data-report-safety-team-select]');
            if (safetyTeamSelect) {
                parts.syncReportDeckPlanControls(root, state);
                return;
            }
            const planSummary = event.target?.closest?.('[data-report-plan-summary]');
            if (planSummary) {
                parts.syncReportDeckPlanControls(root, state);
                return;
            }
            const field = fieldTarget || event.target?.closest?.('[data-report-field]');
            const key = String(field?.dataset?.reportField || '').trim();
            if (
                !key
                || parts.isReportDeckLockedFieldKey(key)
                || parts.isReportDeckSlide8OverviewKey(key)
                || parts.isReportDeckSlide9OverviewKey(key)
                || parts.isReportDeckSlide10OverviewKey(key)
                || !Object.prototype.hasOwnProperty.call(state, key)
            ) return;
            state[key] = String(field.textContent || '');
            parts.syncReportDeckFieldRefs(root, state, key);
            markReportDeckDirty(root, state, meta);
        }

        root.addEventListener?.('keydown', parts.handleReportDeckCaptureRangeKeydown);
        root.addEventListener?.('input', handleReportDeckInput);
        root.addEventListener?.('change', handleReportDeckInput);
        root.addEventListener?.('select', handleReportDeckInput);
        root.addEventListener?.('paste', event => {
            if (event?.defaultPrevented || root.dataset.reportEditMode !== 'editing') return;
            void pasteReportDeckPlanImage(root, state, meta, event);
        });
        root.addEventListener?.(parts.REPORT_DECK_COMPLETE_EDIT_EVENT, event => {
            if (root.dataset.reportEditMode === 'editing') {
                event.preventDefault?.();
                void completeReportDeckEdit(root, state, meta);
            }
        });

        root.addEventListener?.('keydown', event => {
            if (parts.isReportDeckSaveShortcut(event) && root.dataset.reportEditMode === 'editing') {
                event.preventDefault?.();
                event.stopPropagation?.();
                void completeReportDeckEdit(root, state, meta);
                return;
            }
            const key = String(event.key || '');
            if (key === 'Escape' && parts.isReportDeckSaveMenuOpen(root)) {
                event.preventDefault?.();
                parts.closeReportDeckSaveMenu(root);
                return;
            }
            const memoNotepadFontSizeInput = event.target?.closest?.('[data-report-memo-notepad-font-size-input]');
            if (memoNotepadFontSizeInput && root.dataset.reportEditMode === 'editing') {
                event.stopPropagation?.();
                if (key === 'Enter') {
                    event.preventDefault?.();
                    const dialog = parts.getReportDeckMemoDialog(root);
                    const memoKey = parts.getReportDeckMemoDialogTargetKey(dialog);
                    parts.setReportDeckMemoNotepadFontSize(root, state, meta, dialog, memoKey, memoNotepadFontSizeInput.value);
                }
                return;
            }
            const memoTextInput = event.target?.closest?.('[data-report-memo-line-input], [data-report-memo-notepad]');
            if (memoTextInput && (key === 'Enter' || key === ' ' || event.code === 'Space')) {
                event.stopPropagation?.();
                return;
            }
            if (root.dataset.reportEditMode === 'editing') return;
            if (key === 'ArrowRight' || key === 'PageDown' || key === ' ') {
                event.preventDefault?.();
                parts.moveReportDeckSlide(root, 1);
            } else if (key === 'ArrowLeft' || key === 'PageUp') {
                event.preventDefault?.();
                parts.moveReportDeckSlide(root, -1);
            }
        });

        const reportDeckDocument = root?.ownerDocument || null;
        const handleReportDeckFullscreenChange = () => {
            const fullscreenElement = reportDeckDocument?.fullscreenElement || reportDeckDocument?.webkitFullscreenElement || null;
            if (fullscreenElement === root) {
                if (root.dataset.reportFullscreenOutputMode === 'true') {
                    parts.applyReportDeckFullscreenOutputPreparedState(root);
                }
                if (root.dataset.reportEditFullscreenMode === 'true') {
                    parts.syncReportDeckFullscreenControls(root);
                }
                return;
            }
            parts.clearReportDeckFullscreenOutputState(root, state);
            parts.clearReportDeckEditFullscreenState(root);
        };
        reportDeckDocument?.addEventListener?.('fullscreenchange', handleReportDeckFullscreenChange);
        reportDeckDocument?.addEventListener?.('webkitfullscreenchange', handleReportDeckFullscreenChange);
    }
    Object.assign(parts, {
        applyReportDeckState,
        clearReportDeckPlanImageValue,
        completeReportDeckEdit,
        initReportDeckEditor,
        loadReportDeckMonthOptions,
        loadReportDeckStateFromServer,
        markReportDeckDirty,
        pasteReportDeckPlanImage,
        readReportDeckImageFile,
        resetReportDeckStateForMonth,
        saveReportDeckStateToServer,
        selectReportDeckMonth,
        updateReportDeckPlanImage,
        updateReportDeckPlanImageFile,
    });
})(this);
