        const utilProductionExtractorBrowser = typeof KpiUtilDataSyncBrowserAdapter !== 'undefined'
            ? KpiUtilDataSyncBrowserAdapter
            : null;

        function useUtilProductionExtractorRootFlag(flagName) {
            return utilProductionExtractorBrowser?.useRootFlag?.(flagName) === true;
        }

        function resolveUtilProductionPeriodStartDay(options = {}) {
            void options;
            return DEFAULT_UTIL_PRODUCTION_PERIOD.startDay;
        }

        function listUtilDailyEntriesByMetric(teamName, year, month, metricKey, options = {}) {
            const period = getUtilProductionPeriod(year, month, resolveUtilProductionPeriodStartDay(options));
            if (!period) return { period: null, entries: [] };
            const teamKey = normalizeUtilTeamName(teamName);
            const entries = UTIL_PRODUCTION_DAILY_INDEX[teamKey];
            if (!Array.isArray(entries) || !entries.length) return { period, entries: [] };
            const startTime = period.startDate.getTime();
            const endTime = period.endDate.getTime() + (24 * 60 * 60 * 1000) - 1;
            const selected = [];
            entries.forEach(entry => {
                if (entry.time < startTime || entry.time > endTime) return;
                const value = entry?.[metricKey];
                if (value === null || value === undefined) return;
                if (typeof value === 'string' && value.trim() === '') return;
                if (!Number.isFinite(Number(value))) return;
                selected.push(entry);
            });
            return { period, entries: selected };
        }

        function resolveUtilProductionSourceTeams(teamName, options = {}) {
            const normalized = normalizeUtilTeamName(teamName).toLowerCase();
            if (!normalized) return [String(teamName || '').trim()].filter(Boolean);
            if (options.gasContext && normalized.includes('lpg')) return ['1팀 2파트'];
            if (normalized.includes('전체') || normalized.includes('통합')) return options.gasContext ? ['1팀 1파트', '1팀 2파트', '3팀'] : ['1팀 1파트', '1팀 2파트', '2팀', '3팀'];
            if (normalized.includes('북정')) return ['1팀 1파트'];
            if (normalized.includes('유산')) return options.gasContext ? ['1팀 2파트', '3팀'] : ['1팀 2파트', '2팀', '3팀'];
            if (normalized.includes('건조') || normalized.includes('dry')) return ['1팀 1파트', '1팀 2파트'];
            if (
                normalized.includes('스틱')
                || normalized.includes('소포장')
                || normalized.includes('stick')
                || normalized.includes('pouch')
            ) {
                return ['2팀'];
            }
            if (normalized.includes('액상') || normalized.includes('liquid')) return ['3팀'];
            if (normalized.includes('1팀') && normalized.includes('1파트')) return ['1팀 1파트'];
            if (normalized.includes('1팀') && normalized.includes('2파트')) return ['1팀 2파트'];
            if (normalized.includes('2팀')) return ['2팀'];
            if (normalized.includes('3팀')) return ['3팀'];
            return [String(teamName || '').trim()].filter(Boolean);
        }

        function getUtilDailyMetricValue(teamName, year, month, metricKey, options = {}) {
            const sourceTeams = resolveUtilProductionSourceTeams(teamName, options);
            let period = null;
            const entries = [];
            sourceTeams.forEach(sourceTeam => {
                const listed = listUtilDailyEntriesByMetric(sourceTeam, year, month, metricKey, options);
                if (!period && listed?.period) period = listed.period;
                if (Array.isArray(listed?.entries) && listed.entries.length) {
                    entries.push(...listed.entries);
                }
            });
            if (!period || !entries.length) return null;
            let sum = 0;
            entries.forEach(entry => {
                const rawValue = entry?.[metricKey];
                if (rawValue === null || rawValue === undefined) return;
                if (typeof rawValue === 'string' && rawValue.trim() === '') return;
                const value = Number(rawValue);
                if (!Number.isFinite(value)) return;
                sum += value;
            });
            return {
                value: sum,
                source: 'daily',
                periodLabel: `${formatUtilDateLabel(period.startDate)} ~ ${formatUtilDateLabel(period.endDate)}`,
                count: entries.length,
                details: entries
            };
        }

        function getUtilDailyProductionValue(teamName, year, month, options = {}) {
            return getUtilDailyMetricValue(teamName, year, month, 'amount', options);
        }

        function resolveUtilProductionCell(teamName, year, row, options = {}) {
            const month = parseUtilMonthLabel(row?.label);
            if (!Number.isFinite(year) || !month) {
                return { value: null, source: 'none', periodLabel: '', count: 0 };
            }
            const daily = getUtilDailyProductionValue(teamName, year, month, options);
            if (daily) return daily;
            return { value: null, source: 'none', periodLabel: '', count: 0 };
        }

        const UTIL_DAILY_DETAIL_CONFIG = {
            production: {
                key: 'production',
                title: '생산량 일별 상세',
                metricKey: 'amount',
                metricLabel: '생산량 (kg)',
                unit: 'kg',
                emptyText: '해당 월에 등록된 일별 생산량 데이터가 없습니다.'
            }
        };

        function resolveUtilDailyDetailConfig(detailType) {
            const key = String(detailType || '').trim();
            return UTIL_DAILY_DETAIL_CONFIG[key] || UTIL_DAILY_DETAIL_CONFIG.production;
        }

        function getUtilProductionDetailPayload(teamName, year, month, detailType = 'production') {
            const safeYear = Number(year);
            const safeMonth = Number(month);
            if (!Number.isFinite(safeYear) || !Number.isFinite(safeMonth)) return null;
            const detailConfig = resolveUtilDailyDetailConfig(detailType);
            const periodLabel = getUtilProductionPeriodLabel(safeYear, safeMonth, UtilProductionState.startDay);
            const daily = getUtilDailyProductionValue(teamName, safeYear, safeMonth);
            const rows = (daily?.details || []).map(item => ({
                dateLabel: item.dateLabel,
                teamName: item.teamName || teamName || '',
                lineName: item.lineName || '',
                productCode: item.productCode || '',
                productName: item.productName || '',
                metricValue: item?.[detailConfig.metricKey],
                moistureExcludedYield: Number.isFinite(parseUtilPercentAmount(item?.moistureExcludedYield)) ? parseUtilPercentAmount(item?.moistureExcludedYield) : null,
                workTime: Number.isFinite(parseUtilAmount(item?.workTime ?? item?.inputTime)) ? parseUtilAmount(item?.workTime ?? item?.inputTime) : null,
                operationTime: Number.isFinite(parseUtilAmount(item?.operationTime)) ? parseUtilAmount(item?.operationTime) : null,
                equipmentCapa: Number.isFinite(parseUtilAmount(item?.equipmentCapa)) ? parseUtilAmount(item?.equipmentCapa) : null,
                equipmentUtilization: Number.isFinite(parseUtilPercentAmount(item?.equipmentUtilization)) ? parseUtilPercentAmount(item?.equipmentUtilization) : null,
                entryKey: String(item?.entryKey || '').trim()
            }));
            const entryKeys = Array.from(new Set(rows.map(item => item.entryKey).filter(Boolean)));
            const total = rows.reduce((acc, item) => acc + (Number(item.metricValue) || 0), 0);
            return {
                detailType: detailConfig.key,
                title: detailConfig.title,
                metricLabel: detailConfig.metricLabel,
                unit: detailConfig.unit,
                emptyText: detailConfig.emptyText,
                teamName: teamName || '',
                year: safeYear,
                month: safeMonth,
                periodLabel,
                rows,
                entryKeys,
                total
            };
        }

        function ensureUtilProductionDetailModal() {
            let modal = document.getElementById('util-production-detail-modal');
            if (modal) return modal;
            modal = document.createElement('div');
            modal.id = 'util-production-detail-modal';
            modal.className = 'util-production-modal';
            modal.innerHTML = `
                <div class="util-production-modal-card" role="dialog" aria-modal="true" aria-label="데이터 일별 상세">
                    <div class="util-production-modal-header">
                        <div class="util-production-modal-title" data-role="title">데이터 일별 상세</div>
                        <button type="button" class="util-production-modal-close" data-role="close">닫기</button>
                    </div>
                    <div class="util-production-modal-body" data-role="body"></div>
                </div>
            `;
            modal.addEventListener('click', evt => {
                if (evt.target === modal) closeUtilProductionDetailModal();
            });
            const closeBtn = modal.querySelector('[data-role="close"]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeUtilProductionDetailModal());
            }
            document.body.appendChild(modal);
            if (useUtilProductionExtractorRootFlag('__utilProductionDetailEscBound')) {
                document.addEventListener('keydown', evt => {
                    if (evt.key !== 'Escape') return;
                    closeUtilProductionDetailModal();
                });
            }
            return modal;
        }

        function closeUtilProductionDetailModal() {
            const modal = document.getElementById('util-production-detail-modal');
            if (!modal) return;
            modal.classList.remove('is-open');
        }

        function openUtilProductionDailyDetail(teamEncoded, year, month, detailType = 'production') {
            const teamName = decodeURIComponent(String(teamEncoded || ''));
            const detail = getUtilProductionDetailPayload(teamName, year, month, detailType);
            if (!detail) return;
            const modal = ensureUtilProductionDetailModal();
            const title = modal.querySelector('[data-role="title"]');
            const body = modal.querySelector('[data-role="body"]');
            if (!title || !body) return;
            title.textContent = `${detail.title} · ${detail.year}년 ${detail.month}월`;
            const totalSuffix = detail.unit ? ` ${detail.unit}` : '';
            const metaHtml = `
                <div class="util-production-modal-meta">
                    <span>팀: ${escapeHtml(detail.teamName || '-')}</span>
                    <span>집계기간: ${escapeHtml(detail.periodLabel || '-')}</span>
                    <span>건수: ${detail.rows.length.toLocaleString('ko-KR')}건</span>
                    <span>합계: ${formatUtilNumber(detail.total)}${totalSuffix}</span>
                </div>
            `;
            const actionHtml = `
                <div style="display:flex;justify-content:flex-end;align-items:center;margin:-2px 0 2px;">
                    <button type="button" class="util-detail-btn" data-role="delete-team-month">해당 팀·월 생산량 전체삭제</button>
                </div>
            `;
            if (!detail.rows.length) {
                body.innerHTML = `
                    ${metaHtml}
                    <div class="util-production-modal-empty">${escapeHtml(detail.emptyText)}</div>
                `;
                modal.classList.add('is-open');
                return;
            }
            const rowHtml = detail.rows.map(item => `
                <tr>
                    <td>${escapeHtml(item.dateLabel)}</td>
                    <td>${escapeHtml(item.teamName || detail.teamName || '-')}</td>
                    <td>${escapeHtml(item.lineName || '-')}</td>
                    <td>${escapeHtml(item.productCode || '-')}</td>
                    <td>${escapeHtml(item.productName || '-')}</td>
                    <td>${formatUtilNumber(item.metricValue)}</td>
                </tr>
            `).join('');
            body.innerHTML = `
                ${metaHtml}
                ${actionHtml}
                <table class="util-production-modal-table">
                    <thead>
                        <tr>
                            <th>생산일자</th>
                            <th>팀</th>
                            <th>라인명</th>
                            <th>코드</th>
                            <th>품명</th>
                            <th>${escapeHtml(detail.metricLabel)}</th>
                        </tr>
                    </thead>
                    <tbody>${rowHtml}</tbody>
                </table>
            `;
            const deleteButton = body.querySelector('[data-role="delete-team-month"]');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    const keySet = new Set(Array.isArray(detail.entryKeys) ? detail.entryKeys.filter(Boolean) : []);
                    if (!keySet.size) {
                        alert('삭제할 생산량 데이터가 없습니다.');
                        return;
                    }
                    const ok = confirm(`${detail.year}년 ${detail.month}월(${detail.teamName || '-'}) 생산량 데이터를 모두 삭제할까요?`);
                    if (!ok) return;
                    const removedCount = removeUtilProductionEntriesByKeySet(keySet);
                    if (removedCount > 0 && typeof setLastModified === 'function') {
                        setLastModified('유틸리티 관리');
                    }
                    alert(removedCount > 0
                        ? `생산량 ${removedCount.toLocaleString('ko-KR')}건을 삭제했습니다.`
                        : '삭제할 생산량 데이터가 없습니다.');
                    openUtilProductionDailyDetail(teamEncoded, year, month, detailType);
                });
            }
            modal.classList.add('is-open');
        }
