(function () {
    const api = KpiDataEquipmentHistoryBrowserAdapter.getApi();

    const BASIC_FIELDS = [
        { key: 'name', label: '설비명', placeholder: '설비명을 입력하세요.' },
        { key: 'team', label: '관리팀', placeholder: '예: 생산1팀' },
        { key: 'room', label: '실', placeholder: '예: 외포장실' },
        { key: 'process', label: '공정', placeholder: '공정을 입력하세요.' },
        { key: 'rate', label: '가동률', placeholder: '숫자만 입력' },
    ];

    const OPERATION_FIELDS = BASIC_FIELDS;

    const DEFAULT_MANUFACTURER_LABEL = '\uC81C\uC870\uC0AC';
    const DEFAULT_OWNER_LABEL = '\uB2F4\uB2F9 \uC5C5\uCCB4';

    const PHOTO_INFO_FIELDS = [
        { key: 'name', label: '\uC124\uBE44\uBA85', placeholder: '\uC608: \uBC18\uC8FD\uAE30' },
        { key: 'maintenanceCategory', label: '설비 카테고리', placeholder: '예: 펌프, 모터, 포장기' },
        { key: 'room', label: '\uC2E4', placeholder: '\uC608: \uC81C\uD658\uC2E4' },
        { key: 'process', label: '\uACF5\uC815', placeholder: '\uC608: \uD63C\uD569 \uACF5\uC815' },
        { key: 'rate', label: '\uAC00\uB3D9\uB960', placeholder: '\uC22B\uC790\uB9CC \uC785\uB825' },
        { key: 'modelName', label: '\uAE30\uC885', placeholder: '\uC608: FUJI-ACE EC101' },
        { key: 'manufacturer', label: DEFAULT_MANUFACTURER_LABEL, placeholder: '\uC5C5\uCCB4\uBA85 / \uC8FC\uC18C', editableLabelKey: 'manufacturerLabel' },
        { key: 'manufacturedAt', label: '\uC81C\uC870\uB144\uC6D4', placeholder: 'YYYY-MM', inputType: 'month' },
        { key: 'owner', label: DEFAULT_OWNER_LABEL, placeholder: '\uC5C5\uCCB4\uBA85 / \uC804\uD654\uBC88\uD638', editableLabelKey: 'ownerLabel' },
    ];

    const DETAIL_ITEM_FIELDS = [
        { key: 'label', label: '항목명', placeholder: '예: 제조사' },
        { key: 'value', label: '내용', placeholder: '내용을 입력하세요.' },
    ];

    const DETAIL_GROUP_KEYS = ['equipmentSpecs'];
    const LEGACY_DETAIL_GROUP_KEYS = ['equipmentSpecs', 'otherInfo'];

    const DETAIL_GROUP_LABELS = Object.freeze({
        equipmentSpecs: '\uC124\uBE44 \uC2A4\uD399',
    });

    const EQUIPMENT_SPEC_CATEGORY_ORDER = Object.freeze([
        { key: 'identity', title: '\uAE30\uBCF8 \uC815\uBCF4' },
        { key: 'spec', title: '\uC8FC\uC694 \uC2A4\uD399' },
        { key: 'maintenance', title: '\uC810\uAC80\u00B7\uBB38\uC11C' },
        { key: 'other', title: '\uAE30\uD0C0' },
    ]);
    const EQUIPMENT_SPEC_BLOCK_SIZE = 8;
    const EQUIPMENT_SPEC_CATEGORY_HINT_KEY = '__equipmentSpecCategory';
    const EQUIPMENT_SPEC_BLOCK_ID_KEY = '__equipmentSpecBlockId';

    const EQUIPMENT_SPEC_IDENTITY_LABELS = new Set([
        '\uC790\uB8CC \uCD9C\uCC98',
        '\uAE30\uC885',
        '\uBAA8\uB378\uBA85',
        '\uBAA8\uB378',
        '\uC2DC\uB9AC\uC5BC',
        'serial no.',
        'serial',
        '\uC81C\uC870\uBC88\uD638',
        '\uC81C\uC870\uB144\uC6D4',
        '\uC81C\uC870\uC0AC',
        '\uC7A5\uBE44 \uC720\uD615',
        '\uC801\uC6A9 \uACF5\uC815',
        '\uBCC0\uD615 \uD655\uC778',
    ]);

    const SYSTEM_DETAIL_LABELS = new Set([
        '\uC124\uBE44\uBA85',
        '\uAD00\uB9AC\uD300',
        '\uC2E4',
        '\uACF5\uC815',
        '\uAC00\uB3D9\uB960',
        '\uAE30\uC885',
        '\uBAA8\uB378\uBA85',
        '\uBAA8\uB378',
        '\uC81C\uC870\uC0AC',
        '\uC81C\uC870\uB144\uC6D4',
    ]);

    const MAINTENANCE_FIELDS = [
        { key: 'date', label: '일자', placeholder: 'YYYY.MM.DD' },
        { key: 'type', label: '구분', placeholder: '정기점검' },
        { key: 'content', label: '내용', placeholder: '작업 내용을 입력하세요.' },
        { key: 'worker', label: '작업자', placeholder: '작업자' },
        { key: 'note', label: '비고', placeholder: '비고' },
    ];

    const ANNUAL_MAINTENANCE_CYCLE_DATALIST_ID = 'data-equipment-annual-maintenance-cycle-options';
    const ANNUAL_MAINTENANCE_MONTH_DATALIST_ID = 'data-equipment-annual-maintenance-month-options';
    const ANNUAL_MAINTENANCE_CYCLE_OPTIONS = Object.freeze([
        '일 1회',
        '주 1회',
        '월 1회',
        '분기 1회',
        '반기 1회',
        '연 1회',
        '연 2회',
        '필요 시',
    ]);
    const ANNUAL_MAINTENANCE_MONTH_OPTIONS = Object.freeze([
        '매월',
        ...Array.from({ length: 12 }, (_, index) => `${index + 1}월`),
        '필요 시',
    ]);

    const ANNUAL_MAINTENANCE_PLAN_FIELDS = [
        { key: 'equipmentName', label: '설비명', placeholder: '설비명' },
        { key: 'maintenanceItem', label: '정비항목', placeholder: '정비항목' },
        { key: 'maintenanceContent', label: '주요정비내용', placeholder: '주요 정비 내용을 입력하세요.' },
        {
            key: 'cycle',
            label: '주기',
            placeholder: '예: 연 1회',
            datalistId: ANNUAL_MAINTENANCE_CYCLE_DATALIST_ID,
            options: ANNUAL_MAINTENANCE_CYCLE_OPTIONS,
        },
        {
            key: 'executionMonth',
            label: '실시월',
            placeholder: '예: 3월, 9월',
            datalistId: ANNUAL_MAINTENANCE_MONTH_DATALIST_ID,
            options: ANNUAL_MAINTENANCE_MONTH_OPTIONS,
        },
        { key: 'inspectionNotes', label: '점검여부 및 특이사항', placeholder: '점검 결과 또는 특이사항' },
    ];
    const ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS = ANNUAL_MAINTENANCE_PLAN_FIELDS.slice(1);
    const DEFAULT_ANNUAL_MAINTENANCE_PLAN_ROW_COUNT = 1;

    const DOCUMENT_FIELDS = [
        { key: 'title', label: '문서명', placeholder: '예: 점검 보고서' },
    ];
    const DEFAULT_DOCUMENT_ROW_COUNT = 1;

    const DOCUMENT_ATTACHMENT_ACCEPT = '.pdf,.xls,.xlsx,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.jpg,.jpeg,.png,.webp,.gif,.bmp';
    const EQUIPMENT_PHOTO_ATTACHMENT_KEY = 'equipment-photo-main';

    const DOCUMENT_SAVE_FIELDS = [
        ...DOCUMENT_FIELDS,
        { key: 'documentId' },
        { key: 'fileName' },
        { key: 'originalName' },
        { key: 'mimeType' },
        { key: 'storageRelPath' },
        { key: 'previewUrl' },
        { key: 'downloadUrl' },
    ];

    const EQUIPMENT_HISTORY_TEAM_OPTIONS = [
        '1\uD300 1\uD30C\uD2B8',
        '1\uD300 2\uD30C\uD2B8',
        '2\uD300',
        '3\uD300',
        '\uACF5\uBB34\uD658\uACBD\uD300',
    ];

    const EQUIPMENT_HISTORY_TEAM_DATA_KEY_MAP = Object.freeze({
        '1\uD3001\uD30C\uD2B8': 'work_team_calendar_team1_part1',
        '1\uD3002\uD30C\uD2B8': 'work_team_calendar_team1_part2',
        '2\uD300': 'work_team_calendar_team2',
        '3\uD300': 'work_team_calendar_team3',
        '\uACF5\uBB34\uD658\uACBD\uD300': 'work_team_calendar_team4',
    });

    function canonicalizeEquipmentHistoryTeam(value) {
        return api.normalizeText(value).replace(/\s+/g, '');
    }

    function resolveEquipmentHistoryTeamDataKey(teamName) {
        const raw = api.normalizeText(teamName);
        if (/^work_team_calendar_team(?:1_part[12]|[234])$/.test(raw)) return raw;
        const canonical = canonicalizeEquipmentHistoryTeam(raw);
        if (EQUIPMENT_HISTORY_TEAM_DATA_KEY_MAP[canonical]) return EQUIPMENT_HISTORY_TEAM_DATA_KEY_MAP[canonical];
        if (canonical.includes('\uC720\uC0B0')) return 'work_team_calendar_team4';
        if (canonical.includes('\uBD81\uC815')) return 'work_team_calendar_team1_part1';
        if (canonical.includes('1\uD300') && canonical.includes('1\uD30C\uD2B8')) return 'work_team_calendar_team1_part1';
        if (canonical.includes('1\uD300') && canonical.includes('2\uD30C\uD2B8')) return 'work_team_calendar_team1_part2';
        if (canonical.includes('2\uD300')) return 'work_team_calendar_team2';
        if (canonical.includes('3\uD300')) return 'work_team_calendar_team3';
        if (canonical.includes('\uACF5\uBB34\uD658\uACBD') || (canonical.includes('\uACF5\uBB34') && canonical.includes('\uD658\uACBD'))) {
            return 'work_team_calendar_team4';
        }
        return '';
    }

    function normalizeEquipmentHistoryTeamName(teamName) {
        const dataKey = resolveEquipmentHistoryTeamDataKey(teamName);
        if (dataKey === 'work_team_calendar_team1_part1') return '1\uD300 1\uD30C\uD2B8';
        if (dataKey === 'work_team_calendar_team1_part2') return '1\uD300 2\uD30C\uD2B8';
        if (dataKey === 'work_team_calendar_team2') return '2\uD300';
        if (dataKey === 'work_team_calendar_team3') return '3\uD300';
        if (dataKey === 'work_team_calendar_team4') return '\uACF5\uBB34\uD658\uACBD\uD300';
        return api.normalizeText(teamName);
    }

    function createBlankMaintenanceRow() {
        return { date: '', type: '', content: '', worker: '', note: '' };
    }

    function getEquipmentMaintenanceCategory(item) {
        const teamKey = resolveEquipmentHistoryTeamDataKey(api.getEquipmentHistoryTeamAssignment(item).teamDataKey);
        const label = api.normalizeText(item?.maintenanceCategory).replace(/\s+/g, ' ');
        return {
            key: teamKey && label ? JSON.stringify([teamKey, label.toLocaleLowerCase('ko-KR')]) : '',
            label,
            teamKey,
        };
    }

    function getEquipmentMaintenanceCategoryOptions(data, teamKey) {
        const normalizedTeamKey = resolveEquipmentHistoryTeamDataKey(teamKey);
        if (!normalizedTeamKey) return [];
        const labels = new Map();
        const addLabel = (value) => {
            if (typeof value !== 'string') return;
            const category = getEquipmentMaintenanceCategory({ teamDataKey: normalizedTeamKey, maintenanceCategory: value });
            if (category.key && !labels.has(category.key)) labels.set(category.key, category.label);
        };
        api.normalizeEquipmentItems(data).forEach((item) => {
            if (getEquipmentMaintenanceCategory(item).teamKey === normalizedTeamKey) addLabel(item.maintenanceCategory);
        });
        const catalog = data?.maintenanceCategoriesByTeam;
        if (catalog && typeof catalog === 'object' && !Array.isArray(catalog)) {
            Object.entries(catalog).forEach(([catalogTeamKey, values]) => {
                if (resolveEquipmentHistoryTeamDataKey(catalogTeamKey) === normalizedTeamKey) {
                    api.asList(values).forEach(addLabel);
                }
            });
        }
        return [...labels.values()].sort((left, right) => left.localeCompare(right, 'ko-KR', {
            numeric: true,
            sensitivity: 'base',
        }));
    }

    function getEquipmentMaintenanceBatchCandidates(data, teamKey, categoryKey) {
        const normalizedTeamKey = resolveEquipmentHistoryTeamDataKey(teamKey);
        const normalizedCategoryKey = api.normalizeText(categoryKey);
        if (!normalizedTeamKey || !normalizedCategoryKey) return [];
        return api.normalizeEquipmentItems(data).filter((item) => {
            const category = getEquipmentMaintenanceCategory(item);
            return category.teamKey === normalizedTeamKey && category.key === normalizedCategoryKey;
        });
    }

    function createBlankAnnualMaintenancePlanRow(equipmentName = '') {
        return {
            equipmentName: api.normalizeText(equipmentName),
            maintenanceItem: '',
            maintenanceContent: '',
            cycle: '',
            executionMonth: '',
            inspectionNotes: '',
        };
    }

    function createBlankDocumentRow() {
        return { clientRowId: `doc-${Date.now()}-${Math.round(Math.random() * 1e6)}`, title: '' };
    }

    function createBlankDetailRow(category = '', blockId = '') {
        const row = { label: '', value: '' };
        const categoryKey = api.normalizeText(category);
        const blockKey = api.normalizeText(blockId);
        if (categoryKey) row[EQUIPMENT_SPEC_CATEGORY_HINT_KEY] = categoryKey;
        if (blockKey) row[EQUIPMENT_SPEC_BLOCK_ID_KEY] = blockKey;
        return row;
    }

    function normalizeRows(rows, factory, minimumLength = 1) {
        const list = api.asList(rows).map((row) => ({ ...factory(), ...(row || {}) }));
        while (list.length < minimumLength) list.push(factory());
        return list;
    }

    function normalizeOptionalRows(rows, factory) {
        return api.asList(rows).map((row) => ({ ...factory(), ...(row || {}) }));
    }

    function normalizeYearMonthValue(value) {
        const raw = api.normalizeText(value);
        if (!raw) return '';
        const match = raw.match(/^(\d{4})\D{0,3}(\d{1,2})/);
        if (!match) return raw;
        const month = Number(match[2]);
        if (!Number.isInteger(month) || month < 1 || month > 12) return raw;
        return `${match[1]}-${String(month).padStart(2, '0')}`;
    }

    function normalizeSingleLineValue(value) {
        return api.normalizeText(value).replace(/\s*[\r\n]+\s*/g, ' / ');
    }

    function normalizeAnnualMaintenanceCycleValue(value) {
        const raw = normalizeSingleLineValue(value).replace(/\s+/g, ' ');
        if (!raw) return '';
        const compact = raw.replace(/\s+/g, '').replace(/／/g, '/');
        if (/^(?:필요시|필요할때)$/i.test(compact)) return '필요 시';
        if (compact === '수시') return '수시';

        const everyMatch = compact.match(/^매(일|주|월|분기|반기|연|년)$/);
        if (everyMatch) {
            const unit = everyMatch[1] === '년' ? '연' : everyMatch[1];
            return `${unit} 1회`;
        }

        const unitFirstMatch = compact.match(/^(일|주|월|분기|반기|연|연간|년)(?:\/?(\d+)회|\/(\d+))$/);
        const countFirstMatch = compact.match(/^(\d+)(?:회\/?|\/)(일|주|월|분기|반기|연|연간|년)$/);
        const match = unitFirstMatch || countFirstMatch;
        if (!match) return raw;

        const rawUnit = unitFirstMatch ? match[1] : match[2];
        const rawCount = unitFirstMatch ? match[2] || match[3] : match[1];
        const count = Number(rawCount);
        if (!Number.isInteger(count) || count < 1) return raw;
        const unit = rawUnit === '년' || rawUnit === '연간' ? '연' : rawUnit;
        return `${unit} ${count}회`;
    }

    function normalizeAnnualMaintenanceExecutionMonthValue(value) {
        const raw = normalizeSingleLineValue(value).replace(/\s+/g, ' ');
        if (!raw) return '';
        const compact = raw.replace(/\s+/g, '');
        if (compact === '매월') return '매월';
        if (/^(?:필요시|필요할때)$/i.test(compact)) return '필요 시';
        if (compact === '수시') return '수시';

        const tokenSource = raw
            .replace(/월/g, '')
            .replace(/[，、·ㆍ\/／;；|]+/g, ',')
            .replace(/\s+/g, ',')
            .replace(/,+/g, ',')
            .replace(/^,|,$/g, '');
        const tokens = tokenSource ? tokenSource.split(',') : [];
        if (!tokens.length || tokens.some((token) => !/^\d{1,2}$/.test(token))) return raw;

        const months = tokens.map(Number);
        if (months.some((month) => !Number.isInteger(month) || month < 1 || month > 12)) return raw;
        return [...new Set(months)]
            .sort((left, right) => left - right)
            .map((month) => `${month}월`)
            .join(', ');
    }

    function normalizeAnnualMaintenancePlanFieldValue(fieldKey, value) {
        if (fieldKey === 'cycle') return normalizeAnnualMaintenanceCycleValue(value);
        if (fieldKey === 'executionMonth') return normalizeAnnualMaintenanceExecutionMonthValue(value);
        return normalizeSingleLineValue(value);
    }

    function normalizeAnnualMaintenancePlanRow(row, fallbackEquipmentName = '') {
        const source = row && typeof row === 'object' ? row : {};
        return ANNUAL_MAINTENANCE_PLAN_FIELDS.reduce((result, field) => {
            const fallback = field.key === 'equipmentName' ? fallbackEquipmentName : '';
            result[field.key] = normalizeAnnualMaintenancePlanFieldValue(field.key, source[field.key] || fallback);
            return result;
        }, {});
    }

    function getCustomSystemDetailLabels(source = {}) {
        return [
            source.manufacturerLabel,
            source.manufacturerTitle,
            source.manufacturerLabelText,
            source.ownerLabel,
            source.ownerTitle,
            source.ownerLabelText,
        ].map((label) => api.normalizeText(label)).filter(Boolean);
    }

    function isSystemDetailInfoRow(row, extraLabels = []) {
        const label = api.normalizeText(row?.label);
        return SYSTEM_DETAIL_LABELS.has(label) || api.asList(extraLabels).includes(label);
    }

    function isEquipmentHistoryDetailGroupSection(section) {
        return DETAIL_GROUP_KEYS.includes(api.normalizeText(section));
    }

    function normalizeDetailInfoRows(rows, extraSystemLabels = []) {
        return normalizeOptionalRows(rows, createBlankDetailRow)
            .filter((row) => !isSystemDetailInfoRow(row, extraSystemLabels));
    }

    function getDetailInfoValue(rows, labels) {
        const labelSet = new Set(api.asList(labels).map((label) => api.normalizeText(label)));
        const found = api.asList(rows).find((row) => labelSet.has(api.normalizeText(row?.label)));
        return api.normalizeText(found?.value);
    }

    function splitLegacyDetailInfoRows(rows, extraSystemLabels = []) {
        return { equipmentSpecs: normalizeDetailInfoRows(rows, extraSystemLabels) };
    }

    function getDetailGroupSource(source, groupKey) {
        if (source?.detailGroups && typeof source.detailGroups === 'object') {
            return source.detailGroups[groupKey];
        }
        return source?.[groupKey];
    }

    function normalizeEquipmentHistoryDetailGroups(source = {}) {
        const hasGroupedRows = LEGACY_DETAIL_GROUP_KEYS.some((groupKey) => Array.isArray(getDetailGroupSource(source, groupKey)));
        const extraSystemLabels = getCustomSystemDetailLabels(source);
        const groupedRows = hasGroupedRows
            ? {
                equipmentSpecs: [
                    ...normalizeDetailInfoRows(getDetailGroupSource(source, 'equipmentSpecs'), extraSystemLabels),
                    ...normalizeDetailInfoRows(getDetailGroupSource(source, 'otherInfo'), extraSystemLabels),
                ],
            }
            : splitLegacyDetailInfoRows(source.detailInfo, extraSystemLabels);

        return DETAIL_GROUP_KEYS.reduce((result, groupKey) => {
            result[groupKey] = normalizeRows(groupedRows[groupKey], createBlankDetailRow);
            return result;
        }, {});
    }

    function removeBlankDetailGroupRows(detailGroups) {
        return DETAIL_GROUP_KEYS.reduce((result, groupKey) => {
            result[groupKey] = removeBlankRows(api.asList(detailGroups?.[groupKey]), DETAIL_ITEM_FIELDS)
                .map((row) => ({ label: api.normalizeText(row?.label), value: api.normalizeText(row?.value) }));
            return result;
        }, {});
    }

    function flattenDetailGroupRows(detailGroups) {
        return DETAIL_GROUP_KEYS.flatMap((groupKey) => api.asList(detailGroups?.[groupKey]));
    }

    function createDraft(equipment = null) {
        const source = equipment || {};
        const { team, teamDataKey } = api.getEquipmentHistoryTeamAssignment(source);
        const detailGroups = normalizeEquipmentHistoryDetailGroups(source);
        const editableDetailInfo = removeBlankRows(flattenDetailGroupRows(detailGroups), DETAIL_ITEM_FIELDS);
        const rawDetailRows = [
            ...api.asList(source.detailInfo),
            ...api.asList(getDetailGroupSource(source, 'equipmentSpecs')),
            ...api.asList(getDetailGroupSource(source, 'otherInfo')),
        ];
        const manufacturerLabel = api.normalizeText(source.manufacturerLabel || source.manufacturerTitle || source.manufacturerLabelText) || DEFAULT_MANUFACTURER_LABEL;
        const ownerLabel = api.normalizeText(source.ownerLabel || source.ownerTitle || source.ownerLabelText) || DEFAULT_OWNER_LABEL;
        const annualMaintenancePlanSource = source.annualMaintenancePlan || source.maintenancePlan || source.annualMaintenanceSchedule;
        const annualMaintenancePlan = normalizeRows(
            annualMaintenancePlanSource,
            () => createBlankAnnualMaintenancePlanRow(source.name),
            DEFAULT_ANNUAL_MAINTENANCE_PLAN_ROW_COUNT
        ).map((row) => normalizeAnnualMaintenancePlanRow(row, source.name));
        return {
            id: api.normalizeText(source.id),
            equipmentCode: api.normalizeText(source.equipmentCode || source.id),
            name: api.normalizeText(source.name),
            maintenanceCategory: api.normalizeText(source.maintenanceCategory),
            displayName: api.normalizeText(source.displayName),
            duplicateNameCount: Math.max(0, Math.trunc(Number(source.duplicateNameCount) || 0)),
            nameSequence: Math.max(0, Math.trunc(Number(source.nameSequence) || 0)),
            line: api.normalizeText(source.line),
            process: api.normalizeText(source.process || source.group),
            status: normalizeEquipmentRunStatus(source.status || '가동중'),
            production: api.normalizeText(source.production),
            plan: api.normalizeText(source.plan),
            rate: source.rate === null || source.rate === undefined || source.rate === '' ? '' : String(source.rate),
            lastCheck: api.normalizeText(source.lastCheck),
            nextCheck: api.normalizeText(source.nextCheck),
            team,
            room: api.normalizeText(source.room),
            teamDataKey,
            group: api.normalizeText(source.group),
            modelName: api.normalizeText(source.modelName || source.model || source.equipmentModel || source.machineModel || source.machineType)
                || getDetailInfoValue(rawDetailRows, ['\uAE30\uC885', '\uBAA8\uB378\uBA85', '\uBAA8\uB378', '\uBAA8\uB378 \uBC88\uD638', 'modelName', 'model']),
            manufacturerLabel,
            manufacturer: api.normalizeText(source.manufacturer || source.maker)
                || getDetailInfoValue(rawDetailRows, ['\uC81C\uC870\uC0AC', '\uC81C\uC791\uC0AC', '\uBA54\uC774\uCEE4', 'maker', 'manufacturer', manufacturerLabel]),
            manufacturedAt: normalizeYearMonthValue(
                api.normalizeText(source.manufacturedAt || source.manufactureDate || source.manufacturedDate || source.manufactureYearMonth || source.productionDate)
                    || getDetailInfoValue(rawDetailRows, ['\uC81C\uC870\uB144\uC6D4', '\uC81C\uC870 \uC5F0\uC6D4', '\uC81C\uC870\uB144\uB3C4', '\uC81C\uC791\uB144\uC6D4', '\uC81C\uC791 \uC5F0\uC6D4', '\uC81C\uC870\uC77C\uC790', '\uC81C\uC791\uC77C\uC790', 'manufacturedAt', 'manufactureDate', 'manufacturedDate'])
            ),
            ownerLabel,
            owner: api.normalizeText(source.owner) || getDetailInfoValue(rawDetailRows, ['\uB2F4\uB2F9 \uC5C5\uCCB4', '\uB2F4\uB2F9', '\uCC45\uC784\uC790', ownerLabel]),
            note: api.normalizeText(source.note),
            photoDataUrl: api.normalizeText(source.photoDataUrl),
            photoThumbDataUrl: api.normalizeText(source.photoThumbDataUrl),
            photoCrop: normalizePhotoCrop(source.photoCrop),
            photoDocumentId: api.normalizeText(source.photoDocumentId || source.photoFileId),
            photoPreviewUrl: api.normalizeText(source.photoPreviewUrl || source.photoViewUrl),
            photoDownloadUrl: api.normalizeText(source.photoDownloadUrl),
            photoStorageRelPath: api.normalizeText(source.photoStorageRelPath),
            photoName: api.normalizeText(source.photoName),
            photoAttachmentKey: api.normalizeText(source.photoAttachmentKey || source.photoAttachmentId) || EQUIPMENT_PHOTO_ATTACHMENT_KEY,
            detailInfo: editableDetailInfo,
            detailGroups,
            annualMaintenancePlan,
            maintenanceHistory: normalizeRows(source.maintenanceHistory, createBlankMaintenanceRow),
            documents: normalizeRows(source.documents, createBlankDocumentRow, DEFAULT_DOCUMENT_ROW_COUNT),
        };
    }

    function createEquipmentHistoryStartDraft(source = null) {
        const base = source || {};
        return {
            team: api.getEquipmentHistoryTeamAssignment(base).team,
            room: api.normalizeText(base.room),
            name: api.normalizeText(base.name),
        };
    }

    function makeEquipmentId(draft) {
        const seed = api.normalizeText(draft.equipmentCode || draft.name || `equipment-${Date.now()}`);
        return seed.toLowerCase().replace(/[^a-z0-9가-힣-]+/gi, '-').replace(/^-+|-+$/g, '') || `equipment-${Date.now()}`;
    }

    function removeBlankRows(rows, fields) {
        return api.asList(rows).filter((row) => fields.some((field) => api.normalizeText(row?.[field.key])));
    }

    function buildInfo(items) {
        return items.map((item) => ({ label: item.label, value: api.normalizeText(item.value) }));
    }

    function parseDraftRate(value) {
        const raw = api.normalizeText(value).replace(/,/g, '');
        if (!raw) return { isValid: true, value: 0 };
        const match = raw.match(/^(\d+(?:\.\d+)?)\s*%?$/);
        if (!match) return { isValid: false, value: 0 };
        const numeric = Number(match[1]);
        if (!Number.isFinite(numeric)) return { isValid: false, value: 0 };
        return { isValid: true, value: Math.max(0, Math.min(numeric, 100)) };
    }

    function normalizeEquipmentRunStatus(status) {
        const value = api.normalizeText(status);
        if (['정비중', '점검중', '점검예정'].includes(value)) return '정비중';
        return ['비가동중', '비가동', '정지'].includes(value) ? '비가동중' : '가동중';
    }

    function normalizePhotoCrop(value) {
        if (!value || typeof value !== 'object') return null;
        const x = Number(value.x);
        const y = Number(value.y);
        const width = Number(value.width);
        const height = Number(value.height);
        if (![x, y, width, height].every(Number.isFinite)) return null;
        if (width <= 0 || height <= 0) return null;
        return {
            x: Math.max(0, Math.min(x, 1)),
            y: Math.max(0, Math.min(y, 1)),
            width: Math.max(0.02, Math.min(width, 1)),
            height: Math.max(0.02, Math.min(height, 1)),
        };
    }

    function getEquipmentHistoryDraftValidationErrors(draft) {
        const normalized = createDraft(draft);
        const errors = [];
        if (!normalized.name) {
            errors.push({ field: 'name', message: '\uC124\uBE44\uBA85\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
        }
        if (!parseDraftRate(normalized.rate).isValid) {
            errors.push({ field: 'rate', message: '\uAC00\uB3D9\uB960\uC740 0\uBD80\uD130 100\uAE4C\uC9C0\uC758 \uC22B\uC790\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
        }
        return errors;
    }

    function getEquipmentHistoryStartValidationErrors(draft) {
        const normalized = createEquipmentHistoryStartDraft(draft);
        const errors = [];
        if (!normalized.team) {
            errors.push({ field: 'team', message: '\uD300\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.' });
        }
        if (!normalized.name) {
            errors.push({ field: 'name', message: '\uC124\uBE44\uBA85\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.' });
        }
        return errors;
    }

    function mergeDetailInfoRows(normalized, detailGroups) {
        const systemRows = [
            { label: '설비명', value: normalized.name },
            { label: '관리팀', value: normalized.team },
            { label: '공정', value: normalized.process },
            { label: '가동률', value: normalized.rate !== '' ? `${parseDraftRate(normalized.rate).value}%` : '' },
            { label: '기종', value: normalized.modelName },
            { label: normalized.manufacturerLabel || DEFAULT_MANUFACTURER_LABEL, value: normalized.manufacturer },
            { label: '제조년월', value: normalized.manufacturedAt },
        ].filter((row) => row.value);

        const customRows = removeBlankRows(flattenDetailGroupRows(detailGroups || normalized.detailGroups), DETAIL_ITEM_FIELDS);
        const usedLabels = new Set(systemRows.map((row) => api.normalizeText(row.label)));
        const dedupedCustomRows = customRows.filter((row) => {
            const label = api.normalizeText(row.label);
            if (!label || usedLabels.has(label)) return false;
            usedLabels.add(label);
            return true;
        });

        return [...systemRows, ...dedupedCustomRows];
    }

    function buildRecordFromDraft(draft) {
        const normalized = createDraft(draft);
        const id = normalized.id || makeEquipmentId(normalized);
        const rate = parseDraftRate(normalized.rate).value;
        const detailGroups = removeBlankDetailGroupRows(normalized.detailGroups);
        const detailInfo = mergeDetailInfoRows(normalized, detailGroups);
        const { teamDataKey } = api.getEquipmentHistoryTeamAssignment(normalized);
        const documents = removeBlankRows(normalized.documents, DOCUMENT_SAVE_FIELDS)
            .map(({ pendingFile, attachmentKey, ...row }) => row);
        const annualMaintenancePlan = removeBlankRows(
            normalized.annualMaintenancePlan,
            ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS
        ).map((row) => normalizeAnnualMaintenancePlanRow(row, normalized.name));
        return {
            id,
            equipmentCode: normalized.equipmentCode || id.toUpperCase(),
            name: normalized.name,
            maintenanceCategory: normalized.maintenanceCategory,
            line: normalized.line,
            process: normalized.process,
            status: normalizeEquipmentRunStatus(normalized.status),
            rate,
            production: normalized.production,
            plan: normalized.plan,
            lastCheck: normalized.lastCheck,
            nextCheck: normalized.nextCheck,
            team: normalized.team,
            room: normalized.room,
            teamDataKey,
            group: normalized.process,
            modelName: normalized.modelName,
            manufacturerLabel: normalized.manufacturerLabel || DEFAULT_MANUFACTURER_LABEL,
            manufacturer: normalized.manufacturer,
            manufacturedAt: normalized.manufacturedAt,
            ownerLabel: normalized.ownerLabel || DEFAULT_OWNER_LABEL,
            owner: normalized.owner,
            note: normalized.note,
            photoDataUrl: normalized.photoDocumentId ? '' : normalized.photoDataUrl,
            photoThumbDataUrl: normalized.photoThumbDataUrl,
            photoCrop: normalizePhotoCrop(normalized.photoCrop),
            photoDocumentId: normalized.photoDocumentId,
            photoPreviewUrl: normalized.photoPreviewUrl,
            photoDownloadUrl: normalized.photoDownloadUrl,
            photoStorageRelPath: normalized.photoStorageRelPath,
            photoName: normalized.photoName,
            photoAttachmentKey: normalized.photoAttachmentKey || EQUIPMENT_PHOTO_ATTACHMENT_KEY,
            operationInfo: buildInfo(OPERATION_FIELDS.map((field) => ({ label: field.label, value: normalized[field.key] }))),
            detailInfo,
            detailGroups,
            annualMaintenancePlan,
            maintenanceHistory: removeBlankRows(normalized.maintenanceHistory, MAINTENANCE_FIELDS),
            documents,
        };
    }

    function renderInput(field, value, attrs = '') {
        const inputType = api.normalizeText(field.inputType) || 'text';
        const controlValue = inputType === 'month' ? normalizeYearMonthValue(value) : normalizeSingleLineValue(value);
        const listAttr = field.datalistId ? ` list="${api.escapeHtml(field.datalistId)}"` : '';
        return `<input type="${api.escapeHtml(inputType)}" value="${api.escapeHtml(controlValue)}" placeholder="${api.escapeHtml(field.placeholder || '')}" data-equipment-field="${api.escapeHtml(field.key)}"${listAttr} ${attrs}>`;
    }

    function renderAnnualMaintenancePlanDatalists() {
        return ANNUAL_MAINTENANCE_PLAN_FIELDS
            .filter((field) => field.datalistId && api.asList(field.options).length)
            .map((field) => `
                <datalist id="${api.escapeHtml(field.datalistId)}">
                    ${api.asList(field.options).map((option) => `<option value="${api.escapeHtml(option)}"></option>`).join('')}
                </datalist>
            `)
            .join('');
    }

    function renderTextarea(field, value, attrs = '') {
        return `<textarea placeholder="${api.escapeHtml(field.placeholder || '')}" data-equipment-field="${api.escapeHtml(field.key)}" ${attrs}>${api.escapeHtml(value)}</textarea>`;
    }

    function renderTeamSelect(value, attrs = '') {
        const normalized = normalizeEquipmentHistoryTeamName(value);
        const hasCustomValue = normalized && !EQUIPMENT_HISTORY_TEAM_OPTIONS.includes(normalized);
        return `
            <select data-equipment-field="team" ${attrs}>
                <option value="">${api.escapeHtml('\uD300 \uC120\uD0DD')}</option>
                ${EQUIPMENT_HISTORY_TEAM_OPTIONS.map((team) => `
                    <option value="${api.escapeHtml(team)}"${team === normalized ? ' selected' : ''}>${api.escapeHtml(team)}</option>
                `).join('')}
                ${hasCustomValue ? `<option value="${api.escapeHtml(normalized)}" selected>${api.escapeHtml(normalized)}</option>` : ''}
            </select>
        `;
    }

    function renderFieldControl(field, value, attrs = '') {
        if (field.key === 'team') {
            return renderTeamSelect(value, attrs);
        }
        if (field.multiline) {
            return renderTextarea(field, value, attrs);
        }
        return renderInput(field, value, attrs);
    }

    function renderFieldLabel(field, draft) {
        if (!field.editableLabelKey) {
            return `<span>${api.escapeHtml(field.label)}</span>`;
        }
        const value = api.normalizeText(draft?.[field.editableLabelKey]) || field.label;
        return `<input type="text" class="data-equipment-field-label-input" value="${api.escapeHtml(value)}" placeholder="${api.escapeHtml(field.label)}" data-equipment-field="${api.escapeHtml(field.editableLabelKey)}" aria-label="${api.escapeHtml(`${field.label} 제목`)}">`;
    }

    function getFieldControlAttrs(field, draft, options) {
        const attrs = options?.fieldAttrs;
        if (typeof attrs === 'function') {
            return attrs(field, draft) || '';
        }
        if (attrs && typeof attrs === 'object') {
            return attrs[field.key] || '';
        }
        return '';
    }

    function renderFieldGrid(fields, draft, className, options = {}) {
        return `
            <div class="${className}">
                ${fields.map((field) => `
                    <div data-equipment-field-wrap="${api.escapeHtml(field.key)}">
                        ${renderFieldLabel(field, draft)}
                        ${renderFieldControl(field, draft[field.key] || '', getFieldControlAttrs(field, draft, options))}
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getEquipmentSpecCategory(row) {
        const label = api.normalizeText(row?.label);
        const value = api.normalizeText(row?.value);
        const labelKey = label.toLowerCase();
        const text = `${label} ${value}`.toLowerCase();
        if (!label && !value) return api.normalizeText(row?.[EQUIPMENT_SPEC_CATEGORY_HINT_KEY]) || 'other';
        if (EQUIPMENT_SPEC_IDENTITY_LABELS.has(label) || EQUIPMENT_SPEC_IDENTITY_LABELS.has(labelKey)) {
            return 'identity';
        }
        if (/적재하중|처리능력|전원|전압|소비전력|본체중량|중량|스트로크|회전각|반복정도|용량|규격|치수|속도|사이클|cycle|kva|kg|mm|축|제어|hmi|plc|컨트롤러|펜던트|메뉴|인터록|센서|teaching|티칭|파라미터|공압|핸드/.test(text)) {
            return 'spec';
        }
        if (/정비|점검|윤활|베어링|감속기|볼스크류|ball screw|타이밍벨트|reducer|guide|bushing|그리스|급지|오류|에러|진단|문서|도면|회로도|확보|이력|trouble|backup|백업|우선/.test(text)) {
            return 'maintenance';
        }
        return 'other';
    }

    function groupEquipmentSpecRows(rows, section) {
        const source = api.asList(rows);
        const list = source.length ? source : [createBlankDetailRow()];
        const entries = list.map((row, rowIndex) => ({
            row,
            rowIndex,
            category: section === 'equipmentSpecs' ? 'all' : 'other',
        }));
        if (section !== 'equipmentSpecs') {
            return [{ key: 'other', title: '', entries }];
        }
        return [{ key: 'all', title: '', entries }];
    }

    function chunkEquipmentSpecEntries(entries) {
        const list = api.asList(entries);
        const chunks = [];
        for (let index = 0; index < list.length; index += EQUIPMENT_SPEC_BLOCK_SIZE) {
            chunks.push({ entries: list.slice(index, index + EQUIPMENT_SPEC_BLOCK_SIZE), blockId: '' });
        }
        return chunks;
    }

    function getEquipmentSpecBlockKey(groupKey, block, blockIndex) {
        const blockId = api.normalizeText(block?.blockId);
        return `${api.normalizeText(groupKey) || 'other'}:${blockId || `auto-${blockIndex}`}`;
    }

    function isEquipmentSpecBlockOpen(options, blockKey) {
        return options?.openBlocks?.[blockKey] === true;
    }

    function getEquipmentSpecBlockLastRowIndex(entries) {
        return api.asList(entries).reduce((result, entry) => {
            const rowIndex = Number(entry?.rowIndex);
            return Number.isInteger(rowIndex) ? Math.max(result, rowIndex) : result;
        }, -1);
    }

    function renderDetailItem(row, section, rowIndex) {
        return `
            <article class="data-equipment-detail-item" data-equipment-detail-item data-equipment-row-index="${rowIndex}">
                <div class="data-equipment-detail-item-fields">
                    ${DETAIL_ITEM_FIELDS.map((field) => `
                        <label>
                            <span>${api.escapeHtml(field.label)}</span>
                            ${renderInput(field, row?.[field.key] || '', `data-equipment-row-section="${api.escapeHtml(section)}" data-equipment-row-index="${rowIndex}"`)}
                        </label>
                    `).join('')}
                    <button type="button" class="data-equipment-row-remove data-equipment-detail-remove" data-equipment-remove-row="${api.escapeHtml(section)}" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml('\uD56D\uBAA9 \uC0AD\uC81C')}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </article>
        `;
    }

    function renderEquipmentSpecBlockItem(entry, section, isOpen = false) {
        const rowIndex = Number(entry?.rowIndex);
        const row = entry?.row || {};
        const category = api.normalizeText(entry?.category);
        const categoryAttr = category ? `data-equipment-row-category="${api.escapeHtml(category)}"` : '';
        const commonAttrs = `data-equipment-row-section="${api.escapeHtml(section)}" data-equipment-row-index="${rowIndex}"`;
        return `
            <div class="data-equipment-detail-item data-equipment-spec-block-row" data-equipment-detail-item data-equipment-row-index="${rowIndex}">
                ${renderInput(DETAIL_ITEM_FIELDS[0], row.label || '', `${commonAttrs} aria-label="${api.escapeHtml(DETAIL_ITEM_FIELDS[0].label)}"`)}
                ${renderInput(DETAIL_ITEM_FIELDS[1], row.value || '', `${commonAttrs} aria-label="${api.escapeHtml(DETAIL_ITEM_FIELDS[1].label)}"`)}
                <div class="data-equipment-spec-row-actions" aria-hidden="${isOpen ? 'false' : 'true'}">
                    <button type="button" class="data-equipment-spec-move" data-equipment-move-row="${api.escapeHtml(section)}" data-equipment-move-direction="-1" data-equipment-row-index="${rowIndex}" ${categoryAttr} aria-label="${api.escapeHtml('\uC704\uB85C \uC774\uB3D9')}" ${entry.canMoveUp ? '' : 'disabled'}>
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button type="button" class="data-equipment-spec-move" data-equipment-move-row="${api.escapeHtml(section)}" data-equipment-move-direction="1" data-equipment-row-index="${rowIndex}" ${categoryAttr} aria-label="${api.escapeHtml('\uC544\uB798\uB85C \uC774\uB3D9')}" ${entry.canMoveDown ? '' : 'disabled'}>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button type="button" class="data-equipment-row-remove data-equipment-detail-remove" data-equipment-remove-row="${api.escapeHtml(section)}" data-equipment-row-index="${rowIndex}" aria-label="${api.escapeHtml('\uD56D\uBAA9 \uC0AD\uC81C')}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    function renderEquipmentSpecBlockActions(block, groupKey, section, blockKey, isOpen) {
        const entries = api.asList(block?.entries);
        const blockId = api.normalizeText(block?.blockId);
        const isFull = entries.length >= EQUIPMENT_SPEC_BLOCK_SIZE;
        const lastRowIndex = getEquipmentSpecBlockLastRowIndex(entries);
        return `
            <div class="data-equipment-spec-block-actions" aria-hidden="${isOpen ? 'false' : 'true'}">
                <button type="button" class="data-equipment-spec-block-add" data-equipment-add-row-to-block="${api.escapeHtml(section)}" data-equipment-row-category="${api.escapeHtml(groupKey)}" data-equipment-spec-block-key="${api.escapeHtml(blockKey)}" data-equipment-spec-block-id="${api.escapeHtml(blockId)}" data-equipment-row-index="${lastRowIndex}" aria-label="${api.escapeHtml('\uD589 \uCD94\uAC00')}" title="${api.escapeHtml('\uD589 \uCD94\uAC00')}" ${isFull ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i><span>${api.escapeHtml('\uD589 \uCD94\uAC00')}</span>
                </button>
            </div>
        `;
    }

    function renderEquipmentSpecBlock(block, section, blockIndex, groupKey, options = {}) {
        const blockKey = getEquipmentSpecBlockKey(groupKey, block, blockIndex);
        const isOpen = isEquipmentSpecBlockOpen(options, blockKey);
        return `
            <article class="data-equipment-spec-block ${isOpen ? 'is-managing' : ''}" data-equipment-spec-block data-equipment-spec-block-index="${blockIndex}" data-equipment-spec-block-key="${api.escapeHtml(blockKey)}">
                <div class="data-equipment-spec-block-head">
                    ${renderEquipmentSpecBlockActions(block, groupKey, section, blockKey, isOpen)}
                    <button type="button" class="data-equipment-spec-block-toggle" data-equipment-spec-block-toggle aria-expanded="${isOpen ? 'true' : 'false'}" aria-label="${api.escapeHtml('\uC815\uB9AC')}">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
                <div class="data-equipment-spec-block-items">
                    ${block.entries.map((entry) => renderEquipmentSpecBlockItem(entry, section, isOpen)).join('')}
                </div>
            </article>
        `;
    }

    function renderEquipmentSpecCategory(group, section, options = {}) {
        const entries = group.entries.map((entry, entryIndex, list) => ({
            ...entry,
            canMoveUp: entryIndex > 0,
            canMoveDown: entryIndex < list.length - 1,
        }));
        return `
            <section class="data-equipment-detail-category" data-equipment-detail-category="${api.escapeHtml(group.key)}">
                ${group.title ? `<h4>${api.escapeHtml(group.title)}</h4>` : ''}
                <div class="data-equipment-detail-category-grid">
                    ${chunkEquipmentSpecEntries(entries).map((block, blockIndex) => renderEquipmentSpecBlock(block, section, blockIndex, group.key, options)).join('')}
                </div>
            </section>
        `;
    }

    function renderDetailItems(rows, sectionKey = 'detailInfo', options = {}) {
        const section = api.normalizeText(sectionKey) || 'detailInfo';
        const groupedRows = groupEquipmentSpecRows(rows, section);
        const isCategorized = section === 'equipmentSpecs';

        return `
            <div class="data-equipment-detail-items-grid ${isCategorized ? 'is-categorized' : ''}">
                ${groupedRows.map((group) => isCategorized
                    ? renderEquipmentSpecCategory(group, section, options)
                    : group.entries.map((entry) => renderDetailItem(entry.row, section, entry.rowIndex)).join('')).join('')}
            </div>
        `;
    }

    function renderDetailGroups(detailGroups, options = {}) {
        const groups = normalizeEquipmentHistoryDetailGroups({ detailGroups });
        return `
            <div class="data-equipment-detail-groups">
                ${DETAIL_GROUP_KEYS.map((groupKey) => `
                    <section class="data-equipment-detail-group" data-equipment-detail-group="${api.escapeHtml(groupKey)}">
                        <div class="data-equipment-detail-group-head">
                            <button type="button" class="data-equipment-add-block" data-equipment-add-block="${api.escapeHtml(groupKey)}">
                                <i class="fas fa-plus"></i><span>${api.escapeHtml('\uD589 \uCD94\uAC00')}</span>
                            </button>
                        </div>
                        ${renderDetailItems(groups[groupKey], groupKey, options)}
                    </section>
                `).join('')}
            </div>
        `;
    }

    function renderEditableTable(fields, rows, sectionKey) {
        return `
            <table class="data-equipment-edit-table">
                <thead>
                    <tr>
                        ${fields.map((field) => `<th>${api.escapeHtml(field.label)}</th>`).join('')}
                        <th>제거</th>
                    </tr>
                </thead>
                <tbody>
                    ${api.asList(rows).map((row, rowIndex) => `
                        <tr>
                            ${fields.map((field) => `
                                <td>
                                    ${renderInput(field, row?.[field.key] || '', `data-equipment-row-section="${sectionKey}" data-equipment-row-index="${rowIndex}"`)}
                                </td>
                            `).join('')}
                            <td>
                                <button type="button" class="data-equipment-row-remove" data-equipment-remove-row="${sectionKey}" data-equipment-row-index="${rowIndex}" aria-label="행 제거">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    function renderDocumentEditableTable(rows) {
        return `
            <table class="data-equipment-edit-table">
                <thead>
                    <tr>
                        <th>문서명</th>
                        <th>파일 첨부</th>
                        <th>제거</th>
                    </tr>
                </thead>
                <tbody>
                    ${api.asList(rows).map((row, rowIndex) => {
                        const label = row?.pendingFile?.name || row?.fileName || row?.originalName || '';
                        return `
                            <tr>
                                <td>${renderInput(DOCUMENT_FIELDS[0], row?.title || '', `data-equipment-row-section="documents" data-equipment-row-index="${rowIndex}"`)}</td>
                                <td>
                                    <div class="data-equipment-document-picker">
                                        <input type="file" hidden accept="${api.escapeHtml(DOCUMENT_ATTACHMENT_ACCEPT)}" data-equipment-document-file-input data-equipment-row-index="${rowIndex}">
                                        <button type="button" class="data-equipment-document-pick" data-equipment-document-pick="${rowIndex}" aria-label="문서 파일 첨부" title="파일 첨부">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                        <span>${api.escapeHtml(label || '선택된 파일 없음')}</span>
                                    </div>
                                </td>
                                <td>
                                    <button type="button" class="data-equipment-row-remove" data-equipment-remove-row="documents" data-equipment-row-index="${rowIndex}" aria-label="문서 행 제거">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    Object.assign(api, {
        BASIC_FIELDS,
        OPERATION_FIELDS,
        PHOTO_INFO_FIELDS,
        DETAIL_ITEM_FIELDS,
        DETAIL_GROUP_KEYS,
        DETAIL_GROUP_LABELS,
        EQUIPMENT_SPEC_CATEGORY_ORDER,
        EQUIPMENT_SPEC_BLOCK_SIZE,
        MAINTENANCE_FIELDS,
        ANNUAL_MAINTENANCE_PLAN_FIELDS,
        ANNUAL_MAINTENANCE_PLAN_CONTENT_FIELDS,
        ANNUAL_MAINTENANCE_CYCLE_OPTIONS,
        ANNUAL_MAINTENANCE_MONTH_OPTIONS,
        DEFAULT_ANNUAL_MAINTENANCE_PLAN_ROW_COUNT,
        DOCUMENT_FIELDS,
        DEFAULT_DOCUMENT_ROW_COUNT,
        DOCUMENT_ATTACHMENT_ACCEPT,
        EQUIPMENT_PHOTO_ATTACHMENT_KEY,
        DOCUMENT_SAVE_FIELDS,
        EQUIPMENT_HISTORY_TEAM_OPTIONS,
        EQUIPMENT_HISTORY_TEAM_DATA_KEY_MAP,
        resolveEquipmentHistoryTeamDataKey,
        normalizeEquipmentHistoryTeamName,
        getEquipmentMaintenanceCategory,
        getEquipmentMaintenanceCategoryOptions,
        getEquipmentMaintenanceBatchCandidates,
        isEquipmentHistoryDetailGroupSection,
        normalizeEquipmentHistoryDetailGroups,
        createBlankMaintenanceRow,
        createBlankAnnualMaintenancePlanRow,
        normalizeAnnualMaintenanceCycleValue,
        normalizeAnnualMaintenanceExecutionMonthValue,
        normalizeAnnualMaintenancePlanFieldValue,
        normalizeAnnualMaintenancePlanRow,
        createBlankDocumentRow,
        createBlankDetailRow,
        createDraft,
        createEquipmentHistoryStartDraft,
        getEquipmentHistoryDraftValidationErrors,
        getEquipmentHistoryStartValidationErrors,
        buildRecordFromDraft,
        renderInput,
        renderAnnualMaintenancePlanDatalists,
        renderTeamSelect,
        renderFieldControl,
        renderFieldGrid,
        getEquipmentSpecCategory,
        renderDetailItems,
        renderDetailGroups,
        renderEditableTable,
        renderDocumentEditableTable,
    });
})();
