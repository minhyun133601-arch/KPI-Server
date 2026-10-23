(function (root) {
    const parts = root[Symbol.for('kpi.energy.kpi.parts')] ||= Object.create(null);
    const TEAM_OPTIONS = Object.freeze([
        Object.freeze({ key: 'team-01-01', label: '1팀 1파트' }),
        Object.freeze({ key: 'team-01-02', label: '1팀 2파트' }),
        Object.freeze({ key: 'team-02', label: '2팀' }),
        Object.freeze({ key: 'team-03', label: '3팀' })
    ]);
    const SCOPE_OPTIONS = Object.freeze([
        Object.freeze({ key: 'total', label: '전체', teamKeys: TEAM_OPTIONS.map(team => team.key) }),
        Object.freeze({ key: 'bukjeong', label: '북정', teamKeys: ['team-01-01'] }),
        Object.freeze({ key: 'yusan', label: '유산', teamKeys: ['team-01-02', 'team-02', 'team-03'] }),
        ...TEAM_OPTIONS.map(team => Object.freeze({ ...team, teamKeys: [team.key] }))
    ]);

    function normalizeEnergyKpiMonthKeys(monthKeys = []) {
        return Array.from(new Set((Array.isArray(monthKeys) ? monthKeys : [])
            .map(value => String(value || '').trim())
            .filter(value => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value))))
            .sort();
    }

    function parseEnergyKpiNumber(value) {
        if (value === null || value === undefined || typeof value === 'boolean') return NaN;
        if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
        const text = String(value).replace(/,/g, '').trim();
        if (!text) return NaN;
        const number = Number(text);
        return Number.isFinite(number) ? number : NaN;
    }

    function getEnergyKpiShare(value, total) {
        return Number.isFinite(value) && Number.isFinite(total) && total > 0
            ? Math.min(100, Math.max(0, value / total * 100))
            : NaN;
    }

    function getEnergyKpiIntensity(energyKcal, productionKg) {
        return Number.isFinite(energyKcal) && Number.isFinite(productionKg) && productionKg > 0
            ? energyKcal / productionKg
            : NaN;
    }

    function getEnergyKpiShares(electricKcal, lngKcal, lpgKcal, energyKcal) {
        return {
            electric: getEnergyKpiShare(electricKcal, energyKcal),
            gas: getEnergyKpiShare(lngKcal + lpgKcal, energyKcal),
            lng: getEnergyKpiShare(lngKcal, energyKcal),
            lpg: getEnergyKpiShare(lpgKcal, energyKcal)
        };
    }

    function getEnergyKpiComponentKcal(row, key) {
        const component = row?.components?.find(item => item.key === key);
        return component?.applicable === false ? 0 : parseEnergyKpiNumber(component?.kcal);
    }

    function sumEnergyKpiRows(rows, resolveValue) {
        if (!rows.length) return NaN;
        const values = rows.map(resolveValue);
        return values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : NaN;
    }

    function buildEnergyKpiReport({ scopeKey = 'total', monthKeys = [] } = {}) {
        const scope = SCOPE_OPTIONS.find(option => option.key === scopeKey) || SCOPE_OPTIONS[0];
        const months = normalizeEnergyKpiMonthKeys(monthKeys);
        const experiment = root[Symbol.for('kpi.experiment.section.parts')];
        const factors = experiment?.getEnergyConversionFactors?.() || {
            electric: NaN, lng: NaN, lpg: NaN, kjPerKcal: 4.1868
        };
        const productionCache = new Map();
        const energyCache = new Map();
        const readProduction = (team, monthKey) => {
            const cacheKey = `${team.key}:${monthKey}`;
            if (!productionCache.has(cacheKey)) {
                const [year, month] = monthKey.split('-').map(Number);
                const daily = typeof root.getUtilDailyProductionValue === 'function'
                    ? root.getUtilDailyProductionValue(team.label, year, month)
                    : null;
                productionCache.set(cacheKey, parseEnergyKpiNumber(daily?.value));
            }
            return productionCache.get(cacheKey);
        };
        const readEnergy = (key, monthKey) => {
            const cacheKey = `${key}:${monthKey}`;
            if (!energyCache.has(cacheKey)) {
                const breakdown = experiment?.getEnergyConversionBreakdown?.({ energyScopeKey: key }, monthKey);
                energyCache.set(cacheKey, breakdown || { components: [], totalKcal: NaN, complete: false });
            }
            return energyCache.get(cacheKey);
        };
        const selectedTeams = TEAM_OPTIONS.filter(team => scope.teamKeys.includes(team.key));
        const monthly = months.map(monthKey => {
            const energy = readEnergy(scope.key, monthKey);
            const productionValues = selectedTeams.map(team => readProduction(team, monthKey));
            const productionComplete = productionValues.length > 0 && productionValues.every(Number.isFinite);
            const productionKg = productionComplete ? productionValues.reduce((sum, value) => sum + value, 0) : NaN;
            const energyComplete = energy.complete === true && Number.isFinite(energy.totalKcal);
            const energyKcal = energyComplete ? energy.totalKcal : NaN;
            const complete = energyComplete && productionComplete;
            const row = { monthKey, energyKcal, productionKg, energyComplete, productionComplete, complete, components: energy.components };
            return {
                ...row,
                intensity: complete ? getEnergyKpiIntensity(energyKcal, productionKg) : NaN,
                shares: getEnergyKpiShares(
                    getEnergyKpiComponentKcal(row, 'electric'),
                    getEnergyKpiComponentKcal(row, 'lng'),
                    getEnergyKpiComponentKcal(row, 'lpg'),
                    energyKcal
                )
            };
        });
        const included = monthly.filter(row => row.complete);
        const includedMonthKeys = included.map(row => row.monthKey);
        const energyKcal = sumEnergyKpiRows(included, row => row.energyKcal);
        const productionKg = sumEnergyKpiRows(included, row => row.productionKg);
        const electricKcal = sumEnergyKpiRows(included, row => getEnergyKpiComponentKcal(row, 'electric'));
        const lngKcal = sumEnergyKpiRows(included, row => getEnergyKpiComponentKcal(row, 'lng'));
        const lpgKcal = sumEnergyKpiRows(included, row => getEnergyKpiComponentKcal(row, 'lpg'));
        const gasKcal = lngKcal + lpgKcal;
        const totals = {
            energyKcal, productionKg, intensity: getEnergyKpiIntensity(energyKcal, productionKg),
            electricKcal, gasKcal, lngKcal, lpgKcal,
            shares: getEnergyKpiShares(electricKcal, lngKcal, lpgKcal, energyKcal),
            lngOfGasShare: getEnergyKpiShare(lngKcal, gasKcal),
            lpgOfGasShare: getEnergyKpiShare(lpgKcal, gasKcal)
        };
        const teams = selectedTeams.map(team => {
            const teamMonths = includedMonthKeys.map(monthKey => {
                const energy = readEnergy(team.key, monthKey);
                return {
                    energyKcal: energy.complete === true ? energy.totalKcal : NaN,
                    productionKg: readProduction(team, monthKey),
                    components: energy.components
                };
            });
            const teamEnergy = sumEnergyKpiRows(teamMonths, row => row.energyKcal);
            const teamProduction = sumEnergyKpiRows(teamMonths, row => row.productionKg);
            const teamElectric = sumEnergyKpiRows(teamMonths, row => getEnergyKpiComponentKcal(row, 'electric'));
            const teamLng = sumEnergyKpiRows(teamMonths, row => getEnergyKpiComponentKcal(row, 'lng'));
            const teamLpg = sumEnergyKpiRows(teamMonths, row => getEnergyKpiComponentKcal(row, 'lpg'));
            return {
                key: team.key, label: team.label,
                energyKcal: teamEnergy, productionKg: teamProduction,
                intensity: getEnergyKpiIntensity(teamEnergy, teamProduction),
                energyShare: getEnergyKpiShare(teamEnergy, energyKcal),
                productionShare: getEnergyKpiShare(teamProduction, productionKg),
                electricKcal: teamElectric, gasKcal: teamLng + teamLpg, lngKcal: teamLng, lpgKcal: teamLpg
            };
        });
        return {
            scopeKey: scope.key, scopeLabel: scope.label, monthKeys: months, monthly, totals, teams,
            includedMonthKeys,
            excludedMonthKeys: monthly.filter(row => !row.complete).map(row => row.monthKey),
            coverage: { included: included.length, total: months.length },
            factors
        };
    }

    Object.assign(parts, { ENERGY_KPI_SCOPES: SCOPE_OPTIONS, normalizeEnergyKpiMonthKeys, buildEnergyKpiReport });
})(this);
