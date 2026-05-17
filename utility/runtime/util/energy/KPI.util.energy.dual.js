        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function normalizeUtilDualDatasetKey(datasetKey) {
            const raw = String(datasetKey || '').trim().toLowerCase();
            if (raw === 'electric' || raw === 'gas' || raw === 'waste') return raw;
            if (raw.includes('gas')) return 'gas';
            if (raw.includes('waste')) return 'waste';
            return 'electric';
        }

        function makeUtilYearKey(label, index = 0) {
            const normalizedLabel = String(label || '').replace(/[^\dA-Za-z_-]/g, '');
            return normalizedLabel ? `year-${normalizedLabel}` : `year-${Number(index) || 0}`;
        }

        function normalizeUtilDualRatioMetricKey(metricKey) {
            const raw = String(metricKey || '').trim().toLowerCase();
            if (raw === 'production') return 'production';
            if (raw === 'cost' || raw.endsWith('_cost')) return 'cost';
            return 'usage';
        }

        function getUtilDualRatioMetricOptionsHtml(selectedKey = 'usage', disabledKey = '') {
            const selected = normalizeUtilDualRatioMetricKey(selectedKey);
            const disabled = normalizeUtilDualRatioMetricKey(disabledKey);
            return [
                { key: 'usage', label: '사용량' },
                { key: 'cost', label: '비용' },
                { key: 'production', label: '생산량' }
            ].map(option => {
                const isDisabled = option.key === disabled && option.key !== selected;
                return `<option value="${option.key}"${option.key === selected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}>${option.label}</option>`;
            }).join('');
        }

        function getUtilDualUsageUnitOptions(datasetKey) {
            const normalizedDatasetKey = normalizeUtilDualDatasetKey(datasetKey);
            if (typeof getUtilReportBuilderVizUsageUnitOptions === 'function') {
                return getUtilReportBuilderVizUsageUnitOptions(normalizedDatasetKey);
            }
            if (normalizedDatasetKey === 'gas') return [{ key: 'm3', label: 'm³', scale: 1 }, { key: 'km3', label: '천m³', scale: 1000 }];
            if (normalizedDatasetKey === 'waste') return [{ key: 'wm3', label: 'm³', scale: 1 }, { key: 'kwm3', label: '천m³', scale: 1000 }];
            return [{ key: 'kwh', label: 'kWh', scale: 1 }, { key: 'mwh', label: 'MWh', scale: 1000 }];
        }

        function normalizeUtilDualUsageUnitKey(unitKey, datasetKey = 'electric') {
            if (typeof normalizeUtilReportBuilderVizUsageUnitKey === 'function') {
                return normalizeUtilReportBuilderVizUsageUnitKey(unitKey, normalizeUtilDualDatasetKey(datasetKey));
            }
            const raw = String(unitKey || '').trim().toLowerCase();
            const options = getUtilDualUsageUnitOptions(datasetKey);
            return options.some(option => option.key === raw) ? raw : String(options[0]?.key || 'kwh');
        }

        function getUtilDualUsageUnitLabel(unitKey, datasetKey = 'electric') {
            if (typeof getUtilReportBuilderVizUsageLabel === 'function') {
                return getUtilReportBuilderVizUsageLabel(unitKey, normalizeUtilDualDatasetKey(datasetKey));
            }
            const normalizedUnitKey = normalizeUtilDualUsageUnitKey(unitKey, datasetKey);
            const option = getUtilDualUsageUnitOptions(datasetKey).find(item => item.key === normalizedUnitKey);
            return String(option?.label || normalizedUnitKey || '');
        }

        function getUtilDualRatioLabel(datasetKey = 'electric') {
            const normalizedDatasetKey = normalizeUtilDualDatasetKey(datasetKey);
            if (normalizedDatasetKey === 'gas') return '가스량 / 생산량';
            if (normalizedDatasetKey === 'waste') return '폐수량 / 생산량';
            return '전력량 / 생산량';
        }

        function buildUtilDualDisplayControlHtml() {
            return `
                <div class="util-year-decimals">
                    <button type="button" class="util-year-decimals-btn" data-decimals-toggle aria-expanded="false">자리수</button>
                    <div class="util-year-decimals-popover" data-decimals-popover hidden>
                        <div class="util-year-decimals-grid">
                            ${buildUtilDualDecimalsRowHtml('사용', 'usage', '0')}
                            ${buildUtilDualDecimalsRowHtml('비용', 'cost', '0')}
                            ${buildUtilDualDecimalsRowHtml('생산', 'production', '0')}
                            ${buildUtilDualDecimalsRowHtml('비율', 'ratio', '3', true)}
                        </div>
                    </div>
                </div>
            `;
        }

        function buildUtilDualDecimalsRowHtml(label, key, defaultValue, ratioOnly = false) {
            const options = [0, 1, 2, 3].map(value => `<option value="${value}"${String(value) === String(defaultValue) ? ' selected' : ''}>${value}</option>`).join('');
            return `
                <label class="util-year-decimals-row${ratioOnly ? ' is-ratio-decimals' : ''}">
                    <span class="name">${escapeHtml(label)}</span>
                    ${ratioOnly ? '' : '<span class="meta">소수</span>'}
                    <select class="util-table-select util-table-select-sm" data-decimals="${escapeHtml(key)}">${options}</select>
                </label>
            `;
        }

        function closeUtilDualDecimalsPopovers(root = document) {
            const scope = root || document;
            scope.querySelectorAll?.('[data-decimals-popover]').forEach(popover => {
                popover.hidden = true;
            });
            scope.querySelectorAll?.('[data-decimals-toggle]').forEach(button => {
                button.setAttribute('aria-expanded', 'false');
            });
        }

        function setUtilNumericCellDisplay(cell, value) {
            if (!cell) return;
            const text = String(value ?? '');
            const valueEl = cell.querySelector?.('.util-num-value');
            if (valueEl) {
                valueEl.textContent = text;
                return;
            }
            cell.textContent = text;
        }

        function parseUtilDualNumber(value) {
            if (typeof parseUtilAmount === 'function') return parseUtilAmount(value);
            const numeric = Number(String(value ?? '').replace(/,/g, '').trim());
            return Number.isFinite(numeric) ? numeric : NaN;
        }

        function formatUtilDualNumber(value, decimals = 0) {
            if (!Number.isFinite(value)) return '';
            if (typeof formatUtilNumber === 'function') return formatUtilNumber(value, decimals);
            return value.toLocaleString('ko-KR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        function getUtilDualCostValue(row, costMode = 'total') {
            const mode = String(costMode || 'total').trim() || 'total';
            if (mode !== 'total' && row?.costs && Object.prototype.hasOwnProperty.call(row.costs, mode)) {
                return parseUtilDualNumber(row.costs[mode]);
            }
            return parseUtilDualNumber(row?.cost);
        }

        function buildUtilDualCostValues(row) {
            const values = {};
            const total = parseUtilDualNumber(row?.cost);
            if (Number.isFinite(total)) values.total = total;
            if (row?.costs && typeof row.costs === 'object') {
                Object.entries(row.costs).forEach(([key, value]) => {
                    const numeric = parseUtilDualNumber(value);
                    if (Number.isFinite(numeric)) values[String(key)] = numeric;
                });
            }
            return values;
        }

        function setUtilDualCostCellValue(cell, costMode = 'total') {
            if (!cell) return;
            let values = {};
            try {
                values = JSON.parse(cell.dataset.costValues || '{}') || {};
            } catch (error) {
                values = {};
            }
            const mode = String(costMode || 'total').trim() || 'total';
            const rawValue = Number(values[mode]);
            const fallbackValue = Number(values.total);
            const nextValue = Number.isFinite(rawValue) ? rawValue : fallbackValue;
            cell.dataset.value = Number.isFinite(nextValue) ? String(nextValue) : '';
        }

        function applyUtilCostMode(section) {
            if (!section) return;
            const costMode = String(section.dataset.costMode || 'total').trim() || 'total';
            section.querySelectorAll?.('[data-cost-mode]').forEach(select => {
                select.value = costMode;
            });
            section.querySelectorAll?.('.util-num[data-col="cost"]').forEach(cell => {
                setUtilDualCostCellValue(cell, costMode);
            });
            section.querySelectorAll?.('.util-num[data-col="ratio"]').forEach(cell => {
                setUtilDualCostCellValue(cell, costMode);
                cell.dataset.ratioCost = cell.dataset.value || '';
            });
        }

        function syncUtilDualSelects(section) {
            if (!section) return;
            const datasetKey = normalizeUtilDualDatasetKey(section.dataset.datasetKey || section.closest?.('[data-util-dual]')?.dataset?.utilDual || '');

            section.dataset.datasetKey = datasetKey;
            section.dataset.usageUnitKey = '';
            section.dataset.costUnitKey = 'krw';
            section.dataset.productionUnitKey = 'kg';
            section.dataset.ratioNumerator = 'usage';
            section.dataset.ratioDenominator = 'production';

            section.querySelectorAll?.('[data-decimals="usage"]').forEach(select => { select.value = section.dataset.usageDecimals || '0'; });
            section.querySelectorAll?.('[data-decimals="cost"]').forEach(select => { select.value = section.dataset.costDecimals || '0'; });
            section.querySelectorAll?.('[data-decimals="production"]').forEach(select => { select.value = section.dataset.productionDecimals || '0'; });
            section.querySelectorAll?.('[data-decimals="ratio"]').forEach(select => { select.value = section.dataset.ratioDecimals || '3'; });
        }

        function isUtilDualSummaryRow(row, index) {
            const label = String(row?.label || '').trim();
            if (label.includes('평균') || label.includes('합계')) return true;
            return Number(index) >= 12;
        }

        function getUtilDualRowClass(row, index) {
            const label = String(row?.label || '').trim();
            if (label.includes('평균')) return ' class="util-row-average"';
            if (label.includes('합계')) return ' class="util-row-total"';
            if (Number(index) === 12) return ' class="util-row-average"';
            if (Number(index) > 12) return ' class="util-row-total"';
            return '';
        }

        function buildUtilDualNumericHtml(value, col, attrs = {}) {
            const numeric = parseUtilDualNumber(value);
            const attrHtml = Object.entries(attrs)
                .map(([key, attrValue]) => ` data-${key}="${escapeHtml(attrValue)}"`)
                .join('');
            return `
                <span class="util-num" data-col="${escapeHtml(col)}" data-value="${Number.isFinite(numeric) ? escapeHtml(String(numeric)) : ''}"${attrHtml}>
                    <span class="util-num-value">${Number.isFinite(numeric) ? escapeHtml(formatUtilDualNumber(numeric, 0)) : ''}</span>
                </span>
            `;
        }

        function buildUtilDualCostModeSelectHtml(config, teamName, currentMode = 'total') {
            const modes = typeof config?.costModesByTeam === 'function'
                ? config.costModesByTeam(teamName)
                : (Array.isArray(config?.costModes) ? config.costModes : []);
            if (!Array.isArray(modes) || !modes.length) {
                return `<span class="util-head-label">${escapeHtml(config?.costLabel || '비용')}</span>`;
            }
            return `
                <select class="util-table-select util-table-select-sm" data-cost-mode>
                    ${modes.map(mode => `<option value="${escapeHtml(mode.key)}"${mode.key === currentMode ? ' selected' : ''}>${escapeHtml(mode.label || mode.key)}</option>`).join('')}
                </select>
            `;
        }

        function renderUtilDualTable(year, config = {}, teamName = '', options = {}) {
            const rows = Array.isArray(year?.rows) ? year.rows : [];
            const yearKey = String(options.yearKey || makeUtilYearKey(year?.label, 0));
            const datasetKey = normalizeUtilDualDatasetKey(options.datasetKey || '');
            const costMode = String(options.costMode || config.costModeKey || 'total').trim() || 'total';
            const yearLabelRaw = String(year?.label || '').trim();
            const yearLabel = yearLabelRaw.endsWith('년') ? yearLabelRaw : `${yearLabelRaw}년`;
            const usageLabel = typeof config.usageLabelByTeam === 'function'
                ? config.usageLabelByTeam(teamName)
                : (config.usageLabel || '사용량');
            const bodyRows = rows.map((row, index) => {
                const usageValue = parseUtilDualNumber(row?.usage);
                const productionValue = parseUtilDualNumber(row?.production);
                const costValues = buildUtilDualCostValues(row);
                const costValue = getUtilDualCostValue(row, costMode);
                const ratioAttrs = {
                    'ratio-usage': Number.isFinite(usageValue) ? String(usageValue) : '',
                    'ratio-cost': Number.isFinite(costValue) ? String(costValue) : '',
                    'ratio-production': Number.isFinite(productionValue) ? String(productionValue) : '',
                    'cost-values': JSON.stringify(costValues)
                };
                return `
                    <tr${getUtilDualRowClass(row, index)}>
                        <td>${escapeHtml(row?.label || '')}</td>
                        <td>${buildUtilDualNumericHtml(row?.usage, 'usage')}</td>
                        <td>${buildUtilDualNumericHtml(costValue, 'cost', { 'cost-values': JSON.stringify(costValues) })}</td>
                        <td>${buildUtilDualNumericHtml(row?.production, 'production')}</td>
                        <td>${buildUtilDualNumericHtml('', 'ratio', ratioAttrs)}</td>
                    </tr>
                `;
            }).join('');
            return `
                <div class="util-year-card${options.isYearOpen === false ? ' is-collapsed' : ''}" data-util-year-card="${escapeHtml(yearKey)}">
                    <div class="util-year-head">
                        <div class="util-year-title">${escapeHtml(yearLabel)} ${escapeHtml(teamName)}</div>
                        <div class="util-year-head-controls">
                            <button type="button" class="util-year-toggle-btn" data-year-toggle="${escapeHtml(yearKey)}" aria-label="연도 표 열기 닫기">${options.isYearOpen === false ? '+' : '-'}</button>
                        </div>
                    </div>
                    <div class="util-year-body">
                        <table class="util-table util-dual-data-table">
                            <thead>
                                <tr class="util-table-head">
                                    <th>월</th>
                                    <th><span class="util-head-cell"><span class="util-head-label">${escapeHtml(usageLabel)}</span><span class="util-head-sub">${escapeHtml(getUtilDualUsageUnitLabel('', datasetKey))}</span></span></th>
                                    <th class="util-th-cost-mode"><span class="util-head-cell util-head-cell-cost-mode">${buildUtilDualCostModeSelectHtml(config, teamName, costMode)}</span></th>
                                    <th><span class="util-head-cell"><span class="util-head-label">${escapeHtml(config.productionLabel || '생산량')}</span></span></th>
                                     <th>
                                         <span class="util-head-cell util-head-cell-ratio">
                                             <span class="util-head-label">비율</span>
                                             <span class="util-head-sub">${escapeHtml(getUtilDualRatioLabel(datasetKey))}</span>
                                         </span>
                                     </th>
                                </tr>
                            </thead>
                            <tbody>${bodyRows}</tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        function applyUtilDualConversion(section) {
            if (!section) return;
            const usageDecimals = parseInt(section.dataset.usageDecimals || section.querySelector('[data-decimals="usage"]')?.value || '0', 10);
            const costDecimals = parseInt(section.dataset.costDecimals || section.querySelector('[data-decimals="cost"]')?.value || '0', 10);
            const productionDecimals = parseInt(section.dataset.productionDecimals || section.querySelector('[data-decimals="production"]')?.value || '0', 10);
            const ratioDecimals = parseInt(section.dataset.ratioDecimals || section.querySelector('[data-decimals="ratio"]')?.value || '3', 10);
            section.querySelectorAll('.util-num').forEach(cell => {
                const col = cell.dataset.col;
                if (col === 'ratio') {
                    const usageValue = parseUtilAmount(cell.dataset.ratioUsage);
                    const productionValue = parseUtilAmount(cell.dataset.ratioProduction);
                    if (!Number.isFinite(usageValue) || !Number.isFinite(productionValue) || Math.abs(productionValue) < 1e-12) {
                        setUtilNumericCellDisplay(cell, '');
                        return;
                    }
                    setUtilNumericCellDisplay(cell, formatUtilNumber(usageValue / productionValue, ratioDecimals));
                    return;
                }
                const raw = parseUtilAmount(cell.dataset.value);
                if (!Number.isFinite(raw)) {
                    setUtilNumericCellDisplay(cell, '');
                    return;
                }
                const decimals = col === 'cost' ? costDecimals : (col === 'production' ? productionDecimals : usageDecimals);
                setUtilNumericCellDisplay(cell, formatUtilNumber(raw, decimals));
            });
        }

        function parseUtilInputNumber(el) {
            if (!el) return null;
            return parseUtilNumericValue(el.value);
        }

        function resolveUtilInputNumber(el, fallback = 0) {
            const parsed = parseUtilInputNumber(el);
            return Number.isFinite(parsed) ? parsed : fallback;
        }

        function setUtilEnergyStateNumber(key, value) {
            if (Number.isFinite(value)) UtilEnergyState[key] = value;
        }

        function buildUtilEnergyMonthOptions() {
            const combined = UTIL_ELECTRIC_ENTRIES.concat(UTIL_GAS_ENTRIES);
            return buildUtilMonthOptions(combined);
        }

        function setUtilSelectOptions(select, options, defaultValue) {
            if (!select) return;
            select.innerHTML = options;
            if (defaultValue !== undefined && defaultValue !== null) {
                select.value = defaultValue;
            }
        }

        function getUtilEntryKey(entry) {
            const year = Number(entry?.year);
            const month = Number(entry?.month);
            if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
            return year * 12 + month;
        }

        function sumUtilEntries(entries, fromKey, toKey, teamVal) {
            let usage = 0;
            let cost = 0;
            let hasData = false;
            (entries || []).forEach(entry => {
                if (teamVal && teamVal !== 'all' && entry.team !== teamVal) return;
                const key = getUtilEntryKey(entry);
                if (!key || key < fromKey || key > toKey) return;
                const usageVal = Number(entry.usage);
                if (Number.isFinite(usageVal)) {
                    usage += usageVal;
                    hasData = true;
                }
                const costVal = Number(entry.cost);
                if (Number.isFinite(costVal)) cost += costVal;
            });
            return { usage, cost, hasData };
        }

        function getGasFactorByTeam(teamName, factors) {
            const name = String(teamName || '');
            if (name.includes('LPG')) return factors?.lpg ?? UTIL_ENERGY_DEFAULTS.gasLPG;
            if (name.includes('LNG')) return factors?.lng ?? UTIL_ENERGY_DEFAULTS.gasLNG;
            return factors?.lng ?? UTIL_ENERGY_DEFAULTS.gasLNG;
        }

        function getGasTypeByTeam(teamName) {
            const name = String(teamName || '');
            if (name.includes('LPG')) return 'lpg';
            if (name.includes('LNG')) return 'lng';
            return 'lng';
        }

        function sumUtilGasEnergy(entries, fromKey, toKey, teamVal, factors) {
            let mj = 0;
            let cost = 0;
            let hasData = false;
            (entries || []).forEach(entry => {
                if (teamVal && teamVal !== 'all' && entry.team !== teamVal) return;
                const key = getUtilEntryKey(entry);
                if (!key || key < fromKey || key > toKey) return;
                const usageVal = Number(entry.usage);
                if (Number.isFinite(usageVal)) {
                    const factor = getGasFactorByTeam(entry.team, factors);
                    mj += usageVal * factor;
                    hasData = true;
                }
                const costVal = Number(entry.cost);
                if (Number.isFinite(costVal)) cost += costVal;
            });
            return { mj, cost, hasData };
        }

        function sumUtilGasUsageByType(entries, fromKey, toKey, teamVal) {
            let lngUsage = 0;
            let lpgUsage = 0;
            let cost = 0;
            let hasLng = false;
            let hasLpg = false;
            (entries || []).forEach(entry => {
                if (teamVal && teamVal !== 'all' && entry.team !== teamVal) return;
                const key = getUtilEntryKey(entry);
                if (!key || key < fromKey || key > toKey) return;
                const usageVal = Number(entry.usage);
                if (Number.isFinite(usageVal)) {
                    const type = getGasTypeByTeam(entry.team);
                    if (type === 'lpg') {
                        lpgUsage += usageVal;
                        hasLpg = true;
                    } else {
                        lngUsage += usageVal;
                        hasLng = true;
                    }
                }
                const costVal = Number(entry.cost);
                if (Number.isFinite(costVal)) cost += costVal;
            });
            return { lngUsage, lpgUsage, cost, hasLng, hasLpg };
        }

        function ensureUtilEnergyRangeState() {
            const months = buildUtilEnergyMonthOptions();
            if (!months.length) return null;
            const fromDefault = months[0].value;
            const toDefault = months[months.length - 1].value;
            if (!UtilEnergyState.from || !months.some(item => item.value === UtilEnergyState.from)) {
                UtilEnergyState.from = fromDefault;
            }
            if (!UtilEnergyState.to || !months.some(item => item.value === UtilEnergyState.to)) {
                UtilEnergyState.to = toDefault;
            }
            return months;
        }

        function getUtilEnergyTeamLabel(teamValue) {
            const value = String(teamValue || '').trim();
            return value && value !== 'all' ? value : '전체';
        }

        function getUtilEnergyRangeLabel() {
            const from = UtilEnergyState.from || '';
            const to = UtilEnergyState.to || '';
            if (from && to) return `${from} ~ ${to}`;
            return '-';
        }

        function buildUtilEnergyLauncherSummaryText() {
            return `기간: ${getUtilEnergyRangeLabel()} / 전기 팀: ${getUtilEnergyTeamLabel(UtilEnergyState.electricTeam)} / 가스 팀: ${getUtilEnergyTeamLabel(UtilEnergyState.gasTeam)}`;
        }

        function refreshUtilEnergyLauncherSummary(scope) {
            const root = scope || document;
            const summary = buildUtilEnergyLauncherSummaryText();
            root.querySelectorAll('[data-role="util-energy-launcher-summary"]').forEach(el => {
                el.textContent = summary;
            });
        }

        function initUtilEnergyLauncher(scope) {
            const root = scope || document;
            refreshUtilEnergyLauncherSummary(root);
        }

        function syncUtilEnergyModalHeader(modal) {
            if (!modal) return;
            const subEl = modal.querySelector('[data-role="util-energy-modal-sub"]');
            if (!subEl) return;
            subEl.textContent = `기간: ${getUtilEnergyRangeLabel()} · 전기 팀: ${getUtilEnergyTeamLabel(UtilEnergyState.electricTeam)} · 가스 팀: ${getUtilEnergyTeamLabel(UtilEnergyState.gasTeam)}`;
        }

        function updateUtilEnergyStateFromPanel(panel) {
            if (!panel) return;
            const linkToggle = panel.querySelector('[data-role="energy-link-toggle"]');
            if (linkToggle) UtilEnergyState.linkEnabled = linkToggle.checked;
            const elecTeam = panel.querySelector('[data-role="energy-link-electric-team"]');
            if (elecTeam) UtilEnergyState.electricTeam = elecTeam.value || 'all';
            const gasTeam = panel.querySelector('[data-role="energy-link-gas-team"]');
            if (gasTeam) UtilEnergyState.gasTeam = gasTeam.value || 'all';
            const gasMode = panel.querySelector('[data-role="energy-link-gas-mode"]');
            if (gasMode) UtilEnergyState.linkGasMode = gasMode.value || 'mj';
            const fromSelect = panel.querySelector('[data-role="energy-link-from"]');
            if (fromSelect) UtilEnergyState.from = fromSelect.value || UtilEnergyState.from;
            const toSelect = panel.querySelector('[data-role="energy-link-to"]');
            if (toSelect) UtilEnergyState.to = toSelect.value || UtilEnergyState.to;
            const lngInput = panel.querySelector('[data-role="energy-link-lng-factor"]');
            if (lngInput) setUtilEnergyStateNumber('gasLNG', parseUtilInputNumber(lngInput));
            const lpgInput = panel.querySelector('[data-role="energy-link-lpg-factor"]');
            if (lpgInput) setUtilEnergyStateNumber('gasLPG', parseUtilInputNumber(lpgInput));
            const displayDecimalsSelect = panel.querySelector('[data-role="energy-display-decimals"]');
            if (displayDecimalsSelect) {
                UtilEnergyState.displayDecimals = normalizeUtilEnergyDecimals(displayDecimalsSelect.value, UtilEnergyState.displayDecimals);
            }
        }

        function syncUtilEnergyLinkedControls(scope) {
            const root = scope || document;
            const setFieldValue = (el, value) => {
                if (!el || value === undefined || value === null || value === '') return;
                const stringValue = String(value);
                if (el.tagName === 'SELECT') {
                    if (Array.from(el.options || []).some(option => option.value === stringValue)) {
                        el.value = stringValue;
                    }
                    return;
                }
                if (el.tagName === 'INPUT' && Object.prototype.hasOwnProperty.call(el.dataset || {}, 'formatDecimals')) {
                    const decimals = resolveUtilInputDecimals(el, null);
                    setUtilInputDisplayValue(el, value, decimals);
                    return;
                }
                el.value = stringValue;
            };

            root.querySelectorAll('[data-util-energy]').forEach(panel => {
                panel.dataset.energySyncing = 'true';
                const linkToggle = panel.querySelector('[data-role="energy-link-toggle"]');
                if (linkToggle) linkToggle.checked = !!UtilEnergyState.linkEnabled;
                setFieldValue(panel.querySelector('[data-role="energy-link-electric-team"]'), UtilEnergyState.electricTeam || 'all');
                setFieldValue(panel.querySelector('[data-role="energy-link-gas-team"]'), UtilEnergyState.gasTeam || 'all');
                setFieldValue(panel.querySelector('[data-role="energy-link-gas-mode"]'), UtilEnergyState.linkGasMode || 'mj');
                setFieldValue(panel.querySelector('[data-role="energy-link-from"]'), UtilEnergyState.from);
                setFieldValue(panel.querySelector('[data-role="energy-link-to"]'), UtilEnergyState.to);
                setFieldValue(panel.querySelector('[data-role="energy-link-lng-factor"]'), UtilEnergyState.gasLNG);
                setFieldValue(panel.querySelector('[data-role="energy-link-lpg-factor"]'), UtilEnergyState.gasLPG);
                setFieldValue(panel.querySelector('[data-role="energy-display-decimals"]'), UtilEnergyState.displayDecimals);

                const basisSelect = panel.querySelector('[data-role="electric-basis"]');
                const factorInput = panel.querySelector('[data-role="electric-factor"]');
                const diffFinal = Math.abs(UtilEnergyState.electricFactor - UTIL_ENERGY_DEFAULTS.electricFinal);
                const diffPrimary = Math.abs(UtilEnergyState.electricFactor - UTIL_ENERGY_DEFAULTS.electricPrimary);
                if (basisSelect) {
                    if (diffFinal < 0.01) basisSelect.value = String(UTIL_ENERGY_DEFAULTS.electricFinal);
                    else if (diffPrimary < 0.01) basisSelect.value = String(UTIL_ENERGY_DEFAULTS.electricPrimary);
                    else basisSelect.value = 'custom';
                }
                if (factorInput && basisSelect?.value === 'custom') {
                    const factorDecimals = resolveUtilInputDecimals(factorInput, null);
                    setUtilInputDisplayValue(factorInput, UtilEnergyState.electricFactor, factorDecimals);
                }
                setFieldValue(panel.querySelector('[data-role="toe-factor"]'), UtilEnergyState.toeFactor);
                panel.dataset.energySyncing = 'false';
                syncUtilEnergyFields(panel);
            });

            refreshUtilEnergyLauncherSummary(root);
        }

        function applyUtilEnergyLink(panel) {
            if (!panel) return;
            const manualFields = [
                panel.querySelector('[data-role="electric-kwh"]'),
                panel.querySelector('[data-role="gas-amount"]'),
                panel.querySelector('[data-role="electric-cost"]'),
                panel.querySelector('[data-role="gas-cost"]'),
                panel.querySelector('[data-role="gas-unit"]')
            ];
            const warningEl = panel.querySelector('[data-role="energy-link-warning"]');
            const setWarning = (message) => {
                if (!warningEl) return;
                if (message) {
                    warningEl.textContent = message;
                    warningEl.style.display = 'block';
                } else {
                    warningEl.textContent = '';
                    warningEl.style.display = 'none';
                }
            };
            if (!UtilEnergyState.linkEnabled) {
                manualFields.forEach(field => { if (field) field.disabled = false; });
                setWarning('');
                return;
            }
            const months = ensureUtilEnergyRangeState();
            if (!months || !months.length) return;
            const fromVal = UtilEnergyState.from;
            const toVal = UtilEnergyState.to;
            const from = parseUtilMonthValue(fromVal);
            const to = parseUtilMonthValue(toVal);
            if (!from || !to) return;
            const fromKey = from.year * 12 + from.month;
            const toKey = to.year * 12 + to.month;
            const electric = sumUtilEntries(UTIL_ELECTRIC_ENTRIES, fromKey, toKey, UtilEnergyState.electricTeam);
            let gasAmount = 0;
            let gasCost = 0;
            let gasHasData = false;
            let gasUnitMode = 'mj';
            let gasFactor = 1;
            const gasMode = UtilEnergyState.linkGasMode || 'mj';
            if (gasMode === 'raw') {
                const raw = sumUtilGasUsageByType(UTIL_GAS_ENTRIES, fromKey, toKey, UtilEnergyState.gasTeam);
                gasCost = raw.cost;
                if (raw.hasLng && raw.hasLpg) {
                    setWarning('LNG/LPG가 혼합되어 원단위 합산이 불가합니다. 열량(MJ) 합산으로 표시합니다.');
                    const gas = sumUtilGasEnergy(
                        UTIL_GAS_ENTRIES,
                        fromKey,
                        toKey,
                        UtilEnergyState.gasTeam,
                        { lng: UtilEnergyState.gasLNG, lpg: UtilEnergyState.gasLPG }
                    );
                    gasAmount = gas.mj;
                    gasCost = gas.cost;
                    gasHasData = gas.hasData;
                    gasUnitMode = 'mj';
                    gasFactor = 1;
                } else if (raw.hasLpg) {
                    setWarning('');
                    gasAmount = raw.lpgUsage;
                    gasHasData = true;
                    gasUnitMode = 'lpg';
                    gasFactor = UtilEnergyState.gasLPG;
                } else if (raw.hasLng) {
                    setWarning('');
                    gasAmount = raw.lngUsage;
                    gasHasData = true;
                    gasUnitMode = 'lng';
                    gasFactor = UtilEnergyState.gasLNG;
                } else {
                    setWarning('');
                }
            } else {
                setWarning('');
                const gas = sumUtilGasEnergy(
                    UTIL_GAS_ENTRIES,
                    fromKey,
                    toKey,
                    UtilEnergyState.gasTeam,
                    { lng: UtilEnergyState.gasLNG, lpg: UtilEnergyState.gasLPG }
                );
                gasAmount = gas.mj;
                gasCost = gas.cost;
                gasHasData = gas.hasData;
                gasUnitMode = 'mj';
                gasFactor = 1;
            }
            const electricInput = panel.querySelector('[data-role="electric-kwh"]');
            const gasInput = panel.querySelector('[data-role="gas-amount"]');
            const electricCostInput = panel.querySelector('[data-role="electric-cost"]');
            const gasCostInput = panel.querySelector('[data-role="gas-cost"]');
            const gasUnitSelect = panel.querySelector('[data-role="gas-unit"]');
            const gasFactorInput = panel.querySelector('[data-role="gas-factor"]');

            panel.dataset.energySyncing = 'true';
            if (electricInput) setUtilInputDisplayValue(electricInput, electric.hasData ? Math.round(electric.usage) : '', resolveUtilInputDecimals(electricInput, 0));
            if (electricCostInput) setUtilInputDisplayValue(electricCostInput, electric.hasData ? Math.round(electric.cost) : '', resolveUtilInputDecimals(electricCostInput, 0));
            if (gasUnitSelect) gasUnitSelect.value = gasUnitMode;
            if (gasInput) setUtilInputDisplayValue(gasInput, gasHasData ? Math.round(gasAmount) : '', resolveUtilInputDecimals(gasInput, 0));
            if (gasCostInput) setUtilInputDisplayValue(gasCostInput, gasHasData ? Math.round(gasCost) : '', resolveUtilInputDecimals(gasCostInput, 0));
            if (gasFactorInput) setUtilInputDisplayValue(gasFactorInput, gasFactor, resolveUtilInputDecimals(gasFactorInput, 3));
            manualFields.forEach(field => { if (field) field.disabled = true; });
            panel.dataset.energySyncing = 'false';
            syncUtilEnergyFields(panel);
        }

        function syncUtilEnergyFields(panel) {
            if (!panel) return;
            const basisSelect = panel.querySelector('[data-role="electric-basis"]');
            const factorInput = panel.querySelector('[data-role="electric-factor"]');
            if (basisSelect && factorInput) {
                if (basisSelect.value === 'custom') {
                    factorInput.disabled = false;
                    if (!factorInput.value) {
                        setUtilInputDisplayValue(factorInput, UTIL_ENERGY_DEFAULTS.electricFinal, resolveUtilInputDecimals(factorInput, 2));
                    }
                } else {
                    setUtilInputDisplayValue(factorInput, basisSelect.value, resolveUtilInputDecimals(factorInput, 2));
                    factorInput.disabled = true;
                }
            }

            const gasUnitSelect = panel.querySelector('[data-role="gas-unit"]');
            const gasFactorInput = panel.querySelector('[data-role="gas-factor"]');
            const gasAmountLabel = panel.querySelector('[data-role="gas-amount-label"]');
            const gasFactorLabel = panel.querySelector('[data-role="gas-factor-label"]');
            const unit = gasUnitSelect?.value || 'lng';
            const prevUnit = panel.dataset.gasUnit;
            if (gasAmountLabel) {
                gasAmountLabel.textContent = unit === 'lpg'
                    ? '가스 사용량 (LPG kg)'
                    : (unit === 'mj' ? '가스 사용량 (MJ)' : '가스 사용량 (LNG m³)');
            }
            if (gasFactorLabel) {
                gasFactorLabel.textContent = unit === 'lpg'
                    ? '가스 열량계수 (MJ/kg)'
                    : (unit === 'mj' ? '가스 열량계수 (MJ/MJ)' : '가스 열량계수 (MJ/m³)');
            }
            if (gasFactorInput) {
                if (unit === 'mj') {
                    setUtilInputDisplayValue(gasFactorInput, 1, resolveUtilInputDecimals(gasFactorInput, 3));
                    gasFactorInput.disabled = true;
                } else {
                    gasFactorInput.disabled = false;
                    if (unit !== prevUnit || !gasFactorInput.value) {
                        const defaultFactor = unit === 'lpg' ? UTIL_ENERGY_DEFAULTS.gasLPG : UTIL_ENERGY_DEFAULTS.gasLNG;
                        setUtilInputDisplayValue(gasFactorInput, defaultFactor, resolveUtilInputDecimals(gasFactorInput, 3));
                    }
                }
            }
            panel.dataset.gasUnit = unit;
        }

        function updateUtilEnergyPanel(panel) {
            if (!panel) return;
            const kwhInput = panel.querySelector('[data-role="electric-kwh"]');
            const gasInput = panel.querySelector('[data-role="gas-amount"]');
            const electricCostInput = panel.querySelector('[data-role="electric-cost"]');
            const gasCostInput = panel.querySelector('[data-role="gas-cost"]');
            const toeFactorInput = panel.querySelector('[data-role="toe-factor"]');
            const gasUnit = panel.querySelector('[data-role="gas-unit"]')?.value || 'lng';

            const hasInput = [kwhInput, gasInput, electricCostInput, gasCostInput]
                .some(el => el && String(el.value ?? '').trim() !== '');

            const electricKwh = resolveUtilInputNumber(kwhInput, 0);
            const electricFactorInput = panel.querySelector('[data-role="electric-factor"]');
            const electricFactorInputValue = parseUtilInputNumber(electricFactorInput);
            const electricFactor = Number.isFinite(electricFactorInputValue) ? electricFactorInputValue : 0;
            const gasAmount = resolveUtilInputNumber(gasInput, 0);
            const gasFactor = resolveUtilInputNumber(panel.querySelector('[data-role="gas-factor"]'), 0);
            const electricCost = resolveUtilInputNumber(electricCostInput, 0);
            const gasCost = resolveUtilInputNumber(gasCostInput, 0);
            const toeFactorInputValue = parseUtilInputNumber(toeFactorInput);
            const toeFactor = Number.isFinite(toeFactorInputValue) ? toeFactorInputValue : UTIL_ENERGY_DEFAULTS.toeMJ;
            const displayDecimals = normalizeUtilEnergyDecimals(
                panel.querySelector('[data-role="energy-display-decimals"]')?.value,
                UtilEnergyState.displayDecimals
            );

            setUtilEnergyStateNumber('electricFactor', electricFactorInputValue);
            setUtilEnergyStateNumber('toeFactor', toeFactorInputValue);
            UtilEnergyState.displayDecimals = displayDecimals;

            const electricMJ = electricKwh * electricFactor;
            const gasMJ = gasUnit === 'mj' ? gasAmount : gasAmount * gasFactor;
            const totalMJ = electricMJ + gasMJ;
            const totalGJ = totalMJ / 1000;
            const electricToe = toeFactor ? electricMJ / toeFactor : 0;
            const gasToe = toeFactor ? gasMJ / toeFactor : 0;
            const totalToe = toeFactor ? totalMJ / toeFactor : 0;
            const costElectric = electricMJ ? electricCost / electricMJ : 0;
            const costGas = gasMJ ? gasCost / gasMJ : 0;
            const totalCost = electricCost + gasCost;
            const costTotal = totalMJ ? totalCost / totalMJ : 0;

            const setValue = (role, value, decimals = 2, enabled = true) => {
                const el = panel.querySelector(`[data-role="${role}"]`);
                if (!el) return;
                if (!hasInput || !enabled) {
                    el.textContent = '-';
                    return;
                }
                el.textContent = formatUtilNumber(value, decimals);
            };

            setValue('energy-electric-mj', electricMJ, displayDecimals);
            setValue('energy-gas-mj', gasMJ, displayDecimals);
            setValue('energy-total-mj', totalMJ, displayDecimals);
            setValue('energy-total-gj', totalGJ, displayDecimals);
            setValue('toe-electric', electricToe, displayDecimals);
            setValue('toe-gas', gasToe, displayDecimals);
            setValue('toe-total', totalToe, displayDecimals);
            setValue('cost-electric', costElectric, displayDecimals, electricCost > 0);
            setValue('cost-gas', costGas, displayDecimals, gasCost > 0);
            setValue('cost-total', costTotal, displayDecimals, totalCost > 0);

            const toeDisplay = panel.querySelector('[data-role="toe-factor-display"]');
            if (toeDisplay) {
                toeDisplay.textContent = formatUtilNumber(toeFactor, 0);
            }
        }

        function initUtilEnergyConverter(scope) {
            const root = scope || document;
            root.querySelectorAll('[data-util-energy]').forEach(panel => {
                bindUtilEnergyFormattedInputs(panel);
                const monthOptions = ensureUtilEnergyRangeState();
                const electricTeams = buildUtilTeamOptions(UTIL_ELECTRIC_ENTRIES);
                const gasTeams = buildUtilTeamOptions(UTIL_GAS_ENTRIES);
                const elecSelect = panel.querySelector('[data-role="energy-link-electric-team"]');
                const gasSelect = panel.querySelector('[data-role="energy-link-gas-team"]');
                const gasModeSelect = panel.querySelector('[data-role="energy-link-gas-mode"]');
                const fromSelect = panel.querySelector('[data-role="energy-link-from"]');
                const toSelect = panel.querySelector('[data-role="energy-link-to"]');
                const lngInput = panel.querySelector('[data-role="energy-link-lng-factor"]');
                const lpgInput = panel.querySelector('[data-role="energy-link-lpg-factor"]');
                const linkToggle = panel.querySelector('[data-role="energy-link-toggle"]');
                const warningEl = panel.querySelector('[data-role="energy-link-warning"]');
                const basisSelect = panel.querySelector('[data-role="electric-basis"]');
                const factorInput = panel.querySelector('[data-role="electric-factor"]');
                const toeInput = panel.querySelector('[data-role="toe-factor"]');
                const displayDecimalsSelect = panel.querySelector('[data-role="energy-display-decimals"]');
                if (elecSelect) {
                    const options = ['<option value="all">전체</option>']
                        .concat(electricTeams.map(team => `<option value="${team}">${team}</option>`))
                        .join('');
                    setUtilSelectOptions(elecSelect, options, UtilEnergyState.electricTeam);
                }
                if (gasSelect) {
                    const options = ['<option value="all">전체</option>']
                        .concat(gasTeams.map(team => `<option value="${team}">${team}</option>`))
                        .join('');
                    setUtilSelectOptions(gasSelect, options, UtilEnergyState.gasTeam);
                }
                if (gasModeSelect) gasModeSelect.value = UtilEnergyState.linkGasMode || 'mj';
                if (monthOptions && monthOptions.length) {
                    const monthHtml = monthOptions.map(month => `<option value="${month.value}">${month.label}</option>`).join('');
                    setUtilSelectOptions(fromSelect, monthHtml, UtilEnergyState.from);
                    setUtilSelectOptions(toSelect, monthHtml, UtilEnergyState.to);
                }
                if (lngInput) setUtilInputDisplayValue(lngInput, UtilEnergyState.gasLNG, resolveUtilInputDecimals(lngInput, 3));
                if (lpgInput) setUtilInputDisplayValue(lpgInput, UtilEnergyState.gasLPG, resolveUtilInputDecimals(lpgInput, 3));
                if (linkToggle) linkToggle.checked = UtilEnergyState.linkEnabled;
                if (warningEl) {
                    warningEl.textContent = '';
                    warningEl.style.display = 'none';
                }
                if (basisSelect) {
                    const diffFinal = Math.abs(UtilEnergyState.electricFactor - UTIL_ENERGY_DEFAULTS.electricFinal);
                    const diffPrimary = Math.abs(UtilEnergyState.electricFactor - UTIL_ENERGY_DEFAULTS.electricPrimary);
                    if (diffFinal < 0.01) {
                        basisSelect.value = String(UTIL_ENERGY_DEFAULTS.electricFinal);
                    } else if (diffPrimary < 0.01) {
                        basisSelect.value = String(UTIL_ENERGY_DEFAULTS.electricPrimary);
                    } else {
                        basisSelect.value = 'custom';
                        if (factorInput) {
                            setUtilInputDisplayValue(factorInput, UtilEnergyState.electricFactor, resolveUtilInputDecimals(factorInput, 2));
                        }
                    }
                }
                if (toeInput) setUtilInputDisplayValue(toeInput, UtilEnergyState.toeFactor, resolveUtilInputDecimals(toeInput, 0));
                if (displayDecimalsSelect) displayDecimalsSelect.value = String(normalizeUtilEnergyDecimals(UtilEnergyState.displayDecimals, 2));

                const refresh = () => {
                    if (panel.dataset.energySyncing === 'true') return;
                    updateUtilEnergyStateFromPanel(panel);
                    syncUtilEnergyFields(panel);
                    applyUtilEnergyLink(panel);
                    updateUtilEnergyPanel(panel);
                    syncUtilEnergyLinkedControls(root);
                    syncUtilEnergyModalHeader(panel.closest('#util-energy-modal'));
                };

                refresh();

                panel.querySelectorAll('input, select').forEach(el => {
                    const handler = () => refresh();
                    el.addEventListener('input', handler);
                    el.addEventListener('change', handler);
                });
            });
        }
