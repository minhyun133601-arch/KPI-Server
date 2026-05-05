        // ----------------------------------------------------------------
        // [Audit Lux]
        // ----------------------------------------------------------------
        const AuditState = { filters: {}, printCache: {}, entryForm: {}, standardForm: {}, standardsOpen: {}, evidenceOpen: {}, evidenceSelected: {}, evidenceApplied: {}, evidenceCache: {}, luxPreviewRotation: {} };
        const AUDIT_LUX_BASE_YEAR = 2023;
        const AUDIT_LUX_EVIDENCE_MAX_BYTES = 25 * 1024 * 1024;
        const AUDIT_LUX_EVIDENCE_OWNER_DOMAIN = 'audit.lux.evidence';
        const AUDIT_LUX_EVIDENCE_STORAGE_FOLDER = ['Audit', '조도 스캔본'];
        const AuditServerWriteQueue = {};
        const AUDIT_PORTAL_DATA_FALLBACK = Object.freeze({
            audit_legal_facility: 'audit_regulation'
        });

        function cloneAuditDataPayload(value) {
            return JSON.parse(JSON.stringify(value || {}));
        }

        const auditRecordsBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
            ? KpiAuditRecordsBrowserAdapter
            : Object.freeze({
                getAuditRuntimeConfig: () => null,
                getPortalPayload: () => null,
                writePortalPayload: (_dataKey, data) => cloneAuditDataPayload(data),
                canUseServerWrite: () => false,
                fetch: () => Promise.reject(new Error('audit_fetch_unavailable'))
            });

        function getAuditServerRuntimeConfig(dataKey) {
            const runtime = auditRecordsBrowser.getAuditRuntimeConfig();
            const records = runtime?.records;
            const record = records && typeof records === 'object' ? records[dataKey] : null;
            if (!runtime || runtime.enabled !== true || !record) return null;
            return {
                apiBase: runtime.apiBase || '/api',
                moduleKey: runtime.moduleKey || 'portal_data',
                recordKey: record.recordKey || dataKey,
                permissionKey: record.permissionKey || '',
                readEnabled: record.readEnabled === true,
                writeEnabled: record.writeEnabled === true
            };
        }

        function getAuditPortalPayload(dataKey) {
            return auditRecordsBrowser.getPortalPayload(dataKey, AUDIT_PORTAL_DATA_FALLBACK);
        }

        function syncAuditPortalDataCache(dataKey, data) {
            auditRecordsBrowser.writePortalPayload(dataKey, data);
        }

        function queueAuditServerWrite(dataKey, data) {
            const runtime = getAuditServerRuntimeConfig(dataKey);
            if (!auditRecordsBrowser.canUseServerWrite(runtime?.writeEnabled === true)) return Promise.resolve(false);

            const queueState = AuditServerWriteQueue[dataKey] || (AuditServerWriteQueue[dataKey] = {
                timer: null,
                payload: null,
                flushPromise: Promise.resolve(true),
                writeChain: Promise.resolve(true)
            });
            queueState.payload = cloneAuditDataPayload(data);

            if (queueState.timer) {
                clearTimeout(queueState.timer);
            }

            queueState.flushPromise = new Promise((resolve) => {
                queueState.timer = setTimeout(() => {
                    const payload = cloneAuditDataPayload(queueState.payload);
                    queueState.timer = null;
                    queueState.writeChain = Promise.resolve(queueState.writeChain)
                        .catch(() => false)
                        .then(async () => {
                            try {
                                const response = await auditRecordsBrowser.fetch(`${runtime.apiBase}/modules/${encodeURIComponent(runtime.moduleKey)}/records/${encodeURIComponent(runtime.recordKey)}`, {
                                    method: 'PUT',
                                    credentials: 'same-origin',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        permissionKey: runtime.permissionKey,
                                        payload
                                    })
                                });

                                if (!response.ok) {
                                    throw new Error(`http_${response.status}`);
                                }

                                const result = await response.json();
                                if (result?.record?.payload) {
                                    syncAuditPortalDataCache(dataKey, result.record.payload);
                                }
                                return true;
                            } catch (error) {
                                console.warn('[kpi] audit server write failed', dataKey, error);
                                return false;
                            }
                        });
                    queueState.writeChain.then(resolve);
                }, 250);
            });

            return queueState.flushPromise;
        }

        function waitForAuditServerWrite(dataKey) {
            const queueState = AuditServerWriteQueue[dataKey];
            if (!queueState) return Promise.resolve(true);
            if (queueState.timer) return queueState.flushPromise || Promise.resolve(true);
            return queueState.writeChain || Promise.resolve(true);
        }

        function getAuditData(dataKey, moduleName) {
            let data = null;
            const serverRuntime = getAuditServerRuntimeConfig(dataKey);
            const serverReadBlocked = !!(serverRuntime && serverRuntime.readEnabled !== true);
            const portalPayload = getAuditPortalPayload(dataKey);
            const hasServerPayload = !!(serverRuntime && serverRuntime.readEnabled === true && portalPayload);

            if (hasServerPayload) {
                data = cloneAuditDataPayload(portalPayload);
            }
            if (!data && !serverReadBlocked && portalPayload) {
                data = cloneAuditDataPayload(portalPayload);
            }
            if (!data) {
                data = {
                    meta: {
                        moduleKey: dataKey,
                        moduleName: moduleName || dataKey,
                        version: 1,
                        updatedAt: new Date().toISOString()
                    },
                    entries: []
                };
            }
            data.entries = Array.isArray(data.entries) ? data.entries : [];
            if (!data.entries.length && Array.isArray(portalPayload?.entries)) {
                data.entries = cloneAuditDataPayload(portalPayload.entries);
            }
            data.standards = Array.isArray(data.standards) ? data.standards : [];
            if (!data.standards.length && Array.isArray(portalPayload?.standards)) {
                data.standards = cloneAuditDataPayload(portalPayload.standards);
            }
            data.evidence = Array.isArray(data.evidence) ? data.evidence : [];
            if (!data.evidence.length && Array.isArray(portalPayload?.evidence)) {
                data.evidence = cloneAuditDataPayload(portalPayload.evidence);
            }
            return data;
        }

        function normalizeAuditZone(text) {
            return (text || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
        }

        function getAuditStandardInfo(standards, team, room, type) {
            const t = (team || '').trim();
            const r = (room || '').trim();
            const k = (type || '').trim();
            const normalizedTeam = normalizeAuditZone(t);
            const normalizedRoom = normalizeAuditZone(r);
            const normalizedType = normalizeAuditZone(k);

            const matchStandard = (item) => {
                const itemTeam = normalizeAuditZone(item.team || '');
                const itemRoom = normalizeAuditZone(item.room || '');
                const itemType = normalizeAuditZone(item.type || '');
                if (normalizedTeam && itemTeam && itemTeam !== normalizedTeam) return false;
                if (normalizedRoom && itemRoom && itemRoom !== normalizedRoom) return false;
                if (normalizedType && itemType && itemType !== normalizedType) return false;
                if (normalizedTeam && !itemTeam && normalizedRoom && !itemRoom && normalizedType && !itemType) return false;
                return true;
            };

            const sorted = (standards || []).slice();
            // Try most specific first: team+room+type, then room+type, then type-only
            const candidates = [
                item => normalizedTeam && normalizedRoom && normalizedType && normalizeAuditZone(item.team || '') === normalizedTeam && normalizeAuditZone(item.room || '') === normalizedRoom && normalizeAuditZone(item.type || '') === normalizedType,
                item => normalizedRoom && normalizedType && normalizeAuditZone(item.room || '') === normalizedRoom && normalizeAuditZone(item.type || '') === normalizedType,
                item => normalizedType && normalizeAuditZone(item.type || '') === normalizedType
            ];
            for (const predicate of candidates) {
                const found = sorted.find(item => (item.team || item.room || item.type) && predicate(item));
                if (found) {
                    const value = parseFloat(found.standard);
                    if (!Number.isNaN(value)) {
                        return { value, label: String(found.standard || value) };
                    }
                }
            }

            for (const item of sorted) {
                if (item.team || item.room || item.type) continue;
                const zone = normalizeAuditZone(item.zone || '');
                if (!zone) continue;
                const candidatesLegacy = new Set([normalizedRoom, normalizedType].filter(Boolean));
                if (candidatesLegacy.has(zone)) {
                    const value = parseFloat(item.standard);
                    if (!Number.isNaN(value)) {
                        return { value, label: String(item.standard || value) };
                    }
                }
            }
            return null;
        }

        function getAuditTypeOptions(standards, team, room) {
            const normalizedTeam = normalizeAuditZone(team || '');
            const normalizedRoom = normalizeAuditZone(room || '');
            if (!normalizedRoom) return [];
            const list = (standards || []).filter(item => {
                const itemTeam = normalizeAuditZone(item.team || '');
                const itemRoom = normalizeAuditZone(item.room || '');
                if (normalizedTeam && itemTeam && itemTeam !== normalizedTeam) return false;
                if (normalizedRoom && itemRoom && itemRoom !== normalizedRoom) return false;
                return true;
            }).map(item => item.type || '').filter(Boolean);
            return Array.from(new Set(list));
        }

        function renderAuditTeamChip(team) {
            const info = getEquipIconInfo(team);
            const color = info.color || '#94a3b8';
            const icon = info.icon || 'fa-folder';
            const safeTeam = escapeHtml(team || '');
            const label = safeTeam || '미지정';
            const chipStyle = `background:${color}14;border-color:${color}55;color:${color};`;
            return `<span class="audit-team-chip" style="${chipStyle}"><i class="fas ${icon}"></i>${label}</span>`;
        }

        function parseAuditComparableNumber(value) {
            const raw = String(value ?? '').trim().replace(/,/g, '');
            if (!raw) return null;
            if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)) return null;
            const numeric = Number(raw);
            return Number.isFinite(numeric) ? numeric : null;
        }

        function isAuditValueStatusPendingInput(value) {
            const raw = String(value ?? '').trim().replace(/,/g, '');
            if (!raw) return false;
            if (raw === '0' || raw === '+0' || raw === '-0') return true;
            return /^[+-]?(?:\d+)?\.$/.test(raw);
        }

        function getAuditValueStatus(value, standardInfo, options = {}) {
            const numeric = parseAuditComparableNumber(value);
            const standardValue = standardInfo?.value;
            const standardLabel = standardInfo?.label || (standardValue ?? '');
            if (standardValue === null || standardValue === undefined || Number.isNaN(standardValue)) {
                return { state: 'none', label: '기준 없음' };
            }
            if (numeric === null) {
                return { state: 'none', label: `기준 ${standardLabel}` };
            }
            if (numeric < standardValue) {
                if (options.deferPendingInput && isAuditValueStatusPendingInput(value)) {
                    return { state: 'none', label: `기준 ${standardLabel}` };
                }
                return { state: 'fail', label: `미달 (${standardLabel})` };
            }
            return { state: 'pass', label: `충족 (${standardLabel})` };
        }

        function renderAuditStatusBadge(status) {
            if (!status) return '';
            return `
                <span class="audit-status-badge ${status.state}">
                    <span class="audit-status-dot"></span>
                    ${escapeHtml(status.label)}
                </span>
            `;
        }

        function saveAuditData(dataKey, data) {
            const serverRuntime = getAuditServerRuntimeConfig(dataKey);
            if (!auditRecordsBrowser.canUseServerWrite(serverRuntime?.writeEnabled === true)) {
                return false;
            }
            data.meta = data.meta || {};
            data.meta.updatedAt = new Date().toISOString();
            syncAuditPortalDataCache(dataKey, data);
            return queueAuditServerWrite(dataKey, data);
        }
