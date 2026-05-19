        const WORK_TEAM_CALENDAR_OVERVIEW_KEY = 'work_team_calendar_overview';
        const WORK_PRODUCTION_ENTRY_LAST_MODIFIED_LABEL = '\uD300\uBCC4\uB0B4\uC5ED\uC11C';
        const WORK_PRODUCTION_ENTRY_INPUT_ID = 'work-production-entry-file-input';
        const WORK_PRODUCTION_IMPORT_CONTEXT = Object.freeze({
            TARGET_COLS: ['A', 'B', 'C', 'D', 'E', 'F'],
            HEADER_ROW: 3,
            DATA_START_ROW: 4,
            TEAM_VALUE_INDEX: 1,
            LINE_VALUE_INDEX: 2,
            PRODUCT_CODE_VALUE_INDEX: 3,
            PRODUCT_NAME_VALUE_INDEX: 4,
            PRODUCTION_VALUE_INDEX: 5,
            PRODUCTION_DATE_OFFSET_DAYS: 0,
            REQUIRED_HEADER_RULES: {
                A: [/생산일자/],
                B: [/팀/],
                C: [/라인명/, /라인/],
                D: [/코드/],
                E: [/품명/],
                F: [/생산량/]
            }
        });

        function refreshWorkProductionAfterMutation() {
            if (typeof refreshUtilProductionDailyIndex === 'function') {
                refreshUtilProductionDailyIndex();
            }
            if (typeof renderWorkTeamCalendarModal === 'function') {
                renderWorkTeamCalendarModal();
            }
        }

        function parseWorkProductionImportValue(value) {
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (value === null || value === undefined) return null;
            const text = String(value).trim();
            if (!text) return null;
            const match = text.replaceAll(',', '').match(/-?\d+(?:\.\d+)?/);
            if (!match) return null;
            const numeric = Number(match[0]);
            return Number.isFinite(numeric) ? numeric : null;
        }

        function getWorkProductionImportContext() {
            return {
                XLSX,
                ...WORK_PRODUCTION_IMPORT_CONTEXT,
                parseProductionValue: parseWorkProductionImportValue
            };
        }

        function getWorkProductionImportParsingApi() {
            return typeof KPIProductionExtractorImportParsing !== 'undefined'
                ? KPIProductionExtractorImportParsing
                : null;
        }

        function compareWorkProductionRowsByFallback(left, right) {
            const teamDiff = String(left?.teamKey || '').localeCompare(String(right?.teamKey || ''), 'ko');
            if (teamDiff !== 0) return teamDiff;
            const lineDiff = String(left?.lineKey || '').localeCompare(String(right?.lineKey || ''), 'ko');
            if (lineDiff !== 0) return lineDiff;
            const fileDiff = String(left?.fileName || '').localeCompare(String(right?.fileName || ''), 'ko');
            if (fileDiff !== 0) return fileDiff;
            const sheetDiff = String(left?.sheetName || '').localeCompare(String(right?.sheetName || ''), 'ko');
            if (sheetDiff !== 0) return sheetDiff;
            return (Number(left?.rowNumber) || 0) - (Number(right?.rowNumber) || 0);
        }

        function compareWorkProductionRowsByDateAsc(left, right) {
            if (left?.dateObj && right?.dateObj) {
                const diff = left.dateObj - right.dateObj;
                if (diff !== 0) return diff;
            } else if (!left?.dateObj && right?.dateObj) {
                return 1;
            } else if (left?.dateObj && !right?.dateObj) {
                return -1;
            }
            return compareWorkProductionRowsByFallback(left, right);
        }

        function buildWorkProductionFileMetaMap(files) {
            const map = new Map();
            (files || []).forEach(file => {
                const fileName = String(file?.name || '').trim();
                if (!fileName) return;
                const size = Number(file?.size) || 0;
                const lastModified = Number(file?.lastModified) || 0;
                map.set(fileName, {
                    fileName,
                    fingerprint: `${fileName.toLowerCase()}|${size}|${lastModified}`
                });
            });
            return map;
        }

        function buildWorkProductionBridgeRows(rows, files) {
            const fileMetaMap = buildWorkProductionFileMetaMap(files);
            const productionIndex = WORK_PRODUCTION_IMPORT_CONTEXT.PRODUCTION_VALUE_INDEX;
            const teamIndex = WORK_PRODUCTION_IMPORT_CONTEXT.TEAM_VALUE_INDEX;
            const lineIndex = WORK_PRODUCTION_IMPORT_CONTEXT.LINE_VALUE_INDEX;
            const productCodeIndex = WORK_PRODUCTION_IMPORT_CONTEXT.PRODUCT_CODE_VALUE_INDEX;
            const productNameIndex = WORK_PRODUCTION_IMPORT_CONTEXT.PRODUCT_NAME_VALUE_INDEX;
            return (rows || []).map(row => {
                const fileName = String(row?.fileName || '').trim();
                return {
                    date: row?.values?.[0] ?? '',
                    team: row?.values?.[teamIndex] ?? '',
                    lineName: row?.values?.[lineIndex] ?? '',
                    productCode: row?.productCode ?? row?.values?.[productCodeIndex] ?? '',
                    productName: row?.values?.[productNameIndex] ?? '',
                    amount: row?.values?.[productionIndex] ?? '',
                    moistureExcludedYield: row?.moistureExcludedYield ?? '',
                    workTime: row?.workTime ?? row?.inputTime ?? '',
                    operationTime: row?.operationTime ?? '',
                    equipmentCapa: row?.equipmentCapa ?? '',
                    equipmentUtilization: row?.equipmentUtilization ?? '',
                    sourceFileName: fileName,
                    sourceFingerprint: String(fileMetaMap.get(fileName)?.fingerprint || '')
                };
            });
        }

        function restoreWorkProductionImportSnapshot(snapshot) {
            if (!snapshot) return;
            if (Array.isArray(UTIL_PRODUCTION_DAILY_DATA)) {
                UTIL_PRODUCTION_DAILY_DATA.length = 0;
                snapshot.dailyData.forEach(item => UTIL_PRODUCTION_DAILY_DATA.push(item));
            }
            if (Array.isArray(UTIL_PRODUCTION_ARCHIVE_META)) {
                UTIL_PRODUCTION_ARCHIVE_META.length = 0;
                snapshot.archiveMeta.forEach(item => UTIL_PRODUCTION_ARCHIVE_META.push(item));
            }
            if (typeof UtilProductionState === 'object' && UtilProductionState) {
                UtilProductionState.startDay = snapshot.startDay;
            }
            if (typeof UTIL_PRODUCTION_DAILY_STATE === 'object' && UTIL_PRODUCTION_DAILY_STATE) {
                UTIL_PRODUCTION_DAILY_STATE.meta = snapshot.stateMeta;
                UTIL_PRODUCTION_DAILY_STATE.periodDefault = snapshot.periodDefault;
                UTIL_PRODUCTION_DAILY_STATE.teams = UTIL_PRODUCTION_DAILY_DATA;
                UTIL_PRODUCTION_DAILY_STATE.archives = UTIL_PRODUCTION_ARCHIVE_META;
            }
            if (typeof KpiUtilDataSyncBrowserAdapter !== 'undefined') {
                KpiUtilDataSyncBrowserAdapter.writeExistingPortalRecord?.('util_production_daily', UTIL_PRODUCTION_DAILY_STATE);
            }
            if (typeof refreshUtilProductionDailyIndex === 'function') refreshUtilProductionDailyIndex();
            if (typeof refreshUtilProductionArchiveCountBadges === 'function') refreshUtilProductionArchiveCountBadges();
        }

        async function importWorkProductionEntryFiles(fileList) {
            const files = Array.from(fileList || []).filter(Boolean);
            if (!files.length) return false;
            const parsingApi = getWorkProductionImportParsingApi();
            if (!parsingApi || typeof parsingApi.parseExcelFile !== 'function') {
                alert('생산량 기입 기능을 불러오지 못했습니다.');
                return false;
            }
            if (typeof mergeUtilProductionExtractorRows !== 'function') {
                alert('생산량 저장 기능을 불러오지 못했습니다.');
                return false;
            }

            const parseContext = getWorkProductionImportContext();
            const parsedResults = await Promise.all(files.map(async file => {
                try {
                    return {
                        ok: true,
                        fileName: String(file?.name || '').trim(),
                        parsed: await parsingApi.parseExcelFile(parseContext, file, DEFAULT_UTIL_PRODUCTION_PERIOD.startDay)
                    };
                } catch (error) {
                    return {
                        ok: false,
                        fileName: String(file?.name || '').trim(),
                        message: String(error?.message || '형식 오류')
                    };
                }
            }));
            const parsedFiles = parsedResults
                .filter(item => item.ok && item.parsed)
                .map(item => item.parsed);
            const failedFiles = parsedResults
                .filter(item => !item.ok)
                .map(item => ({
                    fileName: item.fileName || '이름 없는 파일',
                    message: item.message || '형식 오류'
                }));
            if (!parsedFiles.length) {
                const failedNames = failedFiles.map(item => item.fileName).filter(Boolean).join(', ');
                throw new Error(failedNames ? `형식 오류 파일: ${failedNames}` : '기입 가능한 생산량 데이터가 없습니다.');
            }

            let rows = [];
            parsedFiles.forEach(parsed => {
                rows.push(...(Array.isArray(parsed?.rows) ? parsed.rows : []));
            });
            const dedup = typeof parsingApi.deduplicateRows === 'function'
                ? parsingApi.deduplicateRows(parseContext, rows)
                : { rows, removedCount: 0 };
            rows = (dedup.rows || []).sort(compareWorkProductionRowsByDateAsc);

            const rollbackSnapshot = {
                dailyData: JSON.parse(JSON.stringify(UTIL_PRODUCTION_DAILY_DATA || [])),
                archiveMeta: JSON.parse(JSON.stringify(UTIL_PRODUCTION_ARCHIVE_META || [])),
                stateMeta: JSON.parse(JSON.stringify(UTIL_PRODUCTION_DAILY_STATE?.meta || {})),
                periodDefault: JSON.parse(JSON.stringify(UTIL_PRODUCTION_DAILY_STATE?.periodDefault || {})),
                startDay: UtilProductionState.startDay
            };

            try {
                const previousStartDay = UtilProductionState.startDay;
                UtilProductionState.startDay = DEFAULT_UTIL_PRODUCTION_PERIOD.startDay;
                const startDayChanged = previousStartDay !== UtilProductionState.startDay;
                const result = mergeUtilProductionExtractorRows(buildWorkProductionBridgeRows(rows, files), {
                    fallbackTeam: ''
                });
                let saved = true;
                if (startDayChanged && result.addedCount === 0 && result.patchedCount === 0 && result.replacedCount === 0) {
                    saved = await Promise.resolve(persistUtilProductionDailyState());
                } else if (result.savePromise && typeof result.savePromise.then === 'function') {
                    saved = await result.savePromise;
                }
                if (saved !== true) {
                    throw new Error('서버 저장이 완료되지 않았습니다.');
                }
                if (typeof setLastModified === 'function' && (result.addedCount > 0 || result.replacedCount > 0 || startDayChanged)) {
                    setLastModified(WORK_PRODUCTION_ENTRY_LAST_MODIFIED_LABEL);
                }
                refreshWorkProductionAfterMutation();
                const failedNotice = failedFiles.length
                    ? `, 형식 오류 제외 ${failedFiles.length.toLocaleString('ko-KR')}개`
                    : '';
                const patchedNotice = result.patchedCount > 0
                    ? `, 보조값 보완 ${result.patchedCount.toLocaleString('ko-KR')}건`
                    : '';
                const replacedNotice = result.replacedCount > 0
                    ? `, 기존 ${result.replacedCount.toLocaleString('ko-KR')}건 교체`
                    : '';
                alert(`기입 완료: ${result.addedCount.toLocaleString('ko-KR')}건 기입${replacedNotice}, 중복 제외 ${result.skippedCount.toLocaleString('ko-KR')}건${patchedNotice}${failedNotice}`);
                return true;
            } catch (error) {
                restoreWorkProductionImportSnapshot(rollbackSnapshot);
                throw error;
            }
        }

        function ensureWorkProductionEntryInput() {
            let input = document.getElementById(WORK_PRODUCTION_ENTRY_INPUT_ID);
            if (input) return input;
            input = document.createElement('input');
            input.id = WORK_PRODUCTION_ENTRY_INPUT_ID;
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.multiple = true;
            input.hidden = true;
            input.addEventListener('change', async () => {
                const files = Array.from(input.files || []);
                input.value = '';
                if (!files.length) return;
                try {
                    await importWorkProductionEntryFiles(files);
                } catch (error) {
                    alert(`생산량 기입 실패: ${error?.message || '알 수 없는 오류'}`);
                }
            });
            document.body.appendChild(input);
            return input;
        }

        function openWorkProductionEntryModal(event) {
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            ensureWorkProductionEntryInput().click();
            return true;
        }

        function getWorkProductionDeleteDefaults() {
            const dataKey = String(WorkState?.teamCalendarModal || WorkState?.teamCalendarHubDataKey || '').trim();
            const monthKey = typeof getWorkTeamCalendarActiveMonth === 'function'
                ? String(getWorkTeamCalendarActiveMonth(dataKey) || '').trim()
                : '';
            const category = typeof getWorkTeamCalendarCategory === 'function'
                ? getWorkTeamCalendarCategory(dataKey)
                : null;
            const teamName = isWorkTeamCalendarOverview(dataKey)
                ? '전체'
                : String(category?.title || '').trim();
            return {
                datasetKey: 'production',
                teamName,
                fromYm: monthKey,
                toYm: monthKey
            };
        }

        function openWorkProductionDeleteModal(event) {
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            if (event && typeof event.preventDefault === 'function') {
                event.preventDefault();
            }
            if (typeof openUtilSelectiveDeleteModal !== 'function') {
                alert('생산량 삭제 기능을 불러오지 못했습니다.');
                return false;
            }
            openUtilSelectiveDeleteModal({
                ...getWorkProductionDeleteDefaults(),
                onApplied: result => {
                    if (typeof setLastModified === 'function') {
                        setLastModified(WORK_PRODUCTION_ENTRY_LAST_MODIFIED_LABEL);
                    }
                    refreshWorkProductionAfterMutation();
                    if (result?.removedProductionCount > 0) {
                        alert(`생산량 ${result.removedProductionCount.toLocaleString('ko-KR')}건을 삭제했습니다.`);
                    }
                }
            });
            return true;
        }

        function renderWorkProductionActionMenuHtml(options = {}) {
            const disabled = options.disabled === true ? ' disabled' : '';
            const extraClass = options.summary === true ? ' is-summary' : '';
            return `
                <details class="work-team-calendar-production-action-menu${extraClass}">
                    <summary class="work-team-calendar-production-action-toggle" aria-label="생산량 관리">관리</summary>
                    <div class="work-team-calendar-production-action-list">
                        <button type="button" class="work-team-calendar-production-action-btn" data-work-production-action="entry" onclick="openWorkProductionEntryModal(event)"${disabled}>기입</button>
                        <button type="button" class="work-team-calendar-production-action-btn" data-work-production-action="delete" onclick="openWorkProductionDeleteModal(event)"${disabled}>삭제</button>
                    </div>
                </details>
            `;
        }

        function isWorkTeamCalendarOverview(dataKey) {
            return String(dataKey || '').trim() === WORK_TEAM_CALENDAR_OVERVIEW_KEY;
        }

        function shouldWorkTeamCalendarIncludeWasteSummary(dataKey) {
            const normalized = String(dataKey || '').trim();
            return normalized === WORK_TEAM_CALENDAR_OVERVIEW_KEY
                || normalized === 'work_team_calendar_team4'
                || normalized === 'work_team_calendar_group_bukjeong'
                || normalized === 'work_team_calendar_group_yusan';
        }

        function getWorkTeamCalendarWasteSiteLabels(dataKey) {
            const normalized = String(dataKey || '').trim();
            if (!normalized) return [];
            if (normalized === 'work_team_calendar_team4') {
                return ['유산', '북정'];
            }
            const labels = [];
            const seen = new Set();
            getWorkTeamCalendarSourceCategories(dataKey).forEach(category => {
                const sourceKey = String(category?.dataKey || '').trim();
                let siteLabel = '';
                if (sourceKey === 'work_team_calendar_team1_part1') {
                    siteLabel = '북정';
                } else if (
                    sourceKey === 'work_team_calendar_team1_part2'
                    || sourceKey === 'work_team_calendar_team2'
                    || sourceKey === 'work_team_calendar_team3'
                ) {
                    siteLabel = '유산';
                }
                if (!siteLabel || seen.has(siteLabel)) return;
                seen.add(siteLabel);
                labels.push(siteLabel);
            });
            return labels;
        }

        function getWorkTeamCalendarSourceCategories(dataKey) {
            const rawCategories = typeof getWorkTeamCalendarRawCategoryList === 'function'
                ? getWorkTeamCalendarRawCategoryList()
                : [];
            const sourceDataKeys = typeof resolveWorkTeamCalendarSourceDataKeys === 'function'
                ? resolveWorkTeamCalendarSourceDataKeys(dataKey)
                : [String(dataKey || '').trim()];
            return sourceDataKeys
                .map(sourceDataKey => rawCategories.find(category => String(category?.dataKey || '').trim() === sourceDataKey) || null)
                .filter(Boolean);
        }

        function getWorkTeamCalendarProductionSourceTeams(dataKey) {
            const seen = new Set();
            const sourceTeams = [];
            getWorkTeamCalendarSourceCategories(dataKey).forEach(category => {
                resolveUtilProductionSourceTeams(category?.title).forEach(sourceTeam => {
                    const normalized = normalizeUtilTeamName(sourceTeam);
                    if (!normalized || seen.has(normalized)) return;
                    seen.add(normalized);
                    sourceTeams.push(sourceTeam);
                });
            });
            return sourceTeams;
        }

        function getWorkTeamCalendarDisplayCategoryByTeamName(teamName) {
            const canonical = canonicalizeUtilTeamName(teamName);
            if (!canonical) return null;
            return getWorkTeamCalendarSourceCategories(WORK_TEAM_CALENDAR_OVERVIEW_KEY).find(category => (
                canonicalizeUtilTeamName(category?.title) === canonical
            )) || null;
        }

        function getWorkTeamCalendarProductionGroups(dataKey, dateKeys) {
            const category = getWorkTeamCalendarCategory(dataKey);
            const targets = normalizeWorkTeamCalendarDateKeys(dateKeys);
            if (!category || !targets.length) return [];
            const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
            const dateKeySet = new Set(targets);
            const seen = new Set();
            const grouped = new Map(targets.map(dateKey => [dateKey, []]));
            sourceTeams.forEach(sourceTeam => {
                const teamKey = normalizeUtilTeamName(sourceTeam);
                const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                entries.forEach(entry => {
                    const dateKey = String(entry?.dateLabel || '').trim();
                    if (!dateKeySet.has(dateKey)) return;
                    const amount = parseUtilAmount(entry?.amount);
                    const moistureExcludedYield = parseUtilPercentAmount(entry?.moistureExcludedYield);
                    const workTime = parseUtilAmount(entry?.workTime);
                    const operationTime = parseUtilAmount(entry?.operationTime);
                    const equipmentCapa = parseUtilAmount(entry?.equipmentCapa);
                    const equipmentUtilization = parseUtilPercentAmount(entry?.equipmentUtilization);
                    const dedupeKey = String(entry?.entryKey || '').trim() || [
                        dateKey,
                        String(entry?.teamName || sourceTeam || '').trim(),
                        String(entry?.lineName || '').trim(),
                        String(entry?.productCode || entry?.itemCode || '').trim(),
                        String(entry?.productName || '').trim(),
                        Number.isFinite(amount) ? amount : ''
                    ].join('::');
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    grouped.get(dateKey).push({
                        dateKey,
                        teamName: String(entry?.teamName || sourceTeam || '').trim(),
                        lineName: String(entry?.lineName || '').trim(),
                        productCode: String(entry?.productCode || entry?.itemCode || '').trim(),
                        productName: String(entry?.productName || '').trim(),
                        amount: Number.isFinite(amount) ? amount : null,
                        moistureExcludedYield: Number.isFinite(moistureExcludedYield) ? moistureExcludedYield : null,
                        workTime: Number.isFinite(workTime) ? workTime : null,
                        operationTime: Number.isFinite(operationTime) ? operationTime : null,
                        equipmentCapa: Number.isFinite(equipmentCapa) ? equipmentCapa : null,
                        equipmentUtilization: Number.isFinite(equipmentUtilization) ? equipmentUtilization : null,
                        entryKey: dedupeKey
                    });
                });
            });
            return targets.map(dateKey => {
                const items = grouped.get(dateKey) || [];
                items.sort((a, b) => {
                    const lineDiff = String(a.lineName || '').localeCompare(String(b.lineName || ''), 'ko');
                    if (lineDiff !== 0) return lineDiff;
                    return String(a.productName || '').localeCompare(String(b.productName || ''), 'ko');
                });
                return {
                    dateKey,
                    items,
                    ...summarizeWorkTeamCalendarProductionMetrics(items)
                };
            });
        }

        function renderWorkTeamCalendarProductionGroupsHtml(groups, category, summaryMap = null) {
            const list = Array.isArray(groups) ? groups : [];
            const emptyLabel = category?.emptyProductionLabel || '품목 미입력';
            if (!list.length) {
                return `<div class="work-team-calendar-production-empty">${escapeHtml(emptyLabel)}</div>`;
            }
            return list.map(group => {
                const items = Array.isArray(group?.items) ? group.items : [];
                const hasItems = items.length > 0;
                const groupSummary = summaryMap instanceof Map ? (summaryMap.get(String(group?.dateKey || '').trim()) || null) : null;
                const isOffday = !hasItems && !!groupSummary?.isOffday;
                const totalLabel = hasItems
                    ? `${items.length}건 · ${formatUtilNumber(group?.totalAmount || 0, 0)} kg`
                    : (isOffday ? '-' : emptyLabel);
                const metricLine = isOffday ? '휴무' : getWorkTeamCalendarProductionMetricLine(group);
                const rowsHtml = hasItems
                    ? items.map(item => {
                        const productName = item.productName || emptyLabel;
                        const productCode = String(item?.productCode || '').trim();
                        const itemYieldLabel = formatWorkTeamCalendarYieldLabel(item?.moistureExcludedYield);
                        const itemCapaLabel = formatWorkTeamCalendarCapaLabel(item?.equipmentCapa);
                        const itemUtilizationLabel = formatWorkTeamCalendarUtilizationLabel(item?.equipmentUtilization);
                        const itemWorkTimeLabel = formatWorkTeamCalendarWorkTimeLabel(item?.workTime);
                        const itemOperationTimeLabel = formatWorkTeamCalendarOperationTimeLabel(item?.operationTime);
                        const metricParts = [
                            itemYieldLabel || '수율 -',
                            itemCapaLabel || 'CAPA -',
                            itemUtilizationLabel || '가동률 -',
                            itemWorkTimeLabel || '조업시간 -',
                            itemOperationTimeLabel || '가동시간 -'
                        ];
                        const metricChipHtml = metricParts.map(label => `<span class="work-team-calendar-production-chip">${escapeHtml(label)}</span>`).join('');
                        const amountLabel = Number.isFinite(Number(item.amount))
                            ? `${formatUtilNumber(Number(item.amount), 0)} kg`
                            : '-';
                        return `
                            <div class="work-team-calendar-production-item">
                                <div class="work-team-calendar-production-main">
                                    <div class="work-team-calendar-production-name">${escapeHtml(productName)}</div>
                                    <div class="work-team-calendar-production-meta">${escapeHtml([
                                        item.lineName || '라인 미입력',
                                        productCode ? `코드 ${productCode}` : ''
                                    ].filter(Boolean).join(' · '))}</div>
                                    <div class="work-team-calendar-production-stat-row">${metricChipHtml}</div>
                                </div>
                                <div class="work-team-calendar-production-amount">${escapeHtml(amountLabel)}</div>
                            </div>
                        `;
                    }).join('')
                    : (
                        isOffday
                            ? `<div class="work-team-calendar-production-empty is-offday"><i class="fas fa-calendar-minus"></i><span>휴무</span></div>`
                            : `<div class="work-team-calendar-production-empty">${escapeHtml(emptyLabel)}</div>`
                    );
                return `
                    <div class="work-team-calendar-production-group ${isOffday ? 'is-offday' : ''}">
                        <div class="work-team-calendar-production-group-head">
                            <div class="work-team-calendar-production-count">${escapeHtml(totalLabel)}</div>
                        </div>
                        <div class="work-team-calendar-production-summary ${isOffday ? 'is-offday' : ''}">${escapeHtml(metricLine)}</div>
                        <div class="work-team-calendar-production-list">${rowsHtml}</div>
                    </div>
                `;
            }).join('');
        }

        function getWorkTeamCalendarProductionSummaryMap(dataKey, dateKeys) {
            const groups = getWorkTeamCalendarProductionGroups(dataKey, dateKeys);
            const summaryMap = new Map();
            groups.forEach(group => {
                const dateKey = String(group?.dateKey || '').trim();
                if (!dateKey) return;
                summaryMap.set(dateKey, {
                    count: Array.isArray(group?.items) ? group.items.length : 0,
                    leadProductName: String(group?.items?.[0]?.productName || '').trim(),
                    totalAmount: Number.isFinite(Number(group?.totalAmount)) ? Number(group.totalAmount) : 0,
                    moistureExcludedYieldRate: Number.isFinite(parseUtilPercentAmount(group?.moistureExcludedYieldRate)) ? parseUtilPercentAmount(group?.moistureExcludedYieldRate) : null,
                    totalEquipmentCapa: Number.isFinite(parseUtilAmount(group?.totalEquipmentCapa)) ? parseUtilAmount(group?.totalEquipmentCapa) : null,
                    utilizationRate: Number.isFinite(parseUtilPercentAmount(group?.utilizationRate)) ? parseUtilPercentAmount(group?.utilizationRate) : null,
                    totalWorkTime: Number.isFinite(parseUtilAmount(group?.totalWorkTime)) ? parseUtilAmount(group?.totalWorkTime) : null,
                    totalOperationTime: Number.isFinite(parseUtilAmount(group?.totalOperationTime)) ? parseUtilAmount(group?.totalOperationTime) : null,
                    isOffday: false
                });
            });
            // Collect ALL production dates for this team across all months
            const category = getWorkTeamCalendarCategory(dataKey);
            const allActiveDates = new Set();
            if (category) {
                const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
                sourceTeams.forEach(sourceTeam => {
                    const teamKey = normalizeUtilTeamName(sourceTeam);
                    const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                    entries.forEach(entry => {
                        const dk = String(entry?.dateLabel || '').trim();
                        if (dk) allActiveDates.add(dk);
                    });
                });
            }
            const sortedAllActive = Array.from(allActiveDates).sort();
            if (sortedAllActive.length >= 1) {
                const globalFirst = sortedAllActive[0];
                const globalLast = sortedAllActive[sortedAllActive.length - 1];
                summaryMap.forEach((summary, dateKey) => {
                    if (Number(summary?.count || 0) > 0) return;
                    if (dateKey > globalFirst && dateKey < globalLast) {
                        summary.isOffday = true;
                    }
                });
            }
            return summaryMap;
        }

        function getWorkTeamCalendarGasMode(dataKey = WorkState.teamCalendarModal) {
            const raw = String(WorkState.teamCalendarGasMode?.[dataKey] || 'all').trim().toLowerCase();
            return ['all', 'lng', 'lpg'].includes(raw) ? raw : 'all';
        }

        function setWorkTeamCalendarGasMode(mode, dataKey = WorkState.teamCalendarModal) {
            if (!dataKey) return;
            const normalized = ['all', 'lng', 'lpg'].includes(String(mode || '').trim().toLowerCase())
                ? String(mode || '').trim().toLowerCase()
                : 'all';
            WorkState.teamCalendarGasMode[dataKey] = normalized;
            renderWorkTeamCalendarModal();
        }

        function formatWorkTeamCalendarUtilityCostLabel(value) {
            const numeric = parseUtilAmount(value);
            if (!Number.isFinite(numeric)) return '-';
            return `${formatUtilNumber(numeric, 0)}원`;
        }

        function getWorkTeamCalendarUtilityTeamNamesForCategory(category, datasetKey) {
            const source = getUtilDatasetSourceByKey(datasetKey);
            if (!category || !Array.isArray(source) || !source.length) return [];
            const canonical = canonicalizeUtilTeamName(category.title);
            if (!canonical) return [];
            return source
                .map(item => String(item?.name || '').trim())
                .filter(Boolean)
                .filter(name => canonicalizeUtilTeamName(name) === canonical);
        }

        function getWorkTeamCalendarUtilityTeamNames(dataKey, datasetKey) {
            const categories = getWorkTeamCalendarSourceCategories(dataKey);
            const seen = new Set();
            const names = [];
            categories.forEach(category => {
                getWorkTeamCalendarUtilityTeamNamesForCategory(category, datasetKey).forEach(teamName => {
                    const normalized = normalizeUtilTeamName(teamName);
                    if (!normalized) return;
                    const dedupeKey = datasetKey === 'gas'
                        ? `${normalized}::${inferUtilFuelType(teamName) || String(teamName || '').trim().toLowerCase()}`
                        : normalized;
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    names.push(teamName);
                });
            });
            return names;
        }

        function buildWorkTeamCalendarElectricMonthSummary(teamNames, yearValue, monthValue) {
            let usageTotal = 0;
            let costTotal = 0;
            let hasUsage = false;
            let hasCost = false;
            (teamNames || []).forEach(teamName => {
                const row = findUtilDatasetMonthRow('electric', teamName, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (Number.isFinite(usageValue)) {
                    usageTotal += usageValue;
                    hasUsage = true;
                }
                if (Number.isFinite(costValue)) {
                    costTotal += costValue;
                    hasCost = true;
                }
            });
            const usageText = hasUsage ? formatUtilNumberWithUnit(usageTotal, 'kWh', 0) : '-';
            const costText = hasCost ? formatWorkTeamCalendarUtilityCostLabel(costTotal) : '-';
            return {
                usageText,
                costText,
                detailRows: (hasUsage || hasCost)
                    ? [{
                        label: '전력량',
                        metaText: hasCost ? costText : '',
                        valueText: usageText
                    }]
                    : []
            };
        }

        function buildWorkTeamCalendarGasMonthSummary(teamNames, yearValue, monthValue, mode = 'all') {
            const normalizedMode = ['all', 'lng', 'lpg'].includes(String(mode || '').trim().toLowerCase())
                ? String(mode || '').trim().toLowerCase()
                : 'all';
            let lngUsage = 0;
            let lpgUsage = 0;
            let totalCost = 0;
            let lngCost = 0;
            let lpgCost = 0;
            let hasLng = false;
            let hasLpg = false;
            let hasCost = false;
            let hasLngCost = false;
            let hasLpgCost = false;
            const availableModes = new Set();
            (teamNames || []).forEach(teamName => {
                const fuelType = inferUtilFuelType(teamName);
                if (fuelType) availableModes.add(fuelType);
                if (normalizedMode !== 'all' && fuelType && fuelType !== normalizedMode) return;
                const row = findUtilDatasetMonthRow('gas', teamName, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (fuelType === 'lpg') {
                    if (Number.isFinite(usageValue)) {
                        lpgUsage += usageValue;
                        hasLpg = true;
                    }
                } else {
                    if (Number.isFinite(usageValue)) {
                        lngUsage += usageValue;
                        hasLng = true;
                    }
                }
                if (Number.isFinite(costValue)) {
                    totalCost += costValue;
                    hasCost = true;
                    if (fuelType === 'lpg') {
                        lpgCost += costValue;
                        hasLpgCost = true;
                    } else {
                        lngCost += costValue;
                        hasLngCost = true;
                    }
                }
            });
            const usageParts = [];
            if (normalizedMode === 'lpg') {
                if (hasLpg) usageParts.push(`${formatUtilNumber(lpgUsage, 0)}kg`);
            } else if (normalizedMode === 'lng') {
                if (hasLng) usageParts.push(`${formatUtilNumber(lngUsage, 0)}m³`);
            } else {
                if (hasLng) usageParts.push(`LNG ${formatUtilNumber(lngUsage, 0)}m³`);
                if (hasLpg) usageParts.push(`LPG ${formatUtilNumber(lpgUsage, 0)}kg`);
            }
            const detailRows = [];
            if (hasLng) {
                detailRows.push({
                    label: 'LNG',
                    metaText: hasLngCost ? formatWorkTeamCalendarUtilityCostLabel(lngCost) : '',
                    valueText: `${formatUtilNumber(lngUsage, 0)}m³`
                });
            }
            if (hasLpg) {
                detailRows.push({
                    label: 'LPG',
                    metaText: hasLpgCost ? formatWorkTeamCalendarUtilityCostLabel(lpgCost) : '',
                    valueText: `${formatUtilNumber(lpgUsage, 0)}kg`
                });
            }
            return {
                usageText: usageParts.length ? usageParts.join(' · ') : '-',
                costText: hasCost ? formatWorkTeamCalendarUtilityCostLabel(totalCost) : '-',
                detailRows,
                availableModes: Array.from(availableModes),
                canSelect: availableModes.has('lng') && availableModes.has('lpg'),
                mode: normalizedMode
            };
        }

        function buildWorkTeamCalendarWasteMonthSummary(dataKey, yearValue, monthValue) {
            const siteLabels = getWorkTeamCalendarWasteSiteLabels(dataKey);
            let usageTotal = 0;
            let costTotal = 0;
            let hasUsage = false;
            let hasCost = false;
            siteLabels.forEach(siteLabel => {
                const row = findUtilDatasetMonthRow('waste', siteLabel, yearValue, monthValue);
                if (!row) return;
                const usageValue = parseUtilAmount(row?.usage);
                const costValue = parseUtilAmount(row?.costs?.total ?? row?.cost);
                if (Number.isFinite(usageValue)) {
                    usageTotal += usageValue;
                    hasUsage = true;
                }
                if (Number.isFinite(costValue)) {
                    costTotal += costValue;
                    hasCost = true;
                }
            });
            return {
                usageText: hasUsage
                    ? `${siteLabels.length > 1 ? '총 ' : ''}${formatUtilNumber(usageTotal, 0)}㎥`
                    : '-',
                costText: hasCost ? formatWorkTeamCalendarUtilityCostLabel(costTotal) : '-'
            };
        }

        function buildWorkTeamCalendarProductionMonthSummary(dataKey, monthKey) {
            const parsed = parseMonthKey(monthKey);
            if (!parsed) return { totalAmountText: '-', itemCountText: '-' };
            const category = getWorkTeamCalendarCategory(dataKey);
            if (!category) return { totalAmountText: '-', itemCountText: '-' };
            const sourceTeams = getWorkTeamCalendarProductionSourceTeams(dataKey);
            const prefix = `${parsed.year}-${String(parsed.monthIndex + 1).padStart(2, '0')}`;
            let totalAmount = 0;
            let itemCount = 0;
            const seen = new Set();
            sourceTeams.forEach(sourceTeam => {
                const teamKey = normalizeUtilTeamName(sourceTeam);
                const entries = Array.isArray(UTIL_PRODUCTION_DAILY_INDEX?.[teamKey]) ? UTIL_PRODUCTION_DAILY_INDEX[teamKey] : [];
                entries.forEach(entry => {
                    const dateKey = String(entry?.dateLabel || '').trim();
                    if (!dateKey.startsWith(prefix)) return;
                    const dedupeKey = String(entry?.entryKey || '').trim() || [
                        dateKey,
                        String(entry?.teamName || sourceTeam || '').trim(),
                        String(entry?.lineName || '').trim(),
                        String(entry?.productCode || entry?.itemCode || '').trim(),
                        String(entry?.productName || '').trim()
                    ].join('::');
                    if (seen.has(dedupeKey)) return;
                    seen.add(dedupeKey);
                    const amount = parseUtilAmount(entry?.amount);
                    if (Number.isFinite(amount)) totalAmount += amount;
                    itemCount += 1;
                });
            });
            return {
                totalAmountText: totalAmount > 0 ? `${formatUtilNumber(totalAmount, 0)}kg` : '-',
                itemCountText: itemCount > 0 ? `${formatUtilNumber(itemCount, 0)}품목` : '-'
            };
        }
