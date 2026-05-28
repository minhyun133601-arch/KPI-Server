(function registerUtilReportSheetGasComparisonSummary() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/gas/comparison-summary.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetGasComparisonSummary')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.gas.comparison-summary.js'
    );

    const {
        utilSheetNumberFormatter,
        UTIL_GAS_BILLING_SCOPE_KEYS,
        UTIL_GAS_METER_CORRECTION_TARGET_IDS,
        UTIL_GAS_METER_FIELD_LABELS,
        UTIL_GAS_METER_FIELD_ICONS
    } = utilReportSheetConfig;

    const runtime = {
        escapeUtilSheetHtml: null,
        formatUtilSheetCost: null,
        formatUtilSheetInteger: null,
        formatUtilReportMonthLong: null,
        parseUtilGasMeterNumber: null,
        getUtilGasBillingScopeFields: null,
        getUtilGasProductionMetric: null
    };

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

    function formatCost(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetCost === 'function') {
            return runtime.formatUtilSheetCost(value, fallback);
        }
        return String(value ?? fallback);
    }

    function formatInteger(value, fallback = '-') {
        if (typeof runtime.formatUtilSheetInteger === 'function') {
            return runtime.formatUtilSheetInteger(value, fallback);
        }
        return String(value ?? fallback);
    }

    function formatMonthLong(monthKey = '') {
        if (typeof runtime.formatUtilReportMonthLong === 'function') {
            return runtime.formatUtilReportMonthLong(monthKey);
        }
        return String(monthKey || '');
    }

    function parseGasMeterNumber(value) {
        if (typeof runtime.parseUtilGasMeterNumber === 'function') {
            return runtime.parseUtilGasMeterNumber(value);
        }
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : NaN;
    }

    function getGasBillingScopeFields(monthKey = '', scopeKey = '') {
        if (typeof runtime.getUtilGasBillingScopeFields === 'function') {
            return runtime.getUtilGasBillingScopeFields(monthKey, scopeKey) || {};
        }
        return {};
    }

    function getUtilGasMeterColumn(table, fieldId) {
        if (!Array.isArray(table?.columns)) return null;
        return table.columns.find(column => String(column?.id || '') === fieldId) || null;
    }

    function sumUtilGasMeterColumnValues(columns, valueKey, fieldIds) {
        return (Array.isArray(columns) ? columns : [])
            .filter(column => Array.isArray(fieldIds) ? fieldIds.includes(column.id) : true)
            .map(column => column?.[valueKey])
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);
    }

    function formatUtilGasSummaryUnitPrice(value, decimals = 0) {
        if (!Number.isFinite(value)) return '-';
        return `${Number(value).toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })}원`;
    }

    function resolveUtilGasMeterCaption(column) {
        if (!column?.id) return '';
        if (column.id === 'gas_field_01') return '총량 기준';
        if (column.id === 'gas_field_02') return 'LPG 환산';
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column.id)) return '보정 적용';
        return '직접 사용';
    }

    function formatUtilGasMeterFactorValue(value) {
        if (!Number.isFinite(value)) return 'x-';
        const normalizedValue = Number(value).toFixed(4).replace(/\.?0+$/, '');
        return `x${normalizedValue}`;
    }

    function resolveUtilGasMeterAdjustmentNote(column) {
        const factorText = formatUtilGasMeterFactorValue(column?.factor);
        if (column?.id === 'gas_field_02') return `LPG 환산 ${factorText}`;
        if (UTIL_GAS_METER_CORRECTION_TARGET_IDS.has(column?.id)) return `전자식 보정 ${factorText}`;
        return `보정 없음 ${factorText}`;
    }

    function buildUtilGasAllocationItems(totalCost, columns, fieldIds) {
        const totalCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', fieldIds);
        return fieldIds.map(fieldId => {
            const column = columns.find(item => item.id === fieldId) || null;
            const correctedUsage = column?.correctedUsage;
            const cost = Number.isFinite(totalCost) && Number.isFinite(correctedUsage) && totalCorrectedUsage > 0
                ? (totalCost * correctedUsage) / totalCorrectedUsage
                : null;
            return {
                id: fieldId,
                label: column?.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId,
                icon: UTIL_GAS_METER_FIELD_ICONS[fieldId] || 'fa-gauge-high',
                correctedUsage,
                cost
            };
        });
    }

    function buildUtilGasBillingSummaryModel(monthKey, selectedTable) {
        const normalizedMonthKey = String(monthKey || '').trim();
        const lpgFields = getGasBillingScopeFields(normalizedMonthKey, UTIL_GAS_BILLING_SCOPE_KEYS.yusanLpg);
        const lngFields = getGasBillingScopeFields(normalizedMonthKey, UTIL_GAS_BILLING_SCOPE_KEYS.yusanLng);
        const columns = Array.isArray(selectedTable?.columns) ? selectedTable.columns : [];
        const lpgColumn = getUtilGasMeterColumn(selectedTable, 'gas_field_02');
        const lpgSupplyAmount = parseGasMeterNumber(lpgFields.power_charge);
        const lpgVat = parseGasMeterNumber(lpgFields.vat);
        const lpgTotalAmount = parseGasMeterNumber(lpgFields.billing_amount);
        const lpgKgUsage = lpgColumn?.usage;
        const lpgNm3Usage = lpgColumn?.correctedUsage;
        const lpgKgUnitPrice = Number.isFinite(lpgSupplyAmount) && Number.isFinite(lpgKgUsage) && lpgKgUsage > 0
            ? lpgSupplyAmount / lpgKgUsage
            : null;
        const lpgNm3UnitPrice = Number.isFinite(lpgSupplyAmount) && Number.isFinite(lpgNm3Usage) && lpgNm3Usage > 0
            ? lpgSupplyAmount / lpgNm3Usage
            : null;

        const lngSupplyAmount = parseGasMeterNumber(lngFields.power_charge);
        const lngVat = parseGasMeterNumber(lngFields.vat);
        const lngFuelAdjustment = parseGasMeterNumber(lngFields.fuel_adjustment_charge);
        const lngOperationFee = parseGasMeterNumber(lngFields.operation_fee);
        const lngTotalAmount = parseGasMeterNumber(lngFields.billing_amount);
        const lngFieldIds = ['gas_field_03', 'gas_field_04', 'gas_field_06'];
        const lngTotalUsage = getUtilGasMeterColumn(selectedTable, 'gas_field_01')?.usage;
        const lngRawUsage = sumUtilGasMeterColumnValues(columns, 'usage', lngFieldIds);
        const lngCorrectedUsage = sumUtilGasMeterColumnValues(columns, 'correctedUsage', lngFieldIds);
        const lngUnitPrice = Number.isFinite(lngSupplyAmount) && Number.isFinite(lngCorrectedUsage) && lngCorrectedUsage > 0
            ? lngSupplyAmount / lngCorrectedUsage
            : null;
        const lngTaxTotal = [lngVat, lngFuelAdjustment]
            .filter(value => Number.isFinite(value))
            .reduce((sum, value) => sum + value, 0);

        return {
            monthKey: normalizedMonthKey,
            lpg: {
                supplyAmount: lpgSupplyAmount,
                vat: lpgVat,
                totalAmount: lpgTotalAmount,
                kgUnitPrice: lpgKgUnitPrice,
                nm3UnitPrice: lpgNm3UnitPrice
            },
            lng: {
                supplyAmount: lngSupplyAmount,
                vat: lngVat,
                fuelAdjustment: lngFuelAdjustment,
                taxTotal: lngTaxTotal,
                operationFee: lngOperationFee,
                totalAmount: lngTotalAmount,
                unitPrice: lngUnitPrice,
                allocations: buildUtilGasAllocationItems(lngSupplyAmount, columns, lngFieldIds),
                correctionFactor: selectedTable?.correctionFactor,
                totalUsage: lngTotalUsage,
                rawUsage: lngRawUsage,
                correctionLines: lngFieldIds.map(fieldId => {
                    const column = getUtilGasMeterColumn(selectedTable, fieldId);
                    return {
                        id: fieldId,
                        label: column?.label || UTIL_GAS_METER_FIELD_LABELS[fieldId] || fieldId,
                        usage: column?.usage,
                        correctedUsage: column?.correctedUsage
                    };
                })
            },
            grandTotal: [lpgTotalAmount, lngTotalAmount]
                .filter(value => Number.isFinite(value))
                .reduce((sum, value) => sum + value, 0)
        };
    }

    function buildUtilGasSummaryRows(summary) {
        return [
            {
                title: 'LPG',
                icon: 'fa-gas-pump',
                accentClass: 'is-lpg',
                scopeKey: UTIL_GAS_BILLING_SCOPE_KEYS.yusanLpg,
                rows: [
                    {
                        label: 'LPG가스비',
                        icon: 'fa-sack-dollar',
                        value: formatCost(summary?.lpg?.supplyAmount),
                        meta: `LPG Kg 단가 ${formatUtilGasSummaryUnitPrice(summary?.lpg?.kgUnitPrice, 0)}`
                    },
                    {
                        label: '건조(LPG)',
                        icon: 'fa-fan',
                        value: formatCost(summary?.lpg?.supplyAmount),
                        meta: `LPG Nm3 단가 ${formatUtilGasSummaryUnitPrice(summary?.lpg?.nm3UnitPrice, 1)}`
                    },
                    {
                        label: 'LPG세액',
                        icon: 'fa-percent',
                        value: formatCost(summary?.lpg?.vat),
                        meta: ''
                    },
                    {
                        label: 'LPG사용합계',
                        icon: 'fa-receipt',
                        value: formatCost(summary?.lpg?.totalAmount),
                        meta: ''
                    }
                ]
            },
            {
                title: 'LNG',
                icon: 'fa-fire-flame-curved',
                accentClass: 'is-lng',
                scopeKey: UTIL_GAS_BILLING_SCOPE_KEYS.yusanLng,
                rows: [
                    {
                        label: 'LNG가스비',
                        icon: 'fa-fire',
                        value: formatCost(summary?.lng?.supplyAmount),
                        meta: `LNG Nm3 단가 ${formatUtilGasSummaryUnitPrice(summary?.lng?.unitPrice, 0)}`
                    },
                    ...((summary?.lng?.allocations || []).map(item => ({
                        label: item.label,
                        icon: item.icon,
                        value: formatCost(item.cost),
                        meta: Number.isFinite(item.correctedUsage)
                            ? `실사용량 ${formatInteger(item.correctedUsage)}Nm3`
                            : ''
                    }))),
                    {
                        label: '계량기교체비',
                        icon: 'fa-wrench',
                        value: formatCost(summary?.lng?.operationFee),
                        meta: ''
                    },
                    {
                        label: 'LNG세액',
                        icon: 'fa-file-invoice-dollar',
                        value: formatCost(summary?.lng?.taxTotal),
                        meta: `부가세 ${formatCost(summary?.lng?.vat)} · 가산세 ${formatCost(summary?.lng?.fuelAdjustment)}`
                    },
                    {
                        label: 'LNG사용합계',
                        icon: 'fa-receipt',
                        value: formatCost(summary?.lng?.totalAmount),
                        meta: ''
                    }
                ]
            }
        ];
    }

    function buildUtilGasCorrectionNoteHtml(summary) {
        return `
            <section class="util-sheet-gas-guidance">
                <div class="util-sheet-gas-guidance-head">
                    <span class="util-sheet-gas-guidance-icon"><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>
                    <div>
                        <div class="util-sheet-gas-guidance-title">보정 기준</div>
                        <div class="util-sheet-gas-guidance-sub">가스 검침표의 실사용량은 아래 공식으로 계산합니다.</div>
                    </div>
                </div>
                <div class="util-sheet-gas-guidance-copy">
                    <div class="util-sheet-gas-guidance-line">건조기(LPG): 사용량 x 3.35 = 실사용량</div>
                    <div class="util-sheet-gas-guidance-line">3톤보일러, DSI보일러, 액상보일러는 전자식 기준 보정 후 실사용량으로 배분합니다.</div>
                    <div class="util-sheet-gas-guidance-line">사용량 x (2팀 LNG 합계 사용량 ÷ (3톤보일러 + DSI보일러 + 액상보일러 사용량)) = 실사용량</div>
                </div>
            </section>
        `;
    }

    function formatUtilGasMeterCellValue(value) {
        return Number.isFinite(value) ? utilSheetNumberFormatter.format(Math.round(value)) : '-';
    }

    function getGasProductionMetric(monthKey = '', teamNames = []) {
        if (typeof runtime.getUtilGasProductionMetric !== 'function') return NaN;
        const value = runtime.getUtilGasProductionMetric(monthKey, teamNames);
        if (value === null || value === undefined || value === '') return NaN;
        return Number(value);
    }

    function getGasCorrectedUsageSum(table, fieldIds = []) {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const normalizedFieldIds = Array.isArray(fieldIds) ? fieldIds : [];
        const values = columns
            .filter(column => normalizedFieldIds.includes(column?.id))
            .map(column => Number(column?.correctedUsage))
            .filter(Number.isFinite);
        if (!values.length) return NaN;
        return values.reduce((sum, value) => sum + value, 0);
    }

    function buildUtilGasProductionUsagePanelHtml(model) {
        const selectedTable = model?.selectedTable || {};
        const monthKey = String(selectedTable?.monthKey || '').trim();
        const productionTeam12 = getGasProductionMetric(monthKey, ['1팀 2파트']);
        const productionTeam3 = getGasProductionMetric(monthKey, ['3팀']);
        const usageTeam12Lpg = getGasCorrectedUsageSum(selectedTable, ['gas_field_02']);
        const usageTeam12Lng = getGasCorrectedUsageSum(selectedTable, ['gas_field_03', 'gas_field_04']);
        const usageTeam3Lng = getGasCorrectedUsageSum(selectedTable, ['gas_field_06']);

        return `
            <section class="util-sheet-gas-production-usage" aria-label="생산량 및 실사용량">
                <div class="util-sheet-gas-production-usage-table-wrap">
                    <table class="util-sheet-gas-production-usage-table">
                        <colgroup>
                            <col class="is-kind">
                            <col class="is-team12">
                            <col class="is-team3">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>
                                    <span class="util-sheet-gas-production-team is-team12">
                                        <span class="util-sheet-gas-production-team-mark">1P</span>
                                        <span>1팀2파트</span>
                                    </span>
                                </th>
                                <th>
                                    <span class="util-sheet-gas-production-team is-team3">
                                        <span class="util-sheet-gas-production-team-mark">3A</span>
                                        <span>생산3팀 액상</span>
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="is-production">
                                <th scope="row"><span class="util-sheet-gas-production-row-label"><i class="fa-solid fa-industry" aria-hidden="true"></i><span>생산량</span></span></th>
                                <td class="is-team12" aria-label="1팀2파트 생산량">${escapeHtml(formatUtilGasMeterCellValue(productionTeam12))}</td>
                                <td class="is-team3" aria-label="생산3팀 액상 생산량">${escapeHtml(formatUtilGasMeterCellValue(productionTeam3))}</td>
                            </tr>
                            <tr class="is-lpg">
                                <th scope="row"><span class="util-sheet-gas-production-row-label"><i class="fa-solid fa-fire" aria-hidden="true"></i><span>LPG 사용량</span></span></th>
                                <td class="is-team12" aria-label="1팀2파트 LPG 사용량">${escapeHtml(formatUtilGasMeterCellValue(usageTeam12Lpg))}</td>
                                <td class="is-empty" aria-label="해당 없음">-</td>
                            </tr>
                            <tr class="is-lng">
                                <th scope="row"><span class="util-sheet-gas-production-row-label"><i class="fa-solid fa-gas-pump" aria-hidden="true"></i><span>LNG 사용량</span></span></th>
                                <td class="is-team12" aria-label="1팀2파트 LNG 사용량">${escapeHtml(formatUtilGasMeterCellValue(usageTeam12Lng))}</td>
                                <td class="is-team3" aria-label="생산3팀 액상 LNG 사용량">${escapeHtml(formatUtilGasMeterCellValue(usageTeam3Lng))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function buildUtilGasBillingSummaryHtml(summary, model = null) {
        const groups = buildUtilGasSummaryRows(summary);
        return `
            <aside class="util-sheet-gas-summary">
                <div class="util-sheet-gas-summary-shell">
                    ${groups.map(group => `
                        <section class="util-sheet-gas-summary-group ${escapeHtml(group.accentClass)}">
                            <div class="util-sheet-gas-summary-head">
                                <div class="util-sheet-gas-summary-title">
                                    <span class="util-sheet-gas-summary-icon"><i class="fa-solid ${escapeHtml(group.icon)}" aria-hidden="true"></i></span>
                                    <span>${escapeHtml(group.title)} 정산</span>
                                </div>
                            </div>
                            <div class="util-sheet-gas-summary-table-wrap">
                                <table class="util-sheet-gas-summary-table">
                                    <thead>
                                        <tr>
                                            <th>항목</th>
                                            <th>금액</th>
                                            <th>비고</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                ${group.rows.map(row => `
                                        <tr class="${row.meta ? 'has-meta' : ''}">
                                            <th scope="row">
                                                <span class="util-sheet-gas-summary-row-label">
                                                    <span class="util-sheet-gas-summary-row-icon"><i class="fa-solid ${escapeHtml(row.icon)}" aria-hidden="true"></i></span>
                                                    <span>${escapeHtml(row.label)}</span>
                                                </span>
                                            </th>
                                            <td class="is-amount">${escapeHtml(row.value)}</td>
                                            <td class="is-note${row.meta ? '' : ' is-empty'}" ${row.meta ? '' : 'aria-hidden="true"'}>${row.meta ? escapeHtml(row.meta) : ''}</td>
                                        </tr>
                                `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    `).join('')}
                    <div class="util-sheet-gas-summary-grand-block">
                        <table class="util-sheet-gas-summary-grand-table">
                            <tbody>
                                <tr>
                                    <th>
                                        <span class="util-sheet-gas-summary-total-label">
                                            <i class="fa-solid fa-won-sign" aria-hidden="true"></i>
                                            <span>총합계</span>
                                        </span>
                                    </th>
                                    <td>${escapeHtml(formatCost(summary?.grandTotal))}</td>
                                </tr>
                            </tbody>
                        </table>
                        ${model ? buildUtilGasProductionUsagePanelHtml(model) : ''}
                    </div>
                </div>
            </aside>
        `;
    }

    function buildUtilGasMeterTableHtml(table, title, accentClass = '') {
        const columns = Array.isArray(table?.columns) ? table.columns : [];
        const rowHtml = columns.map(column => `
            <tr>
                <th>
                    <div class="util-sheet-meter-name">
                        <span class="util-sheet-meter-icon"><i class="fa-solid ${escapeHtml(UTIL_GAS_METER_FIELD_ICONS[column.id] || 'fa-gauge-high')}" aria-hidden="true"></i></span>
                        <span class="util-sheet-meter-name-copy">
                            <span class="util-sheet-meter-label">${escapeHtml(column.label)}</span>
                            <span class="util-sheet-meter-caption">${escapeHtml(resolveUtilGasMeterCaption(column))}</span>
                        </span>
                    </div>
                </th>
                <td>${escapeHtml(formatUtilGasMeterCellValue(column.startReading))}</td>
                <td>${escapeHtml(formatUtilGasMeterCellValue(column.endReading))}</td>
                <td class="is-soft">${escapeHtml(formatUtilGasMeterCellValue(column.usage))}</td>
                <td class="is-soft">
                    <div class="util-sheet-meter-cell-stack">
                        <span class="util-sheet-meter-cell-value">${escapeHtml(formatUtilGasMeterCellValue(column.adjustment))}</span>
                        <span class="util-sheet-meter-cell-meta">${escapeHtml(resolveUtilGasMeterAdjustmentNote(column))}</span>
                    </div>
                </td>
                <td class="is-accent">${escapeHtml(formatUtilGasMeterCellValue(column.correctedUsage))}</td>
            </tr>
        `).join('');
        return `
            <article class="util-sheet-meter-table-card ${escapeHtml(accentClass)}">
                <div class="util-sheet-meter-table-head">
                    <div class="util-sheet-meter-table-title-wrap">
                        <span class="util-sheet-meter-table-badge"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i></span>
                        <div>
                            <div class="util-sheet-meter-table-title">${escapeHtml(title)}</div>
                            <div class="util-sheet-meter-table-sub">선택월 지침, 익월 지침, 사용량, 보정, 실사용량을 설비 기준으로 정리했습니다.</div>
                        </div>
                    </div>
                </div>
                <div class="util-sheet-table-wrap">
                    <table class="util-sheet-table util-sheet-meter-table">
                        <thead>
                            <tr>
                                <th>설비</th>
                                <th>선택월 지침</th>
                                <th>익월 지침</th>
                                <th>사용량</th>
                                <th>보정</th>
                                <th>실사용량</th>
                            </tr>
                        </thead>
                        <tbody>${rowHtml}</tbody>
                    </table>
                </div>
            </article>
        `;
    }

    function buildUtilGasMeterComparisonSectionHtml(model) {
        if (!model?.ready) {
            return `
                <section class="util-sheet-section">
                    <div class="util-sheet-empty">${escapeHtml(model?.message || '가스 검침표를 준비하지 못했습니다.')}</div>
                </section>
            `;
        }

        const referenceLabel = formatMonthLong(model.referenceTable.monthKey);
        const selectedLabel = formatMonthLong(model.selectedTable.monthKey);

        return `
            <section class="util-sheet-section">
                <div class="util-sheet-gas-layout">
                    <div class="util-sheet-meter-table-stack">
                        ${buildUtilGasMeterTableHtml(model.referenceTable, `${referenceLabel} 검침표`, 'is-reference')}
                        ${buildUtilGasMeterTableHtml(model.selectedTable, `${selectedLabel} 검침표`, 'is-current')}
                    </div>
                    ${buildUtilGasBillingSummaryHtml(model.billingSummary, model)}
                </div>
                ${buildUtilGasCorrectionNoteHtml(model.billingSummary)}
            </section>
        `;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        getUtilGasMeterColumn,
        sumUtilGasMeterColumnValues,
        buildUtilGasBillingSummaryModel,
        buildUtilGasMeterComparisonSectionHtml
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetGasComparisonSummary', api);
})();
