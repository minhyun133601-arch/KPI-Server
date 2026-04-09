        function toggleAreaTable(btn) {
            const shell = btn?.closest('.area-map-shell');
            if (!shell) return;
            shell.classList.toggle('area-table-open');
            const isOpen = shell.classList.contains('area-table-open');
            const toggleBtn = shell.querySelector('.area-table-toggle');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            const panel = shell.querySelector('.area-table-panel');
            if (panel) panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        }

        const SVG_NS = 'http://www.w3.org/2000/svg';
        const XLINK_NS = 'http://www.w3.org/1999/xlink';
        const DEFAULT_AREA_BLOCK_TYPES = ['tank', 'pump', 'valve', 'custom', 'motor', 'compressor', 'boiler', 'mixer', 'agitator', 'chiller'];
        const AreaMapRegistry = {
            team1_part1: { teamName: '생산 1팀 1파트', blockTypes: DEFAULT_AREA_BLOCK_TYPES, startsBlank: true },
            team1_part2: { teamName: '생산 1팀 2파트', blockTypes: DEFAULT_AREA_BLOCK_TYPES, startsBlank: true },
            team2: { teamName: '생산 2팀', blockTypes: DEFAULT_AREA_BLOCK_TYPES, startsBlank: true },
            team3: { teamName: '생산 3팀', blockTypes: DEFAULT_AREA_BLOCK_TYPES }
        };
        const AreaMapState = { active: null };
        const AREA_ASSET_DB_NAME = 'KPIV_AreaMapAssets';
        const AREA_ASSET_STORE_NAME = 'assets';
        const AREA_INLINE_DRAWING_TEMPLATE_IDS = new Set(
            Object.entries(AreaMapRegistry)
                .filter(([, config]) => config.startsBlank === true)
                .map(([templateId]) => templateId)
        );
        const AREA_LEGACY_DEFAULT_IMAGE = '03_★★★★_설비이력카드/common/area_map_default_base.svg';
        const AREA_LEGACY_PLACEHOLDER_RULES = {
            team1_part1: {
                markerIds: new Set(['team1p1-pump-1', 'team1p1-valve-1']),
                markerLabels: new Set(['라인A펌프', '라인A밸브']),
                labelIds: new Set(['team1p1-zone-a', 'team1p1-zone-b', 'team1p1-store']),
                labelTexts: new Set(['건조라인A', '건조라인B', '부품보관'])
            },
            team1_part2: {
                markerIds: new Set(['team1p2-motor-1', 'team1p2-tank-1']),
                markerLabels: new Set(['구동모터', '보조탱크']),
                labelIds: new Set(['team1p2-zone-a', 'team1p2-zone-b', 'team1p2-pack']),
                labelTexts: new Set(['건조보조라인A', '건조보조라인B', '이송구간'])
            },
            team2: {
                markerIds: new Set(['team2-pump-1', 'team2-compressor-1']),
                markerLabels: new Set(['포장라인펌프', '콤프레서']),
                labelIds: new Set(['team2-pack-in', 'team2-pack-out', 'team2-mix']),
                labelTexts: new Set(['내포장', '외포장', '배합구역'])
            }
        };
        const AreaAssetUrlCache = new Map();
        const AreaServerWriteQueue = {};
        let areaAssetDbPromise = null;
        window.AreaMapState = AreaMapState;

        function openAreaAssetDb() {
            if (!('indexedDB' in window)) return Promise.resolve(null);
            if (areaAssetDbPromise) return areaAssetDbPromise;
            areaAssetDbPromise = new Promise((resolve, reject) => {
                const request = window.indexedDB.open(AREA_ASSET_DB_NAME, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(AREA_ASSET_STORE_NAME)) {
                        db.createObjectStore(AREA_ASSET_STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
            }).catch(err => {
                console.error('설비 도면 저장소 초기화 실패:', err);
                areaAssetDbPromise = null;
                return null;
            });
            return areaAssetDbPromise;
        }

        function normalizeAreaAssetType(type, name = '') {
            const rawType = String(type || '').trim().toLowerCase();
            const lowerName = String(name || '').trim().toLowerCase();
            if (rawType.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
            if (rawType.startsWith('image/') || /\.(png|jpe?g|svg|gif|webp)$/i.test(lowerName)) return 'image';
            return rawType || 'file';
        }

        function cloneAreaMapPayload(value) {
            return JSON.parse(JSON.stringify(value || {}));
        }

        function getAreaServerRuntimeConfig(templateId) {
            const runtime = window.__KPI_SERVER_RUNTIME_CONFIG__?.area;
            if (!runtime || runtime.enabled !== true) return null;
            const records = runtime.records && typeof runtime.records === 'object' ? runtime.records : null;
            const normalizedKey = String(templateId || '').trim();
            const record = records ? records[normalizedKey] : null;
            if (!record) return null;
            const bundleKeys = Array.isArray(record.bundleKeys) && record.bundleKeys.length
                ? record.bundleKeys.map(key => String(key || '').trim()).filter(Boolean)
                : [normalizedKey];
            return {
                apiBase: record.apiBase || runtime.apiBase || '/api',
                moduleKey: record.moduleKey || runtime.moduleKey || 'portal_data',
                recordKey: record.recordKey || normalizedKey,
                permissionKey: record.permissionKey || '',
                readEnabled: record.readEnabled === true,
                writeEnabled: record.writeEnabled === true,
                bundleKeys,
                sourceKey: normalizedKey
            };
        }

        function getAreaAssetServerRuntimeConfig() {
            const runtime = window.__KPI_SERVER_RUNTIME_CONFIG__?.area;
            const assets = runtime?.assets;
            if (!runtime || runtime.enabled !== true || !assets) return null;
            return {
                apiBase: runtime.apiBase || '/api',
                permissionKey: assets.permissionKey || '',
                readEnabled: assets.readEnabled === true,
                writeEnabled: assets.writeEnabled === true
            };
        }

        function loadAreaMapLocalBackup(templateId) {
            try {
                const raw = localStorage.getItem(getStorageKey(templateId));
                return raw ? JSON.parse(raw) : null;
            } catch (err) {
                return null;
            }
        }

        function storeAreaMapLocalBackup(templateId, mapData) {
            localStorage.setItem(getStorageKey(templateId), JSON.stringify(mapData));
            return true;
        }

        function clearAreaMapLocalBackup(templateId) {
            try {
                localStorage.removeItem(getStorageKey(templateId));
                return true;
            } catch (err) {
                console.warn('[kpi] area local backup cleanup failed', templateId, err);
                return false;
            }
        }

        function syncAreaMapPortalDataCache(templateId, mapData) {
            const key = String(templateId || '').trim();
            if (!key) return;
            window.AreaMapData = window.AreaMapData || {};
            window.AreaMapData[key] = cloneAreaMapPayload(mapData);
        }

        function syncAreaMapBundleCache(runtime, payload) {
            if (!runtime) return;
            window.AreaMapData = window.AreaMapData || {};
            if (runtime.bundleKeys.length > 1) {
                runtime.bundleKeys.forEach((key) => {
                    window.AreaMapData[key] = cloneAreaMapPayload(payload?.[key]);
                });
                return;
            }
            window.AreaMapData[runtime.sourceKey] = cloneAreaMapPayload(payload);
        }

        function buildAreaModulePayload(runtime, mapData) {
            if (!runtime) return null;
            if (runtime.bundleKeys.length > 1) {
                const payload = {};
                runtime.bundleKeys.forEach((key) => {
                    const source = key === runtime.sourceKey
                        ? mapData
                        : window.AreaMapData?.[key];
                    payload[key] = cloneAreaMapPayload(source);
                });
                return payload;
            }
            return cloneAreaMapPayload(mapData);
        }

        function queueAreaServerWrite(templateId, mapData) {
            const runtime = getAreaServerRuntimeConfig(templateId);
            if (!(window.KpiRuntime?.canUseServerWrite?.(runtime?.writeEnabled === true))) return Promise.resolve(false);

            const queueState = AreaServerWriteQueue[templateId] || (AreaServerWriteQueue[templateId] = {
                timer: null,
                payload: null,
                flushPromise: Promise.resolve(true),
                writeChain: Promise.resolve(true)
            });
            queueState.payload = buildAreaModulePayload(runtime, mapData);

            if (queueState.timer) {
                clearTimeout(queueState.timer);
            }

            queueState.flushPromise = new Promise((resolve) => {
                queueState.timer = setTimeout(() => {
                    const payload = cloneAreaMapPayload(queueState.payload);
                    queueState.timer = null;
                    queueState.writeChain = Promise.resolve(queueState.writeChain)
                        .catch(() => false)
                        .then(async () => {
                            try {
                                const prepared = await prepareAreaPayloadForServerWrite(runtime, payload);
                                const response = await fetch(`${runtime.apiBase}/modules/${encodeURIComponent(runtime.moduleKey)}/records/${encodeURIComponent(runtime.recordKey)}`, {
                                    method: 'PUT',
                                    credentials: 'same-origin',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        permissionKey: runtime.permissionKey,
                                        payload: prepared.mapData || prepared.payload || payload
                                    })
                                });

                                if (!response.ok) {
                                    throw new Error(`http_${response.status}`);
                                }

                                const result = await response.json();
                                if (result?.record?.payload) {
                                    syncAreaMapBundleCache(runtime, result.record.payload);
                                }
                                if (runtime.bundleKeys.length > 1) {
                                    runtime.bundleKeys.forEach((key) => {
                                        const localBackup = loadAreaMapLocalBackup(key);
                                        if (localBackup) void purgeAreaLegacyLocalState(key, localBackup);
                                    });
                                } else {
                                    const localBackup = loadAreaMapLocalBackup(templateId);
                                    if (localBackup) void purgeAreaLegacyLocalState(templateId, localBackup);
                                }
                                return true;
                            } catch (error) {
                                console.warn('[kpi] area server write failed', templateId, error);
                                return false;
                            }
                        });
                    queueState.writeChain.then(resolve);
                }, 250);
            });

            return queueState.flushPromise;
        }

        async function readBlobAsBase64(blob) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = String(reader.result || '');
                    const index = result.indexOf(',');
                    resolve(index >= 0 ? result.slice(index + 1) : result);
                };
                reader.onerror = () => reject(reader.error || new Error('file_read_failed'));
                reader.readAsDataURL(blob);
            });
        }

        function normalizeAreaAssetRef(assetInput) {
            if (!assetInput) return null;
            if (typeof assetInput === 'string') {
                const assetId = String(assetInput || '').trim();
                return assetId ? { assetId, storage: assetId.startsWith('area-asset-') ? 'local' : 'server' } : null;
            }
            const assetId = String(assetInput.assetId || '').trim();
            const previewUrl = String(assetInput.previewUrl || '').trim();
            return {
                assetId,
                name: String(assetInput.name || '').trim(),
                type: normalizeAreaAssetType(assetInput.type, assetInput.name),
                storage: String(assetInput.storage || (previewUrl || (assetId && !assetId.startsWith('area-asset-')) ? 'server' : 'local')).trim() || 'local',
                previewUrl,
                downloadUrl: String(assetInput.downloadUrl || '').trim()
            };
        }

        function buildAreaUploadFile(record, fallbackRef) {
            const blob = record?.blob;
            if (!(blob instanceof Blob)) return null;
            const fileName = String(record?.name || fallbackRef?.name || fallbackRef?.assetId || 'area-asset').trim() || 'area-asset';
            const mimeType = String(blob.type || (fallbackRef?.type === 'pdf' ? 'application/pdf' : '') || 'application/octet-stream').trim();
            try {
                return new File([blob], fileName, { type: mimeType });
            } catch (error) {
                blob.name = fileName;
                return blob;
            }
        }

        function collectAreaLocalAssetRefs(mapData) {
            const refs = [];
            if (!mapData || typeof mapData !== 'object') return refs;

            const backgroundRef = normalizeAreaAssetRef(mapData.backgroundAsset);
            if (backgroundRef?.assetId && backgroundRef.storage === 'local') {
                refs.push({
                    assetRef: backgroundRef,
                    markerId: '',
                    assetKind: 'background',
                    apply(nextAsset) {
                        mapData.backgroundAsset = nextAsset;
                    }
                });
            }

            const markers = Array.isArray(mapData.markers) ? mapData.markers : [];
            markers.forEach((marker) => {
                const markerRef = normalizeAreaAssetRef(marker?.asset);
                if (!markerRef?.assetId || markerRef.storage !== 'local') return;
                refs.push({
                    assetRef: markerRef,
                    markerId: String(marker?.id || '').trim(),
                    assetKind: 'marker',
                    apply(nextAsset) {
                        marker.asset = nextAsset;
                    }
                });
            });

            return refs;
        }

        async function purgeAreaLegacyLocalState(templateId, mapData) {
            clearAreaMapLocalBackup(templateId);
            const localRefs = collectAreaLocalAssetRefs(mapData);
            for (const item of localRefs) {
                try {
                    await deleteAreaAssetRecord(item.assetRef);
                } catch (error) {
                    console.warn('[kpi] area local asset cleanup failed', templateId, item.assetRef?.assetId, error);
                }
            }
        }

        async function promoteAreaMapLocalAssets(templateId, mapData) {
            const runtime = getAreaAssetServerRuntimeConfig();
            if (!runtime || runtime.writeEnabled !== true) {
                return {
                    mapData,
                    promotedCount: 0
                };
            }

            const localRefs = collectAreaLocalAssetRefs(mapData);
            if (!localRefs.length) {
                return {
                    mapData,
                    promotedCount: 0
                };
            }

            let promotedCount = 0;
            for (const item of localRefs) {
                const record = await getAreaAssetRecord(item.assetRef.assetId);
                const uploadFile = buildAreaUploadFile(record, item.assetRef);
                if (!(uploadFile instanceof Blob)) {
                    throw new Error(`area_local_asset_missing:${item.assetRef.assetId}`);
                }
                const nextAsset = await saveAreaAssetFile(uploadFile, {
                    templateId,
                    markerId: item.markerId,
                    assetKind: item.assetKind
                });
                item.apply(nextAsset);
                await deleteAreaAssetRecord(item.assetRef).catch((error) => {
                    console.warn('[kpi] area local asset cleanup after promotion failed', templateId, item.assetRef?.assetId, error);
                });
                promotedCount += 1;
            }

            return {
                mapData,
                promotedCount
            };
        }

        async function prepareAreaPayloadForServerWrite(runtime, payload) {
            if (!runtime || !payload) {
                return {
                    payload,
                    promotedCount: 0
                };
            }

            if (runtime.bundleKeys.length > 1) {
                let promotedCount = 0;
                for (const key of runtime.bundleKeys) {
                    if (!payload[key]) continue;
                    const result = await promoteAreaMapLocalAssets(key, payload[key]);
                    promotedCount += result.promotedCount;
                }
                return {
                    payload,
                    promotedCount
                };
            }

            return promoteAreaMapLocalAssets(runtime.sourceKey, payload);
        }

        async function putAreaAssetRecord(record) {
            const db = await openAreaAssetDb();
            if (!db) throw new Error('indexeddb unavailable');
            return new Promise((resolve, reject) => {
                const tx = db.transaction(AREA_ASSET_STORE_NAME, 'readwrite');
                tx.objectStore(AREA_ASSET_STORE_NAME).put({
                    id: record.id,
                    blob: record.blob,
                    name: record.name || '',
                    type: normalizeAreaAssetType(record.type, record.name),
                    updatedAt: new Date().toISOString()
                });
                tx.oncomplete = () => resolve(record);
                tx.onerror = () => reject(tx.error || new Error('asset put failed'));
            });
        }

        async function getAreaAssetRecord(assetId) {
            const id = String(assetId || '').trim();
            if (!id) return null;
            const db = await openAreaAssetDb();
            if (!db) return null;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(AREA_ASSET_STORE_NAME, 'readonly');
                const request = tx.objectStore(AREA_ASSET_STORE_NAME).get(id);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error || new Error('asset get failed'));
            }).catch(err => {
                console.error('설비 자산 조회 실패:', err);
                return null;
            });
        }

        function revokeAreaAssetUrl(assetId) {
            const id = String(assetId || '').trim();
            if (!id || !AreaAssetUrlCache.has(id)) return;
            URL.revokeObjectURL(AreaAssetUrlCache.get(id));
            AreaAssetUrlCache.delete(id);
        }

        async function deleteAreaAssetRecord(assetInput) {
            const ref = normalizeAreaAssetRef(assetInput);
            const id = String(ref?.assetId || '').trim();
            if (!id) return;
            if (ref?.storage === 'server') {
                const runtime = getAreaAssetServerRuntimeConfig();
                if (!runtime || runtime.writeEnabled !== true || typeof fetch !== 'function') return true;
                const response = await fetch(`${runtime.apiBase}/files/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                    credentials: 'same-origin'
                });
                if (!response.ok && response.status !== 404) {
                    throw new Error(`http_${response.status}`);
                }
                return true;
            }
            const db = await openAreaAssetDb();
            if (!db) return;
            revokeAreaAssetUrl(id);
            return new Promise((resolve, reject) => {
                const tx = db.transaction(AREA_ASSET_STORE_NAME, 'readwrite');
                tx.objectStore(AREA_ASSET_STORE_NAME).delete(id);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error || new Error('asset delete failed'));
            }).catch(err => {
                console.error('설비 자산 삭제 실패:', err);
                return false;
            });
        }

        async function saveAreaAssetFile(file, options = {}) {
            if (!(file instanceof Blob)) throw new Error('invalid file');
            const assetId = `area-asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            const normalizedType = normalizeAreaAssetType(file.type, file.name);
            const runtime = getAreaAssetServerRuntimeConfig();
            if (runtime && runtime.writeEnabled === true && typeof fetch === 'function') {
                const base64Data = await readBlobAsBase64(file);
                const ownerKey = [
                    String(options.templateId || '').trim(),
                    String(options.assetKind || 'generic').trim(),
                    String(options.markerId || '').trim()
                ].filter(Boolean).join(':') || 'unassigned';
                const response = await fetch(`${runtime.apiBase}/files/base64`, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        permissionKey: runtime.permissionKey,
                        ownerDomain: 'equip.area.asset',
                        ownerKey,
                        fileCategory: String(options.assetKind || 'area_asset'),
                        originalName: file.name || assetId,
                        mimeType: file.type || 'application/octet-stream',
                        base64Data,
                        metadata: {
                            templateId: String(options.templateId || '').trim(),
                            markerId: String(options.markerId || '').trim(),
                            assetKind: String(options.assetKind || '').trim()
                        }
                    })
                });
                if (!response.ok) {
                    throw new Error(`http_${response.status}`);
                }
                const result = await response.json();
                const documentId = String(result?.document?.id || '').trim();
                return {
                    assetId: documentId,
                    type: normalizedType,
                    name: file.name || assetId,
                    storage: 'server',
                    previewUrl: documentId ? `${runtime.apiBase}/files/${encodeURIComponent(documentId)}/view` : '',
                    downloadUrl: documentId ? `${runtime.apiBase}/files/${encodeURIComponent(documentId)}/download` : ''
                };
            }
            if (runtime) {
                throw new Error('server_storage_unavailable');
            }
            await putAreaAssetRecord({
                id: assetId,
                blob: file,
                name: file.name || assetId,
                type: normalizedType
            });
            return {
                assetId,
                type: normalizedType,
                name: file.name || assetId,
                storage: 'local'
            };
        }

        async function getAreaAssetObjectUrl(assetInput) {
            const ref = normalizeAreaAssetRef(assetInput);
            if (ref?.previewUrl) return ref.previewUrl;
            const id = String(ref?.assetId || '').trim();
            if (!id) return '';
            if (ref?.storage === 'server') {
                const runtime = getAreaAssetServerRuntimeConfig();
                if (!runtime || runtime.readEnabled !== true) return '';
                return `${runtime.apiBase}/files/${encodeURIComponent(id)}/view`;
            }
            if (AreaAssetUrlCache.has(id)) return AreaAssetUrlCache.get(id);
            const record = await getAreaAssetRecord(id);
            if (!record?.blob) return '';
            const url = URL.createObjectURL(record.blob);
            AreaAssetUrlCache.set(id, url);
            return url;
        }

        if (!window.__areaAssetUnloadBound) {
            window.__areaAssetUnloadBound = true;
            window.addEventListener('beforeunload', () => {
                AreaAssetUrlCache.forEach(url => URL.revokeObjectURL(url));
                AreaAssetUrlCache.clear();
            });
        }

        function areaNs(tag) {
            return document.createElementNS(SVG_NS, tag);
        }

        function initAreaMapEditor(shell) {
            if (!shell || shell.dataset.editorReady === 'true') return;
            const canvas = shell.querySelector('[data-area-map-canvas]');
            if (!canvas) return;
            const templateId = canvas.dataset.areaTemplate;
            if (!templateId) return;

            const state = {
                shell,
                canvas,
                templateId,
                svg: null,
                stage: null,
                backgroundLayer: null,
                mapData: null,
                baseViewBox: null,
                zoom: 1,
                activeElement: null,
                selectionRect: null,
                dragging: false,
                deleteMode: false,
                dragStart: null,
                dragOrigin: null,
                pointerId: null,
                didDrag: false,
                activePalette: null,
                isSimpleUi: shell.dataset.areaUi === 'simple',
                pendingLinkTargetId: '',
                pendingDrawingReplaceId: '',
                pendingMarkerReplaceId: '',
                emptyPromptLayer: null
            };

            shell.dataset.editorReady = 'true';
            shell.__areaState = state;
            shell.addEventListener('pointerdown', () => {
                AreaMapState.active = state;
            }, true);

            shell.querySelectorAll('[data-area-action]').forEach(btn => {
                btn.addEventListener('click', () => handleAreaAction(state, btn));
            });
            const drawingInput = shell.querySelector('[data-area-drawing-input]');
            if (drawingInput) {
                drawingInput.addEventListener('change', evt => {
                    void handleAreaDrawingFileSelected(state, evt.target);
                });
            }
            const markerLinkInput = shell.querySelector('[data-area-marker-link-input]');
            if (markerLinkInput) {
                markerLinkInput.addEventListener('change', evt => {
                    void handleAreaMarkerFileSelected(state, evt.target);
                });
            }

            configureAreaPalette(state);
            if (!state.isSimpleUi) toggleAreaPalette(state, true);
            void loadAreaMapFromTemplate(state);
            bindAreaMapHotkeys();
        }

        function configureAreaPalette(state) {
            const allowed = new Set(AreaMapRegistry[state.templateId]?.blockTypes || DEFAULT_AREA_BLOCK_TYPES);
            const select = state.shell.querySelector('[data-area-block-select]');
            const addBtn = state.shell.querySelector('[data-area-action="add-block"]');
            if (!select) return;
            let firstAllowed = '';
            Array.from(select.options).forEach(option => {
                const blockType = option.value || '';
                const enabled = allowed.has(blockType);
                option.disabled = !enabled;
                option.hidden = !enabled;
                if (enabled && !firstAllowed) firstAllowed = blockType;
            });
            const hasAllowed = firstAllowed !== '';
            select.disabled = !hasAllowed;
            if (addBtn) addBtn.disabled = !hasAllowed;
            if (hasAllowed && !allowed.has(select.value)) {
                select.value = firstAllowed;
            }
        }

        function toggleAreaPalette(state, forceOpen) {
            if (!state?.shell) return;
            const isCollapsed = state.shell.classList.contains('area-palette-collapsed');
            const nextOpen = typeof forceOpen === 'boolean' ? forceOpen : isCollapsed;
            state.shell.classList.toggle('area-palette-collapsed', !nextOpen);
            const toggleBtn = state.shell.querySelector('[data-area-action="toggle-palette"]');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        }

        function handleAreaAction(state, btn) {
            if (!state) return;
            AreaMapState.active = state;
            const action = btn?.dataset?.areaAction;
            if (!action) return;
            if (action === 'zoom-in') {
                applyAreaZoom(state, state.zoom * 1.15);
            } else if (action === 'zoom-out') {
                applyAreaZoom(state, state.zoom / 1.15);
            } else if (action === 'restore') {
                state.deleteMode = false;
                const toggleBtn = state.shell.querySelector('[data-area-action="delete-mode"]');
                if (toggleBtn) {
                    toggleBtn.classList.remove('is-active');
                    toggleBtn.setAttribute('aria-pressed', 'false');
                }
                loadAreaMapFromTemplate(state);
            } else if (action === 'delete') {
                deleteSelectedAreaElement(state);
            } else if (action === 'delete-mode') {
                state.deleteMode = !state.deleteMode;
                btn.classList.toggle('is-active', state.deleteMode);
                btn.setAttribute('aria-pressed', state.deleteMode ? 'true' : 'false');
            } else if (action === 'add-block') {
                const selectedType = state.shell.querySelector('[data-area-block-select]')?.value;
                addBlockToMap(state, btn.dataset.blockType || selectedType || 'custom');
            } else if (action === 'insert-drawing') {
                openAreaDrawingPicker(state);
            } else if (action === 'toggle-drawing') {
                void handleAreaDrawingToggle(state);
            } else if (action === 'resize-up') {
                resizeSelectedAreaMarker(state, 1.12);
            } else if (action === 'resize-down') {
                resizeSelectedAreaMarker(state, 0.88);
            } else if (action === 'save') {
                saveAreaMapToStorage(state);
            } else if (action === 'export-json') {
                exportAreaMapJson(state);
            } else if (action === 'toggle-palette') {
                toggleAreaPalette(state);
            }
        }

        function getStorageKey(templateId) {
            return `areaMap_${templateId}`;
        }

        function loadAreaMapFromStorage(templateId) {
            return loadAreaMapLocalBackup(templateId);
        }

        function supportsInlineDrawingEmptyState(templateId) {
            return AREA_INLINE_DRAWING_TEMPLATE_IDS.has(String(templateId || '').trim());
        }

        function normalizeAreaPlaceholderText(value) {
            return String(value || '').replace(/\s+/g, '').trim();
        }

        function normalizeAreaMapData(templateId, mapData) {
            if (!mapData || typeof mapData !== 'object') return { mapData: null, changed: false };
            let changed = false;
            if (supportsInlineDrawingEmptyState(templateId) && mapData.image === AREA_LEGACY_DEFAULT_IMAGE) {
                delete mapData.image;
                changed = true;
            }
            const legacyRule = AREA_LEGACY_PLACEHOLDER_RULES[String(templateId || '').trim()] || null;
            const sourceMarkers = Array.isArray(mapData.markers) ? mapData.markers : [];
            const sourceLabels = Array.isArray(mapData.labels) ? mapData.labels : [];
            if (!Array.isArray(mapData.markers) || !Array.isArray(mapData.labels)) {
                changed = true;
            }
            mapData.markers = sourceMarkers.filter(marker => {
                if (!legacyRule) return true;
                const markerId = String(marker?.id || '').trim();
                const markerLabel = normalizeAreaPlaceholderText(marker?.label);
                const shouldRemove = legacyRule.markerIds.has(markerId) || legacyRule.markerLabels.has(markerLabel);
                if (shouldRemove) changed = true;
                return !shouldRemove;
            });
            mapData.labels = sourceLabels.filter(label => {
                if (!legacyRule) return true;
                const labelId = String(label?.id || '').trim();
                const labelText = normalizeAreaPlaceholderText(label?.text);
                const shouldRemove = legacyRule.labelIds.has(labelId) || legacyRule.labelTexts.has(labelText);
                if (shouldRemove) changed = true;
                return !shouldRemove;
            });
            return { mapData, changed };
        }

        async function loadAreaMapFromTemplate(state) {
            const dataKey = state.templateId;
            const serverRuntime = getAreaServerRuntimeConfig(dataKey);
            const serverMode = !!serverRuntime;
            const serverReadBlocked = !!(serverRuntime && serverRuntime.readEnabled !== true);
            const serverMapData = serverRuntime && serverRuntime.readEnabled === true
                ? window.AreaMapData?.[dataKey]
                : null;
            const localBackup = loadAreaMapLocalBackup(dataKey);
            const storedMapData = (serverMode || serverMapData || serverReadBlocked) ? null : localBackup;
            const mapData = serverMapData || storedMapData || (serverMode || serverReadBlocked ? null : window.AreaMapData?.[dataKey]);
            if (!mapData) {
                state.canvas.innerHTML = serverReadBlocked
                    ? `<div class="text-slate-400 text-sm">현재 계정은 이 설비 배치도를 읽을 수 없습니다.</div>`
                    : `<div class="text-slate-400 text-sm">면적도 데이터를 찾을 수 없습니다.</div>`;
                return;
            }
            const normalized = normalizeAreaMapData(state.templateId, JSON.parse(JSON.stringify(mapData)));
            state.mapData = normalized.mapData;
            if (storedMapData && normalized.changed) {
                try {
                    storeAreaMapLocalBackup(dataKey, state.mapData);
                } catch (err) {
                    console.warn('설비 맵 저장 데이터 정리에 실패했습니다.', err);
                }
            }
            if (serverMapData && localBackup) {
                void purgeAreaLegacyLocalState(dataKey, localBackup);
            }
            await renderAreaMapState(state, { zoom: 1 });
        }

        async function renderAreaMapState(state, options = {}) {
            if (!state?.canvas || !state?.mapData) return;
            state.canvas.innerHTML = '';
            const stage = document.createElement('div');
            stage.className = 'area-map-stage';
            const backgroundLayer = document.createElement('div');
            backgroundLayer.className = 'area-map-background';
            stage.appendChild(backgroundLayer);
            const svg = buildAreaMapSvg(state.mapData);
            if (!svg) return;
            stage.appendChild(svg);
            const emptyPromptLayer = document.createElement('div');
            emptyPromptLayer.className = 'area-map-empty-layer';
            stage.appendChild(emptyPromptLayer);
            state.canvas.appendChild(stage);
            state.stage = stage;
            state.backgroundLayer = backgroundLayer;
            state.svg = svg;
            state.emptyPromptLayer = emptyPromptLayer;
            state.baseViewBox = parseAreaViewBox(svg);
            state.activeElement = null;
            state.selectionRect = null;
            state.dragging = false;
            state.dragStart = null;
            state.dragOrigin = null;
            state.pointerId = null;
            state.didDrag = false;
            svg.style.touchAction = 'none';
            ensureAreaOverlay(state);
            bindAreaMapPointer(state);
            await renderAreaBackground(state);
            applyAreaZoom(state, Number(options.zoom) || 1);
            if (options.selectionId) {
                const selection = findAreaElementById(state, options.selectionId);
                if (selection) selectAreaElement(state, selection);
            }
            updateAreaToolAvailability(state);
        }

        function buildAreaMapSvg(mapData) {
            if (!mapData?.viewBox) return null;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
            svg.setAttribute('viewBox', mapData.viewBox);
            svg.setAttribute('class', 'area-map-editor');
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', '면적도 편집');

            const markerGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            markerGroup.setAttribute('class', 'area-map-markers');
            (mapData.markers || []).forEach(marker => {
                const node = buildAreaMarker(marker);
                if (node) markerGroup.appendChild(node);
            });
            svg.appendChild(markerGroup);
            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            labelGroup.setAttribute('class', 'area-map-labels');
            (mapData.labels || []).forEach(label => {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.textContent = label.text;
                text.setAttribute('x', label.x);
                text.setAttribute('y', label.y);
                text.setAttribute('data-area-label', 'true');
                text.setAttribute('data-area-id', label.id || '');
                text.setAttribute('class', 'area-map-label');
                labelGroup.appendChild(text);
            });
            svg.appendChild(labelGroup);
            return svg;
        }

        function buildAreaMarker(marker) {
            if (!marker || !marker.type) return null;
            if (marker.type === 'tank') return buildTankMarker(marker);
            if (marker.type === 'pump') return buildPumpMarker(marker);
            if (marker.type === 'valve') return buildValveMarker(marker);
            if (marker.type === 'custom') return buildCustomMarker(marker);
            if (marker.type === 'motor') return buildMotorMarker(marker);
            if (marker.type === 'compressor') return buildCompressorMarker(marker);
            if (marker.type === 'boiler') return buildBoilerMarker(marker);
            if (marker.type === 'mixer') return buildMixerMarker(marker);
            if (marker.type === 'agitator') return buildAgitatorMarker(marker);
            if (marker.type === 'chiller') return buildChillerMarker(marker);
            return buildCustomMarker(marker);
        }

        function resolveAreaHref(path) {
            if (!path) return '';
            try {
                return new URL(path, window.location.href).toString();
            } catch (err) {
                return encodeURI(path);
            }
        }

        function markerSize(marker, defaultWidth, defaultHeight) {
            const width = Number(marker?.width);
            const height = Number(marker?.height);
            return {
                width: Number.isFinite(width) && width > 0 ? width : defaultWidth,
                height: Number.isFinite(height) && height > 0 ? height : defaultHeight
            };
        }

        function createMarkerGroup(marker, blockType) {
            const group = areaNs('g');
            group.setAttribute('class', `area-map-marker area-block-${blockType}`);
            group.setAttribute('data-area-marker', 'true');
            group.setAttribute('data-block-type', blockType);
            if (marker.id) group.setAttribute('data-area-id', marker.id);
            if (marker.href) group.setAttribute('data-area-link-href', marker.href);
            if (marker.asset?.assetId) group.setAttribute('data-area-asset-id', marker.asset.assetId);
            if (marker.asset?.name) group.setAttribute('data-area-asset-name', marker.asset.name);
            if (marker.asset?.type) group.setAttribute('data-area-asset-type', marker.asset.type);
            if (marker.label || marker.asset?.name) {
                const title = areaNs('title');
                title.textContent = [marker.label, marker.asset?.name].filter(Boolean).join(' · ');
                group.appendChild(title);
            }
            const x = Number(marker.x) || 0;
            const y = Number(marker.y) || 0;
            group.setAttribute('transform', `translate(${x}, ${y})`);
            return group;
        }

        function wrapWithHref(path, child) {
            if (child?.getAttribute?.('data-area-asset-id')) return child;
            if (!path) return child;
            const link = areaNs('a');
            const href = resolveAreaHref(path);
            link.setAttribute('href', href);
            link.setAttributeNS(XLINK_NS, 'href', href);
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener');
            link.appendChild(child);
            return link;
        }

        function buildTankMarker(marker) {
            const group = createMarkerGroup(marker, 'tank');
            const { width, height } = markerSize(marker, 32, 40);
            const left = -width / 2;
            const top = -height / 2;
            const capHeight = Math.max(6, width * 0.28);
            const bodyHeight = height - capHeight;

            const bottom = areaNs('ellipse');
            bottom.setAttribute('class', 'tank-bottom');
            bottom.setAttribute('cx', 0);
            bottom.setAttribute('cy', top + capHeight / 2 + bodyHeight);
            bottom.setAttribute('rx', width / 2);
            bottom.setAttribute('ry', capHeight / 2);

            const body = areaNs('rect');
            body.setAttribute('class', 'tank-body');
            body.setAttribute('x', left);
            body.setAttribute('y', top + capHeight / 2);
            body.setAttribute('width', width);
            body.setAttribute('height', bodyHeight);
            body.setAttribute('rx', Math.max(2, width * 0.18));

            const topCap = areaNs('ellipse');
            topCap.setAttribute('class', 'tank-top');
            topCap.setAttribute('cx', 0);
            topCap.setAttribute('cy', top + capHeight / 2);
            topCap.setAttribute('rx', width / 2);
            topCap.setAttribute('ry', capHeight / 2);

            group.appendChild(bottom);
            group.appendChild(body);
            group.appendChild(topCap);
            return wrapWithHref(marker.href, group);
        }

        function buildPumpMarker(marker) {
            const group = createMarkerGroup(marker, 'pump');
            const { width, height } = markerSize(marker, 32, 32);
            const radius = Math.max(9, Math.min(width, height) / 2.2);

            const circle = areaNs('circle');
            circle.setAttribute('cx', 0);
            circle.setAttribute('cy', 0);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', '#dbeafe');
            circle.setAttribute('stroke', '#2563eb');
            circle.setAttribute('stroke-width', '1.6');
            circle.setAttribute('vector-effect', 'non-scaling-stroke');

            const cross = areaNs('path');
            cross.setAttribute('d', `M${-radius * 0.55},0 H${radius * 0.55} M0,${-radius * 0.55} V${radius * 0.55}`);
            cross.setAttribute('stroke', '#1d4ed8');
            cross.setAttribute('stroke-width', '1.8');
            cross.setAttribute('fill', 'none');
            cross.setAttribute('vector-effect', 'non-scaling-stroke');

            group.appendChild(circle);
            group.appendChild(cross);
            return wrapWithHref(marker.href, group);
        }

        function buildValveMarker(marker) {
            const group = createMarkerGroup(marker, 'valve');
            const { width, height } = markerSize(marker, 24, 24);
            const hw = width / 2;
            const hh = height / 2;
            const diamond = areaNs('polygon');
            diamond.setAttribute('points', `0,${-hh} ${hw},0 0,${hh} ${-hw},0`);
            diamond.setAttribute('fill', '#fef3c7');
            diamond.setAttribute('stroke', '#d97706');
            diamond.setAttribute('stroke-width', '1.6');
            diamond.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(diamond);
            return wrapWithHref(marker.href, group);
        }

        function buildCustomMarker(marker) {
            const group = createMarkerGroup(marker, 'custom');
            const { width, height } = markerSize(marker, 30, 20);
            const rect = areaNs('rect');
            rect.setAttribute('x', -width / 2);
            rect.setAttribute('y', -height / 2);
            rect.setAttribute('width', width);
            rect.setAttribute('height', height);
            rect.setAttribute('rx', 3);
            rect.setAttribute('fill', '#f1f5f9');
            rect.setAttribute('stroke', '#475569');
            rect.setAttribute('stroke-width', '1.5');
            rect.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(rect);
            if (marker.label) {
                const text = areaNs('text');
                text.setAttribute('x', 0);
                text.setAttribute('y', 3);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '8');
                text.setAttribute('fill', '#334155');
                text.setAttribute('pointer-events', 'none');
                text.textContent = marker.label;
                group.appendChild(text);
            }
            return wrapWithHref(marker.href, group);
        }

        function buildMotorMarker(marker) {
            const group = createMarkerGroup(marker, 'motor');
            const { width } = markerSize(marker, 32, 32);
            const radius = Math.max(9, width / 2.2);
            const outer = areaNs('circle');
            outer.setAttribute('cx', 0);
            outer.setAttribute('cy', 0);
            outer.setAttribute('r', radius);
            outer.setAttribute('fill', '#dcfce7');
            outer.setAttribute('stroke', '#15803d');
            outer.setAttribute('stroke-width', '1.6');
            outer.setAttribute('vector-effect', 'non-scaling-stroke');
            const inner = areaNs('circle');
            inner.setAttribute('cx', 0);
            inner.setAttribute('cy', 0);
            inner.setAttribute('r', radius * 0.72);
            inner.setAttribute('fill', 'none');
            inner.setAttribute('stroke', '#166534');
            inner.setAttribute('stroke-width', '1.2');
            inner.setAttribute('vector-effect', 'non-scaling-stroke');
            const letter = areaNs('text');
            letter.setAttribute('x', 0);
            letter.setAttribute('y', 4);
            letter.setAttribute('text-anchor', 'middle');
            letter.setAttribute('font-size', '11');
            letter.setAttribute('font-weight', '700');
            letter.setAttribute('fill', '#166534');
            letter.setAttribute('pointer-events', 'none');
            letter.textContent = 'M';
            group.appendChild(outer);
            group.appendChild(inner);
            group.appendChild(letter);
            return wrapWithHref(marker.href, group);
        }

        function buildCompressorMarker(marker) {
            const group = createMarkerGroup(marker, 'compressor');
            const { width } = markerSize(marker, 34, 34);
            const radius = Math.max(10, width / 2.2);
            const body = areaNs('circle');
            body.setAttribute('cx', 0);
            body.setAttribute('cy', 0);
            body.setAttribute('r', radius);
            body.setAttribute('fill', '#fffbeb');
            body.setAttribute('stroke', '#b45309');
            body.setAttribute('stroke-width', '1.6');
            body.setAttribute('vector-effect', 'non-scaling-stroke');
            const line1 = areaNs('line');
            line1.setAttribute('x1', -radius * 0.65);
            line1.setAttribute('y1', -radius * 0.65);
            line1.setAttribute('x2', radius * 0.65);
            line1.setAttribute('y2', radius * 0.65);
            line1.setAttribute('stroke', '#ea580c');
            line1.setAttribute('stroke-width', '1.8');
            line1.setAttribute('vector-effect', 'non-scaling-stroke');
            const line2 = areaNs('line');
            line2.setAttribute('x1', radius * 0.65);
            line2.setAttribute('y1', -radius * 0.65);
            line2.setAttribute('x2', -radius * 0.65);
            line2.setAttribute('y2', radius * 0.65);
            line2.setAttribute('stroke', '#ea580c');
            line2.setAttribute('stroke-width', '1.8');
            line2.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(body);
            group.appendChild(line1);
            group.appendChild(line2);
            return wrapWithHref(marker.href, group);
        }

        function buildBoilerMarker(marker) {
            const group = createMarkerGroup(marker, 'boiler');
            const { width, height } = markerSize(marker, 44, 28);
            const body = areaNs('rect');
            body.setAttribute('x', -width / 2);
            body.setAttribute('y', -height / 2);
            body.setAttribute('width', width);
            body.setAttribute('height', height);
            body.setAttribute('rx', height / 2);
            body.setAttribute('fill', '#fee2e2');
            body.setAttribute('stroke', '#b91c1c');
            body.setAttribute('stroke-width', '1.8');
            body.setAttribute('vector-effect', 'non-scaling-stroke');
            const waterLine = areaNs('line');
            waterLine.setAttribute('x1', -width / 2 + 6);
            waterLine.setAttribute('y1', 2);
            waterLine.setAttribute('x2', width / 2 - 6);
            waterLine.setAttribute('y2', 2);
            waterLine.setAttribute('stroke', '#3b82f6');
            waterLine.setAttribute('stroke-width', '1.2');
            waterLine.setAttribute('stroke-dasharray', '4 2');
            waterLine.setAttribute('vector-effect', 'non-scaling-stroke');
            const flame = areaNs('path');
            flame.setAttribute('d', `M -4 ${height / 2 + 2} C -8 ${height / 2 - 4} -2 ${height / 2 - 8} 0 ${height / 2 - 2} C 2 ${height / 2 - 8} 6 ${height / 2 - 5} 4 ${height / 2 + 2} Z`);
            flame.setAttribute('fill', '#ef4444');
            flame.setAttribute('stroke', 'none');
            flame.setAttribute('opacity', '0.9');
            group.appendChild(body);
            group.appendChild(waterLine);
            group.appendChild(flame);
            return wrapWithHref(marker.href, group);
        }

        function buildMixerMarker(marker) {
            const group = createMarkerGroup(marker, 'mixer');
            const { width, height } = markerSize(marker, 30, 46);
            const halfW = width / 2;
            const body = areaNs('rect');
            body.setAttribute('x', -halfW);
            body.setAttribute('y', -height / 2 + 5);
            body.setAttribute('width', width);
            body.setAttribute('height', height - 10);
            body.setAttribute('fill', '#ede9fe');
            body.setAttribute('stroke', '#6d28d9');
            body.setAttribute('stroke-width', '1.5');
            body.setAttribute('vector-effect', 'non-scaling-stroke');
            const top = areaNs('ellipse');
            top.setAttribute('cx', 0);
            top.setAttribute('cy', -height / 2 + 5);
            top.setAttribute('rx', halfW);
            top.setAttribute('ry', 5);
            top.setAttribute('fill', '#ddd6fe');
            top.setAttribute('stroke', '#6d28d9');
            top.setAttribute('stroke-width', '1.5');
            top.setAttribute('vector-effect', 'non-scaling-stroke');
            const shaft = areaNs('line');
            shaft.setAttribute('x1', 0);
            shaft.setAttribute('y1', -height / 2 - 7);
            shaft.setAttribute('x2', 0);
            shaft.setAttribute('y2', height / 2 - 9);
            shaft.setAttribute('stroke', '#4c1d95');
            shaft.setAttribute('stroke-width', '1.4');
            shaft.setAttribute('vector-effect', 'non-scaling-stroke');
            const blade = areaNs('path');
            blade.setAttribute('d', `M -${halfW - 2} 4 Q 0 -2 ${halfW - 2} 4`);
            blade.setAttribute('fill', 'none');
            blade.setAttribute('stroke', '#7c3aed');
            blade.setAttribute('stroke-width', '2');
            blade.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(body);
            group.appendChild(top);
            group.appendChild(shaft);
            group.appendChild(blade);
            return wrapWithHref(marker.href, group);
        }
