(function registerKpiReportDeckAdapterUtilityAnalysis(globalScope) {
    const root = globalScope?.window || globalScope;
    if (!root || root.KpiUtilRuntimeBrowserAdapter) return;
    const parts = root[Symbol.for('kpi.reportDeck.browserAdapter.parts')] ||= Object.create(null);
    function formatReportDeckShortMonthLabel(monthKey) {
        const parsed = parts.parseReportDeckMonthKey(monthKey);
        if (!parsed) return '';
        return `${String(parsed.year).slice(2)}.${String(parsed.month).padStart(2, '0')}`;
    }

    async function ensureReportDeckUtilityDataReady() {
        try {
            await root.KpiMeteringBridge?.ensureIntegratedMeteringRuntime?.();
        } catch (error) {
            // The report can still render placeholders if the integrated runtime is unavailable.
        }

        const tasks = [];
        const electricSync = root.KPIUtilReportSheetElectricRuntimeSync?.ensureUtilElectricReportDataSync
            || root.syncUtilElectricDataFromMetering;
        const gasSync = root.KPIUtilReportSheetGasRuntimeSync?.ensureUtilGasReportDataSync
            || root.syncUtilGasDataFromMetering;
        const wasteSync = root.KPIUtilReportSheetWasteRuntimeSync?.ensureUtilWasteReportDataSync
            || root.syncUtilWasteDataFromMetering;
        if (typeof electricSync === 'function') {
            tasks.push(Promise.resolve().then(() => electricSync.call(root, { force: true })));
        }
        if (typeof gasSync === 'function') {
            tasks.push(Promise.resolve().then(() => gasSync.call(root, { force: true })));
        }
        if (typeof wasteSync === 'function') {
            tasks.push(Promise.resolve().then(() => wasteSync.call(root, { force: true })));
        }
        if (tasks.length) {
            await Promise.all(tasks.map(task => task.catch(() => null)));
        }
    }

    function buildReportDeckElectricRows(electricApi, option, timeline, monthKey) {
        if (typeof electricApi?.buildUtilElectricAnalysisScopedRows === 'function') {
            const rows = electricApi.buildUtilElectricAnalysisScopedRows({
                from: timeline.from,
                to: timeline.to
            }, option);
            if (Array.isArray(rows) && rows.length) return rows;
        }
        if (typeof electricApi?.buildUtilElectricAnalysisScopedDatasetResult === 'function') {
            const result = electricApi.buildUtilElectricAnalysisScopedDatasetResult(monthKey, 'team_01_01');
            return Array.isArray(result?.allRows) ? result.allRows : [];
        }
        return [];
    }

    async function buildReportDeckUtilityAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (parts.isPlainObject(options.store)) {
            parts.applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        const electricApi = root.KPIUtilReportSheetAnalysisElectricModel || null;
        if (!optionApi || !gasApi || !electricApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const scopeConfig = parts.getReportDeckUtilityScopeConfig(options.scopeKey);
        const timeline = parts.buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const gasOption = optionApi.getUtilGasAnalysisCategoryOption?.(scopeConfig.gasCategoryKey) || { key: scopeConfig.gasCategoryKey };
        const electricOption = parts.resolveReportDeckElectricOption(optionApi, scopeConfig);
        const gasMetricMap = typeof gasApi.buildUtilGasAnalysisMetricMap === 'function'
            ? gasApi.buildUtilGasAnalysisMetricMap(timeline.monthKeys, gasOption)
            : new Map();
        const electricRows = buildReportDeckElectricRows(electricApi, electricOption, timeline, activeMonthInfo.key);
        const electricRowMap = new Map((Array.isArray(electricRows) ? electricRows : [])
            .map(row => [String(row?.monthKey || '').trim(), row])
            .filter(([key]) => key));
        const readGasCost = monthKey => {
            const usageCharge = parts.readReportDeckGasUsageCharge(monthKey, scopeConfig);
            return usageCharge !== null ? usageCharge : parts.readReportDeckGasLngCost(gasMetricMap, monthKey);
        };
        const readGasUnitProduction = monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            return parts.toFiniteNumber(metric?.ratioProduction?.lng ?? metric.production);
        };

        const gasRows = {
            production: parts.buildReportDeckMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'production'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'production'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'production')
            ),
            usage: parts.buildReportDeckMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lngUsage'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lngUsage'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'lngUsage')
            ),
            unit: parts.buildReportDeckRatioMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lngUsage'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lngUsage'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'lngUsage'),
                readGasUnitProduction(referenceMonthKey),
                readGasUnitProduction(activeMonthInfo.key),
                readGasUnitProduction(previousMonthKey)
            ),
            cost: parts.buildReportDeckMetricComparison(
                readGasCost(referenceMonthKey),
                readGasCost(activeMonthInfo.key),
                readGasCost(previousMonthKey)
            )
        };
        const electricRowsModel = {
            production: parts.buildReportDeckMetricComparison(
                parts.readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'production'),
                parts.readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'production'),
                parts.readReportDeckElectricRow(electricRowMap, previousMonthKey, 'production')
            ),
            usage: parts.buildReportDeckMetricComparison(
                parts.readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricUsage'),
                parts.readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricUsage'),
                parts.readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricUsage')
            ),
            unit: parts.buildReportDeckRatioMetricComparison(
                parts.readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricUsage'),
                parts.readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricUsage'),
                parts.readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricUsage'),
                parts.readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'production'),
                parts.readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'production'),
                parts.readReportDeckElectricRow(electricRowMap, previousMonthKey, 'production')
            ),
            cost: parts.buildReportDeckMetricComparison(
                parts.readReportDeckElectricRow(electricRowMap, referenceMonthKey, 'electricCost'),
                parts.readReportDeckElectricRow(electricRowMap, activeMonthInfo.key, 'electricCost'),
                parts.readReportDeckElectricRow(electricRowMap, previousMonthKey, 'electricCost')
            )
        };

        const gasSeries = parts.buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            const usage = parts.toFiniteNumber(metric.lngUsage);
            const production = parts.toFiniteNumber(metric?.ratioProduction?.lng ?? metric.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });
        const electricSeries = parts.buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const row = electricRowMap.get(monthKey) || {};
            const usage = parts.toFiniteNumber(row.electricUsage);
            const production = parts.toFiniteNumber(row.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });

        return {
            ok: true,
            scopeKey: scopeConfig.key,
            scopeLabel: scopeConfig.label,
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            gas: {
                rows: gasRows,
                chart: {
                    title: scopeConfig.gasChartTitle,
                    series: gasSeries
                }
            },
            electric: {
                rows: electricRowsModel,
                chart: {
                    title: scopeConfig.electricChartTitle,
                    series: electricSeries
                }
            }
        };
    }

    async function buildReportDeckBukjeongAnalysis(monthValue, options = {}) {
        return buildReportDeckUtilityAnalysis(monthValue, {
            ...options,
            scopeKey: 'bukjeong'
        });
    }

    async function buildReportDeckYusanLpgAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (parts.isPlainObject(options.store)) {
            parts.applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const gasApi = root.KPIUtilReportSheetGasScopedMetrics || null;
        if (!optionApi || !gasApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const timeline = parts.buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const gasOption = optionApi.getUtilGasAnalysisCategoryOption?.('team_01_02') || { key: 'team_01_02' };
        const gasMetricMap = typeof gasApi.buildUtilGasAnalysisMetricMap === 'function'
            ? gasApi.buildUtilGasAnalysisMetricMap(timeline.monthKeys, gasOption)
            : new Map();
        const readLpgUnitProduction = monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            return parts.toFiniteNumber(metric?.ratioProduction?.lpg ?? metric.production);
        };
        const readLpgConversionRatio = monthKey => parts.readReportDeckGasLpgConversionRatio(gasMetricMap, monthKey);

        const rows = {
            production: parts.buildReportDeckMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'production'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'production'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'production')
            ),
            usage: parts.buildReportDeckMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lpgUsage'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lpgUsage'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'lpgUsage')
            ),
            unit: parts.buildReportDeckRatioMetricComparison(
                parts.readReportDeckMetric(gasMetricMap, referenceMonthKey, 'lpgUsage'),
                parts.readReportDeckMetric(gasMetricMap, activeMonthInfo.key, 'lpgUsage'),
                parts.readReportDeckMetric(gasMetricMap, previousMonthKey, 'lpgUsage'),
                readLpgUnitProduction(referenceMonthKey),
                readLpgUnitProduction(activeMonthInfo.key),
                readLpgUnitProduction(previousMonthKey)
            ),
            amount: parts.buildReportDeckMetricComparison(
                parts.readReportDeckGasLpgCost(gasMetricMap, referenceMonthKey),
                parts.readReportDeckGasLpgCost(gasMetricMap, activeMonthInfo.key),
                parts.readReportDeckGasLpgCost(gasMetricMap, previousMonthKey)
            )
        };
        const referenceActualLpgCost = parts.readReportDeckGasLpgCost(gasMetricMap, referenceMonthKey);
        const currentActualLpgCost = parts.readReportDeckGasLpgCost(gasMetricMap, activeMonthInfo.key);
        const previousActualLpgCost = parts.readReportDeckGasLpgCost(gasMetricMap, previousMonthKey);
        const referenceLpgConversionRatio = parts.normalizeReportDeckPositiveMetric(readLpgConversionRatio(referenceMonthKey));
        const currentLpgConversionRatio = parts.normalizeReportDeckPositiveMetric(readLpgConversionRatio(activeMonthInfo.key));
        const previousLpgConversionRatio = parts.normalizeReportDeckPositiveMetric(readLpgConversionRatio(previousMonthKey));
        const referenceLpgConversionCost = parts.calculateReportDeckGasLpgConversionCost(
            referenceActualLpgCost,
            referenceLpgConversionRatio
        );
        const currentLpgConversionCost = parts.calculateReportDeckGasLpgConversionCost(
            currentActualLpgCost,
            currentLpgConversionRatio
        );
        const previousLpgConversionCost = parts.calculateReportDeckGasLpgConversionCost(
            previousActualLpgCost,
            previousLpgConversionRatio
        );
        const referenceLpgCostDifference = parts.subtractReportDeckMetricValues(referenceActualLpgCost, referenceLpgConversionCost);
        const currentLpgCostDifference = parts.subtractReportDeckMetricValues(currentActualLpgCost, currentLpgConversionCost);
        const previousLpgCostDifference = parts.subtractReportDeckMetricValues(previousActualLpgCost, previousLpgConversionCost);
        const costRows = {
            0: parts.buildReportDeckMetricComparison(
                referenceActualLpgCost,
                currentActualLpgCost,
                previousActualLpgCost
            ),
            1: parts.buildReportDeckMetricComparison(
                referenceLpgConversionCost,
                currentLpgConversionCost,
                previousLpgConversionCost
            ),
            2: parts.buildReportDeckMetricComparison(
                referenceLpgConversionRatio,
                currentLpgConversionRatio,
                previousLpgConversionRatio
            ),
            3: parts.buildReportDeckMetricComparison(
                referenceLpgCostDifference,
                currentLpgCostDifference,
                previousLpgCostDifference
            )
        };
        const unitSeries = parts.buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const metric = gasMetricMap.get(monthKey) || {};
            const usage = parts.toFiniteNumber(metric.lpgUsage);
            const production = parts.toFiniteNumber(metric?.ratioProduction?.lpg ?? metric.production);
            return usage !== null && production !== null && production > 0 ? usage / production : null;
        });
        const costSeries = parts.buildReportDeckSignedMetricSeries(timeline, activeMonthInfo, monthKey => {
            const actualLpgCost = parts.readReportDeckGasLpgCost(gasMetricMap, monthKey);
            const conversionCost = parts.calculateReportDeckGasLpgConversionCost(
                actualLpgCost,
                parts.normalizeReportDeckPositiveMetric(readLpgConversionRatio(monthKey))
            );
            return parts.subtractReportDeckMetricValues(actualLpgCost, conversionCost);
        });

        return {
            ok: true,
            scopeKey: 'yusan_lpg_team_01_02',
            scopeLabel: '1\ud300 2\ud30c\ud2b8 LPG',
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            rows,
            costRows,
            chart: {
                title: '1\ud300 2\ud30c\ud2b8 LPG (kg) / \uc0dd\uc0b0\ub7c9(kg)',
                series: unitSeries
            },
            costChart: {
                title: 'LPG, LNG환산 (원)',
                series: costSeries
            }
        };
    }

    async function buildReportDeckWasteAnalysis(monthValue, options = {}) {
        const activeMonthInfo = parts.parseReportDeckMonthKey(monthValue);
        if (!activeMonthInfo) {
            return { ok: false, reason: 'invalid_month', monthKey: '' };
        }
        if (parts.isPlainObject(options.store)) {
            parts.applyMeteringSharedStoreSnapshot(options.store);
        }

        await ensureReportDeckUtilityDataReady();

        const optionApi = root.KPIUtilReportSheetOptions || null;
        const wasteApi = root.KPIUtilReportSheetAnalysisWasteModel || null;
        if (!optionApi || !wasteApi) {
            return { ok: false, reason: 'analysis_api_unavailable', monthKey: activeMonthInfo.key };
        }

        const scopeConfig = parts.getReportDeckWasteScopeConfig(options.scopeKey);
        const siteOption = optionApi.getUtilWasteAnalysisSiteOption?.(scopeConfig.siteKey) || {
            key: scopeConfig.siteKey,
            label: scopeConfig.label
        };
        const timeline = parts.buildReportDeckAnalysisTimeline(activeMonthInfo, options);
        const referenceMonthKey = parts.toReportDeckMonthKey(activeMonthInfo.year - 1, activeMonthInfo.month);
        const previousMonthKey = parts.getReportDeckRelativeMonthKey(activeMonthInfo, -1);
        const wasteRows = parts.buildReportDeckWasteRows(wasteApi, scopeConfig, activeMonthInfo.key);
        const wasteRowMap = new Map((Array.isArray(wasteRows) ? wasteRows : [])
            .map(row => [String(row?.monthKey || '').trim(), row])
            .filter(([key]) => key));

        const buildDetailPair = (detailKey) => parts.buildReportDeckMetricComparison(
            parts.readReportDeckWasteCostDetail(wasteRowMap, referenceMonthKey, detailKey),
            parts.readReportDeckWasteCostDetail(wasteRowMap, activeMonthInfo.key, detailKey),
            parts.readReportDeckWasteCostDetail(wasteRowMap, previousMonthKey, detailKey)
        );
        const rows = {
            production: parts.buildReportDeckMetricComparison(
                parts.readReportDeckWasteRow(wasteRowMap, referenceMonthKey, 'production'),
                parts.readReportDeckWasteRow(wasteRowMap, activeMonthInfo.key, 'production'),
                parts.readReportDeckWasteRow(wasteRowMap, previousMonthKey, 'production')
            ),
            usage: parts.buildReportDeckMetricComparison(
                parts.readReportDeckWasteRow(wasteRowMap, referenceMonthKey, 'wasteUsage'),
                parts.readReportDeckWasteRow(wasteRowMap, activeMonthInfo.key, 'wasteUsage'),
                parts.readReportDeckWasteRow(wasteRowMap, previousMonthKey, 'wasteUsage')
            ),
            unit: parts.buildReportDeckMetricComparison(
                parts.calculateReportDeckWasteIntensity(wasteRowMap.get(referenceMonthKey) || {}),
                parts.calculateReportDeckWasteIntensity(wasteRowMap.get(activeMonthInfo.key) || {}),
                parts.calculateReportDeckWasteIntensity(wasteRowMap.get(previousMonthKey) || {})
            ),
            water: buildDetailPair('water'),
            share: buildDetailPair('share'),
            sludge: buildDetailPair('sludge'),
            resin: buildDetailPair('resin'),
            labor: buildDetailPair('labor'),
            total: buildDetailPair('')
        };
        const chartSeries = parts.buildReportDeckRatioSeries(timeline, activeMonthInfo, monthKey => {
            const row = wasteRowMap.get(monthKey) || {};
            return parts.calculateReportDeckWasteIntensity(row);
        });

        return {
            ok: true,
            scopeKey: scopeConfig.key,
            scopeLabel: siteOption.label || scopeConfig.label,
            monthKey: activeMonthInfo.key,
            referenceMonthKey,
            previousMonthKey,
            monthLabels: {
                reference: formatReportDeckShortMonthLabel(referenceMonthKey),
                current: formatReportDeckShortMonthLabel(activeMonthInfo.key),
                previous: formatReportDeckShortMonthLabel(previousMonthKey)
            },
            rows,
            chart: {
                title: scopeConfig.chartTitle,
                series: chartSeries
            }
        };
    }

    async function fetchReportDeckCover(options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_fetch_unavailable');
        }
        const response = await root.fetch(parts.buildReportDeckRecordEndpoint(options), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (response.status === 404) {
            return { ok: true, record: null };
        }
        if (!response.ok) {
            throw new Error(`report_deck_fetch_failed:${response.status}`);
        }
        return response.json();
    }

    async function saveReportDeckCover(payload, options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_fetch_unavailable');
        }
        const response = await root.fetch(parts.buildReportDeckRecordEndpoint(options), {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                payload: payload || {}
            })
        });
        if (!response.ok) {
            throw new Error(`report_deck_save_failed:${response.status}`);
        }
        return response.json();
    }

    async function uploadReportDeckImageDataUrl(dataUrl, options = {}) {
        if (typeof root.fetch !== 'function') {
            throw new Error('report_deck_image_upload_unavailable');
        }
        const config = parts.getReportRuntimeConfig();
        if (config.enabled === false || config.writeEnabled === false) {
            throw new Error('report_deck_image_upload_readonly');
        }
        const prepared = await parts.prepareReportDeckImageDataUrlForUpload(dataUrl, options);
        const parsed = parts.parseDataUrlPayload(prepared.dataUrl);
        const mimeType = String(prepared.mimeType || parsed.mimeType || 'application/octet-stream').trim();
        const recordKey = parts.normalizeReportRecordKey(options.recordKey, config.recordKey);
        const fieldKey = String(options.fieldKey || 'image').trim() || 'image';
        const originalName = String(prepared.originalName || options.originalName || `${fieldKey}.png`).trim() || `${fieldKey}.png`;
        const response = await root.fetch(parts.buildReportDeckFileUploadEndpoint(), {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                permissionKey: config.permissionKey,
                ownerDomain: 'report.runtime',
                ownerKey: recordKey,
                fileCategory: 'image',
                originalName,
                mimeType,
                base64Data: parsed.base64Data,
                metadata: {
                    moduleKey: config.moduleKey,
                    recordKey,
                    fieldKey
                }
            })
        });
        if (!response.ok) {
            throw new Error(`report_deck_image_upload_failed:${response.status}`);
        }
        const payload = await response.json();
        const documentId = String(payload?.document?.id || '').trim();
        if (!documentId) {
            throw new Error('report_deck_image_upload_missing_id');
        }
        return `${config.apiBase.replace(/\/+$/, '')}/files/${encodeURIComponent(documentId)}/view`;
    }

    async function uploadReportDeckImage(file, options = {}) {
        const dataUrl = await parts.readBrowserFileAsDataUrl(file);
        return uploadReportDeckImageDataUrl(dataUrl, {
            ...options,
            originalName: options.originalName || file?.name || '',
            mimeType: options.mimeType || file?.type || ''
        });
    }

    async function fetchMeteringSharedStore() {
        if (typeof root.fetch !== 'function') {
            throw new Error('metering_shared_store_fetch_unavailable');
        }
        const response = await root.fetch(parts.buildMeteringSharedStoreEndpoint(), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin'
        });
        if (!response.ok) {
            throw new Error(`metering_shared_store_fetch_failed:${response.status}`);
        }
        const payload = await response.json();
        if (parts.isPlainObject(payload?.store)) {
            parts.applyMeteringSharedStoreSnapshot(payload.store);
        }
        return payload;
    }

    Object.assign(parts, {
        formatReportDeckShortMonthLabel,
        ensureReportDeckUtilityDataReady,
        buildReportDeckElectricRows,
        buildReportDeckUtilityAnalysis,
        buildReportDeckBukjeongAnalysis,
        buildReportDeckYusanLpgAnalysis,
        buildReportDeckWasteAnalysis,
        fetchReportDeckCover,
        saveReportDeckCover,
        uploadReportDeckImageDataUrl,
        uploadReportDeckImage,
        fetchMeteringSharedStore
    });
})(globalThis);
