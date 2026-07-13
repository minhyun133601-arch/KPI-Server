(function registerKpiReportDeckRuntimePlanEditor(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function normalizeReportDeckPlanSlotCount(value) {
        const count = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(count)) return 4;
        return Math.max(1, Math.min(4, count));
    }

    function normalizeReportDeckPlanItemCount(value, slideKey = '') {
        const count = Number.parseInt(String(value || ''), 10);
        if (!Number.isInteger(count)) return 0;
        if (parts.normalizeReportDeckPlanSlideKey(slideKey) === 'slide10') return Math.max(0, count);
        return Math.max(0, Math.min(parts.getReportDeckPlanMaxItems(slideKey), count));
    }

    function isReportDeckPlanImageSourceKey(key) {
        return /^slide(?:8(?:Before|After)?Image|9Image|10(?:Before|After)Image)\d+Source$/.test(String(key || '').trim());
    }

    function getReportDeckPlanImageSourceKey(key) {
        const imageKey = String(key || '').trim();
        return imageKey ? `${imageKey}Source` : '';
    }

    function normalizeReportDeckPlanImageSource(value) {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'paste' || normalized === 'upload' ? normalized : '';
    }

    function getReportDeckPlanImagePlaceholderText(root) {
        if (root?.dataset?.reportEditMode !== 'editing') return '';
        return '이미지 첨부 또는 붙여넣기';
    }

    function canUseReportDeckPlanImageAttachment(root, frame) {
        return Boolean(
            root?.dataset?.reportEditMode === 'editing'
            && frame?.dataset?.hasImage !== 'true'
            && getReportDeckPlanImageKeyFromFrame(frame)
        );
    }

    function canUseReportDeckPlanImagePaste(root, frame) {
        return Boolean(
            root?.dataset?.reportEditMode === 'editing'
            && frame?.dataset?.hasImage !== 'true'
            && getReportDeckPlanImageKeyFromFrame(frame)
        );
    }

    function syncReportDeckPlanImageAttachmentState(root) {
        Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []).forEach(frame => {
            const hasEditableImageKey = Boolean(
                root?.dataset?.reportEditMode === 'editing'
                && getReportDeckPlanImageKeyFromFrame(frame)
            );
            const canReceiveNewImage = hasEditableImageKey && frame?.dataset?.hasImage !== 'true';
            const canAttach = canUseReportDeckPlanImageAttachment(root, frame);
            frame.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            frame.setAttribute?.('tabindex', canReceiveNewImage ? '0' : '-1');
            const input = getReportDeckPlanImageInputFromFrame(frame);
            if (input) input.disabled = !canAttach;
            const uploadButton = frame?.querySelector?.('[data-report-plan-image-upload]');
            if (uploadButton) {
                uploadButton.disabled = !canReceiveNewImage;
                uploadButton.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            }
            const pasteButton = frame?.querySelector?.('[data-report-plan-image-paste]');
            if (pasteButton) {
                pasteButton.disabled = !canReceiveNewImage;
                pasteButton.setAttribute?.('aria-disabled', canReceiveNewImage ? 'false' : 'true');
            }
        });
    }

    function syncReportDeckPlanImageModeHints(root) {
        Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []).forEach(frame => {
            const placeholder = frame?.querySelector?.('[data-report-plan-image-placeholder]');
            if (placeholder) placeholder.textContent = getReportDeckPlanImagePlaceholderText(root);
        });
        syncReportDeckPlanImageAttachmentState(root);
    }

    function buildReportDeckPlanPageCounts(totalCount, slideKey = '', state = {}) {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey);
        const total = normalizeReportDeckPlanItemCount(totalCount, normalizedSlideKey);
        if (normalizedSlideKey === 'slide10') {
            return Array.from({ length: parts.getReportDeckSlide10RequiredPageCount(state) }, () => parts.REPORT_DECK_SLIDE10_SLOTS_PER_PAGE);
        }
        if (total <= 0) return [0];
        if (total <= 4) return [total];
        if (total <= 6) return [3, total - 3];
        return [4, total - 4];
    }

    function getReportDeckPlanPageStart(pageCounts = [], pageIndex = 0) {
        return pageCounts.slice(0, Math.max(0, pageIndex)).reduce((sum, count) => sum + count, 0) + 1;
    }

    function getReportDeckPlanSourceIndex(state = {}, slideKey = '', pageIndex = 0, localSlotIndex = 1) {
        const pageCounts = buildReportDeckPlanPageCounts(state[`${slideKey}SlotCount`], slideKey);
        return getReportDeckPlanPageStart(pageCounts, pageIndex) + Math.max(1, localSlotIndex) - 1;
    }

    function isReportDeckOptionalPageEnabled(state = {}, pageKey = '') {
        const normalizedPageKey = String(pageKey || '').trim();
        if (normalizedPageKey !== 'slide10') return true;
        return true;
    }

    function syncReportDeckOptionalPageControls(root, state = {}) {
        const slide10Enabled = isReportDeckOptionalPageEnabled(state, 'slide10');
        if (root?.dataset) root.dataset.reportSlide10Enabled = slide10Enabled ? 'true' : 'false';
        Array.from(root?.querySelectorAll?.('[data-report-add-page]') || []).forEach(button => {
            const pageKey = String(button.dataset.reportAddPage || '').trim();
            const enabled = isReportDeckOptionalPageEnabled(state, pageKey);
            button.disabled = root?.dataset?.reportEditMode !== 'editing' || enabled;
        });
    }

    function getReportDeckSlide10PageSlides(root) {
        return Array.from(root?.querySelectorAll?.('[data-report-dynamic-slide="slide10"]') || [])
            .sort((left, right) => (
                (Number.parseInt(String(left?.dataset?.reportDynamicPage || '0'), 10) || 0)
                - (Number.parseInt(String(right?.dataset?.reportDynamicPage || '0'), 10) || 0)
            ));
    }

    function configureReportDeckSlide10Page(slide, pageIndex = 0) {
        if (!slide?.dataset) return;
        slide.dataset.reportDynamicPage = String(pageIndex);
        slide.dataset.reportOptionalPage = 'slide10';
        slide.dataset.reportSlideLabel = '자율 안전 신고제';
        const layout = slide.querySelector?.('[data-report-plan-slide="slide10"]');
        if (layout?.dataset) layout.dataset.reportPlanPage = String(pageIndex);
        Array.from(slide.querySelectorAll?.('[data-report-safety-row]') || []).forEach((table, rowIndex) => {
            if (table?.dataset) {
                table.dataset.reportSafetyRow = String(rowIndex);
                table.dataset.reportSafetyTableIndex = String(rowIndex);
            }
            Array.from(table.querySelectorAll?.('[data-report-plan-row-team]') || []).forEach(label => {
                label.dataset.reportPlanRowIndex = String(rowIndex);
            });
        });
    }

    function ensureReportDeckSlide10PageCapacity(root, state = {}) {
        const targetPageCount = parts.getReportDeckSlide10RequiredPageCount(state);
        const slides = getReportDeckSlide10PageSlides(root);
        const template = slides[slides.length - 1] || null;
        const parent = template?.parentNode || null;
        if (template?.cloneNode && parent?.insertBefore) {
            while (slides.length < targetPageCount) {
                const clone = template.cloneNode(true);
                configureReportDeckSlide10Page(clone, slides.length);
                clone.hidden = true;
                parent.insertBefore(clone, slides[slides.length - 1]?.nextSibling || null);
                slides.push(clone);
            }
        }
        slides.forEach((slide, index) => {
            configureReportDeckSlide10Page(slide, index);
            slide.hidden = index >= targetPageCount;
        });
    }

    function syncReportDeckDeleteUndoControls(root, state) {
        const canRestore = root?.dataset?.reportEditMode === 'editing'
            && parts.hasReportDeckSlide10DeletedSlotBackups(state);
        Array.from(root?.querySelectorAll?.('[data-report-undo-delete]') || []).forEach(button => {
            button.disabled = !canRestore;
            button.title = canRestore ? '마지막 삭제 칸 복구' : '복구할 삭제 칸 없음';
        });
    }

    function syncReportDeckPlanControls(root, state) {
        syncReportDeckOptionalPageControls(root, state);
        ensureReportDeckSlide10PageCapacity(root, state);
        Array.from(root?.querySelectorAll?.('[data-report-plan-slide]') || []).forEach(slide => {
            const slideKey = parts.normalizeReportDeckPlanSlideKey(slide.dataset.reportPlanSlide);
            if (!slideKey) return;
            const pageIndex = Math.max(0, Number.parseInt(String(slide.dataset.reportPlanPage || '0'), 10) || 0);
            const totalCount = normalizeReportDeckPlanItemCount(state[`${slideKey}SlotCount`], slideKey);
            state[`${slideKey}SlotCount`] = String(totalCount);
            const includeSlide10EditableEmptyRows = slideKey === 'slide10' && root?.dataset?.reportEditMode === 'editing';
            const pageCounts = buildReportDeckPlanPageCounts(totalCount, slideKey, state);
            const pageCount = pageCounts[pageIndex] || 0;
            const displayCount = slideKey === 'slide10'
                ? parts.REPORT_DECK_SLIDE10_SLOTS_PER_PAGE
                : pageCount;
            const pageStart = getReportDeckPlanPageStart(pageCounts, pageIndex);
            const slide10PageRows = slideKey === 'slide10'
                ? parts.getReportDeckSlide10PageRows(state, pageIndex, {
                    includeEmpty: true,
                    includeEditableEmptyRows: includeSlide10EditableEmptyRows
                })
                : [];
            if (slideKey === 'slide10') {
                const filledRowCount = slide10PageRows.filter(row => (
                    row.some(index => index && parts.hasReportDeckSlide10OverviewData(parts.getReportDeckSlide10OverviewEntry(state, index)))
                )).length;
                slide.dataset.reportPlanFilledRowCount = String(filledRowCount);
            } else {
                delete slide.dataset.reportPlanFilledRowCount;
            }
            const getSourceIndex = localSlotIndex => (
                slideKey === 'slide10'
                    ? parts.getReportDeckSlide10SourceIndexForLocalSlot(state, pageIndex, localSlotIndex, {
                        includeEmpty: true,
                        includeEditableEmptyRows: includeSlide10EditableEmptyRows
                    })
                    : pageStart + localSlotIndex - 1
            );
            const isFilledSourceIndex = sourceIndex => (
                slideKey === 'slide10'
                    ? sourceIndex >= 1 && parts.hasReportDeckSlide10OverviewData(parts.getReportDeckSlide10OverviewEntry(state, sourceIndex))
                    : sourceIndex >= 1
                        && sourceIndex <= parts.getReportDeckPlanMaxItems(slideKey)
                        && parts.hasReportDeckPlanOverviewData(state, slideKey, sourceIndex)
            );
            const filledSlotCount = Array.from({ length: displayCount }, (_, index) => getSourceIndex(index + 1))
                .filter(sourceIndex => sourceIndex >= 1 && isFilledSourceIndex(sourceIndex))
                .length;
            const slidePage = slide.closest?.('[data-report-slide-page]');
            if (slidePage) {
                slidePage.hidden = slideKey === 'slide10'
                    ? pageIndex >= parts.getReportDeckSlide10RequiredPageCount(state, {
                        includeEditableEmptyRows: includeSlide10EditableEmptyRows
                    })
                    : pageIndex > 0 && pageCount <= 0;
            }
            slide.dataset.reportPlanSlotCount = String(displayCount);
            slide.dataset.reportPlanFilledSlotCount = String(filledSlotCount);
            if (slideKey === 'slide10') {
                slide.dataset.reportPlanActiveSlotCount = String(filledSlotCount);
            } else {
                delete slide.dataset.reportPlanActiveSlotCount;
            }
            Array.from(slide.querySelectorAll?.('[data-report-plan-slot]') || []).forEach(cell => {
                const localSlotIndex = Number.parseInt(String(cell.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = getSourceIndex(localSlotIndex);
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= displayCount && sourceIndex >= 1;
                const filled = active && isFilledSourceIndex(sourceIndex);
                cell.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                cell.dataset.reportPlanActive = active ? 'true' : 'false';
                cell.dataset.reportPlanFilled = filled ? 'true' : 'false';
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-header-slot]') || []).forEach(header => {
                const localSlotIndex = Number.parseInt(String(header.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = getSourceIndex(localSlotIndex);
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= displayCount && sourceIndex >= 1;
                const filled = active && isFilledSourceIndex(sourceIndex);
                header.textContent = active ? String(sourceIndex) : '';
                header.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                header.dataset.reportPlanFilled = filled ? 'true' : 'false';
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-summary]') || []).forEach(summary => {
                const localSlotIndex = Number.parseInt(String(summary.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = getSourceIndex(localSlotIndex);
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= displayCount && sourceIndex >= 1;
                const filled = active && isFilledSourceIndex(sourceIndex);
                summary.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                summary.dataset.reportPlanFilled = filled ? 'true' : 'false';
                if (slideKey === 'slide10') {
                    const entry = active ? parts.getReportDeckSlide10OverviewEntry(state, sourceIndex) : {};
                    summary.innerHTML = active ? parts.renderReportDeckSlide10OverviewSummaryHtml(entry) : '';
                } else {
                    summary.textContent = active ? String(state[`${slideKey}Item${sourceIndex}Text`] || '') : '';
                }
                if (summary.dataset.reportSlide8Overview !== undefined) {
                    summary.dataset.reportSlide8Overview = active ? String(sourceIndex) : '';
                }
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-team]') || []).forEach(team => {
                const localSlotIndex = Number.parseInt(String(team.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = getSourceIndex(localSlotIndex);
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= displayCount && sourceIndex >= 1;
                const filled = active && isFilledSourceIndex(sourceIndex);
                team.textContent = active ? String(state[`${slideKey}Item${sourceIndex}Team`] || '') : '';
                team.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                team.dataset.reportPlanFilled = filled ? 'true' : 'false';
            });
            if (slideKey === 'slide10') {
                const slide10MoveTables = cloneReportDeckSlide10TablesForManualMove(state);
                Array.from(slide.querySelectorAll?.('[data-report-plan-row-team]') || []).forEach(label => {
                    const rowIndex = Math.max(0, Number.parseInt(String(label.dataset.reportPlanRowIndex || '0'), 10) || 0);
                    const row = parts.getReportDeckSlide10PageRow(state, pageIndex, rowIndex, {
                        includeEmpty: true,
                        includeEditableEmptyRows: includeSlide10EditableEmptyRows
                    });
                    const sourceIndexes = slide10PageRows[rowIndex] || row.sourceIndexes || [];
                    const rowFilledSlotCount = sourceIndexes
                        .filter(index => index && parts.hasReportDeckSlide10OverviewData(parts.getReportDeckSlide10OverviewEntry(state, index)))
                        .length;
                    const rowFilled = rowFilledSlotCount > 0;
                    const fallbackTeam = row.team || (parts.hasReportDeckSlide10Content(state) ? '' : parts.getReportDeckSlide10DefaultTeamForPageRow(pageIndex, rowIndex));
                    const teamText = parts.getReportDeckSlide10RowTeamLabel(state, sourceIndexes, fallbackTeam);
                    const labelText = label.querySelector?.('[data-report-plan-row-team-label]');
                    if (labelText) {
                        labelText.textContent = teamText;
                    } else {
                        label.textContent = teamText;
                    }
                    label.dataset.reportPlanRowFilled = rowFilled ? 'true' : 'false';
                    label.dataset.reportPlanRowActiveSlotCount = String(rowFilledSlotCount);
                    const table = label.closest?.('.report-safety-table');
                    if (table?.dataset) {
                        table.dataset.reportPlanRowFilled = rowFilled ? 'true' : 'false';
                        table.dataset.reportPlanRowFilledSlotCount = String(rowFilledSlotCount);
                        table.dataset.reportPlanRowActiveSlotCount = String(rowFilledSlotCount);
                    }
                    const addButton = label.querySelector?.('[data-report-plan-add-slot="slide10"]');
                    if (addButton) {
                        addButton.disabled = root?.dataset?.reportEditMode !== 'editing';
                    }
                });
                Array.from(slide.querySelectorAll?.('[data-report-safety-table-move]') || []).forEach(button => {
                    const direction = normalizeReportDeckSlide10TableMoveDirection(button.dataset.reportSafetyTableMove);
                    const context = direction ? getReportDeckSlide10TableMoveContext(button) : null;
                    const enabled = root?.dataset?.reportEditMode === 'editing'
                        && context
                        && canMoveReportDeckSlide10Table(slide10MoveTables, context, direction);
                    button.disabled = !enabled;
                    button.dataset.reportSafetyTableMoveEnabled = enabled ? 'true' : 'false';
                });
                Array.from(slide.querySelectorAll?.('[data-report-safety-team-select]') || []).forEach(select => {
                    select.disabled = root?.dataset?.reportEditMode !== 'editing';
                });
                Array.from(slide.querySelectorAll?.('[data-report-safety-add-toggle]') || []).forEach(button => {
                    button.disabled = root?.dataset?.reportEditMode !== 'editing';
                });
                Array.from(slide.querySelectorAll?.('[data-report-safety-team-option]') || []).forEach(button => {
                    button.disabled = root?.dataset?.reportEditMode !== 'editing';
                });
            }
            Array.from(slide.querySelectorAll?.('[data-report-plan-delete-slot]') || []).forEach(button => {
                const localSlotIndex = Number.parseInt(String(button.dataset.reportPlanLocalSlot || '').trim(), 10);
                const sourceIndex = getSourceIndex(localSlotIndex);
                const active = Number.isInteger(localSlotIndex) && localSlotIndex >= 1 && localSlotIndex <= displayCount && sourceIndex >= 1;
                const filled = active && isFilledSourceIndex(sourceIndex);
                button.dataset.reportPlanSourceSlot = active ? String(sourceIndex) : '';
                button.dataset.reportPlanFilled = filled ? 'true' : 'false';
                button.disabled = !active;
            });
            Array.from(slide.querySelectorAll?.('[data-report-plan-add-slot]') || []).forEach(button => {
                if (slideKey === 'slide10') {
                    button.disabled = root?.dataset?.reportEditMode !== 'editing';
                    return;
                }
                button.disabled = totalCount >= parts.getReportDeckPlanMaxItems(slideKey);
            });
        });

        Array.from(root?.querySelectorAll?.('[data-report-plan-image]') || []).forEach(image => {
            const role = String(image.dataset.reportPlanImageRole || '').trim();
            const sourceIndex = Number.parseInt(String(image.dataset.reportPlanSourceSlot || image.closest?.('[data-report-plan-slot]')?.dataset.reportPlanSourceSlot || '').trim(), 10);
            const key = role
                ? (Number.isInteger(sourceIndex) && sourceIndex >= 1 ? `${role}${sourceIndex}` : '')
                : String(image.dataset.reportPlanImage || '').trim();
            const value = key ? String(state[key] || '') : '';
            image.dataset.reportPlanImage = key;
            const frame = image.closest?.('[data-report-plan-image-frame]');
            const input = frame?.querySelector?.('[data-report-plan-image-input]');
            const uploadButton = frame?.querySelector?.('[data-report-plan-image-upload]');
            const pasteButton = frame?.querySelector?.('[data-report-plan-image-paste]');
            const clearButton = frame?.querySelector?.('[data-report-plan-image-clear]');
            const placeholder = frame?.querySelector?.('[data-report-plan-image-placeholder]');
            const source = normalizeReportDeckPlanImageSource(state[getReportDeckPlanImageSourceKey(key)]);
            if (input) input.dataset.reportPlanImageKey = key;
            if (uploadButton) uploadButton.dataset.reportPlanImageUpload = key;
            if (pasteButton) pasteButton.dataset.reportPlanImagePaste = key;
            if (clearButton) clearButton.dataset.reportPlanImageClear = key;
            if (placeholder) placeholder.textContent = getReportDeckPlanImagePlaceholderText(root);
            if (frame?.dataset) {
                frame.dataset.reportPlanImageKey = key;
                frame.dataset.reportPlanImageSource = source;
            }
            if (value) {
                image.src = value;
                image.removeAttribute?.('hidden');
                frame?.setAttribute?.('data-has-image', 'true');
            } else {
                image.removeAttribute?.('src');
                image.setAttribute?.('hidden', 'hidden');
                frame?.setAttribute?.('data-has-image', 'false');
            }
        });
        syncReportDeckPlanImageModeHints(root);
        syncReportDeckDeleteUndoControls(root, state);
        parts.syncReportDeckDynamicSlides(root);
    }

    function getReportDeckPlanImageFrameFromTarget(target) {
        return target?.closest?.('[data-report-plan-image-frame]') || null;
    }

    function getReportDeckPlanImageInputFromFrame(frame) {
        return frame?.querySelector?.('[data-report-plan-image-input]') || null;
    }

    function getReportDeckPlanImageKeyFromFrame(frame) {
        const frameKey = String(frame?.dataset?.reportPlanImageKey || '').trim();
        if (frameKey) return frameKey;
        const inputKey = String(getReportDeckPlanImageInputFromFrame(frame)?.dataset?.reportPlanImageKey || '').trim();
        if (inputKey) return inputKey;
        return String(frame?.querySelector?.('[data-report-plan-image]')?.dataset?.reportPlanImage || '').trim();
    }

    function getReportDeckPlanImageFrames(root) {
        return Array.from(root?.querySelectorAll?.('[data-report-plan-image-frame]') || []);
    }

    function setReportDeckActivePlanImageFrame(root, frame) {
        root.__reportDeckActivePlanImageFrame = frame || null;
        getReportDeckPlanImageFrames(root).forEach(item => {
            if (item?.dataset) item.dataset.reportPlanPasteTarget = item === frame ? 'true' : 'false';
        });
    }

    function isReportDeckUsablePlanImageFrame(frame, state) {
        const key = getReportDeckPlanImageKeyFromFrame(frame);
        return Boolean(key && Object.prototype.hasOwnProperty.call(state, key));
    }

    function hasReportDeckPlanImageValue(state, key) {
        return Boolean(String(state?.[key] || '').trim());
    }

    function getReportDeckPasteCandidateFrames(root) {
        const frames = getReportDeckPlanImageFrames(root);
        const activeSlide = root?.querySelector?.('.report-slide.is-active');
        if (!activeSlide || typeof activeSlide.contains !== 'function') return frames;
        const activeFrames = frames.filter(frame => activeSlide.contains(frame));
        return activeFrames.length ? activeFrames : frames;
    }

    function resolveReportDeckPasteImageFrame(root, state, target) {
        const targetFrame = getReportDeckPlanImageFrameFromTarget(target);
        if (isReportDeckUsablePlanImageFrame(targetFrame, state)) {
            return canUseReportDeckPlanImagePaste(root, targetFrame) ? targetFrame : null;
        }
        if (isReportDeckUsablePlanImageFrame(root.__reportDeckActivePlanImageFrame, state)) {
            return canUseReportDeckPlanImagePaste(root, root.__reportDeckActivePlanImageFrame)
                ? root.__reportDeckActivePlanImageFrame
                : null;
        }
        const frames = getReportDeckPasteCandidateFrames(root);
        return frames.find(frame => isReportDeckUsablePlanImageFrame(frame, state) && canUseReportDeckPlanImagePaste(root, frame) && frame?.dataset?.hasImage !== 'true')
            || null;
    }

    function isReportDeckImageFile(file) {
        const type = String(file?.type || '').toLowerCase();
        if (type.startsWith('image/')) return true;
        return /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)$/i.test(String(file?.name || ''));
    }

    function getReportDeckClipboardImageFile(event) {
        const items = Array.from(event?.clipboardData?.items || []);
        for (const item of items) {
            if (!String(item?.type || '').toLowerCase().startsWith('image/')) continue;
            const file = item.getAsFile?.();
            if (file) return file;
        }
        return Array.from(event?.clipboardData?.files || []).find(isReportDeckImageFile) || null;
    }

    function getReportDeckOverviewDialog(root) {
        return root?.querySelector?.('[data-report-overview-dialog]') || null;
    }

    function getReportDeckOverviewDialogField(dialog, fieldKey) {
        const dataKey = String(fieldKey || '').replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
        return dialog?.querySelector?.(`[data-report-overview-${dataKey}]`) || null;
    }

    function getReportDeckOverviewSlot(root, slotToken, state = {}, slideKey = 'slide8') {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        const maxItems = normalizedSlideKey === 'slide10'
            ? Math.max(parts.getReportDeckSlide10StorageMaxIndex(state), parts.REPORT_DECK_SLIDE10_BASE_SLOT_COUNT)
            : parts.getReportDeckPlanMaxItems(normalizedSlideKey);
        const directSlot = Number.parseInt(String(slotToken || ''), 10);
        if (normalizedSlideKey === 'slide10' && Number.isInteger(directSlot) && directSlot >= 1) return directSlot;
        if (Number.isInteger(directSlot) && directSlot >= 1 && directSlot <= maxItems) return directSlot;
        const activeCount = normalizeReportDeckPlanItemCount(state[`${normalizedSlideKey}SlotCount`], normalizedSlideKey);
        const emptySlot = Array.from({ length: maxItems }, (_, index) => index + 1).find(index => (
            index <= activeCount && !parts.hasReportDeckPlanOverviewData(state, normalizedSlideKey, index)
        ));
        return emptySlot || 1;
    }

    function setReportDeckOverviewKindControls(dialog, kindValue) {
        const normalizedKind = parts.normalizeReportDeckSlide9Kind(kindValue);
        const kindField = getReportDeckOverviewDialogField(dialog, 'kind');
        if (kindField) kindField.value = normalizedKind;
        Array.from(dialog?.querySelectorAll?.('[data-report-overview-kind-option]') || []).forEach(button => {
            const active = parts.normalizeReportDeckSlide9Kind(button.dataset.reportOverviewKindOption) === normalizedKind;
            button.classList?.toggle?.('is-active', active);
            button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
        });
    }

    function syncReportDeckOverviewCustomTeamRow(dialog) {
        const customTeamRow = dialog?.querySelector?.('[data-report-overview-custom-team-row]') || null;
        const customTeamField = getReportDeckOverviewDialogField(dialog, 'customTeam');
        const teamField = getReportDeckOverviewDialogField(dialog, 'team');
        const showCustomTeam = Boolean(parts.normalizeReportDeckPlanSlideKey(dialog?.dataset?.reportOverviewSlideKey))
            && parts.normalizeReportDeckOverviewTeam(teamField?.value) === parts.REPORT_DECK_OTHER_TEAM_LABEL;
        if (customTeamRow) customTeamRow.hidden = !showCustomTeam;
        if (customTeamField) {
            customTeamField.disabled = !showCustomTeam;
            if (!showCustomTeam) {
                customTeamField.value = '';
                customTeamField.setCustomValidity?.('');
            }
        }
        return showCustomTeam;
    }

    function syncReportDeckOverviewAmountFields(dialog) {
        const amountField = getReportDeckOverviewDialogField(dialog, 'amount');
        const amountTextField = getReportDeckOverviewDialogField(dialog, 'amountText');
        const isSlide10 = parts.normalizeReportDeckPlanSlideKey(dialog?.dataset?.reportOverviewSlideKey) === 'slide10';
        if (!amountTextField) return false;
        if (!isSlide10) {
            amountTextField.value = '';
            amountTextField.disabled = true;
            if (amountField) amountField.disabled = false;
            return false;
        }
        amountTextField.disabled = false;
        if (amountField) amountField.disabled = false;
        return true;
    }

    function syncReportDeckOverviewDialogMode(dialog, slideKey) {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        const formMode = normalizedSlideKey === 'slide10' ? 'slide10' : (normalizedSlideKey === 'slide9' ? 'slide9' : 'slide8');
        dialog.dataset.reportOverviewSlideKey = normalizedSlideKey;
        const title = dialog.querySelector?.('[data-report-overview-dialog-title]');
        if (title) {
            title.textContent = normalizedSlideKey === 'slide10'
                ? '자율 안전 신고제 개요'
                : (normalizedSlideKey === 'slide9' ? '주요 계획 개요' : '공사 및 정비 개요');
        }
        Array.from(dialog.querySelectorAll?.('[data-report-overview-mode]') || []).forEach(row => {
            row.hidden = String(row.dataset.reportOverviewMode || '') !== formMode;
        });
        Array.from(dialog.querySelectorAll?.('[data-report-overview-title-row]') || []).forEach(row => {
            row.hidden = false;
        });
        Array.from(dialog.querySelectorAll?.('[data-report-overview-team-row]') || []).forEach(row => {
            row.hidden = false;
        });
        const dateLabel = dialog.querySelector?.('[data-report-overview-date-label]');
        if (dateLabel) dateLabel.textContent = normalizedSlideKey === 'slide10' ? '날짜' : (normalizedSlideKey === 'slide9' ? '예상 날짜' : '완료 날짜');
        const dateField = getReportDeckOverviewDialogField(dialog, 'date');
        if (dateField) {
            const dateInputType = normalizedSlideKey === 'slide9' ? 'month' : 'date';
            dateField.type = dateInputType;
            dateField.setAttribute?.('type', dateInputType);
        }
        const amountLabel = dialog.querySelector?.('[data-report-overview-amount-label]');
        if (amountLabel) amountLabel.textContent = normalizedSlideKey === 'slide10' ? '비용' : (normalizedSlideKey === 'slide9' ? '예상 금액' : '금액');
        syncReportDeckOverviewCustomTeamRow(dialog);
        syncReportDeckOverviewAmountFields(dialog);
    }

    function openReportDeckOverviewDialog(root, state, slotToken, slideKey = 'slide8', options = {}) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog) return false;
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey) || 'slide8';
        const slotIndex = getReportDeckOverviewSlot(root, slotToken, state, normalizedSlideKey);
        const entry = parts.getReportDeckPlanOverviewEntry(state, normalizedSlideKey, slotIndex);
        syncReportDeckOverviewDialogMode(dialog, normalizedSlideKey);
        dialog.dataset.reportOverviewSlot = String(slotIndex);
        const teamField = getReportDeckOverviewDialogField(dialog, 'team');
        const titleField = getReportDeckOverviewDialogField(dialog, 'title');
        const effectField = getReportDeckOverviewDialogField(dialog, 'effect');
        const hazardField = getReportDeckOverviewDialogField(dialog, 'hazard');
        const customTeamField = getReportDeckOverviewDialogField(dialog, 'customTeam');
        const detailField = getReportDeckOverviewDialogField(dialog, 'detail');
        const dateField = getReportDeckOverviewDialogField(dialog, 'date');
        const amountField = getReportDeckOverviewDialogField(dialog, 'amount');
        const amountTextField = getReportDeckOverviewDialogField(dialog, 'amountText');
        const defaultTeam = normalizedSlideKey === 'slide10'
            ? (parts.normalizeReportDeckOverviewTeam(options.defaultTeam) || parts.getReportDeckSlide10TeamForSourceIndex(state, slotIndex))
            : parts.REPORT_DECK_SLIDE8_OVERVIEW_TEAMS[0];
        const entryTeam = parts.normalizeReportDeckOverviewTeamValue(entry.team);
        if (teamField) {
            teamField.value = parts.normalizeReportDeckOverviewTeam(entryTeam) || (entryTeam ? parts.REPORT_DECK_OTHER_TEAM_LABEL : defaultTeam);
        }
        if (customTeamField) {
            customTeamField.value = parts.getReportDeckOverviewCustomTeam(entryTeam);
            customTeamField.setCustomValidity?.('');
        }
        if (titleField) titleField.value = entry.title || '';
        if (effectField) effectField.value = entry.effect || '';
        if (hazardField) hazardField.value = parts.normalizeReportDeckSlide10Hazard(entry.effect);
        if (detailField) detailField.value = entry.detail || '';
        if (dateField) dateField.value = normalizedSlideKey === 'slide9'
            ? parts.normalizeReportDeckOverviewMonth(entry.date)
            : (entry.date || '');
        if (amountField) amountField.value = entry.amount || '';
        if (amountTextField) amountTextField.value = normalizedSlideKey === 'slide10' ? (entry.amountText || '') : '';
        setReportDeckOverviewKindControls(dialog, entry.kind || 'cause');
        syncReportDeckOverviewCustomTeamRow(dialog);
        syncReportDeckOverviewAmountFields(dialog);
        dialog.hidden = false;
        titleField?.focus?.();
        return true;
    }

    function closeReportDeckOverviewDialog(root) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog) return false;
        dialog.hidden = true;
        dialog.dataset.reportOverviewSlot = '';
        dialog.dataset.reportOverviewSlideKey = '';
        return true;
    }

    function saveReportDeckOverviewDialog(root, state, meta) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog || dialog.hidden) return false;
        const slideKey = parts.normalizeReportDeckPlanSlideKey(dialog.dataset.reportOverviewSlideKey) || 'slide8';
        const slotIndex = getReportDeckOverviewSlot(root, dialog.dataset.reportOverviewSlot, state, slideKey);
        const current = parts.getReportDeckPlanOverviewEntry(state, slideKey, slotIndex);
        const amountField = getReportDeckOverviewDialogField(dialog, 'amount');
        const rawAmount = String(amountField?.value || '').trim();
        const normalizedAmount = parts.normalizeReportDeckOverviewAmount(rawAmount);
        if (rawAmount && !normalizedAmount) {
            amountField?.setCustomValidity?.('백만원 단위 숫자만 입력해 주세요.');
            amountField?.reportValidity?.();
            amountField?.focus?.();
            parts.setReportDeckStatus(root, 'error', '금액은 숫자만 입력해 주세요');
            return false;
        }
        amountField?.setCustomValidity?.('');
        const amountText = slideKey === 'slide10'
            ? parts.normalizeReportDeckOverviewAmountText(getReportDeckOverviewDialogField(dialog, 'amountText')?.value)
            : '';
        const selectedTeam = getReportDeckOverviewDialogField(dialog, 'team')?.value || '';
        const customTeamField = getReportDeckOverviewDialogField(dialog, 'customTeam');
        let teamValue = selectedTeam;
        if (parts.normalizeReportDeckOverviewTeam(selectedTeam) === parts.REPORT_DECK_OTHER_TEAM_LABEL) {
            const customTeam = parts.normalizeReportDeckOverviewTeamValue(customTeamField?.value);
            if (!customTeam) {
                customTeamField?.setCustomValidity?.('기타 팀명을 입력해 주세요.');
                customTeamField?.reportValidity?.();
                customTeamField?.focus?.();
                parts.setReportDeckStatus(root, 'error', '기타 팀명을 입력해 주세요');
                return false;
            }
            if (parts.normalizeReportDeckOverviewTeam(customTeam)) {
                customTeamField?.setCustomValidity?.('기존 팀명은 해당 팀을 선택해 주세요.');
                customTeamField?.reportValidity?.();
                customTeamField?.focus?.();
                parts.setReportDeckStatus(root, 'error', '기존 팀명은 기타가 아니라 해당 팀을 선택해 주세요');
                return false;
            }
            teamValue = customTeam;
        }
        customTeamField?.setCustomValidity?.('');
        const entry = {
            ...current,
            team: teamValue,
            title: getReportDeckOverviewDialogField(dialog, 'title')?.value || '',
            effect: slideKey === 'slide10'
                ? (getReportDeckOverviewDialogField(dialog, 'hazard')?.value || '')
                : (getReportDeckOverviewDialogField(dialog, 'effect')?.value || ''),
            kind: getReportDeckOverviewDialogField(dialog, 'kind')?.value || 'cause',
            detail: slideKey === 'slide10' ? '' : (getReportDeckOverviewDialogField(dialog, 'detail')?.value || ''),
            date: slideKey === 'slide9'
                ? parts.normalizeReportDeckPlanExpectedDateValue(getReportDeckOverviewDialogField(dialog, 'date')?.value || '')
                : (getReportDeckOverviewDialogField(dialog, 'date')?.value || ''),
            amount: normalizedAmount,
            amountText
        };
        parts.setReportDeckPlanOverviewEntry(state, slideKey, slotIndex, entry);
        parts.normalizeReportDeckPlanOverviewOrder(state, slideKey);
        if (slideKey === 'slide10') {
            parts.recomputeReportDeckSlide10SlotCount(state);
        }
        parts.syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        closeReportDeckOverviewDialog(root);
        return true;
    }

    function captureReportDeckOpenOverviewDialog(root, state, meta) {
        const dialog = getReportDeckOverviewDialog(root);
        if (!dialog || dialog.hidden) return true;
        return saveReportDeckOverviewDialog(root, state, meta);
    }

    function updateReportDeckStateValue(state, key, value) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const nextValue = String(value || '');
        if (String(state[normalizedKey] || '') === nextValue) return false;
        state[normalizedKey] = nextValue;
        return true;
    }

    function captureReportDeckOpenMemoDialog(root, state, meta) {
        const dialog = parts.getReportDeckMemoDialog(root);
        if (!dialog || dialog.hidden) return false;
        const key = parts.getReportDeckMemoDialogTargetKey(dialog);
        if (!key || !Object.prototype.hasOwnProperty.call(state, key)) return false;
        let changed = false;

        const notepadInput = parts.getReportDeckMemoNotepadInput(dialog);
        if (notepadInput) {
            return parts.syncReportDeckMemoNotepadToState(root, state, meta, dialog, key, { syncDialog: false });
        }

        const lineInputs = Array.from(dialog.querySelectorAll?.('[data-report-memo-line-input]') || []);
        if (lineInputs.length) {
            const nextLines = parts.getReportDeckMemoLines(state[key]);
            lineInputs.forEach(input => {
                const index = Number.parseInt(String(input?.dataset?.reportMemoLineInput || ''), 10);
                if (!Number.isInteger(index) || index < 0) return;
                nextLines[index] = String(input.value || '');
            });
            const nextText = parts.serializeReportDeckMemoLines(nextLines);
            if (nextText !== String(state[key] || '')) {
                changed = parts.setReportDeckMemoLines(root, state, meta, dialog, key, nextLines, { syncDialog: false }) || changed;
            }
        }

        const manualInput = dialog.querySelector?.('[data-report-memo-manual-input]');
        const manualLines = parts.getReportDeckMemoLines(manualInput?.value || '');
        if (manualLines.length) {
            const appended = parts.appendReportDeckMemoLines(root, state, meta, dialog, key, manualLines);
            parts.clearReportDeckMemoManualInput(dialog);
            changed = appended || changed;
        }
        return changed;
    }

    function captureReportDeckEditableFields(root, state, meta) {
        let changed = false;
        Array.from(root?.querySelectorAll?.('[data-report-field]') || []).forEach(field => {
            const key = String(field?.dataset?.reportField || '').trim();
            const editable = String(field?.contentEditable || field?.contenteditable || '').toLowerCase() === 'true';
            if (
                !key
                || !editable
                || parts.isReportDeckLockedFieldKey(key)
                || parts.isReportDeckSlide8OverviewKey(key)
                || parts.isReportDeckSlide9OverviewKey(key)
                || parts.isReportDeckSlide10OverviewKey(key)
            ) return;
            changed = updateReportDeckStateValue(state, key, field.textContent || '') || changed;
        });

        Array.from(root?.querySelectorAll?.('[data-report-date-input]') || []).forEach(input => {
            if (input?.disabled || !String(input?.value || '').trim()) return;
            const nextDate = parts.normalizeReportDeckDate(input?.value) || parts.REPORT_DECK_DEFAULT.reportDate;
            changed = updateReportDeckStateValue(state, 'reportDate', nextDate) || changed;
        });

        Array.from(root?.querySelectorAll?.('[data-report-plan-count-select]') || []).forEach(select => {
            const key = String(select?.dataset?.reportPlanCountSelect || '').trim();
            if (!key || select?.disabled || !String(select?.value || '').trim()) return;
            changed = updateReportDeckStateValue(state, key, normalizeReportDeckPlanSlotCount(select.value)) || changed;
        });

        if (changed) {
            parts.applyReportDeckDerivedFields(state, meta);
            parts.syncReportDeckFieldRefs(root, state);
            syncReportDeckPlanControls(root, state);
        }
        return changed;
    }

    function captureReportDeckPendingEdits(root, state, meta) {
        if (!captureReportDeckOpenOverviewDialog(root, state, meta)) return false;
        const memoChanged = captureReportDeckOpenMemoDialog(root, state, meta);
        const fieldChanged = captureReportDeckEditableFields(root, state, meta);
        const changed = memoChanged || fieldChanged;
        if (changed) {
            parts.markReportDeckDirty(root, state, meta);
        }
        return true;
    }

    function isReportDeckSlide8OverviewComplete(state, slotIndex) {
        const entry = parts.getReportDeckSlide8OverviewEntry(state, slotIndex);
        return Boolean(entry.team && entry.title && entry.effect && entry.date);
    }

    function isReportDeckSlide9OverviewComplete(state, slotIndex) {
        const entry = parts.getReportDeckSlide9OverviewEntry(state, slotIndex);
        return Boolean(entry.team && entry.title && entry.detail && entry.date);
    }

    function isReportDeckPlanSlotComplete(state, slideKey, slotIndex) {
        if (slideKey === 'slide8') return isReportDeckSlide8OverviewComplete(state, slotIndex);
        if (slideKey === 'slide9') return isReportDeckSlide9OverviewComplete(state, slotIndex);
        if (slideKey === 'slide10') {
            const entry = parts.getReportDeckSlide10OverviewEntry(state, slotIndex);
            return Boolean(entry.team && entry.effect && entry.date);
        }
        return Boolean(String(state[`${slideKey}Item${slotIndex}Text`] || '').trim());
    }

    function clearReportDeckPlanSlot(state, slideKey, slotIndex) {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey);
        if (!normalizedSlideKey) return false;
        const countKey = `${normalizedSlideKey}SlotCount`;
        if (normalizedSlideKey === 'slide10') {
            const targetIndex = parts.normalizeReportDeckPositiveIndex(slotIndex);
            parts.setReportDeckSlide10OverviewEntry(state, targetIndex, {});
            parts.recomputeReportDeckSlide10SlotCount(state);
            return true;
        }
        const currentCount = normalizeReportDeckPlanItemCount(state[countKey], normalizedSlideKey);
        const targetIndex = Math.max(1, Math.min(currentCount, Number.parseInt(String(slotIndex || ''), 10) || 1));
        if (currentCount <= 1) {
            parts.setReportDeckPlanOverviewEntry(state, normalizedSlideKey, 1, {});
            state[countKey] = '0';
            if (normalizedSlideKey === 'slide10') state.slide10Enabled = 'false';
            return true;
        }
        for (let index = targetIndex; index < currentCount; index += 1) {
            parts.setReportDeckPlanOverviewEntry(state, normalizedSlideKey, index, parts.getReportDeckPlanOverviewEntry(state, normalizedSlideKey, index + 1));
        }
        parts.setReportDeckPlanOverviewEntry(state, normalizedSlideKey, currentCount, {});
        state[countKey] = String(Math.max(1, currentCount - 1));
        return true;
    }

    function deleteReportDeckPlanSlot(root, state, meta, slideKey = '', slotIndex = '') {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey);
        if (!normalizedSlideKey) return false;
        if (normalizedSlideKey === 'slide10') {
            parts.pushReportDeckSlide10DeletedSlotBackup(state, slotIndex);
        }
        const deleted = clearReportDeckPlanSlot(state, normalizedSlideKey, slotIndex);
        if (!deleted) return false;
        closeReportDeckOverviewDialog(root);
        parts.syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        return true;
    }

    function restoreReportDeckDeletedPlanSlot(root, state, meta) {
        const backup = parts.popReportDeckSlide10DeletedSlotBackup(state);
        if (!backup) {
            syncReportDeckDeleteUndoControls(root, state);
            parts.setReportDeckStatus(root, 'idle', '');
            return false;
        }
        const slotIndex = parts.getReportDeckSlide10RestoreSlotIndex(state, backup.slotIndex);
        parts.restoreReportDeckSlide10OverviewEntry(state, slotIndex, backup.entry);
        closeReportDeckOverviewDialog(root);
        parts.syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        parts.setReportDeckView(root, 'public-works', Math.max(0, parts.getReportDeckVisibleSlides(root, 'public-works').length - 1));
        return true;
    }

    function normalizeReportDeckSlide10TableMoveDirection(value = '') {
        const direction = String(value || '').trim();
        return ['left', 'right', 'up', 'down'].includes(direction) ? direction : '';
    }

    function cloneReportDeckSlide10TablesForManualMove(state = {}) {
        return parts.buildReportDeckSlide10RowObjects(state, { includeEmpty: false })
            .map(row => ({
                team: String(row?.team || ''),
                sourceIndexes: Array.isArray(row?.sourceIndexes)
                    ? row.sourceIndexes.map(parts.normalizeReportDeckSlide10RowOrderIndex).filter(index => index >= 1)
                    : []
            }));
    }

    function ensureReportDeckSlide10ManualTableIndex(rows = [], tableIndex = 0) {
        const targetIndex = Math.max(0, Number.parseInt(String(tableIndex || '0'), 10) || 0);
        while (rows.length <= targetIndex) {
            rows.push({ team: '', sourceIndexes: [] });
        }
        return rows;
    }

    function getReportDeckSlide10TableMoveContext(target) {
        const slot = target?.closest?.('[data-report-plan-slot]') || null;
        const table = target?.closest?.('.report-safety-table') || null;
        const slide = table?.closest?.('[data-report-plan-slide="slide10"]')
            || target?.closest?.('[data-report-plan-slide="slide10"]')
            || null;
        if (!slot || !table || !slide) return null;
        const pageIndex = Math.max(0, Number.parseInt(String(slide.dataset.reportPlanPage || '0'), 10) || 0);
        const tableIndex = Math.max(0, Number.parseInt(String(table.dataset.reportSafetyTableIndex || table.dataset.reportSafetyRow || '0'), 10) || 0);
        const localSlotIndex = Math.max(1, Number.parseInt(String(slot.dataset.reportPlanLocalSlot || '1'), 10) || 1);
        const columnIndex = (localSlotIndex - 1) % parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW;
        const sourceIndex = parts.normalizeReportDeckSlide10RowOrderIndex(slot.dataset.reportPlanSourceSlot);
        return {
            slot,
            table,
            slide,
            pageIndex,
            tableIndex,
            tableGlobalIndex: pageIndex * parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE + tableIndex,
            columnIndex,
            sourceIndex
        };
    }

    function getReportDeckSlide10TableColumnIndex(rows = [], tableIndex = 0, sourceIndex = 0, fallbackColumnIndex = 0) {
        const row = rows[tableIndex] || null;
        const sourceIndexes = Array.isArray(row?.sourceIndexes) ? row.sourceIndexes : [];
        const explicitIndex = sourceIndexes.indexOf(sourceIndex);
        if (explicitIndex >= 0) return explicitIndex;
        const fallback = Math.max(0, Number.parseInt(String(fallbackColumnIndex || '0'), 10) || 0);
        return fallback < sourceIndexes.length ? fallback : -1;
    }

    function canMoveReportDeckSlide10Table(rows = [], context = {}, direction = '') {
        const row = rows[context.tableGlobalIndex] || null;
        const sourceIndexes = Array.isArray(row?.sourceIndexes) ? row.sourceIndexes : [];
        const columnIndex = getReportDeckSlide10TableColumnIndex(
            rows,
            context.tableGlobalIndex,
            context.sourceIndex,
            context.columnIndex
        );
        if (!context.sourceIndex || columnIndex < 0) return false;
        if (direction === 'left') return columnIndex > 0;
        if (direction === 'right') return columnIndex < sourceIndexes.length - 1;
        if (direction === 'up') return context.tableGlobalIndex > 0;
        if (direction === 'down') return true;
        return false;
    }

    function setReportDeckSlide10ActivePage(root, pageIndex = 0) {
        const targetPage = Math.max(0, Number.parseInt(String(pageIndex || '0'), 10) || 0);
        const slide = getReportDeckSlide10PageSlides(root)[targetPage] || null;
        if (!slide) return;
        const activeView = parts.getReportDeckActiveView(root);
        const slideIndex = parts.getReportDeckVisibleSlides(root, activeView).indexOf(slide);
        if (slideIndex >= 0) parts.setReportDeckSlide(root, slideIndex);
    }

    function moveReportDeckSlide10Table(root, state, meta, target, directionValue = '') {
        const direction = normalizeReportDeckSlide10TableMoveDirection(directionValue);
        const context = direction ? getReportDeckSlide10TableMoveContext(target) : null;
        if (!context) return false;
        const rows = cloneReportDeckSlide10TablesForManualMove(state);
        const fromIndex = context.tableGlobalIndex;
        const row = rows[fromIndex] || { team: '', sourceIndexes: [] };
        const sourceIndexes = Array.isArray(row.sourceIndexes) ? row.sourceIndexes : [];
        const columnIndex = getReportDeckSlide10TableColumnIndex(rows, fromIndex, context.sourceIndex, context.columnIndex);
        if (!canMoveReportDeckSlide10Table(rows, context, direction) || columnIndex < 0) return false;
        let targetIndex = fromIndex;
        if (direction === 'left' || direction === 'right') {
            const targetColumnIndex = direction === 'left' ? columnIndex - 1 : columnIndex + 1;
            const nextIndexes = sourceIndexes.slice();
            const currentSourceIndex = nextIndexes[columnIndex];
            nextIndexes[columnIndex] = nextIndexes[targetColumnIndex];
            nextIndexes[targetColumnIndex] = currentSourceIndex;
            row.sourceIndexes = nextIndexes;
            rows[fromIndex] = row;
        } else {
            targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
            ensureReportDeckSlide10ManualTableIndex(rows, targetIndex);
            const sourceIndex = sourceIndexes.splice(columnIndex, 1)[0];
            const targetRow = rows[targetIndex] || { team: '', sourceIndexes: [] };
            const targetIndexes = Array.isArray(targetRow.sourceIndexes) ? targetRow.sourceIndexes : [];
            if (targetIndexes.length >= parts.REPORT_DECK_SLIDE10_COLUMNS_PER_ROW) {
                const swapIndex = Math.min(columnIndex, targetIndexes.length - 1);
                const swappedSourceIndex = targetIndexes[swapIndex];
                targetIndexes[swapIndex] = sourceIndex;
                sourceIndexes.splice(Math.min(columnIndex, sourceIndexes.length), 0, swappedSourceIndex);
            } else {
                targetIndexes.splice(Math.min(columnIndex, targetIndexes.length), 0, sourceIndex);
            }
            row.sourceIndexes = sourceIndexes;
            targetRow.sourceIndexes = targetIndexes;
            rows[fromIndex] = row;
            rows[targetIndex] = targetRow;
        }
        state.slide10TableOrder = parts.serializeReportDeckSlide10TableOrder(rows);
        closeReportDeckOverviewDialog(root);
        syncReportDeckPlanControls(root, state);
        parts.syncReportDeckDynamicSlides(root);
        setReportDeckSlide10ActivePage(root, Math.floor(targetIndex / parts.REPORT_DECK_SLIDE10_ROWS_PER_PAGE));
        parts.markReportDeckDirty(root, state, meta);
        return true;
    }

    function addReportDeckPlanSlot(root, state, meta, slideKey = '', options = {}) {
        const normalizedSlideKey = parts.normalizeReportDeckPlanSlideKey(slideKey);
        if (!normalizedSlideKey) return false;
        const countKey = `${normalizedSlideKey}SlotCount`;
        const maxItems = parts.getReportDeckPlanMaxItems(normalizedSlideKey);
        const currentCount = normalizeReportDeckPlanItemCount(state[countKey], normalizedSlideKey);
        if (normalizedSlideKey === 'slide10') {
            const selectedTeam = parts.normalizeReportDeckOverviewTeam(options.team) || parts.REPORT_DECK_SLIDE10_TEAM_ROWS[parts.normalizeReportDeckSlide10SourceRowIndex(options.rowIndex)] || parts.REPORT_DECK_SLIDE10_TEAM_ROWS[0] || '';
            const nextSlotIndex = parts.getReportDeckSlide10NextSlotIndexForTeam(state, selectedTeam);
            if (!nextSlotIndex) {
                parts.setReportDeckStatus(root, 'error', '칸 추가가 불가능합니다');
                return false;
            }
            state.slide10Enabled = 'true';
            state.slide10SlotCount = String(Math.max(currentCount, nextSlotIndex));
            syncReportDeckPlanControls(root, state);
            parts.markReportDeckDirty(root, state, meta);
            openReportDeckOverviewDialog(root, state, String(nextSlotIndex), normalizedSlideKey, {
                defaultTeam: selectedTeam
            });
            return true;
        }
        if (currentCount >= maxItems) {
            parts.setReportDeckStatus(root, 'error', `최대 ${maxItems}칸까지 추가할 수 있습니다`);
            return false;
        }
        if (currentCount > 0 && !isReportDeckPlanSlotComplete(state, normalizedSlideKey, currentCount)) {
            parts.setReportDeckStatus(root, 'error', '앞 칸 개요를 먼저 입력해 주세요');
            return false;
        }
        if (currentCount > 0 && meta?.dirty === true) {
            parts.setReportDeckStatus(root, 'error', '저장 완료 후 칸을 추가해 주세요');
            return false;
        }
        const nextCount = currentCount + 1;
        state[countKey] = String(nextCount);
        syncReportDeckPlanControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        openReportDeckOverviewDialog(root, state, String(nextCount), normalizedSlideKey);
        return true;
    }

    function addReportDeckOptionalPage(root, state, meta, pageKey = '') {
        const normalizedPageKey = String(pageKey || '').trim();
        if (normalizedPageKey !== 'slide10') return false;
        state.slide10Enabled = 'true';
        if (normalizeReportDeckPlanItemCount(state.slide10SlotCount, 'slide10') <= 0) {
            state.slide10SlotCount = '1';
        }
        parts.syncReportDeckFields(root, state, meta);
        syncReportDeckPlanControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        const publicWorksSlides = parts.getReportDeckVisibleSlides(root, 'public-works');
        parts.setReportDeckView(root, 'public-works', Math.max(0, publicWorksSlides.length - 1));
        openReportDeckOverviewDialog(root, state, '1', 'slide10');
        return true;
    }

    function toReportDeckFiniteNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function isReportDeckImageFieldKey(key = '') {
        return /^slide(?:8|9|10).*Image\d+$/.test(String(key || '').trim());
    }

    function isReportDeckInlineImageValue(value = '') {
        return /^data:image\/[^;,]+;base64,/i.test(String(value || '').trim());
    }

    function getReportDeckSaveErrorText(error) {
        const message = String(error?.message || '');
        if (message.includes(':413') || message.includes('body_too_large') || message.includes('file_too_large')) {
            return '저장 실패: 이미지 용량이 너무 큽니다';
        }
        if (message.includes(':401') || message.includes(':403')) {
            return '저장 실패: 권한을 확인해 주세요';
        }
        return '저장 실패';
    }

    function getReportDeckImageErrorText(error) {
        const message = String(error?.message || '');
        if (message.includes(':413') || message.includes('file_too_large')) {
            return '이미지 용량이 너무 큽니다';
        }
        if (message.includes('unsupported_type')) {
            return '지원하지 않는 이미지 형식입니다';
        }
        return '이미지 삽입 실패';
    }

    async function externalizeReportDeckInlineImages(root, state, meta) {
        if (typeof browser?.uploadReportDeckImageDataUrl !== 'function') return false;
        let changed = false;
        for (const key of Object.keys(state || {})) {
            const value = String(state[key] || '');
            if (!isReportDeckImageFieldKey(key) || !isReportDeckInlineImageValue(value)) continue;
            parts.setReportDeckStatus(root, 'saving', '이미지 저장 중');
            state[key] = await browser.uploadReportDeckImageDataUrl(value, {
                recordKey: meta.recordKey,
                fieldKey: key,
                originalName: `${key}.png`,
                mimeType: 'image/png'
            });
            changed = true;
        }
        if (changed) {
            syncReportDeckPlanControls(root, state);
            parts.syncReportDeckJson(root, state, meta);
        }
        return changed;
    }
    Object.assign(parts, {
        addReportDeckOptionalPage,
        addReportDeckPlanSlot,
        buildReportDeckPlanPageCounts,
        canMoveReportDeckSlide10Table,
        canUseReportDeckPlanImageAttachment,
        canUseReportDeckPlanImagePaste,
        captureReportDeckEditableFields,
        captureReportDeckOpenMemoDialog,
        captureReportDeckOpenOverviewDialog,
        captureReportDeckPendingEdits,
        clearReportDeckPlanSlot,
        cloneReportDeckSlide10TablesForManualMove,
        closeReportDeckOverviewDialog,
        configureReportDeckSlide10Page,
        deleteReportDeckPlanSlot,
        ensureReportDeckSlide10ManualTableIndex,
        ensureReportDeckSlide10PageCapacity,
        externalizeReportDeckInlineImages,
        getReportDeckClipboardImageFile,
        getReportDeckImageErrorText,
        getReportDeckOverviewDialog,
        getReportDeckOverviewDialogField,
        getReportDeckOverviewSlot,
        getReportDeckPasteCandidateFrames,
        getReportDeckPlanImageFrameFromTarget,
        getReportDeckPlanImageFrames,
        getReportDeckPlanImageInputFromFrame,
        getReportDeckPlanImageKeyFromFrame,
        getReportDeckPlanImagePlaceholderText,
        getReportDeckPlanImageSourceKey,
        getReportDeckPlanPageStart,
        getReportDeckPlanSourceIndex,
        getReportDeckSaveErrorText,
        getReportDeckSlide10PageSlides,
        getReportDeckSlide10TableColumnIndex,
        getReportDeckSlide10TableMoveContext,
        hasReportDeckPlanImageValue,
        isReportDeckImageFieldKey,
        isReportDeckImageFile,
        isReportDeckInlineImageValue,
        isReportDeckOptionalPageEnabled,
        isReportDeckPlanImageSourceKey,
        isReportDeckPlanSlotComplete,
        isReportDeckSlide8OverviewComplete,
        isReportDeckSlide9OverviewComplete,
        isReportDeckUsablePlanImageFrame,
        moveReportDeckSlide10Table,
        normalizeReportDeckPlanImageSource,
        normalizeReportDeckPlanItemCount,
        normalizeReportDeckPlanSlotCount,
        normalizeReportDeckSlide10TableMoveDirection,
        openReportDeckOverviewDialog,
        resolveReportDeckPasteImageFrame,
        restoreReportDeckDeletedPlanSlot,
        saveReportDeckOverviewDialog,
        setReportDeckActivePlanImageFrame,
        setReportDeckOverviewKindControls,
        setReportDeckSlide10ActivePage,
        syncReportDeckDeleteUndoControls,
        syncReportDeckOptionalPageControls,
        syncReportDeckOverviewAmountFields,
        syncReportDeckOverviewCustomTeamRow,
        syncReportDeckOverviewDialogMode,
        syncReportDeckPlanControls,
        syncReportDeckPlanImageAttachmentState,
        syncReportDeckPlanImageModeHints,
        toReportDeckFiniteNumber,
        updateReportDeckStateValue,
    });
})(this);
