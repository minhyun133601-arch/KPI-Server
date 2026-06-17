const workTeamCalendarEquipmentBrowser = typeof KpiWorkBrowserAdapter !== 'undefined'
    ? KpiWorkBrowserAdapter
    : null;

const WORK_TEAM_CALENDAR_EQUIPMENT_DATA_KEY = 'data_equipment_history_card';
const WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS = Object.freeze([
    'work_team_calendar_team1_part1',
    'work_team_calendar_team1_part2',
    'work_team_calendar_team2',
    'work_team_calendar_team3',
    'work_team_calendar_team4',
]);
const WORK_TEAM_CALENDAR_EQUIPMENT_TEAM_LABELS = Object.freeze({
    work_team_calendar_team1_part1: '1팀 1파트',
    work_team_calendar_team1_part2: '1팀 2파트',
    work_team_calendar_team2: '2팀',
    work_team_calendar_team3: '3팀',
    work_team_calendar_team4: '공무환경팀',
});

function normalizeWorkTeamCalendarEquipmentText(value) {
    return String(value ?? '').trim();
}

function canonicalizeWorkTeamCalendarEquipmentTeam(value) {
    return normalizeWorkTeamCalendarEquipmentText(value).replace(/\s+/g, '');
}

function escapeWorkTeamCalendarEquipmentHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function asWorkTeamCalendarEquipmentList(value) {
    return Array.isArray(value) ? value : [];
}

function resolveWorkTeamCalendarEquipmentDataKey(value) {
    const raw = normalizeWorkTeamCalendarEquipmentText(value);
    if (WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS.includes(raw)) return raw;

    const canonical = canonicalizeWorkTeamCalendarEquipmentTeam(raw);
    if (!canonical) return '';
    if (canonical.includes('유산')) return 'work_team_calendar_team4';
    if (canonical.includes('북정')) return 'work_team_calendar_team1_part1';
    if (canonical.includes('1팀') && canonical.includes('1파트')) return 'work_team_calendar_team1_part1';
    if (canonical.includes('1팀') && canonical.includes('2파트')) return 'work_team_calendar_team1_part2';
    if (canonical.includes('2팀')) return 'work_team_calendar_team2';
    if (canonical.includes('3팀')) return 'work_team_calendar_team3';
    if (canonical.includes('공무환경') || (canonical.includes('공무') && canonical.includes('환경'))) {
        return 'work_team_calendar_team4';
    }
    return '';
}

function normalizeWorkTeamCalendarEquipmentTeamName(value) {
    const dataKey = resolveWorkTeamCalendarEquipmentDataKey(value);
    return WORK_TEAM_CALENDAR_EQUIPMENT_TEAM_LABELS[dataKey] || normalizeWorkTeamCalendarEquipmentText(value);
}

function getWorkTeamCalendarEquipmentTeamLabel(dataKey, fallback = '') {
    const normalized = normalizeWorkTeamCalendarEquipmentText(dataKey);
    return WORK_TEAM_CALENDAR_EQUIPMENT_TEAM_LABELS[normalized] || normalizeWorkTeamCalendarEquipmentText(fallback) || '미분류';
}

function getWorkTeamCalendarEquipmentSourceDataKeys(dataKey) {
    const normalized = normalizeWorkTeamCalendarEquipmentText(dataKey);
    if (!normalized || normalized === 'overview' || normalized === 'work_team_calendar_overview') {
        return WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS.slice();
    }

    const resolvedSources = typeof resolveWorkTeamCalendarSourceDataKeys === 'function'
        ? resolveWorkTeamCalendarSourceDataKeys(normalized)
        : [];
    const sourceList = resolvedSources.length ? resolvedSources : [normalized];
    const keys = sourceList
        .map(resolveWorkTeamCalendarEquipmentDataKey)
        .filter(key => WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS.includes(key));
    return Array.from(new Set(keys));
}

function getWorkTeamCalendarEquipmentInfoValue(items, labels, fallback = '') {
    const labelSet = new Set(asWorkTeamCalendarEquipmentList(labels).map(normalizeWorkTeamCalendarEquipmentText));
    const found = asWorkTeamCalendarEquipmentList(items)
        .find(item => labelSet.has(normalizeWorkTeamCalendarEquipmentText(item?.label)));
    return normalizeWorkTeamCalendarEquipmentText(found?.value || fallback);
}

