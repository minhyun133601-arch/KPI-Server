        const auditRecordsEvidenceBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : Object.freeze({
                canUseServerWrite: () => false,
                fetch: () => Promise.reject(new Error('audit_fetch_unavailable')),
                hasFetch: () => false,
                resolveUrl: (path) => encodeURI(String(path || '').trim()),
                openWindow: () => null,
                writePortalPayload: (_dataKey, data) => cloneAuditDataPayload(data)
            });

        function getAuditEvidenceList(dataKey) {
            const data = getAuditData(dataKey);
            return Array.isArray(data.evidence) ? data.evidence : [];
        }

        function getAuditEvidenceViewUrl(item) {
            const previewUrl = String(item?.previewUrl || item?.viewUrl || '').trim();
            if (previewUrl) return previewUrl;
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (documentId) return `/api/files/${encodeURIComponent(documentId)}/view`;
            return resolveAuditEvidenceFileUrl(item?.file || item?.path || '');
        }

        function getAuditEvidenceDownloadUrl(item) {
            const downloadUrl = String(item?.downloadUrl || '').trim();
            if (downloadUrl) return downloadUrl;
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (documentId) return `/api/files/${encodeURIComponent(documentId)}/download`;
            return resolveAuditEvidenceFileUrl(item?.file || item?.path || '');
        }

        function getAuditEvidenceFileLabel(item) {
            const explicit = String(item?.fileName || item?.name || item?.originalName || '').trim();
            if (explicit) return explicit;
            const file = String(item?.file || item?.path || '').trim();
            if (!file) return '';
            return file.split('/').pop() || file.split('\\').pop() || file;
        }

        function isAuditEvidencePdf(item) {
            const mimeType = String(item?.mimeType || item?.mime_type || '').trim().toLowerCase();
            if (mimeType === 'application/pdf') return true;
            const fileLabel = getAuditEvidenceFileLabel(item).toLowerCase();
            return fileLabel.endsWith('.pdf');
        }

        function resolveAuditEvidenceFileUrl(file) {
            const rawFile = String(file || '').trim();
            if (!rawFile) return '';
            const normalizedFile = rawFile
                .replace(/^03_★★★_Audit\//, 'audit/')
                .replace(/^03_\*\*\*_Audit\//, 'audit/');
            return auditRecordsEvidenceBrowser.resolveUrl(normalizedFile);
        }

        function normalizeAuditRotation(angle) {
            const numeric = Number(angle);
            if (!Number.isFinite(numeric)) return 0;
            const normalized = numeric % 360;
            return normalized < 0 ? normalized + 360 : normalized;
        }

        function getAuditLuxMaxQuarterForYear(year) {
            const targetYear = Number(year);
            if (!Number.isFinite(targetYear)) return 0;
            const now = typeof getAuditCurrentQuarterInfo === 'function'
                ? getAuditCurrentQuarterInfo()
                : getQuarterInfo(new Date());
            if (targetYear < now.year) return 4;
            if (targetYear > now.year) return 0;
            return Math.min(Math.max(Number(now.quarter) || 1, 1), 4);
        }

        function normalizeAuditLuxEvidenceQuarter(yearOrItem, quarter = null) {
            const item = yearOrItem && typeof yearOrItem === 'object' ? yearOrItem : null;
            const targetYear = Number(item ? item.year : yearOrItem);
            const rawQuarter = item
                ? (item.quarter ?? item.metadata?.quarter ?? item.period?.quarter)
                : quarter;
            const maxQuarter = getAuditLuxMaxQuarterForYear(targetYear);
            const numericQuarter = Number(rawQuarter);
            if (
                Number.isFinite(numericQuarter)
                && numericQuarter >= 1
                && numericQuarter <= 4
                && (maxQuarter === 0 || numericQuarter <= maxQuarter)
            ) {
                return numericQuarter;
            }
            const legacyQuarter = targetYear === 2026 ? 2 : 4;
            if (maxQuarter > 0) return Math.min(legacyQuarter, maxQuarter);
            return legacyQuarter;
        }

        function getAuditLuxEvidenceQuarterLabel(yearOrItem, quarter = null) {
            const normalizedQuarter = normalizeAuditLuxEvidenceQuarter(yearOrItem, quarter);
            return `${normalizedQuarter}분기`;
        }

        function getAuditLuxEvidencePeriodLabel(yearOrItem, quarter = null) {
            const item = yearOrItem && typeof yearOrItem === 'object' ? yearOrItem : null;
            const targetYear = Number(item ? item.year : yearOrItem);
            const normalizedQuarter = normalizeAuditLuxEvidenceQuarter(yearOrItem, quarter);
            return `${targetYear}년 ${normalizedQuarter}분기`;
        }

        function makeAuditLuxEvidenceId(year, team, quarter = null) {
            const safeYear = Number(year);
            const safeQuarter = normalizeAuditLuxEvidenceQuarter(safeYear, quarter);
            const safeTeam = normalizeAuditZone(team || '').replace(/[^a-z0-9]+/g, '-') || 'team';
            return `audit-lux-${safeYear}-q${safeQuarter}-${safeTeam}`;
        }

        function getAuditLuxYearEvidenceItem(dataKey, year, team, quarter = null) {
            if (String(dataKey || '').trim() !== 'audit_lux') return null;
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!normalizedTeam) return null;
            const targetYear = Number(year);
            const targetQuarter = quarter === null || quarter === undefined || quarter === ''
                ? null
                : normalizeAuditLuxEvidenceQuarter(targetYear, quarter);
            const matches = getAuditEvidenceList(dataKey)
                .filter((item) => (
                    normalizeAuditZone(item?.team || '') === normalizedTeam
                    && Number(item?.year) === targetYear
                    && (targetQuarter === null || normalizeAuditLuxEvidenceQuarter(item) === targetQuarter)
                ))
                .sort((a, b) => normalizeAuditLuxEvidenceQuarter(b) - normalizeAuditLuxEvidenceQuarter(a));
            return matches[0] || null;
        }

        function validateAuditLuxEvidenceFile(file) {
            if (!(file instanceof File)) {
                throw new Error('invalid_file');
            }
            const mimeType = String(file.type || '').trim().toLowerCase();
            const fileName = String(file.name || '').trim().toLowerCase();
            const isSupportedImage = mimeType.startsWith('image/');
            const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');
            if (!isSupportedImage && !isPdf) {
                throw new Error('unsupported_type');
            }
            if (Number(file.size || 0) > AUDIT_LUX_EVIDENCE_MAX_BYTES) {
                throw new Error('file_too_large');
            }
        }

        function readAuditLuxEvidenceAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = String(reader.result || '');
                    const commaIndex = result.indexOf(',');
                    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
                };
                reader.onerror = () => reject(reader.error || new Error('audit_lux_evidence_read_failed'));
                reader.readAsDataURL(file);
            });
        }

        function getAuditLuxEvidenceUploadName(file, year, team, quarter = null) {
            const sourceName = String(file?.name || '').trim();
            const sourceMimeType = String(file?.type || '').trim().toLowerCase();
            const nameMatch = sourceName.match(/(\.[A-Za-z0-9]{1,16})$/);
            const ext = nameMatch?.[1]
                || (sourceMimeType === 'application/pdf' ? '.pdf' : '')
                || (sourceMimeType === 'image/png' ? '.png' : '')
                || (sourceMimeType === 'image/webp' ? '.webp' : '')
                || (sourceMimeType === 'image/gif' ? '.gif' : '')
                || (sourceMimeType.startsWith('image/') ? '.jpg' : '');
            return `${Number(year)} ${normalizeAuditLuxEvidenceQuarter(year, quarter)}분기 ${String(team || '').trim()} 조도${ext}`;
        }

        async function uploadAuditLuxEvidenceToServer(dataKey, year, team, quarter, file) {
            const runtime = getAuditServerRuntimeConfig(dataKey);
            if (!auditRecordsEvidenceBrowser.canUseServerWrite(runtime?.writeEnabled === true) || !auditRecordsEvidenceBrowser.hasFetch()) {
                throw new Error('server_write_unavailable');
            }
            validateAuditLuxEvidenceFile(file);
            const targetQuarter = normalizeAuditLuxEvidenceQuarter(year, quarter);
            const originalName = getAuditLuxEvidenceUploadName(file, year, team, targetQuarter);
            const mimeType = String(file?.type || '').trim() || 'application/octet-stream';
            const base64Data = await readAuditLuxEvidenceAsBase64(file);
            const response = await auditRecordsEvidenceBrowser.fetch(`${runtime.apiBase.replace(/\/+$/, '')}/files/base64`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    permissionKey: runtime.permissionKey,
                    ownerDomain: AUDIT_LUX_EVIDENCE_OWNER_DOMAIN,
                    ownerKey: `${String(dataKey || '').trim()}:${Number(year)}:Q${targetQuarter}:${String(team || '').trim()}`,
                    fileCategory: 'evidence',
                    originalName,
                    mimeType,
                    base64Data,
                    metadata: {
                        dataKey: String(dataKey || '').trim(),
                        year: Number(year),
                        quarter: targetQuarter,
                        team: String(team || '').trim(),
                        originalName,
                        storageFolder: AUDIT_LUX_EVIDENCE_STORAGE_FOLDER
                    }
                })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload?.ok || !payload?.document?.id) {
                throw new Error(payload?.error || `http_${response.status}`);
            }
            const document = payload.document;
            return {
                id: makeAuditLuxEvidenceId(year, team, targetQuarter),
                team: String(team || '').trim(),
                year: Number(year),
                quarter: targetQuarter,
                documentId: String(document.id || '').trim(),
                fileName: String(document.original_name || originalName).trim(),
                originalName: String(document.original_name || originalName).trim(),
                mimeType: String(document.mime_type || mimeType).trim(),
                previewUrl: String(document.preview_url || `/api/files/${document.id}/view`).trim(),
                downloadUrl: String(document.download_url || `/api/files/${document.id}/download`).trim(),
                rotate: 0
            };
        }

        async function deleteAuditEvidenceFromServer(item) {
            const documentId = String(item?.documentId || item?.fileId || '').trim();
            if (!documentId || !auditRecordsEvidenceBrowser.hasFetch()) return true;
            const response = await auditRecordsEvidenceBrowser.fetch(`/api/files/${encodeURIComponent(documentId)}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });
            if (response.status === 404) return true;
            if (!response.ok) {
                throw new Error(`http_${response.status}`);
            }
            return true;
        }

        async function replaceAuditLuxEvidenceForYear(dataKey, year, team, quarterOrFile, maybeFile) {
            if (String(dataKey || '').trim() !== 'audit_lux') {
                throw new Error('invalid_data_key');
            }
            const normalizedTeam = String(team || '').trim();
            const targetYear = Number(year);
            const file = maybeFile || quarterOrFile;
            const quarter = maybeFile ? quarterOrFile : null;
            const targetQuarter = normalizeAuditLuxEvidenceQuarter(targetYear, quarter);
            if (!normalizedTeam || !Number.isFinite(targetYear)) {
                throw new Error('invalid_target');
            }
            const data = getAuditData(dataKey, dataKey);
            const previousData = cloneAuditDataPayload(data);
            const currentEvidence = getAuditLuxYearEvidenceItem(dataKey, targetYear, normalizedTeam, targetQuarter);
            const uploaded = await uploadAuditLuxEvidenceToServer(dataKey, targetYear, normalizedTeam, targetQuarter, file);
            const nextEvidence = (Array.isArray(data.evidence) ? data.evidence : [])
                .filter((item) => !(
                    Number(item?.year) === targetYear
                    && normalizeAuditZone(item?.team || '') === normalizeAuditZone(normalizedTeam)
                    && normalizeAuditLuxEvidenceQuarter(item) === targetQuarter
                ));
            nextEvidence.push(uploaded);
            data.evidence = nextEvidence.sort((a, b) => {
                const yearDiff = Number(b?.year || 0) - Number(a?.year || 0);
                if (yearDiff !== 0) return yearDiff;
                const quarterDiff = normalizeAuditLuxEvidenceQuarter(b) - normalizeAuditLuxEvidenceQuarter(a);
                if (quarterDiff !== 0) return quarterDiff;
                return String(a?.team || '').localeCompare(String(b?.team || ''), 'ko');
            });
            let saved = false;
            try {
                saved = await Promise.resolve(saveAuditData(dataKey, data));
            } catch (error) {
                console.warn('[kpi] audit evidence record save failed', dataKey, error);
                saved = false;
            }
            if (saved !== true) {
                Object.keys(data || {}).forEach((key) => delete data[key]);
                Object.assign(data, previousData);
                if (typeof syncAuditPortalDataCache === 'function') {
                    syncAuditPortalDataCache(dataKey, previousData);
                } else {
                    auditRecordsEvidenceBrowser.writePortalPayload(dataKey, previousData);
                }
                try {
                    await deleteAuditEvidenceFromServer(uploaded);
                } catch (cleanupError) {
                    console.warn('[kpi] audit evidence cleanup failed', uploaded.documentId, cleanupError);
                }
                throw new Error('audit_lux_evidence_record_save_failed');
            }
            if (currentEvidence?.documentId && currentEvidence.documentId !== uploaded.documentId) {
                try {
                    await deleteAuditEvidenceFromServer(currentEvidence);
                } catch (error) {
                    console.warn('[kpi] audit evidence delete failed', dataKey, currentEvidence.documentId, error);
                }
            }
            return uploaded;
        }

        function getAuditLuxEntryPreviewItem(dataKey, year, team, quarter = null) {
            if (String(dataKey || '').trim() !== 'audit_lux') return null;
            const normalizedTeam = normalizeAuditZone(team || '');
            if (!normalizedTeam) return null;
            const targetYear = Number(year);
            const targetQuarter = normalizeAuditLuxEvidenceQuarter(targetYear, quarter);
            const teamMatches = getAuditEvidenceList(dataKey)
                .filter(item => normalizeAuditZone(item?.team || '') === normalizedTeam)
                .sort((a, b) => {
                    const yearDiff = Number(b?.year || 0) - Number(a?.year || 0);
                    if (yearDiff !== 0) return yearDiff;
                    return normalizeAuditLuxEvidenceQuarter(b) - normalizeAuditLuxEvidenceQuarter(a);
                });
            if (!teamMatches.length) return null;
            const exact = teamMatches.find(item => (
                Number(item?.year) === targetYear
                && normalizeAuditLuxEvidenceQuarter(item) === targetQuarter
            ));
            if (exact) return { ...exact, previewFallback: false };
            return { ...teamMatches[0], previewFallback: true };
        }

        function getAuditLuxEntryPreviewRotation(dataKey, item) {
            const baseRotation = Number.isFinite(parseFloat(item?.rotate)) ? parseFloat(item.rotate) : 0;
            const offset = Number(AuditState?.luxPreviewRotation?.[dataKey]?.[String(item?.id || '').trim()] || 0);
            return normalizeAuditRotation(baseRotation + offset);
        }

        function setAuditLuxEntryPreviewRotationOffset(dataKey, evidenceId, offset) {
            const normalizedDataKey = String(dataKey || '').trim();
            const normalizedId = String(evidenceId || '').trim();
            if (!normalizedDataKey || !normalizedId) return;
            if (!AuditState.luxPreviewRotation[normalizedDataKey]) {
                AuditState.luxPreviewRotation[normalizedDataKey] = {};
            }
            AuditState.luxPreviewRotation[normalizedDataKey][normalizedId] = normalizeAuditRotation(offset);
        }

        function renderAuditLuxEntryPreviewHtml(dataKey, year, team, quarter = null) {
            const previewItem = getAuditLuxEntryPreviewItem(dataKey, year, team, quarter);
            if (!String(team || '').trim()) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">팀을 먼저 선택하면 스캔본 미리보기가 표시됩니다.</div>
                    </div>
                `;
            }
            if (!previewItem) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">등록된 스캔본이 없습니다.</div>
                    </div>
                `;
            }
            const periodLabel = getAuditLuxEvidencePeriodLabel(previewItem);
            const title = `${String(previewItem.team || team).trim()} ${periodLabel} 스캔본`;
            const fileUrl = getAuditEvidenceViewUrl(previewItem);
            if (!fileUrl) {
                return `
                    <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                        <div class="audit-lux-preview-empty">스캔본 파일 경로가 없습니다.</div>
                    </div>
                `;
            }
            const rotation = getAuditLuxEntryPreviewRotation(dataKey, previewItem);
            const encodedId = encodeURIComponent(String(previewItem.id || '').trim());
            const sourceText = previewItem.previewFallback
                ? `선택 분기 스캔본이 없어 ${getAuditLuxEvidencePeriodLabel(previewItem)} 최신 등록본을 표시 중입니다.`
                : `${periodLabel} 스캔본을 표시 중입니다.`;
            return `
                <div class="audit-lux-preview-card" data-audit-lux-preview="${escapeHtml(dataKey)}">
                    <div class="audit-lux-preview-head">
                        <div class="audit-lux-preview-copy">
                            <div class="audit-lux-preview-title">스캔본 미리보기</div>
                            <div class="audit-lux-preview-meta">${escapeHtml(title)}</div>
                        </div>
                        <div class="audit-filter-actions">
                            <button type="button" class="work-btn" onclick="rotateAuditLuxEntryPreview('${escapeJs(dataKey)}', -90)">왼쪽 회전</button>
                            <button type="button" class="work-btn" onclick="rotateAuditLuxEntryPreview('${escapeJs(dataKey)}', 90)">오른쪽 회전</button>
                            <button type="button" class="work-btn audit-ref-open" onclick="openAuditEvidence('${escapeJs(dataKey)}', '${encodedId}')">원본 열기</button>
                        </div>
                    </div>
                    <div class="audit-lux-preview-stage">
                        <img
                            class="audit-lux-preview-image"
                            data-audit-lux-preview-image
                            src="${fileUrl}"
                            alt="${escapeHtml(title)}"
                            loading="lazy"
                            decoding="async"
                            style="transform: rotate(${rotation}deg);"
                        />
                    </div>
                    <div class="audit-lux-preview-foot">
                        <span class="audit-lux-preview-angle" data-audit-lux-preview-angle>회전 ${rotation}°</span>
                        <span class="audit-lux-preview-origin">${escapeHtml(sourceText)}</span>
                    </div>
                </div>
            `;
        }

        function rotateAuditLuxEntryPreview(dataKey, delta) {
            const entryForm = typeof getAuditEntryFormState === 'function' ? getAuditEntryFormState(dataKey) : null;
            if (!entryForm) return;
            const previewItem = getAuditLuxEntryPreviewItem(dataKey, entryForm.year, entryForm.team, entryForm.quarter);
            if (!previewItem?.id) return;
            const baseRotation = Number.isFinite(parseFloat(previewItem.rotate)) ? parseFloat(previewItem.rotate) : 0;
            const currentRotation = getAuditLuxEntryPreviewRotation(dataKey, previewItem);
            const currentOffset = normalizeAuditRotation(currentRotation - baseRotation);
            setAuditLuxEntryPreviewRotationOffset(dataKey, previewItem.id, currentOffset + Number(delta || 0));
            const category = AppData?.audit?.categories?.find(cat => cat.dataKey === dataKey);
            if (category) renderAuditContent(category);
        }

        function initAuditEvidenceState(dataKey, evidenceList) {
            if (!AuditState.evidenceOpen[dataKey]) AuditState.evidenceOpen[dataKey] = {};
            const openState = AuditState.evidenceOpen[dataKey];
            const teams = Array.from(new Set((evidenceList || []).map(item => item.team).filter(Boolean)));
            teams.forEach((team, idx) => {
                if (openState[team] === undefined) openState[team] = idx === 0;
            });
        }

        function toggleAuditEvidenceGroup(dataKey, teamKey, groupId) {
            const team = decodeURIComponent(teamKey || '');
            if (!AuditState.evidenceOpen[dataKey]) AuditState.evidenceOpen[dataKey] = {};
            const current = !!AuditState.evidenceOpen[dataKey][team];
            AuditState.evidenceOpen[dataKey][team] = !current;
            const groupEl = document.getElementById(groupId);
            if (groupEl) groupEl.classList.toggle('is-collapsed', current);
        }

        function filterAuditEvidence(evidenceList, filter) {
            let filtered = (evidenceList || []).slice();
            if (filter?.team) {
                const teamKey = normalizeAuditZone(filter.team);
                filtered = filtered.filter(item => normalizeAuditZone(item.team || '') === teamKey);
            }
            if (filter?.startQuarter && filter?.endQuarter) {
                const range = normalizeQuarterRange(filter.startQuarter, filter.endQuarter);
                const startIndex = quarterIndex(range.start);
                const endIndex = quarterIndex(range.end);
                if (Number.isFinite(startIndex) && Number.isFinite(endIndex)) {
                    filtered = filtered.filter(item => {
                        const year = Number(item.year);
                        if (!Number.isFinite(year)) return false;
                        const itemIndex = quarterIndex(makeQuarterKey(year, normalizeAuditLuxEvidenceQuarter(item)));
                        return itemIndex >= startIndex && itemIndex <= endIndex;
                    });
                }
            }
            return filtered;
        }

        function renderAuditEvidencePreviewHtml(dataKey, item) {
            if (!item) {
                return `<div class="audit-ref-empty">좌측에서 항목을 선택하세요.</div>`;
            }
            const titleParts = [];
            if (item.team) titleParts.push(item.team);
            if (item.year) titleParts.push(getAuditLuxEvidencePeriodLabel(item));
            const title = titleParts.join(' ') || '조도 스캔본';
            const viewUrl = getAuditEvidenceViewUrl(item);
            if (!viewUrl) {
                return `<div class="audit-ref-empty">파일 경로가 없습니다.</div>`;
            }
            const rotate = Number.isFinite(parseFloat(item.rotate)) ? parseFloat(item.rotate) : 0;
            const rotateStyle = rotate ? ` style="transform: rotate(${rotate}deg);"` : '';
            const encodedId = encodeURIComponent(item.id || '');
            return `
                <div class="audit-ref-preview">
                    <img class="audit-ref-image" src="${escapeHtml(viewUrl)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async"${rotateStyle} />
                    <div class="audit-ref-meta">
                        <div>
                            <div class="audit-ref-meta-title">${escapeHtml(title)}</div>
                        </div>
                        <button class="work-btn audit-ref-open" onclick="openAuditEvidence('${dataKey}', '${encodedId}')">원본 열기</button>
                    </div>
                </div>
            `;
        }

        function selectAuditEvidence(dataKey, evidenceKey) {
            const id = decodeURIComponent(evidenceKey || '');
            AuditState.evidenceSelected[dataKey] = id;
            const wrap = document.querySelector(`[data-audit-evidence="${dataKey}"]`);
            if (!wrap) return;
            wrap.querySelectorAll('[data-evidence-item]').forEach(el => {
                el.classList.toggle('is-selected', el.dataset.evidenceId === id);
            });
            const preview = wrap.querySelector('[data-evidence-preview]');
            if (!preview) return;
            const list = getAuditEvidenceList(dataKey);
            const selected = list.find(item => item.id === id);
            preview.innerHTML = renderAuditEvidencePreviewHtml(dataKey, selected);
            preview.classList.toggle('has-image', !!getAuditEvidenceViewUrl(selected));
        }

        function openAuditEvidence(dataKey, evidenceKey) {
            const id = decodeURIComponent(evidenceKey || '');
            const list = getAuditEvidenceList(dataKey);
            const item = list.find(entry => entry.id === id);
            if (!item) return;
            const url = getAuditEvidenceViewUrl(item);
            if (!url) return;
            auditRecordsEvidenceBrowser.openWindow(url, '_blank');
        }

        function printAuditEvidence(dataKey) {
            const list = AuditState.evidenceCache?.[dataKey] || [];
            if (!list.length) {
                alert('검색 결과가 없습니다.');
                return;
            }
            const selectedId = AuditState.evidenceSelected?.[dataKey];
            let items = [];
            if (selectedId) {
                const found = list.find(entry => entry.id === selectedId);
                if (found) items = [found];
            }
            if (!items.length) items = list;

            const pages = items.map(item => {
                const imagePath = getAuditEvidenceViewUrl(item);
                if (!imagePath) return '';
                const rotate = Number.isFinite(parseFloat(item.rotate)) ? parseFloat(item.rotate) : 0;
                const rotateStyle = rotate ? ` style="transform: rotate(${rotate}deg);"` : '';
                const titleParts = [];
                if (item.team) titleParts.push(item.team);
                if (item.year) titleParts.push(getAuditLuxEvidencePeriodLabel(item));
                const title = titleParts.join(' ') || '조도 스캔본';
                return `
                    <div class="print-page">
                        <div class="print-title">${escapeHtml(title)}</div>
                        <img class="print-image" src="${imagePath}" alt="${escapeHtml(title)}"${rotateStyle} />
                    </div>
                `;
            }).join('');

            const html = `
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8" />
                    <title>조도 스캔본 인쇄</title>
                    <style>
                        @page { margin: 12mm; }
                        body { margin: 0; font-family: 'Noto Sans KR', sans-serif; color: #0f172a; }
                        .print-page { page-break-after: always; display: flex; flex-direction: column; align-items: center; gap: 10px; }
                        .print-title { font-size: 14px; font-weight: 700; }
                        .print-image { max-width: 100%; max-height: 92vh; object-fit: contain; image-orientation: from-image; border: 1px solid #e2e8f0; }
                        .print-page:last-child { page-break-after: auto; }
                    </style>
                </head>
                <body>
                    ${pages}
                </body>
                </html>
            `;
            const win = auditRecordsEvidenceBrowser.openWindow('', '_blank');
            if (!win) return;
            win.document.open();
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 250);
        }
