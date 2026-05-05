        function formatUtilNumber(value, decimals) {
            if (value === null || value === undefined || value === '') return '';
            const num = Number(value);
            if (!Number.isFinite(num)) return value;
            const fixedDecimals = Number.isFinite(decimals) ? Math.max(0, Math.min(4, Math.floor(decimals))) : null;
            const hasDecimals = Math.abs(num % 1) > 0.0001;
            return num.toLocaleString('ko-KR', {
                minimumFractionDigits: fixedDecimals !== null ? fixedDecimals : 0,
                maximumFractionDigits: fixedDecimals !== null ? fixedDecimals : (hasDecimals ? 2 : 0)
            });
        }

        const GAS_LPG_TO_LNG_FACTOR = 1.201;
        const UTIL_ENERGY_DEFAULTS = {
            electricFinal: 3.6,
            electricPrimary: 9.59,
            gasLNG: 42.705,
            gasLPG: 50.0,
            toeMJ: 41868
        };
        const UtilEnergyState = {
            linkEnabled: true,
            linkGasMode: 'mj',
            chartPopupEnabled: false,
            displayDecimals: 2,
            electricTeam: 'all',
            gasTeam: 'all',
            from: '',
            to: '',
            electricFactor: UTIL_ENERGY_DEFAULTS.electricFinal,
            gasLNG: UTIL_ENERGY_DEFAULTS.gasLNG,
            gasLPG: UTIL_ENERGY_DEFAULTS.gasLPG,
            toeFactor: UTIL_ENERGY_DEFAULTS.toeMJ,
            chartMetric: 'total_mj',
            chartElectricTeam: 'all',
            chartGasTeam: 'all',
            chartFrom: '',
            chartTo: ''
        };

        function normalizeUtilEnergyDecimals(value, fallback = 2) {
            const parsed = Number(value);
            if (!Number.isFinite(parsed)) return fallback;
            return Math.max(0, Math.min(4, Math.floor(parsed)));
        }

        function parseUtilNumericValue(value) {
            const raw = String(value ?? '').trim();
            if (!raw) return null;
            const num = Number(raw.replace(/,/g, ''));
            return Number.isFinite(num) ? num : null;
        }

        function resolveUtilInputDecimals(input, fallback = null) {
            if (!input) return fallback;
            if (!Object.prototype.hasOwnProperty.call(input.dataset || {}, 'formatDecimals')) return fallback;
            return normalizeUtilEnergyDecimals(input.dataset.formatDecimals, fallback);
        }

        function setUtilInputDisplayValue(input, value, decimals = null) {
            if (!input) return;
            if (value === null || value === undefined || value === '') {
                input.value = '';
                return;
            }
            const parsed = parseUtilNumericValue(value);
            if (parsed === null) {
                input.value = String(value);
                return;
            }
            input.value = formatUtilNumber(parsed, decimals);
        }

        function bindUtilFormattedInput(input) {
            if (!input || input.dataset.utilFormatted === 'true') return;
            input.dataset.utilFormatted = 'true';
            input.addEventListener('focus', () => {
                if (input.disabled || input.readOnly) return;
                const raw = String(input.value ?? '');
                if (!raw) return;
                const plain = raw.replace(/,/g, '');
                if (plain !== raw) input.value = plain;
            });
            input.addEventListener('blur', () => {
                const parsed = parseUtilNumericValue(input.value);
                if (parsed === null) {
                    input.value = '';
                    return;
                }
                const decimals = resolveUtilInputDecimals(input, null);
                setUtilInputDisplayValue(input, parsed, decimals);
            });
        }

        function bindUtilEnergyFormattedInputs(scope) {
            const root = scope || document;
            root.querySelectorAll('input[data-format-decimals]').forEach(input => {
                bindUtilFormattedInput(input);
            });
        }

        function getGasEntryConversionFactor(teamName) {
            const name = String(teamName || '');
            if (name.includes('LNG')) return 1 / GAS_LPG_TO_LNG_FACTOR;
            if (name.includes('LPG')) return GAS_LPG_TO_LNG_FACTOR;
            return 1;
        }

        function getGasConversionFactor(section) {
            if (!section || section.dataset.gasConvert !== 'on') return 1;
            return getGasEntryConversionFactor(section.dataset.activeTeam || '');
        }

        function getGasConvertedUsageLabel(teamName) {
            const name = String(teamName || '');
            if (name.includes('LNG')) return 'LPG 환산 사용량 (kg)';
            if (name.includes('LPG')) return 'LNG 환산 사용량 (m³)';
            return '환산 사용량';
        }

        function applyUtilConversion(panel) {
            if (!panel) return;
            const factor = parseFloat(panel.querySelector('.util-convert-select')?.value || '1');
            panel.querySelectorAll('.util-num').forEach(cell => {
                const raw = Number(cell.dataset.value || 0);
                const converted = factor ? raw / factor : raw;
                setUtilNumericCellDisplay(cell, formatUtilNumber(converted));
            });
        }

        function setUtilNumericCellDisplay(cell, text) {
            if (!cell) return;
            const node = cell.querySelector('.util-num-value');
            if (node) {
                node.textContent = String(text ?? '');
                return;
            }
            cell.textContent = String(text ?? '');
        }
