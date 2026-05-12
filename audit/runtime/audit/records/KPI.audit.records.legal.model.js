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
                ['attachment' + 'Key']: 'boiler-01-202607-cert',
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
                ['attachment' + 'Key']: 'refrigerator-01-202702-cert',
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
                ['attachment' + 'Key']: 'gas-tank-01-202703-cert',
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
                ['attachment' + 'Key']: 'fire-01-202705-report',
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
                ['attachment' + 'Key']: 'electric-01-202704-cert',
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
                ['attachment' + 'Key']: 'env-01-202609-report',
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
