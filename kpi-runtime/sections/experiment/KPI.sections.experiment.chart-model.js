(function (root) {
    const parts = root[Symbol.for('kpi.experiment.section.parts')] ||= Object.create(null);
    function isDerivedRatioCard(card) {
        return Boolean(card?.normalization?.derived || String(card?.key || '').startsWith(parts.RATIO_CARD_PREFIX) || String(card?.key || '').includes('-per-'));
    }


    function formatExperimentStatsMonthLabel(point) {
        const monthKey = String(point?.monthKey || point?.key || '').trim();
        const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
        if (!match) return '-';
        return `${match[1].slice(-2)}.${match[2]}`;
    }

    function buildExperimentSummaryStatItems(card, series) {
        const points = (Array.isArray(series?.points) ? series.points : [])
            .map(point => ({ point, value: Number(point?.value) }))
            .filter(entry => Number.isFinite(entry.value));
        if (points.length < 2) return [];
        const decimals = Number.isFinite(series?.decimals) ? series.decimals : 0;
        const forceDecimals = isDerivedRatioCard(card);
        const minEntry = points.reduce((current, entry) => entry.value < current.value ? entry : current, points[0]);
        const maxEntry = points.reduce((current, entry) => entry.value > current.value ? entry : current, points[0]);
        const average = points.reduce((sum, entry) => sum + entry.value, 0) / points.length;
        return [
            { label: '최대 :', valueText: formatExperimentStatsMonthLabel(maxEntry.point) },
            { label: '최소 :', valueText: formatExperimentStatsMonthLabel(minEntry.point) },
            { label: '평균 :', valueText: parts.formatMetricTableValue(average, decimals, forceDecimals) }
        ].map((item, index) => ({
            ...item,
            tone: index === 0 ? 'max' : index === 1 ? 'min' : 'average'
        }));
    }

    function buildSummaryItem(card, series, index = 0) {
        const compactTitle = parts.getCompactAnalysisCardTitle(card) || card.title || card.key;
        return {
            key: card.key,
            title: card.title,
            valueText: '',
            icon: card.icon,
            tone: card.tone,
            seriesBadge: {
                index: Math.max(1, Math.trunc(Number(index) || 0) + 1),
                color: parts.getSafeChartColor(series?.color || card.color)
            },
            actionHtml: `
                <button
                    type="button"
                    class="experiment-summary-remove-button"
                    data-exp-card-remove-key="${parts.escapeHtml(card.key)}"
                    aria-label="${parts.escapeHtml(`${compactTitle} 삭제`)}"
                    title="삭제"
                    onclick="KpiExperimentGraphPrototype.removeSelectedCard(this)"
                >
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            `,
            statItems: buildExperimentSummaryStatItems(card, series)
        };
    }

    function getExperimentTablePointValue(point, card, monthKey, shell) {
        const directValue = Number(point?.value);
        if (Number.isFinite(directValue)) return directValue;
        const parsedValue = parts.parseExperimentNumberText(point?.valueText ?? point?.formattedValue ?? point?.displayValue ?? point?.rawValue);
        if (Number.isFinite(parsedValue)) return parsedValue;
        return parts.resolvePeriodValue(card, monthKey, shell);
    }

    function getExperimentTableUnitHeaderLabel(seriesList = []) {
        const unitLabels = Array.from(new Set((Array.isArray(seriesList) ? seriesList : [])
            .map(series => String(series?.unitLabel || '').trim())
            .filter(Boolean)));
        if (unitLabels.length === 1) return `단위: ${unitLabels[0]}`;
        if (unitLabels.length > 1 && unitLabels.length <= 3) return `단위: ${unitLabels.join(' / ')}`;
        if (unitLabels.length > 3) return '단위: 혼합';
        return '단위';
    }

    function buildExperimentChartTableEntries(seriesList = [], cards = []) {
        const cardMap = new Map((Array.isArray(cards) ? cards : []).map(card => [String(card?.key || ''), card]));
        return (Array.isArray(seriesList) ? seriesList : []).map((series, seriesIndex) => {
            const seriesKey = String(series?.seriesKey || '').trim();
            const pointMap = new Map();
            (Array.isArray(series?.points) ? series.points : []).forEach(point => {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                if (/^\d{4}-\d{2}$/.test(monthKey)) pointMap.set(monthKey, point);
            });
            return {
                series,
                seriesIndex,
                seriesKey,
                card: cardMap.get(seriesKey) || null,
                pointMap,
                years: Array.from(new Set(Array.from(pointMap.keys()).map(monthKey => monthKey.slice(0, 4)))).sort(),
                accentColor: parts.getSafeChartColor(series?.color || cardMap.get(seriesKey)?.color)
            };
        }).filter(entry => entry.years.length);
    }

    function buildExperimentChartSingleTableHtml(entry, shell = null, index = 0) {
        const { series, seriesIndex, card, pointMap, years, accentColor } = entry;
        const monthHeaders = Array.from({ length: 12 }, (_, index) => `<th>${index + 1}월</th>`).join('');
        const unitHeaderLabel = getExperimentTableUnitHeaderLabel([series]);
        const tableNumber = Math.max(1, Math.trunc(Number(index) || 0) + 1);
        const rows = years.map((year, yearIndex) => {
            const cells = Array.from({ length: 12 }, (_, index) => {
                const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
                const point = pointMap.get(monthKey);
                const value = getExperimentTablePointValue(point, card, monthKey, shell);
                const isValue = Number.isFinite(value);
                const valueText = isValue
                    ? parts.formatMetricTableValue(value, Number.isFinite(series?.decimals) ? series.decimals : 0, isDerivedRatioCard(card))
                    : '';
                return `<td class="${isValue ? 'is-strong' : 'is-empty'}">${parts.escapeHtml(valueText)}</td>`;
            }).join('');
            return `
                <tr class="experiment-chart-table-row${yearIndex === 0 ? ' is-series-start' : ''}" data-exp-series-index="${seriesIndex % 6}" style="--exp-series-color:${parts.escapeHtml(accentColor)};">
                    <th>
                        <div class="util-sheet-analysis-table-row-title experiment-chart-table-row-title">
                            <span class="experiment-chart-table-swatch" aria-hidden="true"></span>
                            <span>${parts.escapeHtml(String(year).slice(-2))}년 ${parts.escapeHtml(series?.rawLabel || series?.label || '')}</span>
                        </div>
                    </th>
                    ${cells}
                </tr>
            `;
        }).join('');
        return `
            <article class="util-sheet-analysis-table-card experiment-chart-table-card" data-tone="combined" data-exp-chart-table-card="${parts.escapeHtml(entry.seriesKey)}">
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-analysis-table experiment-chart-table">
                        <thead>
                            <tr>
                                <th class="experiment-chart-table-unit-head">
                                    <span class="experiment-chart-table-unit-label">
                                        <span class="experiment-chart-table-number">${parts.escapeHtml(tableNumber)}</span>
                                        <span>${parts.escapeHtml(unitHeaderLabel)}</span>
                                    </span>
                                </th>
                                ${monthHeaders}
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function getExperimentChartMemoFixedDecimals(metric = {}) {
        return Number.isInteger(metric.decimals) ? Math.max(0, Math.min(metric.decimals, 6)) : null;
    }

    function getExperimentChartMemoDisplayDecimals(value, metric = {}) {
        const fixedDecimals = getExperimentChartMemoFixedDecimals(metric);
        if (fixedDecimals !== null) return fixedDecimals;
        const number = Number(value);
        const absValue = Math.abs(Number.isFinite(number) ? number : 0);
        return metric.deltaMode === 'percentagePoint' || absValue < 100 ? 1 : 0;
    }

    function roundExperimentChartMemoDisplayValue(value, metric = {}) {
        const number = Number(value);
        if (!Number.isFinite(number)) return NaN;
        const scale = 10 ** getExperimentChartMemoDisplayDecimals(number, metric);
        const rounded = Math.sign(number) * (Math.round((Math.abs(number) + 1e-12) * scale) / scale);
        return Object.is(rounded, -0) ? 0 : rounded;
    }

    function formatExperimentChartMemoNumber(value, metric = {}, current = false) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '';
        const absValue = Math.abs(number);
        const fixedDecimals = getExperimentChartMemoFixedDecimals(metric);
        const displayValue = current
            ? roundExperimentChartMemoDisplayValue(number, metric)
            : roundExperimentChartMemoDisplayValue(absValue, metric);
        const maximumFractionDigits = getExperimentChartMemoDisplayDecimals(absValue, metric);
        return displayValue.toLocaleString('ko-KR', {
            maximumFractionDigits,
            minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0
        });
    }

    function formatExperimentChartMemoRate(rate) {
        const number = Number(rate);
        if (!Number.isFinite(number)) return '';
        return `${Math.abs(number * 100).toLocaleString('ko-KR', {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1
        })}%`;
    }

    function getExperimentChartMemoDirection(delta) {
        return delta > 0 ? 'up' : (delta < 0 ? 'down' : 'flat');
    }

    function isExperimentChartMemoDisplayedDeltaZero(delta, metric = {}) {
        const text = formatExperimentChartMemoNumber(delta, metric);
        if (!text) return false;
        const number = Number(String(text).replace(/,/g, '').trim());
        return Number.isFinite(number) && number === 0;
    }

    function getExperimentChartMemoDisplayDirection(delta, metric = {}) {
        const direction = getExperimentChartMemoDirection(delta);
        return direction !== 'flat' && isExperimentChartMemoDisplayedDeltaZero(delta, metric)
            ? 'flat'
            : direction;
    }

    function getExperimentChartMemoArrow(direction) {
        if (direction === 'up') return '↑';
        if (direction === 'down') return '↓';
        return '-';
    }

    function getExperimentChartMemoMetric(series = {}) {
        const unitLabel = String(series?.unitLabel || '').trim();
        const isPercentagePoint = unitLabel === '%' || unitLabel === '%p';
        return {
            label: String(series?.rawLabel || series?.label || '').trim(),
            currentUnit: isPercentagePoint ? '%' : unitLabel,
            deltaUnit: isPercentagePoint ? '%p' : unitLabel,
            deltaMode: isPercentagePoint ? 'percentagePoint' : '',
            decimals: Number.isFinite(series?.decimals) ? Math.max(0, Math.min(Number(series.decimals), 6)) : null
        };
    }

    function buildExperimentChartMemoDisplayPair(referenceValue, currentValue, metric = {}) {
        const reference = Number(referenceValue);
        const current = Number(currentValue);
        if (!Number.isFinite(reference) || !Number.isFinite(current)) return null;
        const displayReference = roundExperimentChartMemoDisplayValue(reference, metric);
        const displayCurrent = roundExperimentChartMemoDisplayValue(current, metric);
        if (!Number.isFinite(displayReference) || !Number.isFinite(displayCurrent)) return null;
        const displayDelta = displayCurrent - displayReference;
        const delta = Object.is(displayDelta, -0) ? 0 : displayDelta;
        const rate = displayReference === 0 ? NaN : delta / Math.abs(displayReference);
        return {
            reference,
            current,
            rawDelta: current - reference,
            rawRate: reference === 0 ? NaN : (current - reference) / Math.abs(reference),
            displayReference,
            displayCurrent,
            delta,
            rate
        };
    }

    function buildExperimentChartMemoComparisonSegment(metric, basisLabel, referenceValue, currentValue) {
        const pair = buildExperimentChartMemoDisplayPair(referenceValue, currentValue, metric);
        if (!pair) return null;
        const { reference, current, delta, rate } = pair;
        const direction = getExperimentChartMemoDisplayDirection(delta, metric);
        const arrow = getExperimentChartMemoArrow(direction);
        const deltaText = `${formatExperimentChartMemoNumber(delta, metric)}${metric.deltaUnit || ''}`;
        if (direction === 'flat') {
            return { ...pair, basis: basisLabel, direction, text: `${basisLabel} 동일` };
        }
        if (metric.deltaMode === 'percentagePoint') {
            return { ...pair, basis: basisLabel, direction, text: `${basisLabel} ${deltaText} ${arrow}` };
        }
        const rateText = Number.isFinite(rate) ? formatExperimentChartMemoRate(rate) : '-';
        return { ...pair, basis: basisLabel, direction, text: `${basisLabel} ${deltaText}, ${rateText} ${arrow}` };
    }

    function getExperimentChartTableValueForMonth(entry, monthKey, shell = null) {
        const point = entry.pointMap.get(monthKey);
        return getExperimentTablePointValue(point, entry.card, monthKey, shell);
    }

    function getExperimentChartTableCurrentEntry(entry, shell = null) {
        return (Array.isArray(entry.series?.points) ? entry.series.points : [])
            .map(point => {
                const monthKey = String(point?.monthKey || point?.key || '').trim();
                const value = /^\d{4}-\d{2}$/.test(monthKey)
                    ? getExperimentTablePointValue(point, entry.card, monthKey, shell)
                    : NaN;
                return { monthKey, value };
            })
            .filter(item => /^\d{4}-\d{2}$/.test(item.monthKey) && Number.isFinite(item.value))
            .sort((left, right) => left.monthKey.localeCompare(right.monthKey))
            .pop() || null;
    }

    function getExperimentChartMemoCombinedDirection(segments = []) {
        const directions = new Set((Array.isArray(segments) ? segments : [])
            .map(segment => segment?.direction)
            .filter(direction => direction === 'up' || direction === 'down'));
        if (directions.size > 1) return 'mixed';
        if (directions.has('up')) return 'up';
        if (directions.has('down')) return 'down';
        return 'flat';
    }

    function buildExperimentChartTableMemo(entry, shell = null) {
        const currentEntry = getExperimentChartTableCurrentEntry(entry, shell);
        if (!currentEntry) return null;
        const metric = getExperimentChartMemoMetric(entry.series);
        const previousYearValue = getExperimentChartTableValueForMonth(entry, parts.addMonths(currentEntry.monthKey, -12), shell);
        const previousMonthValue = getExperimentChartTableValueForMonth(entry, parts.addMonths(currentEntry.monthKey, -1), shell);
        const segments = [
            buildExperimentChartMemoComparisonSegment(metric, '전년대비', previousYearValue, currentEntry.value),
            buildExperimentChartMemoComparisonSegment(metric, '전월대비', previousMonthValue, currentEntry.value)
        ].filter(Boolean);
        if (!segments.length) return null;
        const currentText = `${formatExperimentChartMemoNumber(currentEntry.value, metric, true)}${metric.currentUnit || ''}`;
        return {
            direction: getExperimentChartMemoCombinedDirection(segments),
            label: metric.label,
            currentText,
            segments,
            text: `${metric.label}${currentText ? ` ${currentText}` : ''} ${segments.map(segment => segment.text).join(', ')}`
        };
    }

    function buildExperimentChartTableMemoLineHtml(entry, shell = null, index = 0) {
        const memo = buildExperimentChartTableMemo(entry, shell);
        const direction = memo?.direction || 'flat';
        const segments = Array.isArray(memo?.segments) ? memo.segments : [];
        const bodyHtml = memo
            ? `
                <span class="experiment-chart-table-memo-main">${parts.escapeHtml(memo.label)}${memo.currentText ? ` ${parts.escapeHtml(memo.currentText)}` : ''}</span>
                ${segments.map((segment, segmentIndex) => `
                    <span class="experiment-chart-table-memo-segment is-${parts.escapeHtml(segment.direction || 'flat')}">${parts.escapeHtml(segment.text)}${segmentIndex < segments.length - 1 ? ',' : ''}</span>
                `).join('')}
            `
            : '<span class="experiment-chart-table-memo-empty-text">표시할 특이사항 데이터가 없습니다.</span>';
        return `
            <div class="experiment-chart-table-memo-line is-${parts.escapeHtml(direction)}" data-exp-chart-table-memo="${parts.escapeHtml(entry.seriesKey)}" data-exp-chart-table-memo-text="${parts.escapeHtml(`${index + 1} ${memo?.text || '표시할 특이사항 데이터가 없습니다.'}`)}">
                <span class="experiment-chart-table-memo-index">${parts.escapeHtml(index + 1)}</span>
                <span class="experiment-chart-table-memo-text">${bodyHtml}</span>
                <button type="button" class="experiment-chart-table-memo-copy" data-exp-chart-table-memo-copy aria-label="${parts.escapeHtml(`${index + 1}번 특이사항 복사`)}" title="이 항목 복사" onclick="KpiExperimentGraphPrototype.copyTableMemo(this)">복사</button>
            </div>
        `;
    }

    function buildExperimentChartTableMemoBoardHtml(entries = [], shell = null) {
        return `
            <section class="experiment-chart-table-memo-board" data-exp-chart-table-memo-board aria-label="특이사항">
                <strong>
                    <span>특이사항</span>
                </strong>
                <div class="experiment-chart-table-memo-list">
                    ${(Array.isArray(entries) ? entries : []).map((entry, index) => buildExperimentChartTableMemoLineHtml(entry, shell, index)).join('')}
                </div>
            </section>
        `;
    }

    function buildExperimentChartTableHtml(seriesList = [], cards = [], shell = null) {
        const entries = buildExperimentChartTableEntries(seriesList, cards);
        if (!entries.length) {
            return '<div class="util-sheet-empty experiment-chart-table-empty">표시할 표 데이터가 없습니다.</div>';
        }
        const tableCount = Math.max(1, entries.length);
        return `
            <div class="experiment-chart-table-set" data-exp-chart-table-set data-exp-table-count="${tableCount}" style="--exp-table-count:${tableCount};">
                <div class="experiment-chart-table-grid">
                    ${entries.map((entry, index) => buildExperimentChartSingleTableHtml(entry, shell, index)).join('')}
                </div>
                ${buildExperimentChartTableMemoBoardHtml(entries, shell)}
            </div>
        `;
    }

    function formatSeriesLabelWithUnit(title = '', unitLabel = '') {
        const safeTitle = String(title || '').trim();
        const safeUnit = String(unitLabel || '').trim();
        return safeUnit ? `${safeTitle} (${safeUnit})` : safeTitle;
    }

    function buildExperimentChartRangeLabel(period) {
        if (period?.yearOverlap === true) {
            return '';
        }
        return '';
    }

    function getExperimentEnergyConversionCards(cards = []) {
        const energyCards = new Map();
        const visited = new Set();
        function visit(card) {
            if (!card || visited.has(card.key)) return;
            visited.add(card.key);
            if (String(card.energyScopeKey || '').trim()) {
                energyCards.set(card.energyScopeKey, card);
            }
            for (const key of [card.numeratorKey, card.denominatorKey]) {
                if (key) visit(parts.findAnalysisCard(key));
            }
        }
        cards.forEach(visit);
        return Array.from(energyCards.values());
    }

    function formatEnergyConversionValue(value, decimals = 3) {
        return Number.isFinite(value)
            ? value.toLocaleString('ko-KR', { maximumFractionDigits: decimals })
            : '미입력';
    }

    function buildEnergyConversionComponentHtml(component) {
        if (component?.applicable === false) {
            return '<span class="experiment-energy-conversion-empty">미사용 · 합산 제외</span>';
        }
        if (!Number.isFinite(component?.amount) || !Number.isFinite(component?.kcal)) {
            return '<span class="experiment-energy-conversion-empty">미입력</span>';
        }
        const amount = parts.escapeHtml(formatEnergyConversionValue(component.amount));
        const factor = parts.escapeHtml(formatEnergyConversionValue(component.factor, 6));
        const kcal = parts.escapeHtml(formatEnergyConversionValue(component.kcal, 2));
        const unit = parts.escapeHtml(component.unit || '');
        return `<span>${amount} ${unit} × ${factor}</span><strong>= ${kcal} kcal</strong>`;
    }

    function buildExperimentEnergyConversionHtml(selectedCards = [], period = {}) {
        const energyCards = getExperimentEnergyConversionCards(selectedCards);
        if (!energyCards.length || typeof parts.getEnergyConversionBreakdown !== 'function') return '';
        const factors = parts.getEnergyConversionFactors();
        const monthKeys = Array.isArray(period.monthKeys) ? period.monthKeys : [];
        const factorText = [
            ['전기', factors.electric, 'kWh'],
            ['LNG', factors.lng, 'Nm³'],
            ['LPG', factors.lpg, 'kg']
        ].map(([label, factor, unit]) => `${label} ${formatEnergyConversionValue(factor, 6)} kcal/${unit}`).join(' · ');
        const sections = energyCards.map(card => {
            const rows = monthKeys.map(monthKey => {
                const breakdown = parts.getEnergyConversionBreakdown(card, monthKey);
                const components = new Map((breakdown?.components || []).map(component => [component.key, component]));
                const total = breakdown?.complete === true && Number.isFinite(breakdown.totalKcal)
                    ? `${formatEnergyConversionValue(breakdown.totalKcal, 2)} kcal`
                    : '미입력';
                return `
                    <tr>
                        <th scope="row">${parts.escapeHtml(monthKey)}</th>
                        ${['electric', 'lng', 'lpg'].map(key => `<td>${buildEnergyConversionComponentHtml(components.get(key))}</td>`).join('')}
                        <td class="experiment-energy-conversion-total">${parts.escapeHtml(total)}</td>
                    </tr>
                `;
            }).join('');
            return `
                <div class="experiment-energy-conversion-scope">
                    <table class="experiment-energy-conversion-table">
                        <caption>${parts.escapeHtml(card.title || '열량 환산')}</caption>
                        <thead><tr><th scope="col">월</th><th scope="col">전기</th><th scope="col">LNG</th><th scope="col">LPG</th><th scope="col">합계 열량</th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="5">선택한 기간에 해당하는 월이 없습니다.</td></tr>'}</tbody>
                    </table>
                </div>
            `;
        }).join('');
        return `
            <details class="experiment-energy-conversion" data-exp-energy-conversion>
                <summary>변환 과정 <span class="experiment-energy-conversion-help" aria-hidden="true">?</span></summary>
                <div class="experiment-energy-conversion-content">
                    <p>월별 합계 열량 = 전기 사용량 × 전기 환산계수 + LNG 사용량 × LNG 환산계수 + LPG 사용량 × LPG 환산계수</p>
                    <p>${parts.escapeHtml(factorText)}</p>
                    <p>최종에너지 기준 · 1 kcal = ${parts.escapeHtml(formatEnergyConversionValue(factors.kjPerKcal, 4))} kJ. 미입력 항목이 있으면 합계를 계산하지 않으며, 미사용 항목은 합산에서 제외합니다.</p>
                    ${sections}
                </div>
            </details>
        `;
    }

    function buildCardSeries(card, period, shell, seriesIndex = 0) {
        const monthKeys = Array.isArray(period?.monthKeys)
            ? period.monthKeys
            : parts.buildMonthKeys(parts.DEFAULT_PERIOD_START, parts.DEFAULT_PERIOD_END);
        const monthLabels = Array.isArray(period?.monthLabels)
            ? period.monthLabels
            : monthKeys.map(monthKey => parts.formatPointLabel(monthKey));
        const displayMode = parts.getCardDisplayMode(shell, card);
        const decimals = parts.getCardDecimalDigits(shell, card);
        const unitKey = parts.getCardUnitKey(shell, card);
        const unitLabel = parts.getCardUnitLabel(shell, card);
        const unitOptions = parts.getCardUnitOptions(card);
        return {
            label: formatSeriesLabelWithUnit(card.title, unitLabel),
            rawLabel: card.title,
            color: parts.resolveExperimentSeriesColor(card, seriesIndex),
            type: displayMode,
            lineWidth: 3.2,
            lineDash: isDerivedRatioCard(card) ? '7 5' : '',
            seriesKey: card.key,
            decimals,
            unitKey,
            unitLabel,
            unitOptions,
            points: monthKeys.map((monthKey, index) => ({
                key: monthKey,
                monthKey,
                label: monthLabels[index] || monthKey,
                value: parts.resolvePeriodValue(card, monthKey, shell)
            }))
        };
    }

    function buildYearOverlapSeries(card, period, shell, seriesIndex = 0) {
        const plan = period?.overlapPlan || {};
        const years = Array.isArray(plan.years) ? plan.years : [];
        const months = Array.isArray(plan.months) ? plan.months : [];
        if (!years.length || !months.length) return [buildCardSeries(card, period, shell, seriesIndex)];
        const monthLabels = Array.isArray(plan.monthLabels) && plan.monthLabels.length
            ? plan.monthLabels
            : months.map(month => parts.formatPointLabel(`${years[0]}-${month}`));
        const activeMonthKeys = new Set(Array.isArray(period?.monthKeys) ? period.monthKeys : []);
        const colorYears = Array.isArray(plan.availableYears) && plan.availableYears.length ? plan.availableYears : years;
        const displayMode = parts.getCardDisplayMode(shell, card);
        const decimals = parts.getCardDecimalDigits(shell, card);
        const unitKey = parts.getCardUnitKey(shell, card);
        const unitLabel = parts.getCardUnitLabel(shell, card);
        const unitOptions = parts.getCardUnitOptions(card);
        return years.map(year => {
            const yearColorIndex = Math.max(0, colorYears.indexOf(year));
            return {
                label: String(year),
                rawLabel: String(year),
                color: parts.resolveExperimentSeriesColor(card, seriesIndex, yearColorIndex, colorYears.length || parts.YEAR_OVERLAP_COLORS.length),
                type: displayMode,
                lineWidth: 3.2,
                lineDash: isDerivedRatioCard(card) ? '7 5' : '',
                seriesKey: card.key,
                axisGroupKey: card.key,
                decimals,
                unitKey,
                unitLabel,
                unitOptions,
                points: months.map((month, index) => {
                    const monthKey = `${year}-${month}`;
                    return {
                        key: `${card.key}:${monthKey}`,
                        monthKey,
                        label: monthLabels[index] || parts.formatPointLabel(monthKey),
                        value: activeMonthKeys.has(monthKey) ? parts.resolvePeriodValue(card, monthKey, shell) : NaN
                    };
                })
            };
        });
    }

    function buildCardSeriesList(card, period, shell, seriesIndex = 0) {
        return period?.yearOverlap === true
            ? buildYearOverlapSeries(card, period, shell, seriesIndex)
            : [buildCardSeries(card, period, shell, seriesIndex)];
    }

    function hasExperimentCardValueForMonth(card, monthKey = '', shell = null) {
        return Number.isFinite(parts.resolvePeriodValue(card, monthKey, shell));
    }

    function filterExperimentPeriodByAvailableValues(cards = [], period = {}, shell = null) {
        const sourceMonthKeys = Array.isArray(period?.monthKeys) && period.monthKeys.length
            ? period.monthKeys
            : parts.buildMonthKeys(parts.DEFAULT_PERIOD_START, parts.DEFAULT_PERIOD_END);
        const activeCards = (Array.isArray(cards) ? cards : []).filter(Boolean);
        if (!sourceMonthKeys.length || !activeCards.length) return period;
        const filteredMonthKeys = sourceMonthKeys.filter(monthKey => (
            activeCards.some(card => hasExperimentCardValueForMonth(card, monthKey, shell))
        ));
        if (filteredMonthKeys.length === sourceMonthKeys.length) return period;
        if (!filteredMonthKeys.length) {
            return {
                ...period,
                startMonth: '',
                endMonth: '',
                label: '',
                monthKeys: [],
                monthLabels: [],
                yearOverlap: false,
                overlapPlan: parts.buildYearOverlapPlan([])
            };
        }
        const hasYearBoundary = filteredMonthKeys.some(monthKey => monthKey.slice(0, 4) !== filteredMonthKeys[0]?.slice(0, 4));
        const overlapPlan = parts.buildYearOverlapPlan(filteredMonthKeys);
        const availableOverlapYears = parts.normalizeOverlapYearList(overlapPlan.years);
        const selectedOverlapYears = Array.isArray(period?.overlapPlan?.selectedYears) && period.overlapPlan.selectedYears.length
            ? period.overlapPlan.selectedYears.filter(year => availableOverlapYears.includes(year))
            : availableOverlapYears;
        const yearOverlap = period?.yearOverlap === true && availableOverlapYears.length > 1 && selectedOverlapYears.length > 0;
        return {
            ...period,
            startMonth: filteredMonthKeys[0],
            endMonth: filteredMonthKeys[filteredMonthKeys.length - 1],
            label: `${parts.formatRangeMonth(filteredMonthKeys[0])} - ${parts.formatRangeMonth(filteredMonthKeys[filteredMonthKeys.length - 1])}`,
            monthKeys: filteredMonthKeys,
            monthLabels: filteredMonthKeys.map(monthKey => parts.formatPointLabel(monthKey, hasYearBoundary)),
            yearOverlap,
            overlapPlan: {
                ...overlapPlan,
                availableYears: availableOverlapYears,
                selectedYears: selectedOverlapYears,
                years: yearOverlap ? selectedOverlapYears : availableOverlapYears
            }
        };
    }

    function buildAnalysisChartModel(selectedCards, period, shell) {
        const valuePeriod = filterExperimentPeriodByAvailableValues(selectedCards, period, shell);
        const summarySeries = selectedCards.map((card, index) => buildCardSeries(card, {
            ...valuePeriod,
            yearOverlap: false
        }, shell, index));
        const allSeries = selectedCards.flatMap((card, index) => buildCardSeriesList(card, valuePeriod, shell, index));
        const visibleSeries = allSeries.filter(item => item.type !== 'none');
        const maxDecimals = [...allSeries, ...summarySeries].reduce((maxValue, item) => Math.max(maxValue, Number.isFinite(item.decimals) ? item.decimals : 1), 1);
        const selectedCardMap = new Map(selectedCards.map(card => [String(card?.key || ''), card]));
        const viewMode = parts.getExperimentChartViewMode(shell);
        return {
            chart: {
                key: parts.EXPERIMENT_CHART_KEY,
                title: '그래프',
                icon: 'fa-chart-line',
                tone: 'combined',
                color: '#1d4ed8',
                decimals: maxDecimals,
                series: visibleSeries,
                chartDataList: visibleSeries.map(item => ({ seriesKey: item.seriesKey, points: item.points })),
                showViewToggle: false,
                viewMode,
                headerToolsHtml: buildExperimentEnergyConversionHtml(selectedCards, period),
                tableHtml: buildExperimentChartTableHtml(summarySeries, selectedCards, shell),
                suppressChartLabelToggle: true,
                controlItems: summarySeries.map(item => ({
                    key: item.seriesKey,
                    title: item.rawLabel || item.label,
                    metricLabel: item.unitLabel,
                    color: item.color,
                    decimals: item.decimals,
                    unitKey: item.unitKey,
                    unitLabel: item.unitLabel,
                    unitOptions: item.unitOptions,
                    displayMode: item.type,
                    isDerivedRatio: isDerivedRatioCard(selectedCardMap.get(item.seriesKey)),
                    points: item.points
                })),
                summaryItems: viewMode === 'table'
                    ? []
                    : selectedCards.map((card, index) => buildSummaryItem(card, summarySeries[index], index)),
                reportValueOrderLabels: period?.yearOverlap === true,
                hideRangeMeta: true,
                hideHeadingText: true,
                hideTopCenterTitle: true,
                hidePeriodLabel: true,
                hideLegend: false,
                dedupeLegend: period?.yearOverlap === true
            },
            model: {
                datasetKey: 'gas',
                rangeLabel: buildExperimentChartRangeLabel(period)
            }
        };
    }


    Object.assign(parts, {
        isDerivedRatioCard,
        buildAnalysisChartModel,
    });
})(this);
