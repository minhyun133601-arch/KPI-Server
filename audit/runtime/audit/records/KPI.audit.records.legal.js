        function isAuditLegalFacilityDataKey(dataKey) {
            return String(dataKey || '').trim() === 'audit_legal_facility';
        }
        const AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS = ['정기검사', '사용검사', '선임'];
        const AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS = [
            { value: '', label: '직접입력', months: 0 },
            { value: '1개월', label: '1개월', months: 1 },
            { value: '3개월', label: '3개월', months: 3 },
            { value: '6개월', label: '6개월', months: 6 },
            { value: '1년', label: '1년', months: 12 },
            { value: '2년', label: '2년', months: 24 },
            { value: '3년', label: '3년', months: 36 }
        ];
        const AUDIT_LEGAL_CATEGORY_OPTIONS = [
            { value: 'boiler', label: '보일러', icon: 'fa-fire-flame-simple', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'cooling', label: '냉동기', icon: 'fa-snowflake', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'gas', label: '가스', icon: 'fa-gas-pump', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'fire', label: '소방', icon: 'fa-fire-extinguisher', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'electric', label: '전기', icon: 'fa-bolt', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'environment', label: '환경', icon: 'fa-seedling', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'elevator', label: '승강기', icon: 'fa-elevator', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS },
            { value: 'other', label: '기타', icon: 'fa-clipboard-check', inspectionItems: AUDIT_LEGAL_DEFAULT_INSPECTION_ITEMS }
        ];

        const AUDIT_LEGAL_CATEGORY_PRESETS = {
            boiler: {
                facility: '보일러 1호기',
                managementNo: 'BLR-01',
                plant: '보일러실',
                statutoryItem: '보일러 안전검사',
                cycle: '6개월',
                lastDate: '2026-01-10',
                nextDate: '2026-07-10',
                responsible: '시설팀',
                agency: '검사기관명',
                attachmentKey: 'boiler-01-202607-cert',
                note: '특이사항 없음'
            },
            cooling: {
                facility: '냉동기 1호기',
                managementNo: 'REF-01',
                plant: '냉동기계실',
                statutoryItem: '냉동제조시설 검사',
                cycle: '1년',
                lastDate: '2026-02-01',
                nextDate: '2027-02-01',
                responsible: '시설팀',
                agency: '검사기관명',
                attachmentKey: 'refrigerator-01-202702-cert',
                note: ''
            },
            gas: {
                facility: 'LPG 저장탱크',
                managementNo: 'GAS-TANK-01',
                plant: '가스저장소',
                statutoryItem: '가스시설 정기검사',
                cycle: '1년',
                lastDate: '2026-03-05',
                nextDate: '2027-03-05',
                responsible: '안전팀',
                agency: '검사기관명',
                attachmentKey: 'gas-tank-01-202703-cert',
                note: ''
            },
            fire: {
                facility: '소방수신반',
                managementNo: 'FIRE-01',
                plant: '방재실',
                statutoryItem: '작동기능점검',
                cycle: '1년',
                lastDate: '2026-05-01',
                nextDate: '2027-05-01',
                responsible: '안전팀',
                agency: '점검업체명',
                attachmentKey: 'fire-01-202705-report',
                note: ''
            },
            electric: {
                facility: '수전설비',
                managementNo: 'ELEC-01',
                plant: '전기실',
                statutoryItem: '전기안전검사',
                cycle: '1년',
                lastDate: '2026-04-01',
                nextDate: '2027-04-01',
                responsible: '전기담당',
                agency: '검사기관명',
                attachmentKey: 'electric-01-202704-cert',
                note: ''
            },
            environment: {
                facility: '대기 배출시설',
                managementNo: 'ENV-01',
                plant: '환경설비실',
                statutoryItem: '정기측정',
                cycle: '6개월',
                lastDate: '2026-03-15',
                nextDate: '2026-09-15',
                responsible: '공무환경팀',
                agency: '측정대행기관명',
                attachmentKey: 'env-01-202609-report',
                note: ''
            },
            elevator: {
                facility: '화물용 승강기',
                managementNo: 'ELEV-01',
                plant: '공장동',
                statutoryItem: '승강기 정기검사',
                cycle: '1년',
                lastDate: '',
                nextDate: '',
                responsible: '시설팀',
                agency: '검사기관명',
                attachmentKey: '',
                note: ''
            },
            other: {
                facility: '기타 법정설비',
                managementNo: 'LEGAL-ETC-01',
                plant: '현장',
                statutoryItem: '정기검사',
                cycle: '1년',
                lastDate: '',
                nextDate: '',
                responsible: '공무환경팀',
                agency: '검사기관명',
                attachmentKey: '',
                note: ''
            }
        };
        const auditLegalUiState = {
            selectedItemType: 'boiler',
            inspectionFormFacilityId: '',
            inspectionFormType: '',
            calendarYear: 0,
            calendarMonth: 0,
            calendarExpanded: true
        };
        const AUDIT_LEGAL_CATEGORY_INSPECTION_FORM_ID = '__category_inspection__';

        function normalizeAuditLegalItemType(value) {
            const raw = String(value || 'other').trim().toLowerCase();
            if (raw === 'gasboiler') return 'boiler';
            if (raw === 'refrigerator' || raw === 'refrigeration') return 'cooling';
            if (raw === 'firefighting' || raw === 'fire-fighting' || raw === 'safety') return 'fire';
            if (raw === 'env') return 'environment';
            if (raw === 'elevator' || raw === 'lift' || raw === 'hoist' || raw === '승강기') return 'elevator';
            if (raw === 'pressure' || raw === 'pressure-vessel' || raw === 'pressurevessel') return 'other';
            return AUDIT_LEGAL_CATEGORY_OPTIONS.some((item) => item.value === raw) ? raw : 'other';
        }

        function getAuditLegalCategoryOption(itemType = 'boiler') {
            const normalized = normalizeAuditLegalItemType(itemType);
            return AUDIT_LEGAL_CATEGORY_OPTIONS.find((item) => item.value === normalized) || AUDIT_LEGAL_CATEGORY_OPTIONS[0];
        }

        function getAuditLegalDefaultInspectionItems(itemType = 'boiler') {
            const option = getAuditLegalCategoryOption(itemType);
            return Array.isArray(option.inspectionItems) && option.inspectionItems.length
                ? option.inspectionItems.slice()
                : ['정기검사'];
        }

        function normalizeAuditLegalInspectionLabels(value, itemType = 'boiler', statutoryItem = '') {
            const labels = [];
            const pushLabel = (label) => {
                const normalized = String(label || '').trim();
                if (normalized && !labels.includes(normalized)) labels.push(normalized);
            };
            if (Array.isArray(value)) {
                value.forEach((item) => {
                    if (typeof item === 'string') {
                        pushLabel(item);
                        return;
                    }
                    pushLabel(item?.label || item?.name || item?.title || item?.inspection || item?.statutoryItem);
                });
            }
            pushLabel(statutoryItem);
            getAuditLegalDefaultInspectionItems(itemType).forEach(pushLabel);
            return labels;
        }

        function buildAuditLegalInspectionId(facilityId, index = 0) {
            return `${String(facilityId || 'legal-facility').trim() || 'legal-facility'}-inspection-${index + 1}`;
        }

        function normalizeAuditLegalInspectionRecords(value, itemType = 'boiler', fallback = {}) {
            const source = Array.isArray(value) ? value : [];
            const records = source
                .map((item, index) => {
                    if (typeof item === 'string') {
                        const type = String(item || '').trim();
                        return {
                            id: buildAuditLegalInspectionId(fallback.id, index),
                            type,
                            lastDate: '',
                            nextDate: '',
                        cycle: '',
                        agency: '',
                        attachmentKey: '',
                        documentId: '',
                        fileName: '',
                        previewUrl: '',
                        downloadUrl: '',
                        storageRelPath: '',
                        documentStatus: '',
                        note: ''
                    };
                    }
                    const type = String(item?.type || item?.label || item?.name || item?.title || item?.inspection || item?.statutoryItem || '').trim();
                    return {
                        id: String(item?.id || buildAuditLegalInspectionId(fallback.id, index)).trim(),
                        type,
                        lastDate: String(item?.lastDate || item?.lastInspectionDate || '').trim(),
                        nextDate: String(item?.nextDate || item?.nextInspectionDate || item?.dueDate || '').trim(),
                        cycle: String(item?.cycle || item?.period || '').trim(),
                        agency: String(item?.agency || item?.organization || '').trim(),
                        attachmentKey: String(item?.attachmentKey || item?.documentKey || '').trim(),
                        documentId: String(item?.documentId || item?.fileId || '').trim(),
                        fileName: String(item?.fileName || item?.originalName || '').trim(),
                        previewUrl: String(item?.previewUrl || '').trim(),
                        downloadUrl: String(item?.downloadUrl || '').trim(),
                        storageRelPath: String(item?.storageRelPath || '').trim(),
                        documentStatus: String(item?.documentStatus || item?.statusText || '').trim(),
                        note: String(item?.note || '').trim()
                    };
                })
                .filter((item) => item.type || item.lastDate || item.nextDate);
            const fallbackType = String(fallback.statutoryItem || fallback.inspection || '').trim();
            const fallbackLastDate = String(fallback.lastDate || '').trim();
            const fallbackNextDate = String(fallback.nextDate || '').trim();
            if (fallbackType || fallbackLastDate || fallbackNextDate) {
                const fallbackRecord = {
                    id: buildAuditLegalInspectionId(fallback.id, records.length),
                    type: fallbackType || getAuditLegalDefaultInspectionItems(itemType)[0] || '정기검사',
                    lastDate: fallbackLastDate,
                    nextDate: fallbackNextDate,
                    cycle: String(fallback.cycle || '').trim(),
                    agency: String(fallback.agency || '').trim(),
                    attachmentKey: String(fallback.attachmentKey || '').trim(),
                    documentId: String(fallback.documentId || '').trim(),
                    fileName: String(fallback.fileName || '').trim(),
                    previewUrl: String(fallback.previewUrl || '').trim(),
                    downloadUrl: String(fallback.downloadUrl || '').trim(),
                    storageRelPath: String(fallback.storageRelPath || '').trim(),
                    documentStatus: String(fallback.documentStatus || '').trim(),
                    note: String(fallback.note || '').trim()
                };
                const hasSameFallback = records.some((item) =>
                    item.type === fallbackRecord.type
                    && item.lastDate === fallbackRecord.lastDate
                    && item.nextDate === fallbackRecord.nextDate
                );
                if (!hasSameFallback) records.unshift(fallbackRecord);
            }
            return records;
        }

        function enrichAuditLegalInspectionStatus(inspection, now = new Date()) {
            const daysLeft = getAuditLegalDaysLeft(inspection?.nextDate, now);
            const status = getAuditLegalStatus(daysLeft);
            return { ...inspection, daysLeft, status };
        }

        function getAuditLegalFacilitySchedule(inspections) {
            return (Array.isArray(inspections) ? inspections : [])
                .filter((item) => item?.daysLeft !== null && item?.daysLeft !== undefined)
                .sort((a, b) => a.daysLeft - b.daysLeft)[0] || null;
        }

        function getAuditLegalSelectedItemType() {
            return normalizeAuditLegalItemType(auditLegalUiState.selectedItemType || 'boiler');
        }

        function setAuditLegalSelectedCategory(itemType) {
            auditLegalUiState.selectedItemType = normalizeAuditLegalItemType(itemType || 'boiler');
            return auditLegalUiState.selectedItemType;
        }

        function normalizeAuditLegalFacilities(data) {
            const source = Array.isArray(data?.facilities)
                ? data.facilities
                : (Array.isArray(data?.entries) ? data.entries : []);
            return source
                .map((item, index) => {
                    const itemType = normalizeAuditLegalItemType(item?.itemType || item?.type || 'other');
                    const statutoryItem = String(item?.statutoryItem || item?.inspection || item?.category || '').trim();
                    const id = String(item?.id || `legal-facility-${index + 1}`).trim();
                    const inspections = normalizeAuditLegalInspectionRecords(item?.inspections, itemType, {
                        id,
                        statutoryItem,
                        lastDate: item?.lastDate || item?.lastInspectionDate,
                        nextDate: item?.nextDate || item?.nextInspectionDate || item?.dueDate,
                        cycle: item?.cycle || item?.period,
                        agency: item?.agency || item?.organization,
                        attachmentKey: item?.attachmentKey || item?.documentKey,
                        documentId: item?.documentId || item?.fileId,
                        fileName: item?.fileName || item?.originalName,
                        previewUrl: item?.previewUrl,
                        downloadUrl: item?.downloadUrl,
                        storageRelPath: item?.storageRelPath,
                        documentStatus: item?.documentStatus || item?.statusText,
                        note: item?.note
                    });
                    return {
                        id,
                        plant: String(item?.plant || item?.team || '').trim(),
                        managementNo: String(item?.managementNo || item?.equipmentCode || item?.code || '').trim(),
                        facility: String(item?.facility || item?.equipment || item?.name || '').trim(),
                        itemType,
                        statutoryItem,
                        inspections,
                        inspectionItems: normalizeAuditLegalInspectionLabels(item?.inspectionItems, itemType, statutoryItem),
                        manager: String(item?.manager || item?.responsible || item?.owner || '').trim(),
                        responsible: String(item?.responsible || item?.manager || item?.owner || '').trim(),
                        agency: String(item?.agency || item?.organization || '').trim(),
                        cycle: String(item?.cycle || item?.period || '').trim(),
                        lastDate: String(item?.lastDate || item?.lastInspectionDate || '').trim(),
                        nextDate: String(item?.nextDate || item?.nextInspectionDate || item?.dueDate || '').trim(),
                        documentStatus: String(item?.documentStatus || item?.statusText || '').trim(),
                        attachmentKey: String(item?.attachmentKey || item?.documentKey || '').trim(),
                        previewTitle: String(item?.previewTitle || item?.documentTitle || '').trim(),
                        note: String(item?.note || '').trim()
                    };
                })
                .filter((item) => item.facility || item.statutoryItem);
        }
        function parseAuditLegalDate(value) {
            const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
            return Number.isNaN(date.getTime()) ? null : date;
        }
        function formatAuditLegalDate(value) {
            const date = parseAuditLegalDate(value);
            if (!date) return '-';
            return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
        }
        function formatAuditLegalInputDate(date) {
            if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        function getAuditLegalCycleOption(value) {
            const normalized = String(value || '').trim();
            return AUDIT_LEGAL_INSPECTION_CYCLE_OPTIONS.find((item) =>
                item.value === normalized || item.label === normalized
            ) || null;
        }
        function getAuditLegalCycleMonths(value) {
            const normalized = String(value || '').trim();
            const option = getAuditLegalCycleOption(normalized);
            if (option) return option.months;
            const monthMatch = normalized.match(/^(\d+)\s*(개월|m)$/i);
            if (monthMatch) return Number(monthMatch[1]);
            const yearMatch = normalized.match(/^(\d+)\s*(년|y)$/i);
            if (yearMatch) return Number(yearMatch[1]) * 12;
            return 0;
        }
        function formatAuditLegalCycleLabel(value) {
            const normalized = String(value || '').trim();
            const option = getAuditLegalCycleOption(normalized);
            return option?.label || normalized;
        }
        function calculateAuditLegalNextDate(lastDate, cycleValue) {
            const sourceDate = parseAuditLegalDate(lastDate);
            const months = getAuditLegalCycleMonths(cycleValue);
            if (!sourceDate || !months) return '';
            const target = new Date(sourceDate.getFullYear(), sourceDate.getMonth() + months, 1);
            const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
            target.setDate(Math.min(sourceDate.getDate(), lastDayOfTargetMonth));
            return formatAuditLegalInputDate(target);
        }
        function getAuditLegalDaysLeft(value, now = new Date()) {
            const dueDate = parseAuditLegalDate(value);
            if (!dueDate) return null;
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        }
        function getAuditLegalStatus(daysLeft) {
            if (daysLeft === null || daysLeft === undefined) return { key: 'none', label: '일정 없음', rowClass: '', dayClass: '' };
            if (daysLeft < 0) return { key: 'overdue', label: '기한 초과', rowClass: 'is-overdue', dayClass: 'is-overdue' };
            if (daysLeft <= 45) return { key: 'near', label: '임박', rowClass: 'is-near', dayClass: 'is-near' };
            return { key: 'safe', label: '정상', rowClass: '', dayClass: '' };
        }
        function sanitizeAuditLegalClass(value, fallback = 'other') {
            return String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || fallback;
        }
        function getAuditLegalIconClass(value, fallback = 'fa-clipboard-check') {
            const raw = String(value || fallback).trim().replace(/^fa[srldb]?\s+/, '').replace(/^fa-/, '');
            const safe = raw.toLowerCase().replace(/[^a-z0-9-]/g, '') || fallback.replace(/^fa-/, '');
            return `fas fa-${safe}`;
        }
        function getAuditLegalItemMeta(itemType) {
            const type = normalizeAuditLegalItemType(itemType);
            const meta = getAuditLegalCategoryOption(type);
            return { type: sanitizeAuditLegalClass(type), icon: meta.icon, label: meta.label };
        }
        function renderAuditLegalItemBadge(itemType) {
            const meta = getAuditLegalItemMeta(itemType);
            return `<span class="audit-legal-item-badge ${escapeHtml(meta.type)}"><i class="${getAuditLegalIconClass(meta.icon)}"></i>${escapeHtml(meta.label)}</span>`;
        }
        function renderAuditLegalDaysBadge(daysLeft, status) {
            const label = daysLeft === null || daysLeft === undefined
                ? '-'
                : (daysLeft < 0 ? `D+${Math.abs(daysLeft)}` : `D-${daysLeft}`);
            return `<span class="audit-legal-days ${status.dayClass}">${escapeHtml(label)}</span>`;
        }
        function renderAuditLegalInspectionDaysBadge(inspection) {
            if (!inspection?.nextDate) {
                return '<span class="audit-legal-days is-missing">날짜 미등록</span>';
            }
            return renderAuditLegalDaysBadge(inspection.daysLeft, inspection.status || getAuditLegalStatus(null));
        }
        function renderAuditLegalInspectionFileLink(inspection) {
            const label = String(inspection?.fileName || inspection?.documentStatus || '').trim();
            const href = String(inspection?.downloadUrl || inspection?.previewUrl || '').trim();
            if (!label && !inspection?.attachmentKey && !inspection?.documentId) return '';
            if (href) {
                return `<a class="audit-legal-inspection-file" href="${escapeHtml(href)}" target="_blank" rel="noopener">파일</a>`;
            }
            return '<span class="audit-legal-inspection-file">파일</span>';
        }
        function normalizeAuditLegalMetricList(source) {
            if (!Array.isArray(source)) return [];
            return source
                .map((item) => {
                    if (Array.isArray(item)) {
                        return { label: String(item[0] || '').trim(), value: String(item[1] ?? '').trim() };
                    }
                    return {
                        label: String(item?.label || item?.name || '').trim(),
                        value: String(item?.value ?? item?.count ?? '').trim()
                    };
                })
                .filter((item) => item.label);
        }
        function normalizeAuditLegalStatusList(source) {
            if (!Array.isArray(source)) return [];
            return source
                .map((item) => ({
                    key: sanitizeAuditLegalClass(item?.key || item?.type || 'safe', 'safe'),
                    label: String(item?.label || '').trim(),
                    count: String(item?.count ?? item?.value ?? '').trim()
                }))
                .filter((item) => item.label);
        }
        function summarizeAuditLegalRecords(records) {
            return records.reduce((acc, item) => {
                acc.total += 1;
                acc[item.status.key] = (acc[item.status.key] || 0) + 1;
                return acc;
            }, { total: 0, overdue: 0, near: 0, safe: 0 });
        }
        function buildAuditLegalEquipmentMetrics(records) {
            const counts = summarizeAuditLegalRecords(records);
            return [
                { label: '등록 설비', value: String(counts.total) },
                { label: '45일 이내', value: String(counts.near) },
                { label: '기한 초과', value: String(counts.overdue) }
            ];
        }
        function buildAuditLegalEquipmentStatuses(records) {
            const counts = summarizeAuditLegalRecords(records);
            return [
                { key: 'danger', label: '초과', count: String(counts.overdue) },
                { key: 'warning', label: '임박', count: String(counts.near) },
                { key: 'safe', label: '정상', count: String(counts.safe) }
            ].filter((item) => item.count !== '0');
        }
        function normalizeAuditLegalEquipment(data, records) {
            return AUDIT_LEGAL_CATEGORY_OPTIONS.map((option) => {
                const typeRecords = records.filter((record) => normalizeAuditLegalItemType(record.itemType) === option.value);
                return {
                    id: `legal-category-${option.value}`,
                    title: option.label,
                    itemType: option.value,
                    icon: option.icon,
                    metrics: [
                        { label: '등록 설비', value: String(typeRecords.length) },
                        { label: '기본 점검', value: `${getAuditLegalDefaultInspectionItems(option.value).length}개` },
                        { label: '확인 필요', value: String(typeRecords.filter((item) => item.status.key === 'overdue' || item.status.key === 'near').length) }
                    ],
                    statuses: buildAuditLegalEquipmentStatuses(typeRecords)
                };
            });
        }
        function resolveAuditLegalCount(value, counts) {
            if (value === 0) return '0';
            if (value === null || value === undefined) return '';
            const key = String(value || '').trim();
            if (!key) return '';
            if (Object.prototype.hasOwnProperty.call(counts, key)) return String(counts[key]);
            return key;
        }
        function normalizeAuditLegalAlerts(data, counts) {
            const source = Array.isArray(data?.alerts) ? data.alerts : [];
            if (source.length) {
                return source
                    .map((item, index) => ({
                        id: String(item?.id || `legal-alert-${index + 1}`).trim(),
                        title: String(item?.title || '').trim(),
                        count: resolveAuditLegalCount(item?.count ?? item?.countKey, counts),
                        unit: String(item?.unit || '건').trim(),
                        icon: String(item?.icon || 'fa-triangle-exclamation').trim(),
                        severity: sanitizeAuditLegalClass(item?.severity || item?.type || 'danger', 'danger')
                    }))
                    .filter((item) => item.title);
            }
            if (!counts.total) return [];
            return [
                { id: 'derived-near', title: '45일 이내 점검', count: String(counts.near), unit: '건', icon: 'fa-calendar-day', severity: 'danger' },
                { id: 'derived-overdue', title: '기한 초과 항목', count: String(counts.overdue), unit: '건', icon: 'fa-triangle-exclamation', severity: 'danger' },
                { id: 'derived-docs', title: '문서 확인 필요', count: String(counts.overdue + counts.near), unit: '건', icon: 'fa-file-circle-check', severity: 'info' }
            ];
        }
        function normalizeAuditLegalEvents(data, records) {
            const derived = records.flatMap((facility) => (facility.inspections || []).map((inspection) => ({
                date: inspection.nextDate,
                title: `${facility.facility || '설비'} ${inspection.type || '검사'}`,
                type: inspection.status.key === 'overdue' ? 'deadline' : (inspection.status.key === 'near' ? 'inspection' : 'document')
            })));
            const source = derived.length
                ? derived
                : (Array.isArray(data?.events) && data.events.length ? data.events : []);
            return source
                .map((item, index) => ({
                    id: String(item?.id || `legal-event-${index + 1}`).trim(),
                    date: String(item?.date || '').trim(),
                    title: String(item?.title || '').trim(),
                    type: sanitizeAuditLegalClass(item?.type || 'inspection', 'inspection')
                }))
                .filter((item) => parseAuditLegalDate(item.date) && item.title);
        }
        function buildAuditLegalCalendarConfig(year, monthIndex, label = '') {
            const resolvedYear = Number(year);
            const resolvedMonthIndex = Number(monthIndex);
            const date = new Date(
                Number.isFinite(resolvedYear) ? resolvedYear : new Date().getFullYear(),
                Number.isFinite(resolvedMonthIndex) ? resolvedMonthIndex : new Date().getMonth(),
                1
            );
            const actualYear = date.getFullYear();
            const actualMonthIndex = date.getMonth();
            return {
                year: actualYear,
                monthIndex: actualMonthIndex,
                label: String(label || `${actualYear}년 ${actualMonthIndex + 1}월`).trim()
            };
        }
        function setAuditLegalCalendarMonth(year, monthIndex) {
            const calendar = buildAuditLegalCalendarConfig(year, monthIndex);
            auditLegalUiState.calendarYear = calendar.year;
            auditLegalUiState.calendarMonth = calendar.monthIndex + 1;
            return calendar;
        }
        function getAuditLegalCalendarConfig(data, events) {
            const selectedYear = Number(auditLegalUiState.calendarYear);
            const selectedMonth = Number(auditLegalUiState.calendarMonth);
            if (selectedYear && selectedMonth >= 1 && selectedMonth <= 12) {
                return buildAuditLegalCalendarConfig(selectedYear, selectedMonth - 1);
            }
            const configuredYear = Number(data?.calendar?.year);
            const configuredMonth = Number(data?.calendar?.month);
            if (configuredYear && configuredMonth >= 1 && configuredMonth <= 12) {
                return buildAuditLegalCalendarConfig(
                    configuredYear,
                    configuredMonth - 1,
                    data?.calendar?.label || `${configuredYear}년 ${configuredMonth}월`
                );
            }
            const firstEvent = events.map((item) => parseAuditLegalDate(item.date)).find(Boolean) || new Date();
            return buildAuditLegalCalendarConfig(firstEvent.getFullYear(), firstEvent.getMonth());
        }
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
