(function registerUtilReportSheetModalShellMonthlyState(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    const {
        MONTHLY_EXTRACT_DATASET_KEYS,
        MONTHLY_EXTRACT_SHEET_TYPES,
        UtilSheetCompareState,
        UtilSheetReportState,
        escapeHtml,
        normalizeCompareKey,
        normalizeSheetType,
        resolveDatasetKey,
        runtime,
        setAnalysisStateForExtractModel,
        syncPanelSelection
    } = parts;

    function getExtractDatasetLabel(datasetKey = 'gas') {
        const normalizedDatasetKey = String(datasetKey || '').trim();
        if (normalizedDatasetKey === 'electric') return '전력비';
        if (normalizedDatasetKey === 'waste') return '폐수';
        return '가스';
    }

    function getMonthlyExtractDatasetIcon(datasetKey = 'gas') {
        const normalizedDatasetKey = resolveDatasetKey('meter', datasetKey);
        if (normalizedDatasetKey === 'electric') return 'fa-bolt';
        if (normalizedDatasetKey === 'waste') return 'fa-water';
        return 'fa-fire-flame-curved';
    }

    function normalizeMonthlyExtractDatasetKeyList(datasetKeys = [], fallbackKeys = MONTHLY_EXTRACT_DATASET_KEYS) {
        const source = Array.isArray(datasetKeys) ? datasetKeys : [datasetKeys];
        const normalizedKeys = source
            .map(datasetKey => String(datasetKey || '').trim())
            .filter(Boolean)
            .map(datasetKey => normalizeMonthlyExtractDatasetKey(datasetKey))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        const uniqueKeys = Array.from(new Set(normalizedKeys));
        if (uniqueKeys.length) return uniqueKeys;
        return Array.isArray(fallbackKeys) ? [...fallbackKeys] : [];
    }

    function getMonthlyExtractSelectedDatasetKeysFromState(modal) {
        if (!modal?.dataset || !Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractDatasets')) {
            return [...MONTHLY_EXTRACT_DATASET_KEYS];
        }
        return String(modal.dataset.monthlyExtractDatasets || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeMonthlyExtractDatasetKey(value))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey))
            .filter((datasetKey, index, values) => values.indexOf(datasetKey) === index);
    }

    function normalizeMonthlyExtractSheetTypeList(sheetTypes = [], fallbackTypes = MONTHLY_EXTRACT_SHEET_TYPES) {
        const source = Array.isArray(sheetTypes) ? sheetTypes : [sheetTypes];
        const normalizedTypes = source
            .map(sheetType => normalizeSheetType(sheetType))
            .filter(sheetType => MONTHLY_EXTRACT_SHEET_TYPES.includes(sheetType));
        const uniqueTypes = Array.from(new Set(normalizedTypes));
        if (uniqueTypes.length) return uniqueTypes;
        return Array.isArray(fallbackTypes) ? [...fallbackTypes] : [];
    }

    function getMonthlyExtractSelectedSheetTypesFromState(modal) {
        if (!modal?.dataset || !Object.prototype.hasOwnProperty.call(modal.dataset, 'monthlyExtractSheetTypes')) {
            return [...MONTHLY_EXTRACT_SHEET_TYPES];
        }
        return String(modal.dataset.monthlyExtractSheetTypes || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeSheetType(value))
            .filter(sheetType => MONTHLY_EXTRACT_SHEET_TYPES.includes(sheetType))
            .filter((sheetType, index, values) => values.indexOf(sheetType) === index);
    }

    function buildMonthlyExtractMonthOptions(datasetKeys = MONTHLY_EXTRACT_DATASET_KEYS) {
        if (typeof runtime.buildUtilSheetDatasetResult !== 'function') return [];
        const normalizedDatasetKeys = normalizeMonthlyExtractDatasetKeyList(datasetKeys, MONTHLY_EXTRACT_DATASET_KEYS);
        const optionMaps = normalizedDatasetKeys.map(datasetKey => {
            const result = runtime.buildUtilSheetDatasetResult(datasetKey, '', 'meter');
            const options = Array.isArray(result?.monthOptions) ? result.monthOptions : [];
            return new Map(options
                .map(option => [String(option?.value || '').trim(), String(option?.label || option?.value || '').trim()])
                .filter(([value]) => value));
        }).filter(map => map.size);
        if (optionMaps.length !== normalizedDatasetKeys.length) return [];
        const commonValues = Array.from(optionMaps[0].keys())
            .filter(value => optionMaps.every(map => map.has(value)))
            .sort((left, right) => String(left || '').localeCompare(String(right || ''), 'ko'));
        return commonValues.map(value => ({
            value,
            label: optionMaps.find(map => map.has(value))?.get(value) || value
        }));
    }

    function buildMonthlyExtractMonthOptionHtml(options = [], selectedValue = '') {
        return (Array.isArray(options) ? options : []).map(option => {
            const value = String(option?.value || '').trim();
            return `<option value="${escapeHtml(value)}"${value === String(selectedValue || '').trim() ? ' selected' : ''}>${escapeHtml(option?.label || value)}</option>`;
        }).join('');
    }

    function normalizeMonthlyExtractRange(monthOptions = [], fromValue = '', toValue = '') {
        const values = (Array.isArray(monthOptions) ? monthOptions : [])
            .map(option => String(option?.value || '').trim())
            .filter(Boolean);
        if (!values.length) return { from: '', to: '' };
        const fallbackTo = values[values.length - 1];
        const safeTo = values.includes(String(toValue || '').trim()) ? String(toValue || '').trim() : fallbackTo;
        const previousValue = values[Math.max(0, values.indexOf(safeTo) - 1)] || values[0];
        let safeFrom = values.includes(String(fromValue || '').trim()) ? String(fromValue || '').trim() : previousValue;
        if (values.indexOf(safeFrom) > values.indexOf(safeTo)) {
            safeFrom = safeTo;
        }
        return { from: safeFrom, to: safeTo };
    }

    function normalizeMonthlyExtractDatasetKey(datasetKey = 'gas') {
        const rawDatasetKey = String(datasetKey || '').trim();
        const normalizedDatasetKey = MONTHLY_EXTRACT_DATASET_KEYS.includes(rawDatasetKey)
            ? rawDatasetKey
            : resolveDatasetKey('meter', datasetKey || 'gas');
        return MONTHLY_EXTRACT_DATASET_KEYS.includes(normalizedDatasetKey)
            ? normalizedDatasetKey
            : 'gas';
    }

    function getMonthlyExtractActiveDatasetKey(modal) {
        return normalizeMonthlyExtractDatasetKey(
            modal?.dataset?.monthlyExtractDatasetKey
            || modal?.dataset?.datasetKey
            || UtilSheetReportState.meter
            || 'gas'
        );
    }

    function getMonthlyExtractReviewedDatasetKeys(modal) {
        const values = String(modal?.dataset?.monthlyExtractReviewedKeys || '')
            .split(',')
            .map(value => String(value || '').trim())
            .filter(Boolean)
            .map(value => normalizeMonthlyExtractDatasetKey(value))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        return Array.from(new Set(values));
    }

    function setMonthlyExtractReviewedDatasetKeys(modal, datasetKeys = []) {
        if (!modal?.dataset) return [];
        const values = (Array.isArray(datasetKeys) ? datasetKeys : [datasetKeys])
            .map(datasetKey => String(datasetKey || '').trim())
            .filter(Boolean)
            .map(datasetKey => normalizeMonthlyExtractDatasetKey(datasetKey))
            .filter(datasetKey => MONTHLY_EXTRACT_DATASET_KEYS.includes(datasetKey));
        const uniqueValues = Array.from(new Set(values));
        modal.dataset.monthlyExtractReviewedKeys = uniqueValues.join(',');
        return uniqueValues;
    }

    function markMonthlyExtractDatasetReviewed(modal, datasetKey = '') {
        const reviewedKeys = getMonthlyExtractReviewedDatasetKeys(modal);
        const normalizedDatasetKey = normalizeMonthlyExtractDatasetKey(datasetKey || getMonthlyExtractActiveDatasetKey(modal));
        if (!reviewedKeys.includes(normalizedDatasetKey)) {
            reviewedKeys.push(normalizedDatasetKey);
        }
        return setMonthlyExtractReviewedDatasetKeys(modal, reviewedKeys);
    }

    function syncMonthlyExtractDatasetControls(modal) {
        if (!modal) return 'gas';
        const activeDatasetKey = getMonthlyExtractActiveDatasetKey(modal);
        const reviewedKeys = getMonthlyExtractReviewedDatasetKeys(modal);
        const selectedKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-dataset"]') || []).forEach(checkbox => {
            const datasetKey = normalizeMonthlyExtractDatasetKey(checkbox.dataset.extractDatasetKey);
            checkbox.checked = selectedKeys.includes(datasetKey);
        });
        const selectedSheetTypes = getMonthlyExtractSelectedSheetTypesFromState(modal);
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-sheet-type"]') || []).forEach(checkbox => {
            const sheetType = normalizeSheetType(checkbox.dataset.extractSheetType);
            checkbox.checked = selectedSheetTypes.includes(sheetType);
        });
        Array.from(modal.querySelectorAll?.('[data-role="util-sheet-monthly-extract-dataset-preview"]') || []).forEach(button => {
            const datasetKey = normalizeMonthlyExtractDatasetKey(button.dataset.extractDatasetKey);
            const isActive = datasetKey === activeDatasetKey;
            button.classList?.toggle?.('is-active', isActive);
            button.classList?.toggle?.('is-selected', selectedKeys.includes(datasetKey));
            button.classList?.toggle?.('is-reviewed', reviewedKeys.includes(datasetKey));
            button.setAttribute?.('aria-pressed', isActive ? 'true' : 'false');
            button.dataset.reviewed = reviewedKeys.includes(datasetKey) ? 'true' : 'false';
        });
        const runButton = modal.querySelector?.('[data-role="util-sheet-monthly-extract-run"]') || null;
        if (runButton) {
            runButton.textContent = selectedKeys.length === MONTHLY_EXTRACT_DATASET_KEYS.length ? '통합 추출' : '선택 추출';
        }
        return activeDatasetKey;
    }

    function populateMonthlyExtractOptions(modal) {
        if (!modal) return { monthOptions: [], range: { from: '', to: '' } };
        const selectedDatasetKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        const monthOptions = buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
        const range = normalizeMonthlyExtractRange(
            monthOptions,
            modal.dataset.monthlyExtractFrom,
            modal.dataset.monthlyExtractTo
        );
        modal.dataset.monthlyExtractFrom = range.from;
        modal.dataset.monthlyExtractTo = range.to;
        const fromSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]') || null;
        const toSelect = modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]') || null;
        if (fromSelect) {
            fromSelect.innerHTML = buildMonthlyExtractMonthOptionHtml(monthOptions, range.from);
            fromSelect.value = range.from;
            fromSelect.disabled = !monthOptions.length;
        }
        if (toSelect) {
            toSelect.innerHTML = buildMonthlyExtractMonthOptionHtml(monthOptions, range.to);
            toSelect.value = range.to;
            toSelect.disabled = !monthOptions.length;
        }
        modal.dataset.monthlyExtractDatasetKey = getMonthlyExtractActiveDatasetKey(modal);
        syncMonthlyExtractDatasetControls(modal);
        return { monthOptions, range };
    }

    function applyMonthlyExtractPreview(modal, datasetKey = '', options = {}) {
        if (!modal) return { datasetKey: 'gas', range: { from: '', to: '' } };
        const selectedDatasetKeys = getMonthlyExtractSelectedDatasetKeysFromState(modal);
        const monthOptions = Array.isArray(options?.monthOptions)
            ? options.monthOptions
            : buildMonthlyExtractMonthOptions(selectedDatasetKeys.length ? selectedDatasetKeys : MONTHLY_EXTRACT_DATASET_KEYS);
        const fromValue = Object.prototype.hasOwnProperty.call(options || {}, 'from')
            ? options.from
            : (modal.querySelector?.('[data-role="util-sheet-monthly-extract-from"]')?.value || modal.dataset.monthlyExtractFrom || '');
        const toValue = Object.prototype.hasOwnProperty.call(options || {}, 'to')
            ? options.to
            : (modal.querySelector?.('[data-role="util-sheet-monthly-extract-to"]')?.value || modal.dataset.monthlyExtractTo || '');
        const range = normalizeMonthlyExtractRange(monthOptions, fromValue, toValue);
        const activeDatasetKey = normalizeMonthlyExtractDatasetKey(datasetKey || getMonthlyExtractActiveDatasetKey(modal));
        const sheetType = normalizeSheetType(modal.dataset.sheetType || 'meter');

        modal.dataset.monthlyExtractDatasetKey = activeDatasetKey;
        modal.dataset.monthlyExtractFrom = range.from;
        modal.dataset.monthlyExtractTo = range.to;
        modal.dataset.sheetType = sheetType;
        modal.dataset.datasetKey = activeDatasetKey;
        modal.dataset.monthKey = range.to || modal.dataset.monthKey || '';
        modal.dataset.compareKey = normalizeCompareKey(modal.dataset.compareKey || UtilSheetCompareState[sheetType] || 'month');

        if (sheetType === 'analysis' && (range.from || range.to)) {
            setAnalysisStateForExtractModel(activeDatasetKey, '', range.from || range.to, range.to || modal.dataset.monthKey || '');
        }
        if (options?.render !== false && typeof runtime.renderUtilSheetReportModal === 'function') {
            runtime.renderUtilSheetReportModal(modal);
        }
        if (options?.markReviewed !== false) {
            markMonthlyExtractDatasetReviewed(modal, activeDatasetKey);
        }
        syncMonthlyExtractDatasetControls(modal);
        syncPanelSelection(sheetType, activeDatasetKey);
        return { datasetKey: activeDatasetKey, range };
    }

    Object.assign(parts, {
        getExtractDatasetLabel,
        getMonthlyExtractDatasetIcon,
        normalizeMonthlyExtractDatasetKeyList,
        getMonthlyExtractSelectedDatasetKeysFromState,
        normalizeMonthlyExtractSheetTypeList,
        getMonthlyExtractSelectedSheetTypesFromState,
        buildMonthlyExtractMonthOptions,
        buildMonthlyExtractMonthOptionHtml,
        normalizeMonthlyExtractRange,
        normalizeMonthlyExtractDatasetKey,
        getMonthlyExtractActiveDatasetKey,
        getMonthlyExtractReviewedDatasetKeys,
        setMonthlyExtractReviewedDatasetKeys,
        markMonthlyExtractDatasetReviewed,
        syncMonthlyExtractDatasetControls,
        populateMonthlyExtractOptions,
        applyMonthlyExtractPreview
    });
})(this);
