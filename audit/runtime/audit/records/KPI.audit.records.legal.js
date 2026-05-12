        function getAuditLegalCategoryPreset(itemType = 'boiler') {
            const normalized = normalizeAuditLegalItemType(itemType);
            return {
                itemType: normalized,
                ...(AUDIT_LEGAL_CATEGORY_PRESETS[normalized] || AUDIT_LEGAL_CATEGORY_PRESETS.boiler)
            };
        }
        function renderAuditLegalCategoryOptions(selectedType) {
            return AUDIT_LEGAL_CATEGORY_OPTIONS.map((item) => `
                <option value="${escapeHtml(item.value)}"${item.value === selectedType ? ' selected' : ''}>${escapeHtml(item.label)}</option>
            `).join('');
        }
        function renderAuditLegalEquipmentCards(cards, selectedType = 'boiler') {
            if (!cards.length) {
                return '<div class="audit-legal-empty">표시할 설비 카드가 없습니다.</div>';
            }
            return cards.map((item) => {
                const isActive = normalizeAuditLegalItemType(item.itemType) === normalizeAuditLegalItemType(selectedType);
                const metricsHtml = item.metrics.map((metric) => `
                    <div class="audit-legal-metric-row"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value || '-')}</strong></div>
                `).join('');
                const statusesHtml = item.statuses.map((status) => `
                    <span class="audit-legal-status-token ${escapeHtml(status.key)}"><i></i>${escapeHtml(status.label)} ${escapeHtml(status.count)}</span>
                `).join('');
                return `
                    <article class="audit-legal-equipment-card ${isActive ? 'is-active' : ''}" data-audit-legal-category="${escapeHtml(item.itemType)}" role="button" tabindex="0" aria-pressed="${isActive ? 'true' : 'false'}">
                        <div class="audit-legal-equipment-top">
                            <span class="audit-legal-equipment-icon ${escapeHtml(item.itemType)}"><i class="${getAuditLegalIconClass(item.icon)}"></i></span>
                            <strong class="audit-legal-equipment-title">${escapeHtml(item.title)}</strong>
                        </div>
                        <div class="audit-legal-metric-list">${metricsHtml}</div>
                        <div class="audit-legal-status-line">${statusesHtml}</div>
                    </article>
                `;
            }).join('');
        }
        function renderAuditLegalInspectionChips(labels) {
            const normalizedLabels = normalizeAuditLegalInspectionLabels(labels, getAuditLegalSelectedItemType());
            return normalizedLabels.map((label) => `
                <span class="audit-legal-inspection-chip" data-audit-legal-inspection-item>${escapeHtml(label)}</span>
            `).join('');
        }
        function renderAuditLegalInspectionTypeOptions(itemType, selectedType = '') {
            const options = getAuditLegalDefaultInspectionItems(itemType);
            const selected = String(selectedType || options[0] || '정기검사').trim();
            const normalizedOptions = options.includes(selected) ? options : [selected, ...options];
            return normalizedOptions.map((item) => `
                <option value="${escapeHtml(item)}"${item === selected ? ' selected' : ''}>${escapeHtml(item)}</option>
            `).join('');
        }
        function isAuditLegalAppointmentType(value) {
            return String(value || '').trim() === '선임';
        }
        function getAuditLegalInspectionDateLabels(value) {
            if (isAuditLegalAppointmentType(value)) {
                return {
                    lastDate: '선임일',
                    nextDate: '다음 교육일',
                    cycle: '교육 주기',
                    file: '선임/교육 증빙'
                };
            }
            return {
                lastDate: '최근 검사일',
                nextDate: '다음 검사일',
                cycle: '검사 주기',
                file: '검사 증빙'
            };
        }
        function getAuditLegalInspectionDisplayRows(item, itemType) {
            const rows = Array.isArray(item?.inspections) ? item.inspections.slice() : [];
            const knownTypes = new Set(rows.map((inspection) => String(inspection?.type || '').trim()).filter(Boolean));
            const templateLabels = normalizeAuditLegalInspectionLabels(item?.inspectionItems, itemType, item?.statutoryItem);
            templateLabels.forEach((label) => {
                if (!label || knownTypes.has(label)) return;
                rows.push({
                    id: `${String(item?.id || 'legal-facility').trim()}-template-${label}`,
                    type: label,
                    lastDate: '',
                    nextDate: '',
                    cycle: '',
                    daysLeft: null,
                    status: getAuditLegalStatus(null),
                    isTemplate: true
                });
                knownTypes.add(label);
            });
            return rows;
        }
        function renderAuditLegalInspectionRows(item, itemType) {
            const rows = getAuditLegalInspectionDisplayRows(item, itemType);
            if (!rows.length) {
                return '<div class="audit-legal-empty compact">검사 일정 미등록</div>';
            }
            return rows.map((inspection) => `
                <div class="audit-legal-inspection-row ${inspection.isTemplate ? 'is-template' : ''}">
                    <span class="audit-legal-inspection-name">${escapeHtml(inspection.type || '검사')}</span>
                    <span class="audit-legal-inspection-date">${escapeHtml(isAuditLegalAppointmentType(inspection.type) ? '선임일' : '최근')} ${escapeHtml(inspection.lastDate ? formatAuditLegalDate(inspection.lastDate) : '-')}</span>
                    <span class="audit-legal-inspection-date">${escapeHtml(isAuditLegalAppointmentType(inspection.type) ? '다음 교육일' : '다음')} ${escapeHtml(inspection.nextDate ? formatAuditLegalDate(inspection.nextDate) : '-')}</span>
                    <span class="audit-legal-inspection-status">
                        ${inspection.cycle ? `<span class="audit-legal-inspection-cycle">주기 ${escapeHtml(formatAuditLegalCycleLabel(inspection.cycle))}</span>` : ''}
                        ${renderAuditLegalInspectionFileLink(inspection)}
                        ${renderAuditLegalInspectionDaysBadge(inspection)}
                        ${inspection.isTemplate ? `
                            <button type="button" class="audit-legal-inspection-fill" data-audit-legal-open-inspection="${escapeHtml(item.id)}" data-audit-legal-inspection-type="${escapeHtml(inspection.type || '')}">날짜 입력</button>
                        ` : ''}
                    </span>
                </div>
            `).join('');
        }
        function renderAuditLegalInspectionFacilityOptions(records, selectedFacilityId = '') {
            return records.map((item) => `
                <option value="${escapeHtml(item.id)}"${item.id === selectedFacilityId ? ' selected' : ''}>${escapeHtml(item.facility || '-')}</option>
            `).join('');
        }
        function renderAuditLegalCycleOptions(selectedCycle = '') {
            const selected = String(selectedCycle || '').trim();
            const normalizedOptions = AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS.some((item) => item.value === selected)
                ? AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS
                : [
                    ...AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS,
                    { value: selected, label: selected, months: getAuditLegalCycleMonths(selected) }
                ].filter((item) => item.value || item.label);
            return normalizedOptions.map((item) => `
                <option value="${escapeHtml(item.value)}"${item.value === selected ? ' selected' : ''}>${escapeHtml(item.label)}</option>
            `).join('');
        }
        function renderAuditLegalInspectionForm(item, itemType, records = []) {
            const isCategoryForm = !item;
            if (isCategoryForm && auditLegalUiState.inspectionFormFacilityId !== AUDIT_LEGAL_CATEGORY_INSPECTION_FORM_ID) return '';
            if (!isCategoryForm && auditLegalUiState.inspectionFormFacilityId !== item.id) return '';
            const selectedFacilityId = item?.id || records[0]?.id || '';
            const selectedType = auditLegalUiState.inspectionFormType || getAuditLegalDefaultInspectionItems(itemType)[0] || '정기검사';
            const labels = getAuditLegalInspectionDateLabels(selectedType);
            const facilityField = isCategoryForm ? `
                <label class="audit-legal-entry-field">
                    <span>설비</span>
                    <select data-audit-legal-inspection-input="facilityId" required>
                        ${renderAuditLegalInspectionFacilityOptions(records, selectedFacilityId)}
                    </select>
                </label>
            ` : '';
            return `
                <form class="audit-legal-inspection-form ${isCategoryForm ? 'has-facility' : ''}" data-audit-legal-inspection-form data-audit-legal-facility-id="${escapeHtml(selectedFacilityId)}">
                    ${facilityField}
                    <label class="audit-legal-entry-field">
                        <span>항목</span>
                        <select data-audit-legal-inspection-input="type">
                            ${renderAuditLegalInspectionTypeOptions(itemType, selectedType)}
                        </select>
                    </label>
                    <label class="audit-legal-entry-field">
                        <span data-audit-legal-inspection-label="lastDate">${escapeHtml(labels.lastDate)}</span>
                        <input type="date" data-audit-legal-inspection-input="lastDate">
                    </label>
                    <label class="audit-legal-entry-field">
                        <span data-audit-legal-inspection-label="cycle">${escapeHtml(labels.cycle)}</span>
                        <select data-audit-legal-inspection-input="cycle">
                            ${renderAuditLegalCycleOptions('')}
                        </select>
                    </label>
                    <label class="audit-legal-entry-field">
                        <span data-audit-legal-inspection-label="nextDate">${escapeHtml(labels.nextDate)}</span>
                        <input type="date" data-audit-legal-inspection-input="nextDate" required>
                    </label>
                    <label class="audit-legal-entry-field audit-legal-inspection-file-field">
                        <span data-audit-legal-inspection-label="file">${escapeHtml(labels.file)}</span>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.hwp,.hwpx" data-audit-legal-file="attachment">
                    </label>
                    <div class="audit-legal-inspection-actions">
                        <button type="submit" class="audit-legal-entry-primary">검사/선임 추가</button>
                        <button type="button" data-audit-legal-cancel-inspection>취소</button>
                    </div>
                </form>
            `;
        }
        function renderAuditLegalCategoryPanel(categoryOption, records) {
            const label = categoryOption?.label || '보일러';
            const type = normalizeAuditLegalItemType(categoryOption?.value || 'boiler');
            const rowsHtml = records.length ? records.map((item) => `
                <article class="audit-legal-facility-row">
                    <div class="audit-legal-facility-head">
                        <div class="audit-legal-facility-main">
                            <strong>${escapeHtml(item.facility || '-')}</strong>
                            <span>${escapeHtml([item.manager || item.responsible, item.plant].filter(Boolean).join(' / ') || '-')}</span>
                        </div>
                        <div class="audit-legal-facility-actions">
                            <button type="button" class="audit-legal-inspection-add" data-audit-legal-open-inspection="${escapeHtml(item.id)}">
                                <i class="fas fa-plus"></i>
                                검사/선임 추가
                            </button>
                            <button type="button" class="audit-legal-facility-delete" data-audit-legal-delete-facility="${escapeHtml(item.id)}">
                                <i class="fas fa-trash-can"></i>
                                삭제
                            </button>
                        </div>
                    </div>
                    <div class="audit-legal-inspection-list-head">남은 관리 일정</div>
                    <div class="audit-legal-inspection-list">
                        ${renderAuditLegalInspectionRows(item, type)}
                    </div>
                    ${renderAuditLegalInspectionForm(item, type, records)}
                </article>
            `).join('') : `
                <div class="audit-legal-empty">${escapeHtml(label)}에 등록된 설비가 없습니다. 설비 추가로 기본 틀을 먼저 만드세요.</div>
            `;
            return `
                <div class="audit-ref-card audit-legal-category-panel" data-audit-legal-selected-category="${escapeHtml(type)}">
                    <div class="audit-legal-category-head">
                        <div>
                            <div class="audit-ref-title">${escapeHtml(label)} 설비관리</div>
                            <div class="audit-ref-meta-sub">등록 ${records.length}건 / 기본 검사항목 ${getAuditLegalDefaultInspectionItems(type).length}개</div>
                        </div>
                        <button type="button" class="audit-legal-inspection-add audit-legal-inspection-add-primary" data-audit-legal-open-category-inspection="${escapeHtml(type)}">
                            <i class="fas fa-plus"></i>
                            검사/선임 추가
                        </button>
                    </div>
                    ${renderAuditLegalInspectionForm(null, type, records)}
                    <div class="audit-legal-inspection-template" aria-label="${escapeHtml(label)} 기본 검사항목">
                        ${renderAuditLegalInspectionChips(getAuditLegalDefaultInspectionItems(type))}
                    </div>
                    <div class="audit-legal-facility-list">${rowsHtml}</div>
                </div>
            `;
        }
        function renderAuditLegalAlerts(alerts) {
            if (!alerts.length) {
                return '<div class="audit-legal-empty">표시할 알림이 없습니다.</div>';
            }
            return alerts.map((item) => `
                <article class="audit-legal-alert-card ${escapeHtml(item.severity)}">
                    <span class="audit-legal-alert-icon"><i class="${getAuditLegalIconClass(item.icon)}"></i></span>
                    <span class="audit-legal-alert-copy">
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.count || '0')}${escapeHtml(item.unit || '건')}</span>
                    </span>
                </article>
            `).join('');
        }
        function renderAuditLegalCalendarYearOptions(calendar, events) {
            const eventYears = (Array.isArray(events) ? events : [])
                .map((item) => parseAuditLegalDate(item.date)?.getFullYear())
                .filter((year) => Number.isFinite(year));
            const currentYear = new Date().getFullYear();
            const yearSeeds = [calendar.year, currentYear, ...eventYears].filter((year) => Number.isFinite(year));
            const minYear = Math.max(2000, Math.min(...yearSeeds) - 2);
            const maxYear = Math.min(2099, Math.max(...yearSeeds) + 2);
            const options = [];
            for (let year = minYear; year <= maxYear; year += 1) {
                options.push(`<option value="${year}"${year === calendar.year ? ' selected' : ''}>${year}년</option>`);
            }
            return options.join('');
        }
        function renderAuditLegalCalendarMonthOptions(monthIndex) {
            return Array.from({ length: 12 }, (_, index) => `
                <option value="${index + 1}"${index === monthIndex ? ' selected' : ''}>${index + 1}월</option>
            `).join('');
        }
        function renderAuditLegalCalendar(data, events) {
            const calendar = getAuditLegalCalendarConfig(data, events);
            const currentMonth = calendar.monthIndex + 1;
            const firstDay = new Date(calendar.year, calendar.monthIndex, 1).getDay();
            const daysInMonth = new Date(calendar.year, calendar.monthIndex + 1, 0).getDate();
            const daysInPrevMonth = new Date(calendar.year, calendar.monthIndex, 0).getDate();
            const eventMap = events.reduce((acc, item) => {
                acc[item.date] = acc[item.date] || [];
                acc[item.date].push(item);
                return acc;
            }, {});
            const pad = (value) => String(value).padStart(2, '0');
            const makeDateKey = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
            const cells = [];
            for (let i = firstDay; i > 0; i -= 1) {
                const day = daysInPrevMonth - i + 1;
                const date = new Date(calendar.year, calendar.monthIndex - 1, day);
                cells.push({ day, muted: true, key: makeDateKey(date.getFullYear(), date.getMonth(), day) });
            }
            for (let day = 1; day <= daysInMonth; day += 1) cells.push({ day, muted: false, key: makeDateKey(calendar.year, calendar.monthIndex, day) });
            const targetLength = cells.length <= 35 ? 35 : 42;
            while (cells.length < targetLength) {
                const day = cells.length - firstDay - daysInMonth + 1;
                const date = new Date(calendar.year, calendar.monthIndex + 1, day);
                cells.push({ day, muted: true, key: makeDateKey(date.getFullYear(), date.getMonth(), day) });
            }
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const headerHtml = weekdays.map((day) => `<div class="audit-legal-weekday">${day}</div>`).join('');
            const cellHtml = cells.map((cell, index) => {
                const dayEvents = eventMap[cell.key] || [];
                const pills = dayEvents.slice(0, 2).map((event) => `
                    <span class="audit-legal-event-pill ${escapeHtml(event.type)}" title="${escapeHtml(event.title)}">${escapeHtml(event.title)}</span>
                `).join('');
                return `
                    <div class="audit-legal-calendar-cell ${cell.muted ? 'muted' : ''} ${index % 7 === 0 ? 'sunday' : ''}">
                        <span class="audit-legal-cell-day">${escapeHtml(String(cell.day))}</span>
                        ${pills}
                    </div>
                `;
            }).join('');
            return `
                <div class="audit-legal-calendar-head">
                    <span>점검 일정</span>
                    <div class="audit-legal-calendar-nav" aria-label="${escapeHtml(calendar.label)} 달력 이동">
                        <button type="button" class="audit-legal-calendar-arrow" data-audit-legal-calendar-shift="-1" data-audit-legal-calendar-year-value="${escapeHtml(String(calendar.year))}" data-audit-legal-calendar-month-value="${escapeHtml(String(currentMonth))}" aria-label="이전 달">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="audit-legal-calendar-picker">
                            <select data-audit-legal-calendar-year aria-label="점검 일정 연도">
                                ${renderAuditLegalCalendarYearOptions(calendar, events)}
                            </select>
                            <select data-audit-legal-calendar-month aria-label="점검 일정 월">
                                ${renderAuditLegalCalendarMonthOptions(calendar.monthIndex)}
                            </select>
                        </div>
                        <button type="button" class="audit-legal-calendar-arrow" data-audit-legal-calendar-shift="1" data-audit-legal-calendar-year-value="${escapeHtml(String(calendar.year))}" data-audit-legal-calendar-month-value="${escapeHtml(String(currentMonth))}" aria-label="다음 달">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="audit-legal-legend">
                    <span><i class="inspection"></i>점검</span>
                    <span><i class="deadline"></i>마감</span>
                    <span><i class="document"></i>문서</span>
                </div>
                <div class="audit-legal-calendar-grid-wrap" data-audit-legal-calendar-label="${escapeHtml(calendar.label)}">
                    <div class="audit-legal-calendar-month-watermark" aria-hidden="true">${escapeHtml(calendar.label)}</div>
                    <div class="audit-legal-calendar-grid">${headerHtml}${cellHtml}</div>
                </div>
            `;
        }
        function renderAuditLegalCalendarCard(data, events) {
            const isExpanded = auditLegalUiState.calendarExpanded !== false;
            const toggleLabel = isExpanded ? '닫기' : '열기';
            return `
                <div class="audit-ref-card audit-legal-schedule-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}">
                    <div class="audit-legal-schedule-head">
                        <div class="audit-ref-title">점검 일정</div>
                        <button type="button" class="audit-legal-calendar-toggle" data-audit-legal-calendar-toggle aria-expanded="${isExpanded ? 'true' : 'false'}">
                            <i class="fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                            <span>${escapeHtml(toggleLabel)}</span>
                        </button>
                    </div>
                    ${isExpanded ? `<div class="audit-legal-calendar-panel">${renderAuditLegalCalendar(data, events)}</div>` : ''}
                </div>
            `;
        }
        function renderAuditLegalFacilityPreview(category, data) {
            const now = new Date();
            const records = normalizeAuditLegalFacilities(data)
                .map((item) => {
                    const inspections = item.inspections.map((inspection) => enrichAuditLegalInspectionStatus(inspection, now));
                    const nextInspection = getAuditLegalFacilitySchedule(inspections);
                    const daysLeft = nextInspection?.daysLeft ?? null;
                    const status = nextInspection?.status || getAuditLegalStatus(null);
                    return {
                        ...item,
                        inspections,
                        statutoryItem: nextInspection?.type || item.statutoryItem,
                        lastDate: nextInspection?.lastDate || item.lastDate,
                        nextDate: nextInspection?.nextDate || item.nextDate,
                        daysLeft,
                        status
                    };
                })
                .sort((a, b) => {
                    const aDays = a.daysLeft === null || a.daysLeft === undefined ? Number.POSITIVE_INFINITY : a.daysLeft;
                    const bDays = b.daysLeft === null || b.daysLeft === undefined ? Number.POSITIVE_INFINITY : b.daysLeft;
                    if (aDays !== bDays) return aDays - bDays;
                    return (a.facility || '').localeCompare(b.facility || '', 'ko');
                });
            const selectedType = getAuditLegalSelectedItemType();
            const selectedCategory = getAuditLegalCategoryOption(selectedType);
            const selectedCategoryRecords = records.filter((item) => normalizeAuditLegalItemType(item.itemType) === selectedType);
            const overdueCount = records.filter((item) => item.status.key === 'overdue').length;
            const nearCount = records.filter((item) => item.status.key === 'near').length;
            const safeCount = records.filter((item) => item.status.key === 'safe').length;
            const alarmSafe = overdueCount === 0 && nearCount === 0;
            const equipmentCards = normalizeAuditLegalEquipment(data, records);
            const events = normalizeAuditLegalEvents(data, records);
            const contentContainer = document.getElementById('content-container');
            contentContainer.innerHTML = `
                <div class="border-b pb-4 mb-6">
                    <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-2 h-8 rounded-sm inline-block" style="background:${category.color || '#e11d48'};"></span>
                        ${escapeHtml(category.title || '법정 설비')}
                    </h2>
                    <p class="text-slate-500 mt-1 pl-4 text-sm">${escapeHtml(category.desc || '')}</p>
                </div>
                <div class="audit-panel audit-legal-wrap">
                    <div class="audit-section">
                        <div class="audit-section-header">
                            <div class="audit-section-title">
                                <span class="audit-section-icon"><i class="fas fa-scale-balanced"></i></span>
                                <span>법정 설비 점검</span>
                            </div>
                            <span class="audit-badge">총 ${records.length}건</span>
                        </div>
                        <div class="audit-section-body">
                            <div class="audit-legal-meta">
                                <span class="audit-legal-alarm ${alarmSafe ? 'is-safe' : ''}">
                                    <i class="fas ${alarmSafe ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
                                    ${alarmSafe ? '기한 임박 없음' : `확인 필요 ${overdueCount + nearCount}건`}
                                </span>
                                <div class="audit-legal-summary">
                                    <span class="audit-legal-chip warn">기한 초과 ${overdueCount}</span>
                                    <span class="audit-legal-chip warn">45일 이내 ${nearCount}</span>
                                    <span class="audit-legal-chip safe">정상 ${safeCount}</span>
                                </div>
                            </div>
                            <div class="audit-legal-dashboard">
                                <div class="audit-legal-main">
                                    ${renderAuditLegalCalendarCard(data, events)}
                                    <div class="audit-legal-equipment-grid">
                                        ${renderAuditLegalEquipmentCards(equipmentCards, selectedType)}
                                    </div>
                                    ${renderAuditLegalCategoryPanel(selectedCategory, selectedCategoryRecords)}
                                    ${renderAuditLegalEntryForm(selectedType)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            bindAuditLegalEntryEvents(category, data, contentContainer);
        }
