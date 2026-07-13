(function registerKpiReportDeckRuntimeMemoFormat(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root) return;
    const parts = root[Symbol.for('kpi.reportDeck.runtime.parts')] ||= Object.create(null);
    const browser = root.KpiUtilRuntimeBrowserAdapter || null;
    function getReportDeckMemoLineClass(lineText = '') {
        const text = String(lineText || '');
        const hasUp = text.includes('↑') || text.includes('▲');
        const hasDown = text.includes('↓') || text.includes('▼');
        if (hasUp && hasDown) return 'is-mixed';
        if (hasUp) return 'is-up';
        if (hasDown) return 'is-down';
        return 'is-flat';
    }

    function getReportDeckMemoArrowClass(arrowText = '') {
        const text = String(arrowText || '');
        if (text === '↑' || text === '▲') return 'is-up';
        if (text === '↓' || text === '▼') return 'is-down';
        return 'is-flat';
    }

    function getReportDeckMemoNextValueEnd(text = '', startIndex = 0) {
        const match = String(text || '').slice(startIndex).match(/^\s*[+-]?(?:\d[\d,]*(?:\.\d+)?|\d*\.\d+)(?:\s*(?:%p|%|백만원|만원|원|㎥|m3|kWh|kg|톤|일|건|개|시간|h))?/i);
        return match ? startIndex + match[0].length : startIndex;
    }

    function getReportDeckMemoChangeStart(text = '', cursor = 0, arrowIndex = 0) {
        const before = String(text || '').slice(cursor, arrowIndex);
        const numericTail = before.match(/([+-]?(?:\d[\d,]*(?:\.\d+)?|\d*\.\d+)(?:\s*(?:%p|%|백만원|만원|원|㎥|m3|kWh|kg|톤|일|건|개|시간|h))?(?:\s*,\s*[+-]?(?:\d[\d,]*(?:\.\d+)?|\d*\.\d+)(?:\s*(?:%p|%|백만원|만원|원|㎥|m3|kWh|kg|톤|일|건|개|시간|h))?)?\s*)$/i);
        return numericTail ? arrowIndex - numericTail[1].length : arrowIndex;
    }

    function renderReportDeckMemoValueHtml(valueText = '', options = {}) {
        const text = String(valueText || '');
        const arrowPattern = /[↑▲↓▼]/g;
        const htmlParts = [];
        let cursor = 0;
        let match = arrowPattern.exec(text);
        while (match) {
            const arrow = match[0];
            const arrowIndex = match.index;
            let changeStart = options.highlightFromSegmentStart ? cursor : getReportDeckMemoChangeStart(text, cursor, arrowIndex);
            let changeEnd = arrowIndex + arrow.length;
            if (!text.slice(changeStart, arrowIndex).trim()) {
                changeStart = arrowIndex;
                changeEnd = getReportDeckMemoNextValueEnd(text, changeEnd) || changeEnd;
            }
            if (changeStart > cursor) {
                htmlParts.push(parts.escapeReportDeckHtml(text.slice(cursor, changeStart)));
            }
            htmlParts.push(`<span class="report-auto-memo-change ${getReportDeckMemoArrowClass(arrow)}">${parts.escapeReportDeckHtml(text.slice(changeStart, changeEnd))}</span>`);
            cursor = changeEnd;
            arrowPattern.lastIndex = cursor;
            match = arrowPattern.exec(text);
        }
        if (cursor < text.length) {
            htmlParts.push(parts.escapeReportDeckHtml(text.slice(cursor)));
        }
        return htmlParts.join('');
    }

    function findReportDeckMemoBasisIndex(text = '', startIndex = 0) {
        return ['전월대비', '전년대비'].reduce((best, basisLabel) => {
            const index = text.indexOf(basisLabel, startIndex);
            if (index < 0) return best;
            return best < 0 || index < best ? index : best;
        }, -1);
    }

    function renderReportDeckMemoSingleLineHtml(lineText = '') {
        const text = String(lineText || '');
        let cursor = 0;
        let basisIndex = findReportDeckMemoBasisIndex(text, 0);
        if (basisIndex < 0) return renderReportDeckMemoValueHtml(text);

        const htmlParts = [];
        while (basisIndex >= 0) {
            if (basisIndex > cursor) {
                htmlParts.push(parts.escapeReportDeckHtml(text.slice(cursor, basisIndex)));
            }
            const nextBasisIndex = findReportDeckMemoBasisIndex(text, basisIndex + 1);
            const rawSegmentEnd = nextBasisIndex >= 0 ? nextBasisIndex : text.length;
            let segmentText = text.slice(basisIndex, rawSegmentEnd);
            const separatorMatch = segmentText.match(/,\s*$/);
            const separatorText = separatorMatch ? separatorMatch[0] : '';
            if (separatorText) {
                segmentText = segmentText.slice(0, -separatorText.length);
            }
            const basisMatch = segmentText.match(/^(전월대비|전년대비)(\s*)([\s\S]*)$/);
            if (basisMatch) {
                htmlParts.push(`<span class="report-auto-memo-basis">${parts.escapeReportDeckHtml(basisMatch[1])}</span>`);
                const valueText = `${basisMatch[2] || ''}${basisMatch[3] || ''}`;
                if (valueText) {
                    htmlParts.push(`<span class="report-auto-memo-delta">${renderReportDeckMemoValueHtml(valueText, { highlightFromSegmentStart: true })}</span>`);
                }
            } else {
                htmlParts.push(`<span class="report-auto-memo-segment">${renderReportDeckMemoValueHtml(segmentText)}</span>`);
            }
            if (separatorText) {
                htmlParts.push(parts.escapeReportDeckHtml(separatorText));
            }
            cursor = rawSegmentEnd;
            basisIndex = nextBasisIndex;
        }
        if (cursor < text.length) {
            htmlParts.push(parts.escapeReportDeckHtml(text.slice(cursor)));
        }
        return htmlParts.join('');
    }

    function getReportDeckMemoManualRangeValueAt(ranges = [], offset = 0, valueKey = '') {
        const normalizedOffset = Math.max(0, Number.parseInt(String(offset), 10));
        const range = (Array.isArray(ranges) ? ranges : []).find(item => (
            item
            && item.start <= normalizedOffset
            && item.end > normalizedOffset
        ));
        return range ? range[valueKey] : null;
    }

    function renderReportDeckMemoSingleLineWithManualStylesHtml(lineText = '', colorRanges = [], sizeRanges = [], baseOffset = 0) {
        const text = String(lineText || '');
        const normalizedColorRanges = normalizeReportDeckMemoLineColorRanges(colorRanges, null)
            .map(range => ({
                ...range,
                start: Math.max(0, Math.min(text.length, range.start - baseOffset)),
                end: Math.max(0, Math.min(text.length, range.end - baseOffset))
            }))
            .filter(range => range.end > range.start)
            .sort((left, right) => left.start - right.start || left.end - right.end);
        const normalizedSizeRanges = normalizeReportDeckMemoLineFontSizeRanges(sizeRanges, null)
            .map(range => ({
                ...range,
                start: Math.max(0, Math.min(text.length, range.start - baseOffset)),
                end: Math.max(0, Math.min(text.length, range.end - baseOffset))
            }))
            .filter(range => range.end > range.start)
            .sort((left, right) => left.start - right.start || left.end - right.end);
        if (!normalizedColorRanges.length && !normalizedSizeRanges.length) return renderReportDeckMemoSingleLineHtml(text);
        const boundaries = new Set([0, text.length]);
        normalizedColorRanges.forEach(range => {
            boundaries.add(range.start);
            boundaries.add(range.end);
        });
        normalizedSizeRanges.forEach(range => {
            boundaries.add(range.start);
            boundaries.add(range.end);
        });
        const points = Array.from(boundaries).sort((left, right) => left - right);
        const htmlParts = [];
        for (let index = 0; index < points.length - 1; index += 1) {
            const start = points[index];
            const end = points[index + 1];
            if (end <= start) continue;
            const color = getReportDeckMemoManualRangeValueAt(normalizedColorRanges, start, 'color');
            const size = getReportDeckMemoManualRangeValueAt(normalizedSizeRanges, start, 'size');
            let html = renderReportDeckMemoSingleLineHtml(text.slice(start, end));
            if (color) {
                html = `<span class="report-auto-memo-manual-color is-${parts.escapeReportDeckHtml(color)}">${html}</span>`;
            }
            if (Number.isInteger(size)) {
                html = `<span class="report-auto-memo-manual-size" style="${getReportDeckMemoLineInlineFontSizeStyle(size)}">${html}</span>`;
            }
            htmlParts.push(html);
        }
        return htmlParts.join('');
    }

    function renderReportDeckMemoLineHtml(lineText = '', colorRanges = [], sizeRanges = []) {
        return parts.normalizeReportDeckMemoLineBreaks(lineText)
            .split('\n')
            .map((line, index, lines) => {
                const baseOffset = lines.slice(0, index).reduce((sum, item) => sum + item.length + 1, 0);
                return renderReportDeckMemoSingleLineWithManualStylesHtml(line, colorRanges, sizeRanges, baseOffset);
            })
            .join('<br>');
    }

    function renderReportDeckMemoAddButtonHtml(key = '') {
        const normalizedKey = String(key || '').trim();
        return normalizedKey
            ? `<button type="button" class="report-auto-memo-add" data-report-memo-add-key="${parts.escapeReportDeckHtml(normalizedKey)}" title="특이사항 추가">+</button>`
            : '';
    }

    function normalizeReportDeckMemoLineFontSizeLevel(value) {
        const number = Number.parseInt(String(value ?? '0'), 10);
        if (!Number.isFinite(number)) return 0;
        return Math.max(parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MIN, Math.min(parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MAX, number));
    }

    function getReportDeckMemoLineFontSizePx(level = 0) {
        const normalizedLevel = normalizeReportDeckMemoLineFontSizeLevel(level);
        return Number((parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_BASE + (normalizedLevel * parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_STEP)).toFixed(1));
    }

    function getReportDeckMemoLineFontSizeLevelFromPx(value) {
        const normalizedValue = String(value ?? '').replace(/[^\d.-]/g, '').trim();
        if (!normalizedValue) return null;
        const number = Number.parseFloat(normalizedValue);
        if (!Number.isFinite(number)) return null;
        return normalizeReportDeckMemoLineFontSizeLevel(
            Math.round((number - parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_BASE) / parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_STEP)
        );
    }

    function getReportDeckMemoLineFontSizeDisplayMax() {
        return parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MAX - parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MIN + 1;
    }

    function getReportDeckMemoLineFontSizeDisplayValue(level = 0) {
        return String(normalizeReportDeckMemoLineFontSizeLevel(level) - parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MIN + 1);
    }

    function getReportDeckMemoLineFontSizeLevelFromDisplayValue(value) {
        const raw = String(value ?? '').trim();
        if (!raw || raw === '?') return null;
        if (/^-?\d+$/.test(raw)) {
            const displayLevel = Number.parseInt(raw, 10);
            if (!Number.isFinite(displayLevel)) return null;
            const normalizedDisplayLevel = Math.max(1, Math.min(getReportDeckMemoLineFontSizeDisplayMax(), displayLevel));
            return normalizeReportDeckMemoLineFontSizeLevel(normalizedDisplayLevel + parts.REPORT_DECK_MEMO_LINE_FONT_SIZE_MIN - 1);
        }
        return getReportDeckMemoLineFontSizeLevelFromPx(raw);
    }

    function getReportDeckMemoLineFontSizeScale(level = 0) {
        const normalizedLevel = normalizeReportDeckMemoLineFontSizeLevel(level);
        return Math.max(0.82, 1 + (normalizedLevel * 0.18));
    }

    function getReportDeckMemoLineFontSizeStyle(level = 0) {
        const normalizedLevel = normalizeReportDeckMemoLineFontSizeLevel(level);
        const fontSize = getReportDeckMemoLineFontSizePx(normalizedLevel);
        const lineHeight = normalizedLevel > 0 ? 1.14 : 1.18;
        return `--report-auto-memo-line-font-size: ${fontSize}px; --report-auto-memo-line-line-height: ${lineHeight};`;
    }

    function getReportDeckMemoLineInlineFontSizeStyle(level = 0) {
        const normalizedLevel = normalizeReportDeckMemoLineFontSizeLevel(level);
        const fontSize = getReportDeckMemoLineFontSizePx(normalizedLevel);
        return `font-size:${fontSize}px;line-height:1;`;
    }

    function parseReportDeckMemoLineSizes(value = '') {
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        try {
            const parsed = JSON.parse(String(value || '{}'));
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function normalizeReportDeckMemoLineSizeArray(value = [], lineCount = null) {
        const source = Array.isArray(value) ? value : [];
        const count = Number.isInteger(lineCount) ? Math.max(0, lineCount) : source.length;
        return Array.from({ length: count }, (_, index) => normalizeReportDeckMemoLineFontSizeLevel(source[index]));
    }

    function getReportDeckMemoLineSizesMap(state = {}) {
        return parseReportDeckMemoLineSizes(state?.reportMemoLineSizes);
    }

    function normalizeReportDeckMemoLineSizes(value = '') {
        const map = parseReportDeckMemoLineSizes(value);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const sizes = normalizeReportDeckMemoLineSizeArray(map[key] || []);
            if (sizes.some(size => size !== 0)) {
                normalized[key] = sizes;
            }
        });
        return JSON.stringify(normalized);
    }

    function normalizeReportDeckMemoLineSizesForState(state = {}) {
        const map = getReportDeckMemoLineSizesMap(state);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const lineCount = countReportDeckMemoLayoutLines(state?.[key]);
            const sizes = normalizeReportDeckMemoLineSizeArray(map[key] || [], lineCount);
            if (sizes.some(size => size !== 0)) {
                normalized[key] = sizes;
            }
        });
        return JSON.stringify(normalized);
    }

    function getReportDeckMemoLineSizeArray(state = {}, key = '', lineCount = null) {
        const normalizedKey = String(key || '').trim();
        const map = getReportDeckMemoLineSizesMap(state);
        const count = Number.isInteger(lineCount)
            ? Math.max(0, lineCount)
            : countReportDeckMemoLayoutLines(state?.[normalizedKey]);
        return normalizeReportDeckMemoLineSizeArray(map[normalizedKey] || [], count);
    }

    function setReportDeckMemoLineSizeArray(state = {}, key = '', sizes = []) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return false;
        const map = getReportDeckMemoLineSizesMap(state);
        const lineCount = countReportDeckMemoLayoutLines(state?.[normalizedKey]);
        const nextSizes = normalizeReportDeckMemoLineSizeArray(sizes, lineCount);
        if (nextSizes.some(size => size !== 0)) {
            map[normalizedKey] = nextSizes;
        } else {
            delete map[normalizedKey];
        }
        state.reportMemoLineSizes = normalizeReportDeckMemoLineSizes(map);
        return true;
    }

    function parseReportDeckMemoLineFontSizeRangesMap(value = '') {
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        try {
            const parsed = JSON.parse(String(value || '{}'));
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function normalizeReportDeckMemoLineFontSizeRanges(value = [], lineText = null) {
        const source = Array.isArray(value) ? value : [];
        const hasLineText = lineText !== null;
        const maxLength = hasLineText
            ? parts.normalizeReportDeckMemoLineText(lineText).length
            : Number.MAX_SAFE_INTEGER;
        return source.map(range => {
            const start = Math.max(0, Math.min(maxLength, Number.parseInt(String(range?.start ?? '0'), 10)));
            const end = Math.max(0, Math.min(maxLength, Number.parseInt(String(range?.end ?? '0'), 10)));
            const size = normalizeReportDeckMemoLineFontSizeLevel(range?.size);
            if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
            return { start, end, size };
        }).filter(Boolean).sort((left, right) => left.start - right.start || left.end - right.end);
    }

    function normalizeReportDeckMemoLineFontSizeRangeArray(value = [], lines = null) {
        const source = Array.isArray(value) ? value : [];
        const hasLines = Array.isArray(lines);
        const count = hasLines ? lines.length : source.length;
        return Array.from({ length: count }, (_, index) => (
            normalizeReportDeckMemoLineFontSizeRanges(source[index] || [], hasLines ? lines[index] : null)
        ));
    }

    function getReportDeckMemoLineFontSizeRangesMap(state = {}) {
        return parseReportDeckMemoLineFontSizeRangesMap(state?.reportMemoLineSizeRanges);
    }

    function normalizeReportDeckMemoLineFontSizeRangesMap(value = '') {
        const map = parseReportDeckMemoLineFontSizeRangesMap(value);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const ranges = normalizeReportDeckMemoLineFontSizeRangeArray(map[key] || []);
            if (ranges.some(lineRanges => lineRanges.length)) {
                normalized[key] = ranges;
            }
        });
        return JSON.stringify(normalized);
    }

    function normalizeReportDeckMemoLineFontSizeRangesForState(state = {}) {
        const map = getReportDeckMemoLineFontSizeRangesMap(state);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const lines = parts.getReportDeckMemoLines(state?.[key]);
            const baseSizes = getReportDeckMemoLineSizeArray(state, key, lines.length);
            const ranges = normalizeReportDeckMemoLineFontSizeRangeArray(map[key] || [], lines)
                .map((lineRanges, index) => (
                    lineRanges.filter(range => range.size !== normalizeReportDeckMemoLineFontSizeLevel(baseSizes[index]))
                ));
            if (ranges.some(lineRanges => lineRanges.length)) {
                normalized[key] = ranges;
            }
        });
        return JSON.stringify(normalized);
    }

    function getReportDeckMemoLineSizeRangeArray(state = {}, key = '', lineCount = null) {
        const normalizedKey = String(key || '').trim();
        const map = getReportDeckMemoLineFontSizeRangesMap(state);
        const lines = parts.getReportDeckMemoLines(state?.[normalizedKey]);
        const count = Number.isInteger(lineCount) ? Math.max(0, lineCount) : lines.length;
        return normalizeReportDeckMemoLineFontSizeRangeArray(map[normalizedKey] || [], lines.slice(0, count));
    }

    function setReportDeckMemoLineSizeRangeArray(state = {}, key = '', sizeRanges = []) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return false;
        const map = getReportDeckMemoLineFontSizeRangesMap(state);
        const lines = parts.getReportDeckMemoLines(state?.[normalizedKey]);
        const baseSizes = getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const nextRanges = normalizeReportDeckMemoLineFontSizeRangeArray(sizeRanges, lines)
            .map((lineRanges, index) => (
                lineRanges.filter(range => range.size !== normalizeReportDeckMemoLineFontSizeLevel(baseSizes[index]))
            ));
        if (nextRanges.some(lineRanges => lineRanges.length)) {
            map[normalizedKey] = nextRanges;
        } else {
            delete map[normalizedKey];
        }
        state.reportMemoLineSizeRanges = normalizeReportDeckMemoLineFontSizeRangesForState({
            ...state,
            reportMemoLineSizeRanges: JSON.stringify(map)
        });
        return true;
    }

    function reconcileReportDeckMemoLineSizeRanges(previousLines = [], previousRanges = [], nextLines = []) {
        const used = new Set();
        const normalizedPrevious = Array.isArray(previousLines) ? previousLines : [];
        const normalizedRanges = normalizeReportDeckMemoLineFontSizeRangeArray(previousRanges, normalizedPrevious);
        return (Array.isArray(nextLines) ? nextLines : []).map((line, index) => {
            const identity = parts.getReportDeckMemoLineIdentity(line);
            if (
                index < normalizedPrevious.length
                && !used.has(index)
                && parts.getReportDeckMemoLineIdentity(normalizedPrevious[index]) === identity
            ) {
                used.add(index);
                return normalizeReportDeckMemoLineFontSizeRanges(normalizedRanges[index] || [], line);
            }
            const matchedIndex = normalizedPrevious.findIndex((previousLine, previousIndex) => (
                !used.has(previousIndex)
                && parts.getReportDeckMemoLineIdentity(previousLine) === identity
            ));
            if (matchedIndex >= 0) {
                used.add(matchedIndex);
                return normalizeReportDeckMemoLineFontSizeRanges(normalizedRanges[matchedIndex] || [], line);
            }
            return [];
        });
    }

    function getReportDeckMemoLineFontSizeLevelAtOffset(baseLevel = 0, ranges = [], offset = 0) {
        const size = getReportDeckMemoManualRangeValueAt(
            normalizeReportDeckMemoLineFontSizeRanges(ranges),
            offset,
            'size'
        );
        return Number.isInteger(size)
            ? normalizeReportDeckMemoLineFontSizeLevel(size)
            : normalizeReportDeckMemoLineFontSizeLevel(baseLevel);
    }

    function getReportDeckMemoLineSelectionFontSizeLevel(baseLevel = 0, ranges = [], start = 0, end = 0, delta = 0) {
        const levels = getReportDeckMemoLineSelectionFontSizeLevels(baseLevel, ranges, start, end);
        void delta;
        return levels.length ? Math.max(...levels) : normalizeReportDeckMemoLineFontSizeLevel(baseLevel);
    }

    function getReportDeckMemoLineSelectionFontSizeLevels(baseLevel = 0, ranges = [], start = 0, end = 0) {
        const rangeStart = Math.max(0, Number.parseInt(String(start), 10));
        const rangeEnd = Math.max(0, Number.parseInt(String(end), 10));
        if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) {
            return [normalizeReportDeckMemoLineFontSizeLevel(baseLevel)];
        }
        const boundaries = new Set([rangeStart, rangeEnd]);
        normalizeReportDeckMemoLineFontSizeRanges(ranges).forEach(range => {
            if (range.start > rangeStart && range.start < rangeEnd) boundaries.add(range.start);
            if (range.end > rangeStart && range.end < rangeEnd) boundaries.add(range.end);
        });
        const points = Array.from(boundaries).sort((left, right) => left - right);
        const levels = [];
        for (let index = 0; index < points.length - 1; index += 1) {
            const point = points[index];
            if (points[index + 1] <= point) continue;
            levels.push(getReportDeckMemoLineFontSizeLevelAtOffset(baseLevel, ranges, point));
        }
        if (!levels.length) levels.push(normalizeReportDeckMemoLineFontSizeLevel(baseLevel));
        return Array.from(new Set(levels.map(normalizeReportDeckMemoLineFontSizeLevel)));
    }

    function applyReportDeckMemoLineFontSizeRange(ranges = [], start = 0, end = 0, size = 0) {
        const rangeStart = Math.max(0, Number.parseInt(String(start), 10));
        const rangeEnd = Math.max(0, Number.parseInt(String(end), 10));
        if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) {
            return normalizeReportDeckMemoLineFontSizeRanges(ranges);
        }
        const normalizedSize = normalizeReportDeckMemoLineFontSizeLevel(size);
        const nextRanges = [];
        normalizeReportDeckMemoLineFontSizeRanges(ranges).forEach(range => {
            if (range.end <= rangeStart || range.start >= rangeEnd) {
                nextRanges.push(range);
                return;
            }
            if (range.start < rangeStart) {
                nextRanges.push({ start: range.start, end: rangeStart, size: range.size });
            }
            if (range.end > rangeEnd) {
                nextRanges.push({ start: rangeEnd, end: range.end, size: range.size });
            }
        });
        nextRanges.push({ start: rangeStart, end: rangeEnd, size: normalizedSize });
        return normalizeReportDeckMemoLineFontSizeRanges(nextRanges).reduce((merged, range) => {
            const previous = merged[merged.length - 1];
            if (previous && previous.size === range.size && previous.end === range.start) {
                previous.end = range.end;
            } else {
                merged.push({ ...range });
            }
            return merged;
        }, []);
    }

    function normalizeReportDeckMemoLineColor(value = '') {
        const color = String(value || '').trim().toLowerCase();
        return color === 'red' || color === 'blue' ? color : '';
    }

    function parseReportDeckMemoLineColors(value = '') {
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        try {
            const parsed = JSON.parse(String(value || '{}'));
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function normalizeReportDeckMemoLineColorRanges(value = [], lineText = null) {
        const source = Array.isArray(value) ? value : [];
        const hasLineText = lineText !== null;
        const maxLength = hasLineText
            ? parts.normalizeReportDeckMemoLineText(lineText).length
            : Number.MAX_SAFE_INTEGER;
        return source.map(range => {
            const color = normalizeReportDeckMemoLineColor(range?.color);
            const start = Math.max(0, Math.min(maxLength, Number.parseInt(String(range?.start ?? '0'), 10)));
            const end = Math.max(0, Math.min(maxLength, Number.parseInt(String(range?.end ?? '0'), 10)));
            if (!color || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
            return { start, end, color };
        }).filter(Boolean).sort((left, right) => left.start - right.start || left.end - right.end);
    }

    function normalizeReportDeckMemoLineColorArray(value = [], lines = null) {
        const source = Array.isArray(value) ? value : [];
        const hasLines = Array.isArray(lines);
        const count = hasLines ? lines.length : source.length;
        return Array.from({ length: count }, (_, index) => (
            normalizeReportDeckMemoLineColorRanges(source[index] || [], hasLines ? lines[index] : null)
        ));
    }

    function getReportDeckMemoLineColorsMap(state = {}) {
        return parseReportDeckMemoLineColors(state?.reportMemoLineColors);
    }

    function normalizeReportDeckMemoLineColors(value = '') {
        const map = parseReportDeckMemoLineColors(value);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const colors = normalizeReportDeckMemoLineColorArray(map[key] || []);
            if (colors.some(ranges => ranges.length)) {
                normalized[key] = colors;
            }
        });
        return JSON.stringify(normalized);
    }

    function normalizeReportDeckMemoLineColorsForState(state = {}) {
        const map = getReportDeckMemoLineColorsMap(state);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            const lines = parts.getReportDeckMemoLines(state?.[key]);
            const colors = normalizeReportDeckMemoLineColorArray(map[key] || [], lines);
            if (colors.some(ranges => ranges.length)) {
                normalized[key] = colors;
            }
        });
        return JSON.stringify(normalized);
    }

    function parseReportDeckMemoPreserveFormatting(value = '') {
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        try {
            const parsed = JSON.parse(String(value || '{}'));
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function normalizeReportDeckMemoPreserveFormatting(value = '') {
        const map = parseReportDeckMemoPreserveFormatting(value);
        const normalized = {};
        parts.REPORT_DECK_MEMO_KEYS.forEach(key => {
            if (map[key] === true || map[key] === 'true') {
                normalized[key] = true;
            }
        });
        return JSON.stringify(normalized);
    }

    function getReportDeckMemoPreserveFormattingMap(state = {}) {
        return parseReportDeckMemoPreserveFormatting(state?.reportMemoPreserveFormatting);
    }

    function isReportDeckMemoFormattingPreserved(state = {}, key = '') {
        const normalizedKey = String(key || '').trim();
        return Boolean(normalizedKey && getReportDeckMemoPreserveFormattingMap(state)[normalizedKey]);
    }

    function setReportDeckMemoFormattingPreserved(state = {}, key = '', preserved = false) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return false;
        const map = getReportDeckMemoPreserveFormattingMap(state);
        if (preserved) {
            map[normalizedKey] = true;
        } else {
            delete map[normalizedKey];
        }
        state.reportMemoPreserveFormatting = normalizeReportDeckMemoPreserveFormatting(map);
        return true;
    }

    function getReportDeckMemoLineColorArray(state = {}, key = '', lineCount = null) {
        const normalizedKey = String(key || '').trim();
        const map = getReportDeckMemoLineColorsMap(state);
        const lines = parts.getReportDeckMemoLines(state?.[normalizedKey]);
        const count = Number.isInteger(lineCount) ? Math.max(0, lineCount) : lines.length;
        return normalizeReportDeckMemoLineColorArray(map[normalizedKey] || [], lines.slice(0, count));
    }

    function setReportDeckMemoLineColorArray(state = {}, key = '', colors = []) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return false;
        const map = getReportDeckMemoLineColorsMap(state);
        const lines = parts.getReportDeckMemoLines(state?.[normalizedKey]);
        const nextColors = normalizeReportDeckMemoLineColorArray(colors, lines);
        if (nextColors.some(ranges => ranges.length)) {
            map[normalizedKey] = nextColors;
        } else {
            delete map[normalizedKey];
        }
        state.reportMemoLineColors = normalizeReportDeckMemoLineColorsForState({
            ...state,
            reportMemoLineColors: JSON.stringify(map)
        });
        return true;
    }

    function reconcileReportDeckMemoLineColors(previousLines = [], previousColors = [], nextLines = []) {
        const used = new Set();
        const normalizedPrevious = Array.isArray(previousLines) ? previousLines : [];
        const normalizedColors = normalizeReportDeckMemoLineColorArray(previousColors, normalizedPrevious);
        return (Array.isArray(nextLines) ? nextLines : []).map((line, index) => {
            const identity = parts.getReportDeckMemoLineIdentity(line);
            if (
                index < normalizedPrevious.length
                && !used.has(index)
                && parts.getReportDeckMemoLineIdentity(normalizedPrevious[index]) === identity
            ) {
                used.add(index);
                return normalizeReportDeckMemoLineColorRanges(normalizedColors[index] || [], line);
            }
            const matchedIndex = normalizedPrevious.findIndex((previousLine, previousIndex) => (
                !used.has(previousIndex)
                && parts.getReportDeckMemoLineIdentity(previousLine) === identity
            ));
            if (matchedIndex >= 0) {
                used.add(matchedIndex);
                return normalizeReportDeckMemoLineColorRanges(normalizedColors[matchedIndex] || [], line);
            }
            return [];
        });
    }

    function applyReportDeckMemoLineColorRange(ranges = [], start = 0, end = 0, color = '') {
        const normalizedColor = normalizeReportDeckMemoLineColor(color);
        const rangeStart = Math.max(0, Number.parseInt(String(start), 10));
        const rangeEnd = Math.max(0, Number.parseInt(String(end), 10));
        if (!normalizedColor || !Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) {
            return normalizeReportDeckMemoLineColorRanges(ranges);
        }
        const nextRanges = [];
        normalizeReportDeckMemoLineColorRanges(ranges).forEach(range => {
            if (range.end <= rangeStart || range.start >= rangeEnd) {
                nextRanges.push(range);
                return;
            }
            if (range.start < rangeStart) {
                nextRanges.push({ start: range.start, end: rangeStart, color: range.color });
            }
            if (range.end > rangeEnd) {
                nextRanges.push({ start: rangeEnd, end: range.end, color: range.color });
            }
        });
        nextRanges.push({ start: rangeStart, end: rangeEnd, color: normalizedColor });
        return normalizeReportDeckMemoLineColorRanges(nextRanges).reduce((merged, range) => {
            const previous = merged[merged.length - 1];
            if (previous && previous.color === range.color && previous.end === range.start) {
                previous.end = range.end;
            } else {
                merged.push({ ...range });
            }
            return merged;
        }, []);
    }

    function clearReportDeckMemoLineColorRange(ranges = [], start = 0, end = 0) {
        const rangeStart = Math.max(0, Number.parseInt(String(start), 10));
        const rangeEnd = Math.max(0, Number.parseInt(String(end), 10));
        if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) {
            return normalizeReportDeckMemoLineColorRanges(ranges);
        }
        return normalizeReportDeckMemoLineColorRanges(ranges).reduce((nextRanges, range) => {
            if (range.end <= rangeStart || range.start >= rangeEnd) {
                nextRanges.push(range);
                return nextRanges;
            }
            if (range.start < rangeStart) {
                nextRanges.push({ start: range.start, end: rangeStart, color: range.color });
            }
            if (range.end > rangeEnd) {
                nextRanges.push({ start: rangeEnd, end: range.end, color: range.color });
            }
            return nextRanges;
        }, []);
    }

    function getReportDeckMemoLineFontSizeLevel(state = {}, key = '', index = 0) {
        const sizes = getReportDeckMemoLineSizeArray(state, key);
        return normalizeReportDeckMemoLineFontSizeLevel(sizes[index]);
    }

    function renderReportDeckMemoContent(container, text = '', key = '', state = {}) {
        const rawText = String(text || '').trim();
        if (!container) return;
        container.dataset.empty = rawText ? 'false' : 'true';
        const addButtonHtml = renderReportDeckMemoAddButtonHtml(key);
        if (!rawText) {
            container.innerHTML = addButtonHtml;
            return;
        }
        const preserveFormatting = isReportDeckMemoFormattingPreserved(state, key);
        const lines = parts.getReportDeckMemoLines(rawText);
        const sizes = getReportDeckMemoLineSizeArray(state, key, lines.length);
        const colors = getReportDeckMemoLineColorArray(state, key, lines.length);
        const sizeRanges = getReportDeckMemoLineSizeRangeArray(state, key, lines.length);
        container.innerHTML = lines.map((line, index) => (
            `<span class="report-auto-memo-line ${getReportDeckMemoLineClass(line)}${preserveFormatting ? ' is-preserve-format' : ''}" data-report-memo-line-size="${getReportDeckMemoLineFontSizeLevel(state, key, index)}" style="${getReportDeckMemoLineFontSizeStyle(sizes[index])}">`
                + `<span class="report-auto-memo-line-text">${renderReportDeckMemoLineHtml(line, colors[index] || [], sizeRanges[index] || [])}</span>`
            + '</span>'
        )).join('') + addButtonHtml;
    }

    function countReportDeckMemoLayoutLines(value = '') {
        return parts.getReportDeckMemoLines(value).length;
    }

    function countReportDeckMemoVisualLines(value = '') {
        const lines = parts.normalizeReportDeckMemoLineBreaks(value).split('\n');
        return Math.max(1, lines.length);
    }

    function getReportDeckMemoWeightedLayoutLineCount(state = {}, key = '') {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return 0;
        const lines = parts.getReportDeckMemoLines(state?.[normalizedKey]);
        if (!lines.length) return 0;
        const sizes = getReportDeckMemoLineSizeArray(state, normalizedKey, lines.length);
        const sizeRanges = getReportDeckMemoLineSizeRangeArray(state, normalizedKey, lines.length);
        return lines.reduce((sum, line, index) => {
            const rangeLevels = (sizeRanges[index] || []).map(range => normalizeReportDeckMemoLineFontSizeLevel(range.size));
            const maxLevel = Math.max(normalizeReportDeckMemoLineFontSizeLevel(sizes[index]), ...rangeLevels);
            return sum + (getReportDeckMemoLineFontSizeScale(maxLevel) * countReportDeckMemoVisualLines(line));
        }, 0);
    }

    function getReportDeckMemoGroupLayoutLineCount(state = {}, keys = []) {
        return keys.reduce((max, key) => Math.max(max, getReportDeckMemoWeightedLayoutLineCount(state, key)), 0);
    }

    function formatReportDeckLayoutPercent(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '0%';
        return `${Number(number.toFixed(1))}%`;
    }

    function setReportDeckLayoutPercentVariable(element, name, value) {
        if (!element?.style || typeof element.style.setProperty !== 'function') return;
        element.style.setProperty(name, formatReportDeckLayoutPercent(value));
    }

    function getReportDeckAnalysisLayoutRows(lineCount = 0) {
        const count = Math.max(0, Math.min(Number(lineCount) || 0, 6));
        const memo = count <= 0 ? 6 : Math.min(14.5, 6.5 + (count * 1.25));
        const table = Math.max(24.5, 28 - (count * 0.3));
        return {
            table,
            memo,
            chart: Math.max(0, 96 - table - memo)
        };
    }

    function getReportDeckWasteLayoutRows(lineCount = 0) {
        const count = Math.max(0, Math.min(Number(lineCount) || 0, 6));
        const memo = count <= 0 ? 6.5 : Math.min(16, 6.5 + (count * 1.4));
        return {
            main: Math.max(0, 90 - memo),
            memo
        };
    }

    function applyReportDeckMemoResponsiveLayout(root, state = {}) {
        const analysisRows = getReportDeckAnalysisLayoutRows(
            getReportDeckMemoGroupLayoutLineCount(state, parts.REPORT_DECK_MEMO_ANALYSIS_MEMO_KEYS)
        );
        Array.from(root?.querySelectorAll?.('.report-bukjeong-analysis-column, .report-analysis-column') || []).forEach(column => {
            setReportDeckLayoutPercentVariable(column, '--report-analysis-table-row', analysisRows.table);
            setReportDeckLayoutPercentVariable(column, '--report-analysis-chart-row', analysisRows.chart);
            setReportDeckLayoutPercentVariable(column, '--report-analysis-memo-row', analysisRows.memo);
        });

        const wasteRows = getReportDeckWasteLayoutRows(
            getReportDeckMemoGroupLayoutLineCount(state, parts.REPORT_DECK_MEMO_WASTE_MEMO_KEYS)
        );
        Array.from(root?.querySelectorAll?.('.report-waste-auto-layout') || []).forEach(layout => {
            setReportDeckLayoutPercentVariable(layout, '--report-waste-main-row', wasteRows.main);
            setReportDeckLayoutPercentVariable(layout, '--report-waste-memo-row', wasteRows.memo);
        });
    }

    function syncReportDeckMemoControls(root, state) {
        Array.from(root?.querySelectorAll?.('[data-report-memo-content]') || []).forEach(container => {
            const key = String(container?.dataset?.reportMemoContent || '').trim();
            renderReportDeckMemoContent(container, key && Object.prototype.hasOwnProperty.call(state, key) ? state[key] : '', key, state);
        });
        applyReportDeckMemoResponsiveLayout(root, state);
    }

    function normalizeReportDeckMemoTeamKey(value = '') {
        const key = String(value || '').trim();
        return parts.REPORT_DECK_MEMO_TEAM_OPTIONS.some(option => option.key === key)
            ? key
            : parts.REPORT_DECK_MEMO_TEAM_OPTIONS[0].key;
    }

    function syncReportDeckMemoTeamOptions(dialog, preferredTeamKey = '') {
        const teamSelect = dialog?.querySelector?.('[data-report-memo-team]');
        const teamKey = normalizeReportDeckMemoTeamKey(preferredTeamKey || teamSelect?.value);
        if (teamSelect) {
            teamSelect.innerHTML = parts.REPORT_DECK_MEMO_TEAM_OPTIONS.map(option => (
                `<option value="${parts.escapeReportDeckHtml(option.key)}">${parts.escapeReportDeckHtml(option.label)}</option>`
            )).join('');
            teamSelect.value = teamKey;
        }
        return teamKey;
    }

    function normalizeReportDeckMemoMetricKey(value = '') {
        const key = String(value || '').trim();
        return parts.REPORT_DECK_MEMO_METRIC_OPTIONS.some(option => option.key === key)
            || getReportDeckMemoLineNameFromMetricKey(key)
            ? key
            : parts.REPORT_DECK_MEMO_METRIC_OPTIONS[0].key;
    }

    function buildReportDeckMemoLineMetricKey(lineName = '') {
        const normalizedLineName = String(lineName || '').trim();
        return normalizedLineName ? `${parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX}${normalizedLineName}` : '';
    }

    function getReportDeckMemoLineNameFromMetricKey(metricKey = '') {
        const key = String(metricKey || '').trim();
        return key.startsWith(parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX)
            ? key.slice(parts.REPORT_DECK_MEMO_LINE_METRIC_PREFIX.length).trim()
            : '';
    }

    function getReportDeckMemoLineNamesForTeam(teamKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        return Array.from(parts.REPORT_DECK_MEMO_PRODUCTION_LINES[normalizedTeamKey] || []);
    }

    function isReportDeckMemoWasteMemoKey(memoKey = '') {
        const normalizedMemoKey = String(memoKey || '').trim();
        return parts.REPORT_DECK_MEMO_WASTE_MEMO_KEYS.includes(normalizedMemoKey);
    }

    function getReportDeckMemoMetricOption(metricKey = '') {
        const key = normalizeReportDeckMemoMetricKey(metricKey);
        const baseOption = parts.REPORT_DECK_MEMO_METRIC_OPTIONS.find(option => option.key === key);
        if (baseOption) return baseOption;
        const lineName = getReportDeckMemoLineNameFromMetricKey(key);
        return lineName ? { key, label: `${lineName} 생산량` } : null;
    }

    function getReportDeckMemoMetricOptionsForTeam(teamKey = '', memoKey = '') {
        const normalizedTeamKey = normalizeReportDeckMemoTeamKey(teamKey);
        const metricKeys = parts.REPORT_DECK_MEMO_TEAM_METRIC_KEYS[normalizedTeamKey] || parts.REPORT_DECK_MEMO_TEAM_METRIC_KEYS.team_01_01;
        return Array.from(metricKeys)
            .concat(getReportDeckMemoLineNamesForTeam(normalizedTeamKey).map(buildReportDeckMemoLineMetricKey).filter(Boolean))
            .concat(isReportDeckMemoWasteMemoKey(memoKey) ? Array.from(parts.REPORT_DECK_MEMO_WASTE_METRIC_KEYS) : [])
            .map(getReportDeckMemoMetricOption)
            .filter(Boolean);
    }

    function normalizeReportDeckMemoMetricKeyForTeam(metricKey = '', teamKey = '', memoKey = '') {
        const options = getReportDeckMemoMetricOptionsForTeam(teamKey, memoKey);
        const normalizedMetricKey = normalizeReportDeckMemoMetricKey(metricKey);
        return options.some(option => option.key === normalizedMetricKey)
            ? normalizedMetricKey
            : options[0]?.key || parts.REPORT_DECK_MEMO_METRIC_OPTIONS[0].key;
    }

    function syncReportDeckMemoMetricOptions(dialog, preferredMetricKey = '') {
        const teamSelect = dialog?.querySelector?.('[data-report-memo-team]');
        const metricSelect = dialog?.querySelector?.('[data-report-memo-metric]');
        const teamKey = syncReportDeckMemoTeamOptions(dialog, teamSelect?.value);
        const memoKey = String(dialog?.dataset?.reportMemoTarget || '').trim();
        const metricKey = normalizeReportDeckMemoMetricKeyForTeam(preferredMetricKey || metricSelect?.value, teamKey, memoKey);
        if (metricSelect) {
            const options = getReportDeckMemoMetricOptionsForTeam(teamKey, memoKey);
            metricSelect.innerHTML = options.map(option => (
                `<option value="${parts.escapeReportDeckHtml(option.key)}">${parts.escapeReportDeckHtml(option.label)}</option>`
            )).join('');
            metricSelect.value = metricKey;
        }
        return metricKey;
    }

    function getReportDeckMemoDialog(root) {
        return root?.querySelector?.('[data-report-memo-dialog]') || null;
    }
    Object.assign(parts, {
        applyReportDeckMemoLineColorRange,
        applyReportDeckMemoLineFontSizeRange,
        applyReportDeckMemoResponsiveLayout,
        buildReportDeckMemoLineMetricKey,
        clearReportDeckMemoLineColorRange,
        countReportDeckMemoLayoutLines,
        countReportDeckMemoVisualLines,
        findReportDeckMemoBasisIndex,
        formatReportDeckLayoutPercent,
        getReportDeckAnalysisLayoutRows,
        getReportDeckMemoArrowClass,
        getReportDeckMemoChangeStart,
        getReportDeckMemoDialog,
        getReportDeckMemoGroupLayoutLineCount,
        getReportDeckMemoLineClass,
        getReportDeckMemoLineColorArray,
        getReportDeckMemoLineColorsMap,
        getReportDeckMemoLineFontSizeDisplayMax,
        getReportDeckMemoLineFontSizeDisplayValue,
        getReportDeckMemoLineFontSizeLevel,
        getReportDeckMemoLineFontSizeLevelAtOffset,
        getReportDeckMemoLineFontSizeLevelFromDisplayValue,
        getReportDeckMemoLineFontSizeLevelFromPx,
        getReportDeckMemoLineFontSizePx,
        getReportDeckMemoLineFontSizeRangesMap,
        getReportDeckMemoLineFontSizeScale,
        getReportDeckMemoLineFontSizeStyle,
        getReportDeckMemoLineInlineFontSizeStyle,
        getReportDeckMemoLineNameFromMetricKey,
        getReportDeckMemoLineNamesForTeam,
        getReportDeckMemoLineSelectionFontSizeLevel,
        getReportDeckMemoLineSelectionFontSizeLevels,
        getReportDeckMemoLineSizeArray,
        getReportDeckMemoLineSizeRangeArray,
        getReportDeckMemoLineSizesMap,
        getReportDeckMemoManualRangeValueAt,
        getReportDeckMemoMetricOption,
        getReportDeckMemoMetricOptionsForTeam,
        getReportDeckMemoNextValueEnd,
        getReportDeckMemoPreserveFormattingMap,
        getReportDeckMemoWeightedLayoutLineCount,
        getReportDeckWasteLayoutRows,
        isReportDeckMemoFormattingPreserved,
        isReportDeckMemoWasteMemoKey,
        normalizeReportDeckMemoLineColor,
        normalizeReportDeckMemoLineColorArray,
        normalizeReportDeckMemoLineColorRanges,
        normalizeReportDeckMemoLineColors,
        normalizeReportDeckMemoLineColorsForState,
        normalizeReportDeckMemoLineFontSizeLevel,
        normalizeReportDeckMemoLineFontSizeRangeArray,
        normalizeReportDeckMemoLineFontSizeRanges,
        normalizeReportDeckMemoLineFontSizeRangesForState,
        normalizeReportDeckMemoLineFontSizeRangesMap,
        normalizeReportDeckMemoLineSizeArray,
        normalizeReportDeckMemoLineSizes,
        normalizeReportDeckMemoLineSizesForState,
        normalizeReportDeckMemoMetricKey,
        normalizeReportDeckMemoMetricKeyForTeam,
        normalizeReportDeckMemoPreserveFormatting,
        normalizeReportDeckMemoTeamKey,
        parseReportDeckMemoLineColors,
        parseReportDeckMemoLineFontSizeRangesMap,
        parseReportDeckMemoLineSizes,
        parseReportDeckMemoPreserveFormatting,
        reconcileReportDeckMemoLineColors,
        reconcileReportDeckMemoLineSizeRanges,
        renderReportDeckMemoAddButtonHtml,
        renderReportDeckMemoContent,
        renderReportDeckMemoLineHtml,
        renderReportDeckMemoSingleLineHtml,
        renderReportDeckMemoSingleLineWithManualStylesHtml,
        renderReportDeckMemoValueHtml,
        setReportDeckLayoutPercentVariable,
        setReportDeckMemoFormattingPreserved,
        setReportDeckMemoLineColorArray,
        setReportDeckMemoLineSizeArray,
        setReportDeckMemoLineSizeRangeArray,
        syncReportDeckMemoControls,
        syncReportDeckMemoMetricOptions,
        syncReportDeckMemoTeamOptions,
    });
})(this);
