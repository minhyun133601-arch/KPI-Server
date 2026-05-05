        function ensureUtilEnergyReportStateRange() {
            const months = buildUtilEnergyMonthOptions();
            if (!months.length) return [];
            const monthSet = new Set(months.map(item => item.value));
            const firstValue = months[0].value;
            const lastValue = months[months.length - 1].value;
            if (!monthSet.has(UtilEnergyReportState.from)) UtilEnergyReportState.from = firstValue;
            if (!monthSet.has(UtilEnergyReportState.to)) UtilEnergyReportState.to = lastValue;
            const range = normalizeMonthRange(UtilEnergyReportState.from, UtilEnergyReportState.to);
            UtilEnergyReportState.from = monthSet.has(range.start) ? range.start : firstValue;
            UtilEnergyReportState.to = monthSet.has(range.end) ? range.end : lastValue;
            return months;
        }

        function getUtilEnergyReportSiteColor(siteKey) {
            return siteKey === '북정' ? '#f97316' : '#2563eb';
        }

        function getUtilEnergyReportSourceColor(siteKey, sourceKey) {
            if (sourceKey === 'gas') {
                return siteKey === '북정' ? '#ea580c' : '#dc2626';
            }
            return siteKey === '북정' ? '#fb923c' : '#2563eb';
        }

        function getUtilEnergyReportTeamLabel(teamName, siteKey = '') {
            const canonical = canonicalizeUtilTeamName(teamName);
            if (canonical === '1팀1파트') return '1팀 1파트';
            if (canonical === '1팀2파트') return '1팀 2파트';
            if (canonical === '2팀') return '2팀';
            if (canonical === '3팀') return '3팀';
            if (canonical === '북정') return '1팀 1파트';
            if (canonical === '유산') return siteKey === '유산' ? '유산' : '유산';
            const stripped = String(teamName || '').replace(/\s+(?:LNG|LPG)\s*$/iu, '').trim();
            return stripped || (siteKey === '북정' ? '1팀 1파트' : (siteKey === '유산' ? '유산' : '미지정'));
        }

        function createUtilEnergyReportSiteBucket() {
            return {
                total: 0,
                electric: 0,
                gas: 0,
                electricUsage: 0,
                gasLngUsage: 0,
                gasLpgUsage: 0,
                teams: {}
            };
        }

        function createUtilEnergyReportTeamBucket() {
            return {
                total: 0,
                electric: 0,
                gas: 0,
                gasLng: 0,
                gasLpg: 0,
                electricUsage: 0,
                gasLngUsage: 0,
                gasLpgUsage: 0
            };
        }

        function accumulateUtilEnergyReportTeamBucket(targetBucket, sourceBucket) {
            if (!targetBucket || !sourceBucket) return targetBucket;
            targetBucket.electric += Number(sourceBucket.electric) || 0;
            targetBucket.gas += Number(sourceBucket.gas) || 0;
            targetBucket.gasLng += Number(sourceBucket.gasLng) || 0;
            targetBucket.gasLpg += Number(sourceBucket.gasLpg) || 0;
            targetBucket.electricUsage += Number(sourceBucket.electricUsage) || 0;
            targetBucket.gasLngUsage += Number(sourceBucket.gasLngUsage) || 0;
            targetBucket.gasLpgUsage += Number(sourceBucket.gasLpgUsage) || 0;
            targetBucket.total = (Number(targetBucket.electric) || 0) + (Number(targetBucket.gas) || 0);
            return targetBucket;
        }

        function buildUtilEnergyReportAggregateTeamMap(sites) {
            const teamMap = new Map();
            ['유산', '북정'].forEach(siteKey => {
                Object.entries(sites?.[siteKey]?.teams || {}).forEach(([teamName, teamBucket]) => {
                    if (!teamMap.has(teamName)) {
                        teamMap.set(teamName, createUtilEnergyReportTeamBucket());
                    }
                    accumulateUtilEnergyReportTeamBucket(teamMap.get(teamName), teamBucket);
                });
            });
            return teamMap;
        }

        function getUtilEnergyReportElectricTeamOrderRank(teamName) {
            const canonical = canonicalizeUtilTeamName(teamName);
            if (canonical === '유산') return 0;
            if (canonical === '1팀1파트') return 1;
            if (canonical === '1팀2파트') return 2;
            if (canonical === '2팀') return 3;
            if (canonical === '3팀') return 4;
            return 50;
        }

        function getUtilEnergyReportGasTeamOrderRank(teamName, fuelKey = '', isCombined = false) {
            const canonical = canonicalizeUtilTeamName(teamName);
            let baseRank = 50;
            if (canonical === '유산') baseRank = 0;
            else if (canonical === '1팀1파트') baseRank = 10;
            else if (canonical === '1팀2파트') baseRank = 20;
            else if (canonical === '3팀') baseRank = 30;
            const normalizedFuel = String(fuelKey || '').trim().toLowerCase();
            const fuelRank = isCombined ? 0 : (normalizedFuel === 'lng' ? 1 : (normalizedFuel === 'lpg' ? 2 : 0));
            return baseRank + fuelRank;
        }

        function getOrCreateUtilEnergyReportSiteBucket(container, siteKey) {
            const key = normalizeUtilReportSiteKey(siteKey);
            if (key === 'all') return null;
            if (!container[key]) {
                container[key] = createUtilEnergyReportSiteBucket();
            }
            return container[key];
        }

        function getOrCreateUtilEnergyReportTeamBucket(siteBucket, teamName) {
            const key = String(teamName || '').trim() || '미지정';
            if (!siteBucket.teams[key]) {
                siteBucket.teams[key] = createUtilEnergyReportTeamBucket();
            }
            return siteBucket.teams[key];
        }

        function finalizeUtilEnergyReportSiteBucket(siteBucket) {
            if (!siteBucket) return;
            Object.values(siteBucket.teams || {}).forEach(teamBucket => {
                teamBucket.total = (Number(teamBucket.electric) || 0) + (Number(teamBucket.gas) || 0);
            });
            siteBucket.total = (Number(siteBucket.electric) || 0) + (Number(siteBucket.gas) || 0);
        }

        function buildEmptyUtilEnergyReportSummary() {
            return {
                totalEnergy: 0,
                electricEnergy: 0,
                gasEnergy: 0,
                sites: {
                    '북정': createUtilEnergyReportSiteBucket(),
                    '유산': createUtilEnergyReportSiteBucket()
                }
            };
        }

        function buildUtilEnergyReportSiteMetricKey(siteKey = 'all') {
            return `energy-site::${normalizeUtilReportSiteKey(siteKey)}`;
        }

        function parseUtilEnergyReportSiteMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            const prefix = 'energy-site::';
            if (!raw.startsWith(prefix)) {
                return { raw, siteKey: 'all' };
            }
            return {
                raw,
                siteKey: normalizeUtilReportSiteKey(raw.slice(prefix.length).trim())
            };
        }

        function buildUtilEnergyReportSourceMetricKey(siteKey = 'all', sourceKey = '') {
            const normalizedSite = normalizeUtilReportSiteKey(siteKey);
            const normalizedSource = String(sourceKey || '').trim() === 'gas' ? 'gas' : (String(sourceKey || '').trim() === 'electric' ? 'electric' : '');
            if (!normalizedSource) return 'energy-source::all';
            return `energy-source::${normalizedSite}::${normalizedSource}`;
        }

        function parseUtilEnergyReportSourceMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            if (raw === 'energy-source::all') {
                return { raw, siteKey: 'all', sourceKey: '' };
            }
            const prefix = 'energy-source::';
            if (!raw.startsWith(prefix)) {
                return { raw, siteKey: 'all', sourceKey: '' };
            }
            const parts = raw.slice(prefix.length).split('::');
            const siteKey = normalizeUtilReportSiteKey(parts[0]);
            const sourceKey = String(parts[1] || '').trim() === 'gas' ? 'gas' : (String(parts[1] || '').trim() === 'electric' ? 'electric' : '');
            return { raw, siteKey, sourceKey };
        }

        function buildUtilEnergyReportDetailMetricKey(siteKey, sourceKey, teamName) {
            const normalizedSite = normalizeUtilReportSiteKey(siteKey);
            const normalizedSource = String(sourceKey || '').trim() === 'gas' ? 'gas' : 'electric';
            return `energy-detail::${normalizedSite}::${normalizedSource}::${String(teamName || '').trim()}`;
        }

        function buildUtilEnergyReportDetailFuelMetricKey(siteKey, teamName, fuelKey) {
            const normalizedSite = normalizeUtilReportSiteKey(siteKey);
            const normalizedFuel = String(fuelKey || '').trim().toLowerCase() === 'lpg' ? 'lpg' : 'lng';
            return `energy-detail-fuel::${normalizedSite}::${String(teamName || '').trim()}::${normalizedFuel}`;
        }

        function parseUtilEnergyReportDetailMetric(metricValue) {
            const raw = String(metricValue || '').trim();
            if (raw.startsWith('energy-detail-fuel::')) {
                const parts = raw.slice('energy-detail-fuel::'.length).split('::');
                return {
                    raw,
                    kind: 'gas-fuel',
                    siteKey: normalizeUtilReportSiteKey(parts[0]),
                    sourceKey: 'gas',
                    teamName: String(parts[1] || '').trim(),
                    fuelKey: String(parts[2] || '').trim().toLowerCase() === 'lpg' ? 'lpg' : 'lng'
                };
            }
            if (raw.startsWith('energy-detail::')) {
                const parts = raw.slice('energy-detail::'.length).split('::');
                return {
                    raw,
                    kind: String(parts[1] || '').trim() === 'gas' ? 'gas-team' : 'electric-team',
                    siteKey: normalizeUtilReportSiteKey(parts[0]),
                    sourceKey: String(parts[1] || '').trim() === 'gas' ? 'gas' : 'electric',
                    teamName: String(parts[2] || '').trim(),
                    fuelKey: ''
                };
            }
            return {
                raw,
                kind: '',
                siteKey: 'all',
                sourceKey: '',
                teamName: '',
                fuelKey: ''
            };
        }

        function buildUtilEnergyReportSourceComposition(result) {
            const summary = result?.summary;
            const order = [
                { siteKey: '유산', sourceKey: 'electric', label: '유산 전기' },
                { siteKey: '유산', sourceKey: 'gas', label: '유산 가스' },
                { siteKey: '북정', sourceKey: 'electric', label: '북정 전기' },
                { siteKey: '북정', sourceKey: 'gas', label: '북정 가스' }
            ];
            const items = order
                .map(item => {
                    const siteBucket = summary?.sites?.[item.siteKey];
                    const value = Number(siteBucket?.[item.sourceKey]) || 0;
                    return {
                        key: buildUtilEnergyReportSourceMetricKey(item.siteKey, item.sourceKey),
                        label: item.label,
                        siteKey: item.siteKey,
                        sourceKey: item.sourceKey,
                        value,
                        color: getUtilEnergyReportSourceColor(item.siteKey, item.sourceKey)
                    };
                })
                .filter(item => item.value > 0);
            return {
                title: '공장별 전기/가스 열량 구성비',
                total: items.reduce((acc, item) => acc + item.value, 0),
                items,
                valueType: 'energy',
                totalKey: 'energy-source::all'
            };
        }

        function buildUtilEnergyReportSiteComposition(result) {
            const summary = result?.summary;
            const items = ['유산', '북정']
                .map(siteKey => ({
                    key: buildUtilEnergyReportSiteMetricKey(siteKey),
                    label: siteKey,
                    siteKey,
                    value: Number(summary?.sites?.[siteKey]?.total) || 0,
                    color: getUtilEnergyReportSiteColor(siteKey)
                }))
                .filter(item => item.value > 0);
            return {
                title: '총 열량 공장별 구성비 (유산/북정)',
                total: items.reduce((acc, item) => acc + item.value, 0),
                items,
                valueType: 'energy',
                totalKey: buildUtilEnergyReportSiteMetricKey('all')
            };
        }

        function buildUtilEnergyReportOverviewComposition(result) {
            const summary = result?.summary;
            const order = ['유산', '북정'];
            const items = [];
            order.forEach(siteKey => {
                const siteBucket = summary?.sites?.[siteKey];
                const totalValue = Number(siteBucket?.total) || 0;
                if (totalValue > 0) {
                    items.push({
                        key: buildUtilEnergyReportSiteMetricKey(siteKey),
                        label: siteKey,
                        siteKey,
                        value: totalValue,
                        color: getUtilEnergyReportSiteColor(siteKey),
                        excludeFromDonut: true
                    });
                }
                ['electric', 'gas'].forEach(sourceKey => {
                    const value = Number(siteBucket?.[sourceKey]) || 0;
                    if (value <= 0) return;
                    items.push({
                        key: buildUtilEnergyReportSourceMetricKey(siteKey, sourceKey),
                        label: `${siteKey} ${sourceKey === 'gas' ? '가스' : '전기'}`,
                        siteKey,
                        sourceKey,
                        value,
                        color: getUtilEnergyReportSourceColor(siteKey, sourceKey)
                    });
                });
            });
            return {
                title: '공장별 열량 구성비',
                total: Number(summary?.totalEnergy) || 0,
                items,
                valueType: 'energy',
                totalKey: 'energy-overview::all'
            };
        }

        function buildUtilEnergyReportElectricTeamComposition(result) {
            const teamMap = buildUtilEnergyReportAggregateTeamMap(result?.summary?.sites || {});
            const palette = ['#2563eb', '#f97316', '#dc2626', '#0ea5e9', '#16a34a', '#db2777', '#7c3aed', '#ca8a04'];
            const items = Array.from(teamMap.entries())
                .map(([teamName, teamBucket], index) => ({
                    key: buildUtilEnergyReportDetailMetricKey('all', 'electric', teamName),
                    label: `${teamName} 전기`,
                    teamName,
                    siteKey: 'all',
                    sourceKey: 'electric',
                    value: Number(teamBucket?.electric) || 0,
                    color: palette[index % palette.length]
                }))
                .filter(item => item.value > 0)
                .sort((a, b) => {
                    const rankA = getUtilEnergyReportElectricTeamOrderRank(a.teamName);
                    const rankB = getUtilEnergyReportElectricTeamOrderRank(b.teamName);
                    if (rankA !== rankB) return rankA - rankB;
                    return String(a.teamName || '').localeCompare(String(b.teamName || ''), 'ko');
                });
            items.forEach((item, index) => { item.color = palette[index % palette.length]; });
            return {
                title: '팀별 전기 열량 구성비',
                total: items.reduce((acc, item) => acc + item.value, 0),
                items,
                valueType: 'energy',
                totalKey: 'energy-detail-total::all::electric'
            };
        }

        function buildUtilEnergyReportGasTeamComposition(result) {
            const teamMap = buildUtilEnergyReportAggregateTeamMap(result?.summary?.sites || {});
            const palette = ['#dc2626', '#f97316', '#ea580c', '#f59e0b', '#db2777', '#7c3aed', '#0ea5e9', '#16a34a'];
            const items = [];
            Array.from(teamMap.entries()).forEach(([teamName, teamBucket]) => {
                const gasTotal = Number(teamBucket?.gas) || 0;
                if (gasTotal <= 0) return;
                const gasLng = Number(teamBucket?.gasLng) || 0;
                const gasLpg = Number(teamBucket?.gasLpg) || 0;
                if (gasLng > 0 && gasLpg > 0) {
                    items.push({
                        key: buildUtilEnergyReportDetailMetricKey('all', 'gas', teamName),
                        label: `${teamName} 총 가스`,
                        teamName,
                        siteKey: 'all',
                        sourceKey: 'gas',
                        fuelKey: '',
                        value: gasTotal,
                        excludeFromDonut: true
                    });
                    items.push({
                        key: buildUtilEnergyReportDetailFuelMetricKey('all', teamName, 'lng'),
                        label: `${teamName} LNG`,
                        teamName,
                        siteKey: 'all',
                        sourceKey: 'gas',
                        fuelKey: 'lng',
                        value: gasLng
                    });
                    items.push({
                        key: buildUtilEnergyReportDetailFuelMetricKey('all', teamName, 'lpg'),
                        label: `${teamName} LPG`,
                        teamName,
                        siteKey: 'all',
                        sourceKey: 'gas',
                        fuelKey: 'lpg',
                        value: gasLpg
                    });
                    return;
                }
                items.push({
                    key: buildUtilEnergyReportDetailMetricKey('all', 'gas', teamName),
                    label: `${teamName} 가스`,
                    teamName,
                    siteKey: 'all',
                    sourceKey: 'gas',
                    fuelKey: '',
                    value: gasTotal
                });
            });
            const sortedItems = items
                .filter(item => item.value > 0)
                .sort((a, b) => {
                    const rankA = getUtilEnergyReportGasTeamOrderRank(a.teamName, a.fuelKey, a.excludeFromDonut === true);
                    const rankB = getUtilEnergyReportGasTeamOrderRank(b.teamName, b.fuelKey, b.excludeFromDonut === true);
                    if (rankA !== rankB) return rankA - rankB;
                    return String(a.label || '').localeCompare(String(b.label || ''), 'ko');
                })
                .map((item, index) => ({
                    ...item,
                    color: palette[index % palette.length]
                }));
            return {
                title: '팀별 가스 열량 구성비',
                total: sortedItems.reduce((acc, item) => acc + (item.excludeFromDonut ? 0 : item.value), 0),
                items: sortedItems,
                valueType: 'energy',
                totalKey: 'energy-detail-total::all::gas',
                note: '1팀 2파트는 LNG/LPG와 총 가스를 함께 표시합니다.'
            };
        }

        function resolveUtilEnergyReportEffectiveSource(result) {
            const sourceComposition = buildUtilEnergyReportSourceComposition(result);
            const active = parseUtilEnergyReportSourceMetric(UtilEnergyReportState.activeSourceKey);
            const activeItem = sourceComposition.items.find(item => item.key === active.raw);
            if (activeItem) return activeItem;
            const preferredSite = normalizeUtilReportSiteKey(UtilEnergyReportState.activeSiteKey);
            const preferredItems = preferredSite === 'all'
                ? sourceComposition.items.slice()
                : sourceComposition.items.filter(item => item.siteKey === preferredSite);
            const candidates = preferredItems.length ? preferredItems : sourceComposition.items.slice();
            if (!candidates.length) return null;
            return candidates.sort((a, b) => Number(b.value) - Number(a.value))[0];
        }
