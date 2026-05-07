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

    const PHOTO_INFO_FIELDS = [
        { key: 'process', label: '\uACF5\uC815', placeholder: '\uC608: \uD63C\uD569 \uACF5\uC815' },
        { key: 'rate', label: '\uAC00\uB3D9\uB960', placeholder: '\uC22B\uC790\uB9CC \uC785\uB825' },
        { key: 'manufacturer', label: '\uC81C\uC870\uC0AC', placeholder: '\uC608: ABC\uC81C\uC870' },
        { key: 'owner', label: '\uB2F4\uB2F9 \uC5C5\uCCB4', placeholder: '\uC608: ABC\uC815\uBE44' },
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

    const SYSTEM_DETAIL_LABELS = new Set([
        '\uC124\uBE44\uBA85',
        '\uAD00\uB9AC\uD300',
        '\uC2E4',
        '\uACF5\uC815',
        '\uAC00\uB3D9\uB960',
        '\uC81C\uC870\uC0AC',
    ]);

    const MAINTENANCE_FIELDS = [
        { key: 'date', label: '일자', placeholder: 'YYYY.MM.DD' },
        { key: 'type', label: '구분', placeholder: '정기점검' },
        { key: 'content', label: '내용', placeholder: '작업 내용을 입력하세요.' },
        { key: 'worker', label: '작업자', placeholder: '작업자' },
        { key: 'note', label: '비고', placeholder: '비고' },
    ];

    const DOCUMENT_FIELDS = [
        { key: 'title', label: '문서명', placeholder: '예: 점검 보고서' },
    ];

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

    function createBlankDocumentRow() {
        return { clientRowId: `doc-${Date.now()}-${Math.round(Math.random() * 1e6)}`, title: '' };
    }

    function createBlankDetailRow() {
        return { label: '', value: '' };
    }

    function normalizeRows(rows, factory) {
        const list = api.asList(rows).map((row) => ({ ...factory(), ...(row || {}) }));
        return list.length ? list : [factory()];
    }

    function normalizeOptionalRows(rows, factory) {
        return api.asList(rows).map((row) => ({ ...factory(), ...(row || {}) }));
    }

    function isSystemDetailInfoRow(row) {
        return SYSTEM_DETAIL_LABELS.has(api.normalizeText(row?.label));
    }

    function isEquipmentHistoryDetailGroupSection(section) {
        return DETAIL_GROUP_KEYS.includes(api.normalizeText(section));
    }

    function normalizeDetailInfoRows(rows) {
        return normalizeOptionalRows(rows, createBlankDetailRow)
            .filter((row) => !isSystemDetailInfoRow(row));
    }

    function getDetailInfoValue(rows, labels) {
        const labelSet = new Set(api.asList(labels).map((label) => api.normalizeText(label)));
        const found = api.asList(rows).find((row) => labelSet.has(api.normalizeText(row?.label)));
        return api.normalizeText(found?.value);
    }

    function splitLegacyDetailInfoRows(rows) {
        return { equipmentSpecs: normalizeDetailInfoRows(rows) };
    }

    function getDetailGroupSource(source, groupKey) {
        if (source?.detailGroups && typeof source.detailGroups === 'object') {
            return source.detailGroups[groupKey];
        }
        return source?.[groupKey];
    }

    function normalizeEquipmentHistoryDetailGroups(source = {}) {
        const hasGroupedRows = LEGACY_DETAIL_GROUP_KEYS.some((groupKey) => Array.isArray(getDetailGroupSource(source, groupKey)));
        const groupedRows = hasGroupedRows
            ? {
                equipmentSpecs: [
                    ...normalizeDetailInfoRows(getDetailGroupSource(source, 'equipmentSpecs')),
                    ...normalizeDetailInfoRows(getDetailGroupSource(source, 'otherInfo')),
                ],
            }
            : splitLegacyDetailInfoRows(source.detailInfo);

        return DETAIL_GROUP_KEYS.reduce((result, groupKey) => {
            result[groupKey] = normalizeRows(groupedRows[groupKey], createBlankDetailRow);
            return result;
        }, {});
    }

    function removeBlankDetailGroupRows(detailGroups) {
        return DETAIL_GROUP_KEYS.reduce((result, groupKey) => {
            result[groupKey] = removeBlankRows(api.asList(detailGroups?.[groupKey]), DETAIL_ITEM_FIELDS);
            return result;
        }, {});
    }

    function flattenDetailGroupRows(detailGroups) {
        return DETAIL_GROUP_KEYS.flatMap((groupKey) => api.asList(detailGroups?.[groupKey]));
    }

    function createDraft(equipment = null) {
        const source = equipment || {};
        const detailGroups = normalizeEquipmentHistoryDetailGroups(source);
        const editableDetailInfo = removeBlankRows(flattenDetailGroupRows(detailGroups), DETAIL_ITEM_FIELDS);
        const rawDetailRows = [
            ...api.asList(source.detailInfo),
            ...api.asList(getDetailGroupSource(source, 'equipmentSpecs')),
            ...api.asList(getDetailGroupSource(source, 'otherInfo')),
        ];
        return {
            id: api.normalizeText(source.id),
            equipmentCode: api.normalizeText(source.equipmentCode || source.id),
            name: api.normalizeText(source.name),
            line: api.normalizeText(source.line),
            process: api.normalizeText(source.process || source.group),
            status: normalizeEquipmentRunStatus(source.status || '가동중'),
            production: api.normalizeText(source.production),
            plan: api.normalizeText(source.plan),
            rate: source.rate === null || source.rate === undefined || source.rate === '' ? '' : String(source.rate),
            lastCheck: api.normalizeText(source.lastCheck),
            nextCheck: api.normalizeText(source.nextCheck),
            team: normalizeEquipmentHistoryTeamName(source.team || source.teamDataKey),
            room: api.normalizeText(source.room),
            teamDataKey: api.normalizeText(source.teamDataKey) || resolveEquipmentHistoryTeamDataKey(source.team),
            group: api.normalizeText(source.group),
            manufacturer: api.normalizeText(source.manufacturer || source.maker)
                || getDetailInfoValue(rawDetailRows, ['\uC81C\uC870\uC0AC', '\uC81C\uC791\uC0AC', '\uBA54\uC774\uCEE4', 'maker', 'manufacturer']),
            owner: api.normalizeText(source.owner),
            note: api.normalizeText(source.note),
            photoDataUrl: api.normalizeText(source.photoDataUrl),
            photoDocumentId: api.normalizeText(source.photoDocumentId || source.photoFileId),
            photoPreviewUrl: api.normalizeText(source.photoPreviewUrl || source.photoViewUrl),
            photoDownloadUrl: api.normalizeText(source.photoDownloadUrl),
            photoStorageRelPath: api.normalizeText(source.photoStorageRelPath),
            photoName: api.normalizeText(source.photoName),
            detailInfo: editableDetailInfo,
            detailGroups,
            maintenanceHistory: normalizeRows(source.maintenanceHistory, createBlankMaintenanceRow),
            documents: normalizeRows(source.documents, createBlankDocumentRow),
        };
    }

    function createEquipmentHistoryStartDraft(source = null) {
        const base = source || {};
        return {
            team: normalizeEquipmentHistoryTeamName(base.team || base.teamDataKey),
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
        return ['비가동중', '비가동', '정지', '점검중', '점검예정'].includes(value) ? '비가동중' : '가동중';
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
            { label: '제조사', value: normalized.manufacturer },
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
        const teamDataKey = normalized.teamDataKey || resolveEquipmentHistoryTeamDataKey(normalized.team);
        const documents = removeBlankRows(normalized.documents, DOCUMENT_SAVE_FIELDS)
            .map(({ pendingFile, attachmentKey, ...row }) => row);
        return {
            id,
            equipmentCode: normalized.equipmentCode || id.toUpperCase(),
            name: normalized.name,
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
            manufacturer: normalized.manufacturer,
            owner: normalized.owner,
            note: normalized.note,
            photoDataUrl: normalized.photoDocumentId ? '' : normalized.photoDataUrl,
            photoDocumentId: normalized.photoDocumentId,
            photoPreviewUrl: normalized.photoPreviewUrl,
            photoDownloadUrl: normalized.photoDownloadUrl,
            photoStorageRelPath: normalized.photoStorageRelPath,
            photoName: normalized.photoName,
            operationInfo: buildInfo(OPERATION_FIELDS.map((field) => ({ label: field.label, value: normalized[field.key] }))),
            detailInfo,
            detailGroups,
            maintenanceHistory: removeBlankRows(normalized.maintenanceHistory, MAINTENANCE_FIELDS),
            documents,
        };
    }

    function renderInput(field, value, attrs = '') {
        return `<input type="text" value="${api.escapeHtml(value)}" placeholder="${api.escapeHtml(field.placeholder || '')}" data-equipment-field="${api.escapeHtml(field.key)}" ${attrs}>`;
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
        return renderInput(field, value, attrs);
    }

    function renderFieldGrid(fields, draft, className) {
        return `
            <div class="${className}">
                ${fields.map((field) => `
                    <label>
                        <span>${api.escapeHtml(field.label)}</span>
                        ${renderFieldControl(field, draft[field.key] || '')}
                    </label>
                `).join('')}
            </div>
        `;
    }

    function renderDetailItems(rows, sectionKey = 'detailInfo') {
        const section = api.normalizeText(sectionKey) || 'detailInfo';
        const source = api.asList(rows);
        const list = source.length ? source : [createBlankDetailRow()];

        return `
            <div class="data-equipment-detail-items-grid">
                ${list.map((row, rowIndex) => `
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
                `).join('')}
            </div>
        `;
    }

    function renderDetailGroups(detailGroups) {
        const groups = normalizeEquipmentHistoryDetailGroups({ detailGroups });
        return `
            <div class="data-equipment-detail-groups">
                ${DETAIL_GROUP_KEYS.map((groupKey) => `
                    <section class="data-equipment-detail-group" data-equipment-detail-group="${api.escapeHtml(groupKey)}">
                        <div class="data-equipment-detail-group-head">
                            <button type="button" class="data-equipment-add-row" data-equipment-add-row="${api.escapeHtml(groupKey)}">
                                <i class="fas fa-plus"></i><span>${api.escapeHtml('\uD589 \uCD94\uAC00')}</span>
                            </button>
                        </div>
                        ${renderDetailItems(groups[groupKey], groupKey)}
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
                                        <input type="file" hidden data-equipment-document-file-input data-equipment-row-index="${rowIndex}">
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
        MAINTENANCE_FIELDS,
        DOCUMENT_FIELDS,
        DOCUMENT_SAVE_FIELDS,
        EQUIPMENT_HISTORY_TEAM_OPTIONS,
        EQUIPMENT_HISTORY_TEAM_DATA_KEY_MAP,
        resolveEquipmentHistoryTeamDataKey,
        normalizeEquipmentHistoryTeamName,
        isEquipmentHistoryDetailGroupSection,
        normalizeEquipmentHistoryDetailGroups,
        createBlankMaintenanceRow,
        createBlankDocumentRow,
        createBlankDetailRow,
        createDraft,
        createEquipmentHistoryStartDraft,
        getEquipmentHistoryDraftValidationErrors,
        getEquipmentHistoryStartValidationErrors,
        buildRecordFromDraft,
        renderInput,
        renderTeamSelect,
        renderFieldControl,
        renderFieldGrid,
        renderDetailItems,
        renderDetailGroups,
        renderEditableTable,
        renderDocumentEditableTable,
    });
})();
