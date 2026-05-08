(function () {
    const api = KpiDataEquipmentHistoryBrowserAdapter.getApi();

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function asList(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeText(value) {
        return String(value ?? '').trim();
    }

    function parseRate(value) {
        const raw = normalizeText(value).replace(/,/g, '');
        const match = raw.match(/^(\d+(?:\.\d+)?)\s*%?$/);
        if (!match) return 0;
        return Math.max(0, Math.min(Number(match[1]) || 0, 100));
    }

    function formatRateValue(value) {
        if (value === null || value === undefined || value === '') return '';
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '';
        return `${numeric}%`;
    }

    function getInfoValue(items, labels, fallback = '') {
        const labelSet = new Set(asList(labels).map((label) => normalizeText(label)));
        const found = asList(items).find((item) => labelSet.has(normalizeText(item?.label)));
        return normalizeText(found?.value || fallback);
    }

    function canonicalizeEquipmentHistoryTeam(value) {
        return normalizeText(value).replace(/\s+/g, '');
    }

    const EQUIPMENT_HISTORY_TEAM_SORT_ORDER = Object.freeze([
        '1팀 1파트',
        '1팀 2파트',
        '2팀',
        '3팀',
        '공무환경팀',
    ]);

    const EQUIPMENT_HISTORY_TEAM_META_FALLBACK = Object.freeze({
        work_team_calendar_team1_part1: {
            title: '1팀 1파트',
            icon: 'fa-cheese',
            color: '#2563eb',
            secondaryColor: '#1d4ed8',
            tint: '#eff6ff',
            processLabel: '건조',
            processTag: '분말',
        },
        work_team_calendar_team1_part2: {
            title: '1팀 2파트',
            icon: 'fa-cheese',
            color: '#f59e0b',
            secondaryColor: '#d97706',
            tint: '#fff7ed',
            processLabel: '건조',
            processTag: '분말',
        },
        work_team_calendar_team2: {
            title: '2팀',
            icon: 'fa-box-open',
            color: '#059669',
            secondaryColor: '#047857',
            tint: '#ecfdf5',
            processLabel: '스틱 · 소포장',
            processTag: '포장',
        },
        work_team_calendar_team3: {
            title: '3팀',
            icon: 'fa-bottle-water',
            color: '#7c3aed',
            secondaryColor: '#5b21b6',
            tint: '#f5f3ff',
            processLabel: '액상',
            processTag: '액상',
        },
        work_team_calendar_team4: {
            title: '공무환경팀',
            icon: 'fa-screwdriver-wrench',
            color: '#dc2626',
            secondaryColor: '#b91c1c',
            tint: '#fef2f2',
            processLabel: '공무환경',
            processTag: '폐수 · 기타',
        },
    });

    function normalizeEquipmentHistoryColor(value, fallback) {
        const raw = normalizeText(value);
        return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
    }

    function getEquipmentHistoryTeamMeta(teamName) {
        const dataKey = resolveEquipmentHistoryTeamDataKey(teamName);
        const fallback = EQUIPMENT_HISTORY_TEAM_META_FALLBACK[dataKey] || {};
        const runtimeMeta = KpiDataEquipmentHistoryBrowserAdapter.getWorkTeamCalendarCategoryMeta?.(dataKey) || {};
        return {
            dataKey,
            title: normalizeEquipmentHistoryTeamName(runtimeMeta.title || fallback.title || teamName),
            icon: normalizeText(runtimeMeta.icon || fallback.icon || 'fa-industry'),
            color: normalizeEquipmentHistoryColor(runtimeMeta.color, fallback.color || '#2fe27c'),
            secondaryColor: normalizeEquipmentHistoryColor(runtimeMeta.secondaryColor, fallback.secondaryColor || fallback.color || '#8effbd'),
            tint: normalizeEquipmentHistoryColor(runtimeMeta.tint, fallback.tint || '#ecfdf5'),
            processLabel: normalizeText(runtimeMeta.processLabel || fallback.processLabel || ''),
            processTag: normalizeText(runtimeMeta.processTag || fallback.processTag || ''),
        };
    }

    function resolveEquipmentHistoryTeamDataKey(teamName) {
        const raw = normalizeText(teamName);
        if (/^work_team_calendar_team(?:1_part[12]|[234])$/.test(raw)) return raw;
        const canonical = canonicalizeEquipmentHistoryTeam(raw);
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

    function normalizeEquipmentHistoryTeamName(teamName) {
        const dataKey = resolveEquipmentHistoryTeamDataKey(teamName);
        if (dataKey === 'work_team_calendar_team1_part1') return '1팀 1파트';
        if (dataKey === 'work_team_calendar_team1_part2') return '1팀 2파트';
        if (dataKey === 'work_team_calendar_team2') return '2팀';
        if (dataKey === 'work_team_calendar_team3') return '3팀';
        if (dataKey === 'work_team_calendar_team4') return '공무환경팀';
        return normalizeText(teamName);
    }

    function getEquipmentHistoryTeamSortIndex(teamName) {
        const normalized = normalizeEquipmentHistoryTeamName(teamName);
        const index = EQUIPMENT_HISTORY_TEAM_SORT_ORDER.indexOf(normalized);
        return index >= 0 ? index : EQUIPMENT_HISTORY_TEAM_SORT_ORDER.length;
    }

    function compareEquipmentHistoryText(left, right) {
        return normalizeText(left).localeCompare(normalizeText(right), 'ko-KR', {
            numeric: true,
            sensitivity: 'base',
        });
    }

    function compareEquipmentHistoryItems(left, right) {
        return compareEquipmentHistoryText(left.room, right.room)
            || compareEquipmentHistoryText(left.group, right.group)
            || compareEquipmentHistoryText(left.name, right.name)
            || compareEquipmentHistoryText(left.id, right.id);
    }

    function getEquipmentStatus(status) {
        const value = normalizeText(status) || '가동중';
        const isStopped = ['비가동중', '비가동', '정지', '점검중', '점검예정'].includes(value);
        if (isStopped) {
            return { label: '비가동중', powerLabel: '비가동중', tone: 'stop', dotClassName: 'is-stop', isRunning: false };
        }
        return { label: '가동중', powerLabel: '가동중', tone: 'running', dotClassName: '', isRunning: true };
    }

    function normalizeDocuments(rows) {
        return asList(rows).map((row) => ({
            title: normalizeText(row?.title || row?.name || row?.file || row?.fileName || row?.originalName || row?.attachmentKey || row?.key),
            clientRowId: normalizeText(row?.clientRowId || row?.rowId),
            documentId: normalizeText(row?.documentId || row?.fileId),
            fileName: normalizeText(row?.fileName || row?.originalName),
            originalName: normalizeText(row?.originalName || row?.fileName),
            mimeType: normalizeText(row?.mimeType),
            storageRelPath: normalizeText(row?.storageRelPath),
            previewUrl: normalizeText(row?.previewUrl || row?.viewUrl),
            downloadUrl: normalizeText(row?.downloadUrl),
        }));
    }

    function normalizeDetailGroups(item) {
        const groups = item?.detailGroups && typeof item.detailGroups === 'object' ? item.detailGroups : {};
        const hasGroupedRows = Array.isArray(item?.equipmentSpecs)
            || Array.isArray(item?.otherInfo)
            || Array.isArray(groups.equipmentSpecs)
            || Array.isArray(groups.otherInfo);
        if (!hasGroupedRows) return null;
        const equipmentSpecs = Array.isArray(item?.equipmentSpecs) ? item.equipmentSpecs : groups.equipmentSpecs;
        const otherInfo = Array.isArray(item?.otherInfo) ? item.otherInfo : groups.otherInfo;
        return {
            equipmentSpecs: [...asList(equipmentSpecs), ...asList(otherInfo)],
        };
    }

    function normalizeEquipmentItem(item, index) {
        const operationInfo = asList(item?.operationInfo);
        const detailInfo = asList(item?.detailInfo);
        const detailGroups = normalizeDetailGroups(item);
        const statusMeta = getEquipmentStatus(item?.status);
        const rawTeam = item?.team || item?.department || getInfoValue(detailInfo, ['관리팀', '관리부서', '부서']);
        const team = normalizeEquipmentHistoryTeamName(rawTeam || item?.teamDataKey);
        const teamDataKey = normalizeText(item?.teamDataKey) || resolveEquipmentHistoryTeamDataKey(rawTeam);
        return {
            id: normalizeText(item?.id || item?.equipmentCode || `equipment-${index + 1}`),
            equipmentCode: normalizeText(item?.equipmentCode || item?.code || getInfoValue(detailInfo, ['설비코드', '코드']) || item?.id),
            team,
            room: normalizeText(item?.room || item?.roomName || item?.locationRoom || getInfoValue(detailInfo, ['실', '위치', '설치실']) || getInfoValue(operationInfo, ['실', '위치', '설치실'])),
            group: normalizeText(item?.group || item?.section || getInfoValue(detailInfo, ['공정', '설비구분', '공정 구분', '공정구분']) || item?.process || getInfoValue(operationInfo, ['공정', '공정 단계'])),
            name: normalizeText(item?.name || item?.equipmentName || getInfoValue(detailInfo, ['설비명'])),
            line: normalizeText(item?.line || getInfoValue(detailInfo, ['생산라인']) || getInfoValue(operationInfo, ['생산라인'])),
            process: normalizeText(item?.process || getInfoValue(detailInfo, ['공정']) || getInfoValue(operationInfo, ['공정', '공정 단계']) || item?.group),
            status: statusMeta.label,
            statusMeta,
            rate: parseRate(item?.rate ?? item?.utilization ?? getInfoValue(operationInfo, ['가동률', '핵심 KPI'], 0)),
            production: normalizeText(item?.production || getInfoValue(operationInfo, ['현재 실적', '최근 24H 생산량'])),
            plan: normalizeText(item?.plan || getInfoValue(operationInfo, ['목표 기준', '목표 생산량'])),
            lastCheck: normalizeText(item?.lastCheck || getInfoValue(operationInfo, ['최근 점검'])),
            nextCheck: normalizeText(item?.nextCheck || getInfoValue(operationInfo, ['다음 점검'])),
            teamDataKey,
            manufacturer: normalizeText(item?.manufacturer || item?.maker || getInfoValue(detailInfo, ['제조사', '제작사', '메이커']) || getInfoValue(operationInfo, ['제조사', '제작사', '메이커'])),
            owner: normalizeText(item?.owner || getInfoValue(detailInfo, ['담당', '책임자'])),
            note: normalizeText(item?.note),
            photoDataUrl: normalizeText(item?.photoDataUrl),
            photoDocumentId: normalizeText(item?.photoDocumentId || item?.photoFileId),
            photoPreviewUrl: normalizeText(item?.photoPreviewUrl || item?.photoViewUrl),
            photoDownloadUrl: normalizeText(item?.photoDownloadUrl),
            photoStorageRelPath: normalizeText(item?.photoStorageRelPath),
            photoName: normalizeText(item?.photoName),
            operationInfo,
            detailInfo,
            detailGroups,
            maintenanceHistory: asList(item?.maintenanceHistory),
            documents: normalizeDocuments(item?.documents),
        };
    }

    function normalizeEquipmentItems(data) {
        return asList(data?.equipmentList)
            .map(normalizeEquipmentItem)
            .filter((item) => item.id && item.name);
    }

    function groupEquipmentItems(items) {
        const groups = new Map();

        asList(items).forEach((item) => {
            const teamKey = normalizeEquipmentHistoryTeamName(item.team || item.teamDataKey) || '미분류 설비';
            const sectionKey = item.group || '공정 미지정';
            if (!groups.has(teamKey)) groups.set(teamKey, new Map());
            const sections = groups.get(teamKey);
            if (!sections.has(sectionKey)) sections.set(sectionKey, []);
            sections.get(sectionKey).push(item);
        });

        return [...groups.entries()]
            .map(([team, sections]) => {
                const normalizedSections = [...sections.entries()]
                    .map(([title, equipment]) => ({
                        title,
                        equipment: equipment.slice().sort(compareEquipmentHistoryItems),
                    }))
                    .sort((left, right) => compareEquipmentHistoryText(left.title, right.title));
                const equipment = normalizedSections.flatMap((section) => section.equipment);
                const runningCount = equipment.filter((item) => item.statusMeta?.isRunning).length;
                return {
                    team,
                    teamDataKey: resolveEquipmentHistoryTeamDataKey(team),
                    teamMeta: getEquipmentHistoryTeamMeta(team),
                    sortIndex: getEquipmentHistoryTeamSortIndex(team),
                    equipmentCount: equipment.length,
                    runningCount,
                    stoppedCount: equipment.length - runningCount,
                    sections: normalizedSections,
                };
            })
            .sort((left, right) => (left.sortIndex - right.sortIndex) || compareEquipmentHistoryText(left.team, right.team));
    }

    function getSelectedEquipment(items, selectedId) {
        return asList(items).find((item) => item.id === selectedId) || asList(items)[0] || null;
    }

    function buildOperationInfo(equipment) {
        return [
            { label: '설비명', value: equipment?.name || '' },
            { label: '관리팀', value: equipment?.team || '' },
            { label: '실', value: equipment?.room || '' },
            { label: '공정', value: equipment?.process || equipment?.group || '' },
            { label: '가동률', value: formatRateValue(equipment?.rate) },
            { label: '제조사', value: equipment?.manufacturer || '' },
        ];
    }

    function buildDetailInfo(equipment) {
        return [
            { label: '설비명', value: equipment?.name || '' },
            { label: '관리팀', value: equipment?.team || '' },
            { label: '실', value: equipment?.room || '' },
            { label: '공정', value: equipment?.process || equipment?.group || '' },
            { label: '가동률', value: formatRateValue(equipment?.rate) },
        ];
    }

    Object.assign(api, {
        escapeHtml,
        asList,
        normalizeText,
        parseRate,
        formatRateValue,
        getInfoValue,
        getEquipmentStatus,
        getEquipmentHistoryTeamMeta,
        normalizeEquipmentItems,
        groupEquipmentItems,
        getSelectedEquipment,
        buildOperationInfo,
        buildDetailInfo,
    });
})();
