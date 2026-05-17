(function registerUtilReportSheetWasteMeterModel() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/waste/meter-model.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetWasteMeterModel')) {
        return;
    }

    const runtime = {
        escapeUtilSheetHtml: null,
        buildUtilSheetMonthBounds: null,
        buildUtilReportMonthlyRows: null,
        shiftUtilSheetMonthKey: null,
        compareUtilSheetMonthKeys: null,
        normalizeUtilSheetCompareKey: null,
        getUtilSheetCompareLabel: null,
        renderUtilIndependentBoundsMultiSeriesChart: null,
        formatUtilReportMonthLong: null,
        formatUtilReportMonthShort: null
    };

    const WASTE_METER_SITE_SPECS = Object.freeze([
        Object.freeze({
            key: 'bukjeong',
            label: '북정',
            wasteTeam: '북정',
            productionTeam: '북정',
            productionDateLabel: '북정',
            color: '#be185d'
        }),
        Object.freeze({
            key: 'yusan',
            label: '유산',
            wasteTeam: '유산',
            productionTeam: '유산',
            productionDateLabel: '유산',
            color: '#7c3aed'
        })
    ]);
    const WASTE_METER_SITE_OPTIONS = Object.freeze([
        Object.freeze({ key: 'all', label: '합계' }),
        ...WASTE_METER_SITE_SPECS.map(siteSpec => Object.freeze({
            key: siteSpec.key,
            label: siteSpec.label
        }))
    ]);
    const WASTE_METER_AGGREGATE_SITE_SPEC = Object.freeze({
        key: 'all',
        label: '합계',
        productionDateLabel: '유산 · 북정',
        color: '#0f766e'
    });

    const WASTE_METER_ROWS = Object.freeze([
        Object.freeze({ group: '폐수', label: '생산량 (kg)', key: 'production', type: 'quantity', unit: 'kg' }),
        Object.freeze({ group: '', label: '방류량 (㎥)', key: 'wasteUsage', type: 'quantity', unit: '㎥' }),
        Object.freeze({ group: '처리 비용 (원)', label: '1. 상수', detailKey: 'water', type: 'cost' }),
        Object.freeze({ group: '', label: '2. 폐수', detailKey: 'share', type: 'cost' }),
        Object.freeze({ group: '', label: '3. 폐수오니', detailKey: 'sludge', type: 'cost' }),
        Object.freeze({ group: '', label: '4. 폐합성수지', detailKey: 'resin', type: 'cost' }),
        Object.freeze({ group: '', label: '5. 인건비', detailKey: 'labor', type: 'cost' })
    ]);

    const numberFormatter = new Intl.NumberFormat('ko-KR');

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function escapeHtml(value) {
        if (typeof runtime.escapeUtilSheetHtml === 'function') {
            return runtime.escapeUtilSheetHtml(value);
        }
        return String(value ?? '');
    }

    function finite(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function formatNumber(value, fallback = '') {
        const number = finite(value);
        if (!Number.isFinite(number)) return fallback;
        return numberFormatter.format(Math.round(number));
    }

    function formatQuantity(value, unit = '') {
        const text = formatNumber(value, '');
        return text ? `${text}${unit}` : '';
    }

    function formatCost(value) {
        const text = formatNumber(value, '');
        return text ? `${text}원` : '';
    }

    function formatSignedNumber(value, unit = '') {
        const number = finite(value);
        if (!Number.isFinite(number)) return '';
        const sign = number > 0 ? '+' : '';
        return `${sign}${numberFormatter.format(Math.round(number))}${unit}`;
    }

    function formatSignedCost(value) {
        const number = finite(value);
        if (!Number.isFinite(number)) return '';
        const sign = number > 0 ? '+' : '';
        return `${sign}${numberFormatter.format(Math.round(number))}원`;
    }

    function formatPercent(current, reference) {
        const currentValue = finite(current);
        const referenceValue = finite(reference);
        if (!Number.isFinite(currentValue) || !Number.isFinite(referenceValue) || referenceValue === 0) return '';
        const percent = ((currentValue - referenceValue) / referenceValue) * 100;
        const sign = percent > 0 ? '+' : '';
        return `${sign}${percent.toFixed(1)}%`;
    }

    function getDeltaClass(value) {
        const number = finite(value);
        if (!Number.isFinite(number) || number === 0) return 'is-delta-flat';
        return number > 0 ? 'is-delta-up' : 'is-delta-down';
    }

    function shiftMonthKey(monthKey = '', offset = 0) {
        return typeof runtime.shiftUtilSheetMonthKey === 'function'
            ? runtime.shiftUtilSheetMonthKey(monthKey, offset)
            : String(monthKey || '').trim();
    }

    function compareMonthKeys(left = '', right = '') {
        return typeof runtime.compareUtilSheetMonthKeys === 'function'
            ? runtime.compareUtilSheetMonthKeys(left, right)
            : String(left || '').localeCompare(String(right || ''), 'ko');
    }

    function normalizeCompareKey(compareKey = 'month') {
        return typeof runtime.normalizeUtilSheetCompareKey === 'function'
            ? runtime.normalizeUtilSheetCompareKey(compareKey)
            : (String(compareKey || '').trim() === 'year' ? 'year' : 'month');
    }

    function getCompareLabel(compareKey = 'month') {
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        return typeof runtime.getUtilSheetCompareLabel === 'function'
            ? runtime.getUtilSheetCompareLabel(normalizedCompareKey)
            : (normalizedCompareKey === 'year' ? '전년대비' : '전월대비');
    }

    function formatMonthLong(monthKey = '') {
        return typeof runtime.formatUtilReportMonthLong === 'function'
            ? runtime.formatUtilReportMonthLong(monthKey)
            : String(monthKey || '');
    }

    function buildMonthBounds() {
        return typeof runtime.buildUtilSheetMonthBounds === 'function'
            ? runtime.buildUtilSheetMonthBounds('waste')
            : null;
    }

    function normalizeWasteMeterSiteKey(siteKey = 'all') {
        const normalizedKey = String(siteKey || '').trim();
        return WASTE_METER_SITE_OPTIONS.some(option => option.key === normalizedKey)
            ? normalizedKey
            : 'all';
    }

    function getWasteMeterSiteOption(siteKey = 'all') {
        const normalizedKey = normalizeWasteMeterSiteKey(siteKey);
        return WASTE_METER_SITE_OPTIONS.find(option => option.key === normalizedKey)
            || WASTE_METER_SITE_OPTIONS[0];
    }

    function buildSiteRows(bounds, siteSpec) {
        if (!bounds || typeof runtime.buildUtilReportMonthlyRows !== 'function') return [];
        const result = runtime.buildUtilReportMonthlyRows({
            from: bounds.from,
            to: bounds.to,
            electricTeam: 'all',
            gasTeam: 'all',
            wasteTeam: siteSpec.wasteTeam,
            productionTeam: siteSpec.productionTeam,
            categoryKey: 'cost',
            selectedScopeKeys: ['waste'],
            wasteCostModeKey: 'total'
        });
        return Array.isArray(result?.rows) ? result.rows : [];
    }

    function hasWasteData(row = {}) {
        return [row?.wasteUsage, row?.wasteCost, row?.production]
            .some(value => Number.isFinite(Number(value)) && Number(value) > 0);
    }

    function sumFiniteValues(rows = [], selector) {
        let hasValue = false;
        const total = (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
            const value = finite(typeof selector === 'function' ? selector(row) : null);
            if (!Number.isFinite(value)) return sum;
            hasValue = true;
            return sum + value;
        }, 0);
        return hasValue ? total : null;
    }

    function mergeWasteRowsForMonth(monthKey = '', rows = []) {
        const sourceRows = (Array.isArray(rows) ? rows : []).filter(Boolean);
        const firstRow = sourceRows[0] || {};
        const normalizedMonthKey = String(monthKey || firstRow?.monthKey || '').trim();
        const monthMatch = /^(\d{4})-(\d{2})$/.exec(normalizedMonthKey);
        const production = sumFiniteValues(sourceRows, row => row?.production);
        const wasteUsage = sumFiniteValues(sourceRows, row => row?.wasteUsage);
        const wasteCost = sumFiniteValues(sourceRows, row => row?.wasteCost);
        const detailKeys = new Set();
        sourceRows.forEach(row => {
            Object.keys(row?.wasteCostDetails || {}).forEach(key => detailKeys.add(key));
        });
        const wasteCostDetails = {};
        Array.from(detailKeys).forEach(key => {
            const total = sumFiniteValues(sourceRows, row => row?.wasteCostDetails?.[key]);
            if (Number.isFinite(total)) wasteCostDetails[key] = total;
        });

        return {
            monthKey: normalizedMonthKey,
            year: Number.isFinite(Number(firstRow?.year)) ? Number(firstRow.year) : Number(monthMatch?.[1]),
            month: Number.isFinite(Number(firstRow?.month)) ? Number(firstRow.month) : Number(monthMatch?.[2]),
            production,
            wasteUsage,
            wasteCost,
            wasteUnit: Number.isFinite(wasteCost) && Number.isFinite(production) && production > 0
                ? wasteCost / production
                : null,
            wasteCostDetails
        };
    }

    function buildAggregateRows(siteModels = []) {
        const rowsByMonth = new Map();
        (Array.isArray(siteModels) ? siteModels : []).forEach(model => {
            (Array.isArray(model?.rows) ? model.rows : []).forEach(row => {
                const monthKey = String(row?.monthKey || '').trim();
                if (!monthKey) return;
                if (!rowsByMonth.has(monthKey)) rowsByMonth.set(monthKey, []);
                rowsByMonth.get(monthKey).push(row);
            });
        });
        return Array.from(rowsByMonth.entries())
            .sort(([leftKey], [rightKey]) => compareMonthKeys(leftKey, rightKey))
            .map(([monthKey, rows]) => mergeWasteRowsForMonth(monthKey, rows));
    }

    function buildSiteResult(siteSpec = {}, rows = [], activeMonthKey = '', referenceMonthKey = '') {
        const rowMap = new Map((Array.isArray(rows) ? rows : []).map(row => [String(row?.monthKey || '').trim(), row]));
        return {
            ...siteSpec,
            rows,
            currentRow: rowMap.get(activeMonthKey) || null,
            referenceRow: rowMap.get(referenceMonthKey) || null,
            chartSeries: buildYearSeries(rows, activeMonthKey, siteSpec)
        };
    }

    function getMetricValue(row = {}, metric = {}) {
        if (!row) return null;
        if (metric.detailKey) {
            if (metric.detailKey === 'labor') {
                const laborValue = finite(row?.wasteCostDetails?.labor);
                const legacyOutsourcingValue = finite(row?.wasteCostDetails?.outsourcing);
                if (Number.isFinite(laborValue) || Number.isFinite(legacyOutsourcingValue)) {
                    return (Number.isFinite(laborValue) ? laborValue : 0)
                        + (Number.isFinite(legacyOutsourcingValue) ? legacyOutsourcingValue : 0);
                }
            }
            return finite(row?.wasteCostDetails?.[metric.detailKey]);
        }
        return finite(row?.[metric.key]);
    }

    function calculateIntensity(row = {}) {
        const usage = finite(row?.wasteUsage);
        const production = finite(row?.production);
        if (!Number.isFinite(usage) || !Number.isFinite(production) || production <= 0) return null;
        return usage / (production / 1000);
    }

    function buildYearSeries(rows = [], activeMonthKey = '', siteSpec = {}) {
        const activeMatch = /^(\d{4})-(\d{2})$/.exec(String(activeMonthKey || '').trim());
        if (!activeMatch) return [];
        const activeYear = Number(activeMatch[1]);
        const previousYear = activeYear - 1;
        const rowMap = new Map(rows.map(row => [String(row?.monthKey || '').trim(), row]));
        const monthNumbers = Array.from({ length: 12 }, (_, index) => index + 1);
        return [
            { year: previousYear, label: `${String(previousYear).slice(2)}년`, color: '#2563eb' },
            { year: activeYear, label: `${String(activeYear).slice(2)}년`, color: siteSpec.color || '#7c3aed' }
        ].map(seriesMeta => ({
            label: seriesMeta.label,
            color: seriesMeta.color,
            type: 'line',
            lineWidth: 3,
            decimals: 3,
            seriesKey: `${siteSpec.key}-${seriesMeta.year}`,
            points: monthNumbers.map(month => {
                const monthKey = `${seriesMeta.year}-${String(month).padStart(2, '0')}`;
                return {
                    key: monthKey,
                    monthKey,
                    label: `${month}월`,
                    value: calculateIntensity(rowMap.get(monthKey) || {})
                };
            })
        }));
    }

    function buildUtilWasteMeterModel(selectedMonthKey = '', siteKey = 'all', compareKey = 'month') {
        const bounds = buildMonthBounds();
        const siteOption = getWasteMeterSiteOption(siteKey);
        const normalizedCompareKey = normalizeCompareKey(compareKey);
        if (!bounds) {
            return {
                hasData: false,
                monthKey: '',
                compareKey: normalizedCompareKey,
                compareLabel: getCompareLabel(normalizedCompareKey),
                siteOption,
                sites: []
            };
        }

        const selectedSiteSpecs = siteOption.key === 'all'
            ? WASTE_METER_SITE_SPECS
            : WASTE_METER_SITE_SPECS.filter(siteSpec => siteSpec.key === siteOption.key);
        const siteModels = selectedSiteSpecs.map(siteSpec => {
            const rows = buildSiteRows(bounds, siteSpec);
            return { siteSpec, rows };
        });
        const availableMonthKeys = Array.from(new Set(siteModels
            .flatMap(model => model.rows)
            .filter(hasWasteData)
            .map(row => String(row?.monthKey || '').trim())
            .filter(Boolean))).sort(compareMonthKeys);
        const activeMonthKey = availableMonthKeys.includes(selectedMonthKey)
            ? selectedMonthKey
            : (availableMonthKeys[availableMonthKeys.length - 1] || selectedMonthKey || bounds.to);
        const referenceMonthKey = shiftMonthKey(activeMonthKey, normalizedCompareKey === 'year' ? -12 : -1);

        return {
            hasData: Boolean(activeMonthKey),
            monthKey: activeMonthKey,
            monthLabel: formatMonthLong(activeMonthKey),
            compareKey: normalizedCompareKey,
            compareLabel: getCompareLabel(normalizedCompareKey),
            referenceMonthKey,
            previousYearKey: referenceMonthKey,
            siteOption,
            sites: siteOption.key === 'all'
                ? [buildSiteResult(WASTE_METER_AGGREGATE_SITE_SPEC, buildAggregateRows(siteModels), activeMonthKey, referenceMonthKey)]
                : siteModels.map(model => buildSiteResult(model.siteSpec, model.rows, activeMonthKey, referenceMonthKey))
        };
    }

    function formatMetricValue(value, metric) {
        if (metric.type === 'cost') return formatCost(value);
        return formatQuantity(value, metric.unit || '');
    }

    function formatMetricDelta(value, metric) {
        if (metric.type === 'cost') return formatSignedCost(value);
        return formatSignedNumber(value, metric.unit || '');
    }

    function buildWasteMeterRowsHtml(site = {}) {
        const currentRow = site.currentRow || {};
        const referenceRow = site.referenceRow || {};
        const rowsHtml = WASTE_METER_ROWS.map(metric => {
            const currentValue = getMetricValue(currentRow, metric);
            const referenceValue = getMetricValue(referenceRow, metric);
            const delta = Number.isFinite(currentValue) && Number.isFinite(referenceValue)
                ? currentValue - referenceValue
                : null;
            const deltaClass = getDeltaClass(delta);
            return `
                <tr>
                    <th class="is-group">${escapeHtml(metric.group || '')}</th>
                    <th>${escapeHtml(metric.label)}</th>
                    <td>${escapeHtml(formatMetricValue(referenceValue, metric))}</td>
                    <td>${escapeHtml(formatMetricValue(currentValue, metric))}</td>
                    <td class="${escapeHtml(deltaClass)}">${escapeHtml(formatMetricDelta(delta, metric))}</td>
                    <td class="${escapeHtml(deltaClass)}">${escapeHtml(formatPercent(currentValue, referenceValue))}</td>
                    <td></td>
                </tr>
            `;
        }).join('');
        const currentTotal = finite(currentRow?.wasteCost);
        const referenceTotal = finite(referenceRow?.wasteCost);
        const totalDelta = Number.isFinite(currentTotal) && Number.isFinite(referenceTotal)
            ? currentTotal - referenceTotal
            : null;
        return `
            ${rowsHtml}
            <tr class="is-total">
                <th colspan="2">총 계</th>
                <td>${escapeHtml(formatCost(referenceTotal))}</td>
                <td>${escapeHtml(formatCost(currentTotal))}</td>
                <td class="${escapeHtml(getDeltaClass(totalDelta))}">${escapeHtml(formatSignedCost(totalDelta))}</td>
                <td class="${escapeHtml(getDeltaClass(totalDelta))}">${escapeHtml(formatPercent(currentTotal, referenceTotal))}</td>
                <td></td>
            </tr>
        `;
    }

    function renderWasteChart(site = {}, options = {}) {
        if (typeof runtime.renderUtilIndependentBoundsMultiSeriesChart !== 'function') {
            return '<div class="util-sheet-empty">그래프 렌더러를 찾지 못했습니다.</div>';
        }
        return runtime.renderUtilIndependentBoundsMultiSeriesChart(site.chartSeries || [], {
            mode: 'modal',
            chartTitle: `${site.label} 폐수 (㎥) / 톤`,
            periodLabel: '전년 동일 월 기준',
            inlinePeriodLegend: true,
            decimals: 3,
            showLabelToggle: true,
            labelToggleRole: 'util-sheet-waste-meter-label-toggle',
            labelToggleText: '레이블',
            showLabels: options.showLabels === true,
            hideUnit: true,
            topCenterTitle: `${site.label} 폐수 (㎥) / 톤`,
            axisXLabel: '월',
            showYearBands: false,
            maxXAxisLabels: 12,
            forceWidth: 1600,
            scrollWithinCanvas: true,
            height: 360
        });
    }

    function buildUtilWasteMeterSiteHtml(site = {}, index = 0, options = {}) {
        const currentYear = String(site.monthKey || site.currentRow?.monthKey || '').slice(2, 4);
        const currentMonth = String(site.monthKey || site.currentRow?.monthKey || '').slice(5, 7);
        const referenceYear = String(site.referenceRow?.monthKey || '').slice(2, 4);
        const referenceMonth = String(site.referenceRow?.monthKey || '').slice(5, 7) || currentMonth;
        return `
            <article class="util-sheet-waste-meter-card">
                <div class="util-sheet-meter-table-card is-waste">
                    <div class="util-sheet-meter-table-head">
                        <div class="util-sheet-meter-table-title-wrap">
                            <span class="util-sheet-meter-table-badge" aria-hidden="true"><i class="fa-solid fa-table-cells-large"></i></span>
                            <div>
                                <div class="util-sheet-meter-table-title">${escapeHtml(site.label)} 폐수 검침표</div>
                                <div class="util-sheet-meter-table-sub">유틸리티 기입 폐수 데이터를 기준으로 가능한 값만 채웁니다.</div>
                            </div>
                        </div>
                    </div>
                    <div class="util-sheet-table-wrap">
                        <table class="util-sheet-table util-sheet-meter-table util-sheet-waste-meter-table">
                            <thead>
                                <tr>
                                    <th colspan="2">생산 일자 ${escapeHtml(site.productionDateLabel || '')}</th>
                                    <th>${escapeHtml(referenceYear && referenceMonth ? `${referenceYear}.${referenceMonth}` : '')}</th>
                                    <th>${escapeHtml(currentYear && currentMonth ? `${currentYear}.${currentMonth}` : '')}</th>
                                    <th>증감</th>
                                    <th>증감(%)</th>
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${buildWasteMeterRowsHtml(site)}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="util-sheet-meter-table-card is-waste-chart">
                    <div class="util-sheet-meter-table-head">
                        <div class="util-sheet-meter-table-title-wrap">
                            <span class="util-sheet-meter-table-badge" aria-hidden="true"><i class="fa-solid fa-chart-line"></i></span>
                            <div>
                                <div class="util-sheet-meter-table-title">${escapeHtml(site.label)} 폐수 원단위</div>
                                <div class="util-sheet-meter-table-sub">방류량을 생산량 톤 기준으로 환산한 추이입니다.</div>
                            </div>
                        </div>
                    </div>
                    <div class="util-report-chart-shell util-sheet-analysis-chart-frame theme-total" style="--util-chart-accent:${escapeHtml(site.color || '#7c3aed')};--util-chart-bar:${escapeHtml(site.color || '#7c3aed')};">
                        ${renderWasteChart(site, options)}
                    </div>
                </div>
            </article>
        `;
    }

    function buildUtilWasteMeterSectionHtml(model = {}, options = {}) {
        const controlsHtml = String(options?.controlsHtml || '');
        const siteLabel = model?.siteOption?.label || '합계';
        const siteSubText = model?.siteOption?.key === 'all'
            ? '북정과 유산 값을 합산해 한 장으로 정리합니다.'
            : `${siteLabel} 양식만 선택 기준에 맞춰 정리합니다.`;
        if (!model?.hasData) {
            return `
                <section class="util-sheet-section util-sheet-waste-meter-section">
                    <div class="util-sheet-section-head">
                        <div>
                            <div class="util-sheet-section-title">폐수 검침표</div>
                            <div class="util-sheet-section-sub">선택한 폐수 기준의 검침표 데이터가 없습니다.</div>
                        </div>
                        ${controlsHtml}
                    </div>
                    <div class="util-sheet-empty">폐수 검침표 양식을 표시할 기준월 데이터가 없습니다.</div>
                </section>
            `;
        }
        return `
            <section class="util-sheet-section util-sheet-waste-meter-section">
                <div class="util-sheet-section-head">
                    <div>
                        <div class="util-sheet-section-title">폐수 검침표</div>
                        <div class="util-sheet-section-sub">${escapeHtml(model.monthLabel || model.monthKey || '')} · ${escapeHtml(siteLabel)} 기준, ${escapeHtml(siteSubText)}</div>
                    </div>
                    ${controlsHtml}
                </div>
                <div class="util-sheet-waste-meter-stack">
                    ${(Array.isArray(model.sites) ? model.sites : []).map((site, index) => buildUtilWasteMeterSiteHtml({ ...site, monthKey: model.monthKey }, index, options)).join('')}
                </div>
            </section>
        `;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        buildUtilWasteMeterModel,
        buildUtilWasteMeterSectionHtml
    });

    runtimeAdapter.exportApi('KPIUtilReportSheetWasteMeterModel', api);
})();
