(function (root) {
    const parts = root[Symbol.for('kpi.energy.kpi.parts')] ||= Object.create(null);

    function escapeEnergyKpiHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    }

    function formatEnergyKpiNumber(value, decimals = 0) {
        return Number.isFinite(value)
            ? value.toLocaleString('ko-KR', { maximumFractionDigits: decimals })
            : '—';
    }

    function buildEnergyKpiValueHtml(value, unit, decimals = 0) {
        return `<strong>${formatEnergyKpiNumber(value, decimals)}</strong><span>${escapeEnergyKpiHtml(unit)}</span>`;
    }

    function buildEnergyKpiShareBarHtml(value, label, tone = 'electric') {
        const safeTone = ['electric', 'gas', 'lng', 'lpg', 'production'].includes(tone) ? tone : 'electric';
        const width = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
        const text = Number.isFinite(value) ? `${formatEnergyKpiNumber(value, 1)}%` : '자료 없음';
        return `<span class="energy-kpi-share-track is-${safeTone}" role="img" aria-label="${escapeEnergyKpiHtml(`${label} ${text}`)}"><span style="width:${width}%"></span></span>`;
    }

    function buildEnergyKpiCoverageHtml(report) {
        const included = Number.isFinite(report.coverage?.included) ? report.coverage.included : 0;
        const total = Number.isFinite(report.coverage?.total) ? report.coverage.total : 0;
        const excluded = Array.isArray(report.excludedMonthKeys) ? report.excludedMonthKeys : [];
        return `
            <div class="energy-kpi-coverage" data-energy-kpi-coverage>
                <div><strong>데이터 포함 ${included} / ${total}개월</strong><span>열량과 생산량이 모두 입력된 같은 월을 집계합니다.</span></div>
                ${excluded.length ? `<details class="energy-kpi-missing-months"><summary>제외된 ${excluded.length}개월 확인</summary><p>${excluded.map(escapeEnergyKpiHtml).join(' · ')}</p><p>해당 월의 열량 또는 생산량 입력을 확인해 주세요.</p></details>` : `<span class="energy-kpi-coverage-complete">${total > 0 ? '선택 기간 전체 포함' : '선택 기간 확인'}</span>`}
            </div>
        `;
    }

    function buildEnergyKpiSummaryHtml(report) {
        const totals = report.totals || {};
        const hasMonths = Number(report.coverage?.included) > 0;
        const intensityNote = !hasMonths ? '열량과 생산량이 모두 입력된 월이 필요합니다.'
            : totals.productionKg === 0 ? '생산량이 0 kg이므로 원단위를 산출할 수 없습니다.'
                : '열량과 생산량이 모두 입력된 월을 합산하여 계산합니다.';
        return `
            <article class="energy-kpi-metric is-primary">
                <div class="energy-kpi-summary-main">
                    <div class="energy-kpi-metric-label">기간 원단위</div>
                    <div class="energy-kpi-metric-value" data-energy-kpi-value="intensity">${buildEnergyKpiValueHtml(totals.intensity, 'kcal/kg', 1)}</div>
                </div>
                <div class="energy-kpi-summary-basis">
                    <div class="energy-kpi-metric-formula">Σ 열량 / Σ 생산량</div>
                    <p>${escapeEnergyKpiHtml(intensityNote)}</p>
                </div>
            </article>
        `;
    }

    function buildEnergyKpiMonthlyHtml(report) {
        const monthly = Array.isArray(report.monthly) ? report.monthly : [];
        const valueHtml = (value, decimals = 0) => Number.isFinite(value)
            ? formatEnergyKpiNumber(value, decimals)
            : '<span class="energy-kpi-monthly-missing">미입력</span>';
        const rows = monthly.map(row => {
            const intensity = Number.isFinite(row.intensity) ? formatEnergyKpiNumber(row.intensity, 1)
                : row.productionKg === 0 && Number.isFinite(row.energyKcal)
                    ? '<span class="energy-kpi-monthly-missing">산출 불가</span>'
                    : '<span class="energy-kpi-monthly-missing">—</span>';
            return `<tr${row.complete === true ? '' : ' class="is-incomplete"'}><th scope="row">${escapeEnergyKpiHtml(row.monthKey)}</th><td>${valueHtml(row.productionKg, 1)}</td><td>${valueHtml(row.energyKcal)}</td><td class="energy-kpi-monthly-intensity">${intensity}</td></tr>`;
        }).join('');
        return `
            <section class="energy-kpi-panel energy-kpi-monthly-panel" aria-label="월별 생산량과 열량">
                <div class="energy-kpi-panel-heading"><h3>월별 생산량 · 열량</h3><span>선택한 모든 월 표시</span></div>
                <div class="energy-kpi-monthly-scroll">
                    <table class="energy-kpi-monthly-table" data-energy-kpi-monthly-table>
                        <thead><tr><th scope="col">월</th><th scope="col">생산량 <small>kg</small></th><th scope="col">열량 <small>kcal</small></th><th scope="col">원단위 <small>kcal/kg</small></th></tr></thead>
                        <tbody>${rows || '<tr><td colspan="4" class="energy-kpi-table-empty">선택 기간에 해당하는 월이 없습니다.</td></tr>'}</tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function buildEnergyKpiFuelHtml(report) {
        const totals = report.totals || {};
        const shares = totals.shares || {};
        const gasChildren = [
            { key: 'lng', label: 'LNG', value: totals.lngKcal, gasShare: totals.lngOfGasShare, totalShare: shares.lng },
            { key: 'lpg', label: 'LPG', value: totals.lpgKcal, gasShare: totals.lpgOfGasShare, totalShare: shares.lpg }
        ];
        return `
            <section class="energy-kpi-panel" aria-label="에너지원별 열량 비중">
                <div class="energy-kpi-panel-heading"><h3>에너지원별 구성</h3><span>포함월 총열량 기준</span></div>
                <div class="energy-kpi-fuel-grid">
                    <article class="energy-kpi-fuel-card is-electric">
                        <div class="energy-kpi-fuel-heading"><h4><span class="energy-kpi-dot is-electric"></span>전기</h4><strong>전체 열량 대비</strong></div>
                        <div class="energy-kpi-fuel-value">${buildEnergyKpiValueHtml(shares.electric, '%', 1)}</div>
                        ${buildEnergyKpiShareBarHtml(shares.electric, '전기 전체 열량 비중', 'electric')}
                    </article>
                    <article class="energy-kpi-fuel-card is-gas">
                        <div class="energy-kpi-fuel-heading"><h4><span class="energy-kpi-dot is-gas"></span>가스</h4><strong>전체 열량 대비</strong></div>
                        <div class="energy-kpi-fuel-value">${buildEnergyKpiValueHtml(shares.gas, '%', 1)}</div>
                        ${buildEnergyKpiShareBarHtml(shares.gas, '가스 전체 열량 비중', 'gas')}
                        <div class="energy-kpi-gas-children">${gasChildren.map(fuel => `
                            <div class="energy-kpi-gas-child">
                                <div><strong>${fuel.label}</strong><span>${formatEnergyKpiNumber(fuel.value)} kcal</span></div>
                                <p>가스 내 ${formatEnergyKpiNumber(fuel.gasShare, 1)}% <span>· 전체 ${formatEnergyKpiNumber(fuel.totalShare, 1)}%</span></p>
                                ${buildEnergyKpiShareBarHtml(fuel.gasShare, `${fuel.label} 가스 내 열량 비중`, fuel.key)}
                            </div>
                        `).join('')}</div>
                    </article>
                </div>
            </section>
        `;
    }

    function buildEnergyKpiTeamsHtml(report) {
        const teams = Array.isArray(report.teams) ? report.teams : [];
        return `
            <section class="energy-kpi-panel" aria-label="팀별 에너지 원단위">
                <div class="energy-kpi-panel-heading"><h3>팀별 비교</h3><span>선택 범위 · 동일한 포함월 기준</span></div>
                <div class="energy-kpi-table-scroll">
                    <table class="energy-kpi-team-table">
                        <thead><tr><th scope="col">팀</th><th scope="col">열량 <small>kcal</small></th><th scope="col">생산량 <small>kg</small></th><th scope="col">원단위 <small>kcal/kg</small></th><th scope="col">열량 비중</th><th scope="col">생산량 비중</th></tr></thead>
                        <tbody>${teams.map(team => `
                            <tr>
                                <th scope="row"><button type="button" class="energy-kpi-team-button" data-energy-kpi-team="${escapeEnergyKpiHtml(team.key)}" aria-label="${escapeEnergyKpiHtml(`${team.label || team.key} KPI 보기`)}" onclick="KpiEnergyDashboard.selectTeam(this)">${escapeEnergyKpiHtml(team.label || team.key)}<span aria-hidden="true">›</span></button></th>
                                <td>${formatEnergyKpiNumber(team.energyKcal)}</td>
                                <td>${formatEnergyKpiNumber(team.productionKg, 1)}</td>
                                <td class="energy-kpi-table-intensity">${formatEnergyKpiNumber(team.intensity, 1)}</td>
                                <td><span class="energy-kpi-table-share">${formatEnergyKpiNumber(team.energyShare, 1)}%</span>${buildEnergyKpiShareBarHtml(team.energyShare, `${team.label || ''} 열량 비중`, 'electric')}</td>
                                <td><span class="energy-kpi-table-share">${formatEnergyKpiNumber(team.productionShare, 1)}%</span>${buildEnergyKpiShareBarHtml(team.productionShare, `${team.label || ''} 생산량 비중`, 'production')}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="6" class="energy-kpi-table-empty">표시할 팀 자료가 없습니다.</td></tr>'}</tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function buildEnergyKpiConversionCellHtml(component) {
        if (component?.applicable === false) return '<span class="energy-kpi-muted">미사용 · 합산 제외</span>';
        if (!Number.isFinite(component?.amount) || !Number.isFinite(component?.kcal)) return '<span class="energy-kpi-muted">미입력</span>';
        return `<span>${formatEnergyKpiNumber(component.amount, 3)} ${escapeEnergyKpiHtml(component.unit)} × ${formatEnergyKpiNumber(component.factor, 6)}</span><strong>= ${formatEnergyKpiNumber(component.kcal, 2)} kcal</strong>`;
    }

    function buildEnergyKpiConversionHtml(report) {
        const factors = report.factors || {};
        const monthly = Array.isArray(report.monthly) ? report.monthly : [];
        const rows = monthly.map(row => {
            const components = new Map((row.components || []).map(component => [component.key, component]));
            return `<tr><th scope="row">${escapeEnergyKpiHtml(row.monthKey)}</th>${['electric', 'lng', 'lpg'].map(key => `<td>${buildEnergyKpiConversionCellHtml(components.get(key))}</td>`).join('')}<td>${formatEnergyKpiNumber(row.energyKcal, 2)}</td><td>${formatEnergyKpiNumber(row.productionKg, 1)}</td><td>${row.complete ? '집계 포함' : '집계 제외'}</td></tr>`;
        }).join('');
        return `
            <section class="energy-kpi-conversion energy-kpi-panel" data-energy-kpi-conversion>
                <div class="energy-kpi-panel-heading"><h3>변환 과정 <span class="energy-kpi-help" aria-hidden="true">?</span></h3><span>월별 사용량 × 환산계수</span></div>
                <div class="energy-kpi-conversion-content">
                    <p>월별 열량 = 전기 사용량 × 전기 환산계수 + LNG 사용량 × LNG 환산계수 + LPG 사용량 × LPG 환산계수</p>
                    <p>전기 ${formatEnergyKpiNumber(factors.electric, 6)} kcal/kWh · LNG ${formatEnergyKpiNumber(factors.lng, 6)} kcal/Nm³ · LPG ${formatEnergyKpiNumber(factors.lpg, 6)} kcal/kg</p>
                    <p>최종에너지 기준 · 1 kcal = ${formatEnergyKpiNumber(factors.kjPerKcal, 4)} kJ. 미사용 연료는 합산에서 제외하고 미입력 값은 자료 없음으로 표시합니다.</p>
                    <div class="energy-kpi-table-scroll"><table class="energy-kpi-conversion-table"><thead><tr><th scope="col">월</th><th scope="col">전기</th><th scope="col">LNG</th><th scope="col">LPG</th><th scope="col">월 열량 <small>kcal</small></th><th scope="col">생산량 <small>kg</small></th><th scope="col">기간 집계</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="energy-kpi-table-empty">선택 기간에 해당하는 월이 없습니다.</td></tr>'}</tbody></table></div>
                </div>
            </section>
        `;
    }

    const DETAIL_PANELS = [
        { key: 'monthly', label: '월별 표', build: buildEnergyKpiMonthlyHtml },
        { key: 'composition', label: '에너지 구성', build: buildEnergyKpiFuelHtml },
        { key: 'teams', label: '팀별 비교', build: buildEnergyKpiTeamsHtml },
        { key: 'conversion', label: '변환 과정', build: buildEnergyKpiConversionHtml }
    ];

    function buildEnergyKpiDetailActionsHtml() {
        return `<div class="energy-kpi-detail-actions" aria-label="KPI 상세 자료 열기"><span>상세 자료</span>${DETAIL_PANELS.map(panel => `
            <button type="button" data-energy-kpi-panel-open="${panel.key}" onclick="KpiEnergyDashboard.openPanel(this)" aria-expanded="false" aria-controls="energy-kpi-details">${panel.label}${panel.key === 'conversion' ? ' <span class="energy-kpi-help" aria-hidden="true">?</span>' : ''}</button>
        `).join('')}</div>`;
    }

    function buildEnergyKpiDrawerHtml(report) {
        const months = Array.isArray(report.monthKeys) ? report.monthKeys : [];
        const periodLabel = months.length ? `${months[0]} — ${months[months.length - 1]}` : '선택 기간 없음';
        return `
            <aside class="energy-kpi-drawer" data-energy-kpi-drawer id="energy-kpi-details" hidden role="dialog" aria-label="KPI 상세 자료" tabindex="-1">
                <header class="energy-kpi-drawer-header" data-energy-kpi-drag-handle title="드래그하여 이동">
                    <div class="energy-kpi-drawer-title" data-energy-kpi-drag-keyboard tabindex="0" role="group" aria-label="상세 창 이동" aria-describedby="energy-kpi-move-hint"><span>KPI 상세 자료</span><h3>${escapeEnergyKpiHtml(report.scopeLabel || '전체')}</h3><p>${escapeEnergyKpiHtml(periodLabel)}</p><small id="energy-kpi-move-hint">드래그하여 이동 · 방향키로 이동</small></div>
                    <div class="energy-kpi-drawer-actions">
                        <button type="button" data-energy-kpi-popout onclick="KpiEnergyDashboard.detachPanel(this)" title="다른 모니터로 옮길 수 있는 별도 창으로 열기">새 창으로 <span aria-hidden="true">↗</span></button>
                        <button type="button" data-energy-kpi-panel-close onclick="KpiEnergyDashboard.closePanel(this)" aria-label="상세 자료 닫기">닫기 <span aria-hidden="true">×</span></button>
                    </div>
                </header>
                <p class="energy-kpi-popup-status" data-energy-kpi-popup-status hidden role="status"></p>
                <div class="energy-kpi-drawer-tabs" role="tablist" aria-label="상세 자료 종류">${DETAIL_PANELS.map(panel => `
                    <button type="button" id="energy-kpi-tab-${panel.key}" role="tab" aria-selected="false" aria-controls="energy-kpi-panel-${panel.key}" data-energy-kpi-panel-tab="${panel.key}" onclick="KpiEnergyDashboard.selectPanel(this)">${panel.label}</button>
                `).join('')}</div>
                <div class="energy-kpi-drawer-body" data-energy-kpi-drawer-scroll>${DETAIL_PANELS.map(panel => `
                    <div id="energy-kpi-panel-${panel.key}" data-energy-kpi-panel-content="${panel.key}" hidden role="tabpanel" aria-labelledby="energy-kpi-tab-${panel.key}">${panel.build(report)}</div>
                `).join('')}
                    <p class="energy-kpi-data-note">—: 미입력 자료 또는 생산량 0으로 산출할 수 없는 값</p>
                </div>
            </aside>
        `;
    }

    function buildEnergyKpiReportHtml(report = {}) {
        return `
            <div class="energy-kpi-report" data-energy-kpi-report>
                <div class="energy-kpi-main" data-energy-kpi-main>
                    ${buildEnergyKpiSummaryHtml(report)}
                    ${buildEnergyKpiCoverageHtml(report)}
                    ${buildEnergyKpiDetailActionsHtml()}
                    <section class="energy-kpi-panel energy-kpi-trend-panel" aria-label="월별 생산량과 열량 겹쳐보기">
                        <div class="energy-kpi-panel-heading"><h3>월별 겹쳐보기</h3><span>생산량 · 열량 · 원단위</span></div>
                        <div class="energy-kpi-analysis-mount experiment-chart-mount" data-exp-report-chart-style="report-auto" data-energy-kpi-chart></div>
                    </section>
                </div>
                ${buildEnergyKpiDrawerHtml(report)}
            </div>
        `;
    }

    Object.assign(parts, { buildEnergyKpiReportHtml });
})(this);