function readWorkTeamCalendarEquipmentPayload() {
    const payload = workTeamCalendarEquipmentBrowser?.readPortalData?.(WORK_TEAM_CALENDAR_EQUIPMENT_DATA_KEY);
    return payload && typeof payload === 'object' ? payload : {};
}

function parseWorkTeamCalendarEquipmentDate(value) {
    const raw = normalizeWorkTeamCalendarEquipmentText(value);
    if (!raw) return null;

    let match = /^(\d{4})(\d{2})(\d{2})$/.exec(raw.replace(/\s+/g, ''));
    if (!match) {
        match = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(raw);
    }
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    return {
        dateKey,
        monthKey,
        label: `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`,
    };
}

function formatWorkTeamCalendarEquipmentMonthLabel(monthKey) {
    if (typeof formatWorkTeamCalendarMonthOptionLabel === 'function') {
        return formatWorkTeamCalendarMonthOptionLabel(monthKey);
    }
    const match = /^(\d{4})-(\d{2})$/.exec(normalizeWorkTeamCalendarEquipmentText(monthKey));
    return match ? `${match[1]}.${match[2]}` : normalizeWorkTeamCalendarEquipmentText(monthKey);
}

function formatWorkTeamCalendarEquipmentCount(value, suffix = '건') {
    const numeric = Number(value || 0);
    const formatted = typeof formatUtilNumber === 'function'
        ? formatUtilNumber(numeric, 0)
        : String(Math.max(0, Math.round(numeric)));
    return `${formatted}${suffix}`;
}

function getWorkTeamCalendarEquipmentNameDuplicateKey(item) {
    const name = normalizeWorkTeamCalendarEquipmentText(item?.name);
    return name ? name.toLocaleLowerCase('ko-KR') : '';
}

