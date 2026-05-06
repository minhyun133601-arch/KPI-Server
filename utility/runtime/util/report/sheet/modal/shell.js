(function registerUtilReportSheetModalShell() {
    const runtimeAdapter = typeof KPIUtilReportRuntimeAdapter === 'object' && KPIUtilReportRuntimeAdapter
        ? KPIUtilReportRuntimeAdapter
        : null;
    if (!runtimeAdapter) {
        throw new Error('KPIUtilReportRuntimeAdapter must load before sheet/modal/shell.js');
    }

    if (runtimeAdapter.getApi('KPIUtilReportSheetModalShell')) {
        return;
    }

    const utilReportSheetConfig = runtimeAdapter.requireApi(
        'KPIUtilReportSheetConfig',
        'KPI.util.report.sheet.modal-shell.js'
    );

    const {
        UtilSheetCompareState,
        UtilSheetReportState,
        UtilSheetReportMonthState,
        UtilSheetAnalysisState
    } = utilReportSheetConfig;

    const runtime = {
        pruneUtilSheetDatasetToggles: null,
        closeUtilSheetReportModal: null,
        renderUtilSheetReportModal: null,
        syncUtilSheetDetachedReportWindow: null,
        syncUtilSheetReportWindowState: null,
        toggleUtilSheetReportExpanded: null,
        getUtilSheetAlternateType: null,
        getUtilSheetAlternateDatasetKey: null,
        resolveUtilSheetReportDatasetKey: null,
        normalizeUtilSheetCompareKey: null,
        normalizeUtilSheetType: null,
        openUtilGasAnalysisChartModal: null,
        openUtilGasAnalysisRatioTablePopup: null,
        openUtilSheetBillingPreview: null,
        getUtilSheetActiveAnalysisDatasetKey: null,
        setUtilSheetAnalysisDisplayMode: null,
        applyUtilSheetCompareSelection: null,
        applyUtilGasAnalysisCategorySelection: null,
        applyUtilElectricMeterViewSelection: null,
        setUtilGasAnalysisChartFullscreen: null,
        resolveUtilSheetAnalysisLabelToggleContext: null,
        setUtilSheetAnalysisShowLabels: null,
        setUtilGasAnalysisRatioShowLabels: null,
        setUtilGasAnalysisFuelInactive: null,
        applyUtilGasAnalysisRangeSelection: null,
        setUtilSheetAnalysisUnitKey: null,
        applyUtilGasMeterProductionSelection: null,
        applyUtilElectricMeterTeamSelection: null,
        applyUtilElectricAnalysisTeamSelection: null,
        isUtilSheetCustomAnalysisDataset: null,
        setUtilSheetAnalysisToMonth: null,
        syncUtilSheetPanelSelection: null,
        getUtilSheetAnalysisRangeState: null,
        setUtilSheetAnalysisRangeState: null,
        buildUtilGasAnalysisModel: null,
        buildUtilElectricAnalysisModel: null,
        buildUtilGasAnalysisBodyHtmlV2: null,
        buildUtilElectricAnalysisBodyHtmlV2: null,
        getUtilGasAnalysisInlineTableEntry: null,
        buildUtilGasAnalysisRangeTableHtml: null,
        buildUtilGasAnalysisMetricTableHtml: null
    };

    function setRuntimeAdapters(adapters = {}) {
        Object.assign(runtime, adapters || {});
        return api;
    }

    function rerenderAndSync(modal) {
        if (!modal) return;
        if (typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        if (typeof runtime.syncUtilSheetDetachedReportWindow === 'function') {
            runtime.syncUtilSheetDetachedReportWindow(modal);
        }
        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
    }

    function normalizeCompareKey(compareKey = 'month') {
        if (typeof runtime.normalizeUtilSheetCompareKey === 'function') {
            return runtime.normalizeUtilSheetCompareKey(compareKey);
        }
        return String(compareKey || '').trim() === 'year' ? 'year' : 'month';
    }

    function normalizeSheetType(sheetType = 'meter') {
        if (typeof runtime.normalizeUtilSheetType === 'function') {
            return runtime.normalizeUtilSheetType(sheetType);
        }
        return String(sheetType || '').trim() === 'analysis' ? 'analysis' : 'meter';
    }

    function resolveDatasetKey(sheetType, datasetKey) {
        if (typeof runtime.resolveUtilSheetReportDatasetKey === 'function') {
            return runtime.resolveUtilSheetReportDatasetKey(sheetType, datasetKey);
        }
        return String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
    }

    function getAlternateSheetType(sheetType = 'meter') {
        if (typeof runtime.getUtilSheetAlternateType === 'function') {
            return runtime.getUtilSheetAlternateType(sheetType);
        }
        return normalizeSheetType(sheetType) === 'analysis' ? 'meter' : 'analysis';
    }

    function getAlternateDatasetKey(datasetKey = '', sheetType = 'meter') {
        if (typeof runtime.getUtilSheetAlternateDatasetKey === 'function') {
            return runtime.getUtilSheetAlternateDatasetKey(datasetKey, sheetType);
        }
        return String(datasetKey || '').trim() === 'electric' ? 'gas' : 'electric';
    }

    function isCustomAnalysisDataset(datasetKey = '') {
        if (typeof runtime.isUtilSheetCustomAnalysisDataset === 'function') {
            return runtime.isUtilSheetCustomAnalysisDataset(datasetKey);
        }
        return false;
    }

    function getActiveAnalysisDatasetKey(modal) {
        if (typeof runtime.getUtilSheetActiveAnalysisDatasetKey === 'function') {
            return runtime.getUtilSheetActiveAnalysisDatasetKey(modal);
        }
        return resolveDatasetKey('analysis', modal?.dataset?.datasetKey || UtilSheetReportState.analysis || 'gas');
    }

    function findClosest(target, selector) {
        if (!target || typeof target.closest !== 'function') return null;
        return target.closest(selector);
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeJsonForHtml(value) {
        try {
            return JSON.stringify(value)
                .replace(/</g, '\\u003c')
                .replace(/>/g, '\\u003e')
                .replace(/&/g, '\\u0026');
        } catch (error) {
            void error;
            return '{}';
        }
    }

    function getTextContent(root, selector, fallback = '') {
        return String(root?.querySelector?.(selector)?.textContent || fallback || '').trim();
    }

    function sanitizeFileToken(value = '') {
        const token = String(value || '')
            .trim()
            .replace(/[\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
        return token || 'utility-report';
    }

    function buildTemplateKey(fromValue = '', toValue = '') {
        return `${String(fromValue || '').trim()}__${String(toValue || '').trim()}`;
    }

    function getDocumentStylesHtml(doc) {
        if (!doc) return '';
        const styleBlocks = [];
        const inlineStyles = typeof doc.querySelectorAll === 'function'
            ? Array.from(doc.querySelectorAll('style')).map(node => node?.outerHTML || '').filter(Boolean)
            : [];
        styleBlocks.push(...inlineStyles);
        const stylesheetCss = [];
        Array.from(doc.styleSheets || []).forEach(sheet => {
            try {
                const rules = Array.from(sheet?.cssRules || []);
                if (rules.length) {
                    stylesheetCss.push(rules.map(rule => rule.cssText || '').filter(Boolean).join('\n'));
                }
            } catch (error) {
                void error;
            }
        });
        if (stylesheetCss.length) {
            styleBlocks.push(`<style data-util-sheet-export-source="document-styles">\n${stylesheetCss.join('\n')}\n</style>`);
        } else if (typeof doc.querySelectorAll === 'function') {
            Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).forEach(node => {
                if (node?.outerHTML) styleBlocks.push(node.outerHTML);
            });
        }
        return styleBlocks.join('\n');
    }

    function buildExportTemplateSubText(model = {}) {
        const parts = [];
        if (model.rangeLabel) parts.push(`범위 ${model.rangeLabel}`);
        if (model.compareLabel) parts.push(model.compareLabel);
        const basisLabel = String(model.categoryOption?.label || model.teamOption?.label || '').trim();
        if (basisLabel) parts.push(`기준 ${basisLabel}`);
        return parts.join(' / ');
    }

    function collectExportPopupTableKeys(model = {}) {
        const keys = new Set();
        const addKey = key => {
            const normalized = String(key || '').trim();
            if (normalized) keys.add(normalized);
        };
        const addControlItems = items => {
            (Array.isArray(items) ? items : []).forEach(item => {
                addKey(item?.popupTableKey || item?.key);
            });
        };
        addControlItems(model.combinedChart?.controlItems);
        addControlItems(model.ratioCombinedChart?.controlItems);
        (Array.isArray(model.charts) ? model.charts : []).forEach(chart => {
            addKey(chart?.popupTableKey || chart?.key);
            addControlItems(chart?.controlItems);
            addControlItems(chart?.summaryControlItems);
        });
        (Array.isArray(model.summaryItems) ? model.summaryItems : []).forEach(item => {
            addKey(item?.popupTableKey || item?.key);
        });
        return Array.from(keys);
    }

    function buildExportPopupTables(datasetKey = '', model = {}) {
        if (
            typeof runtime.getUtilGasAnalysisInlineTableEntry !== 'function'
            || typeof runtime.buildUtilGasAnalysisRangeTableHtml !== 'function'
            || typeof runtime.buildUtilGasAnalysisMetricTableHtml !== 'function'
        ) {
            return {};
        }
        const tempModal = {
            dataset: {
                sheetType: 'analysis',
                datasetKey: String(datasetKey || model.datasetKey || '').trim()
            },
            _utilSheetAnalysisModel: model
        };
        return collectExportPopupTableKeys(model).reduce((acc, tableKey) => {
            const entry = runtime.getUtilGasAnalysisInlineTableEntry(tempModal, tableKey);
            if (!entry?.table) return acc;
            const tableHtml = entry.kind === 'ratio'
                ? runtime.buildUtilGasAnalysisRangeTableHtml(entry.table, entry.controlItem, { hideDisplayModeControls: true })
                : runtime.buildUtilGasAnalysisMetricTableHtml(entry.table);
            if (tableHtml) acc[String(tableKey).trim().toLowerCase()] = tableHtml;
            return acc;
        }, {});
    }

    function collectExportControlItems(model = {}) {
        const itemMap = new Map();
        const addItems = items => {
            (Array.isArray(items) ? items : []).forEach(item => {
                const key = String(item?.key || '').trim();
                if (!key || itemMap.has(key)) return;
                itemMap.set(key, item);
            });
        };
        addItems(model.combinedChart?.controlItems);
        addItems(model.ratioCombinedChart?.controlItems);
        (Array.isArray(model.charts) ? model.charts : []).forEach(chart => {
            addItems(chart?.controlItems);
            addItems(chart?.summaryControlItems);
        });
        return Array.from(itemMap.values());
    }

    function collectExportFuelItems(model = {}) {
        const fuelMap = new Map();
        (Array.isArray(model.charts) ? model.charts : []).forEach(chart => {
            const fuelKey = String(chart?.fuelKey || '').trim();
            if (!fuelKey || fuelMap.has(fuelKey)) return;
            fuelMap.set(fuelKey, {
                fuelKey,
                isInactive: chart?.isInactive === true
            });
        });
        return Array.from(fuelMap.values());
    }

    function collectExportSelectValues(bodyHtml = '', dataRole = '') {
        const role = String(dataRole || '').trim();
        if (!role) return [];
        const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const selectPattern = new RegExp(`<select\\b(?=[^>]*\\bdata-role=["']${escapedRole}["'])[^>]*>([\\s\\S]*?)<\\/select>`, 'i');
        const optionPattern = /<option\b[^>]*\bvalue=(["'])(.*?)\1[^>]*>/gi;
        const selectBody = selectPattern.exec(String(bodyHtml || ''))?.[1] || '';
        const values = [];
        let optionMatch = optionPattern.exec(selectBody);
        while (optionMatch) {
            const value = String(optionMatch[2] || '').trim();
            if (value && !values.includes(value)) values.push(value);
            optionMatch = optionPattern.exec(selectBody);
        }
        return values;
    }

    function cloneExportState(value) {
        try {
            return JSON.parse(JSON.stringify(value || {}));
        } catch (error) {
            void error;
            return {};
        }
    }

    function restoreExportAnalysisState(datasetKey = '', snapshot = {}) {
        const normalizedDatasetKey = String(datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
        const target = UtilSheetAnalysisState?.[normalizedDatasetKey];
        if (!target || typeof target !== 'object') return;
        Object.keys(target).forEach(key => {
            delete target[key];
        });
        Object.assign(target, cloneExportState(snapshot));
    }

    function buildExportInteractionVariants(datasetKey = '', model = {}, modal = null, currentBodyHtml = '') {
        const normalizedDatasetKey = String(datasetKey || model.datasetKey || '').trim() === 'electric' ? 'electric' : 'gas';
        const baseStateSnapshot = cloneExportState(UtilSheetAnalysisState?.[normalizedDatasetKey]);
        const compareKey = normalizeCompareKey(modal?.dataset?.compareKey || 'month');
        const teamKey = String(modal?.dataset?.electricAnalysisTeamKey || model?.teamOption?.key || 'combined').trim() || 'combined';
        const range = {
            from: String(model?.range?.from || '').trim(),
            to: String(model?.range?.to || '').trim()
        };
        const variants = {};
        const controlItems = collectExportControlItems(model);
        const fuelItems = collectExportFuelItems(model);
        const comboDimensions = [];

        const pushComboDimension = (values = [], tokenBuilder = null, apply = null, priority = 10) => {
            if (typeof tokenBuilder !== 'function' || typeof apply !== 'function') return;
            const uniqueValues = values
                .map(value => String(value ?? '').trim())
                .filter(Boolean)
                .filter((value, index, list) => list.indexOf(value) === index);
            if (!uniqueValues.length) return;
            comboDimensions.push({
                values: uniqueValues,
                tokenBuilder,
                apply,
                priority: Number(priority) || 10
            });
        };

        const buildModel = (options = {}) => {
            if (typeof runtime.setUtilSheetAnalysisRangeState === 'function') {
                runtime.setUtilSheetAnalysisRangeState(normalizedDatasetKey, range.from, range.to);
            }
            return normalizedDatasetKey === 'electric'
                ? (typeof runtime.buildUtilElectricAnalysisModel === 'function'
                    ? runtime.buildUtilElectricAnalysisModel(
                        range.to,
                        compareKey,
                        String(options.teamKey || UtilSheetAnalysisState?.electric?.teamKey || teamKey).trim() || 'combined'
                    )
                    : null)
                : (typeof runtime.buildUtilGasAnalysisModel === 'function'
                    ? runtime.buildUtilGasAnalysisModel(range.to, compareKey)
                    : null);
        };
        const addVariant = (key, nextModel) => {
            if (!key || !nextModel?.hasData || variants[key]) return;
            const template = buildExportBodyTemplate(normalizedDatasetKey, nextModel, modal);
            variants[key] = {
                key,
                rangeLabel: template.rangeLabel,
                subText: template.subText,
                bodyHtml: template.bodyHtml,
                popupTables: template.popupTables
            };
        };
        const buildComboVariantKey = changes => {
            const tokens = (Array.isArray(changes) ? changes : [])
                .map(change => change?.token)
                .map(token => String(token || '').trim())
                .filter(Boolean)
                .sort();
            return tokens.length ? `combo:${tokens.join('|')}` : '';
        };
        const restoreBaseState = () => {
            restoreExportAnalysisState(normalizedDatasetKey, baseStateSnapshot);
            if (typeof runtime.setUtilSheetAnalysisRangeState === 'function') {
                runtime.setUtilSheetAnalysisRangeState(normalizedDatasetKey, range.from, range.to);
            }
            controlItems.forEach(item => {
                const chartKey = String(item?.key || '').trim();
                if (!chartKey) return;
                if (typeof runtime.setUtilSheetAnalysisUnitKey === 'function' && item?.unitKey) {
                    runtime.setUtilSheetAnalysisUnitKey(normalizedDatasetKey, chartKey, item.unitKey);
                }
                if (typeof runtime.setUtilSheetAnalysisDisplayMode === 'function' && item?.displayMode) {
                    runtime.setUtilSheetAnalysisDisplayMode(normalizedDatasetKey, chartKey, item.displayMode);
                }
            });
            if (normalizedDatasetKey === 'gas') {
                fuelItems.forEach(item => {
                    if (typeof runtime.setUtilGasAnalysisFuelInactive === 'function') {
                        runtime.setUtilGasAnalysisFuelInactive(item.fuelKey, item.isInactive);
                    }
                });
            }
        };

        if (!range.from || !range.to) return variants;

        controlItems.forEach(item => {
            const chartKey = String(item?.key || '').trim();
            if (!chartKey) return;
            const baseUnitKey = String(item?.unitKey || '').trim();
            const unitValues = (Array.isArray(item?.unitOptions) ? item.unitOptions : [])
                .map(option => String(option?.key || '').trim())
                .filter(unitKey => unitKey && unitKey !== baseUnitKey);
            pushComboDimension(
                typeof runtime.setUtilSheetAnalysisUnitKey === 'function' ? unitValues : [],
                value => `unit:${chartKey}:${value}`,
                value => runtime.setUtilSheetAnalysisUnitKey(normalizedDatasetKey, chartKey, value),
                20
            );
            (Array.isArray(item?.unitOptions) ? item.unitOptions : []).forEach(option => {
                const unitKey = String(option?.key || '').trim();
                if (!unitKey || unitKey === baseUnitKey) return;
                if (typeof runtime.setUtilSheetAnalysisUnitKey !== 'function') return;
                restoreBaseState();
                runtime.setUtilSheetAnalysisUnitKey(normalizedDatasetKey, chartKey, unitKey);
                addVariant(`unit:${chartKey}:${unitKey}`, buildModel());
            });
            const baseDisplayMode = String(item?.displayMode || '').trim();
            pushComboDimension(
                typeof runtime.setUtilSheetAnalysisDisplayMode === 'function'
                    ? ['bar', 'line', 'none'].filter(displayMode => displayMode !== baseDisplayMode)
                    : [],
                value => `display:${chartKey}:${value}`,
                value => runtime.setUtilSheetAnalysisDisplayMode(normalizedDatasetKey, chartKey, value),
                30
            );
            ['bar', 'line', 'none'].forEach(displayMode => {
                if (displayMode === baseDisplayMode) return;
                if (typeof runtime.setUtilSheetAnalysisDisplayMode !== 'function') return;
                restoreBaseState();
                runtime.setUtilSheetAnalysisDisplayMode(normalizedDatasetKey, chartKey, displayMode);
                addVariant(`display:${chartKey}:${displayMode}`, buildModel());
            });
        });

        if (typeof runtime.setUtilSheetAnalysisShowLabels === 'function') {
            const labelChartKeys = normalizedDatasetKey === 'electric'
                ? ['combined', 'electricIntensity']
                : ['combined'];
            labelChartKeys.forEach(chartKey => {
                const baseLabelValue = normalizedDatasetKey === 'electric'
                    ? (baseStateSnapshot?.[chartKey === 'electricIntensity' ? 'intensityShowLabels' : 'showLabels'] === true)
                    : (baseStateSnapshot?.showLabels === true);
                pushComboDimension(
                    [true, false]
                        .map(value => String(value))
                        .filter(value => value !== String(baseLabelValue)),
                    value => `labels:${chartKey}:${value}`,
                    value => runtime.setUtilSheetAnalysisShowLabels(normalizedDatasetKey, chartKey, value === 'true'),
                    40
                );
                [true, false].forEach(showLabels => {
                    restoreBaseState();
                    runtime.setUtilSheetAnalysisShowLabels(normalizedDatasetKey, chartKey, showLabels);
                    addVariant(`labels:${chartKey}:${showLabels}`, buildModel());
                });
            });
        }

        if (normalizedDatasetKey === 'gas') {
            const baseCategoryKey = String(baseStateSnapshot?.categoryKey || model?.categoryOption?.key || '').trim();
            const categoryValues = collectExportSelectValues(currentBodyHtml, 'util-sheet-analysis-gas-category-select')
                .filter(categoryKey => categoryKey !== baseCategoryKey);
            pushComboDimension(
                categoryValues,
                value => `category:${value}`,
                value => {
                    if (UtilSheetAnalysisState?.gas) {
                        UtilSheetAnalysisState.gas.categoryKey = value;
                    }
                },
                0
            );
            categoryValues.forEach(categoryKey => {
                if (!categoryKey || categoryKey === baseCategoryKey) return;
                restoreBaseState();
                if (UtilSheetAnalysisState?.gas) {
                    UtilSheetAnalysisState.gas.categoryKey = categoryKey;
                }
                addVariant(`category:${categoryKey}`, buildModel());
            });
            if (typeof runtime.setUtilGasAnalysisRatioShowLabels === 'function') {
                const baseRatioLabelValue = baseStateSnapshot?.ratioShowLabels === true;
                pushComboDimension(
                    [true, false]
                        .map(value => String(value))
                        .filter(value => value !== String(baseRatioLabelValue)),
                    value => `ratioLabels:${value}`,
                    value => runtime.setUtilGasAnalysisRatioShowLabels(value === 'true'),
                    50
                );
                [true, false].forEach(showLabels => {
                    restoreBaseState();
                    runtime.setUtilGasAnalysisRatioShowLabels(showLabels);
                    addVariant(`ratioLabels:${showLabels}`, buildModel());
                });
            }
            fuelItems.forEach(item => {
                pushComboDimension(
                    typeof runtime.setUtilGasAnalysisFuelInactive === 'function'
                        ? [true, false]
                            .map(value => String(value))
                            .filter(value => value !== String(item.isInactive))
                        : [],
                    value => `inactive:${item.fuelKey}:${value}`,
                    value => runtime.setUtilGasAnalysisFuelInactive(item.fuelKey, value === 'true'),
                    10
                );
                [true, false].forEach(inactive => {
                    if (inactive === item.isInactive || typeof runtime.setUtilGasAnalysisFuelInactive !== 'function') return;
                    restoreBaseState();
                    runtime.setUtilGasAnalysisFuelInactive(item.fuelKey, inactive);
                    addVariant(`inactive:${item.fuelKey}:${inactive}`, buildModel());
                });
            });
        } else {
            const baseTeamKey = String(baseStateSnapshot?.teamKey || model?.teamOption?.key || teamKey).trim();
            const teamValues = collectExportSelectValues(currentBodyHtml, 'util-sheet-analysis-electric-team-select')
                .filter(nextTeamKey => nextTeamKey !== baseTeamKey);
            pushComboDimension(
                teamValues,
                value => `team:${value}`,
                value => {
                    if (UtilSheetAnalysisState?.electric) {
                        UtilSheetAnalysisState.electric.teamKey = value;
                    }
                },
                0
            );
            teamValues.forEach(nextTeamKey => {
                if (!nextTeamKey || nextTeamKey === baseTeamKey) return;
                restoreBaseState();
                if (UtilSheetAnalysisState?.electric) {
                    UtilSheetAnalysisState.electric.teamKey = nextTeamKey;
                }
                addVariant(`team:${nextTeamKey}`, buildModel({ teamKey: nextTeamKey }));
            });
        }

        comboDimensions.sort((left, right) => left.priority - right.priority);
        let comboVariantCount = 0;
        const maxComboVariantCount = 160;
        const addComboVariant = changes => {
            if (comboVariantCount >= maxComboVariantCount) return;
            const key = buildComboVariantKey(changes);
            if (!key || variants[key]) return;
            restoreBaseState();
            changes.forEach(change => {
                if (typeof change?.apply === 'function') {
                    change.apply(change.value);
                }
            });
            addVariant(key, buildModel());
            comboVariantCount += 1;
        };
        const buildComboChange = (dimension, value) => ({
            token: dimension.tokenBuilder(value),
            value,
            apply: dimension.apply
        });
        comboDimensions.forEach(dimension => {
            dimension.values.forEach(value => addComboVariant([buildComboChange(dimension, value)]));
        });
        const walkComboVariants = (startIndex = 0, changes = []) => {
            if (comboVariantCount >= maxComboVariantCount) return true;
            if (changes.length >= 3) return false;
            for (let dimensionIndex = startIndex; dimensionIndex < comboDimensions.length; dimensionIndex += 1) {
                const dimension = comboDimensions[dimensionIndex];
                for (let valueIndex = 0; valueIndex < dimension.values.length; valueIndex += 1) {
                    const nextChanges = [...changes, buildComboChange(dimension, dimension.values[valueIndex])];
                    if (nextChanges.length >= 2) {
                        addComboVariant(nextChanges);
                    }
                    if (comboVariantCount >= maxComboVariantCount) return true;
                    if (walkComboVariants(dimensionIndex + 1, nextChanges)) return true;
                }
            }
            return false;
        };
        walkComboVariants();

        restoreBaseState();
        return variants;
    }

    function buildExportBodyTemplate(datasetKey = '', model = {}, modal = null) {
        const tempModal = {
            dataset: {
                sheetType: 'analysis',
                datasetKey: String(datasetKey || model.datasetKey || '').trim()
            },
            _utilSheetAnalysisModel: model
        };
        const bodyHtml = datasetKey === 'electric'
            ? (typeof runtime.buildUtilElectricAnalysisBodyHtmlV2 === 'function'
                ? runtime.buildUtilElectricAnalysisBodyHtmlV2(model, {}, tempModal)
                : '')
            : (typeof runtime.buildUtilGasAnalysisBodyHtmlV2 === 'function'
                ? runtime.buildUtilGasAnalysisBodyHtmlV2(model, {}, tempModal)
                : '');
        const fromValue = String(model?.range?.from || '').trim();
        const toValue = String(model?.range?.to || '').trim();
        const key = buildTemplateKey(fromValue, toValue);
        return {
            key,
            from: fromValue,
            to: toValue,
            rangeLabel: String(model?.rangeLabel || '').trim(),
            subText: buildExportTemplateSubText(model),
            bodyHtml,
            popupTables: buildExportPopupTables(datasetKey, model)
        };
    }

    function buildAnalysisExportTemplates(modal, currentBodyHtml = '') {
        const sheetType = normalizeSheetType(modal?.dataset?.sheetType || 'meter');
        const datasetKey = resolveDatasetKey(sheetType, modal?.dataset?.datasetKey || '');
        const currentModel = modal?._utilSheetAnalysisModel || null;
        const currentRange = currentModel?.range || {};
        const currentKey = buildTemplateKey(currentRange.from, currentRange.to);
        const templates = {};
        if (sheetType !== 'analysis' || !currentModel?.hasData || !currentKey.trim()) {
            const fallbackKey = currentKey || 'current__current';
            templates[fallbackKey] = {
                key: fallbackKey,
                from: String(currentRange.from || '').trim(),
                to: String(currentRange.to || '').trim(),
                rangeLabel: String(currentModel?.rangeLabel || '').trim(),
                subText: buildExportTemplateSubText(currentModel || {}),
                bodyHtml: currentBodyHtml,
                popupTables: buildExportPopupTables(datasetKey, currentModel || {})
            };
            return { templates, currentKey: fallbackKey, completeRangeSet: false };
        }

        const monthOptions = Array.isArray(currentModel.monthOptions) ? currentModel.monthOptions : [];
        const originalRange = {
            from: String(currentRange.from || '').trim(),
            to: String(currentRange.to || '').trim()
        };
        const compareKey = normalizeCompareKey(modal.dataset.compareKey || 'month');
        const teamKey = String(modal.dataset.electricAnalysisTeamKey || currentModel?.teamOption?.key || 'combined').trim() || 'combined';
        const canBuildRangeTemplates = typeof runtime.setUtilSheetAnalysisRangeState === 'function'
            && (datasetKey === 'gas' || datasetKey === 'electric')
            && (datasetKey !== 'gas' || typeof runtime.buildUtilGasAnalysisModel === 'function')
            && (datasetKey !== 'electric' || typeof runtime.buildUtilElectricAnalysisModel === 'function')
            && (datasetKey !== 'gas' || typeof runtime.buildUtilGasAnalysisBodyHtmlV2 === 'function')
            && (datasetKey !== 'electric' || typeof runtime.buildUtilElectricAnalysisBodyHtmlV2 === 'function');

        const addTemplate = (fromValue, toValue) => {
            const from = String(fromValue || '').trim();
            const to = String(toValue || '').trim();
            const key = buildTemplateKey(from, to);
            if (!from || !to || templates[key]) return;
            if (!canBuildRangeTemplates) {
                if (key === currentKey) {
                    templates[key] = buildExportBodyTemplate(datasetKey, currentModel, modal);
                }
                return;
            }
            runtime.setUtilSheetAnalysisRangeState(datasetKey, from, to);
            const model = datasetKey === 'electric'
                ? runtime.buildUtilElectricAnalysisModel(to, compareKey, teamKey)
                : runtime.buildUtilGasAnalysisModel(to, compareKey);
            if (!model?.hasData) return;
            templates[key] = buildExportBodyTemplate(datasetKey, model, modal);
        };

        const optionValues = monthOptions.map(item => String(item?.value || '').trim()).filter(Boolean);
        const maxTemplateCount = 220;
        const fullCombinationCount = (optionValues.length * (optionValues.length + 1)) / 2;
        if (optionValues.length && fullCombinationCount <= maxTemplateCount) {
            optionValues.forEach((fromValue, fromIndex) => {
                optionValues.slice(fromIndex).forEach(toValue => addTemplate(fromValue, toValue));
            });
        } else if (optionValues.length) {
            const currentFromIndex = Math.max(0, optionValues.indexOf(originalRange.from));
            const currentToIndex = Math.max(currentFromIndex, optionValues.indexOf(originalRange.to));
            optionValues.forEach((toValue, toIndex) => {
                if (toIndex >= currentFromIndex) addTemplate(originalRange.from, toValue);
            });
            optionValues.forEach((fromValue, fromIndex) => {
                if (fromIndex <= currentToIndex) addTemplate(fromValue, originalRange.to);
            });
        }
        addTemplate(originalRange.from, originalRange.to);
        if (templates[currentKey]) {
            templates[currentKey] = {
                ...templates[currentKey],
                bodyHtml: currentBodyHtml || templates[currentKey].bodyHtml,
                popupTables: buildExportPopupTables(datasetKey, currentModel),
                variants: buildExportInteractionVariants(
                    datasetKey,
                    currentModel,
                    modal,
                    currentBodyHtml || templates[currentKey].bodyHtml
                )
            };
        }
        if (canBuildRangeTemplates) {
            runtime.setUtilSheetAnalysisRangeState(datasetKey, originalRange.from, originalRange.to);
        }
        return {
            templates,
            currentKey,
            completeRangeSet: Boolean(optionValues.length && fullCombinationCount <= maxTemplateCount)
        };
    }

    function buildStandaloneExportScript() {
        return [
            '(function bindUtilSheetStandaloneExport() {',
            '    const dataEl = document.getElementById("util-sheet-export-data");',
            '    const data = dataEl ? JSON.parse(dataEl.textContent || "{}") : {};',
            '    const bodyEl = document.querySelector("[data-role=\\"util-sheet-export-body\\"]");',
            '    const popup = document.querySelector("[data-role=\\"util-sheet-export-popup\\"]");',
            '    const popupTitle = popup ? popup.querySelector("[data-role=\\"util-sheet-export-popup-title\\"]") : null;',
            '    const popupBody = popup ? popup.querySelector("[data-role=\\"util-sheet-export-popup-body\\"]") : null;',
            '    const templateKeys = data.templates || {};',
            '    let activeKey = data.currentKey || "";',
            '    let activeVariantKey = "";',
            '    let activeVariantTokens = new Map();',
            '    let baseControlValues = new Map();',
            '    function normalizeKey(fromValue, toValue) { return String(fromValue || "").trim() + "__" + String(toValue || "").trim(); }',
            '    function getBaseTemplate() { return templateKeys[activeKey] || templateKeys[data.currentKey] || {}; }',
            '    function getActiveTemplate() {',
            '        const template = getBaseTemplate();',
            '        return (activeVariantKey && template.variants && template.variants[activeVariantKey]) || template;',
            '    }',
            '    function setBaseControlValue(key, value) {',
            '        const normalizedKey = String(key || "").trim();',
            '        if (!normalizedKey) return;',
            '        baseControlValues.set(normalizedKey, String(value ?? "").trim());',
            '    }',
            '    function captureBaseControlValues() {',
            '        baseControlValues = new Map();',
            '        if (!bodyEl) return;',
            '        const categorySelect = bodyEl.querySelector("[data-role=\\"util-sheet-analysis-gas-category-select\\"]");',
            '        if (categorySelect) setBaseControlValue("category", categorySelect.value);',
            '        const teamSelect = bodyEl.querySelector("[data-role=\\"util-sheet-analysis-electric-team-select\\"]");',
            '        if (teamSelect) setBaseControlValue("team", teamSelect.value);',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-unit\\"]").forEach(function (select) {',
            '            const chartKey = String(select.dataset.chartKey || "").trim();',
            '            if (chartKey) setBaseControlValue("unit:" + chartKey, select.value);',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-series-type\\"].is-active, [data-role=\\"util-sheet-analysis-series-type\\"][aria-pressed=\\"true\\"]").forEach(function (button) {',
            '            const chartKey = String(button.dataset.chartKey || "").trim();',
            '            if (chartKey) setBaseControlValue("display:" + chartKey, button.dataset.chartType || "");',
            '        });',
            '        bodyEl.querySelectorAll("[data-chart-label-toggle], [data-role=\\"util-sheet-analysis-electric-combined-label-toggle\\"], [data-role=\\"util-sheet-analysis-electric-intensity-label-toggle\\"]").forEach(function (toggle) {',
            '            const card = toggle.closest("[data-analysis-chart-key]");',
            '            const role = String(toggle.getAttribute("data-role") || "").trim();',
            '            const chartKey = String(card?.dataset?.analysisChartKey || (role === "util-sheet-analysis-electric-intensity-label-toggle" ? "electricIntensity" : "combined") || "combined").trim();',
            '            setBaseControlValue("labels:" + chartKey, toggle.checked === true);',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-ratio-label-toggle\\"]").forEach(function (toggle) {',
            '            setBaseControlValue("ratioLabels", toggle.checked === true);',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-fuel-inactive\\"]").forEach(function (toggle) {',
            '            const fuelKey = String(toggle.dataset.fuelKey || "").trim();',
            '            if (fuelKey) setBaseControlValue("inactive:" + fuelKey, toggle.checked === true);',
            '        });',
            '    }',
            '    function rememberVariantToken(controlKey, value, token) {',
            '        const normalizedKey = String(controlKey || "").trim();',
            '        if (!normalizedKey) return;',
            '        const normalizedValue = String(value ?? "").trim();',
            '        if (baseControlValues.has(normalizedKey) && baseControlValues.get(normalizedKey) === normalizedValue) {',
            '            activeVariantTokens.delete(normalizedKey);',
            '            return;',
            '        }',
            '        activeVariantTokens.set(normalizedKey, String(token || "").trim());',
            '    }',
            '    function buildComboVariantKey() {',
            '        const tokens = Array.from(activeVariantTokens.values()).map(function (token) { return String(token || "").trim(); }).filter(Boolean).sort();',
            '        return tokens.length ? "combo:" + tokens.join("|") : "";',
            '    }',
            '    function applyVariantWithToken(controlKey, value, token, legacyKey) {',
            '        rememberVariantToken(controlKey, value, token);',
            '        const comboKey = buildComboVariantKey();',
            '        if (comboKey && applyVariant(comboKey)) return true;',
            '        if (applyVariant(legacyKey)) {',
            '            activeVariantTokens = new Map();',
            '            rememberVariantToken(controlKey, value, token);',
            '            return true;',
            '        }',
            '        return false;',
            '    }',
            '    function getSelectedRange() {',
            '        const fromSelect = bodyEl ? bodyEl.querySelector("[data-role=\\"util-sheet-analysis-from\\"]") : null;',
            '        const toSelect = bodyEl ? bodyEl.querySelector("[data-role=\\"util-sheet-analysis-to\\"]") : null;',
            '        return { from: fromSelect ? fromSelect.value : "", to: toSelect ? toSelect.value : "", fromSelect, toSelect };',
            '    }',
            '    function syncHeader(template) {',
            '        if (!template) return;',
            '        document.querySelectorAll("[data-role=\\"util-sheet-export-range-label\\"]").forEach(function (node) { node.textContent = template.rangeLabel || ""; });',
            '        document.querySelectorAll("[data-role=\\"util-sheet-report-sub\\"], [data-role=\\"util-sheet-export-sub\\"]").forEach(function (node) { node.textContent = template.subText || data.subText || ""; });',
            '    }',
            '    function closePopup() {',
            '        if (!popup) return;',
            '        popup.classList.remove("is-open");',
            '        popup.setAttribute("aria-hidden", "true");',
            '        if (popupBody) popupBody.innerHTML = "";',
            '    }',
            '    function openPopup(title, html) {',
            '        if (!popup || !popupBody) return;',
            '        if (popupTitle) popupTitle.textContent = title || "상세 보기";',
            '        popupBody.innerHTML = html || "";',
            '        popup.classList.add("is-open");',
            '        popup.setAttribute("aria-hidden", "false");',
            '        bindDragScroll(popupBody);',
            '    }',
            '    function bindDragScroll(root) {',
            '        const host = root && typeof root.querySelectorAll === "function" ? root : document;',
            '        if (!host || typeof host.querySelectorAll !== "function") return;',
            '        const resolveScrollableChartElement = function (candidate) {',
            '            const surface = candidate?.closest?.(".util-sheet-analysis-chart-surface");',
            '            if (surface && (surface.scrollWidth - surface.clientWidth) > 4) return surface;',
            '            const canvas = candidate?.closest?.(".util-analytics-chart-canvas") || candidate?.querySelector?.(".util-analytics-chart-canvas");',
            '            if (canvas && (canvas.scrollWidth - canvas.clientWidth) > 4) return canvas;',
            '            return surface || canvas || candidate || null;',
            '        };',
            '        Array.from(host.querySelectorAll(".util-sheet-analysis-chart-surface, .util-analytics-chart-canvas")).forEach(function (candidate) {',
            '            const scrollEl = resolveScrollableChartElement(candidate);',
            '            if (!scrollEl || scrollEl.dataset.analysisDragBound === "true") return;',
            '            scrollEl.dataset.analysisDragBound = "true";',
            '            let activePointerId = null;',
            '            let startX = 0;',
            '            let startScrollLeft = 0;',
            '            const finish = function () {',
            '                if (activePointerId === null) return;',
            '                activePointerId = null;',
            '                scrollEl.classList.remove("is-dragging");',
            '            };',
            '            const isInteractive = function (target) {',
            '                return !!target?.closest?.("input, select, textarea, button, label, a, summary, details, [contenteditable]");',
            '            };',
            '            scrollEl.addEventListener("pointerdown", function (event) {',
            '                if (event.pointerType === "mouse" && event.button !== 0) return;',
            '                if (isInteractive(event.target)) return;',
            '                if ((scrollEl.scrollWidth - scrollEl.clientWidth) <= 4) return;',
            '                activePointerId = event.pointerId;',
            '                startX = event.clientX;',
            '                startScrollLeft = scrollEl.scrollLeft;',
            '                scrollEl.classList.add("is-dragging");',
            '                if (typeof scrollEl.setPointerCapture === "function") {',
            '                    try { scrollEl.setPointerCapture(activePointerId); } catch (error) {}',
            '                }',
            '            });',
            '            scrollEl.addEventListener("pointermove", function (event) {',
            '                if (activePointerId === null || event.pointerId !== activePointerId) return;',
            '                const diffX = event.clientX - startX;',
            '                const maxScrollLeft = Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth);',
            '                scrollEl.scrollLeft = Math.min(maxScrollLeft, Math.max(0, startScrollLeft - diffX));',
            '                if (Math.abs(diffX) > 2) event.preventDefault();',
            '            });',
            '            scrollEl.addEventListener("pointerup", function (event) { if (event.pointerId === activePointerId) finish(); });',
            '            scrollEl.addEventListener("pointercancel", function (event) { if (event.pointerId === activePointerId) finish(); });',
            '            scrollEl.addEventListener("lostpointercapture", finish);',
            '        });',
            '    }',
            '    function applyVariant(variantKey) {',
            '        const template = getBaseTemplate();',
            '        const variant = template.variants && template.variants[variantKey];',
            '        if (!variant || !variant.bodyHtml || !bodyEl) return false;',
            '        activeVariantKey = variantKey;',
            '        bodyEl.innerHTML = variant.bodyHtml;',
            '        syncHeader(variant);',
            '        bindBodyInteractions();',
            '        return true;',
            '    }',
            '    function bindBodyInteractions() {',
            '        if (!bodyEl) return;',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-from\\"], [data-role=\\"util-sheet-analysis-to\\"]").forEach(function (select) {',
            '            select.addEventListener("change", function () {',
            '                const range = getSelectedRange();',
            '                const key = normalizeKey(range.from, range.to);',
            '                const template = templateKeys[key];',
            '                if (!template) {',
            '                    alert("이 범위는 추출 파일에 포함되지 않았습니다. 원본 분석표에서 범위를 맞춘 뒤 다시 추출해 주세요.");',
            '                    const activeTemplate = templateKeys[activeKey] || templateKeys[data.currentKey];',
            '                    if (activeTemplate) {',
            '                        if (range.fromSelect) range.fromSelect.value = activeTemplate.from || range.fromSelect.value;',
            '                        if (range.toSelect) range.toSelect.value = activeTemplate.to || range.toSelect.value;',
            '                    }',
            '                    return;',
            '                }',
            '                activeKey = key;',
            '                activeVariantKey = "";',
            '                activeVariantTokens = new Map();',
            '                bodyEl.innerHTML = template.bodyHtml || "";',
            '                syncHeader(template);',
            '                captureBaseControlValues();',
            '                bindBodyInteractions();',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-open-chart\\"]").forEach(function (button) {',
            '            button.addEventListener("click", function () {',
            '                const card = button.closest("[data-role=\\"util-sheet-analysis-chart-card\\"], .util-sheet-analysis-chart-card");',
            '                if (!card) return;',
            '                const title = card.querySelector(".util-sheet-analysis-chart-title")?.textContent || "그래프";',
            '                const clone = card.cloneNode(true);',
            '                clone.querySelectorAll("[data-role=\\"util-sheet-analysis-open-chart\\"]").forEach(function (node) { node.remove(); });',
            '                openPopup(title, clone.outerHTML);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-open-ratio-table\\"]").forEach(function (button) {',
            '            button.addEventListener("click", function () {',
            '                const template = getActiveTemplate();',
            '                const tableKey = String(button.dataset.tableKey || "").trim().toLowerCase();',
            '                const tableHtml = template.popupTables && template.popupTables[tableKey];',
            '                if (tableHtml) {',
            '                    openPopup("상세표", tableHtml);',
            '                    return;',
            '                }',
            '                const card = button.closest(".util-sheet-analysis-summary-card, [data-role=\\"util-sheet-analysis-chart-card\\"], .util-sheet-analysis-chart-card");',
            '                if (card) openPopup("상세 보기", card.cloneNode(true).outerHTML);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-unit\\"]").forEach(function (select) {',
            '            select.addEventListener("change", function () {',
            '                const chartKey = String(select.dataset.chartKey || "").trim();',
            '                if (!chartKey) return;',
            '                const value = String(select.value || "").trim();',
            '                const token = "unit:" + chartKey + ":" + value;',
            '                applyVariantWithToken("unit:" + chartKey, value, token, token);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-gas-category-select\\"]").forEach(function (select) {',
            '            select.addEventListener("change", function () {',
            '                const value = String(select.value || "").trim();',
            '                const token = "category:" + value;',
            '                applyVariantWithToken("category", value, token, token);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-electric-team-select\\"]").forEach(function (select) {',
            '            select.addEventListener("change", function () {',
            '                const value = String(select.value || "").trim();',
            '                const token = "team:" + value;',
            '                applyVariantWithToken("team", value, token, token);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-series-type\\"]").forEach(function (button) {',
            '            button.addEventListener("click", function (event) {',
            '                event.preventDefault();',
            '                const chartKey = String(button.dataset.chartKey || "").trim();',
            '                const chartType = String(button.dataset.chartType || "").trim();',
            '                if (!chartKey || !chartType) return;',
            '                const token = "display:" + chartKey + ":" + chartType;',
            '                if (!applyVariantWithToken("display:" + chartKey, chartType, token, token)) {',
            '                    button.closest(".util-sheet-analysis-series-mode")?.querySelectorAll("[data-role=\\"util-sheet-analysis-series-type\\"]").forEach(function (node) {',
            '                        node.classList.toggle("is-active", node === button);',
            '                        node.setAttribute("aria-pressed", node === button ? "true" : "false");',
            '                    });',
            '                }',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-chart-label-toggle], [data-role=\\"util-sheet-analysis-electric-combined-label-toggle\\"], [data-role=\\"util-sheet-analysis-electric-intensity-label-toggle\\"]").forEach(function (toggle) {',
            '            toggle.addEventListener("change", function () {',
            '                const card = toggle.closest("[data-analysis-chart-key]");',
            '                const role = String(toggle.getAttribute("data-role") || "").trim();',
            '                const chartKey = String(card?.dataset?.analysisChartKey || (role === "util-sheet-analysis-electric-intensity-label-toggle" ? "electricIntensity" : "combined") || "combined").trim();',
            '                const value = String(toggle.checked === true);',
            '                const token = "labels:" + chartKey + ":" + value;',
            '                applyVariantWithToken("labels:" + chartKey, value, token, token);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-ratio-label-toggle\\"]").forEach(function (toggle) {',
            '            toggle.addEventListener("change", function () {',
            '                const value = String(toggle.checked === true);',
            '                const token = "ratioLabels:" + value;',
            '                applyVariantWithToken("ratioLabels", value, token, token);',
            '            });',
            '        });',
            '        bodyEl.querySelectorAll("[data-role=\\"util-sheet-analysis-fuel-inactive\\"]").forEach(function (toggle) {',
            '            toggle.addEventListener("change", function () {',
            '                const fuelKey = String(toggle.dataset.fuelKey || "").trim();',
            '                if (fuelKey) {',
            '                    const value = String(toggle.checked === true);',
            '                    const token = "inactive:" + fuelKey + ":" + value;',
            '                    applyVariantWithToken("inactive:" + fuelKey, value, token, token);',
            '                }',
            '            });',
            '        });',
            '        bindDragScroll(bodyEl);',
            '    }',
            '    document.addEventListener("click", function (event) {',
            '        if (event.target?.closest?.("[data-role=\\"util-sheet-export-popup-close\\"]")) closePopup();',
            '        if (event.target === popup) closePopup();',
            '    });',
            '    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closePopup(); });',
            '    syncHeader(templateKeys[activeKey] || templateKeys[data.currentKey]);',
            '    captureBaseControlValues();',
            '    bindBodyInteractions();',
            '})();'
        ].join('\n');
    }

    function buildStandaloneExportStyles() {
        return `
            <style>
                body.util-sheet-export-page {
                    margin: 0;
                    min-height: 100vh;
                    background: #f3f7fb;
                    color: #172033;
                    font-family: "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
                }
                .util-sheet-export-shell {
                    width: min(1400px, calc(100vw - 32px));
                    margin: 18px auto 28px;
                }
                .util-sheet-export-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 18px;
                    align-items: flex-end;
                    margin-bottom: 14px;
                    padding: 18px 20px;
                    border: 1px solid #d9e2ef;
                    border-radius: 8px;
                    background: #fff;
                    box-shadow: 0 18px 42px rgba(18, 33, 58, 0.10);
                }
                .util-sheet-export-kicker {
                    color: #155e95;
                    font-size: 12px;
                    font-weight: 900;
                }
                .util-sheet-export-title {
                    margin-top: 6px;
                    font-size: 28px;
                    font-weight: 950;
                    line-height: 1.18;
                }
                .util-sheet-export-sub {
                    margin-top: 6px;
                    color: #667085;
                    font-size: 13px;
                    font-weight: 800;
                }
                .util-sheet-export-actions {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    color: #667085;
                    font-size: 12px;
                    font-weight: 800;
                    text-align: right;
                }
                .util-sheet-export-body {
                    min-width: 0;
                }
                .util-sheet-export-body .util-sheet-analysis-chart-surface,
                .util-sheet-export-popup-body .util-sheet-analysis-chart-surface,
                .util-sheet-export-body .util-analytics-chart-canvas,
                .util-sheet-export-popup-body .util-analytics-chart-canvas {
                    cursor: grab;
                    touch-action: pan-x;
                    overscroll-behavior-x: contain;
                    scrollbar-gutter: stable both-edges;
                }
                .util-sheet-export-body .util-sheet-analysis-chart-surface.is-dragging,
                .util-sheet-export-popup-body .util-sheet-analysis-chart-surface.is-dragging,
                .util-sheet-export-body .util-analytics-chart-canvas.is-dragging,
                .util-sheet-export-popup-body .util-analytics-chart-canvas.is-dragging {
                    cursor: grabbing;
                }
                .util-sheet-export-popup {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 22px;
                    background: rgba(15, 23, 42, 0.62);
                }
                .util-sheet-export-popup.is-open {
                    display: flex;
                }
                .util-sheet-export-popup-card {
                    width: min(1280px, calc(100vw - 44px));
                    max-height: calc(100vh - 44px);
                    overflow: auto;
                    border-radius: 8px;
                    background: #fff;
                    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
                }
                .util-sheet-export-popup-head {
                    position: sticky;
                    top: 0;
                    z-index: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-bottom: 1px solid #e7edf6;
                    background: #fff;
                }
                .util-sheet-export-popup-title {
                    font-size: 16px;
                    font-weight: 950;
                }
                .util-sheet-export-popup-close {
                    width: 34px;
                    height: 34px;
                    border: 1px solid #d9e2ef;
                    border-radius: 6px;
                    background: #fff;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 900;
                }
                .util-sheet-export-popup-body {
                    padding: 16px;
                }
                .util-sheet-export-popup-body .util-sheet-analysis-chart-card {
                    min-height: calc(100vh - 140px);
                }
                @media print {
                    .util-sheet-export-actions,
                    .util-sheet-export-popup {
                        display: none !important;
                    }
                    .util-sheet-export-shell {
                        width: auto;
                        margin: 0;
                    }
                    .util-sheet-export-head {
                        box-shadow: none;
                    }
                }
            </style>
        `;
    }

    function buildUtilSheetStandaloneExportHtml(modal) {
        const doc = runtimeAdapter.getDocument();
        const bodyEl = modal?.querySelector?.('[data-role="util-sheet-report-body"]') || null;
        if (!doc || !modal || !bodyEl) return null;
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '유틸리티 분석표');
        const kicker = getTextContent(modal, '[data-role="util-sheet-report-kicker"]', 'UTILITY REPORT');
        const subText = getTextContent(modal, '[data-role="util-sheet-report-sub"]', '');
        const bodyHtml = bodyEl.innerHTML || '';
        if (!bodyHtml.trim()) return null;
        const exportTemplates = buildAnalysisExportTemplates(modal, bodyHtml);
        const data = {
            title,
            kicker,
            subText,
            sheetType: normalizeSheetType(modal.dataset.sheetType || 'analysis'),
            datasetKey: resolveDatasetKey('analysis', modal.dataset.datasetKey || ''),
            currentKey: exportTemplates.currentKey,
            completeRangeSet: exportTemplates.completeRangeSet,
            templates: exportTemplates.templates
        };
        return [
            '<!doctype html>',
            '<html lang="ko">',
            '<head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            `<title>${escapeHtml(title)} - 추출</title>`,
            getDocumentStylesHtml(doc),
            buildStandaloneExportStyles(),
            '</head>',
            '<body class="util-sheet-export-page">',
            '<main class="util-sheet-export-shell">',
            '<header class="util-sheet-export-head">',
            '<div>',
            `<div class="util-sheet-export-kicker">${escapeHtml(kicker)}</div>`,
            `<div class="util-sheet-export-title">${escapeHtml(title)}</div>`,
            `<div class="util-sheet-export-sub" data-role="util-sheet-export-sub">${escapeHtml(subText)}</div>`,
            '</div>',
            '<div class="util-sheet-export-actions">',
            '<span>독립 추출 파일</span>',
            '<span data-role="util-sheet-export-range-label"></span>',
            '</div>',
            '</header>',
            `<section class="util-sheet-export-body" data-role="util-sheet-export-body">${bodyHtml}</section>`,
            '</main>',
            '<div class="util-sheet-export-popup" data-role="util-sheet-export-popup" aria-hidden="true">',
            '<div class="util-sheet-export-popup-card" role="dialog" aria-modal="true" aria-label="상세 보기">',
            '<div class="util-sheet-export-popup-head">',
            '<div class="util-sheet-export-popup-title" data-role="util-sheet-export-popup-title">상세 보기</div>',
            '<button type="button" class="util-sheet-export-popup-close" data-role="util-sheet-export-popup-close" aria-label="닫기">×</button>',
            '</div>',
            '<div class="util-sheet-export-popup-body" data-role="util-sheet-export-popup-body"></div>',
            '</div>',
            '</div>',
            `<script type="application/json" id="util-sheet-export-data">${safeJsonForHtml(data)}</script>`,
            `<script>${buildStandaloneExportScript()}</script>`,
            '</body>',
            '</html>'
        ].join('\n');
    }

    function downloadUtilSheetStandaloneExport(modal) {
        const doc = runtimeAdapter.getDocument();
        const BlobConstructor = runtimeAdapter.getRootValue('Blob');
        const urlApi = runtimeAdapter.getRootValue('URL') || runtimeAdapter.getRootValue('webkitURL');
        if (!doc || typeof doc.createElement !== 'function' || !BlobConstructor || !urlApi?.createObjectURL) {
            runtimeAdapter.alert('이 브라우저에서는 추출 파일을 만들 수 없습니다.');
            return false;
        }
        let html = null;
        try {
            html = buildUtilSheetStandaloneExportHtml(modal);
        } catch (error) {
            const consoleApi = runtimeAdapter.getRootValue('console');
            consoleApi?.error?.('[KPI] analysis export failed', error?.message || error);
            runtimeAdapter.alert('분석표 추출 중 오류가 발생했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.');
            return false;
        }
        if (!html) {
            runtimeAdapter.alert('추출할 분석표 데이터가 없습니다.');
            return false;
        }
        const title = getTextContent(modal, '[data-role="util-sheet-report-title"]', '유틸리티_분석표');
        const model = modal?._utilSheetAnalysisModel || {};
        const rangeToken = model?.range?.from && model?.range?.to
            ? `${model.range.from}_${model.range.to}`
            : String(modal?.dataset?.monthKey || '').trim();
        const fileName = `${sanitizeFileToken(title)}_${sanitizeFileToken(rangeToken || 'current')}.html`;
        const blob = new BlobConstructor([html], { type: 'text/html;charset=utf-8' });
        const url = urlApi.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        doc.body?.appendChild?.(link);
        link.click?.();
        link.remove?.();
        runtimeAdapter.setTimeout(() => {
            if (typeof urlApi.revokeObjectURL === 'function') {
                urlApi.revokeObjectURL(url);
            }
        }, 1000);
        return true;
    }

    function syncPanelSelection(sheetType, datasetKey) {
        if (typeof runtime.syncUtilSheetPanelSelection === 'function') {
            runtime.syncUtilSheetPanelSelection(sheetType, datasetKey);
        }
    }

    function ensureUtilSheetReportModal() {
        const doc = runtimeAdapter.getDocument();
        if (!doc || typeof doc.getElementById !== 'function' || typeof doc.createElement !== 'function') {
            return null;
        }

        let modal = doc.getElementById('util-sheet-report-modal');
        if (modal) return modal;

        modal = doc.createElement('div');
        modal.id = 'util-sheet-report-modal';
        modal.className = 'util-sheet-report-modal';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="util-sheet-report-card" role="dialog" aria-modal="true" aria-label="유틸리티 보고서">
                <div class="util-sheet-report-head">
                    <div class="util-sheet-report-head-copy">
                        <div class="util-sheet-report-head-kicker" data-role="util-sheet-report-kicker">GAS REPORT</div>
                        <div class="util-sheet-report-head-title" data-role="util-sheet-report-title">보고서</div>
                        <div class="util-sheet-report-head-sub" data-role="util-sheet-report-sub">기준: -</div>
                    </div>
                    <div class="util-sheet-report-head-actions">
                        <div class="util-sheet-report-main-controls">
                            <div class="util-sheet-toggle is-modal" data-role="util-sheet-modal-type-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-modal-type-select" data-sheet-type="meter" aria-label="보고서 유형 전환">
                                    <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
                                    <span>검침표</span>
                                </button>
                            </div>
                            <div class="util-sheet-toggle is-modal" data-role="util-sheet-modal-dataset-toggle">
                                <button type="button" class="util-sheet-toggle-btn" data-role="util-sheet-modal-select" data-dataset-key="gas" aria-label="보고서 항목 전환">
                                    <i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>
                                    <span>가스비</span>
                                </button>
                            </div>
                            <div class="util-sheet-month-field is-modal">
                                <select class="util-sheet-month-select" data-role="util-sheet-modal-month" aria-label="보고서 기준월"></select>
                            </div>
                            <div class="util-sheet-segment" data-role="util-sheet-modal-compare-toggle">
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="month" aria-pressed="true">전월대비</button>
                                <button type="button" class="util-sheet-segment-btn" data-role="util-sheet-modal-compare-select" data-compare-key="year" aria-pressed="false">전년대비</button>
                            </div>
                        </div>
                        <button type="button" class="work-btn" data-role="util-sheet-report-export">추출</button>
                        <div class="util-sheet-report-window-actions">
                            <button type="button" class="util-sheet-report-icon-btn" data-role="util-sheet-report-expand" aria-label="전체화면" title="전체화면">
                                <i class="fa-solid fa-expand" data-role="util-sheet-report-expand-icon" aria-hidden="true"></i>
                                <span data-role="util-sheet-report-expand-label">전체화면</span>
                            </button>
                            <button type="button" class="util-sheet-report-icon-btn is-close" data-role="util-sheet-report-close" aria-label="닫기" title="닫기">
                                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="util-sheet-report-body" data-role="util-sheet-report-body"></div>
            </div>
        `;

        if (typeof runtime.pruneUtilSheetDatasetToggles === 'function') {
            runtime.pruneUtilSheetDatasetToggles(modal);
        }

        modal.addEventListener('click', event => {
            const target = event?.target || null;
            if (target === modal || findClosest(target, '[data-role="util-sheet-report-close"]')) {
                if (typeof runtime.closeUtilSheetReportModal === 'function') {
                    runtime.closeUtilSheetReportModal();
                }
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-analysis-inline-table-close"]')) {
                modal.dataset.analysisInlineRatioTableKey = '';
                rerenderAndSync(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-report-export"]')) {
                downloadUtilSheetStandaloneExport(modal);
                return;
            }
            if (findClosest(target, '[data-role="util-sheet-report-expand"]')) {
                if (typeof runtime.toggleUtilSheetReportExpanded === 'function') {
                    runtime.toggleUtilSheetReportExpanded(modal);
                }
                return;
            }
            const typeButton = findClosest(target, '[data-role="util-sheet-modal-type-select"]');
            if (typeButton) {
                const nextSheetType = getAlternateSheetType(modal.dataset.sheetType);
                modal.dataset.sheetType = nextSheetType;
                modal.dataset.datasetKey = resolveDatasetKey(
                    nextSheetType,
                    modal.dataset.datasetKey || UtilSheetReportState[nextSheetType]
                );
                modal.dataset.monthKey = String(UtilSheetReportMonthState[nextSheetType] || modal.dataset.monthKey || '').trim();
                modal.dataset.compareKey = normalizeCompareKey(UtilSheetCompareState[nextSheetType] || modal.dataset.compareKey || 'month');
                rerenderAndSync(modal);
                syncPanelSelection(nextSheetType, modal.dataset.datasetKey);
                return;
            }
            const chartButton = findClosest(target, '[data-role="util-sheet-analysis-open-chart"]');
            if (chartButton && typeof runtime.openUtilGasAnalysisChartModal === 'function') {
                runtime.openUtilGasAnalysisChartModal(modal, chartButton.dataset.chartKey || '');
                return;
            }
            const ratioTableButton = findClosest(target, '[data-role="util-sheet-analysis-open-ratio-table"]');
            if (ratioTableButton && typeof runtime.openUtilGasAnalysisRatioTablePopup === 'function') {
                runtime.openUtilGasAnalysisRatioTablePopup(modal, ratioTableButton.dataset.tableKey || '', ratioTableButton);
                return;
            }
            const billingPreviewButton = findClosest(target, '[data-role="util-sheet-billing-preview-toggle"]');
            if (billingPreviewButton && typeof runtime.openUtilSheetBillingPreview === 'function') {
                runtime.openUtilSheetBillingPreview(
                    billingPreviewButton.dataset.monthKey || '',
                    billingPreviewButton.dataset.billingScopeKey || '',
                    {
                        datasetKey: billingPreviewButton.dataset.billingDatasetKey || 'gas',
                        rootDoc: doc,
                        focusTarget: billingPreviewButton
                    }
                );
                return;
            }
            const chartTypeButton = findClosest(target, '[data-role="util-sheet-analysis-series-type"]');
            if (chartTypeButton && typeof runtime.setUtilSheetAnalysisDisplayMode === 'function') {
                runtime.setUtilSheetAnalysisDisplayMode(
                    getActiveAnalysisDatasetKey(modal),
                    chartTypeButton.dataset.chartKey || '',
                    chartTypeButton.dataset.chartType || 'bar'
                );
                rerenderAndSync(modal);
                return;
            }
            const datasetButton = findClosest(target, '[data-role="util-sheet-modal-select"]');
            if (datasetButton) {
                const sheetType = normalizeSheetType(modal.dataset.sheetType);
                const nextDatasetKey = getAlternateDatasetKey(modal.dataset.datasetKey, sheetType);
                modal.dataset.datasetKey = nextDatasetKey;
                UtilSheetReportState[sheetType] = nextDatasetKey;
                rerenderAndSync(modal);
                syncPanelSelection(sheetType, nextDatasetKey);
                return;
            }
            const compareButton = findClosest(target, '[data-role="util-sheet-modal-compare-select"]');
            if (compareButton && typeof runtime.applyUtilSheetCompareSelection === 'function') {
                runtime.applyUtilSheetCompareSelection(modal, compareButton.dataset.compareKey || 'month');
                return;
            }
            const gasCategoryButton = findClosest(target, '[data-role="util-sheet-analysis-gas-category-select"][data-category-key]');
            if (gasCategoryButton && typeof runtime.applyUtilGasAnalysisCategorySelection === 'function') {
                runtime.applyUtilGasAnalysisCategorySelection(modal, gasCategoryButton.dataset.categoryKey || 'yusan');
                return;
            }
            const electricViewButton = findClosest(target, '[data-role="util-sheet-meter-electric-view-select"]');
            if (electricViewButton && typeof runtime.applyUtilElectricMeterViewSelection === 'function') {
                runtime.applyUtilElectricMeterViewSelection(modal, electricViewButton.dataset.viewKey || 'meter');
            }
        });

        modal.addEventListener('keydown', event => {
            if (event?.key !== 'Escape') return;
            if (modal.classList?.contains?.('is-analysis-chart-fullscreen')) {
                event.preventDefault?.();
                event.stopPropagation?.();
                if (typeof runtime.setUtilGasAnalysisChartFullscreen === 'function') {
                    runtime.setUtilGasAnalysisChartFullscreen(modal, '', false);
                }
                rerenderAndSync(modal);
                return;
            }
            if (typeof runtime.closeUtilSheetReportModal === 'function') {
                runtime.closeUtilSheetReportModal();
            }
        });

        modal.addEventListener('change', event => {
            const target = event?.target || null;
            const labelToggleContext = typeof runtime.resolveUtilSheetAnalysisLabelToggleContext === 'function'
                ? runtime.resolveUtilSheetAnalysisLabelToggleContext(target, modal)
                : null;
            if (labelToggleContext?.toggleEl && typeof runtime.setUtilSheetAnalysisShowLabels === 'function') {
                runtime.setUtilSheetAnalysisShowLabels(
                    labelToggleContext.datasetKey,
                    labelToggleContext.chartKey,
                    labelToggleContext.toggleEl.checked === true
                );
                rerenderAndSync(modal);
                return;
            }
            const ratioLabelToggle = findClosest(target, '[data-role="util-sheet-analysis-ratio-label-toggle"]');
            if (ratioLabelToggle && typeof runtime.setUtilGasAnalysisRatioShowLabels === 'function') {
                runtime.setUtilGasAnalysisRatioShowLabels(ratioLabelToggle.checked === true);
                rerenderAndSync(modal);
                return;
            }
            const fuelInactiveToggle = findClosest(target, '[data-role="util-sheet-analysis-fuel-inactive"]');
            if (fuelInactiveToggle && typeof runtime.setUtilGasAnalysisFuelInactive === 'function') {
                runtime.setUtilGasAnalysisFuelInactive(
                    fuelInactiveToggle.dataset.fuelKey || '',
                    fuelInactiveToggle.checked === true
                );
                rerenderAndSync(modal);
                return;
            }
            const rangeField = findClosest(target, '[data-role="util-sheet-analysis-from"], [data-role="util-sheet-analysis-to"]');
            if (rangeField && typeof runtime.applyUtilGasAnalysisRangeSelection === 'function') {
                runtime.applyUtilGasAnalysisRangeSelection(modal, modal);
                return;
            }
            const unitSelect = findClosest(target, '[data-role="util-sheet-analysis-unit"]');
            if (unitSelect && typeof runtime.setUtilSheetAnalysisUnitKey === 'function') {
                runtime.setUtilSheetAnalysisUnitKey(
                    getActiveAnalysisDatasetKey(modal),
                    unitSelect.dataset.chartKey || '',
                    unitSelect.value || ''
                );
                rerenderAndSync(modal);
                return;
            }
            const productionSelect = findClosest(target, '[data-role="util-sheet-meter-production-select"]');
            if (productionSelect && typeof runtime.applyUtilGasMeterProductionSelection === 'function') {
                runtime.applyUtilGasMeterProductionSelection(modal, productionSelect.value || 'combined');
                return;
            }
            const electricTeamSelect = findClosest(target, '[data-role="util-sheet-meter-electric-team-select"]');
            if (electricTeamSelect && typeof runtime.applyUtilElectricMeterTeamSelection === 'function') {
                runtime.applyUtilElectricMeterTeamSelection(modal, electricTeamSelect.value || 'combined');
                return;
            }
            const electricAnalysisTeamSelect = findClosest(target, '[data-role="util-sheet-analysis-electric-team-select"]');
            if (electricAnalysisTeamSelect && typeof runtime.applyUtilElectricAnalysisTeamSelection === 'function') {
                runtime.applyUtilElectricAnalysisTeamSelection(modal, electricAnalysisTeamSelect.value || 'combined');
                return;
            }
            const gasCategorySelect = findClosest(target, '[data-role="util-sheet-analysis-gas-category-select"]');
            if (gasCategorySelect && typeof runtime.applyUtilGasAnalysisCategorySelection === 'function') {
                runtime.applyUtilGasAnalysisCategorySelection(modal, gasCategorySelect.value || 'yusan');
                return;
            }
            const monthSelect = findClosest(target, '[data-role="util-sheet-modal-month"]');
            if (!monthSelect) return;
            const sheetType = normalizeSheetType(modal.dataset.sheetType);
            const datasetKey = resolveDatasetKey(
                sheetType,
                modal.dataset.datasetKey || UtilSheetReportState[sheetType] || 'gas'
            );
            const monthKey = String(monthSelect.value || '').trim();
            modal.dataset.monthKey = monthKey;
            UtilSheetReportMonthState[sheetType] = monthKey;
            if (sheetType === 'analysis' && isCustomAnalysisDataset(datasetKey) && typeof runtime.setUtilSheetAnalysisToMonth === 'function') {
                runtime.setUtilSheetAnalysisToMonth(datasetKey, monthKey);
            }
            rerenderAndSync(modal);
            syncPanelSelection(sheetType, datasetKey);
        });

        if (typeof runtime.syncUtilSheetReportWindowState === 'function') {
            runtime.syncUtilSheetReportWindowState(modal);
        }
        doc.body?.appendChild?.(modal);
        return modal;
    }

    const api = Object.freeze({
        setRuntimeAdapters,
        ensureUtilSheetReportModal
    });
    runtimeAdapter.exportApi('KPIUtilReportSheetModalShell', api);
})();
