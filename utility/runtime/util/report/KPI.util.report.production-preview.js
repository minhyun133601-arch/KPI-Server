        const UTIL_REPORT_OVERVIEW_COST_CARDS = [
            { valueRole: 'util-report-total-cost', shareRole: 'util-report-total-share', label: '총액', icon: 'fa-chart-pie', tone: 'overview-total' },
            { valueRole: 'util-report-electric-cost', shareRole: 'util-report-electric-share', label: '전기', icon: 'fa-bolt', tone: 'overview-electric' },
            { valueRole: 'util-report-gas-cost', shareRole: 'util-report-gas-share', label: '가스', icon: 'fa-fire-flame-curved', tone: 'overview-gas' },
            { valueRole: 'util-report-waste-cost', shareRole: 'util-report-waste-share', label: '폐수', icon: 'fa-water', tone: 'overview-waste' }
        ];
        const UTIL_REPORT_YUSAN_PRODUCTION_SHARE_TEAMS = [
            { label: '1팀 2파트', icon: 'fa-industry' },
            { label: '2팀', icon: 'fa-boxes-stacked' },
            { label: '3팀', icon: 'fa-flask' }
        ];

        function escapeUtilReportPreviewHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));
        }

        function buildUtilReportPreviewKpiCardHtml(item) {
            const valueRoleAttr = item.valueRole ? ` data-role="${escapeUtilReportPreviewHtml(item.valueRole)}"` : '';
            const subRoleAttr = item.shareRole ? ` data-role="${escapeUtilReportPreviewHtml(item.shareRole)}"` : '';
            return `
                <div class="util-report-kpi" data-tone="${escapeUtilReportPreviewHtml(item.tone || 'neutral')}">
                    <div class="util-report-kpi-head">
                        <span class="util-report-kpi-icon" aria-hidden="true"><i class="fa-solid ${escapeUtilReportPreviewHtml(item.icon || 'fa-circle')}"></i></span>
                        <span class="util-report-kpi-label">${escapeUtilReportPreviewHtml(item.label)}</span>
                    </div>
                    <strong class="util-report-kpi-value"${valueRoleAttr}>${escapeUtilReportPreviewHtml(item.value)}</strong>
                    <span class="util-report-kpi-sub"${subRoleAttr}>${escapeUtilReportPreviewHtml(item.sub || '')}</span>
                </div>
            `;
        }

        function buildUtilReportPreviewProductionState(teamName) {
            return {
                ...UtilReportState,
                categoryKey: 'production',
                productionTeam: teamName,
                selectedScopeKeys: Array.isArray(UtilReportState.selectedScopeKeys)
                    ? UtilReportState.selectedScopeKeys.slice()
                    : ['electric', 'gas', 'waste']
            };
        }

        function getUtilReportPreviewProductionTotal(teamName) {
            if (typeof buildUtilReportMonthlyRows !== 'function' || typeof UtilReportState !== 'object' || !UtilReportState) {
                return null;
            }
            try {
                const result = buildUtilReportMonthlyRows(buildUtilReportPreviewProductionState(teamName));
                const production = Number(result?.summary?.production);
                return Number.isFinite(production) && production > 0 ? production : 0;
            } catch (error) {
                console.warn?.('[KPI] Failed to build utility preview production share.', error);
                return null;
            }
        }

        function buildUtilReportPreviewProductionShareCards() {
            const teamItems = UTIL_REPORT_YUSAN_PRODUCTION_SHARE_TEAMS.map(team => ({
                ...team,
                production: getUtilReportPreviewProductionTotal(team.label)
            }));
            if (teamItems.some(item => item.production === null)) return [];

            const totalProduction = teamItems.reduce((sum, item) => sum + (Number(item.production) || 0), 0);
            if (!Number.isFinite(totalProduction) || totalProduction <= 0) return [];

            const totalCard = {
                label: '유산 생산량',
                value: `${formatUtilNumber(totalProduction, 0)} kg`,
                sub: '1팀 2파트 + 2팀 + 3팀',
                icon: 'fa-scale-balanced',
                tone: 'production'
            };
            const teamCards = teamItems.map(team => ({
                label: team.label,
                value: `${formatUtilNumber((Number(team.production) / totalProduction) * 100, 1)}%`,
                sub: `${formatUtilNumber(Number(team.production) || 0, 0)} kg`,
                icon: team.icon,
                tone: 'production'
            }));
            return [totalCard, ...teamCards];
        }

        function enhanceUtilReportOverviewCards(panel) {
            if (!panel || panel.dataset.overviewCardsEnhanced === 'true') return;
            UTIL_REPORT_OVERVIEW_COST_CARDS.forEach(item => {
                const valueEl = panel.querySelector(`[data-role="${item.valueRole}"]`);
                const shareEl = panel.querySelector(`[data-role="${item.shareRole}"]`);
                const cardEl = valueEl?.closest('.util-report-kpi');
                if (!valueEl || !shareEl || !cardEl) return;
                cardEl.dataset.tone = item.tone;
                cardEl.innerHTML = `
                    <div class="util-report-kpi-head">
                        <span class="util-report-kpi-icon" aria-hidden="true"><i class="fa-solid ${item.icon}"></i></span>
                        <span class="util-report-kpi-label">${item.label}</span>
                    </div>
                    <strong class="util-report-kpi-value" data-role="${item.valueRole}">${valueEl.textContent || '-'}</strong>
                    <span class="util-report-kpi-sub" data-role="${item.shareRole}">${shareEl.textContent || '-'}</span>
                `;
            });
            panel.dataset.overviewCardsEnhanced = 'true';
        }

        function renderUtilReportPreview(panel, result) {
            if (!panel) return;
            const kpiGridEl = panel.querySelector('.util-report-kpi-grid');
            const rangeEl = panel.querySelector('[data-role="util-report-range"]');
            const monthCountEl = panel.querySelector('[data-role="util-report-month-count"]');
            const totalCostEl = panel.querySelector('[data-role="util-report-total-cost"]');
            const avgCostEl = panel.querySelector('[data-role="util-report-avg-cost"]');
            const electricCostEl = panel.querySelector('[data-role="util-report-electric-cost"]');
            const gasCostEl = panel.querySelector('[data-role="util-report-gas-cost"]');
            const wasteCostEl = panel.querySelector('[data-role="util-report-waste-cost"]');
            const totalShareEl = panel.querySelector('[data-role="util-report-total-share"]');
            const electricShareEl = panel.querySelector('[data-role="util-report-electric-share"]');
            const gasShareEl = panel.querySelector('[data-role="util-report-gas-share"]');
            const wasteShareEl = panel.querySelector('[data-role="util-report-waste-share"]');
            const electricUnitEl = panel.querySelector('[data-role="util-report-electric-unit"]');
            const gasUnitEl = panel.querySelector('[data-role="util-report-gas-unit"]');
            const wasteUnitEl = panel.querySelector('[data-role="util-report-waste-unit"]');
            const totalUnitEl = panel.querySelector('[data-role="util-report-total-unit"]');
            const noteEl = panel.querySelector('[data-role="util-report-note"]');

            if (kpiGridEl) {
                kpiGridEl.innerHTML = '';
                kpiGridEl.hidden = true;
            }

            const unitLabel = getUtilReportUnitLabel(UtilReportState.unitKey);
            const decimals = UtilReportState.decimals;

            if (!result || !Array.isArray(result.rows) || !result.rows.length) {
                if (rangeEl) rangeEl.textContent = '-';
                if (monthCountEl) monthCountEl.textContent = '0';
                if (totalCostEl) totalCostEl.textContent = '-';
                if (avgCostEl) avgCostEl.textContent = '-';
                if (electricCostEl) electricCostEl.textContent = '-';
                if (gasCostEl) gasCostEl.textContent = '-';
                if (wasteCostEl) wasteCostEl.textContent = '-';
                if (totalShareEl) totalShareEl.textContent = '-';
                if (electricShareEl) electricShareEl.textContent = '-';
                if (gasShareEl) gasShareEl.textContent = '-';
                if (wasteShareEl) wasteShareEl.textContent = '-';
                if (electricUnitEl) electricUnitEl.textContent = '-';
                if (gasUnitEl) gasUnitEl.textContent = '-';
                if (wasteUnitEl) wasteUnitEl.textContent = '-';
                if (totalUnitEl) totalUnitEl.textContent = '-';
                if (noteEl) noteEl.textContent = '총괄 비율을 불러올 데이터가 없습니다.';
                return;
            }

            const totalCost = Number(result.summary.totalCost) || 0;
            const electricCost = Number(result.summary.electricCost) || 0;
            const gasCost = Number(result.summary.gasCost) || 0;
            const wasteCost = Number(result.summary.wasteCost) || 0;
            const formatShare = value => totalCost > 0
                ? `구성비 ${formatUtilNumber((value / totalCost) * 100, 1)}%`
                : '구성비 -';
            const overviewItems = [
                {
                    ...UTIL_REPORT_OVERVIEW_COST_CARDS[0],
                    value: `${formatUtilReportScaled(totalCost, UtilReportState.unitKey, decimals)} ${unitLabel}`,
                    sub: totalCost > 0 ? '구성비 100.0%' : '구성비 -'
                },
                {
                    ...UTIL_REPORT_OVERVIEW_COST_CARDS[1],
                    value: `${formatUtilReportScaled(electricCost, UtilReportState.unitKey, decimals)} ${unitLabel}`,
                    sub: formatShare(electricCost)
                },
                {
                    ...UTIL_REPORT_OVERVIEW_COST_CARDS[2],
                    value: `${formatUtilReportScaled(gasCost, UtilReportState.unitKey, decimals)} ${unitLabel}`,
                    sub: formatShare(gasCost)
                },
                {
                    ...UTIL_REPORT_OVERVIEW_COST_CARDS[3],
                    value: `${formatUtilReportScaled(wasteCost, UtilReportState.unitKey, decimals)} ${unitLabel}`,
                    sub: formatShare(wasteCost)
                },
                ...buildUtilReportPreviewProductionShareCards()
            ];

            if (rangeEl) rangeEl.textContent = result.rangeLabel;
            if (monthCountEl) monthCountEl.textContent = `${formatUtilNumber(result.monthCount)}개월`;
            if (totalCostEl) totalCostEl.textContent = `${formatUtilReportScaled(totalCost, UtilReportState.unitKey, decimals)} ${unitLabel}`;
            if (avgCostEl) avgCostEl.textContent = `${formatUtilReportScaled(result.summary.averageCost, UtilReportState.unitKey, decimals)} ${unitLabel}`;
            if (electricCostEl) electricCostEl.textContent = `${formatUtilReportScaled(electricCost, UtilReportState.unitKey, decimals)} ${unitLabel}`;
            if (gasCostEl) gasCostEl.textContent = `${formatUtilReportScaled(gasCost, UtilReportState.unitKey, decimals)} ${unitLabel}`;
            if (wasteCostEl) wasteCostEl.textContent = `${formatUtilReportScaled(wasteCost, UtilReportState.unitKey, decimals)} ${unitLabel}`;
            if (totalShareEl) totalShareEl.textContent = totalCost > 0 ? '구성비 100.0%' : '구성비 -';
            if (electricShareEl) electricShareEl.textContent = formatShare(electricCost);
            if (gasShareEl) gasShareEl.textContent = formatShare(gasCost);
            if (wasteShareEl) wasteShareEl.textContent = formatShare(wasteCost);
            if (electricUnitEl) electricUnitEl.textContent = Number.isFinite(result.summary.electricUnit)
                ? `${formatUtilReportScaled(result.summary.electricUnit, UtilReportState.unitKey, decimals)} ${unitLabel}/kg`
                : '-';
            if (gasUnitEl) gasUnitEl.textContent = Number.isFinite(result.summary.gasUnit)
                ? `${formatUtilReportScaled(result.summary.gasUnit, UtilReportState.unitKey, decimals)} ${unitLabel}/kg`
                : '-';
            if (wasteUnitEl) wasteUnitEl.textContent = Number.isFinite(result.summary.wasteUnit)
                ? `${formatUtilReportScaled(result.summary.wasteUnit, UtilReportState.unitKey, decimals)} ${unitLabel}/kg`
                : '-';
            if (totalUnitEl) totalUnitEl.textContent = Number.isFinite(result.summary.totalUnit)
                ? `${formatUtilReportScaled(result.summary.totalUnit, UtilReportState.unitKey, decimals)} ${unitLabel}/kg`
                : '-';
            if (kpiGridEl) {
                kpiGridEl.innerHTML = overviewItems.map(buildUtilReportPreviewKpiCardHtml).join('');
                kpiGridEl.hidden = !overviewItems.length;
            }
            if (noteEl) noteEl.textContent = '총액 구성비와 유산 생산량 비율을 같은 기준월 범위로 표시합니다. 가스 유산 기준은 기존처럼 1팀 2파트 + 3팀을 유지합니다.';
        }
