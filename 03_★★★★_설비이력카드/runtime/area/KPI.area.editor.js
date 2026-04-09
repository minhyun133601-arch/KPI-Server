        function buildAgitatorMarker(marker) {
            const group = createMarkerGroup(marker, 'agitator');
            const { width, height } = markerSize(marker, 30, 40);
            const tank = areaNs('rect');
            tank.setAttribute('x', -width / 2);
            tank.setAttribute('y', -height / 2 + 6);
            tank.setAttribute('width', width);
            tank.setAttribute('height', height - 12);
            tank.setAttribute('fill', '#ecfeff');
            tank.setAttribute('stroke', '#0e7490');
            tank.setAttribute('stroke-width', '1.5');
            tank.setAttribute('vector-effect', 'non-scaling-stroke');
            const shaft = areaNs('line');
            shaft.setAttribute('x1', 0);
            shaft.setAttribute('y1', -height / 2 - 8);
            shaft.setAttribute('x2', 0);
            shaft.setAttribute('y2', height / 2 - 6);
            shaft.setAttribute('stroke', '#0e7490');
            shaft.setAttribute('stroke-width', '1.5');
            shaft.setAttribute('vector-effect', 'non-scaling-stroke');
            const impeller = areaNs('path');
            impeller.setAttribute('d', `M -${width / 2 - 2} -1 H ${width / 2 - 2} M -${width / 3} 6 H ${width / 3}`);
            impeller.setAttribute('stroke', '#06b6d4');
            impeller.setAttribute('stroke-width', '2');
            impeller.setAttribute('fill', 'none');
            impeller.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(tank);
            group.appendChild(shaft);
            group.appendChild(impeller);
            return wrapWithHref(marker.href, group);
        }

        function buildChillerMarker(marker) {
            const group = createMarkerGroup(marker, 'chiller');
            const { width, height } = markerSize(marker, 46, 32);
            const body = areaNs('rect');
            body.setAttribute('x', -width / 2);
            body.setAttribute('y', -height / 2);
            body.setAttribute('width', width);
            body.setAttribute('height', height);
            body.setAttribute('rx', 3);
            body.setAttribute('fill', '#e0f2fe');
            body.setAttribute('stroke', '#0369a1');
            body.setAttribute('stroke-width', '1.5');
            body.setAttribute('vector-effect', 'non-scaling-stroke');
            const fan = areaNs('path');
            fan.setAttribute('d', 'M -7 0 H 7 M 0 -7 V 7 M -5 -5 L 5 5 M 5 -5 L -5 5');
            fan.setAttribute('stroke', '#0ea5e9');
            fan.setAttribute('stroke-width', '1.8');
            fan.setAttribute('fill', 'none');
            fan.setAttribute('vector-effect', 'non-scaling-stroke');
            group.appendChild(body);
            group.appendChild(fan);
            return wrapWithHref(marker.href, group);
        }

        function findAreaMarkerData(state, element = state?.activeElement) {
            const id = String(element?.getAttribute?.('data-area-id') || '').trim();
            if (!id || !Array.isArray(state?.mapData?.markers)) return null;
            return state.mapData.markers.find(marker => marker.id === id) || null;
        }

        function findAreaElementById(state, id) {
            const targetId = String(id || '').trim();
            if (!targetId || !state?.svg) return null;
            return Array.from(state.svg.querySelectorAll('[data-area-id]')).find(el => String(el.getAttribute('data-area-id') || '') === targetId) || null;
        }

        function getAreaBackgroundDisplayInfo(state) {
            const asset = state?.mapData?.backgroundAsset;
            if (asset?.assetId) return { label: asset.name || '삽입 도면', kind: asset.type || 'file' };
            if (state?.mapData?.image) return { label: '기본 도면', kind: 'image' };
            return { label: '도면 미삽입', kind: 'none' };
        }

        function hasInsertedAreaDrawing(state) {
            return String(state?.mapData?.backgroundAsset?.assetId || '').trim() !== '';
        }

        function clearAreaEmptyPrompt(state) {
            const layer = state?.emptyPromptLayer;
            if (!layer) return;
            layer.innerHTML = '';
            layer.classList.remove('is-visible');
            layer.classList.remove('is-docked');
        }

        function showAreaEmptyPrompt(state) {
            if (!state?.emptyPromptLayer || !supportsInlineDrawingEmptyState(state.templateId)) return;
            const hasPlacedElements = (state.mapData?.markers?.length || 0) > 0 || (state.mapData?.labels?.length || 0) > 0;
            if (hasPlacedElements) return;
            const card = document.createElement('div');
            card.className = 'area-map-empty-card';
            const text = document.createElement('div');
            text.className = 'area-map-empty-text';
            text.textContent = '도면이 비어 있습니다.';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'area-tool primary area-map-empty-action';
            button.title = 'PDF 또는 JPG 도면 삽입';
            button.innerHTML = '<i class="fas fa-file-arrow-up"></i>도면 삽입';
            button.addEventListener('click', evt => {
                evt.preventDefault();
                evt.stopPropagation();
                openAreaDrawingPicker(state);
            });
            card.appendChild(text);
            card.appendChild(button);
            state.emptyPromptLayer.appendChild(card);
            state.emptyPromptLayer.classList.add('is-visible');
        }

        async function renderAreaBackground(state) {
            const layer = state?.backgroundLayer;
            if (!layer) return;
            layer.innerHTML = '';
            layer.classList.remove('is-empty');
            clearAreaEmptyPrompt(state);
            const backgroundAsset = state?.mapData?.backgroundAsset;
            if (backgroundAsset?.assetId) {
                const src = await getAreaAssetObjectUrl(backgroundAsset.assetId);
                if (src) {
                    const kind = normalizeAreaAssetType(backgroundAsset.type, backgroundAsset.name);
                    if (kind === 'pdf') {
                        const embed = document.createElement('embed');
                        embed.src = `${src}#toolbar=0&navpanes=0&scrollbar=0`;
                        embed.type = 'application/pdf';
                        layer.appendChild(embed);
                    } else {
                        const img = document.createElement('img');
                        img.src = src;
                        img.alt = backgroundAsset.name || '설비 도면';
                        layer.appendChild(img);
                    }
                    return;
                }
            }
            if (state?.mapData?.image) {
                const img = document.createElement('img');
                img.src = resolveAreaHref(state.mapData.image);
                img.alt = '기본 설비 도면';
                layer.appendChild(img);
                return;
            }
            layer.classList.add('is-empty');
            showAreaEmptyPrompt(state);
        }

        function updateAreaDrawingToggle(state) {
            if (!state?.shell) return;
            const hasInsertedDrawing = hasInsertedAreaDrawing(state);
            state.shell.querySelectorAll('[data-area-drawing-toggle]').forEach(button => {
                const label = button.querySelector('[data-area-drawing-label]');
                const icon = button.querySelector('i');
                if (hasInsertedDrawing) {
                    button.classList.remove('primary');
                    button.classList.add('danger');
                    button.title = '삽입 도면 삭제';
                    if (icon) icon.className = 'fas fa-trash';
                    if (label) label.textContent = '도면 삭제';
                } else {
                    button.classList.remove('danger');
                    button.classList.add('primary');
                    button.title = 'PDF 또는 JPG 도면 삽입';
                    if (icon) icon.className = 'fas fa-file-arrow-up';
                    if (label) label.textContent = '도면 삽입';
                }
            });
        }

        function updateAreaToolAvailability(state) {
            if (!state?.shell) return;
            const hasSelectedMarker = state.activeElement?.getAttribute?.('data-area-marker') === 'true';
            ['resize-up', 'resize-down'].forEach(action => {
                state.shell.querySelectorAll(`[data-area-action="${action}"]`).forEach(button => {
                    button.disabled = !hasSelectedMarker;
                });
            });
            if (state.isSimpleUi) {
                const selectionTools = state.shell.querySelector('[data-area-selection-tools]');
                if (selectionTools) selectionTools.hidden = !hasSelectedMarker;
                state.shell.querySelectorAll('[data-area-action="delete"]').forEach(button => {
                    button.disabled = !hasSelectedMarker;
                });
            }
            updateAreaDrawingToggle(state);
            const status = state.shell.querySelector('[data-area-status]');
            if (status) {
                const backgroundInfo = getAreaBackgroundDisplayInfo(state);
                const selectedMarker = findAreaMarkerData(state);
                const markerLabel = selectedMarker?.label
                    || selectedMarker?.asset?.name
                    || (hasSelectedMarker ? '선택 블록' : '블록 미선택');
                status.textContent = `${backgroundInfo.label} · ${markerLabel}`;
            }
        }

        function openAreaDrawingPicker(state) {
            const input = state?.shell?.querySelector('[data-area-drawing-input]');
            if (!input) return;
            state.pendingDrawingReplaceId = String(state?.mapData?.backgroundAsset?.assetId || '').trim();
            input.value = '';
            input.click();
        }

        async function resetAreaBackgroundToInitial(state) {
            if (!state?.mapData) return;
            const previousAssetId = String(state.mapData.backgroundAsset?.assetId || '').trim();
            state.pendingDrawingReplaceId = '';
            if (previousAssetId) await deleteAreaAssetRecord(previousAssetId);
            delete state.mapData.backgroundAsset;
            await renderAreaBackground(state);
            saveAreaMapToStorage(state, { silent: true });
            updateAreaToolAvailability(state);
        }

        async function handleAreaDrawingToggle(state) {
            if (!state?.mapData) return;
            if (hasInsertedAreaDrawing(state)) {
                await resetAreaBackgroundToInitial(state);
                return;
            }
            openAreaDrawingPicker(state);
        }

        async function handleAreaDrawingFileSelected(state, input) {
            const file = input?.files?.[0];
            if (!state?.mapData || !file) return;
            const asset = await saveAreaAssetFile(file, {
                templateId: state.templateId,
                assetKind: 'background'
            }).catch(err => {
                console.error('도면 저장 실패:', err);
                alert('도면 저장에 실패했습니다.');
                return null;
            });
            input.value = '';
            if (!asset) return;
            if (state.pendingDrawingReplaceId) {
                await deleteAreaAssetRecord(state.pendingDrawingReplaceId);
            }
            state.pendingDrawingReplaceId = '';
            state.mapData.backgroundAsset = asset;
            await renderAreaBackground(state);
            saveAreaMapToStorage(state, { silent: true });
            updateAreaToolAvailability(state);
        }

        async function handleAreaMarkerFileSelected(state, input) {
            const file = input?.files?.[0];
            const targetId = String(state?.pendingLinkTargetId || state?.activeElement?.getAttribute?.('data-area-id') || '').trim();
            const marker = findAreaMarkerData(state, findAreaElementById(state, targetId));
            input.value = '';
            if (!state?.mapData || !file || !marker) return;
            const asset = await saveAreaAssetFile(file, {
                templateId: state.templateId,
                markerId: marker.id,
                assetKind: 'marker'
            }).catch(err => {
                console.error('설비 카드 저장 실패:', err);
                alert('설비 이력카드 연결에 실패했습니다.');
                return null;
            });
            if (!asset) return;
            const previousAssetId = String(marker.asset?.assetId || '').trim();
            if (previousAssetId) await deleteAreaAssetRecord(previousAssetId);
            marker.asset = asset;
            state.pendingLinkTargetId = '';
            await renderAreaMapState(state, { zoom: state.zoom, selectionId: marker.id });
            saveAreaMapToStorage(state, { silent: true });
        }

        function openAreaMarkerLinkPicker(state, element = state?.activeElement) {
            if (!state?.isSimpleUi) return;
            const marker = findAreaMarkerData(state, element);
            const input = state?.shell?.querySelector('[data-area-marker-link-input]');
            if (!marker || !input) return;
            state.pendingLinkTargetId = marker.id;
            input.value = '';
            input.click();
        }

        async function openAreaLinkedAsset(element) {
            if (!element?.getAttribute) return false;
            const assetId = String(element.getAttribute('data-area-asset-id') || '').trim();
            if (assetId) {
                const popup = window.open('', '_blank', 'noopener');
                const url = await getAreaAssetObjectUrl(assetId);
                if (!url) {
                    popup?.close?.();
                    return false;
                }
                if (popup && !popup.closed) popup.location = url;
                else window.open(url, '_blank', 'noopener');
                return true;
            }
            const href = String(element.getAttribute('data-area-link-href') || element.closest?.('a')?.getAttribute?.('href') || '').trim();
            if (!href) return false;
            window.open(resolveAreaHref(href), '_blank', 'noopener');
            return true;
        }

        function resizeSelectedAreaMarker(state, factor) {
            const marker = findAreaMarkerData(state);
            if (!marker) return;
            const nextWidth = Math.max(18, Math.min(180, Math.round((Number(marker.width) || 32) * factor)));
            const nextHeight = Math.max(18, Math.min(180, Math.round((Number(marker.height) || 32) * factor)));
            marker.width = nextWidth;
            marker.height = nextHeight;
            void renderAreaMapState(state, { zoom: state.zoom, selectionId: marker.id }).then(() => {
                saveAreaMapToStorage(state, { silent: true });
            });
        }

        function parseAreaViewBox(svg) {
            const vb = svg.getAttribute('viewBox');
            if (vb) {
                const parts = vb.trim().split(/\s+/).map(Number);
                if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
                    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
                }
            }
            const width = parseFloat(svg.getAttribute('width')) || 1000;
            const height = parseFloat(svg.getAttribute('height')) || 800;
            return { x: 0, y: 0, width, height };
        }

        function applyAreaZoom(state, zoom) {
            if (!state.svg || !state.baseViewBox) return;
            const clamped = Math.max(0.4, Math.min(zoom, 3));
            state.zoom = clamped;
            const base = state.baseViewBox;
            const width = base.width / clamped;
            const height = base.height / clamped;
            const x = base.x + (base.width - width) / 2;
            const y = base.y + (base.height - height) / 2;
            state.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
            updateAreaSelection(state);
        }

        function bindAreaMapPointer(state) {
            const svg = state.svg;
            if (!svg) return;
            svg.onpointerdown = evt => areaPointerDown(state, evt);
            svg.onpointermove = evt => areaPointerMove(state, evt);
            svg.onpointerup = evt => areaPointerUp(state, evt);
            svg.onpointerleave = evt => areaPointerUp(state, evt);
            svg.onpointercancel = evt => areaPointerUp(state, evt);
            svg.oncontextmenu = evt => areaContextMenu(state, evt);
        }

        function areaPointerDown(state, evt) {
            const target = resolveAreaTarget(evt.target);
            AreaMapState.active = state;
            if (!target) {
                clearAreaSelection(state);
                return;
            }
            evt.preventDefault();
            if (state.deleteMode) {
                removeAreaElement(state, target);
                clearAreaSelection(state);
                return;
            }
            selectAreaElement(state, target);
            state.dragging = true;
            state.didDrag = false;
            state.dragStart = getSvgPoint(state.svg, evt);
            state.dragOrigin = getElementPosition(target);
            state.pointerId = evt.pointerId;
            state.svg.setPointerCapture?.(evt.pointerId);
            state.canvas.classList.add('is-dragging');
        }

        function areaPointerMove(state, evt) {
            if (!state.dragging || !state.activeElement) return;
            const current = getSvgPoint(state.svg, evt);
            if (!current || !state.dragStart) return;
            const dx = current.x - state.dragStart.x;
            const dy = current.y - state.dragStart.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) state.didDrag = true;
            const tx = (state.dragOrigin?.x || 0) + dx;
            const ty = (state.dragOrigin?.y || 0) + dy;
            setElementPosition(state.activeElement, tx, ty);
            updateAreaSelection(state);
        }

        function areaPointerUp(state, evt) {
            if (!state.dragging) return;
            state.dragging = false;
            if (!state.didDrag && state.activeElement?.getAttribute?.('data-area-marker') === 'true') {
                void openAreaLinkedAsset(state.activeElement);
            } else if (state.didDrag) {
                saveAreaMapToStorage(state, { silent: true });
            }
            state.dragStart = null;
            state.dragOrigin = null;
            state.didDrag = false;
            if (state.pointerId != null) {
                state.svg.releasePointerCapture?.(state.pointerId);
                state.pointerId = null;
            }
            state.canvas.classList.remove('is-dragging');
            updateAreaToolAvailability(state);
        }

        function areaContextMenu(state, evt) {
            const target = resolveAreaTarget(evt.target);
            if (!target || target.getAttribute?.('data-area-marker') !== 'true') return;
            evt.preventDefault();
            selectAreaElement(state, target);
            openAreaMarkerLinkPicker(state, target);
        }

        function resolveAreaTarget(target) {
            if (!target) return null;
            const tag = target.tagName?.toLowerCase();
            if (!tag || tag === 'svg') return null;
            if (target.closest && target.closest('#area-editor-overlay')) return null;
            const labelElement = tag === 'tspan' ? target.parentElement : target;
            if (labelElement?.getAttribute && labelElement.getAttribute('data-area-label') === 'true') return labelElement;
            const markerRoot = target.closest?.('[data-area-marker="true"]');
            if (markerRoot) return markerRoot;
            const linkedMarker = target.closest?.('a')?.querySelector?.('[data-area-marker="true"]');
            if (linkedMarker) return linkedMarker;
            return null;
        }

        function selectAreaElement(state, element) {
            if (state.activeElement) state.activeElement.classList.remove('is-selected');
            state.activeElement = element;
            state.activeElement?.classList.add('is-selected');
            updateAreaSelection(state);
            updateAreaToolAvailability(state);
        }

        function clearAreaSelection(state) {
            if (state.activeElement) state.activeElement.classList.remove('is-selected');
            state.activeElement = null;
            if (state.selectionRect) state.selectionRect.setAttribute('visibility', 'hidden');
            updateAreaToolAvailability(state);
        }

        function removeAreaDataByElement(state, element) {
            if (!state?.mapData || !element?.getAttribute) return;
            const id = element.getAttribute('data-area-id');
            if (!id) return;
            if (element.getAttribute('data-area-label') === 'true') {
                state.mapData.labels = (state.mapData.labels || []).filter(label => label.id !== id);
                return;
            }
            if (element.getAttribute('data-area-marker') === 'true') {
                state.mapData.markers = (state.mapData.markers || []).filter(marker => marker.id !== id);
            }
        }

        function removeAreaElement(state, element) {
            if (!element) return;
            const marker = findAreaMarkerData(state, element);
            removeAreaDataByElement(state, element);
            const markerAnchor = element.getAttribute?.('data-area-marker') === 'true' ? element.closest?.('a') : null;
            if (markerAnchor && markerAnchor.querySelector('[data-area-marker="true"]') === element) {
                markerAnchor.remove();
            } else {
                element.remove();
            }
            if (marker?.asset?.assetId) void deleteAreaAssetRecord(marker.asset.assetId);
            saveAreaMapToStorage(state, { silent: true });
            updateAreaToolAvailability(state);
        }

        function deleteSelectedAreaElement(state) {
            if (!state.activeElement) return;
            removeAreaElement(state, state.activeElement);
            clearAreaSelection(state);
        }

        function ensureAreaOverlay(state) {
            const svg = state.svg;
            if (!svg) return;
            let overlay = svg.querySelector('#area-editor-overlay');
            if (!overlay) {
                overlay = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                overlay.setAttribute('id', 'area-editor-overlay');
                overlay.setAttribute('pointer-events', 'none');
                svg.appendChild(overlay);
            }
            let rect = overlay.querySelector('rect');
            if (!rect) {
                rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('fill', 'none');
                rect.setAttribute('stroke', '#0ea5e9');
                rect.setAttribute('stroke-width', '2');
                rect.setAttribute('stroke-dasharray', '6 4');
                rect.setAttribute('vector-effect', 'non-scaling-stroke');
                rect.setAttribute('visibility', 'hidden');
                overlay.appendChild(rect);
            }
            state.selectionRect = rect;
        }

        function updateAreaSelection(state) {
            const rect = state.selectionRect;
            const el = state.activeElement;
            if (!rect || !el || !state.svg) return;
            try {
                const bbox = el.getBBox();
                const ctm = el.getCTM();
                if (!ctm) return;
                const p1 = state.svg.createSVGPoint();
                const p2 = state.svg.createSVGPoint();
                p1.x = bbox.x;
                p1.y = bbox.y;
                p2.x = bbox.x + bbox.width;
                p2.y = bbox.y + bbox.height;
                const t1 = p1.matrixTransform(ctm);
                const t2 = p2.matrixTransform(ctm);
                rect.setAttribute('x', Math.min(t1.x, t2.x));
                rect.setAttribute('y', Math.min(t1.y, t2.y));
                rect.setAttribute('width', Math.abs(t2.x - t1.x));
                rect.setAttribute('height', Math.abs(t2.y - t1.y));
                rect.setAttribute('visibility', 'visible');
            } catch (err) {
                rect.setAttribute('visibility', 'hidden');
            }
        }

        function getSvgPoint(svg, evt) {
            if (!svg || !evt) return null;
            const point = svg.createSVGPoint();
            point.x = evt.clientX;
            point.y = evt.clientY;
            const ctm = svg.getScreenCTM();
            if (!ctm) return null;
            return point.matrixTransform(ctm.inverse());
        }

        function getLabelPosition(el) {
            const x = parseFloat(el.getAttribute('x') || '0');
            const y = parseFloat(el.getAttribute('y') || '0');
            return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
        }

        function setLabelPosition(el, x, y) {
            if (!el) return;
            el.setAttribute('x', x);
            el.setAttribute('y', y);
        }

        function getElementPosition(el) {
            if (!el) return { x: 0, y: 0 };
            if (el.getAttribute('data-area-label') === 'true') {
                return getLabelPosition(el);
            }
            if (el.getAttribute('data-area-marker') === 'true') {
                const transform = el.getAttribute('transform') || '';
                const match = transform.match(/translate\(\s*([-+\d.eE]+)[,\s]+([-+\d.eE]+)\s*\)/);
                if (match) {
                    const x = parseFloat(match[1]);
                    const y = parseFloat(match[2]);
                    return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
                }
            }
            return { x: 0, y: 0 };
        }

        function setElementPosition(el, x, y) {
            if (!el) return;
            if (el.getAttribute('data-area-label') === 'true') {
                setLabelPosition(el, x, y);
            } else if (el.getAttribute('data-area-marker') === 'true') {
                el.setAttribute('transform', `translate(${x}, ${y})`);
            }
        }

        function syncMarkersFromDom(state) {
            if (!state?.svg || !state?.mapData) return;
            state.svg.querySelectorAll('[data-area-marker="true"]').forEach(el => {
                const id = el.getAttribute('data-area-id');
                if (!id) return;
                const marker = state.mapData.markers?.find(item => item.id === id);
                if (!marker) return;
                const pos = getElementPosition(el);
                marker.x = pos.x;
                marker.y = pos.y;
                marker.type = marker.type || el.getAttribute('data-block-type') || 'custom';
            });
        }

        function syncLabelsFromDom(state) {
            if (!state?.svg || !state?.mapData) return;
            state.svg.querySelectorAll('[data-area-label="true"]').forEach(el => {
                const id = el.getAttribute('data-area-id');
                if (!id) return;
                const label = state.mapData.labels?.find(item => item.id === id);
                if (!label) return;
                const pos = getLabelPosition(el);
                label.x = pos.x;
                label.y = pos.y;
            });
        }

        function flashActionButton(state, action, text, color) {
            const btn = state.shell?.querySelector(`[data-area-action="${action}"]`);
            if (!btn) return;
            const original = btn.innerHTML;
            const originalColor = btn.style.color;
            btn.innerHTML = `<i class="fas fa-check"></i>${text}`;
            btn.style.color = color || '#0f172a';
            window.setTimeout(() => {
                btn.innerHTML = original;
                btn.style.color = originalColor;
            }, 1400);
        }

        function saveAreaMapToStorage(state, options = {}) {
            if (!state?.templateId || !state?.mapData) return;
            syncMarkersFromDom(state);
            syncLabelsFromDom(state);
            const serverRuntime = typeof getAreaServerRuntimeConfig === 'function'
                ? getAreaServerRuntimeConfig(state.templateId)
                : null;
            const canPersistToServer = window.KpiRuntime?.canUseServerWrite?.(serverRuntime?.writeEnabled === true) === true;
            if (!canPersistToServer) {
                return Promise.resolve(false);
            }
            let backupError = null;
            if (!serverRuntime) {
                try {
                    if (typeof storeAreaMapLocalBackup === 'function') {
                        storeAreaMapLocalBackup(state.templateId, state.mapData);
                    } else {
                        localStorage.setItem(getStorageKey(state.templateId), JSON.stringify(state.mapData));
                    }
                } catch (err) {
                    backupError = err;
                    console.warn('[kpi] area local backup failed', state.templateId, err);
                }
            } else if (typeof clearAreaMapLocalBackup === 'function') {
                clearAreaMapLocalBackup(state.templateId);
            }
            syncAreaMapPortalDataCache(state.templateId, state.mapData);
            const serverWrite = queueAreaServerWrite(state.templateId, state.mapData);
            if (!options.silent && canPersistToServer) flashActionButton(state, 'save', ' 저장됨', '#16a34a');
            if (backupError && !serverRuntime) {
                console.error('면적도 저장 실패:', backupError);
                alert('저장에 실패했습니다. 로컬 서버 환경에서 다시 시도해 주세요.');
            }
            return serverWrite;
        }

        function exportAreaMapJson(state) {
            if (!state?.mapData) return;
            syncMarkersFromDom(state);
            syncLabelsFromDom(state);
            const json = JSON.stringify(state.mapData, null, 2);
            const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${state.templateId}_area_map.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        }

        function addBlockToMap(state, blockType) {
            if (!state?.svg || !state?.mapData) return;
            const activeViewBox = parseAreaViewBox(state.svg);
            const centerX = activeViewBox.x + activeViewBox.width / 2;
            const centerY = activeViewBox.y + activeViewBox.height / 2;
            const existsCount = (state.mapData.markers || []).filter(marker => marker.type === blockType).length;
            const offset = existsCount * 14;
            const sizeMap = {
                tank: { width: 28, height: 40 },
                pump: { width: 32, height: 32 },
                valve: { width: 24, height: 24 },
                custom: { width: 32, height: 22 },
                motor: { width: 32, height: 32 },
                compressor: { width: 34, height: 34 },
                boiler: { width: 44, height: 30 },
                mixer: { width: 30, height: 46 },
                agitator: { width: 30, height: 40 },
                chiller: { width: 46, height: 32 }
            };
            const size = sizeMap[blockType] || { width: 32, height: 24 };
            const marker = {
                id: `${state.templateId}-${blockType}-${Date.now()}`,
                type: blockType,
                label: '',
                href: '',
                x: centerX + offset,
                y: centerY + offset,
                width: size.width,
                height: size.height
            };
            state.mapData.markers = state.mapData.markers || [];
            state.mapData.markers.push(marker);
            state.activePalette = blockType;

            const markerGroup = state.svg.querySelector('.area-map-markers');
            if (!markerGroup) return;
            const node = buildAreaMarker(marker);
            if (!node) return;
            markerGroup.appendChild(node);
            const selectedMarker = node.getAttribute?.('data-area-marker') === 'true'
                ? node
                : node.querySelector('[data-area-marker="true"]');
            if (selectedMarker) selectAreaElement(state, selectedMarker);
            saveAreaMapToStorage(state, { silent: true });
        }

        function bindAreaMapHotkeys() {
            if (window.__areaMapKeyListener) return;
            window.__areaMapKeyListener = true;
            document.addEventListener('keydown', evt => {
                if (evt.defaultPrevented) return;
                if (!AreaMapState.active) return;
                const tag = (evt.target?.tagName || '').toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select' || evt.target?.isContentEditable) return;
                if (evt.key === 'Tab') {
                    if (AreaMapState.active?.isSimpleUi) return;
                    toggleAreaPalette(AreaMapState.active);
                    evt.preventDefault();
                    return;
                }
                if (evt.key === 'Delete') {
                    deleteSelectedAreaElement(AreaMapState.active);
                    evt.preventDefault();
                    return;
                }
                if (evt.key === '[') {
                    resizeSelectedAreaMarker(AreaMapState.active, 0.88);
                    evt.preventDefault();
                    return;
                }
                if (evt.key === ']') {
                    resizeSelectedAreaMarker(AreaMapState.active, 1.12);
                    evt.preventDefault();
                }
            });
        }

        if (!window.__teamDropdownListener) {
            window.__teamDropdownListener = true;
            document.addEventListener('click', () => {
                closeAllTeamDropdowns();
                closeAllAuditActionMenus();
            });
        }

        function workExport(dataKey) {
            const data = getWorkData(dataKey);
            data.meta = data.meta || {};
            data.meta.updatedAt = new Date().toISOString();
            const varName = dataKey;
            const payload = `const ${varName} = ${JSON.stringify(data, null, 2)};\n\nwindow.PortalData = window.PortalData || {};\nwindow.PortalData.${dataKey} = ${varName};\n`;
            const category = getWorkCategory(dataKey);
            const fileName = category?.fileName ? category.fileName.split('/').pop() : `data_${dataKey}.js`;
            const blob = new Blob([payload], { type: 'text/javascript;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
