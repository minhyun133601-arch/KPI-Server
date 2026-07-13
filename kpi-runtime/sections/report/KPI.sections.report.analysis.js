(function (root) {
    const parts = root[Symbol.for('kpi.reportDeck.section.parts')] ||= Object.create(null);
    function buildAnalysisSlide(index, sectionKey, titleKey, leftTitle, rightTitle) {
        if (Number(index) === 3) {
            return buildBukjeongUtilityAnalysisSlide();
        }
        if (Number(index) === 4) {
            return buildYusanUtilityAnalysisSlide();
        }
        if (Number(index) === 5) {
            return buildYusanLpgCostAnalysisSlide();
        }
        return `
            <article class="report-slide report-template-slide" data-report-slide-page="${index}" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}">
                ${parts.buildSlideHeader(sectionKey, titleKey)}
                <div class="report-two-column-grid">
                    <div class="report-analysis-column">
                        ${parts.buildMetricTable(leftTitle)}
                        ${parts.buildChartBox()}
                        ${parts.buildMemoBox()}
                    </div>
                    <div class="report-analysis-column">
                        ${parts.buildMetricTable(rightTitle)}
                        ${parts.buildChartBox()}
                        ${parts.buildMemoBox()}
                    </div>
                </div>
            </article>
        `;
    }

    function buildYusanLpgCostAnalysisSlide() {
        return `
            <article class="report-slide report-template-slide report-bukjeong-analysis-slide report-yusan-lpg-analysis-slide" data-report-slide-page="5" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-yusan-lpg-analysis>
                ${parts.buildSlideHeader('slide5Section', 'slide5Title')}
                <div class="report-lpg-trend-note">※ (LPG 동향)</div>
                <div class="report-bukjeong-analysis-grid report-yusan-lpg-grid">
                    <div class="report-bukjeong-analysis-column">
                        ${buildYusanLpgMetricTable()}
                        ${buildYusanLpgChart('unit', '1팀 2파트 LPG (kg) / 생산량(kg)')}
                        ${buildYusanLpgMemoBox('slide5LpgMemo', { defaultTeam: 'team_01_02', defaultMetric: 'lpg' })}
                    </div>
                    <div class="report-bukjeong-analysis-column">
                        ${buildYusanLpgCostTable()}
                        ${buildYusanLpgChart('cost', 'LPG, LNG환산 (원)')}
                        ${buildYusanLpgMemoBox('slide5CostMemo', { defaultTeam: 'team_01_02', defaultMetric: 'lpg' })}
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>5/9</div>
            </article>
        `;
    }

    function buildYusanLpgMetricTable() {
        const rows = [
            { key: 'production', label: '생산량<br>(kg)' },
            { key: 'usage', label: '사용량<br>(kg)' },
            { key: 'unit', label: '&#50896;&#45800;&#50948;' },
            { key: 'amount', label: '사용 금액<br>(원)' }
        ].map(row => `
            <tr${row.key === 'unit' ? ' class="report-auto-unit-row"' : ''}>
                <th class="report-auto-row-label">${row.label}</th>
                <td data-report-yusan-lpg-value="${row.key}.reference"></td>
                <td data-report-yusan-lpg-value="${row.key}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-value="${row.key}.yoy"></td>
                <td data-report-yusan-lpg-value="${row.key}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-value="${row.key}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-auto-metric-table report-yusan-lpg-table" data-report-yusan-lpg-table="left">
                <tbody>
                    <tr>
                        <th class="report-auto-resource-cell" rowspan="5">가스<br><span>(LPG)</span></th>
                        <th class="report-auto-row-label">1팀 2파트</th>
                        <th data-report-yusan-lpg-month-label="reference"></th>
                        <th data-report-yusan-lpg-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-yusan-lpg-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function buildYusanLpgCostTable() {
        const formatRowLabel = (label, index) => index === 2
            ? `${label}<small class="report-yusan-lpg-ratio-formula">LPG/LNG환산</small>`
            : (index === 3 ? `${label}<small class="report-yusan-lpg-ratio-formula">LPG - LNG환산</small>` : label);
        const rows = ['LPG', 'LNG', '비율', '금액 차이'].map((label, index) => `
            <tr>
                <th class="report-auto-row-label">${formatRowLabel(label, index)}</th>
                <td data-report-yusan-lpg-cost-value="${index}.reference"></td>
                <td data-report-yusan-lpg-cost-value="${index}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-cost-value="${index}.yoy"></td>
                <td data-report-yusan-lpg-cost-value="${index}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-yusan-lpg-cost-value="${index}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-auto-metric-table report-yusan-lpg-table" data-report-yusan-lpg-table="right">
                <tbody>
                    <tr>
                        <th class="report-auto-resource-cell report-yusan-lpg-cost-resource" rowspan="5">비용<br><span>(원)</span><small>LPG ⇒ LNG<br>환산</small></th>
                        <th class="report-auto-row-label">유 산</th>
                        <th data-report-yusan-lpg-cost-month-label="reference"></th>
                        <th data-report-yusan-lpg-cost-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-yusan-lpg-cost-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function buildYusanLpgChart(key, title) {
        const chartKey = `auto:yusan-lpg:${key}`;
        return `
            <div class="report-auto-chart report-lpg-chart" data-report-yusan-lpg-chart="${key}">
                <div class="report-auto-chart-title report-lpg-chart-title">${title}</div>
                ${parts.buildReportChartHighlightControls(chartKey, key)}
                <div class="report-auto-chart-plot report-lpg-chart-plot" data-report-yusan-lpg-chart-plot="${key}" aria-label="${title}"></div>
            </div>
        `;
    }

    function buildYusanLpgMemoBox(memoKey = '', options = {}) {
        const key = String(memoKey || '').trim();
        const defaultTeam = String(options.defaultTeam || '').trim();
        const defaultMetric = String(options.defaultMetric || '').trim();
        const memoAttrs = key
            ? ` data-report-memo-key="${key}" data-report-memo-default-team="${defaultTeam}" data-report-memo-default-metric="${defaultMetric}" role="button" tabindex="-1"`
            : '';
        return `
            <div class="report-auto-memo-box report-yusan-lpg-memo"${memoAttrs}>
                <strong>특이사항</strong>
                <div class="report-auto-memo-blank report-auto-memo-content" data-report-memo-content="${key}"></div>
            </div>
        `;
    }

    function buildBukjeongUtilityAnalysisSlide() {
        return buildUtilityAutoAnalysisSlide({
            pageIndex: 3,
            pageNumber: '3/9',
            analysisKey: 'bukjeong-utility',
            sectionKey: 'slide3Section',
            titleKey: 'slide3Title',
            scopeLabel: '북 정',
            gasChartTitle: '북 정 LNG (m³) / 생산량(kg)',
            electricChartTitle: '북 정 전기 (kWh) / 생산량(kg)'
        });
    }

    function buildYusanUtilityAnalysisSlide() {
        return buildUtilityAutoAnalysisSlide({
            pageIndex: 4,
            pageNumber: '4/9',
            analysisKey: 'yusan-utility',
            sectionKey: 'slide4Section',
            titleKey: 'slide4Title',
            scopeLabel: '유 산',
            gasChartTitle: '유 산 LNG (m³) / 생산량(kg)',
            electricChartTitle: '유 산 전기 (kWh) / 생산량(kg)'
        });
    }

    function buildUtilityAutoAnalysisSlide(config = {}) {
        const defaultTeam = config.analysisKey === 'bukjeong-utility' ? 'team_01_01' : 'team_01_02';
        return `
            <article class="report-slide report-template-slide report-bukjeong-analysis-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-auto-analysis="${config.analysisKey}">
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-bukjeong-analysis-grid">
                    <div class="report-bukjeong-analysis-column">
                        ${parts.buildBukjeongAutoMetricTable('gas', '가스<br><span>(LNG)</span>', '사용량<br>(m³)', config.scopeLabel)}
                        ${parts.buildBukjeongAutoChart('gas', config.gasChartTitle, config.analysisKey)}
                        ${parts.buildBukjeongAutoMemo(`slide${config.pageIndex}GasMemo`, { defaultTeam, defaultMetric: 'lng' })}
                    </div>
                    <div class="report-bukjeong-analysis-column">
                        ${parts.buildBukjeongAutoMetricTable('electric', '전기<br><span>(kWh)</span>', '사용량<br>(kWh)', config.scopeLabel)}
                        ${parts.buildBukjeongAutoChart('electric', config.electricChartTitle, config.analysisKey)}
                        ${parts.buildBukjeongAutoMemo(`slide${config.pageIndex}ElectricMemo`, { defaultTeam, defaultMetric: 'electric' })}
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>${config.pageNumber}</div>
            </article>
        `;
    }

    function buildWasteSlide(index, sectionKey, titleKey, tableTitle) {
        if (Number(index) === 6) {
            return buildWasteAutoAnalysisSlide({
                pageIndex: 6,
                pageNumber: '6/9',
                analysisKey: 'bukjeong-waste',
                sectionKey,
                titleKey,
                scopeLabel: '북정',
                chartTitle: '북정 폐수 (m³) / 생산량 (톤)'
            });
        }
        if (Number(index) === 7) {
            return buildWasteAutoAnalysisSlide({
                pageIndex: 7,
                pageNumber: '7/9',
                analysisKey: 'yusan-waste',
                sectionKey,
                titleKey,
                scopeLabel: '유산',
                chartTitle: '유산 폐수 (m³) / 생산량 (톤)'
            });
        }
        return `
            <article class="report-slide report-template-slide" data-report-slide-page="${index}" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}">
                ${parts.buildSlideHeader(sectionKey, titleKey)}
                <div class="report-waste-grid">
                    <div class="report-waste-table">${parts.buildMetricTable(tableTitle, 10, 6)}</div>
                    ${parts.buildChartBox()}
                    <div class="report-waste-memo">${parts.buildMemoBox()}</div>
                </div>
            </article>
        `;
    }

    function buildWasteAutoMetricTable(scopeLabel = '') {
        const costRows = [
            { key: 'water', label: '1. 상수' },
            { key: 'share', label: '2. 폐수' },
            { key: 'sludge', label: '3. 폐수<br>오니' },
            { key: 'resin', label: '4. 폐합성<br>수지' },
            { key: 'labor', label: '5. 인건비' }
        ].map((row, index) => `
            <tr>
                ${index === 0 ? '<th class="report-waste-auto-group" rowspan="5">처리 비용<br><span>(원)</span></th>' : ''}
                <th class="report-waste-auto-row-label">${row.label}</th>
                <td data-report-waste-auto-value="${row.key}.reference"></td>
                <td data-report-waste-auto-value="${row.key}.current"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="${row.key}.yoy"></td>
                <td data-report-waste-auto-value="${row.key}.previous"></td>
                <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="${row.key}.mom"></td>
            </tr>
        `).join('');
        return `
            <table class="report-waste-auto-table" data-report-waste-auto-table>
                <tbody>
                    <tr>
                        <th class="report-waste-auto-group" rowspan="4">폐수</th>
                        <th class="report-waste-auto-row-label">${scopeLabel}</th>
                        <th data-report-waste-auto-month-label="reference"></th>
                        <th data-report-waste-auto-month-label="current"></th>
                        <th>전년대비</th>
                        <th data-report-waste-auto-month-label="previous"></th>
                        <th>전월대비</th>
                    </tr>
                    <tr>
                        <th class="report-waste-auto-row-label">생산량 (kg)</th>
                        <td data-report-waste-auto-value="production.reference"></td>
                        <td data-report-waste-auto-value="production.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="production.yoy"></td>
                        <td data-report-waste-auto-value="production.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="production.mom"></td>
                    </tr>
                    <tr>
                        <th class="report-waste-auto-row-label">방류량 (m³)</th>
                        <td data-report-waste-auto-value="usage.reference"></td>
                        <td data-report-waste-auto-value="usage.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="usage.yoy"></td>
                        <td data-report-waste-auto-value="usage.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="usage.mom"></td>
                    </tr>
                    <tr class="report-waste-auto-unit-row">
                        <th class="report-waste-auto-row-label">&#50896;&#45800;&#50948;</th>
                        <td data-report-waste-auto-value="unit.reference"></td>
                        <td data-report-waste-auto-value="unit.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="unit.yoy"></td>
                        <td data-report-waste-auto-value="unit.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="unit.mom"></td>
                    </tr>
                    ${costRows}
                    <tr>
                        <th class="report-waste-auto-total-label" colspan="2">총 계</th>
                        <td data-report-waste-auto-value="total.reference"></td>
                        <td data-report-waste-auto-value="total.current"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="total.yoy"></td>
                        <td data-report-waste-auto-value="total.previous"></td>
                        <td class="report-auto-delta-cell report-auto-compare-cell" data-report-waste-auto-value="total.mom"></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildWasteAutoAnalysisSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-waste-auto-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${parts.REPORT_PUBLIC_WORKS_VIEW}" data-report-auto-analysis="${config.analysisKey}">
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-waste-auto-layout">
                    <div class="report-waste-auto-table-wrap">${buildWasteAutoMetricTable(config.scopeLabel)}</div>
                    <div class="report-auto-chart report-waste-auto-chart" data-report-waste-auto-chart>
                        <div class="report-auto-chart-title">${config.chartTitle}</div>
                        ${parts.buildReportChartHighlightControls(`auto:${config.analysisKey}:waste`, 'waste')}
                        <div class="report-auto-chart-plot" data-report-waste-auto-chart-plot aria-label="${config.chartTitle}"></div>
                    </div>
                    <div class="report-waste-auto-memo" data-report-memo-key="slide${config.pageIndex}WasteMemo" data-report-memo-default-team="${config.analysisKey === 'bukjeong-waste' ? 'team_01_01' : 'team_01_02'}" data-report-memo-default-metric="waste_usage" role="button" tabindex="-1">
                        <strong>특이사항</strong>
                        <div class="report-auto-memo-blank report-auto-memo-content" data-report-memo-content="slide${config.pageIndex}WasteMemo"></div>
                    </div>
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>${config.pageNumber}</div>
            </article>
        `;
    }

    function buildReportMemoDialog() {
        return `
            <div class="report-memo-dialog" data-report-memo-dialog hidden>
                <div class="report-memo-dialog-head" data-report-memo-drag-handle title="드래그해서 이동">
                    <strong>특이사항 선택</strong>
                    <button type="button" data-report-memo-close>닫기</button>
                </div>
                <div class="report-memo-controls">
                    <label>
                        <span>팀</span>
                        <select data-report-memo-team>
                            <option value="team_01_01">1팀 1파트</option>
                            <option value="team_01_02">1팀 2파트</option>
                            <option value="team_02">2팀</option>
                            <option value="team_03">3팀</option>
                        </select>
                    </label>
                    <label>
                        <span>항목</span>
                        <select data-report-memo-metric>
                            <option value="production">생산량</option>
                            <option value="electric">전력량</option>
                            <option value="lng">LNG</option>
                        </select>
                    </label>
                </div>
                <div class="report-memo-notepad-wrap">
                    <textarea class="report-memo-notepad" data-report-memo-notepad rows="9" spellcheck="false" placeholder="&#53945;&#51060;&#49324;&#54637; &#51077;&#47141;"></textarea>
                    <div class="report-memo-notepad-actions" aria-label="특이사항 서식">
                        <button type="button" data-report-memo-notepad-font-size-delta="-1" title="선택 영역 글자 작게" aria-label="선택 영역 글자 작게">-</button>
                        <button type="button" data-report-memo-notepad-font-size-delta="1" title="선택 영역 글자 크게" aria-label="선택 영역 글자 크게">+</button>
                        <input type="text" class="report-memo-notepad-size-input" inputmode="numeric" value="3" data-report-memo-notepad-font-size-input aria-label="선택 영역 글자 크기">
                        <button type="button" class="report-memo-line-color-button is-red" data-report-memo-notepad-color="red" title="선택 영역 빨강" aria-label="선택 영역 빨강"><span></span></button>
                        <button type="button" class="report-memo-line-color-button is-blue" data-report-memo-notepad-color="blue" title="선택 영역 파랑" aria-label="선택 영역 파랑"><span></span></button>
                        <button type="button" class="report-memo-line-color-button is-clear" data-report-memo-notepad-color="clear" title="색 초기화" aria-label="선택 영역 색 초기화">&#8630;</button>
                    </div>
                </div>
                <div class="report-memo-candidates" data-report-memo-candidates></div>
            </div>
        `;
    }

    function buildReportMemoOverviewDialog() {
        return `
            <div class="report-memo-overview-dialog" data-report-memo-overview-dialog hidden role="dialog" aria-modal="false" aria-label="특이사항 전체 확인">
                <div class="report-memo-overview-panel" data-report-memo-overview-panel>
                    <div class="report-memo-overview-head" data-report-memo-overview-drag-handle title="드래그해서 이동">
                        <strong>특이사항 전체 확인</strong>
                        <button type="button" data-report-memo-overview-close aria-label="닫기">닫기</button>
                    </div>
                    <div class="report-memo-overview-body" data-report-memo-overview-list>
                        <div class="report-memo-overview-empty">특이사항 항목을 불러오는 중입니다.</div>
                    </div>
                </div>
            </div>
        `;
    }

    function getProductionStartRowKey(label = '') {
        const value = String(label || '').trim().toLowerCase();
        if (value === 'sd') return 'sd';
        if (value === 'msd') return 'msd';
        if (value === 'ica') return 'ica';
        return '';
    }

    function normalizeProductionStartRows(rows = []) {
        return (Array.isArray(rows) && rows.length ? rows : [{ key: '', label: '' }]).map((row, index, list) => {
            if (row && typeof row === 'object') {
                const label = String(row.label || '').trim();
                return {
                    key: String(row.key || (row.isTotal === true || index === list.length - 1 ? 'total' : getProductionStartRowKey(label))).trim(),
                    label,
                    isTotal: row.isTotal === true || index === list.length - 1
                };
            }
            const rowKey = index === list.length - 1
                ? 'total'
                : (getProductionStartRowKey(row) || (index === 1 && String(list[0] || '').trim().toLowerCase() === 'ica' ? 'jidae' : ''));
            return {
                key: rowKey,
                label: String(row || '').trim(),
                isTotal: index === list.length - 1
            };
        });
    }

    function buildProductionStartValueAttr(analysisKey = '', partKey = '', rowKey = '', metricKey = '') {
        return analysisKey && partKey && rowKey && metricKey
            ? ` data-report-production-start-value="${partKey}.${rowKey}.${metricKey}"`
            : '';
    }

    function buildProductionStartCauseAttr(analysisKey = '', partKey = '', rowKey = '', metricKey = '') {
        return analysisKey && partKey && rowKey && metricKey
            ? ` data-report-production-start-cause="${partKey}.${rowKey}.${metricKey}"`
            : '';
    }

    function buildProductionStartSummaryTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const normalizedRows = normalizeProductionStartRows(config.rows || []);
        const bodyRows = normalizedRows.map((row, index) => `
            <tr${row.isTotal ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-start-part" rowspan="${normalizedRows.length}">${partLabel}</th>` : ''}
                <th>${row.label}</th>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'current')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'previous')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'momIndex')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'reference')}></td>
                <td${buildProductionStartValueAttr(analysisKey, partKey, row.key, 'yoyIndex')}></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-start-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적<br>(TON)</th>
                        <th>전월실적<br>(TON)</th>
                        <th>전월대비(%)</th>
                        <th>전년동기<br>(TON)</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionStartCauseTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const normalizedRows = normalizeProductionStartRows(config.rows || []);
        const bodyRows = normalizedRows.map((row, index) => `
            <tr>
                ${index === 0 ? `<th class="report-production-start-part" rowspan="${normalizedRows.length}">${partLabel}</th>` : ''}
                <th>${row.label}</th>
                <td${buildProductionStartCauseAttr(analysisKey, partKey, row.key, 'yoyRate')}></td>
                <td${buildProductionStartCauseAttr(analysisKey, partKey, row.key, 'reason')}></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-start-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-part">
                    <col class="report-production-cause-col-item">
                    <col class="report-production-cause-col-rate">
                    <col class="report-production-cause-col-reason">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>설비별</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionStartChart(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = config.partKey || '';
        const analysisKey = config.analysisKey || '';
        const chartKey = analysisKey && partKey ? `production-start:${analysisKey}:${partKey}` : '';
        return `
            <div class="report-production-start-chart" aria-label="${partLabel} 생산량 현황 그래프">
                <div class="report-production-start-unit">단위: 톤</div>
                ${parts.buildReportChartHighlightControls(chartKey, partKey)}
                <div class="report-production-start-chart-plot"${partKey ? ` data-report-production-start-chart-plot="${partKey}"` : ''} aria-label="${partLabel} ?앹궛???꾪솴">
                    <div class="report-production-start-chart-grid"></div>
                <div class="report-production-start-chart-axis is-y"></div>
                <div class="report-production-start-chart-axis is-x"></div>
                <div class="report-production-start-chart-legend">
                    <span><i class="is-blue"></i>전년</span>
                    <span><i class="is-red"></i>금년</span>
                </div>
                </div>
            </div>
        `;
    }

    function buildProductionStartColumn(config = {}) {
        const captionAttrs = config.analysisKey && config.partKey
            ? ` data-report-production-start-caption="${config.partKey}" data-report-production-start-caption-default="${config.caption || ''}"`
            : '';
        return `
            <div class="report-production-start-column">
                <div class="report-production-start-caption"${captionAttrs}>${config.caption || ''}<span></span></div>
                ${buildProductionStartSummaryTable(config)}
                <div class="report-production-start-subcaption">*전년대비 증감 요인</div>
                ${buildProductionStartCauseTable(config)}
                <div class="report-production-start-chart-title">*${config.partLabel || ''} 생산량 현황</div>
                ${buildProductionStartChart(config)}
            </div>
        `;
    }

    function buildProductionStartSlide(config = {}) {
        const analysisAttr = config.productionStartKey ? ` data-report-production-start-analysis="${config.productionStartKey}"` : '';
        return `
            <article class="report-slide report-template-slide report-production-start-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산실적(생산량)">
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-start-layout"${analysisAttr}>
                    ${buildProductionStartColumn({ analysisKey: config.productionStartKey || '', partKey: 'part1',
                        caption: '1) 1파트 생산량 :',
                        partLabel: '1파트',
                        rows: ['SD', 'MSD', '합계']
                    })}
                    ${buildProductionStartColumn({ analysisKey: config.productionStartKey || '', partKey: 'part2',
                        caption: '2) 2파트 생산량 :',
                        partLabel: '2파트',
                        rows: ['ICA', '지대', '합계']
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>3/6</div>
            </article>
        `;
    }

    function buildProductionLaborSummaryTable(partLabel, unitLabel, rows = []) {
        const normalizedRows = rows.length ? rows : [''];
        const bodyRows = normalizedRows.map((rowLabel, index) => `
            <tr${index === normalizedRows.length - 1 && normalizedRows.length > 1 ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-labor-part" rowspan="${normalizedRows.length}">${partLabel}<br><span>(${unitLabel})</span></th>` : ''}
                <th>${rowLabel}</th>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-labor-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionLaborCauseTable(rows = []) {
        const normalizedRows = rows.length ? rows : [''];
        const bodyRows = normalizedRows.map(rowLabel => `
            <tr>
                <th>${rowLabel}</th>
                <td></td>
                <td></td>
            </tr>
        `).join('');
        return `
            <table class="report-production-labor-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionLaborChart(partLabel, variant = 'line-bar') {
        return `
            <div class="report-production-labor-chart is-${variant}" aria-label="${partLabel} 노동생산성 및 인원현황 그래프">
                <div class="report-production-labor-unit">단위: kg/M.hr</div>
                <div class="report-production-labor-chart-grid"></div>
                <div class="report-production-labor-chart-axis is-y"></div>
                <div class="report-production-labor-chart-axis is-x"></div>
                <div class="report-production-labor-chart-legend">
                    <span><i class="is-blue"></i>노동생산성</span>
                    <span><i class="is-orange"></i>인원</span>
                </div>
            </div>
        `;
    }

    function buildProductionLaborColumn(config = {}) {
        return `
            <div class="report-production-labor-column">
                <div class="report-production-labor-caption">${config.caption || ''}<span></span></div>
                ${buildProductionLaborSummaryTable(config.partLabel || '', config.unitLabel || 'kg/M.hr', config.summaryRows || [])}
                <div class="report-production-labor-subcaption">*전년대비 증감 요인</div>
                ${buildProductionLaborCauseTable(config.causeRows || config.summaryRows || [])}
                <div class="report-production-labor-chart-title">*${config.partLabel || ''} 노동생산성 및 인원현황</div>
                ${buildProductionLaborChart(config.partLabel || '', config.chartVariant || 'line-bar')}
            </div>
        `;
    }

    function buildProductionLaborSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-production-labor-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-1 노동생산성">
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-labor-layout">
                    ${buildProductionLaborColumn({
                        caption: '1) 1파트 노동생산성(kg/M.hr):',
                        partLabel: '1파트',
                        summaryRows: ['SD', 'MSD', '합계'],
                        causeRows: ['SD', 'MSD'],
                        chartVariant: 'multi-line'
                    })}
                    ${buildProductionLaborColumn({
                        caption: '2) 2파트 노동생산성(kg/M.hr):',
                        partLabel: '2파트',
                        summaryRows: ['SD'],
                        causeRows: ['SD'],
                        chartVariant: 'line-bar'
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>4/6</div>
            </article>
        `;
    }

    function buildProductionDirectLaborSummaryTable(partLabel) {
        return `
            <table class="report-production-labor-summary-table report-production-direct-summary-table">
                <colgroup>
                    <col class="report-production-direct-col-label">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-rate">
                    <col class="report-production-direct-col-value">
                    <col class="report-production-direct-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>${partLabel}<br><span>(직접노무비/kg)</span></th>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildProductionDirectLaborCauseTable(partLabel) {
        return `
            <table class="report-production-labor-cause-table report-production-direct-cause-table">
                <colgroup>
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
                </colgroup>
                <thead>
                    <tr>
                        <th>구분</th>
                        <th>증감률</th>
                        <th>증감요인</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>${partLabel}</th>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function buildProductionDirectLaborColumn(config = {}) {
        return `
            <div class="report-production-labor-column report-production-direct-column">
                <div class="report-production-labor-caption">${config.caption || ''}<span></span></div>
                ${buildProductionDirectLaborSummaryTable(config.partLabel || '')}
                <div class="report-production-labor-subcaption">* 전년대비 증감 요인</div>
                ${buildProductionDirectLaborCauseTable(config.partLabel || '')}
                <div class="report-production-labor-chart-title">*${config.partLabel || ''} 직접노무비/kg 및 인원현황</div>
                ${buildProductionLaborChart(config.partLabel || '', 'line-bar')}
            </div>
        `;
    }

    function buildProductionDirectLaborSlide(config = {}) {
        return `
            <article class="report-slide report-template-slide report-production-labor-slide report-production-direct-labor-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-1 노동생산성 직접노무비/kg">
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-labor-layout">
                    ${buildProductionDirectLaborColumn({
                        caption: '3) 1파트 노동생산성(직접노무비/kg) :',
                        partLabel: '1파트'
                    })}
                    ${buildProductionDirectLaborColumn({
                        caption: '4) 2파트 노동생산성 (직접노무비/kg) :',
                        partLabel: '2파트'
                    })}
                </div>
                <div class="report-production-direct-note">※ 직접노무비/kg 상승요인은 추후 연동 데이터 기준으로 산출</div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>5/6</div>
            </article>
        `;
    }

    function buildProductionYieldSummaryTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const normalizedRows = (Array.isArray(config.rows) && config.rows.length ? config.rows : [{ key: 'total', label: '' }])
            .map((row, index, list) => (typeof row === 'string'
                ? { key: index === list.length - 1 && list.length > 1 ? 'total' : `row${index + 1}`, label: row }
                : { key: String(row?.key || `row${index + 1}`).trim(), label: row?.label || '' }));
        const bodyRows = normalizedRows.map((row, index) => {
            const rowKey = row.key || `row${index + 1}`;
            return `
            <tr${rowKey === 'total' || (index === normalizedRows.length - 1 && normalizedRows.length > 1) ? ' class="is-total"' : ''}>
                ${index === 0 ? `<th class="report-production-yield-part" rowspan="${normalizedRows.length}">${partLabel}<br><span>(%)</span></th>` : ''}
                <th>${row.label || ''}</th>
                <td data-report-production-yield-value="${partKey}.${rowKey}.current"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.previous"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.momIndex"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.reference"></td>
                <td data-report-production-yield-value="${partKey}.${rowKey}.yoyIndex"></td>
            </tr>
        `;
        }).join('');
        return `
            <table class="report-production-yield-summary-table">
                <colgroup>
                    <col class="report-production-col-part">
                    <col class="report-production-col-item">
                    <col class="report-production-col-value">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                    <col class="report-production-col-value">
                    <col class="report-production-col-rate">
                </colgroup>
                <thead>
                    <tr>
                        <th colspan="2">구분</th>
                        <th>당월실적</th>
                        <th>전월실적</th>
                        <th>전월대비(%)</th>
                        <th>전년동기</th>
                        <th>전년대비(%)</th>
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionYieldCauseTable(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const causeRows = (Array.isArray(config.causeRows) && config.causeRows.length ? config.causeRows : [{ key: 'total', label: partLabel }])
            .map((row, index) => ({ key: String(row?.key || `row${index + 1}`).trim(), label: row?.label || partLabel }));
        const compact = causeRows.length === 1 && causeRows[0].key === 'total';
        const colgroup = compact
            ? `
                    <col class="report-production-cause-col-item-wide">
                    <col class="report-production-cause-col-rate-wide">
                    <col class="report-production-cause-col-reason-wide">
            `
            : `
                    <col class="report-production-cause-col-part">
                    <col class="report-production-cause-col-item">
                    <col class="report-production-cause-col-rate">
                    <col class="report-production-cause-col-reason">
            `;
        const header = compact
            ? '<th>구분</th><th>증감률</th><th>증감요인</th>'
            : '<th>구분</th><th>설비별</th><th>증감률</th><th>증감요인</th>';
        const bodyRows = compact ? causeRows.map(row => `
                    <tr>
                        <th>${partLabel}</th>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.yoyDelta"></td>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.reason"></td>
                    </tr>
        `).join('') : causeRows.map((row, index) => `
                    <tr>
                        ${index === 0 ? `<th class="report-production-yield-part" rowspan="${causeRows.length}">${partLabel}</th>` : ''}
                        <th>${row.label || ''}</th>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.yoyDelta"></td>
                        <td data-report-production-yield-cause="${partKey}.${row.key}.reason"></td>
                    </tr>
        `).join('');
        return `
            <table class="report-production-yield-cause-table">
                <colgroup>
${colgroup}
                </colgroup>
                <thead>
                    <tr>
                        ${header}
                    </tr>
                </thead>
                <tbody>${bodyRows}</tbody>
            </table>
        `;
    }

    function buildProductionYieldChart(config = {}) {
        const partLabel = config.partLabel || '';
        const partKey = String(config.partKey || '').trim();
        const variant = config.chartVariant || 'dual-line';
        const analysisKey = String(config.analysisKey || '').trim();
        const chartKey = analysisKey && partKey ? `production-yield:${analysisKey}:${partKey}` : '';
        return `
            <div class="report-production-yield-chart is-${variant}" aria-label="${partLabel} 수율 현황 그래프">
                ${parts.buildReportChartHighlightControls(chartKey, partKey)}
                <div class="report-production-yield-unit">단위: %</div>
                <div class="report-production-yield-chart-grid"></div>
                <div class="report-production-yield-chart-axis is-y"></div>
                <div class="report-production-yield-chart-axis is-x"></div>
                <div class="report-production-yield-chart-plot" data-report-production-yield-chart-plot="${partKey}" aria-label="${partLabel} 수율 현황"></div>
                <div class="report-production-yield-chart-legend">
                    <span><i class="is-blue"></i>전년</span>
                    <span><i class="is-red"></i>금년</span>
                    <span><i class="is-green"></i>수율</span>
                </div>
            </div>
        `;
    }

    function buildProductionYieldColumn(config = {}) {
        const partKey = String(config.partKey || '').trim();
        return `
            <div class="report-production-yield-column">
                <div class="report-production-yield-caption" data-report-production-yield-caption="${partKey}" data-report-production-yield-caption-default="${config.caption || ''}">${config.caption || ''}</div>
                ${buildProductionYieldSummaryTable(config)}
                <div class="report-production-yield-subcaption">* 전년대비 증감 요인</div>
                ${buildProductionYieldCauseTable(config)}
                <div class="report-production-yield-chart-title">*${config.partLabel || ''} 수율 현황</div>
                ${buildProductionYieldChart(config)}
            </div>
        `;
    }

    function buildProductionYieldSlide(config = {}) {
        const analysisKey = String(config.productionYieldKey || config.productionStartKey || '').trim();
        const analysisAttr = analysisKey ? ` data-report-production-yield-analysis="${analysisKey}"` : '';
        return `
            <article class="report-slide report-template-slide report-production-yield-slide" data-report-slide-page="${config.pageIndex}" data-report-slide-view="${config.view}" data-report-slide-label="생산지표 2-2 수율"${analysisAttr}>
                ${parts.buildSlideHeader(config.sectionKey, config.titleKey)}
                <div class="report-production-yield-layout">
                    ${buildProductionYieldColumn({
                        caption: '1) 1파트 수율 :',
                        analysisKey,
                        partKey: 'part1',
                        partLabel: '1파트',
                        rows: [
                            { key: 'sd', label: 'SD' },
                            { key: 'msd', label: 'MSD' },
                            { key: 'total', label: '합계' }
                        ],
                        causeRows: [
                            { key: 'sd', label: 'SD' },
                            { key: 'msd', label: 'MSD' }
                        ],
                        chartVariant: 'dual-line'
                    })}
                    ${buildProductionYieldColumn({
                        caption: '2) 2파트 수율 :',
                        analysisKey,
                        partKey: 'part2',
                        partLabel: '2파트',
                        rows: [{ key: 'total', label: '2파트 수율(%)' }],
                        causeRows: [{ key: 'total', label: '2파트' }],
                        chartVariant: 'single-line'
                    })}
                </div>
                <div class="report-slide-footer"></div>
                <img class="report-slide-logo is-bottom" src="shared-assets/report-footer-logo.png" alt="">
                <div class="report-slide-page-number" data-report-page-number>6/6</div>
            </article>
        `;
    }

    Object.assign(parts, {
        buildAnalysisSlide,
        buildYusanLpgCostAnalysisSlide,
        buildYusanLpgMetricTable,
        buildYusanLpgCostTable,
        buildYusanLpgChart,
        buildYusanLpgMemoBox,
        buildBukjeongUtilityAnalysisSlide,
        buildYusanUtilityAnalysisSlide,
        buildUtilityAutoAnalysisSlide,
        buildWasteSlide,
        buildWasteAutoMetricTable,
        buildWasteAutoAnalysisSlide,
        buildReportMemoDialog,
        buildReportMemoOverviewDialog,
        getProductionStartRowKey,
        normalizeProductionStartRows,
        buildProductionStartValueAttr,
        buildProductionStartCauseAttr,
        buildProductionStartSummaryTable,
        buildProductionStartCauseTable,
        buildProductionStartChart,
        buildProductionStartColumn,
        buildProductionStartSlide,
        buildProductionLaborSummaryTable,
        buildProductionLaborCauseTable,
        buildProductionLaborChart,
        buildProductionLaborColumn,
        buildProductionLaborSlide,
        buildProductionDirectLaborSummaryTable,
        buildProductionDirectLaborCauseTable,
        buildProductionDirectLaborColumn,
        buildProductionDirectLaborSlide,
        buildProductionYieldSummaryTable,
        buildProductionYieldCauseTable,
        buildProductionYieldChart,
        buildProductionYieldColumn,
        buildProductionYieldSlide,
    });
})(this);