function applyWorkTeamCalendarEquipmentNameSequence(items) {
    const counts = new Map();
    asWorkTeamCalendarEquipmentList(items).forEach(item => {
        const key = getWorkTeamCalendarEquipmentNameDuplicateKey(item);
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const seen = new Map();
    return asWorkTeamCalendarEquipmentList(items).map(item => {
        const key = getWorkTeamCalendarEquipmentNameDuplicateKey(item);
        const duplicateNameCount = key ? counts.get(key) || 0 : 0;
        if (duplicateNameCount <= 1) {
            return {
                ...item,
                displayName: item.name,
                duplicateNameCount,
                nameSequence: 0,
            };
        }

        const nameSequence = (seen.get(key) || 0) + 1;
        seen.set(key, nameSequence);
        return {
            ...item,
            displayName: `${item.name} #${nameSequence}`,
            duplicateNameCount,
            nameSequence,
        };
    });
}

function normalizeWorkTeamCalendarEquipmentItems(payload = readWorkTeamCalendarEquipmentPayload()) {
    const items = asWorkTeamCalendarEquipmentList(payload?.equipmentList)
        .map((item, index) => {
            const detailInfo = asWorkTeamCalendarEquipmentList(item?.detailInfo);
            const operationInfo = asWorkTeamCalendarEquipmentList(item?.operationInfo);
            const rawTeam = normalizeWorkTeamCalendarEquipmentText(
                item?.team
                || item?.department
                || getWorkTeamCalendarEquipmentInfoValue(detailInfo, ['관리팀', '관리부서', '부서'])
            );
            const teamDataKey = resolveWorkTeamCalendarEquipmentDataKey(item?.teamDataKey)
                || resolveWorkTeamCalendarEquipmentDataKey(rawTeam);
            const team = normalizeWorkTeamCalendarEquipmentTeamName(rawTeam || teamDataKey);
            const name = normalizeWorkTeamCalendarEquipmentText(
                item?.name
                || item?.equipmentName
                || getWorkTeamCalendarEquipmentInfoValue(detailInfo, ['설비명'])
            );
            const process = normalizeWorkTeamCalendarEquipmentText(
                item?.process
                || item?.group
                || getWorkTeamCalendarEquipmentInfoValue(detailInfo, ['공정', '설비구분'])
                || getWorkTeamCalendarEquipmentInfoValue(operationInfo, ['공정'])
            );
            const rateValue = item?.rate ?? item?.utilization ?? getWorkTeamCalendarEquipmentInfoValue(operationInfo, ['가동률'], '');
            const numericRate = Number(String(rateValue ?? '').replace(/,/g, '').replace(/%/g, '').trim());
            return {
                id: normalizeWorkTeamCalendarEquipmentText(item?.id || item?.equipmentCode || `equipment-${index + 1}`),
                equipmentCode: normalizeWorkTeamCalendarEquipmentText(item?.equipmentCode || item?.code || item?.id),
                name,
                team,
                teamDataKey,
                teamLabel: getWorkTeamCalendarEquipmentTeamLabel(teamDataKey, team),
                process,
                status: normalizeWorkTeamCalendarEquipmentText(item?.status) || '상태 미입력',
                rateText: Number.isFinite(numericRate) ? `${numericRate}%` : '',
                lastCheck: normalizeWorkTeamCalendarEquipmentText(item?.lastCheck || getWorkTeamCalendarEquipmentInfoValue(operationInfo, ['최근 점검'])),
                nextCheck: normalizeWorkTeamCalendarEquipmentText(item?.nextCheck || getWorkTeamCalendarEquipmentInfoValue(operationInfo, ['다음 점검'])),
                maintenanceHistory: asWorkTeamCalendarEquipmentList(item?.maintenanceHistory),
            };
        })
        .filter(item => item.name && item.teamDataKey);
    return applyWorkTeamCalendarEquipmentNameSequence(items);
}

function getWorkTeamCalendarEquipmentMaintenanceItems(equipmentItems, monthKey) {
    const normalizedMonthKey = normalizeWorkTeamCalendarEquipmentText(monthKey);
    return asWorkTeamCalendarEquipmentList(equipmentItems)
        .flatMap(equipment => asWorkTeamCalendarEquipmentList(equipment?.maintenanceHistory).map((row, rowIndex) => {
            const date = parseWorkTeamCalendarEquipmentDate(row?.date);
            return {
                id: `${equipment.id || equipment.name}-${rowIndex}`,
                equipmentId: equipment.id,
                equipmentName: equipment.displayName || equipment.name,
                equipmentBaseName: equipment.name,
                teamDataKey: equipment.teamDataKey,
                teamLabel: equipment.teamLabel,
                process: equipment.process,
                status: equipment.status,
                dateKey: date?.dateKey || '',
                monthKey: date?.monthKey || '',
                dateLabel: date?.label || normalizeWorkTeamCalendarEquipmentText(row?.date),
                type: normalizeWorkTeamCalendarEquipmentText(row?.type),
                content: normalizeWorkTeamCalendarEquipmentText(row?.content),
                worker: normalizeWorkTeamCalendarEquipmentText(row?.worker),
                note: normalizeWorkTeamCalendarEquipmentText(row?.note),
            };
        }))
        .filter(item => item.monthKey === normalizedMonthKey)
        .sort((a, b) => String(b.dateKey || '').localeCompare(String(a.dateKey || '')) || a.equipmentName.localeCompare(b.equipmentName, 'ko'));
}

function getWorkTeamCalendarEquipmentSummary(dataKey, monthKey) {
    const targetKeys = getWorkTeamCalendarEquipmentSourceDataKeys(dataKey);
    const targetSet = new Set(targetKeys);
    const equipmentItems = normalizeWorkTeamCalendarEquipmentItems()
        .filter(item => targetSet.has(item.teamDataKey))
        .sort((a, b) => (
            WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS.indexOf(a.teamDataKey) - WORK_TEAM_CALENDAR_EQUIPMENT_DETAIL_KEYS.indexOf(b.teamDataKey)
            || a.name.localeCompare(b.name, 'ko')
        ));
    const maintenanceItems = getWorkTeamCalendarEquipmentMaintenanceItems(equipmentItems, monthKey);
    return {
        dataKey: normalizeWorkTeamCalendarEquipmentText(dataKey),
        targetKeys,
        monthKey: normalizeWorkTeamCalendarEquipmentText(monthKey),
        monthLabel: formatWorkTeamCalendarEquipmentMonthLabel(monthKey),
        equipmentItems,
        maintenanceItems,
        equipmentCount: equipmentItems.length,
        maintenanceCount: maintenanceItems.length,
    };
}

function renderWorkTeamCalendarEquipmentSummaryChipHtml(summary, isActive = false) {
    const safeSummary = summary || {};
    return `
        <button
            type="button"
            class="work-team-calendar-utility-chip is-button${isActive ? ' is-active' : ''}"
            onclick="openWorkTeamCalendarUtilityPopup('equipment')"
            aria-pressed="${isActive ? 'true' : 'false'}"
            aria-label="설비이력 열기"
        >
            <span class="work-team-calendar-utility-label">설비이력</span>
            <span class="work-team-calendar-utility-value">${escapeWorkTeamCalendarEquipmentHtml(`등록 설비 ${formatWorkTeamCalendarEquipmentCount(safeSummary.equipmentCount || 0)}`)}</span>
            <span class="work-team-calendar-utility-meta">${escapeWorkTeamCalendarEquipmentHtml(`${safeSummary.monthLabel || '-'} 정비 ${formatWorkTeamCalendarEquipmentCount(safeSummary.maintenanceCount || 0)}`)}</span>
        </button>
    `;
}

function groupWorkTeamCalendarEquipmentItemsByTeam(items) {
    const groups = new Map();
    asWorkTeamCalendarEquipmentList(items).forEach(item => {
        const key = item.teamDataKey || 'unassigned';
        if (!groups.has(key)) {
            groups.set(key, {
                teamDataKey: key,
                teamLabel: item.teamLabel || getWorkTeamCalendarEquipmentTeamLabel(key),
                items: [],
            });
        }
        groups.get(key).items.push(item);
    });
    return Array.from(groups.values());
}

function renderWorkTeamCalendarEquipmentMaintenanceListHtml(summary) {
    const items = asWorkTeamCalendarEquipmentList(summary?.maintenanceItems);
    if (!items.length) {
        return '<div class="work-team-calendar-production-empty">선택한 월의 정비내역이 없습니다.</div>';
    }
    return groupWorkTeamCalendarEquipmentItemsByTeam(items).map(group => `
        <div class="work-team-calendar-team-group">
            <div class="work-team-calendar-team-group-head">
                <div class="work-team-calendar-team-group-title">${escapeWorkTeamCalendarEquipmentHtml(group.teamLabel)}</div>
                <div class="work-team-calendar-team-group-meta">${escapeWorkTeamCalendarEquipmentHtml(formatWorkTeamCalendarEquipmentCount(group.items.length))}</div>
            </div>
            <div class="work-team-calendar-production-list">
                ${group.items.map(item => {
                    const title = item.content || item.type || '정비 내용 미입력';
                    const metaParts = [item.dateLabel, item.type, item.worker ? `작업자 ${item.worker}` : '']
                        .filter(Boolean);
                    const noteParts = [item.equipmentName, item.process, item.note]
                        .filter(Boolean);
                    return `
                        <div class="work-team-calendar-production-item">
                            <div class="work-team-calendar-production-main">
                                <div class="work-team-calendar-production-name">${escapeWorkTeamCalendarEquipmentHtml(title)}</div>
                                <div class="work-team-calendar-production-meta">${escapeWorkTeamCalendarEquipmentHtml(metaParts.join(' · ') || '-')}</div>
                                <div class="work-team-calendar-production-summary">${escapeWorkTeamCalendarEquipmentHtml(noteParts.join(' · ') || item.equipmentName || '-')}</div>
                            </div>
                            <div class="work-team-calendar-production-amount">${escapeWorkTeamCalendarEquipmentHtml(item.status || '-')}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function renderWorkTeamCalendarEquipmentListHtml(summary) {
    const items = asWorkTeamCalendarEquipmentList(summary?.equipmentItems);
    if (!items.length) {
        return '<div class="work-team-calendar-production-empty">등록된 설비가 없습니다.</div>';
    }
    return groupWorkTeamCalendarEquipmentItemsByTeam(items).map(group => `
        <div class="work-team-calendar-team-group">
            <div class="work-team-calendar-team-group-head">
                <div class="work-team-calendar-team-group-title">${escapeWorkTeamCalendarEquipmentHtml(group.teamLabel)}</div>
                <div class="work-team-calendar-team-group-meta">${escapeWorkTeamCalendarEquipmentHtml(`등록 설비 ${formatWorkTeamCalendarEquipmentCount(group.items.length)}`)}</div>
            </div>
            <div class="work-team-calendar-production-list">
                ${group.items.map(item => {
                    const metaParts = [item.equipmentCode, item.process].filter(Boolean);
                    const checkParts = [
                        item.lastCheck ? `최근 ${item.lastCheck}` : '',
                        item.nextCheck ? `다음 ${item.nextCheck}` : '',
                    ].filter(Boolean);
                    return `
                        <div class="work-team-calendar-production-item">
                            <div class="work-team-calendar-production-main">
                                <div class="work-team-calendar-production-name">${escapeWorkTeamCalendarEquipmentHtml(item.displayName || item.name)}</div>
                                <div class="work-team-calendar-production-meta">${escapeWorkTeamCalendarEquipmentHtml(metaParts.join(' · ') || '설비 정보 미입력')}</div>
                                <div class="work-team-calendar-production-summary">${escapeWorkTeamCalendarEquipmentHtml(checkParts.join(' · ') || '점검일 미입력')}</div>
                            </div>
                            <div class="work-team-calendar-production-amount">${escapeWorkTeamCalendarEquipmentHtml([item.status, item.rateText].filter(Boolean).join(' · ') || '-')}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

function renderWorkTeamCalendarEquipmentPopupHtml(summary, category = {}) {
    const safeSummary = summary || {};
    const categoryTitle = normalizeWorkTeamCalendarEquipmentText(category?.title) || '팀';
    const title = `${categoryTitle} 설비이력`;
    return `
        <div class="work-team-calendar-overlay-layer">
            <button type="button" class="work-team-calendar-overlay-backdrop" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="설비이력 팝업 닫기"></button>
            <div class="work-team-calendar-editor is-floating is-utility-popup" data-work-team-editor>
                <div class="work-team-calendar-editor-head">
                    <div class="work-team-calendar-editor-handle" data-work-team-editor-handle>
                        <div class="work-team-calendar-editor-title">${escapeWorkTeamCalendarEquipmentHtml(title)}</div>
                        <div class="work-team-calendar-editor-sub">${escapeWorkTeamCalendarEquipmentHtml((safeSummary.monthLabel || '-') + ' 기준')}</div>
                    </div>
                    <div class="work-team-calendar-editor-actions">
                        <span class="work-team-calendar-editor-count">${escapeWorkTeamCalendarEquipmentHtml(`정비 ${formatWorkTeamCalendarEquipmentCount(safeSummary.maintenanceCount || 0)}`)}</span>
                        <button type="button" class="work-team-calendar-editor-btn" onclick="closeWorkTeamCalendarUtilityPopup()" aria-label="설비이력 팝업 닫기"><i class="fas fa-xmark"></i>닫기</button>
                    </div>
                </div>
                <div class="work-team-calendar-field">
                    <div class="work-team-calendar-field-head">
                        <span class="work-team-calendar-field-label">선택월 정비내역</span>
                    </div>
                    <div class="work-team-calendar-utility-popup-total">
                        <span class="work-team-calendar-utility-popup-total-value">${escapeWorkTeamCalendarEquipmentHtml(`등록 설비 ${formatWorkTeamCalendarEquipmentCount(safeSummary.equipmentCount || 0)}`)}</span>
                        <span class="work-team-calendar-utility-popup-total-meta">${escapeWorkTeamCalendarEquipmentHtml(`${safeSummary.monthLabel || '-'} 정비 ${formatWorkTeamCalendarEquipmentCount(safeSummary.maintenanceCount || 0)}`)}</span>
                    </div>
                    <div class="work-team-calendar-team-groups">
                        ${renderWorkTeamCalendarEquipmentMaintenanceListHtml(safeSummary)}
                    </div>
                </div>
                <div class="work-team-calendar-field">
                    <div class="work-team-calendar-field-head">
                        <span class="work-team-calendar-field-label">등록 설비</span>
                    </div>
                    <div class="work-team-calendar-team-groups">
                        ${renderWorkTeamCalendarEquipmentListHtml(safeSummary)}
                    </div>
                </div>
            </div>
        </div>
    `;
}
