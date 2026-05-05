        function renderUtilReportTableHeadCell(label, subLabel) {
            const mainLabel = String(label || '').trim();
            const secondaryLabel = String(subLabel || '').trim();
            return `
                <div class="util-head-cell">
                    <span class="util-head-label">${escapeHtml(mainLabel || '-')}</span>
                    ${secondaryLabel ? `<span class="util-head-sub">${escapeHtml(secondaryLabel)}</span>` : ''}
                </div>
            `;
        }

        function renderUtilReportTableSummaryLabel(title, subLabel) {
            const mainLabel = String(title || '').trim();
            const secondaryLabel = String(subLabel || '').trim();
            return `
                <div class="util-report-yoy-summary">
                    <span class="util-report-yoy-summary-title">${escapeHtml(mainLabel || '-')}</span>
                    ${secondaryLabel ? `<span class="util-report-yoy-summary-sub">${escapeHtml(secondaryLabel)}</span>` : ''}
                </div>
            `;
        }

        function renderUtilReportAllYearsTableLegacy(result, metricKey) {
            if (!result || !Array.isArray(result.rows) || !result.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">표시할 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const headerUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const metricHeaderLabel = formatUtilLabelWithUnit(metricLabel, headerUnitLabel);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '없음') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;

            const rows = result.rows
                .map(row => {
                    const monthKey = normalizeUtilReportMonthKey(row?.monthKey || toUtilMonthKey(row?.year, row?.month));
                    const rawValue = Number(getUtilReportMetricValue(row, metricKey));
                    return {
                        monthKey,
                        rawValue: Number.isFinite(rawValue) ? rawValue : null
                    };
                })
                .filter(item => item.monthKey)
                .sort((a, b) => compareUtilReportMonthKeys(a.monthKey, b.monthKey));
            if (!rows.length) {
                return '<div class="p-4 text-sm text-slate-300">표시할 데이터가 없습니다.</div>';
            }
            const bodyHtml = rows.map(item => {
                const monthToken = formatUtilReportMonthOnly(item.monthKey);
                return `
                    <tr data-month-token="${escapeHtml(monthToken)}" data-month-key="${escapeHtml(item.monthKey)}">
                        <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthLong(item.monthKey))}</span></td>
                        <td class="is-primary"><span class="util-report-yoy-value">${valueFormatter(item.rawValue)}</span></td>
                    </tr>
                `;
            }).join('');
            const sum = rows.reduce((acc, item) => acc + (Number.isFinite(item.rawValue) ? item.rawValue : 0), 0);
            const hasValue = rows.some(item => Number.isFinite(item.rawValue));

            return `
                <table class="util-report-yoy-table is-timeline is-structured" data-role="util-report-modal-yoy-table">
                    <thead>
                        <tr>
                            <th>연월</th>
                            <th>${renderUtilReportTableHeadCell('연월', '월별 기준')}</th>
                            <th class="is-primary">${renderUtilReportTableHeadCell(metricHeaderLabel, '월별 집계')}</th>
                        </tr>
                    </thead>
                    <tbody>${bodyHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td>합계</td>
                            <td>${hasValue ? valueFormatter(sum) : '없음'}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        function renderUtilReportYoYTableLegacy(result, metricKey, compareYear) {
            const compareYearToken = String(compareYear || '').trim();
            if (!compareYearToken) {
                return renderUtilReportAllYearsTable(result, metricKey);
            }
            const yoy = buildUtilReportYoYRows(result, metricKey, compareYear);
            if (!Array.isArray(yoy.rows) || !yoy.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">전년도 비교 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const signedFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportSignedValueByType(value, valueType, decimals, metric.key)
                : emptyText;

            const currentHeader = yoy.pair ? `${yoy.pair.currentYear}` : '올해';
            const prevHeader = yoy.pair ? `${yoy.pair.prevYear}` : '전년도';
            const yearUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const currentHeaderLabel = formatUtilLabelWithUnit(currentHeader, yearUnitLabel);
            const prevHeaderLabel = formatUtilLabelWithUnit(prevHeader, yearUnitLabel);

            const rowsHtml = yoy.rows.map(item => {
                const hasPrev = Number.isFinite(item.prev);
                const deltaClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateText = hasPrev && Number.isFinite(item.rate)
                    ? `${item.rate > 0 ? '+' : ''}${formatUtilNumber(item.rate, 1)}%`
                    : '없음';
                const monthToken = formatUtilReportMonthOnly(item.monthKey);
                return `
                    <tr data-month-token="${escapeHtml(monthToken)}" data-month-key="${escapeHtml(String(item.monthKey || ''))}">
                        <td>${escapeHtml(monthToken)}</td>
                        <td>${valueFormatter(item.current)}</td>
                        <td>${valueFormatter(item.prev, '없음')}</td>
                        <td class="util-report-delta ${deltaClass}">${hasPrev ? signedFormatter(item.delta, '없음') : '없음'}</td>
                        <td class="util-report-delta ${rateClass}">${rateText}</td>
                    </tr>
                `;
            }).join('');

            const summary = yoy.summary;
            const summaryHasPrev = Number.isFinite(summary?.prev) && Number(summary?.missingPrevCount || 0) === 0;
            const summaryDeltaClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateText = summaryHasPrev && Number.isFinite(summary?.rate)
                ? `${summary.rate > 0 ? '+' : ''}${formatUtilNumber(summary.rate, 1)}%`
                : '없음';

            return `
                <table class="util-report-yoy-table" data-role="util-report-modal-yoy-table">
                    <thead>
                        <tr>
                            <th>월</th>
                            <th>${escapeHtml(currentHeaderLabel)}</th>
                            <th>${escapeHtml(prevHeaderLabel)}</th>
                            <th>증감</th>
                            <th>증감률</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr>
                            <td>합계 (${escapeHtml(metricLabel)})</td>
                            <td>${valueFormatter(summary?.current)}</td>
                            <td>${valueFormatter(summary?.prev, '없음')}</td>
                            <td class="util-report-delta ${summaryDeltaClass}">${summaryHasPrev ? signedFormatter(summary?.delta, '없음') : '없음'}</td>
                            <td class="util-report-delta ${summaryRateClass}">${summaryRateText}</td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        function renderUtilReportAllYearsTable(result, metricKey) {
            if (!result || !Array.isArray(result.rows) || !result.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">표시할 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const headerUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const metricHeaderLabel = formatUtilLabelWithUnit(metricLabel, headerUnitLabel);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '없음') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;

            const rows = result.rows
                .map(row => {
                    const monthKey = normalizeUtilReportMonthKey(row?.monthKey || toUtilMonthKey(row?.year, row?.month));
                    const rawValue = Number(getUtilReportMetricValue(row, metricKey));
                    return {
                        monthKey,
                        rawValue: Number.isFinite(rawValue) ? rawValue : null
                    };
                })
                .filter(item => item.monthKey)
                .sort((a, b) => compareUtilReportMonthKeys(a.monthKey, b.monthKey));
            if (!rows.length) {
                return '<div class="p-4 text-sm text-slate-300">표시할 데이터가 없습니다.</div>';
            }

            const bodyHtml = rows.map(item => `
                <tr data-month-token="${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}" data-month-key="${escapeHtml(item.monthKey)}">
                    <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthLong(item.monthKey))}</span></td>
                    <td class="is-primary"><span class="util-report-yoy-value">${valueFormatter(item.rawValue)}</span></td>
                </tr>
            `).join('');
            const sum = rows.reduce((acc, item) => acc + (Number.isFinite(item.rawValue) ? item.rawValue : 0), 0);
            const hasValue = rows.some(item => Number.isFinite(item.rawValue));

            return `
                <table class="util-report-yoy-table is-timeline is-structured" data-role="util-report-modal-yoy-table">
                    <thead>
                        <tr>
                            <th>${renderUtilReportTableHeadCell('연월', '월별 기준')}</th>
                            <th class="is-primary">${renderUtilReportTableHeadCell(metricHeaderLabel, '월별 집계')}</th>
                        </tr>
                    </thead>
                    <tbody>${bodyHtml}</tbody>
                    <tfoot>
                        <tr class="util-report-yoy-total">
                            <td>${renderUtilReportTableSummaryLabel('합계', '전체 기간')}</td>
                            <td class="is-primary"><span class="util-report-yoy-value">${hasValue ? valueFormatter(sum) : '없음'}</span></td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        function buildUtilReportYoYPeakInfo(yoy) {
            if (!Array.isArray(yoy?.rows) || !yoy.rows.length) return null;
            return yoy.rows.reduce((best, item) => {
                if (!item || !item.monthKey || !Number.isFinite(item.prev) || !Number.isFinite(item.delta)) {
                    return best;
                }
                const magnitude = Math.abs(item.delta);
                if (!best || magnitude > best.magnitude) {
                    return {
                        monthKey: String(item.monthKey || ''),
                        delta: item.delta,
                        rate: Number.isFinite(item.rate) ? item.rate : NaN,
                        magnitude
                    };
                }
                return best;
            }, null);
        }

        function renderUtilReportYoYPeakMeta(peakInfo, options = {}) {
            if (!peakInfo?.monthKey || !Number.isFinite(peakInfo.delta)) return '';
            const deltaClass = getUtilDeltaClass(peakInfo.delta);
            const deltaToneClass = deltaClass === 'is-up'
                ? 'util-report-builder-viz-detail-delta-up'
                : (deltaClass === 'is-down' ? 'util-report-builder-viz-detail-delta-down' : '');
            const rateText = Number.isFinite(peakInfo.rate)
                ? `${peakInfo.rate > 0 ? '+' : ''}${formatUtilNumber(peakInfo.rate, 1)}%`
                : '';
            const metaParts = [rateText, String(options.meta || '').trim()].filter(Boolean);
            return `
                <div class="util-report-builder-viz-compare-meta is-compact">
                    <div class="util-report-builder-viz-compare-chip is-peak ${escapeHtml(deltaToneClass)}">
                        <div class="label">가장 큰 차이 월</div>
                        <div class="value">${escapeHtml(`${formatUtilReportMonthLong(peakInfo.monthKey)} ${options.signedFormatter(peakInfo.delta, '-')}`)}</div>
                        ${metaParts.length ? `<div class="meta">${escapeHtml(metaParts.join(' · '))}</div>` : ''}
                    </div>
                </div>
            `;
        }

        function renderUtilReportYoYTable(result, metricKey, compareYear) {
            const compareYearToken = String(compareYear || '').trim();
            if (!compareYearToken) {
                return renderUtilReportAllYearsTable(result, metricKey);
            }
            const yoy = buildUtilReportYoYRows(result, metricKey, compareYear);
            if (!Array.isArray(yoy.rows) || !yoy.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">전년 비교 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const signedFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportSignedValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const currentHeader = yoy.pair ? `${yoy.pair.currentYear}` : '올해';
            const prevHeader = yoy.pair ? `${yoy.pair.prevYear}` : '전년';
            const yearUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const valueHeadSub = formatUtilLabelWithUnit(metricLabel, yearUnitLabel);

            const rowsHtml = yoy.rows.map(item => {
                const hasPrev = Number.isFinite(item.prev);
                const deltaClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateText = hasPrev && Number.isFinite(item.rate)
                    ? `${item.rate > 0 ? '+' : ''}${formatUtilNumber(item.rate, 1)}%`
                    : '없음';
                return `
                    <tr data-month-token="${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}" data-month-key="${escapeHtml(String(item.monthKey || ''))}">
                        <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}</span></td>
                        <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(item.current)}</span></td>
                        <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(item.prev, '없음')}</span></td>
                        <td class="is-delta-cell"><span class="util-report-yoy-pill ${deltaClass}">${hasPrev ? signedFormatter(item.delta, '없음') : '없음'}</span></td>
                        <td class="is-rate-cell"><span class="util-report-yoy-pill is-rate ${rateClass}">${rateText}</span></td>
                    </tr>
                `;
            }).join('');

            const summary = yoy.summary;
            const summaryHasPrev = Number.isFinite(summary?.prev) && Number(summary?.missingPrevCount || 0) === 0;
            const summaryDeltaClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateText = summaryHasPrev && Number.isFinite(summary?.rate)
                ? `${summary.rate > 0 ? '+' : ''}${formatUtilNumber(summary.rate, 1)}%`
                : '없음';

            return `
                <table class="util-report-yoy-table is-structured" data-role="util-report-modal-yoy-table">
                    <thead>
                        <tr>
                            <th>${renderUtilReportTableHeadCell('월', '동일 월 기준')}</th>
                            <th class="is-current">${renderUtilReportTableHeadCell(currentHeader, valueHeadSub)}</th>
                            <th class="is-prev">${renderUtilReportTableHeadCell(prevHeader, valueHeadSub)}</th>
                            <th class="is-delta">${renderUtilReportTableHeadCell('증감', `${currentHeader} - ${prevHeader}`)}</th>
                            <th class="is-rate">${renderUtilReportTableHeadCell('증감률', '변화 비율')}</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr class="util-report-yoy-total">
                            <td>${renderUtilReportTableSummaryLabel('합계', metricLabel)}</td>
                            <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(summary?.current)}</span></td>
                            <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(summary?.prev, '없음')}</span></td>
                            <td class="is-delta-cell"><span class="util-report-yoy-pill ${summaryDeltaClass}">${summaryHasPrev ? signedFormatter(summary?.delta, '없음') : '없음'}</span></td>
                            <td class="is-rate-cell"><span class="util-report-yoy-pill is-rate ${summaryRateClass}">${summaryRateText}</span></td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        function renderUtilReportYoYTable(result, metricKey, compareYear) {
            const compareYearToken = String(compareYear || '').trim();
            if (!compareYearToken) {
                return renderUtilReportAllYearsTable(result, metricKey);
            }
            const yoy = buildUtilReportYoYRows(result, metricKey, compareYear);
            if (!Array.isArray(yoy.rows) || !yoy.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">전년 비교 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const signedFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportSignedValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const currentHeader = yoy.pair ? `${yoy.pair.currentYear}` : '올해';
            const prevHeader = yoy.pair ? `${yoy.pair.prevYear}` : '전년';
            const yearUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const valueHeadSub = formatUtilLabelWithUnit(metricLabel, yearUnitLabel);

            const rowsHtml = yoy.rows.map(item => {
                const hasPrev = Number.isFinite(item.prev);
                const deltaClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateText = hasPrev && Number.isFinite(item.rate)
                    ? `${item.rate > 0 ? '+' : ''}${formatUtilNumber(item.rate, 1)}%`
                    : '';
                return `
                    <tr data-month-token="${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}" data-month-key="${escapeHtml(String(item.monthKey || ''))}">
                        <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}</span></td>
                        <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(item.current)}</span></td>
                        <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(item.prev, '없음')}</span></td>
                        <td class="is-delta-cell">
                            <div class="util-report-yoy-delta-stack ${deltaClass}">
                                <div class="util-report-yoy-delta-value">${hasPrev ? escapeHtml(signedFormatter(item.delta, '없음')) : '없음'}</div>
                                ${rateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(rateText)}</div>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            const summary = yoy.summary;
            const summaryHasPrev = Number.isFinite(summary?.prev) && Number(summary?.missingPrevCount || 0) === 0;
            const summaryDeltaClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateText = summaryHasPrev && Number.isFinite(summary?.rate)
                ? `${summary.rate > 0 ? '+' : ''}${formatUtilNumber(summary.rate, 1)}%`
                : '';

            return `
                <table class="util-report-yoy-table is-structured" data-role="util-report-modal-yoy-table">
                    <thead>
                        <tr>
                            <th>${renderUtilReportTableHeadCell('월', '동일 월 기준')}</th>
                            <th class="is-current">${renderUtilReportTableHeadCell(currentHeader, valueHeadSub)}</th>
                            <th class="is-prev">${renderUtilReportTableHeadCell(prevHeader, valueHeadSub)}</th>
                            <th class="is-delta">${renderUtilReportTableHeadCell('증감', `${currentHeader} - ${prevHeader}`)}</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                    <tfoot>
                        <tr class="util-report-yoy-total">
                            <td>${renderUtilReportTableSummaryLabel('합계', metricLabel)}</td>
                            <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(summary?.current)}</span></td>
                            <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(summary?.prev, '없음')}</span></td>
                            <td class="is-delta-cell">
                                <div class="util-report-yoy-delta-stack ${summaryDeltaClass}">
                                    <div class="util-report-yoy-delta-value">${summaryHasPrev ? escapeHtml(signedFormatter(summary?.delta, '없음')) : '없음'}</div>
                                    ${summaryRateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(summaryRateText)}</div>` : ''}
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            `;
        }

        function renderUtilReportYoYTable(result, metricKey, compareYear) {
            const compareYearToken = String(compareYear || '').trim();
            if (!compareYearToken) {
                return renderUtilReportAllYearsTable(result, metricKey);
            }
            const yoy = buildUtilReportYoYRows(result, metricKey, compareYear);
            if (!Array.isArray(yoy.rows) || !yoy.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">전년 비교 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const signedFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportSignedValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const currentHeader = yoy.pair ? `${yoy.pair.currentYear}` : '올해';
            const prevHeader = yoy.pair ? `${yoy.pair.prevYear}` : '전년';
            const yearUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const valueHeadSub = formatUtilLabelWithUnit(metricLabel, yearUnitLabel);

            const rowsHtml = yoy.rows.map(item => {
                const hasPrev = Number.isFinite(item.prev);
                const deltaClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateText = hasPrev && Number.isFinite(item.rate)
                    ? `${item.rate > 0 ? '+' : ''}${formatUtilNumber(item.rate, 1)}%`
                    : '';
                return `
                    <tr data-month-token="${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}" data-month-key="${escapeHtml(String(item.monthKey || ''))}">
                        <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}</span></td>
                        <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(item.current)}</span></td>
                        <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(item.prev, '없음')}</span></td>
                        <td class="is-delta-cell">
                            <div class="util-report-yoy-delta-stack ${deltaClass}">
                                <div class="util-report-yoy-delta-value">${hasPrev ? escapeHtml(signedFormatter(item.delta, '없음')) : '없음'}</div>
                                ${rateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(rateText)}</div>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            const summary = yoy.summary;
            const summaryHasPrev = Number.isFinite(summary?.prev) && Number(summary?.missingPrevCount || 0) === 0;
            const summaryDeltaClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateText = summaryHasPrev && Number.isFinite(summary?.rate)
                ? `${summary.rate > 0 ? '+' : ''}${formatUtilNumber(summary.rate, 1)}%`
                : '';
            const peakInfo = buildUtilReportYoYPeakInfo(yoy);
            const peakMetaHtml = renderUtilReportYoYPeakMeta(peakInfo, {
                signedFormatter,
                meta: `${currentHeader} - ${prevHeader}`
            });

            return `
                <div class="util-report-yoy-compare-block">
                    ${peakMetaHtml}
                    <table class="util-report-yoy-table is-structured" data-role="util-report-modal-yoy-table">
                        <thead>
                            <tr>
                                <th>${renderUtilReportTableHeadCell('월', '동일 월 기준')}</th>
                                <th class="is-current">${renderUtilReportTableHeadCell(currentHeader, valueHeadSub)}</th>
                                <th class="is-prev">${renderUtilReportTableHeadCell(prevHeader, valueHeadSub)}</th>
                                <th class="is-delta">${renderUtilReportTableHeadCell('증감', `${currentHeader} - ${prevHeader}`)}</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                        <tfoot>
                            <tr class="util-report-yoy-total">
                                <td>${renderUtilReportTableSummaryLabel('합계', metricLabel)}</td>
                                <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(summary?.current)}</span></td>
                                <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(summary?.prev, '없음')}</span></td>
                                <td class="is-delta-cell">
                                    <div class="util-report-yoy-delta-stack ${summaryDeltaClass}">
                                        <div class="util-report-yoy-delta-value">${summaryHasPrev ? escapeHtml(signedFormatter(summary?.delta, '없음')) : '없음'}</div>
                                        ${summaryRateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(summaryRateText)}</div>` : ''}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        function renderUtilReportYoYSummaryMeta(yoy, options = {}) {
            const rows = Array.isArray(yoy?.rows) ? yoy.rows : [];
            const comparableRows = rows.filter(item => Number.isFinite(item?.current) && Number.isFinite(item?.prev));
            const comparableCount = comparableRows.length;
            const averageCurrent = comparableCount
                ? comparableRows.reduce((sum, item) => sum + Number(item.current), 0) / comparableCount
                : NaN;
            const averagePrev = comparableCount
                ? comparableRows.reduce((sum, item) => sum + Number(item.prev), 0) / comparableCount
                : NaN;
            const averageDelta = Number.isFinite(averageCurrent) && Number.isFinite(averagePrev)
                ? averageCurrent - averagePrev
                : NaN;
            const averageRate = Number.isFinite(averagePrev) && averagePrev !== 0
                ? (averageDelta / averagePrev) * 100
                : NaN;
            const totalDelta = Number(yoy?.summary?.delta);
            const totalRate = Number(yoy?.summary?.rate);
            const peakInfo = buildUtilReportYoYPeakInfo(yoy);

            const toToneClass = (deltaValue) => {
                const deltaClass = getUtilDeltaClass(deltaValue);
                if (deltaClass === 'is-up') return 'util-report-builder-viz-detail-delta-up';
                if (deltaClass === 'is-down') return 'util-report-builder-viz-detail-delta-down';
                return '';
            };
            const formatRateText = (rateValue) => Number.isFinite(rateValue)
                ? `${rateValue > 0 ? '+' : ''}${formatUtilNumber(rateValue, 1)}%`
                : '';

            const chips = [
                {
                    tone: `delta ${toToneClass(averageDelta)}`.trim(),
                    label: '평균 차이',
                    value: Number.isFinite(averageDelta) ? options.signedFormatter(averageDelta, '-') : '-',
                    meta: [formatRateText(averageRate), comparableCount ? `동일 월 ${comparableCount}개월 평균` : ''].filter(Boolean).join(' / ')
                },
                {
                    tone: `delta ${toToneClass(totalDelta)}`.trim(),
                    label: '총 차이',
                    value: Number.isFinite(totalDelta) ? options.signedFormatter(totalDelta, '-') : '-',
                    meta: [formatRateText(totalRate), String(options.meta || '').trim()].filter(Boolean).join(' / ')
                },
                {
                    tone: `peak ${toToneClass(peakInfo?.delta)}`.trim(),
                    label: '가장 큰 차이 월',
                    value: peakInfo?.monthKey && Number.isFinite(peakInfo.delta)
                        ? `${formatUtilReportMonthLong(peakInfo.monthKey)} ${options.signedFormatter(peakInfo.delta, '-')}`
                        : '-',
                    meta: [formatRateText(peakInfo?.rate), String(options.meta || '').trim()].filter(Boolean).join(' / ')
                }
            ];

            return `
                <div class="util-report-builder-viz-compare-meta">
                    ${chips.map(item => `
                        <div class="util-report-builder-viz-compare-chip is-${escapeHtml(item.tone)}">
                            <div class="label">${escapeHtml(item.label)}</div>
                            <div class="value">${escapeHtml(item.value)}</div>
                            ${item.meta ? `<div class="meta">${escapeHtml(item.meta)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        function renderUtilReportYoYTable(result, metricKey, compareYear) {
            const compareYearToken = String(compareYear || '').trim();
            if (!compareYearToken) {
                return renderUtilReportAllYearsTable(result, metricKey);
            }
            const yoy = buildUtilReportYoYRows(result, metricKey, compareYear);
            if (!Array.isArray(yoy.rows) || !yoy.rows.length) {
                return '<div class="p-4 text-sm text-slate-300">전년 비교 데이터가 없습니다.</div>';
            }
            const metricLabel = getUtilReportMetricLabel(metricKey, UtilReportState.unitKey);
            const metric = getUtilReportMetricOption(metricKey);
            const valueType = metric.type === 'production'
                ? 'production'
                : (metric.type === 'usage' ? 'usage' : 'cost');
            const unitLabel = getUtilReportValueUnitLabelByType(valueType, metric.key);
            const decimals = UtilReportState.decimals;
            const valueFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const signedFormatter = (value, emptyText = '-') => Number.isFinite(value)
                ? formatUtilReportSignedValueByType(value, valueType, decimals, metric.key)
                : emptyText;
            const currentHeader = yoy.pair ? `${yoy.pair.currentYear}` : '올해';
            const prevHeader = yoy.pair ? `${yoy.pair.prevYear}` : '전년';
            const yearUnitLabel = metric.type === 'unit' ? `${unitLabel}/kg` : unitLabel;
            const valueHeadSub = formatUtilLabelWithUnit(metricLabel, yearUnitLabel);

            const rowsHtml = yoy.rows.map(item => {
                const hasPrev = Number.isFinite(item.prev);
                const deltaClass = hasPrev ? getUtilDeltaClass(item.delta) : 'is-flat';
                const rateText = hasPrev && Number.isFinite(item.rate)
                    ? `${item.rate > 0 ? '+' : ''}${formatUtilNumber(item.rate, 1)}%`
                    : '';
                return `
                    <tr data-month-token="${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}" data-month-key="${escapeHtml(String(item.monthKey || ''))}">
                        <td><span class="util-report-yoy-row-label">${escapeHtml(formatUtilReportMonthOnly(item.monthKey))}</span></td>
                        <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(item.current)}</span></td>
                        <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(item.prev, '없음')}</span></td>
                        <td class="is-delta-cell">
                            <div class="util-report-yoy-delta-stack ${deltaClass}">
                                <div class="util-report-yoy-delta-value">${hasPrev ? escapeHtml(signedFormatter(item.delta, '없음')) : '없음'}</div>
                                ${rateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(rateText)}</div>` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            const summary = yoy.summary;
            const summaryHasPrev = Number.isFinite(summary?.prev) && Number(summary?.missingPrevCount || 0) === 0;
            const summaryDeltaClass = summaryHasPrev ? getUtilDeltaClass(summary?.delta) : 'is-flat';
            const summaryRateText = summaryHasPrev && Number.isFinite(summary?.rate)
                ? `${summary.rate > 0 ? '+' : ''}${formatUtilNumber(summary.rate, 1)}%`
                : '';
            const summaryMetaHtml = renderUtilReportYoYSummaryMeta(yoy, {
                signedFormatter,
                meta: `${currentHeader} - ${prevHeader}`
            });

            return `
                <div class="util-report-yoy-compare-block">
                    ${summaryMetaHtml}
                    <table class="util-report-yoy-table is-structured" data-role="util-report-modal-yoy-table">
                        <thead>
                            <tr>
                                <th>${renderUtilReportTableHeadCell('월', '동일 월 기준')}</th>
                                <th class="is-current">${renderUtilReportTableHeadCell(currentHeader, valueHeadSub)}</th>
                                <th class="is-prev">${renderUtilReportTableHeadCell(prevHeader, valueHeadSub)}</th>
                                <th class="is-delta">${renderUtilReportTableHeadCell('증감', `${currentHeader} - ${prevHeader}`)}</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
                        <tfoot>
                            <tr class="util-report-yoy-total">
                                <td>${renderUtilReportTableSummaryLabel('합계', metricLabel)}</td>
                                <td class="is-current"><span class="util-report-yoy-value">${valueFormatter(summary?.current)}</span></td>
                                <td class="is-prev"><span class="util-report-yoy-value">${valueFormatter(summary?.prev, '없음')}</span></td>
                                <td class="is-delta-cell">
                                    <div class="util-report-yoy-delta-stack ${summaryDeltaClass}">
                                        <div class="util-report-yoy-delta-value">${summaryHasPrev ? escapeHtml(signedFormatter(summary?.delta, '없음')) : '없음'}</div>
                                        ${summaryRateText ? `<div class="util-report-yoy-delta-rate">${escapeHtml(summaryRateText)}</div>` : ''}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        function renderUtilReportYoYLauncher(result) {
            const compareOptions = getUtilReportCompareYearOptions(result || UtilReportState.lastResult || {});
            const selectedCompare = compareOptions.find(item => item.value === UtilReportState.compareYear);
            const compareLabel = selectedCompare ? selectedCompare.label : '기준년도 미선택';
            const metricLabel = getUtilReportMetricLabel(resolveUtilReportChartMetricKey(), UtilReportState.unitKey);
            return `
                <div class="util-report-yoy-launcher">
                    <div>
                        <div class="util-report-yoy-launcher-title">전년도 비교표</div>
                        <div class="util-report-yoy-launcher-sub">지표: ${escapeHtml(metricLabel)} / 기준: ${escapeHtml(compareLabel)}</div>
                    </div>
                    <button type="button" class="util-report-yoy-open" data-role="util-report-yoy-open">표 팝업 열기</button>
                </div>
            `;
        }
        function getUtilReportLatestDelta(result, metricKey, targetYear = '') {
            const sourceRows = Array.isArray(result?.rows) ? result.rows : [];
            const rows = targetYear
                ? sourceRows.filter(row => String(row?.year) === String(targetYear)).sort((a, b) => Number(a.month) - Number(b.month))
                : sourceRows;
            if (rows.length < 2) return null;
            const current = Number(getUtilReportMetricValue(rows[rows.length - 1], metricKey));
            const prev = Number(getUtilReportMetricValue(rows[rows.length - 2], metricKey));
            if (!Number.isFinite(current) || !Number.isFinite(prev)) return null;
            const delta = current - prev;
            const rate = prev !== 0 ? (delta / prev) * 100 : null;
            return { delta, rate, hasPrev: true, currentMonthKey: String(rows[rows.length - 1]?.monthKey || '') };
        }

        function bindUtilReportProductionInputs(tableEl) {
            if (!tableEl) return;
            tableEl.querySelectorAll('[data-role="util-report-production-override"]').forEach(input => {
                const apply = () => {
                    const monthKey = input.dataset.month;
                    const ok = setUtilReportProductionOverride(monthKey, input.value);
                    if (!ok) {
                        alert('생산량은 0 이상의 숫자만 입력해 주세요.');
                        const previous = UtilReportOverrideState.productionByMonth[monthKey];
                        input.value = previous ?? '';
                        input.focus();
                        return;
                    }
                    runUtilReportFromState({ renderModal: true });
                };
                input.addEventListener('change', apply);
                input.addEventListener('blur', apply);
                input.addEventListener('keydown', event => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        apply();
                    }
                });
            });
        }
