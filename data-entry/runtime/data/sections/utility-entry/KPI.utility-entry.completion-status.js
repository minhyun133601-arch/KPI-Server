(function registerKpiUtilityEntryCompletionStatus(root) {
    const parts = root[Symbol.for('kpi.utilityEntryExperiment.parts')] ||= Object.create(null);
    const { UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE, UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH, UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS, UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID, UTILITY_ENTRY_EXPERIMENT_COMPLETION_EXCLUDED_IDS, UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS } = parts.constants;

    function isUtilityEntryExperimentCompletedEntry(entry) {
        if (!entry) return false;
        if (entry.completed === true || entry.dayStatus === 'completed') return true;

        const values = entry.values || entry;
        return Object.values(values || {}).some(value => String(value ?? '').trim());
    }

    function hasUtilityEntryExperimentFilledValue(value) {
        return String(value ?? '').trim() !== '';
    }

    function getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId) {
        const field = (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [])
            .find(([, candidateId]) => candidateId === equipmentId);
        return field?.[0] || equipmentId;
    }

    function isUtilityEntryExperimentCompletionFieldVisible(dataset, equipmentId, dateString) {
        const item = parts.getUtilityEntryExperimentEquipmentItem(dataset, equipmentId) || {};
        const monthValue = String(dateString || '').slice(0, 7);
        const visibleFromMonth = String(item.visibleFromMonth || '').trim();
        const hiddenFromDate = String(item.hiddenFromDate || '').trim();

        if (/^\d{4}-\d{2}$/.test(visibleFromMonth) && monthValue < visibleFromMonth) return false;
        if (/^\d{4}-\d{2}-\d{2}$/.test(hiddenFromDate) && dateString >= hiddenFromDate) return false;
        return true;
    }

    function getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString) {
        const excludedIds = UTILITY_ENTRY_EXPERIMENT_COMPLETION_EXCLUDED_IDS[resourceType] || new Set();
        return (UTILITY_ENTRY_EXPERIMENT_DAILY_FIELDS[resourceType] || [])
            .map(([, equipmentId]) => equipmentId)
            .filter(equipmentId => equipmentId && !excludedIds.has(equipmentId))
            .filter(equipmentId => isUtilityEntryExperimentCompletionFieldVisible(dataset, equipmentId, dateString));
    }

    function getUtilityEntryExperimentResourceDailyEntryStatus(dataset, resourceType, resourceLabel, dateString) {
        const values = parts.getUtilityEntryExperimentEntryValues(dataset, dateString);
        const requiredIds = getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString);
        const filledIds = requiredIds.filter(equipmentId => hasUtilityEntryExperimentFilledValue(values[equipmentId]));
        const missingIds = requiredIds.filter(equipmentId => !hasUtilityEntryExperimentFilledValue(values[equipmentId]));
        const validationIssues = getUtilityEntryExperimentResourceDailyEntryValidationIssues(
            dataset,
            resourceType,
            dateString,
            requiredIds
        );
        const state = filledIds.length === 0
            ? 'missing'
            : filledIds.length === requiredIds.length
                ? 'done'
                : 'partial';

        return {
            resourceType,
            resourceLabel,
            state,
            filledCount: filledIds.length,
            requiredCount: requiredIds.length,
            filledIds,
            missingIds,
            missingLabels: missingIds.map(equipmentId => getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId)),
            validationIssues,
            errorCount: validationIssues.length
        };
    }

    function getUtilityEntryExperimentResourceDailyEntryValidationIssues(dataset, resourceType, dateString, fieldIds = null) {
        const currentValues = parts.getUtilityEntryExperimentEntryValues(dataset, dateString);
        const targetIds = Array.isArray(fieldIds)
            ? fieldIds
            : getUtilityEntryExperimentCompletionRequiredIds(dataset, resourceType, dateString);

        return targetIds
            .map(equipmentId => {
                const currentText = parts.normalizeUtilityEntryExperimentNumberText(currentValues[equipmentId]);
                const previousDate = parts.getUtilityEntryExperimentPreviousEquipmentEntryDate(dataset, equipmentId, dateString);
                if (!previousDate) return null;

                const previousValues = parts.getUtilityEntryExperimentEntryValues(dataset, previousDate);
                const previousText = parts.normalizeUtilityEntryExperimentNumberText(previousValues[equipmentId]);
                if (!currentText || !previousText) return null;

                const currentValue = parts.parseUtilityEntryExperimentNumber(currentText);
                const previousValue = parts.parseUtilityEntryExperimentNumber(previousText);
                const resolvedCurrentValue = equipmentId === UTILITY_ENTRY_EXPERIMENT_STICK_FIELD_ID
                    ? parts.getUtilityEntryExperimentResolvedStickReadingValue(currentValue, previousValue)
                    : currentValue;
                if (!Number.isFinite(resolvedCurrentValue) || !Number.isFinite(previousValue) || resolvedCurrentValue >= previousValue) {
                    return null;
                }

                return {
                    equipmentId,
                    label: getUtilityEntryExperimentCompletionFieldLabel(resourceType, equipmentId),
                    previousValue,
                    currentValue
                };
            })
            .filter(Boolean);
    }

    function formatUtilityEntryExperimentResourceStatusLabel(status) {
        const countLabel = `${status.resourceLabel} ${status.filledCount}/${status.requiredCount}`;
        if (status.state !== 'partial' || !status.missingLabels.length) return countLabel;
        return `${countLabel} 누락: ${status.missingLabels.slice(0, 4).join(', ')}${status.missingLabels.length > 4 ? ' 외' : ''}`;
    }

    function getUtilityEntryExperimentDailyEntryStatus(records, dateString) {
        const resourceStatuses = [
            ['electric', '전기'],
            ['gas', '가스']
        ].map(([resourceType, resourceLabel]) =>
            getUtilityEntryExperimentResourceDailyEntryStatus(records?.[resourceType], resourceType, resourceLabel, dateString)
        );
        const activeStatuses = resourceStatuses.filter(status => status.filledCount > 0);
        const requiredStatuses = resourceStatuses.filter(status => status.requiredCount > 0);
        const state = activeStatuses.length === 0
            ? 'missing'
            : requiredStatuses.some(status => status.state !== 'done')
                ? 'partial'
                : 'done';
        const visibleStatuses = state === 'partial'
            ? requiredStatuses
            : activeStatuses;
        const validationIssues = resourceStatuses.flatMap(status => status.validationIssues || []);

        return {
            dateString,
            state,
            resources: visibleStatuses.map(formatUtilityEntryExperimentResourceStatusLabel),
            resourceStatuses: visibleStatuses,
            validationIssues,
            errorCount: validationIssues.length,
            hasErrors: validationIssues.length > 0
        };
    }

    function getUtilityEntryExperimentFirstRecordedDateInMonth(dataset, monthValue) {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return '';

        return Object.entries(dataset?.equipmentEntries || {})
            .filter(([dateString, entry]) => dateString.startsWith(`${normalizedMonth}-`) && isUtilityEntryExperimentCompletedEntry(entry))
            .map(([dateString]) => dateString)
            .sort()
            .shift() || '';
    }

    function resolveUtilityEntryExperimentResourceDailyDate(dataset, requestedDate) {
        const normalizedDate = clampUtilityEntryExperimentDateToToday(requestedDate);
        if (!normalizedDate.endsWith('-01')) return normalizedDate;
        if (isUtilityEntryExperimentCompletedEntry(dataset?.equipmentEntries?.[normalizedDate])) return normalizedDate;

        return getUtilityEntryExperimentFirstRecordedDateInMonth(dataset, normalizedDate.slice(0, 7)) || normalizedDate;
    }

    function getUtilityEntryExperimentDailyEntryStatuses(records) {
        const dates = new Map();
        ['electric', 'gas'].forEach(resourceType => {
            Object.entries(records?.[resourceType]?.equipmentEntries || {}).forEach(([dateString, entry]) => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !isUtilityEntryExperimentCompletedEntry(entry)) return;
                dates.set(dateString, getUtilityEntryExperimentDailyEntryStatus(records, dateString));
            });
        });

        return [...dates.values()].sort((left, right) => left.dateString.localeCompare(right.dateString));
    }

    function getUtilityEntryExperimentMonthParts(dateString) {
        const match = String(dateString || '').match(/^(\d{4})-(\d{2})/);
        if (match) {
            const dayMatch = String(dateString || '').match(/^\d{4}-\d{2}-(\d{2})$/);
            return {
                year: Number(match[1]),
                month: Number(match[2]),
                day: Number(dayMatch?.[1] || 1),
                monthValue: `${match[1]}-${match[2]}`
            };
        }
        return { year: 2024, month: 1, day: 1, monthValue: '2024-01' };
    }


    function clampUtilityEntryExperimentDateToToday(dateString = '') {
        const todayString = parts.getUtilityEntryExperimentTodayDateString();
        const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dateString || '').trim())
            ? String(dateString).trim()
            : UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE;
        return normalizedDate > todayString ? todayString : normalizedDate;
    }

    function getUtilityEntryExperimentYearOptions() {
        const startYear = Number(UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH.slice(0, 4)) || 2024;
        const currentYear = getUtilityEntryExperimentMonthParts(parts.getUtilityEntryExperimentTodayDateString()).year;
        const endYear = Math.max(startYear, currentYear);
        return Array.from({ length: endYear - startYear + 1 }, (_, index) => String(startYear + index));
    }

    function getUtilityEntryExperimentMonthOptionsForYear(yearValue) {
        const selectedYear = Number(yearValue) || getUtilityEntryExperimentMonthParts(UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE).year;
        const todayParts = getUtilityEntryExperimentMonthParts(parts.getUtilityEntryExperimentTodayDateString());
        return UTILITY_ENTRY_EXPERIMENT_MONTH_OPTIONS.map(item => ({
            ...item,
            disabled: selectedYear > todayParts.year || (selectedYear === todayParts.year && Number(item.value) > todayParts.month)
        }));
    }

    function getUtilityEntryExperimentDailyDateInput(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily input[data-role="utility-entry-experiment-daily-date"]') || null;
    }

    function getUtilityEntryExperimentDailyYearSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily select[data-role="utility-entry-experiment-daily-year"]') || null;
    }

    function getUtilityEntryExperimentDailyMonthSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-daily select[data-role="utility-entry-experiment-daily-month"]') || null;
    }

    function getUtilityEntryExperimentMonthlyYearSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-year"]') || null;
    }

    function getUtilityEntryExperimentMonthlyMonthSelect(host) {
        return host?.querySelector?.('.utility-entry-experiment-view.is-monthly select[data-role="utility-entry-experiment-monthly-month"]') || null;
    }

    function updateUtilityEntryExperimentMonthSelectOptions(yearSelect, monthSelect) {
        if (!yearSelect || !monthSelect) return;

        const enabledOptions = getUtilityEntryExperimentMonthOptionsForYear(yearSelect.value);
        enabledOptions.forEach(item => {
            const option = Array.from(monthSelect.options).find(candidate => candidate.value === item.value);
            if (option) option.disabled = item.disabled;
        });
        if (monthSelect.selectedOptions[0]?.disabled) {
            const fallback = [...monthSelect.options].filter(option => !option.disabled).pop();
            if (fallback) monthSelect.value = fallback.value;
        }
    }

    function updateUtilityEntryExperimentDailyMonthOptions(host) {
        updateUtilityEntryExperimentMonthSelectOptions(
            getUtilityEntryExperimentDailyYearSelect(host),
            getUtilityEntryExperimentDailyMonthSelect(host)
        );
    }

    function updateUtilityEntryExperimentMonthlyMonthOptions(host) {
        updateUtilityEntryExperimentMonthSelectOptions(
            getUtilityEntryExperimentMonthlyYearSelect(host),
            getUtilityEntryExperimentMonthlyMonthSelect(host)
        );
    }

    function setUtilityEntryExperimentDailyMonthValue(host, monthValue) {
        const monthParts = getUtilityEntryExperimentMonthParts(`${monthValue}-01`);
        const yearSelect = getUtilityEntryExperimentDailyYearSelect(host);
        const monthSelect = getUtilityEntryExperimentDailyMonthSelect(host);
        if (!yearSelect || !monthSelect) return;

        yearSelect.value = String(monthParts.year);
        updateUtilityEntryExperimentDailyMonthOptions(host);
        monthSelect.value = String(monthParts.month).padStart(2, '0');
    }

    function setUtilityEntryExperimentMonthlyValue(host, monthValue) {
        const monthParts = getUtilityEntryExperimentMonthParts(`${monthValue}-01`);
        const yearSelect = getUtilityEntryExperimentMonthlyYearSelect(host);
        const monthSelect = getUtilityEntryExperimentMonthlyMonthSelect(host);
        if (!yearSelect || !monthSelect) return;

        yearSelect.value = String(monthParts.year);
        updateUtilityEntryExperimentMonthlyMonthOptions(host);
        monthSelect.value = String(monthParts.month).padStart(2, '0');
    }

    function clampUtilityEntryExperimentMonthValue(monthValue = '') {
        const normalizedMonth = String(monthValue || '').trim();
        if (!/^\d{4}-\d{2}$/.test(normalizedMonth)) return UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;

        const todayMonth = parts.getUtilityEntryExperimentTodayDateString().slice(0, 7);
        if (normalizedMonth < UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH) return UTILITY_ENTRY_EXPERIMENT_DEFAULT_MONTH;
        if (normalizedMonth > todayMonth) return todayMonth;
        return normalizedMonth;
    }

    function getUtilityEntryExperimentSelectedMonthForPeriod(host, period = 'daily') {
        if (period === 'monthly') return parts.getUtilityEntryExperimentSelectedMonth(host);

        updateUtilityEntryExperimentDailyMonthOptions(host);
        const year = getUtilityEntryExperimentDailyYearSelect(host)?.value || '2024';
        const month = getUtilityEntryExperimentDailyMonthSelect(host)?.value || '01';
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    function updateUtilityEntryExperimentMonthShiftButtons(host) {
        const buttons = Array.from(host?.querySelectorAll?.('[data-role="utility-entry-experiment-month-shift"]') || []);
        buttons.forEach(button => {
            const period = button.dataset.utilityEntryExperimentPeriod === 'monthly' ? 'monthly' : 'daily';
            const direction = Number(button.dataset.utilityEntryExperimentShift) < 0 ? -1 : 1;
            const currentMonth = clampUtilityEntryExperimentMonthValue(getUtilityEntryExperimentSelectedMonthForPeriod(host, period));
            const shiftedMonth = clampUtilityEntryExperimentMonthValue(parts.shiftUtilityEntryExperimentMonthValue(currentMonth, direction));
            button.disabled = shiftedMonth === currentMonth;
        });
    }

    function shiftUtilityEntryExperimentSelectedMonth(host, period = 'daily', direction = 1) {
        const normalizedPeriod = period === 'monthly' ? 'monthly' : 'daily';
        const normalizedDirection = Number(direction) < 0 ? -1 : 1;
        const currentMonth = clampUtilityEntryExperimentMonthValue(
            getUtilityEntryExperimentSelectedMonthForPeriod(host, normalizedPeriod)
        );
        const nextMonth = clampUtilityEntryExperimentMonthValue(
            parts.shiftUtilityEntryExperimentMonthValue(currentMonth, normalizedDirection)
        );
        if (nextMonth === currentMonth) return false;

        if (normalizedPeriod === 'monthly') {
            setUtilityEntryExperimentMonthlyValue(host, nextMonth);
        }
        syncUtilityEntryExperimentMonthlyToDailyDate(host, `${nextMonth}-01`);
        return true;
    }

    function syncUtilityEntryExperimentMonthlyToDailyDate(host, dateString = '') {
        const dateInput = getUtilityEntryExperimentDailyDateInput(host);
        const nextDate = clampUtilityEntryExperimentDateToToday(dateString || dateInput?.value || UTILITY_ENTRY_EXPERIMENT_DEFAULT_DAILY_DATE);
        if (dateInput) {
            dateInput.max = parts.getUtilityEntryExperimentTodayDateString();
            dateInput.value = nextDate;
        }
        setUtilityEntryExperimentDailyMonthValue(host, nextDate.slice(0, 7));
        setUtilityEntryExperimentMonthlyValue(host, nextDate.slice(0, 7));
        updateUtilityEntryExperimentMonthShiftButtons(host);
        return nextDate;
    }

    function syncUtilityEntryExperimentDailyMonthToDate(host) {
        updateUtilityEntryExperimentDailyMonthOptions(host);
        const year = getUtilityEntryExperimentDailyYearSelect(host)?.value || '2024';
        const month = getUtilityEntryExperimentDailyMonthSelect(host)?.value || '01';
        return syncUtilityEntryExperimentMonthlyToDailyDate(host, `${year}-${String(month).padStart(2, '0')}-01`);
    }

    function syncUtilityEntryExperimentDailyToMonthly(host) {
        updateUtilityEntryExperimentMonthlyMonthOptions(host);
        const monthValue = parts.getUtilityEntryExperimentSelectedMonth(host);
        return syncUtilityEntryExperimentMonthlyToDailyDate(host, `${monthValue}-01`);
    }

    function formatUtilityEntryExperimentDateChipLabel(dateString) {
        const [, month = '', day = ''] = String(dateString || '').match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
        if (!month || !day) return dateString;
        return `${Number(month)}/${Number(day)}`;
    }

    function renderUtilityEntryExperimentCompletedDateCalendar(host, records, selectedDate) {
        const containers = Array.from(host.querySelectorAll('[data-role="utility-entry-experiment-completed-calendar"]'));
        if (!containers.length) return;

        const normalizedSelectedDate = clampUtilityEntryExperimentDateToToday(selectedDate);
        const selectedParts = getUtilityEntryExperimentMonthParts(normalizedSelectedDate);
        const todayString = parts.getUtilityEntryExperimentTodayDateString();
        const todayParts = getUtilityEntryExperimentMonthParts(todayString);
        const dailyStatuses = getUtilityEntryExperimentDailyEntryStatuses(records);
        const dailyStatusMap = new Map(dailyStatuses.map(dateInfo => [dateInfo.dateString, dateInfo]));
        const firstDay = new Date(selectedParts.year, selectedParts.month - 1, 1);
        const daysInMonth = new Date(selectedParts.year, selectedParts.month, 0).getDate();
        const maxVisibleDay = selectedParts.monthValue > todayParts.monthValue
            ? 0
            : selectedParts.monthValue === todayParts.monthValue
                ? Math.min(daysInMonth, todayParts.day)
                : daysInMonth;
        const leadingBlanks = firstDay.getDay();
        const cells = [];
        let doneCount = 0;
        let partialCount = 0;
        let missingCount = 0;

        for (let index = 0; index < leadingBlanks; index += 1) {
            cells.push('<span class="utility-entry-experiment-completed-day is-blank" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= maxVisibleDay; day += 1) {
            const dateString = `${selectedParts.monthValue}-${String(day).padStart(2, '0')}`;
            const dateInfo = dailyStatusMap.get(dateString) || getUtilityEntryExperimentDailyEntryStatus(records, dateString);
            const isDone = dateInfo.state === 'done';
            const isPartial = dateInfo.state === 'partial';
            const isSelected = dateString === normalizedSelectedDate;
            const hasErrors = dateInfo.hasErrors === true || Number(dateInfo.errorCount || 0) > 0;
            if (isDone) {
                doneCount += 1;
            } else if (isPartial) {
                partialCount += 1;
            } else {
                missingCount += 1;
            }
            const stateClass = isDone ? 'is-done' : isPartial ? 'is-partial' : 'is-missing';
            const titleText = isDone || isPartial
                ? `${dateString} ${dateInfo.resources.join(' / ')}`
                : `${dateString} 미기입`;
            const errorTitleText = hasErrors ? `${titleText} / 오류 ${Number(dateInfo.errorCount || 1)}건` : titleText;
            cells.push(`
                <button
                    type="button"
                    class="utility-entry-experiment-completed-day ${stateClass}${hasErrors ? ' has-error' : ''}${isSelected ? ' is-selected' : ''}"
                    data-utility-entry-experiment-date="${parts.escapeUtilityEntryExperimentHtml(dateString)}"
                    aria-pressed="${isSelected ? 'true' : 'false'}"
                    title="${parts.escapeUtilityEntryExperimentHtml(errorTitleText)}"
                >
                    <span>${parts.escapeUtilityEntryExperimentHtml(String(day))}</span>
                </button>
            `);
        }

        const monthLabel = `${selectedParts.year}.${String(selectedParts.month).padStart(2, '0')}`;
        const bodyHtml = maxVisibleDay > 0 ? `
            <div class="utility-entry-experiment-completed-weekdays" aria-hidden="true">
                <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
            </div>
            <div class="utility-entry-experiment-completed-grid" role="listbox" aria-label="${parts.escapeUtilityEntryExperimentHtml(`${monthLabel} 일간 기입 상태`)}">
                ${cells.join('')}
            </div>
        ` : `
            <div class="utility-entry-experiment-completed-empty">오늘 이후 날짜 없음</div>
        `;

        containers.forEach(container => {
            container.innerHTML = `
                <div class="utility-entry-experiment-completed-head">
                    <span>일간 기입 상태</span>
                    <strong>${parts.escapeUtilityEntryExperimentHtml(monthLabel)} · 저장 ${doneCount} / 부분 ${partialCount} / 미기입 ${missingCount}</strong>
                </div>
                ${bodyHtml}
            `;
        });
    }


    Object.assign(parts, { isUtilityEntryExperimentCompletedEntry, hasUtilityEntryExperimentFilledValue, getUtilityEntryExperimentCompletionFieldLabel, isUtilityEntryExperimentCompletionFieldVisible, getUtilityEntryExperimentCompletionRequiredIds, getUtilityEntryExperimentResourceDailyEntryStatus, getUtilityEntryExperimentResourceDailyEntryValidationIssues, formatUtilityEntryExperimentResourceStatusLabel, getUtilityEntryExperimentDailyEntryStatus, getUtilityEntryExperimentFirstRecordedDateInMonth, resolveUtilityEntryExperimentResourceDailyDate, getUtilityEntryExperimentDailyEntryStatuses, getUtilityEntryExperimentMonthParts, clampUtilityEntryExperimentDateToToday, getUtilityEntryExperimentYearOptions, getUtilityEntryExperimentMonthOptionsForYear, getUtilityEntryExperimentDailyDateInput, getUtilityEntryExperimentDailyYearSelect, getUtilityEntryExperimentDailyMonthSelect, getUtilityEntryExperimentMonthlyYearSelect, getUtilityEntryExperimentMonthlyMonthSelect, updateUtilityEntryExperimentMonthSelectOptions, updateUtilityEntryExperimentDailyMonthOptions, updateUtilityEntryExperimentMonthlyMonthOptions, setUtilityEntryExperimentDailyMonthValue, setUtilityEntryExperimentMonthlyValue, clampUtilityEntryExperimentMonthValue, getUtilityEntryExperimentSelectedMonthForPeriod, updateUtilityEntryExperimentMonthShiftButtons, shiftUtilityEntryExperimentSelectedMonth, syncUtilityEntryExperimentMonthlyToDailyDate, syncUtilityEntryExperimentDailyMonthToDate, syncUtilityEntryExperimentDailyToMonthly, formatUtilityEntryExperimentDateChipLabel, renderUtilityEntryExperimentCompletedDateCalendar });
})(this);
