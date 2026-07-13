(function registerKpiUtilityEntryTemplates(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE, UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH, UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS, UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS, UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH, UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS } = parts.constants;

    function buildUtilityEntryExperimentTopIcons(rulesId) {
        return `
            <div class="utility-entry-experiment-icons">
                <label
                    class="utility-entry-experiment-icon-button"
                    for="${parts.escapeUtilityEntryExperimentHtml(rulesId)}"
                    aria-label="보정/승률"
                    title="보정/승률"
                >
                    <i class="fa-solid fa-calculator" aria-hidden="true"></i>
                </label>
            </div>
        `;
    }

    function buildUtilityEntryExperimentRuleSummaryControl(rulesId) {
        return `
            <label
                class="utility-entry-experiment-rule-card"
                for="${parts.escapeUtilityEntryExperimentHtml(rulesId)}"
                aria-label="보정기준 보기"
                title="보정기준 보기"
            >
                <i class="fa-solid fa-file-lines" aria-hidden="true"></i>
            </label>
        `;
    }

    function getUtilityEntryExperimentViewKey(period = 'daily') {
        return period === 'monthly' ? 'monthly' : 'daily';
    }

    function buildUtilityEntryExperimentNavLabel(item) {
        const disabledAttr = item.disabled ? ' aria-disabled="true"' : '';
        const targetAttr = item.disabled ? '' : ` for="utility-entry-experiment-${parts.escapeUtilityEntryExperimentHtml(item.targetKey)}"`;
        return `
            <label
                class="utility-entry-experiment-nav-button${item.active ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}"
                ${targetAttr}
                role="tab"
                ${disabledAttr}
            >
                ${parts.escapeUtilityEntryExperimentHtml(item.label)}
            </label>
        `;
    }

    function buildUtilityEntryExperimentPeriodTabs(activePeriod = 'daily', extraClass = '') {
        const periods = [
            { key: 'daily', label: '일간' },
            { key: 'monthly', label: '월간' }
        ];
        const periodItems = periods.map(item => ({
            ...item,
            active: item.key === activePeriod,
            targetKey: getUtilityEntryExperimentViewKey(item.key)
        }));

        return `
            <div class="utility-entry-experiment-nav-group is-period${extraClass ? ` ${parts.escapeUtilityEntryExperimentHtml(extraClass)}` : ''}" role="tablist" aria-label="기간 구분">
                ${periodItems.map(buildUtilityEntryExperimentNavLabel).join('')}
            </div>
        `;
    }

    function buildUtilityEntryExperimentMonthlyMeterButton(linkKey = '') {
        const linkConfig = parts.getUtilityEntryExperimentMonthlyMeterLinkConfig(linkKey);
        if (!linkConfig) return '';

        const pendingLabel = `${linkConfig.label}표 정산 상태 확인 중`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-meter-key is-disabled"
                        data-role="utility-entry-experiment-meter-open"
                        data-utility-entry-experiment-meter="${parts.escapeUtilityEntryExperimentHtml(linkConfig.datasetKey)}"
                        data-utility-entry-experiment-meter-link="${parts.escapeUtilityEntryExperimentHtml(linkConfig.key)}"
                        data-utility-entry-experiment-meter-ready="false"
                        title="${parts.escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-label="${parts.escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-disabled="true"
                        disabled
                    >${parts.escapeUtilityEntryExperimentHtml(linkConfig.label)}</button>
        `;
    }

    function buildUtilityEntryExperimentMonthShiftButton(period, direction) {
        const isPrevious = Number(direction) < 0;
        const label = isPrevious ? '이전월' : '다음월';
        const icon = isPrevious ? 'fa-chevron-left' : 'fa-chevron-right';
        return `
            <button
                type="button"
                class="utility-entry-experiment-month-arrow"
                data-role="utility-entry-experiment-month-shift"
                data-utility-entry-experiment-period="${parts.escapeUtilityEntryExperimentHtml(period)}"
                data-utility-entry-experiment-shift="${isPrevious ? '-1' : '1'}"
                aria-label="${parts.escapeUtilityEntryExperimentHtml(label)}"
                title="${parts.escapeUtilityEntryExperimentHtml(label)}"
            >
                <i class="fa-solid ${icon}" aria-hidden="true"></i>
            </button>
        `;
    }

    function buildUtilityEntryExperimentToolbar(period = 'daily', options = {}) {
        const date = parts.clampUtilityEntryExperimentDateToToday(options.date || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        const saved = options.saved !== false;
        const rulesId = String(options.rulesId || '').trim();
        const dateParts = parts.getUtilityEntryExperimentMonthParts(date);
        const selectedYear = String(period === 'daily' ? dateParts.year : (options.year || '2024'));
        const defaultMonthLabel = `${Number(UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH.slice(5, 7)) || 1}월`;
        const month = options.month || defaultMonthLabel;
        const selectedMonthValue = period === 'daily'
            ? String(dateParts.month).padStart(2, '0')
            : month.replace(/[^0-9]/g, '').padStart(2, '0');
        const yearOptions = parts.getUtilityEntryExperimentYearOptions();
        const disabledByYear = new Map(parts.getUtilityEntryExperimentMonthOptionsForYear(selectedYear).map(item => [item.value, item.disabled]));
        const monthOptionsSource = Array.isArray(options.monthOptions) && options.monthOptions.length
            ? options.monthOptions
            : UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS;
        const monthOptions = monthOptionsSource.map(item => ({
            ...item,
            disabled: disabledByYear.get(item.value) === true
        }));

        return `
            <div class="utility-entry-experiment-toolbar">
                ${period === 'monthly' ? `
                    <div class="utility-entry-experiment-month-picker" role="group" aria-label="연도/월">
                        <span class="utility-entry-experiment-month-picker-label">연도/월</span>
                        ${buildUtilityEntryExperimentMonthShiftButton('monthly', -1)}
                        <span class="utility-entry-experiment-month-selects">
                        <select aria-label="연도" data-role="utility-entry-experiment-monthly-year">
                            ${yearOptions.map(item => `
                                <option value="${parts.escapeUtilityEntryExperimentHtml(item)}"${item === selectedYear ? ' selected' : ''}>${parts.escapeUtilityEntryExperimentHtml(item)}</option>
                            `).join('')}
                        </select>
                        <select aria-label="월" data-role="utility-entry-experiment-monthly-month">
                            ${monthOptions.map(item => `
                                <option value="${parts.escapeUtilityEntryExperimentHtml(item.value)}"${item.value === selectedMonthValue ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${parts.escapeUtilityEntryExperimentHtml(item.label)}</option>
                            `).join('')}
                        </select>
                        </span>
                        ${buildUtilityEntryExperimentMonthShiftButton('monthly', 1)}
                    </div>
                ` : ''}
                ${period === 'monthly' ? buildUtilityEntryExperimentRuleSummaryControl(rulesId) : ''}
                ${period === 'daily' ? `
                    <div class="utility-entry-experiment-month-picker" role="group" aria-label="연도/월">
                        <span class="utility-entry-experiment-month-picker-label">연도/월</span>
                        ${buildUtilityEntryExperimentMonthShiftButton('daily', -1)}
                        <span class="utility-entry-experiment-month-selects">
                        <select aria-label="연도" data-role="utility-entry-experiment-daily-year">
                            ${yearOptions.map(item => `
                                <option value="${parts.escapeUtilityEntryExperimentHtml(item)}"${item === selectedYear ? ' selected' : ''}>${parts.escapeUtilityEntryExperimentHtml(item)}</option>
                            `).join('')}
                        </select>
                        <select aria-label="월" data-role="utility-entry-experiment-daily-month">
                            ${monthOptions.map(item => `
                                <option value="${parts.escapeUtilityEntryExperimentHtml(item.value)}"${item.value === selectedMonthValue ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${parts.escapeUtilityEntryExperimentHtml(item.label)}</option>
                            `).join('')}
                        </select>
                        </span>
                        ${buildUtilityEntryExperimentMonthShiftButton('daily', 1)}
                        <input type="hidden" data-role="utility-entry-experiment-daily-date" value="${parts.escapeUtilityEntryExperimentHtml(date)}" aria-label="날짜" />
                    </div>
                    <div class="utility-entry-experiment-completed-calendar" data-role="utility-entry-experiment-completed-calendar" aria-label="기입 날짜">
                        <div class="utility-entry-experiment-completed-empty">기입 날짜 불러오는 중</div>
                    </div>
                ` : ''}
                <div class="utility-entry-experiment-save" data-role="utility-entry-experiment-save-status">
                    <span>저장상태</span>
                    <strong class="${saved ? 'is-saved' : 'is-unsaved'}" data-role="utility-entry-experiment-save-state">${saved ? '저장됨' : '저장 안됨'}</strong>
                    <button
                        type="button"
                        class="utility-entry-experiment-action is-save"
                        data-role="utility-entry-experiment-save"
                        data-utility-entry-experiment-period="${parts.escapeUtilityEntryExperimentHtml(period)}"
                    >저장</button>
                </div>
                ${period === 'daily' ? `
                    ${buildUtilityEntryExperimentRuleSummaryControl(rulesId)}
                    <div class="utility-entry-experiment-quick-entry" data-role="utility-entry-experiment-quick-entry">
                        <button
                            type="button"
                            class="utility-entry-experiment-action"
                            data-role="utility-entry-experiment-quick-toggle"
                            aria-expanded="false"
                        >입력</button>
                        <div class="utility-entry-experiment-quick-panel" data-role="utility-entry-experiment-quick-panel" hidden>
                            <input
                                class="utility-entry-experiment-quick-input"
                                type="text"
                                inputmode="decimal"
                                pattern="[0-9,.\\-]*"
                                autocomplete="off"
                                data-role="utility-entry-experiment-quick-input"
                                aria-label="일간 빠른 입력값"
                                placeholder="값 입력"
                            />
                            <div class="utility-entry-experiment-quick-candidates" data-role="utility-entry-experiment-quick-candidates">
                                <div class="utility-entry-experiment-quick-empty">값을 입력하면 가까운 항목 3개가 표시됩니다.</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function buildUtilityEntryExperimentCorrectionDialog(rulesId) {
        const defaultRows = parts.getUtilityEntryExperimentCorrectionRuleRows({}, '');

        return `
            <section class="utility-entry-experiment-rule-dialog" role="dialog" aria-modal="true" aria-label="보정/승률 적용 기준">
                <label class="utility-entry-experiment-rule-backdrop" for="${parts.escapeUtilityEntryExperimentHtml(rulesId)}" aria-label="닫기"></label>
                <div class="utility-entry-experiment-rule-sheet">
                    <header>
                        <div>
                            <strong>보정기준 문서</strong>
                            <span>읽기 전용 · 입력값을 바꾸지 않고 표시/합계 계산에만 적용</span>
                        </div>
                        <label class="utility-entry-experiment-rule-close" for="${parts.escapeUtilityEntryExperimentHtml(rulesId)}" aria-label="닫기">
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </label>
                    </header>
                    <div class="utility-entry-experiment-rule-note">
                        입력 검침은 그대로 두고, 보고서 배분에서 숨김/배분/차감/합계 표시만 아래 기준으로 계산합니다.
                    </div>
                    <table data-role="utility-entry-experiment-correction-summary">
                        <thead>
                            <tr>
                                <th>구분</th>
                                <th>항목</th>
                                <th>적용기간</th>
                                <th>계산/입력 기준</th>
                                <th>화면 반영</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${defaultRows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${parts.escapeUtilityEntryExperimentHtml(cell)}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function buildUtilityEntryExperimentPanel({ period, year, month, date, body }) {
        const rulesId = `utility-entry-experiment-rules-${getUtilityEntryExperimentViewKey(period)}`;
        return `
            <section class="utility-entry-experiment-panel" data-period="${parts.escapeUtilityEntryExperimentHtml(period)}">
                <input class="utility-entry-experiment-rule-toggle" type="checkbox" id="${parts.escapeUtilityEntryExperimentHtml(rulesId)}" />
                <header class="utility-entry-experiment-head">
                    <div class="utility-entry-experiment-head-main">
                        <strong>유틸리티 입력 시스템</strong>
                        ${buildUtilityEntryExperimentPeriodTabs(period, 'is-head-period')}
                    </div>
                </header>
                ${buildUtilityEntryExperimentToolbar(period, {
            year,
            month,
            date,
            rulesId,
            monthOptions: UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS
        })}
                ${buildUtilityEntryExperimentCorrectionDialog(rulesId)}
                <div class="utility-entry-experiment-body">
                    ${body}
                </div>
            </section>
        `;
    }

    function buildUtilityEntryExperimentInputDataAttributes(options = {}) {
        const entries = [
            ['data-utility-entry-experiment-save-kind', options.saveKind],
            ['data-utility-entry-experiment-resource-type', options.resourceType],
            ['data-utility-entry-experiment-field-id', options.fieldId],
            ['data-utility-entry-experiment-scope-key', options.scopeKey],
            ['data-utility-entry-experiment-field-key', options.fieldKey],
            ['data-utility-entry-experiment-team-key', options.teamKey],
            ['data-utility-entry-experiment-number-kind', options.numberKind]
        ].filter(([, value]) => String(value || '').trim());
        return entries.map(([name, value]) => (
            `${name}="${parts.escapeUtilityEntryExperimentHtml(String(value || '').trim())}"`
        )).join(' ');
    }

    function buildUtilityEntryExperimentInput(label = '', options = {}) {
        const mode = options.mode === 'calculated' ? 'calculated' : 'manual';
        const readonlyAttr = mode === 'calculated' ? ' readonly aria-readonly="true"' : '';
        const titleAttr = mode === 'calculated' ? ' title="자동 계산값"' : '';
        const inputType = options.numberKind === 'float' ? 'number' : 'text';
        const stepAttr = options.numberKind === 'float' ? ' step="any"' : '';
        const dataAttributes = buildUtilityEntryExperimentInputDataAttributes(options);
        const dataAttr = dataAttributes ? ` ${dataAttributes}` : '';

        return `<input class="utility-entry-experiment-input" type="${inputType}" value="" inputmode="decimal" pattern="[0-9,.\\-]*"${stepAttr} autocomplete="off" data-entry-mode="${mode}" aria-label="${parts.escapeUtilityEntryExperimentHtml(label)}"${dataAttr}${readonlyAttr}${titleAttr} />`;
    }

    function getUtilityEntryExperimentSettlementUnit(label = '', inputLabelPrefix = '') {
        if (label === '전력 총량') return 'kWh';
        if (label === '사용량') return inputLabelPrefix.includes('LPG') ? 'kg' : 'm³';
        if (label === '가스 사용량') return 'm³';
        if (label === '방류량' || label === '폐수 방류량') return 'm³';
        if (label === '생산량 대비 폐수량') return 'm3/톤';
        if (label === 'LPG / LNG환산') return '';
        if (label === 'Nm3 단가') return '원/M3';
        if (label === '단가') {
            if (inputLabelPrefix.includes('전기')) return '원/kWh';
            if (inputLabelPrefix.includes('폐수')) return '원/m³';
            if (inputLabelPrefix.includes('LPG')) return '원/kg';
            return '원/m³';
        }
        return '원';
    }

    function buildUtilityEntryExperimentInputWithUnit(label = '', unit = '', options = {}) {
        return `
            <div class="utility-entry-experiment-field-with-unit">
                ${buildUtilityEntryExperimentInput(label, options)}
                <span class="utility-entry-experiment-field-unit">${parts.escapeUtilityEntryExperimentHtml(unit)}</span>
            </div>
        `;
    }

    function getUtilityEntryExperimentDailyCurrentMode(item = '') {
        return item === '기타' || item === '컴프레셔' || item.endsWith(' 컴프레셔')
            ? 'calculated'
            : 'manual';
    }

    function getUtilityEntryExperimentCalculationHelp(label = '', inputLabelPrefix = '') {
        if (label === '전기요금계') {
            return '기본요금 + 전력량요금 + 기후환경요금 + 연료비조정액 + 조작수수료 + 지상역률료 - 인터넷할인. 구성값이 부족하면 청구금액 - 부가가치세 - 전력기금 - TV수신료 + 원단위 절삭으로 역산합니다.';
        }
        if (label === '청구금액') {
            if (inputLabelPrefix.includes('전기')) {
                return '전기요금계 + 부가가치세 + 전력기금 + TV수신료 - 원단위 절삭.';
            }
            if (inputLabelPrefix.includes('LNG')) {
                return '사용료 + 교체비 + 부가세 + 가산세 - 원절삭.';
            }
            return '';
        }
        if (label === '총액' && inputLabelPrefix.includes('LPG')) {
            return '공급가액 + 세액.';
        }
        if (label === '총비용' && inputLabelPrefix.includes('폐수')) {
            return '용수비 + 폐수 분담금 + 폐수오니 처리비용 + 혼합수지 처리비용 + 인건비.';
        }
        if (label === '생산량 대비 폐수량' && inputLabelPrefix.includes('폐수')) {
            return '폐수/생산량';
        }
        if (label === '단가') {
            if (inputLabelPrefix.includes('전기')) return '전기요금계 / 전력 총량.';
            if (inputLabelPrefix.includes('LPG')) return '공급가액 / 사용량.';
            if (inputLabelPrefix.includes('LNG')) return '사용료 / 사용량.';
            if (inputLabelPrefix.includes('폐수')) return '총비용 / 방류량.';
        }
        if (label === 'Nm3 단가' && inputLabelPrefix.includes('LPG')) {
            return '공급가액 / LPG 원검침 사용량.';
        }
        return '';
    }

    function buildUtilityEntryExperimentCalculationHelp(label = '', inputLabelPrefix = '', isCalculated = false) {
        if (!isCalculated) return parts.escapeUtilityEntryExperimentHtml(label);

        const helpText = getUtilityEntryExperimentCalculationHelp(label, inputLabelPrefix);
        if (!helpText) return parts.escapeUtilityEntryExperimentHtml(label);

        const escapedLabel = parts.escapeUtilityEntryExperimentHtml(label);
        const escapedHelpText = parts.escapeUtilityEntryExperimentHtml(helpText);
        return `
            <span class="utility-entry-experiment-calc-label">
                <span>${escapedLabel}</span>
                <details class="utility-entry-experiment-calc-help">
                    <summary aria-label="${escapedLabel} 산정식 보기" title="산정식 보기">?</summary>
                    <span class="utility-entry-experiment-calc-help-popover">${escapedHelpText}</span>
                </details>
            </span>
        `;
    }

    function isUtilityEntryExperimentConditionVisibleForMonth(source = {}, monthValue = '') {
        const normalizedMonthValue = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonthValue)) return true;

        const visibleFromMonth = String(source.visibleFromMonth || '').trim();
        const visibleBeforeMonth = String(source.visibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && normalizedMonthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth) && normalizedMonthValue >= visibleBeforeMonth) return false;
        return true;
    }

    function buildUtilityEntryExperimentConditionalAttributes(source = {}, initialMonthValue = '') {
        const attributes = [];
        const visibleFromMonth = String(source.visibleFromMonth || '').trim();
        const visibleBeforeMonth = String(source.visibleBeforeMonth || '').trim();
        if (/^\d{4}-\d{2}$/.test(visibleFromMonth)) {
            attributes.push(`data-utility-entry-experiment-visible-from-month="${parts.escapeUtilityEntryExperimentHtml(visibleFromMonth)}"`);
        }
        if (/^\d{4}-\d{2}$/.test(visibleBeforeMonth)) {
            attributes.push(`data-utility-entry-experiment-visible-before-month="${parts.escapeUtilityEntryExperimentHtml(visibleBeforeMonth)}"`);
        }
        if (
            attributes.length &&
            !isUtilityEntryExperimentConditionVisibleForMonth(source, initialMonthValue)
        ) {
            attributes.push('hidden');
        }
        return attributes.length ? ` ${attributes.join(' ')}` : '';
    }

    function normalizeUtilityEntryExperimentDailyItem(item) {
        if (typeof item === 'string') return { label: item };
        if (item && typeof item === 'object') return item;
        return { label: '' };
    }

    function getUtilityEntryExperimentDailyFieldId(resourceType = '', label = '') {
        const rows = UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [];
        const match = rows.find(([candidateLabel]) => candidateLabel === label);
        return match?.[1] || '';
    }

    function buildUtilityEntryExperimentDailyRows(groups, unitLabel = '', initialMonthValue = '', resourceType = '') {
        return groups.map((group, groupIndex) => {
            const items = Array.isArray(group.items)
                ? group.items.map(normalizeUtilityEntryExperimentDailyItem)
                : [];
            const groupKey = `${resourceType || 'resource'}-${groupIndex}`;
            const rowGroupAttribute = ` data-utility-entry-experiment-row-group-key="${parts.escapeUtilityEntryExperimentHtml(groupKey)}"`;
            if (!items.length) {
                return `
                    <tr${buildUtilityEntryExperimentConditionalAttributes(group, initialMonthValue)}${rowGroupAttribute}>
                        <th class="utility-entry-experiment-group" data-utility-entry-experiment-group-label-cell="${parts.escapeUtilityEntryExperimentHtml(groupKey)}">› ${parts.escapeUtilityEntryExperimentHtml(group.label)} (0)</th>
                        <td colspan="4"></td>
                    </tr>
                `;
            }
            const includeTotal = group.includeTotal !== false;
            const groupRowspan = items.length + (includeTotal ? 1 : 0);
            const groupAttributes = buildUtilityEntryExperimentConditionalAttributes(group, initialMonthValue);
            const groupFieldIds = items
                .filter(item => item.includeInGroupTotal !== false)
                .map(item => getUtilityEntryExperimentDailyFieldId(resourceType, item.inputLabel || item.label))
                .filter(Boolean);
            const groupFieldIdsAttributes = groupFieldIds.length
                ? ` data-utility-entry-experiment-group-field-ids="${parts.escapeUtilityEntryExperimentHtml(groupFieldIds.join(','))}"`
                : '';
            const itemRows = items.map((item, index) => {
                const inputLabel = item.inputLabel || item.label;
                const displayLabel = item.displayLabel || inputLabel;
                const rowFieldId = getUtilityEntryExperimentDailyFieldId(resourceType, inputLabel);
                const rowFieldIdAttribute = rowFieldId
                    ? ` data-utility-entry-experiment-row-field-id="${parts.escapeUtilityEntryExperimentHtml(rowFieldId)}"`
                    : '';
                const correctionSourceRowAttribute = item.correctionSourceRow === true
                    ? ' data-utility-entry-experiment-correction-source-row="true"'
                    : '';
                const correctionCorrectedRowAttribute = item.correctionCorrectedRow === true
                    ? ' data-utility-entry-experiment-correction-corrected-row="true"'
                    : '';
                const rowAttributes = `${groupAttributes}${buildUtilityEntryExperimentConditionalAttributes(item, initialMonthValue)}${rowFieldIdAttribute}${correctionSourceRowAttribute}${correctionCorrectedRowAttribute}`;
                const currentMode = getUtilityEntryExperimentDailyCurrentMode(inputLabel);
                const fieldId = currentMode === 'manual'
                    ? rowFieldId
                    : '';
                return `
                <tr${rowAttributes}${rowGroupAttribute}>
                    ${index === 0 ? `<th class="utility-entry-experiment-group" rowspan="${groupRowspan}" data-utility-entry-experiment-group-label-cell="${parts.escapeUtilityEntryExperimentHtml(groupKey)}">⌄ ${parts.escapeUtilityEntryExperimentHtml(group.label)} (${items.length})</th>` : ''}
                    <td class="is-item-cell">${parts.escapeUtilityEntryExperimentHtml(displayLabel)}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 이전값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 현재값`, {
                        mode: currentMode,
                        saveKind: fieldId ? 'daily-current' : '',
                        resourceType,
                        fieldId
                    })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${inputLabel} 사용량`, { mode: 'calculated' })}</td>
                </tr>
                `;
            }).join('');

            const totalRow = includeTotal ? `
                <tr class="utility-entry-experiment-team-total-row"${groupAttributes}${groupFieldIdsAttributes}${rowGroupAttribute}>
                    <td class="is-item-cell">합계</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 이전값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 현재값`, { mode: 'calculated' })}</td>
                    <td class="is-number-cell">${buildUtilityEntryExperimentInput(`${group.label} 합계 사용량`, { mode: 'calculated' })}</td>
                </tr>
            ` : '';

            return `${itemRows}${totalRow}`;
        }).join('');
    }

    function buildUtilityEntryExperimentDailyTable({ title, resourceType = '', unitLabel, groups, summaryRows = [] }) {
        const unitLabels = (Array.isArray(unitLabel) ? unitLabel : [unitLabel]).filter(Boolean);
        return `
            <div class="utility-entry-experiment-table-title">
                <span>${parts.escapeUtilityEntryExperimentHtml(title)}</span>
                ${unitLabels.map(label => `
                    <span class="utility-entry-experiment-unit">단위: ${parts.escapeUtilityEntryExperimentHtml(label)}</span>
                `).join('')}
            </div>
            <div class="utility-entry-experiment-table-wrap">
                <table class="utility-entry-experiment-table">
                    <colgroup>
                        <col class="is-group" />
                        <col class="is-item" />
                        <col class="is-previous" />
                        <col class="is-current" />
                        <col class="is-usage" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>구분</th>
                            <th>항목</th>
                            <th>이전값</th>
                            <th>현재값</th>
                            <th>
                                <span
                                    data-role="utility-entry-experiment-period-usage-label"
                                    data-resource-type="${parts.escapeUtilityEntryExperimentHtml(resourceType)}"
                                >사용량</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${buildUtilityEntryExperimentDailyRows(groups, unitLabel, UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE.slice(0, 7), resourceType)}
                        ${summaryRows.map(label => `
                            <tr class="utility-entry-experiment-summary-row">
                                <th>${parts.escapeUtilityEntryExperimentHtml(label)}</th>
                                <td>-</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 이전값`, { mode: 'calculated' })}</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 현재값`, { mode: 'calculated' })}</td>
                                <td>${buildUtilityEntryExperimentInput(`${label} 사용량`, { mode: 'calculated' })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function buildUtilityEntryExperimentElectricDaily() {
        return buildUtilityEntryExperimentDailyTable({
            title: '전기 일간 등록 항목 31건',
            resourceType: 'electric',
            unitLabel: 'kWh',
            groups: [
                {
                    label: '1팀 2파트',
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['배풍', '송풍', '건조', '조제', '자동적재', '3톤 보일러', 'DSI보일러', '청정(220v)', '청정(380v)', '컴프(220v)', '컴프(380v)']
                },
                {
                    label: '1팀 2파트',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['배풍', '송풍', '건조', '조제', '자동적재', '3톤 보일러', 'DSI보일러', '청정(220v)', '청정(380v)', '1팀 2파트 컴프레셔']
                },
                {
                    label: '2팀',
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['소포장', '스틱', { label: '컴프 2', displayLabel: '컴프레셔' }]
                },
                {
                    label: '2팀',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    items: ['소포장', '스틱', '2팀 컴프레셔']
                },
                { label: '3팀', items: [{ label: '액상 1', correctionCorrectedRow: true }, '액상 2'] },
                { label: '관리동', items: ['관리동', '관리동 냉난방', '카페', '기타'] },
                {
                    label: '컴프레셔',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_SHARED_COMPRESSOR_START_MONTH,
                    visibleBeforeMonth: UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH,
                    items: [
                        { label: '액상 1', correctionSourceRow: true, includeInGroupTotal: false },
                        '컴프(220v)',
                        '컴프(380v)',
                        '컴프 2'
                    ]
                },
                {
                    label: '컴프레셔',
                    visibleFromMonth: UTILITY_ENTRY_EXPERIMENT_LIQUID_COMPRESSOR_START_MONTH,
                    items: [
                        { label: '액상 1', correctionSourceRow: true, includeInGroupTotal: false },
                        '컴프(220v)',
                        '컴프(380v)',
                        '컴프 1',
                        '컴프 2'
                    ]
                },
                { label: '전력총량', items: ['중부하(4)', '최대부하(5)', '경부하(6)'], includeTotal: false },
                { label: '무효전력', items: ['중간무효전력(7)', '최대무효전력(8)'], includeTotal: false }
            ],
            summaryRows: ['유효전력의 합', '무효전력의 합']
        });
    }

    function buildUtilityEntryExperimentGasDaily() {
        return `
            ${buildUtilityEntryExperimentDailyTable({
                title: '가스 일간 등록 항목 6건',
                resourceType: 'gas',
                unitLabel: ['LNG', 'LPG'],
                groups: [
                    { label: '가스 총량', items: ['LNG 합계'], includeTotal: false },
                    { label: '1팀 2파트 LPG', items: ['건조기(LPG)'], includeTotal: false },
                    { label: '1팀 2파트 LNG', items: ['3톤 보일러', 'DSI 보일러'] },
                    { label: '관리동', items: ['관리동'], includeTotal: false },
                    { label: '3팀 LNG', items: ['액상보일러'], includeTotal: false }
                ]
            })}
            <div class="utility-entry-experiment-total-line is-gas-total">
                <strong>LPG 합계</strong>
                ${buildUtilityEntryExperimentInput('LPG 합계', { mode: 'calculated' })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentSettlementTitle(title, options = {}) {
        const meterLinkKey = String(options.titleMeterLinkKey || '').trim();
        const titleGraphKey = String(options.titleGraphKey || '').trim();
        const linkConfig = meterLinkKey ? parts.getUtilityEntryExperimentMonthlyMeterLinkConfig(meterLinkKey) : null;
        if (!linkConfig) return `<h3>${parts.escapeUtilityEntryExperimentHtml(title)}</h3>`;

        const pendingLabel = titleGraphKey
            ? `${title} 그래프 상태 확인 중`
            : `${title} 정산 상태 확인 중`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-settlement-title-button utility-entry-experiment-meter-key is-disabled"
                        data-role="utility-entry-experiment-meter-open"
                        data-utility-entry-experiment-meter="${parts.escapeUtilityEntryExperimentHtml(linkConfig.datasetKey)}"
                        data-utility-entry-experiment-meter-link="${parts.escapeUtilityEntryExperimentHtml(linkConfig.key)}"
                        data-utility-entry-experiment-title-graph="${parts.escapeUtilityEntryExperimentHtml(titleGraphKey)}"
                        data-utility-entry-experiment-meter-ready="false"
                        title="${parts.escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-label="${parts.escapeUtilityEntryExperimentHtml(pendingLabel)}"
                        aria-disabled="true"
                        disabled
                    >${parts.escapeUtilityEntryExperimentHtml(title)}</button>
        `;
    }

    function buildUtilityEntryExperimentSettlementCard(title, rows, options = {}) {
        const emphasisRows = new Set(options.emphasisRows || []);
        const totalRows = new Set(options.totalRows || []);
        const usageRows = new Set(options.usageRows || ['전력 총량', '사용량', '가스 사용량', '방류량', '폐수 방류량']);
        const calculatedRows = new Set(options.calculatedRows || ['전기요금계', '총비용', '단가', '청구금액', '총액', '생산량 대비 폐수량']);
        const inputLabelPrefix = options.inputLabelPrefix || title;
        const fieldRows = Array.isArray(options.fieldRows) ? options.fieldRows : [];
        const attachmentKeyHtml = buildUtilityEntryExperimentSettlementAttachmentKey({
            title,
            inputLabelPrefix,
            resourceType: options.resourceType,
            scopeKey: options.scopeKey,
            showAttachmentKey: options.showAttachmentKey,
            attachmentLabel: options.attachmentLabel
        });
        const titleMeterLinkKey = String(options.titleMeterLinkKey || options.monthlyMeterLinkKey || '').trim();
        const titleHtml = buildUtilityEntryExperimentSettlementTitle(title, {
            titleMeterLinkKey,
            titleGraphKey: options.titleGraphKey
        });
        const monthlyMeterLinkHtml = titleMeterLinkKey ? '' : buildUtilityEntryExperimentMonthlyMeterButton(options.monthlyMeterLinkKey || '');
        const graphToggleHtml = buildUtilityEntryExperimentGraphToggle({
            graphKey: options.graphToggleKey,
            graphLabel: options.graphToggleLabel,
            resourceType: options.resourceType,
            scopeKey: options.scopeKey
        });

        return `
            <section class="utility-entry-experiment-settlement">
                <div class="utility-entry-experiment-settlement-heading">
                    ${titleHtml}
                    ${attachmentKeyHtml}
                    ${monthlyMeterLinkHtml}
                    ${graphToggleHtml}
                </div>
                <table class="utility-entry-experiment-form-table">
                    <tbody>
                        ${rows.map((row, index) => {
                            const label = typeof row === 'string' ? row : row.label;
                            const unit = typeof row === 'object' && row.unit
                                ? row.unit
                                : getUtilityEntryExperimentSettlementUnit(label, inputLabelPrefix);
                            const fieldKey = fieldRows.find(([fieldLabel]) => fieldLabel === label)?.[1] || '';
                            const directMonthlyMeta = !fieldKey && index === 0 && options.directMonthlyFirstRow
                                ? options.directMonthlyFirstRow
                                : null;
                            const rowClasses = [];
                            if (usageRows.has(label)) rowClasses.push('is-usage');
                            if (calculatedRows.has(label)) rowClasses.push('is-calculated');
                            if (totalRows.has(label)) {
                                rowClasses.push('is-total');
                            } else if (emphasisRows.has(label)) {
                                rowClasses.push('is-emphasis');
                            }
                            const className = rowClasses.length ? ` class="${rowClasses.join(' ')}"` : '';
                            const isCalculated = calculatedRows.has(label);

                            return `
                            <tr${className}>
                                <th>${buildUtilityEntryExperimentCalculationHelp(label, inputLabelPrefix, isCalculated)}</th>
                                <td>${buildUtilityEntryExperimentInputWithUnit(`${inputLabelPrefix} ${label}`, unit, {
                                    mode: isCalculated ? 'calculated' : 'manual',
                                    saveKind: fieldKey
                                        ? 'settlement-field'
                                        : directMonthlyMeta
                                            ? 'team-monthly-usage'
                                            : '',
                                    resourceType: fieldKey
                                        ? options.resourceType
                                        : directMonthlyMeta?.resourceType,
                                    scopeKey: fieldKey ? options.scopeKey : '',
                                    fieldKey,
                                    teamKey: directMonthlyMeta?.teamKey || ''
                                })}</td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </section>
        `;
    }

    function buildUtilityEntryExperimentOtherMonthlyCard() {
        return `
            <section class="utility-entry-experiment-settlement is-other">
                <div class="utility-entry-experiment-settlement-heading">
                    <h3>기타</h3>
                </div>
                <table class="utility-entry-experiment-form-table">
                    <tbody>
                        <tr>
                            <th>월간 평균온도</th>
                            <td>${buildUtilityEntryExperimentInputWithUnit('기타 월간 평균온도', '℃', {
                                saveKind: 'other-monthly-field',
                                resourceType: 'other',
                                fieldKey: 'average_temperature',
                                numberKind: 'float'
                            })}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        `;
    }

    function buildUtilityEntryExperimentCipCard(siteLabel, teams = []) {
        const normalizedSiteLabel = String(siteLabel || '').trim();
        const normalizedTeams = (Array.isArray(teams) ? teams : [])
            .map(team => ({
                key: String(team?.key || '').trim(),
                label: String(team?.label || '').trim()
            }))
            .filter(team => team.key && team.label);

        return `
            <section class="utility-entry-experiment-settlement is-cip">
                <div class="utility-entry-experiment-settlement-heading">
                    <h3>CIP</h3>
                </div>
                <table class="utility-entry-experiment-form-table">
                    <thead>
                        <tr>
                            <th scope="col">팀</th>
                            <th scope="col">횟수</th>
                            <th scope="col">시간</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${normalizedTeams.map(team => `
                        <tr>
                            <th scope="row">${parts.escapeUtilityEntryExperimentHtml(team.label)}</th>
                            <td>${buildUtilityEntryExperimentInputWithUnit(`${normalizedSiteLabel} CIP 횟수 ${team.label}`, '회', {
                                saveKind: 'other-team-monthly-field',
                                resourceType: 'other',
                                teamKey: team.key,
                                fieldKey: 'cip_count'
                            })}</td>
                            <td>${buildUtilityEntryExperimentInputWithUnit(`${normalizedSiteLabel} CIP 시간 ${team.label}`, '시간', {
                                saveKind: 'other-team-monthly-field',
                                resourceType: 'other',
                                teamKey: team.key,
                                fieldKey: 'cip_time',
                                numberKind: 'float'
                            })}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        `;
    }

    function buildUtilityEntryExperimentGraphToggle(options = {}) {
        const graphKey = String(options.graphKey || '').trim();
        if (!graphKey) return '';

        const label = String(options.graphLabel || '그래프').trim() || '그래프';
        const resourceType = parts.normalizeUtilityEntryExperimentResourceType(options.resourceType);
        const scopeKey = String(options.scopeKey || '').trim();
        const title = `${label}는 정산 완료 후 사용할 수 있습니다`;
        return `
                    <button
                        type="button"
                        class="utility-entry-experiment-graph-toggle is-disabled"
                        data-role="utility-entry-experiment-graph-toggle"
                        data-utility-entry-experiment-graph="${parts.escapeUtilityEntryExperimentHtml(graphKey)}"
                        data-utility-entry-experiment-graph-label="${parts.escapeUtilityEntryExperimentHtml(label)}"
                        data-utility-entry-experiment-resource-type="${parts.escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${parts.escapeUtilityEntryExperimentHtml(scopeKey)}"
                        data-utility-entry-experiment-graph-ready="false"
                        aria-pressed="false"
                        aria-disabled="true"
                        aria-label="${parts.escapeUtilityEntryExperimentHtml(title)}"
                        title="${parts.escapeUtilityEntryExperimentHtml(title)}"
                        disabled
                    >${parts.escapeUtilityEntryExperimentHtml(label)}</button>
        `;
    }

    function buildUtilityEntryExperimentSettlementAttachmentKey(options = {}) {
        if (options.showAttachmentKey !== true) return '';

        const resourceType = parts.normalizeUtilityEntryExperimentResourceType(options.resourceType);
        const scopeKey = String(options.scopeKey || '').trim();
        if (!resourceType || !scopeKey) return '';

        const explicitLabel = String(options.attachmentLabel || '').trim();
        const labelPrefix = String(options.inputLabelPrefix || options.title || '').trim();
        const label = explicitLabel || (labelPrefix ? `${labelPrefix} 청구서 첨부` : '청구서 첨부');
        const escapedLabel = parts.escapeUtilityEntryExperimentHtml(label);

        return `
                    <span
                        class="utility-entry-experiment-attachment-actions"
                        data-role="utility-entry-experiment-billing-actions"
                        data-utility-entry-experiment-resource-type="${parts.escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${parts.escapeUtilityEntryExperimentHtml(scopeKey)}"
                        data-utility-entry-experiment-attachment-state="empty"
                    >
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key"
                        data-role="utility-entry-experiment-billing-attach"
                        data-utility-entry-experiment-resource-type="${parts.escapeUtilityEntryExperimentHtml(resourceType)}"
                        data-utility-entry-experiment-scope-key="${parts.escapeUtilityEntryExperimentHtml(scopeKey)}"
                        aria-label="${escapedLabel}"
                        title="${escapedLabel}"
                    >
                        <i class="fa-solid fa-paperclip" aria-hidden="true"></i>
                        <span>첨부</span>
                    </button>
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key is-view"
                        data-role="utility-entry-experiment-billing-view"
                        hidden
                        aria-label="첨부 보기"
                        title="첨부 보기"
                    >
                        <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        <span>보기</span>
                    </button>
                    <button
                        type="button"
                        class="utility-entry-experiment-attachment-key is-clear"
                        data-role="utility-entry-experiment-billing-clear"
                        hidden
                        aria-label="첨부 취소"
                        title="첨부 취소"
                    >
                        <span aria-hidden="true">X</span>
                    </button>
                    </span>
        `;
    }

    function buildUtilityEntryExperimentMonthlySettlement() {
        const electricRows = [
            '기본요금',
            '전력량요금',
            '기후환경요금',
            '연료비조정액',
            '지상역률료',
            '조작수수료',
            '인터넷할인',
            '전기요금계',
            '단가',
            '부가가치세',
            '전력기금',
            'TV수신료',
            '원단위 절삭',
            '청구금액'
        ];
        const gasLngRows = ['사용료', '교체비', '부가세', '가산세', '원절삭', '단가', '청구금액'];
        const gasLngRowsWithUsage = ['사용량', ...gasLngRows];
        const gasLpgRows = ['사용량', '공급가액', '세액', '단가', 'Nm3 단가', '총액'];
        const yusanElectricRows = ['전력 총량', ...electricRows];
        const bukjeongElectricRows = ['전력 총량', ...electricRows];
        const yusanElectricCalculatedRows = ['전력 총량', '전기요금계', '단가', '청구금액', '총액', '총비용'];
        const yusanGasLngCalculatedRows = ['사용량', '단가', '청구금액', '총액', '총비용'];
        const yusanGasLpgCalculatedRows = ['사용량', '단가', 'Nm3 단가', '총액'];
        const wasteRows = ['방류량', '용수비', '폐수 분담금', '폐수오니 처리비용', '혼합수지 처리비용', '인건비', '총비용', '단가', '생산량 대비 폐수량'];

        return `
            <div class="utility-entry-experiment-stack">
                <div class="utility-entry-experiment-site-groups">
                    <section class="utility-entry-experiment-site-panel is-yusan">
                        <h3>유산</h3>
                        <div class="utility-entry-experiment-site-utilities">
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('전기', yusanElectricRows, {
                            inputLabelPrefix: '유산 전기',
                            resourceType: 'electric',
                            scopeKey: 'yusan',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 전기 청구서 첨부',
                            titleMeterLinkKey: 'electric_yusan',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric,
                            calculatedRows: yusanElectricCalculatedRows,
                            emphasisRows: ['전기요금계'],
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('가스 LNG', gasLngRowsWithUsage, {
                            inputLabelPrefix: '유산 LNG',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lng',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 가스 LNG 청구서 첨부',
                            titleMeterLinkKey: 'gas_yusan_lng',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng,
                            calculatedRows: yusanGasLngCalculatedRows,
                            totalRows: ['청구금액']
                        })}
                        ${buildUtilityEntryExperimentSettlementCard('가스 LPG', gasLpgRows, {
                            inputLabelPrefix: '유산 LPG',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lpg',
                            showAttachmentKey: true,
                            attachmentLabel: '유산 가스 LPG 청구서 첨부',
                            titleMeterLinkKey: 'gas_yusan_lpg',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLpg,
                            calculatedRows: yusanGasLpgCalculatedRows,
                            totalRows: ['총액']
                        })}
                        ${buildUtilityEntryExperimentSettlementCard('LPG환산 비율', ['LPG / LNG환산'], {
                            inputLabelPrefix: '유산 LPG환산 비율',
                            resourceType: 'gas',
                            scopeKey: 'yusan_lpg_conversion',
                            fieldRows: [['LPG / LNG환산', 'conversion_ratio']]
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('폐수', wasteRows, {
                            inputLabelPrefix: '유산 폐수',
                            resourceType: 'waste',
                            scopeKey: 'waste_yusan',
                            titleMeterLinkKey: 'waste_yusan',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste,
                            directMonthlyFirstRow: { resourceType: 'waste', teamKey: 'waste_yusan' },
                            totalRows: ['총비용']
                        })}
                        ${buildUtilityEntryExperimentCipCard('유산', [
                            { key: 'team_01_02', label: '1팀 2파트' },
                            { key: 'team_02', label: '2팀' },
                            { key: 'team_03', label: '3팀' }
                        ])}
                        ${buildUtilityEntryExperimentOtherMonthlyCard()}
                            </div>
                        </div>
                    </section>
                    <section class="utility-entry-experiment-site-panel is-bukjeong">
                        <h3>북정</h3>
                        <div class="utility-entry-experiment-site-utilities">
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('전기', bukjeongElectricRows, {
                            inputLabelPrefix: '북정 전기',
                            resourceType: 'electric',
                            scopeKey: 'bukjeong',
                            showAttachmentKey: true,
                            attachmentLabel: '북정 전기 청구서 첨부',
                            titleMeterLinkKey: 'electric_bukjeong',
                            titleGraphKey: 'electric_bukjeong',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.electric,
                            directMonthlyFirstRow: { resourceType: 'electric', teamKey: 'team_01_01' },
                            emphasisRows: ['전기요금계'],
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('가스 LNG', gasLngRowsWithUsage, {
                            inputLabelPrefix: '북정 LNG',
                            resourceType: 'gas',
                            scopeKey: 'gas_bukjeong',
                            showAttachmentKey: true,
                            attachmentLabel: '북정 가스 LNG 청구서 첨부',
                            titleMeterLinkKey: 'gas_bukjeong_lng',
                            titleGraphKey: 'gas_bukjeong',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.gasLng,
                            directMonthlyFirstRow: { resourceType: 'gas', teamKey: 'team_01_01' },
                            totalRows: ['청구금액']
                        })}
                            </div>
                            <div class="utility-entry-experiment-stack utility-entry-experiment-utility-stack">
                                ${buildUtilityEntryExperimentSettlementCard('폐수', wasteRows, {
                            inputLabelPrefix: '북정 폐수',
                            resourceType: 'waste',
                            scopeKey: 'waste_bukjeong',
                            titleMeterLinkKey: 'waste_bukjeong',
                            fieldRows: UTILITY_ENTRY_EXPERIMENT_SETTLEMENT_FIELDS.waste,
                            directMonthlyFirstRow: { resourceType: 'waste', teamKey: 'waste_bukjeong' },
                            totalRows: ['총비용']
                        })}
                        ${buildUtilityEntryExperimentCipCard('북정', [
                            { key: 'team_01_01', label: '1팀 1파트' }
                        ])}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    function buildUtilityEntryExperimentSection(title, body, className = '', options = {}) {
        const titleHtml = options.hideTitle
            ? ''
            : `<h2>${parts.escapeUtilityEntryExperimentHtml(title)}</h2>`;
        return `
            <section class="utility-entry-experiment-subsection${className ? ` ${parts.escapeUtilityEntryExperimentHtml(className)}` : ''}">
                ${titleHtml}
                ${body}
            </section>
        `;
    }

    function buildUtilityEntryExperimentDaily() {
        return `
            <div class="utility-entry-experiment-combined is-daily">
                ${buildUtilityEntryExperimentSection('전기', buildUtilityEntryExperimentElectricDaily(), 'is-electric', { hideTitle: true })}
                ${buildUtilityEntryExperimentSection('가스', buildUtilityEntryExperimentGasDaily(), 'is-gas', { hideTitle: true })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentMonthly() {
        return `
            <div class="utility-entry-experiment-combined is-monthly">
                ${buildUtilityEntryExperimentSection('정산', buildUtilityEntryExperimentMonthlySettlement(), 'is-settlement', { hideTitle: true })}
            </div>
        `;
    }

    function buildUtilityEntryExperimentViews() {
        return [
            {
                key: 'daily',
                label: '일간',
                period: 'daily',
                year: '2024',
                month: '1월',
                date: UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE,
                body: buildUtilityEntryExperimentDaily()
            },
            {
                key: 'monthly',
                label: '월간',
                period: 'monthly',
                year: '2024',
                month: '2월',
                body: buildUtilityEntryExperimentMonthly()
            }
        ];
    }


    Object.assign(parts, { buildUtilityEntryExperimentTopIcons, buildUtilityEntryExperimentRuleSummaryControl, getUtilityEntryExperimentViewKey, buildUtilityEntryExperimentNavLabel, buildUtilityEntryExperimentPeriodTabs, buildUtilityEntryExperimentMonthlyMeterButton, buildUtilityEntryExperimentMonthShiftButton, buildUtilityEntryExperimentToolbar, buildUtilityEntryExperimentCorrectionDialog, buildUtilityEntryExperimentPanel, buildUtilityEntryExperimentInputDataAttributes, buildUtilityEntryExperimentInput, getUtilityEntryExperimentSettlementUnit, buildUtilityEntryExperimentInputWithUnit, getUtilityEntryExperimentDailyCurrentMode, getUtilityEntryExperimentCalculationHelp, buildUtilityEntryExperimentCalculationHelp, isUtilityEntryExperimentConditionVisibleForMonth, buildUtilityEntryExperimentConditionalAttributes, normalizeUtilityEntryExperimentDailyItem, getUtilityEntryExperimentDailyFieldId, buildUtilityEntryExperimentDailyRows, buildUtilityEntryExperimentDailyTable, buildUtilityEntryExperimentElectricDaily, buildUtilityEntryExperimentGasDaily, buildUtilityEntryExperimentSettlementTitle, buildUtilityEntryExperimentSettlementCard, buildUtilityEntryExperimentOtherMonthlyCard, buildUtilityEntryExperimentCipCard, buildUtilityEntryExperimentGraphToggle, buildUtilityEntryExperimentSettlementAttachmentKey, buildUtilityEntryExperimentMonthlySettlement, buildUtilityEntryExperimentSection, buildUtilityEntryExperimentDaily, buildUtilityEntryExperimentMonthly, buildUtilityEntryExperimentViews });
})(this);
