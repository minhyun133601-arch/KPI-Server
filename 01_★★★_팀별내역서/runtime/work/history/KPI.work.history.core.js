(function initKpiWorkHistoryCore() {
    const history = window.KpiWorkHistory || {};

    const DATA_KEY = 'work_history_records';
    const TEAM_KEYS = ['team1part1', 'team1part2', 'team2', 'team3', 'team4'];
    const TEAM_DATA_VAR_NAMES = Object.freeze({
        team1part1: 'Team1Part1Data',
        team1part2: 'Team1Part2Data',
        team2: 'Team2Data',
        team3: 'Team3Data',
        team4: 'Team4Data'
    });
    const TeamInfo = Object.freeze({
        team1part1: { name: '1팀 1파트', desc: '건조', class: 'team1part1' },
        team1part2: { name: '1팀 2파트', desc: '건조', class: 'team1part2' },
        team2: { name: '2팀', desc: '스틱·소포장', class: 'team2' },
        team3: { name: '3팀', desc: '액상', class: 'team3' },
        team4: { name: '공무환경팀', desc: '폐수 · 전체 · 기타', class: 'team4' }
    });
    const LOCAL_BACKUP_KEY = `workhistory:${DATA_KEY}`;
    const ATTACHMENT_SLOT_KEYS = ['billing', 'report'];
    const ATTACHMENT_SLOT_META = Object.freeze({
        billing: {
            label: '청구서',
            fileCategory: 'billing_pdf'
        },
        report: {
            label: '보고서',
            fileCategory: 'report_pdf'
        }
    });
    const KPI_FLAG_LABEL = '★';
    const KPI_FLAG_PILL_LABEL = '★';
    const IMPORTANT_FLAG_LABEL = '★';
    const IMPORTANT_FLAG_PILL_LABEL = '★';
    const ACTUAL_ACHIEVEMENT_RULES = Object.freeze([]);
    const RECORD_CATEGORY_GROUP_ORDER = Object.freeze(['kpi', 'focus', 'report']);
    const RECORD_CATEGORY_GROUPS = Object.freeze({
        kpi: Object.freeze({
            label: 'KPI',
            categories: Object.freeze([
                '설비 가동률 증대',
                '자체 정비',
                '계획 이행률',
                '건조기 설치',
                '법규 준수'
            ])
        }),
        focus: Object.freeze({
            label: '중점 추진 과제',
            categories: Object.freeze([
                '모니터링 운영 체계',
                '데이터 관리 체계',
                '법규 리스크 제로'
            ])
        }),
        report: Object.freeze({
            label: '보고',
            categories: Object.freeze([])
        })
    });
    const RECORD_CATEGORY_ALIAS_MAP = Object.freeze({
        '계획 이행': '계획 이행률',
        '운영 체계 구축': '모니터링 운영 체계'
    });
    const RECORD_CATEGORY_OPTIONS = Object.freeze(
        RECORD_CATEGORY_GROUP_ORDER.flatMap(groupKey => RECORD_CATEGORY_GROUPS[groupKey]?.categories || [])
    );

    const state = history.state || {
        loaded: false,
        payload: null,
        shadowHost: null,
        shadowRoot: null,
        currentTeam: 'overview',
        currentKeyword: '',
        currentCategoryFilter: '',
        pendingDelete: { team: null, index: null },
        formState: {
            sourceTeam: '',
            existingAttachments: {
                billing: null,
                report: null
            },
            pendingFiles: {
                billing: null,
                report: null
            },
            removedAttachments: []
        },
        toastTimer: null
    };
    if (typeof state.currentCategoryFilter !== 'string') state.currentCategoryFilter = '';

    const writeState = history.writeState || {
        timer: null,
        payload: null,
        flushPromise: Promise.resolve(true),
        writeChain: Promise.resolve(true)
    };

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value ?? null));
    }

    function getTimeValue(value) {
        const timeValue = Date.parse(String(value || ''));
        return Number.isFinite(timeValue) ? timeValue : 0;
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(value);
        return div.innerHTML;
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/"/g, '&quot;');
    }

    function normalizeCost(value) {
        if (value === null || value === undefined || value === '') return null;
        const normalized = Number(String(value).replace(/,/g, ''));
        return Number.isFinite(normalized) ? normalized : null;
    }

    function normalizeAssignees(value) {
        const items = Array.isArray(value) ? value : String(value || '').split(/[\n,\/;]+/);
        return items.map(item => String(item || '').trim()).filter(Boolean);
    }

    function normalizeRecordCategoryAlias(value) {
        const rawValue = String(value || '').trim();
        if (!rawValue) return '';
        return RECORD_CATEGORY_ALIAS_MAP[rawValue] || rawValue;
    }

    function getRecordCategoryGroupKeyByCategory(value) {
        const normalizedCategory = normalizeRecordCategoryAlias(value);
        return RECORD_CATEGORY_GROUP_ORDER.find(groupKey => (
            RECORD_CATEGORY_GROUPS[groupKey]?.categories?.includes(normalizedCategory)
        )) || '';
    }

    function isAllowedRecordCategory(value) {
        return RECORD_CATEGORY_OPTIONS.includes(normalizeRecordCategoryAlias(value));
    }

    function normalizeRecordCategory(value, options = {}) {
        const rawValue = String(value || '').trim();
        if (!rawValue || rawValue === 'KPI' || rawValue === '없음') return '';
        const normalizedValue = normalizeRecordCategoryAlias(rawValue);
        if (isAllowedRecordCategory(normalizedValue)) return normalizedValue;
        return options.preserveLegacy === false ? '' : rawValue;
    }

    function normalizeRecordCategoryGroup(value, options = {}) {
        const rawValue = String(value || '').trim();
        const lowerValue = rawValue.toLowerCase();
        if (RECORD_CATEGORY_GROUPS[lowerValue]) {
            return lowerValue;
        }
        const matchedGroupKey = RECORD_CATEGORY_GROUP_ORDER.find(groupKey => (
            RECORD_CATEGORY_GROUPS[groupKey]?.label === rawValue
        ));
        if (matchedGroupKey) {
            return matchedGroupKey;
        }

        const categoryGroupKey = getRecordCategoryGroupKeyByCategory(options.category);
        if (categoryGroupKey) {
            return categoryGroupKey;
        }

        if (String(options.category || '').trim()) {
            return options.kpi === true ? 'kpi' : 'focus';
        }

        if (options.kpi === true) {
            return 'kpi';
        }

        return options.preserveLegacy === false ? '' : '';
    }

    function getRecordCategoryGroupOptions() {
        return RECORD_CATEGORY_GROUP_ORDER.map(groupKey => ({
            value: groupKey,
            label: RECORD_CATEGORY_GROUPS[groupKey]?.label || groupKey,
            categories: [...(RECORD_CATEGORY_GROUPS[groupKey]?.categories || [])]
        }));
    }

    function getRecordCategoryOptionsForGroup(groupKey, options = {}) {
        const normalizedGroupKey = normalizeRecordCategoryGroup(groupKey, options);
        const categories = normalizedGroupKey
            ? [...(RECORD_CATEGORY_GROUPS[normalizedGroupKey]?.categories || [])]
            : [];
        const legacyCategory = String(options.includeLegacyValue || '').trim();
        if (legacyCategory && !categories.includes(legacyCategory)) {
            categories.push(legacyCategory);
        }
        return categories;
    }

    function getRecordCategoryGroupLabel(recordOrGroupKey, options = {}) {
        const isRecordObject = recordOrGroupKey && typeof recordOrGroupKey === 'object';
        const groupKey = normalizeRecordCategoryGroup(
            isRecordObject ? (recordOrGroupKey.categoryGroup || recordOrGroupKey.categoryType || '') : recordOrGroupKey,
            {
                ...options,
                category: isRecordObject ? recordOrGroupKey.category : options.category,
                kpi: isRecordObject ? isKpiRecord(recordOrGroupKey) : options.kpi
            }
        );
        return groupKey ? (RECORD_CATEGORY_GROUPS[groupKey]?.label || '') : '';
    }

    function isReportRecord(record) {
        return normalizeRecordCategoryGroup(record?.categoryGroup || record?.categoryType, {
            category: record?.category,
            kpi: isKpiRecord(record)
        }) === 'report';
    }

    function normalizeAchievementText(value) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    function isAchievementRecord(record) {
        const team = String(record?.team || '').trim();
        const startDate = String(record?.startDate || record?.date || record?.weekStart || '').trim();
        const endDate = String(record?.endDate || record?.date || record?.weekEnd || record?.weekStart || '').trim();
        const workContent = normalizeAchievementText(record?.workContent || record?.currentWork || '');
        if (!workContent) return false;
        return ACTUAL_ACHIEVEMENT_RULES.some((rule) => {
            if (rule.team && team !== rule.team) return false;
            if (rule.startDate && startDate !== rule.startDate) return false;
            if (rule.endDate && endDate !== rule.endDate) return false;
            return Array.isArray(rule.workIncludes)
                && rule.workIncludes.every(fragment => workContent.includes(normalizeAchievementText(fragment)));
        });
    }

    function isImportantRecord(record) {
        return isAchievementRecord(record);
    }

    function isKpiRecord(record) {
        const rawKpi = record?.kpi;
        const explicitKpi = rawKpi === true
            || rawKpi === 1
            || String(rawKpi || '').trim().toLowerCase() === 'true'
            || String(rawKpi || '').trim() === '1';
        if (explicitKpi) return true;
        return String(record?.category || '').trim() === 'KPI';
    }

    function getRecordTagLabels(record, options = {}) {
        const includeKpi = options.includeKpi !== false;
        const includeCategory = options.includeCategory !== false;
        const includeGroup = options.includeGroup !== false;
        const preserveLegacy = options.preserveLegacy !== false;
        const labels = [];
        if (includeKpi && isImportantRecord(record)) {
            labels.push(IMPORTANT_FLAG_LABEL);
        }
        const category = normalizeRecordCategory(record?.category, { preserveLegacy });
        if (includeCategory && category) {
            labels.push(category);
        } else if (includeGroup) {
            const groupLabel = getRecordCategoryGroupLabel(record, {
                category,
                kpi: isKpiRecord(record)
            });
            if (groupLabel) {
                labels.push(groupLabel);
            }
        }
        return labels;
    }

    function formatRecordTagText(record, options = {}) {
        return getRecordTagLabels(record, options).join(options.separator || ' · ');
    }

    function normalizeAttachmentLegacy(item) {
        if (!item) return null;
        if (typeof item === 'string') {
            const storedName = item.split('/').pop();
            return {
                originalName: storedName || '첨부파일',
                storedName: storedName || '',
                url: item.startsWith('/') ? item : `/attachments/${storedName}`,
                previewUrl: item.startsWith('/') ? item : `/attachments/${storedName}`,
                downloadUrl: item.startsWith('/') ? item : `/attachments/${storedName}`,
                size: 0,
                mimeType: '',
                documentId: '',
                storageRelPath: '',
                fileCategory: ''
            };
        }

        const storedName = String(item.storedName || '').trim() || (item.url ? String(item.url).split('/').pop() : '');
        const documentId = String(item.documentId || item.fileId || '').trim();
        const url = String(item.url || item.previewUrl || item.viewUrl || (documentId ? `/api/files/${documentId}/view` : '')).trim();
        const downloadUrl = String(item.downloadUrl || (documentId ? `/api/files/${documentId}/download` : url)).trim();
        if (!storedName && !documentId && !url) return null;

        return {
            originalName: String(item.originalName || item.name || storedName || documentId || '첨부파일').trim(),
            storedName,
            url,
            previewUrl: String(item.previewUrl || item.viewUrl || url).trim(),
            downloadUrl,
            size: Number(item.size) || 0,
            mimeType: String(item.mimeType || '').trim(),
            documentId,
            storageRelPath: String(item.storageRelPath || item.storage_rel_path || '').trim(),
            fileCategory: String(item.fileCategory || item.file_category || '').trim()
        };
    }

    function createEmptyAttachmentSlots() {
        return Object.fromEntries(ATTACHMENT_SLOT_KEYS.map(slotKey => [slotKey, null]));
    }

    function normalizeAttachment(item, fallbackType = '') {
        if (!item) return null;
        const normalizedType = ATTACHMENT_SLOT_KEYS.includes(String(item?.attachmentType || item?.type || fallbackType).trim())
            ? String(item.attachmentType || item.type || fallbackType).trim()
            : '';
        if (typeof item === 'string') {
            const storedName = item.split('/').pop();
            return {
                originalName: storedName || '첨부파일',
                storedName: storedName || '',
                url: item.startsWith('/') ? item : `/attachments/${storedName}`,
                previewUrl: item.startsWith('/') ? item : `/attachments/${storedName}`,
                downloadUrl: item.startsWith('/') ? item : `/attachments/${storedName}`,
                size: 0,
                mimeType: '',
                documentId: '',
                attachmentType: normalizedType
            };
        }

        const storedName = String(item.storedName || '').trim() || (item.url ? String(item.url).split('/').pop() : '');
        const documentId = String(item.documentId || item.fileId || '').trim();
        const url = String(item.url || item.previewUrl || item.viewUrl || (documentId ? `/api/files/${documentId}/view` : '')).trim();
        const downloadUrl = String(item.downloadUrl || (documentId ? `/api/files/${documentId}/download` : url)).trim();
        if (!storedName && !documentId && !url) return null;

        return {
            originalName: String(item.originalName || item.name || storedName || documentId || '첨부파일').trim(),
            storedName,
            url,
            previewUrl: String(item.previewUrl || item.viewUrl || url).trim(),
            downloadUrl,
            size: Number(item.size) || 0,
            mimeType: String(item.mimeType || '').trim(),
            documentId,
            attachmentType: normalizedType,
            storageRelPath: String(item.storageRelPath || item.storage_rel_path || '').trim(),
            fileCategory: String(item.fileCategory || item.file_category || '').trim()
        };
    }

    function flattenAttachmentSlots(slots) {
        const source = slots && typeof slots === 'object' ? slots : {};
        return ATTACHMENT_SLOT_KEYS
            .map(slotKey => normalizeAttachment(source[slotKey], slotKey))
            .filter(Boolean);
    }

    function normalizeAttachmentSlots(input, legacyAttachments = []) {
        const slots = createEmptyAttachmentSlots();
        const source = input && typeof input === 'object' && !Array.isArray(input)
            ? input
            : {};
        ATTACHMENT_SLOT_KEYS.forEach(slotKey => {
            const normalized = normalizeAttachment(source[slotKey], slotKey);
            if (normalized) {
                normalized.attachmentType = slotKey;
                slots[slotKey] = normalized;
            }
        });

        const legacy = Array.isArray(legacyAttachments)
            ? legacyAttachments.map(item => normalizeAttachment(item)).filter(Boolean)
            : [];
        legacy.forEach((attachment) => {
            const explicitType = ATTACHMENT_SLOT_KEYS.includes(String(attachment.attachmentType || '').trim())
                ? String(attachment.attachmentType).trim()
                : '';
            const slotKey = explicitType || (!slots.report ? 'report' : (!slots.billing ? 'billing' : ''));
            if (!slotKey || slots[slotKey]) return;
            slots[slotKey] = {
                ...attachment,
                attachmentType: slotKey
            };
        });

        return slots;
    }

    function getRecordAttachments(record) {
        const slotSource = record?.attachmentSlots && typeof record.attachmentSlots === 'object'
            ? record.attachmentSlots
            : null;
        if (slotSource) {
            return flattenAttachmentSlots(slotSource);
        }
        return Array.isArray(record?.attachments)
            ? record.attachments.map(item => normalizeAttachment(item)).filter(Boolean)
            : [];
    }

    function getRecordAttachment(record, slotKey) {
        const normalizedSlotKey = ATTACHMENT_SLOT_KEYS.includes(String(slotKey || '').trim())
            ? String(slotKey).trim()
            : '';
        if (!normalizedSlotKey) return null;
        const slots = normalizeAttachmentSlots(record?.attachmentSlots, record?.attachments);
        const attachment = slots[normalizedSlotKey];
        return attachment ? { ...attachment, attachmentType: normalizedSlotKey } : null;
    }

    function normalizeRecord(record, fallbackTeam) {
        const assignees = normalizeAssignees(record?.assignees || record?.assignee || record?.worker || '');
        const category = normalizeRecordCategory(record?.category);
        const categoryGroup = normalizeRecordCategoryGroup(
            record?.categoryGroup || record?.categoryType,
            {
                category: category || record?.category,
                kpi: isKpiRecord(record)
            }
        );
        const attachmentSlots = normalizeAttachmentSlots(
            record?.attachmentSlots || {
                billing: record?.billingAttachment || record?.billingDocument || null,
                report: record?.reportAttachment || record?.reportDocument || null
            },
            record?.attachments
        );
        return {
            team: TeamInfo[record?.team] ? String(record.team) : fallbackTeam,
            startDate: String(record?.startDate || record?.weekStart || record?.date || '').trim(),
            endDate: String(record?.endDate || record?.weekEnd || record?.date || record?.weekStart || '').trim(),
            plannedEndDate: String(record?.plannedEndDate || record?.expectedEndDate || '').trim(),
            categoryGroup,
            category,
            kpi: isKpiRecord(record),
            assignees,
            assignee: assignees.join(', '),
            workContent: String(record?.workContent || record?.currentWork || '').trim(),
            remarks: String(record?.remarks || '').trim(),
            attachmentSlots,
            billingAttachment: attachmentSlots.billing ? { ...attachmentSlots.billing } : null,
            reportAttachment: attachmentSlots.report ? { ...attachmentSlots.report } : null,
            attachments: flattenAttachmentSlots(attachmentSlots),
            cost: normalizeCost(record?.cost)
        };
    }

    function createDefaultPayload() {
        return {
            meta: {
                moduleKey: DATA_KEY,
                moduleName: '팀별내역서 - 작업내역',
                version: 1,
                updatedAt: new Date().toISOString()
            },
            teams: Object.fromEntries(TEAM_KEYS.map(team => [team, []]))
        };
    }

    function normalizePayload(payload) {
        const nextPayload = payload && typeof payload === 'object'
            ? cloneJson(payload)
            : createDefaultPayload();
        nextPayload.meta = nextPayload.meta && typeof nextPayload.meta === 'object'
            ? nextPayload.meta
            : {};
        nextPayload.meta.moduleKey = DATA_KEY;
        nextPayload.meta.moduleName = String(nextPayload.meta.moduleName || '팀별내역서 - 작업내역').trim();
        nextPayload.meta.version = Number(nextPayload.meta.version) || 1;
        nextPayload.meta.updatedAt = String(nextPayload.meta.updatedAt || new Date().toISOString()).trim();
        const sourceTeams = nextPayload.teams && typeof nextPayload.teams === 'object'
            ? nextPayload.teams
            : {};
        nextPayload.teams = Object.fromEntries(
            TEAM_KEYS.map(team => [
                team,
                Array.isArray(sourceTeams[team])
                    ? sourceTeams[team].map(record => normalizeRecord(record, team)).filter(record => record.startDate && record.endDate && record.team)
                    : []
            ])
        );
        return nextPayload;
    }

    function getShadowRoot() {
        return state.shadowRoot || state.shadowHost?.shadowRoot || null;
    }

    function getElement(id) {
        return getShadowRoot()?.getElementById(id) || null;
    }

    function queryAll(selector) {
        return Array.from(getShadowRoot()?.querySelectorAll(selector) || []);
    }

    function setShadowHost(host) {
        state.shadowHost = host || null;
        state.shadowRoot = host?.shadowRoot || null;
    }

    function getRecordRuntimeConfig() {
        const workRuntime = window.__KPI_SERVER_RUNTIME_CONFIG__?.work;
        const record = workRuntime?.records?.[DATA_KEY];
        if (!record) return null;
        return {
            enabled: workRuntime?.enabled === true,
            apiBase: String(record.apiBase || workRuntime.apiBase || '/api').trim() || '/api',
            moduleKey: String(record.moduleKey || workRuntime.moduleKey || 'portal_data').trim() || 'portal_data',
            recordKey: String(record.recordKey || DATA_KEY).trim() || DATA_KEY,
            permissionKey: String(record.permissionKey || workRuntime.defaultPermissionKey || '').trim(),
            readEnabled: record.readEnabled === true,
            writeEnabled: record.writeEnabled === true
        };
    }

    function getAssetRuntimeConfig() {
        const workRuntime = window.__KPI_SERVER_RUNTIME_CONFIG__?.work;
        const assets = workRuntime?.assets;
        const record = getRecordRuntimeConfig();
        return {
            enabled: workRuntime?.enabled === true,
            apiBase: String(workRuntime?.apiBase || record?.apiBase || '/api').trim() || '/api',
            permissionKey: String(assets?.permissionKey || record?.permissionKey || workRuntime?.defaultPermissionKey || '').trim(),
            readEnabled: assets?.readEnabled === true || record?.readEnabled === true,
            writeEnabled: assets?.writeEnabled === true || record?.writeEnabled === true,
            ownerDomain: String(assets?.ownerDomain || 'work.history').trim() || 'work.history',
            fileCategory: String(assets?.fileCategory || 'attachment').trim() || 'attachment'
        };
    }

    function getSeedPayload() {
        const portalData = window.PortalData && typeof window.PortalData === 'object'
            ? window.PortalData
            : null;
        if (portalData && Object.prototype.hasOwnProperty.call(portalData, DATA_KEY)) {
            return portalData[DATA_KEY];
        }
        return createDefaultPayload();
    }

    function syncPortalDataCache(payload) {
        window.PortalData = window.PortalData || {};
        window.PortalData[DATA_KEY] = cloneJson(payload);
    }

    function loadData() {
        if (state.loaded && state.payload) return state.payload;
        let seedPayload = null;
        let localPayload = null;
        try {
            seedPayload = getSeedPayload();
        } catch (_error) {
            seedPayload = null;
        }
        const stored = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (stored) {
            try {
                localPayload = JSON.parse(stored);
            } catch (_error) {
                localPayload = null;
            }
        }
        let payload = seedPayload;
        if (!payload || (localPayload && getTimeValue(localPayload?.meta?.updatedAt) > getTimeValue(seedPayload?.meta?.updatedAt))) {
            payload = localPayload;
        }
        state.payload = normalizePayload(payload);
        syncPortalDataCache(state.payload);
        state.loaded = true;
        return state.payload;
    }

    function getPayload() {
        return loadData();
    }

    function replacePayload(payload) {
        state.payload = normalizePayload(payload);
        state.loaded = true;
        syncPortalDataCache(state.payload);
        return state.payload;
    }

    function getTeamRecords(team) {
        const payload = getPayload();
        return payload.teams[team] || [];
    }

    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = String(reader.result || '');
                const commaIndex = result.indexOf(',');
                resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
            };
            reader.onerror = () => reject(reader.error || new Error('work_history_attachment_read_failed'));
            reader.readAsDataURL(file);
        });
    }

    function buildAttachmentOwnerKey(team, startDate, attachmentType) {
        const teamKey = String(team || 'unassigned').trim() || 'unassigned';
        const dateKey = String(startDate || '').trim() || 'undated';
        const slotKey = ATTACHMENT_SLOT_KEYS.includes(String(attachmentType || '').trim())
            ? String(attachmentType).trim()
            : 'report';
        const nonce = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
        return `${DATA_KEY}:${teamKey}:${slotKey}:${dateKey}:${nonce}`;
    }

    function formatAttachmentFileName(context, slotMeta, fallbackName) {
        const teamKey = String(context?.team || '').trim();
        const teamLabel = TeamInfo[teamKey]?.name || teamKey || '팀';
        const startDate = String(context?.startDate || '').trim();
        const endDate = String(context?.endDate || '').trim();
        const dateLabel = startDate && endDate
            ? `${startDate}~${endDate}`
            : (startDate || endDate || '날짜미정');
        const slotLabel = String(slotMeta?.label || '').trim() || '첨부';
        const nameBody = `${teamLabel} ${dateLabel} ${slotLabel}`.trim();
        const safeBody = nameBody.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_');
        return `${safeBody}.pdf`;
    }

    async function uploadPendingAttachments(files, context = {}) {
        const assetRuntime = getAssetRuntimeConfig();
        if (!Array.isArray(files) || !files.length) return [];
        if (!assetRuntime || assetRuntime.writeEnabled !== true || typeof fetch !== 'function') {
            throw new Error('attachment_upload_unavailable');
        }

        const attachmentType = ATTACHMENT_SLOT_KEYS.includes(String(context.attachmentType || '').trim())
            ? String(context.attachmentType).trim()
            : 'report';
        const slotMeta = ATTACHMENT_SLOT_META[attachmentType] || ATTACHMENT_SLOT_META.report;
        const uploaded = [];
        for (const file of files) {
            const originalName = formatAttachmentFileName(context, slotMeta, file?.name);
            const mimeType = String(file?.type || '').trim() || 'application/octet-stream';
            const isPdf = /\.pdf$/i.test(originalName) || mimeType === 'application/pdf';
            if (!isPdf) {
                throw new Error('attachment_pdf_only');
            }
            const base64Data = await readFileAsBase64(file);
            const response = await fetch(`${assetRuntime.apiBase.replace(/\/+$/, '')}/files/base64`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissionKey: assetRuntime.permissionKey,
                    ownerDomain: 'work.history',
                    ownerKey: buildAttachmentOwnerKey(context.team, context.startDate, attachmentType),
                    fileCategory: slotMeta.fileCategory || assetRuntime.fileCategory,
                    originalName,
                    mimeType,
                    base64Data,
                    metadata: {
                        dataKey: DATA_KEY,
                        team: String(context.team || '').trim(),
                        startDate: String(context.startDate || '').trim(),
                        endDate: String(context.endDate || '').trim(),
                        originalName,
                        attachmentType,
                        folder: `${String(context.team || 'unassigned').trim() || 'unassigned'}/${attachmentType}`
                    }
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result?.ok || !result.document?.id) {
                throw new Error(result?.error || `http_${response.status}`);
            }

            const documentRecord = result.document;
            uploaded.push(normalizeAttachment({
                originalName: documentRecord.original_name || originalName,
                storedName: documentRecord.stored_name || '',
                url: documentRecord.preview_url || `/api/files/${documentRecord.id}/view`,
                previewUrl: documentRecord.preview_url || `/api/files/${documentRecord.id}/view`,
                downloadUrl: documentRecord.download_url || `/api/files/${documentRecord.id}/download`,
                size: Number(documentRecord.file_size_bytes) || file.size || 0,
                mimeType: documentRecord.mime_type || mimeType,
                documentId: String(documentRecord.id || '').trim(),
                attachmentType,
                storageRelPath: String(documentRecord.storage_rel_path || ''),
                fileCategory: String(documentRecord.file_category || slotMeta.fileCategory || '')
            }));
        }
        return uploaded;
    }

    async function deleteAttachmentsFromServer(attachments) {
        const documents = Array.isArray(attachments)
            ? attachments.map(normalizeAttachment).filter(Boolean)
            : flattenAttachmentSlots(attachments);
        if (!documents.length || typeof fetch !== 'function') return;

        for (const attachment of documents) {
            const documentId = String(attachment.documentId || '').trim();
            if (!documentId) continue;
            try {
                const response = await fetch(`/api/files/${encodeURIComponent(documentId)}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                if (!response.ok && response.status !== 404) {
                    throw new Error(`http_${response.status}`);
                }
            } catch (error) {
                console.warn('[kpi] work history attachment delete failed', documentId, error);
            }
        }
    }

    function queueServerWrite(payload) {
        const runtime = getRecordRuntimeConfig();
        if (!(window.KpiRuntime?.canUseServerWrite?.(runtime?.writeEnabled === true))) {
            return Promise.resolve(false);
        }

        writeState.payload = normalizePayload(payload);
        if (writeState.timer) {
            clearTimeout(writeState.timer);
        }

        writeState.flushPromise = new Promise((resolve) => {
            writeState.timer = setTimeout(() => {
                const nextPayload = cloneJson(writeState.payload);
                writeState.timer = null;
                writeState.writeChain = Promise.resolve(writeState.writeChain)
                    .catch(() => false)
                    .then(async () => {
                        try {
                            const response = await fetch(`${runtime.apiBase.replace(/\/+$/, '')}/modules/${encodeURIComponent(runtime.moduleKey)}/records/${encodeURIComponent(runtime.recordKey)}`, {
                                method: 'PUT',
                                credentials: 'same-origin',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    permissionKey: runtime.permissionKey,
                                    payload: nextPayload
                                })
                            });
                            if (!response.ok) {
                                throw new Error(`http_${response.status}`);
                            }
                            const result = await response.json();
                            if (result?.record?.payload) {
                                replacePayload(result.record.payload);
                            }
                            window.__KPI_WORK_HISTORY_LAST_ERROR__ = null;
                            return true;
                        } catch (error) {
                            window.__KPI_WORK_HISTORY_LAST_ERROR__ = {
                                dataKey: DATA_KEY,
                                message: String(error?.message || 'work_history_server_write_failed'),
                                savedAt: new Date().toISOString()
                            };
                            console.warn('[kpi] work history server write failed', error);
                            return false;
                        }
                    });
                writeState.writeChain.then(resolve);
            }, 250);
        });

        return writeState.flushPromise;
    }

    function waitForPendingSave() {
        if (writeState.timer) return writeState.flushPromise || Promise.resolve(true);
        return writeState.writeChain || Promise.resolve(true);
    }

    function savePayload(payload) {
        const runtime = getRecordRuntimeConfig();
        if (!(window.KpiRuntime?.canUseServerWrite?.(runtime?.writeEnabled === true))) {
            return false;
        }
        const nextPayload = normalizePayload(payload);
        nextPayload.meta.updatedAt = new Date().toISOString();
        state.payload = nextPayload;
        state.loaded = true;
        syncPortalDataCache(nextPayload);
        try {
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(nextPayload));
        } catch (error) {
            console.warn('[kpi] work history local backup failed', error);
        }
        return queueServerWrite(nextPayload);
    }

    function saveNow() {
        return savePayload(getPayload());
    }

    function buildExportScript(payload) {
        const normalized = normalizePayload(payload);
        return [
            '(function seedWorkHistoryRecords() {',
            '    window.PortalData = window.PortalData || {};',
            `    window.PortalData.work_history_records = window.PortalData.work_history_records || ${JSON.stringify(normalized, null, 4)};`,
            '})();',
            ''
        ].join('\n');
    }

    Object.assign(history, {
        DATA_KEY,
        TEAM_KEYS,
        TEAM_DATA_VAR_NAMES,
        TeamInfo,
        state,
        writeState,
        cloneJson,
        getTimeValue,
        escapeHtml,
        escapeAttribute,
        normalizeCost,
        normalizeAssignees,
        KPI_FLAG_LABEL,
        KPI_FLAG_PILL_LABEL,
        IMPORTANT_FLAG_LABEL,
        IMPORTANT_FLAG_PILL_LABEL,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        RECORD_CATEGORY_OPTIONS,
        normalizeRecordCategoryAlias,
        isAllowedRecordCategory,
        normalizeRecordCategory,
        normalizeRecordCategoryGroup,
        getRecordCategoryGroupOptions,
        getRecordCategoryOptionsForGroup,
        getRecordCategoryGroupLabel,
        isKpiRecord,
        isReportRecord,
        isAchievementRecord,
        isImportantRecord,
        getRecordTagLabels,
        formatRecordTagText,
        ATTACHMENT_SLOT_KEYS,
        ATTACHMENT_SLOT_META,
        normalizeAttachment,
        normalizeAttachmentSlots,
        flattenAttachmentSlots,
        getRecordAttachments,
        getRecordAttachment,
        normalizeRecord,
        normalizePayload,
        createDefaultPayload,
        getElement,
        queryAll,
        setShadowHost,
        getRecordRuntimeConfig,
        getAssetRuntimeConfig,
        loadData,
        getPayload,
        replacePayload,
        getTeamRecords,
        uploadPendingAttachments,
        deleteAttachmentsFromServer,
        savePayload,
        saveNow,
        waitForPendingSave,
        buildExportScript
    });

    window.KpiWorkHistory = history;
})();
