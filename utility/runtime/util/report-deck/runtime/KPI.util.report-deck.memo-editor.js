(function registerKpiReportDeckRuntimeMemoEditor(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function normalizeReportDeckMemoLineBreaks(value = '') {
        return String(value || '')
            .replace(/\r\n?/g, '\n')
            .split(parts.REPORT_DECK_MEMO_LINE_BREAK)
            .join('\n');
    }

    function encodeReportDeckMemoLineBreaks(value = '') {
        return normalizeReportDeckMemoLineBreaks(value)
            .trim()
            .replace(/\n/g, parts.REPORT_DECK_MEMO_LINE_BREAK);
    }

    function normalizeReportDeckMemoLineText(line = '') {
        return normalizeReportDeckMemoLineBreaks(line).trim();
    }

    function normalizeReportDeckMemoLineArray(lines = []) {
        return (Array.isArray(lines) ? lines : [])
            .map(normalizeReportDeckMemoLineText)
            .filter(Boolean);
    }

    function serializeReportDeckMemoLines(lines = []) {
        return normalizeReportDeckMemoLineArray(lines)
            .map(encodeReportDeckMemoLineBreaks)
            .join('\n');
    }

    function getReportDeckMemoLineIdentity(line = '') {
        return normalizeReportDeckMemoLineText(line).replace(/\s+/g, ' ');
    }

    function getReportDeckMemoLines(text = '') {
        return String(text || '')
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .map(normalizeReportDeckMemoLineText)
            .filter(Boolean);
    }

    function reconcileReportDeckMemoLineSizes(previousLines = [], previousSizes = [], nextLines = []) {
        const used = new Set();
        const normalizedPrevious = Array.isArray(previousLines) ? previousLines : [];
        const normalizedSizes = parts.normalizeReportDeckMemoLineSizeArray(previousSizes, normalizedPrevious.length);
        return (Array.isArray(nextLines) ? nextLines : []).map((line, index) => {
            const identity = getReportDeckMemoLineIdentity(line);
            if (
                index < normalizedPrevious.length
                && !used.has(index)
                && getReportDeckMemoLineIdentity(normalizedPrevious[index]) === identity
            ) {
                used.add(index);
                return normalizedSizes[index];
            }
            const matchedIndex = normalizedPrevious.findIndex((previousLine, previousIndex) => (
                !used.has(previousIndex)
                && getReportDeckMemoLineIdentity(previousLine) === identity
            ));
            if (matchedIndex >= 0) {
                used.add(matchedIndex);
                return normalizedSizes[matchedIndex];
            }
            return parts.normalizeReportDeckMemoLineFontSizeLevel(normalizedSizes[index]);
        });
    }

    function getReportDeckMemoDialogTargetKey(dialog) {
        return String(dialog?.dataset?.reportMemoTarget || '').trim();
    }

    function getReportDeckMemoNotepadInput(dialog) {
        return dialog?.querySelector?.('[data-report-memo-notepad]') || null;
    }

    function getReportDeckMemoNotepadFontSizeInput(dialog) {
        return dialog?.querySelector?.('[data-report-memo-notepad-font-size-input]') || null;
    }

    function getReportDeckMemoPreview(dialog) {
        return dialog?.querySelector?.('[data-report-memo-preview]') || null;
    }

    function rememberReportDeckMemoNotepadSelection(dialog, input) {
        if (!dialog || !input) return null;
        const start = Number(input.selectionStart);
        const end = Number(input.selectionEnd);
        if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
            delete dialog.__reportMemoNotepadSelection;
            return null;
        }
        dialog.__reportMemoNotepadSelection = {
            start,
            end,
            value: String(input.value || '')
        };
        return dialog.__reportMemoNotepadSelection;
    }

    function getReportDeckMemoNotepadSelection(input, dialog = null) {
        const start = Number(input?.selectionStart);
        const end = Number(input?.selectionEnd);
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
            return { start, end };
        }
        const stored = dialog?.__reportMemoNotepadSelection;
        if (
            stored
            && String(stored.value || '') === String(input?.value || '')
            && Number.isFinite(Number(stored.start))
            && Number.isFinite(Number(stored.end))
            && Number(stored.end) > Number(stored.start)
        ) {
            return { start: Number(stored.start), end: Number(stored.end) };
        }
        return null;
    }

    function getReportDeckMemoNotepadValueFromState(state = {}, key = '') {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return '';
        if (parts.isReportDeckMemoFormattingPreserved(state, normalizedKey)) {
            return normalizeReportDeckMemoLineBreaks(state[normalizedKey]);
        }
        return getReportDeckMemoLines(state[normalizedKey]).join('\n');
    }

    function buildReportDeckMemoNotepadLineRanges(value = '', preserveFormatting = false) {
        const text = normalizeReportDeckMemoLineBreaks(value);
        if (preserveFormatting) {
            const preservedText = normalizeReportDeckMemoLineText(text);
            if (!preservedText) return { text, lines: [], ranges: [] };
            const leading = text.length - text.replace(/^\s+/, '').length;
            const trailing = text.length - text.replace(/\s+$/, '').length;
            return {
                text,
                lines: [preservedText],
                ranges: [{
                    index: 0,
                    rawStart: leading,
                    rawEnd: text.length - trailing,
                    text: preservedText
                }]
            };
        }
        const rawLines = text.split('\n');
        const lines = [];
        const ranges = [];
        let cursor = 0;
        rawLines.forEach(rawLine => {
            const trimmedText = normalizeReportDeckMemoLineText(rawLine);
            if (trimmedText) {
                const leading = rawLine.length - rawLine.replace(/^\s+/, '').length;
                const trailing = rawLine.length - rawLine.replace(/\s+$/, '').length;
                lines.push(trimmedText);
                ranges.push({
                    index: lines.length - 1,
                    rawStart: cursor + leading,
                    rawEnd: cursor + rawLine.length - trailing,
                    text: trimmedText
                });
            }
            cursor += rawLine.length + 1;
        });
        return { text, lines, ranges };
    }

    function getReportDeckMemoNotepadSelectionRanges(input, dialog = null, state = null, key = '') {
        const selection = getReportDeckMemoNotepadSelection(input, dialog);
        if (!selection) {
            return [];
        }
        const model = buildReportDeckMemoNotepadLineRanges(
            input?.value || '',
            state ? parts.isReportDeckMemoFormattingPreserved(state, key || getReportDeckMemoDialogTargetKey(dialog)) : false
        );
        return model.ranges.map(lineRange => {
            const start = Math.max(lineRange.rawStart, selection.start);
            const end = Math.min(lineRange.rawEnd, selection.end);
            if (end <= start) return null;
            return {
                lineIndex: lineRange.index,
                start: Math.max(0, start - lineRange.rawStart),
                end: Math.min(lineRange.text.length, end - lineRange.rawStart)
            };
        }).filter(range => range && range.end > range.start);
    }

    function syncReportDeckMemoNotepadToState(root, state, meta, dialog, key, options = {}) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const input = getReportDeckMemoNotepadInput(dialog);
        const model = buildReportDeckMemoNotepadLineRanges(input?.value || '', parts.isReportDeckMemoFormattingPreserved(state, normalizedKey));
        if (serializeReportDeckMemoLines(model.lines) === String(state[normalizedKey] || '')) return false;
        return setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, model.lines, {
            syncDialog: options.syncDialog === true
        });
    }

    function syncReportDeckMemoDialogNotepad(dialog, state) {
        const input = getReportDeckMemoNotepadInput(dialog);
        if (!input) return;
        const key = getReportDeckMemoDialogTargetKey(dialog);
        const value = getReportDeckMemoNotepadValueFromState(state, key);
        if (String(input.value || '') !== value) {
            input.value = value;
            delete dialog.__reportMemoNotepadSelection;
        }
        syncReportDeckMemoDialogPreview(dialog, state);
        syncReportDeckMemoNotepadFontSizeControl(dialog, state);
    }

    function getReportDeckMemoNotepadSelectionFontSizeLevel(state = {}, key = '', dialog = null) {
        const input = getReportDeckMemoNotepadInput(dialog);
        const selectedRanges = getReportDeckMemoNotepadSelectionRanges(input, dialog, state, key);
        if (!input || !selectedRanges.length) return 0;
        const normalizedKey = String(key || '').trim();
        const lines = getReportDeckMemoLines(state?.[normalizedKey]);
        const sizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, lines.length);
        const selectedLevels = selectedRanges.flatMap(range => {
            if (range.lineIndex < 0 || range.lineIndex >= lines.length) return [];
            return parts.getReportDeckMemoLineSelectionFontSizeLevels(
                sizes[range.lineIndex],
                sizeRanges[range.lineIndex] || [],
                range.start,
                range.end
            );
        }).filter(level => Number.isInteger(level));
        const uniqueLevels = Array.from(new Set(selectedLevels.map(parts.normalizeReportDeckMemoLineFontSizeLevel)));
        if (uniqueLevels.length > 1) return null;
        return uniqueLevels.length ? uniqueLevels[0] : 0;
    }

    function syncReportDeckMemoNotepadFontSizeControl(dialog, state = {}) {
        const sizeInput = getReportDeckMemoNotepadFontSizeInput(dialog);
        if (!sizeInput) return;
        const key = getReportDeckMemoDialogTargetKey(dialog);
        const input = getReportDeckMemoNotepadInput(dialog);
        const selectedRanges = getReportDeckMemoNotepadSelectionRanges(input, dialog, state, key);
        const sizeLevel = selectedRanges.length ? getReportDeckMemoNotepadSelectionFontSizeLevel(state, key, dialog) : 0;
        sizeInput.value = sizeLevel === null
            ? '?'
            : parts.getReportDeckMemoLineFontSizeDisplayValue(sizeLevel);
        sizeInput.disabled = !selectedRanges.length;
    }

    function syncReportDeckMemoDialogPreview(dialog, state = {}) {
        const preview = getReportDeckMemoPreview(dialog);
        if (!preview) return;
        const key = getReportDeckMemoDialogTargetKey(dialog);
        const rawText = key && Object.prototype.hasOwnProperty.call(state, key) ? state[key] : '';
        const preserveFormatting = parts.isReportDeckMemoFormattingPreserved(state, key);
        const lines = getReportDeckMemoLines(rawText);
        preview.dataset.empty = lines.length ? 'false' : 'true';
        if (!lines.length) {
            preview.innerHTML = '';
            return;
        }
        const sizes = parts.getReportDeckMemoLineSizeArray(state, key, lines.length);
        const colors = parts.getReportDeckMemoLineColorArray(state, key, lines.length);
        const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, key, lines.length);
        preview.innerHTML = lines.map((line, index) => (
            `<span class="report-memo-preview-line ${parts.getReportDeckMemoLineClass(line)}${preserveFormatting ? ' is-preserve-format' : ''}" style="${parts.getReportDeckMemoLineFontSizeStyle(sizes[index])}">`
                + `${parts.renderReportDeckMemoLineHtml(line, colors[index] || [], sizeRanges[index] || [])}`
            + '</span>'
        )).join('');
    }

    function clearReportDeckMemoManualInput(dialog) {
        const input = dialog?.querySelector?.('[data-report-memo-manual-input]');
        if (input) input.value = '';
    }

    function setReportDeckMemoLines(root, state, meta, dialog, key, lines = [], options = {}) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const previousLines = getReportDeckMemoLines(state[normalizedKey]);
        const previousSizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, previousLines.length);
        const previousSizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, previousLines.length);
        const previousColors = parts.getReportDeckMemoLineColorArray(state, normalizedKey, previousLines.length);
        const normalizedLines = normalizeReportDeckMemoLineArray(lines);
        state[normalizedKey] = serializeReportDeckMemoLines(normalizedLines);
        const nextSizes = Array.isArray(options.lineSizes)
            ? parts.normalizeReportDeckMemoLineSizeArray(options.lineSizes, normalizedLines.length)
            : reconcileReportDeckMemoLineSizes(previousLines, previousSizes, normalizedLines);
        const nextSizeRanges = Array.isArray(options.lineSizeRanges)
            ? parts.normalizeReportDeckMemoLineFontSizeRangeArray(options.lineSizeRanges, normalizedLines)
            : parts.reconcileReportDeckMemoLineSizeRanges(previousLines, previousSizeRanges, normalizedLines);
        const nextColors = Array.isArray(options.lineColors)
            ? parts.normalizeReportDeckMemoLineColorArray(options.lineColors, normalizedLines)
            : parts.reconcileReportDeckMemoLineColors(previousLines, previousColors, normalizedLines);
        parts.setReportDeckMemoLineSizeArray(state, normalizedKey, nextSizes);
        parts.setReportDeckMemoLineSizeRangeArray(state, normalizedKey, nextSizeRanges);
        parts.setReportDeckMemoLineColorArray(state, normalizedKey, nextColors);
        parts.syncReportDeckMemoControls(root, state);
        if (options.syncDialog !== false) {
            syncReportDeckMemoDialogLines(dialog, state);
        } else {
            syncReportDeckMemoDialogPreview(dialog, state);
            syncReportDeckMemoNotepadFontSizeControl(dialog, state);
        }
        parts.markReportDeckDirty(root, state, meta);
        return true;
    }

    function moveReportDeckMemoLine(root, state, meta, dialog, key, fromIndex, direction = '') {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        if (!Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= lines.length) return false;
        const normalizedDirection = String(direction || '').trim().toLowerCase();
        const offset = normalizedDirection === 'up' ? -1 : normalizedDirection === 'down' ? 1 : 0;
        if (!offset) return false;
        const toIndex = fromIndex + offset;
        if (toIndex < 0 || toIndex >= lines.length) return false;
        if (toIndex === fromIndex) return false;
        const sizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, lines.length);
        const colors = parts.getReportDeckMemoLineColorArray(state, normalizedKey, lines.length);
        const [line] = lines.splice(fromIndex, 1);
        const [size] = sizes.splice(fromIndex, 1);
        const [fontSizeRanges] = sizeRanges.splice(fromIndex, 1);
        const [colorRanges] = colors.splice(fromIndex, 1);
        lines.splice(toIndex, 0, line);
        sizes.splice(toIndex, 0, size);
        sizeRanges.splice(toIndex, 0, fontSizeRanges || []);
        colors.splice(toIndex, 0, colorRanges || []);
        return setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, lines, { lineSizes: sizes, lineSizeRanges: sizeRanges, lineColors: colors });
    }

    function adjustReportDeckMemoLineFontSize(root, state, meta, dialog, key, lineIndex, delta, control = null) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= lines.length) return false;
        const normalizedDelta = Number.parseInt(String(delta || '0'), 10);
        if (!Number.isFinite(normalizedDelta) || normalizedDelta === 0) return false;
        const input = getReportDeckMemoLineInputFromControl(dialog, control, lineIndex);
        const selectionStart = Number(input?.selectionStart);
        const selectionEnd = Number(input?.selectionEnd);
        if (input && Number.isFinite(selectionStart) && Number.isFinite(selectionEnd) && selectionEnd > selectionStart) {
            lines[lineIndex] = String(input.value || '');
            setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, lines, { syncDialog: false });
            const nextLines = getReportDeckMemoLines(state[normalizedKey]);
            const lineLength = normalizeReportDeckMemoLineText(nextLines[lineIndex] || '').length;
            const start = Math.max(0, Math.min(lineLength, selectionStart));
            const end = Math.max(0, Math.min(lineLength, selectionEnd));
            if (end <= start) return false;
            const sizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, nextLines.length);
            const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, nextLines.length);
            const currentSize = parts.getReportDeckMemoLineSelectionFontSizeLevel(
                sizes[lineIndex],
                sizeRanges[lineIndex] || [],
                start,
                end,
                normalizedDelta
            );
            const nextSize = parts.normalizeReportDeckMemoLineFontSizeLevel(currentSize + normalizedDelta);
            if (nextSize === currentSize) {
                input.focus?.();
                input.setSelectionRange?.(selectionStart, selectionEnd);
                return false;
            }
            sizeRanges[lineIndex] = parts.applyReportDeckMemoLineFontSizeRange(sizeRanges[lineIndex] || [], start, end, nextSize);
            parts.setReportDeckMemoLineSizeRangeArray(state, normalizedKey, sizeRanges);
            parts.syncReportDeckMemoControls(root, state);
            parts.markReportDeckDirty(root, state, meta);
            input.focus?.();
            input.setSelectionRange?.(selectionStart, selectionEnd);
            return true;
        }
        const sizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const nextSize = parts.normalizeReportDeckMemoLineFontSizeLevel(sizes[lineIndex] + normalizedDelta);
        if (nextSize === sizes[lineIndex]) {
            syncReportDeckMemoDialogLines(dialog, state);
            return false;
        }
        sizes[lineIndex] = nextSize;
        parts.setReportDeckMemoLineSizeArray(state, normalizedKey, sizes);
        parts.syncReportDeckMemoControls(root, state);
        syncReportDeckMemoDialogLines(dialog, state);
        parts.markReportDeckDirty(root, state, meta);
        return true;
    }

    function getReportDeckMemoLineInputFromControl(dialog, control, lineIndex) {
        const rowInput = control
            ?.closest?.('[data-report-memo-line-row]')
            ?.querySelector?.('[data-report-memo-line-input]');
        if (rowInput) return rowInput;
        return dialog?.querySelector?.(`[data-report-memo-line-input="${lineIndex}"]`) || null;
    }

    function applyReportDeckMemoLineColor(root, state, meta, dialog, key, lineIndex, color, control = null) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const normalizedIndex = Number.parseInt(String(lineIndex ?? ''), 10);
        if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0) return false;
        const input = getReportDeckMemoLineInputFromControl(dialog, control, normalizedIndex);
        if (!input) return false;
        const selectionStart = Number(input.selectionStart);
        const selectionEnd = Number(input.selectionEnd);
        if (!Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd) || selectionEnd <= selectionStart) return false;
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        if (normalizedIndex >= lines.length) return false;
        lines[normalizedIndex] = String(input.value || '');
        setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, lines, { syncDialog: false });
        const nextLines = getReportDeckMemoLines(state[normalizedKey]);
        const lineLength = normalizeReportDeckMemoLineText(nextLines[normalizedIndex] || '').length;
        const start = Math.max(0, Math.min(lineLength, selectionStart));
        const end = Math.max(0, Math.min(lineLength, selectionEnd));
        if (end <= start) return false;
        const colorAction = String(color || '').trim().toLowerCase();
        if (colorAction !== 'clear' && !parts.normalizeReportDeckMemoLineColor(colorAction)) return false;
        const colors = parts.getReportDeckMemoLineColorArray(state, normalizedKey, nextLines.length);
        colors[normalizedIndex] = colorAction === 'clear'
            ? parts.clearReportDeckMemoLineColorRange(colors[normalizedIndex] || [], start, end)
            : parts.applyReportDeckMemoLineColorRange(colors[normalizedIndex] || [], start, end, colorAction);
        parts.setReportDeckMemoLineColorArray(state, normalizedKey, colors);
        parts.syncReportDeckMemoControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        input.focus?.();
        input.setSelectionRange?.(selectionStart, selectionEnd);
        return true;
    }

    function adjustReportDeckMemoNotepadFontSize(root, state, meta, dialog, key, delta) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const input = getReportDeckMemoNotepadInput(dialog);
        const selection = getReportDeckMemoNotepadSelection(input, dialog);
        const selectionStart = Number(selection?.start);
        const selectionEnd = Number(selection?.end);
        const selectedRanges = getReportDeckMemoNotepadSelectionRanges(input, dialog, state, normalizedKey);
        const normalizedDelta = Number.parseInt(String(delta || '0'), 10);
        if (!input || !selectedRanges.length || !Number.isFinite(normalizedDelta) || normalizedDelta === 0) {
            syncReportDeckMemoNotepadFontSizeControl(dialog, state);
            return false;
        }
        const model = buildReportDeckMemoNotepadLineRanges(
            input.value || '',
            parts.isReportDeckMemoFormattingPreserved(state, normalizedKey)
        );
        const nextText = serializeReportDeckMemoLines(model.lines);
        if (nextText !== String(state[normalizedKey] || '')) {
            setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, model.lines, { syncDialog: false });
        }
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        const sizes = parts.getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, lines.length);
        let changed = false;
        selectedRanges.forEach(range => {
            if (range.lineIndex < 0 || range.lineIndex >= lines.length) return;
            const currentSize = parts.getReportDeckMemoLineSelectionFontSizeLevel(
                sizes[range.lineIndex],
                sizeRanges[range.lineIndex] || [],
                range.start,
                range.end,
                normalizedDelta
            );
            const nextSize = parts.normalizeReportDeckMemoLineFontSizeLevel(currentSize + normalizedDelta);
            if (nextSize === currentSize) return;
            sizeRanges[range.lineIndex] = parts.applyReportDeckMemoLineFontSizeRange(
                sizeRanges[range.lineIndex] || [],
                range.start,
                range.end,
                nextSize
            );
            changed = true;
        });
        if (changed) {
            parts.setReportDeckMemoLineSizeRangeArray(state, normalizedKey, sizeRanges);
            parts.syncReportDeckMemoControls(root, state);
            parts.markReportDeckDirty(root, state, meta);
        }
        input.focus?.();
        input.setSelectionRange?.(selectionStart, selectionEnd);
        rememberReportDeckMemoNotepadSelection(dialog, input);
        syncReportDeckMemoDialogPreview(dialog, state);
        syncReportDeckMemoNotepadFontSizeControl(dialog, state);
        return changed;
    }

    function setReportDeckMemoNotepadFontSize(root, state, meta, dialog, key, size) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const input = getReportDeckMemoNotepadInput(dialog);
        const selection = getReportDeckMemoNotepadSelection(input, dialog);
        const selectionStart = Number(selection?.start);
        const selectionEnd = Number(selection?.end);
        const selectedRanges = getReportDeckMemoNotepadSelectionRanges(input, dialog, state, normalizedKey);
        const parsedSize = parts.getReportDeckMemoLineFontSizeLevelFromDisplayValue(size);
        if (parsedSize === null) {
            syncReportDeckMemoNotepadFontSizeControl(dialog, state);
            return false;
        }
        const normalizedSize = parts.normalizeReportDeckMemoLineFontSizeLevel(parsedSize);
        if (!input || !selectedRanges.length) {
            syncReportDeckMemoNotepadFontSizeControl(dialog, state);
            return false;
        }
        const model = buildReportDeckMemoNotepadLineRanges(
            input.value || '',
            parts.isReportDeckMemoFormattingPreserved(state, normalizedKey)
        );
        const nextText = serializeReportDeckMemoLines(model.lines);
        if (nextText !== String(state[normalizedKey] || '')) {
            setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, model.lines, { syncDialog: false });
        }
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        const sizeRanges = parts.getReportDeckMemoLineSizeRangeArray(state, normalizedKey, lines.length);
        const previousRanges = JSON.stringify(sizeRanges);
        selectedRanges.forEach(range => {
            if (range.lineIndex < 0 || range.lineIndex >= lines.length) return;
            sizeRanges[range.lineIndex] = parts.applyReportDeckMemoLineFontSizeRange(
                sizeRanges[range.lineIndex] || [],
                range.start,
                range.end,
                normalizedSize
            );
        });
        const changed = JSON.stringify(sizeRanges) !== previousRanges;
        if (changed) {
            parts.setReportDeckMemoLineSizeRangeArray(state, normalizedKey, sizeRanges);
            parts.syncReportDeckMemoControls(root, state);
            parts.markReportDeckDirty(root, state, meta);
        }
        input.focus?.();
        input.setSelectionRange?.(selectionStart, selectionEnd);
        rememberReportDeckMemoNotepadSelection(dialog, input);
        syncReportDeckMemoDialogPreview(dialog, state);
        syncReportDeckMemoNotepadFontSizeControl(dialog, state);
        return changed;
    }

    function applyReportDeckMemoNotepadColor(root, state, meta, dialog, key, color) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const input = getReportDeckMemoNotepadInput(dialog);
        const selection = getReportDeckMemoNotepadSelection(input, dialog);
        const selectionStart = Number(selection?.start);
        const selectionEnd = Number(selection?.end);
        const selectedRanges = getReportDeckMemoNotepadSelectionRanges(input, dialog, state, normalizedKey);
        const colorAction = String(color || '').trim().toLowerCase();
        if (!input || !selectedRanges.length || (colorAction !== 'clear' && !parts.normalizeReportDeckMemoLineColor(colorAction))) return false;
        const model = buildReportDeckMemoNotepadLineRanges(
            input.value || '',
            parts.isReportDeckMemoFormattingPreserved(state, normalizedKey)
        );
        const nextText = serializeReportDeckMemoLines(model.lines);
        if (nextText !== String(state[normalizedKey] || '')) {
            setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, model.lines, { syncDialog: false });
        }
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        const colors = parts.getReportDeckMemoLineColorArray(state, normalizedKey, lines.length);
        selectedRanges.forEach(range => {
            if (range.lineIndex < 0 || range.lineIndex >= lines.length) return;
            colors[range.lineIndex] = colorAction === 'clear'
                ? parts.clearReportDeckMemoLineColorRange(colors[range.lineIndex] || [], range.start, range.end)
                : parts.applyReportDeckMemoLineColorRange(colors[range.lineIndex] || [], range.start, range.end, colorAction);
        });
        parts.setReportDeckMemoLineColorArray(state, normalizedKey, colors);
        parts.syncReportDeckMemoControls(root, state);
        parts.markReportDeckDirty(root, state, meta);
        input.focus?.();
        input.setSelectionRange?.(selectionStart, selectionEnd);
        rememberReportDeckMemoNotepadSelection(dialog, input);
        syncReportDeckMemoDialogPreview(dialog, state);
        syncReportDeckMemoNotepadFontSizeControl(dialog, state);
        return true;
    }

    function insertReportDeckMemoCandidateAtNotepadCursor(root, state, meta, dialog, key, candidateText = '') {
        const normalizedKey = String(key || '').trim();
        const text = normalizeReportDeckMemoLineText(candidateText);
        if (!normalizedKey || !text || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const input = getReportDeckMemoNotepadInput(dialog);
        if (!input) return false;
        const value = String(input.value || '');
        const rawStart = Number(input.selectionStart);
        const rawEnd = Number(input.selectionEnd);
        const start = Number.isFinite(rawStart) ? Math.max(0, Math.min(value.length, rawStart)) : value.length;
        const end = Number.isFinite(rawEnd) ? Math.max(start, Math.min(value.length, rawEnd)) : start;
        const prefix = value.slice(0, start);
        const suffix = value.slice(end);
        const before = prefix && !prefix.endsWith('\n') ? '\n' : '';
        const after = suffix && !suffix.startsWith('\n') ? '\n' : '';
        const inserted = `${before}${text}${after}`;
        input.value = `${prefix}${inserted}${suffix}`;
        const caret = prefix.length + inserted.length;
        input.setSelectionRange?.(caret, caret);
        input.focus?.();
        return syncReportDeckMemoNotepadToState(root, state, meta, dialog, normalizedKey, { syncDialog: false });
    }

    function appendReportDeckMemoLines(root, state, meta, dialog, key, addedLines = []) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey || !Object.prototype.hasOwnProperty.call(state, normalizedKey)) return false;
        const lines = getReportDeckMemoLines(state[normalizedKey]);
        const seen = new Set(lines.map(getReportDeckMemoLineIdentity));
        const nextLines = lines.slice();
        (Array.isArray(addedLines) ? addedLines : [])
            .map(normalizeReportDeckMemoLineText)
            .filter(Boolean)
            .forEach(line => {
                const identity = getReportDeckMemoLineIdentity(line);
                if (seen.has(identity)) return;
                seen.add(identity);
                nextLines.push(line);
            });
        if (nextLines.length === lines.length) return false;
        return setReportDeckMemoLines(root, state, meta, dialog, normalizedKey, nextLines);
    }


    function syncReportDeckMemoDialogLines(dialog, state) {
        syncReportDeckMemoDialogNotepad(dialog, state);
    }

    function setReportDeckMemoCandidateMessage(dialog, message) {
        const list = dialog?.querySelector?.('[data-report-memo-candidates]');
        if (!list) return;
        list.innerHTML = `<div class="report-memo-empty">${parts.escapeReportDeckHtml(message)}</div>`;
    }

    function renderReportDeckMemoCandidateList(dialog, candidates = []) {
        const list = dialog?.querySelector?.('[data-report-memo-candidates]');
        if (!list) return;
        const normalizedCandidates = Array.isArray(candidates) ? candidates : [];
        dialog.__reportMemoCandidates = normalizedCandidates;
        if (!normalizedCandidates.length) {
            setReportDeckMemoCandidateMessage(dialog, '선택한 팀/항목에 기입할 수 있는 값이 없습니다.');
            return;
        }
        list.innerHTML = normalizedCandidates.map((candidate, index) => {
            const direction = String(candidate?.direction || 'flat').trim() || 'flat';
            return `<button type="button" class="report-memo-candidate is-${parts.escapeReportDeckHtml(direction)}" data-report-memo-candidate="${index}"><span class="report-memo-candidate-add">+</span><span class="report-memo-candidate-text">${parts.renderReportDeckMemoLineHtml(candidate?.text || '')}</span></button>`;
        }).join('');
    }

    async function refreshReportDeckMemoDialog(root, state, meta) {
        const dialog = parts.getReportDeckMemoDialog(root);
        if (!dialog || dialog.hidden) return;
        const teamSelect = dialog.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog.querySelector?.('[data-report-memo-metric]');
        const teamKey = parts.normalizeReportDeckMemoTeamKey(teamSelect?.value);
        const metricKey = parts.syncReportDeckMemoMetricOptions(dialog, metricSelect?.value);
        if (teamSelect) teamSelect.value = teamKey;
        if (metricSelect) metricSelect.value = metricKey;
        dialog.dataset.reportMemoSequence = String((Number(dialog.dataset.reportMemoSequence || '0') || 0) + 1);
        const sequence = dialog.dataset.reportMemoSequence;
        dialog.__reportMemoCandidates = [];
        const memoKey = String(dialog?.dataset?.reportMemoTarget || '').trim();
        const cacheKey = parts.buildReportDeckMemoCandidateCacheKey(meta?.selectedMonth, teamKey, metricKey, memoKey);
        const candidateCache = parts.getReportDeckMemoCandidateCache(meta);
        if (cacheKey && candidateCache.has(cacheKey)) {
            renderReportDeckMemoCandidateList(dialog, candidateCache.get(cacheKey)?.candidates || []);
            return;
        }
        setReportDeckMemoCandidateMessage(dialog, '특이사항 후보를 불러오는 중입니다.');
        if (!meta?.selectedMonth || typeof browser?.buildReportDeckMemoCandidates !== 'function') {
            setReportDeckMemoCandidateMessage(dialog, '보고서 월 데이터가 준비되지 않았습니다.');
            return;
        }
        await parts.waitReportDeckUiFrame();
        if (dialog.dataset.reportMemoSequence !== sequence || dialog.hidden) return;
        try {
            const result = await browser.buildReportDeckMemoCandidates(meta.selectedMonth, {
                teamKey,
                metricKey,
                memoKey,
                store: meta.sharedStore
            });
            if (dialog.dataset.reportMemoSequence !== sequence) return;
            if (result?.ok !== true) {
                setReportDeckMemoCandidateMessage(dialog, '선택한 조건의 데이터를 불러올 수 없습니다.');
                return;
            }
            if (cacheKey) {
                candidateCache.set(cacheKey, {
                    candidates: Array.isArray(result.candidates) ? result.candidates : []
                });
            }
            renderReportDeckMemoCandidateList(dialog, result.candidates || []);
        } catch (error) {
            void error;
            if (dialog.dataset.reportMemoSequence === sequence) {
                setReportDeckMemoCandidateMessage(dialog, '특이사항 후보를 불러오지 못했습니다.');
            }
        }
    }

    function openReportDeckMemoDialog(root, state, meta, memoTarget) {
        const dialog = parts.getReportDeckMemoDialog(root);
        const key = String(memoTarget?.dataset?.reportMemoKey || '').trim();
        if (!dialog || !key || !Object.prototype.hasOwnProperty.call(state, key)) return false;
        const teamSelect = dialog.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog.querySelector?.('[data-report-memo-metric]');
        if (teamSelect) {
            teamSelect.value = parts.normalizeReportDeckMemoTeamKey(memoTarget.dataset.reportMemoDefaultTeam || teamSelect.value);
        }
        dialog.dataset.reportMemoTarget = key;
        parts.syncReportDeckMemoMetricOptions(dialog, memoTarget.dataset.reportMemoDefaultMetric || metricSelect?.value);
        syncReportDeckMemoDialogLines(dialog, state);
        dialog.hidden = false;
        parts.syncReportDeckMemoDialogFloatingPosition(dialog);
        void refreshReportDeckMemoDialog(root, state, meta);
        getReportDeckMemoNotepadInput(dialog)?.focus?.();
        return true;
    }
    Object.assign(parts, {
        adjustReportDeckMemoLineFontSize,
        adjustReportDeckMemoNotepadFontSize,
        appendReportDeckMemoLines,
        applyReportDeckMemoLineColor,
        applyReportDeckMemoNotepadColor,
        buildReportDeckMemoNotepadLineRanges,
        clearReportDeckMemoManualInput,
        encodeReportDeckMemoLineBreaks,
        getReportDeckMemoDialogTargetKey,
        getReportDeckMemoLineIdentity,
        getReportDeckMemoLineInputFromControl,
        getReportDeckMemoLines,
        getReportDeckMemoNotepadFontSizeInput,
        getReportDeckMemoNotepadInput,
        getReportDeckMemoNotepadSelection,
        getReportDeckMemoNotepadSelectionFontSizeLevel,
        getReportDeckMemoNotepadSelectionRanges,
        getReportDeckMemoNotepadValueFromState,
        getReportDeckMemoPreview,
        insertReportDeckMemoCandidateAtNotepadCursor,
        moveReportDeckMemoLine,
        normalizeReportDeckMemoLineArray,
        normalizeReportDeckMemoLineBreaks,
        normalizeReportDeckMemoLineText,
        openReportDeckMemoDialog,
        reconcileReportDeckMemoLineSizes,
        refreshReportDeckMemoDialog,
        rememberReportDeckMemoNotepadSelection,
        renderReportDeckMemoCandidateList,
        serializeReportDeckMemoLines,
        setReportDeckMemoCandidateMessage,
        setReportDeckMemoLines,
        setReportDeckMemoNotepadFontSize,
        syncReportDeckMemoDialogLines,
        syncReportDeckMemoDialogNotepad,
        syncReportDeckMemoDialogPreview,
        syncReportDeckMemoNotepadFontSizeControl,
        syncReportDeckMemoNotepadToState,
    });
})(this);
