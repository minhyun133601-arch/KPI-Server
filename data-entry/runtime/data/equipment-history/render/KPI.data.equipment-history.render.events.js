(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const syncEquipmentHistoryFullscreenUi = (...args) => api.syncEquipmentHistoryFullscreenUi(...args);
    const toggleEquipmentHistoryFullscreen = (...args) => api.toggleEquipmentHistoryFullscreen(...args);
    const getBoardFilters = (...args) => api.getBoardFilters(...args);
    const applyBoardSearchFilter = (...args) => api.applyBoardSearchFilter(...args);
    const setBoardTeamOrdering = (...args) => api.setBoardTeamOrdering(...args);
    const setBoardTeamCollapsed = (...args) => api.setBoardTeamCollapsed(...args);
    const ensureDraftDocumentEditorSlot = (...args) => api.ensureDraftDocumentEditorSlot(...args);
    const startNewCard = (...args) => api.startNewCard(...args);
    const updateStarterFromInput = (...args) => api.updateStarterFromInput(...args);
    const submitStarter = (...args) => api.submitStarter(...args);
    const updateDraftFromInput = (...args) => api.updateDraftFromInput(...args);
    const addDraftRow = (...args) => api.addDraftRow(...args);
    const setEquipmentSpecBlockOpen = (...args) => api.setEquipmentSpecBlockOpen(...args);
    const addDraftBlock = (...args) => api.addDraftBlock(...args);
    const addDraftRowToBlock = (...args) => api.addDraftRowToBlock(...args);
    const removeDraftRow = (...args) => api.removeDraftRow(...args);
    const moveDraftRow = (...args) => api.moveDraftRow(...args);
    const cycleBoardCardStatus = (...args) => api.cycleBoardCardStatus(...args);
    const applyBoardStatus = (...args) => api.applyBoardStatus(...args);
    const getBoardBulkStatusState = (...args) => api.getBoardBulkStatusState(...args);
    const cycleCurrentCardStatus = (...args) => api.cycleCurrentCardStatus(...args);
    const moveBoardCard = (...args) => api.moveBoardCard(...args);
    const moveBoardRoom = (...args) => api.moveBoardRoom(...args);
    const isEquipmentBoardCardInteractiveTarget = (...args) => api.isEquipmentBoardCardInteractiveTarget(...args);
    const resetEquipmentHistoryBoardState = (...args) => api.resetEquipmentHistoryBoardState(...args);
    const replaceEquipmentHistoryBoardHistory = (...args) => api.replaceEquipmentHistoryBoardHistory(...args);
    const openEquipmentBoardCard = (...args) => api.openEquipmentBoardCard(...args);
    const saveCurrentEquipmentHistoryView = (...args) => api.saveCurrentEquipmentHistoryView(...args);
    const bindSaveShortcut = (...args) => api.bindSaveShortcut(...args);
    const printEquipmentHistoryCard = (...args) => api.printEquipmentHistoryCard(...args);
    const revertPhoto = (...args) => api.revertPhoto(...args);
    const deleteDraft = (...args) => api.deleteDraft(...args);
    const bindPhotoPreview = (...args) => api.bindPhotoPreview(...args);

    function syncBoardTeamCollapseUi(column, button, isCollapsed) {
        if (!column || !button) return;
        const content = column.querySelector?.('[data-equipment-team-content]');
        const teamName = button.dataset.equipmentTeamName || '';
        const actionLabel = `${teamName} ${isCollapsed ? '\uD3BC\uCE58\uAE30' : '\uC811\uAE30'}`.trim();
        column.classList.toggle('is-collapsed', isCollapsed);
        if (content) content.hidden = isCollapsed;
        button.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        button.setAttribute('aria-label', actionLabel);
        button.setAttribute('title', actionLabel);
        const icon = button.querySelector?.('i');
        icon?.classList.toggle('fa-chevron-down', isCollapsed);
        icon?.classList.toggle('fa-chevron-up', !isCollapsed);
    }

    function syncBoardTeamEditUi(column, button, isEditing) {
        if (!column || !button) return;
        const teamName = button.dataset.equipmentTeamName || '';
        const actionLabel = `${teamName} \uD3B8\uC9D1 \uBAA8\uB4DC ${isEditing ? '\uB2EB\uAE30' : '\uC5F4\uAE30'}`.trim();
        column.classList.toggle('is-ordering', isEditing);
        column.classList.toggle('is-editing', isEditing);
        button.setAttribute('aria-expanded', isEditing ? 'true' : 'false');
        button.setAttribute('aria-pressed', isEditing ? 'true' : 'false');
        button.setAttribute('aria-label', actionLabel);
        button.setAttribute('title', actionLabel);
        column.querySelectorAll('.data-equipment-board-card-tools, .data-equipment-board-room-tools').forEach((tools) => {
            tools.setAttribute('aria-hidden', isEditing ? 'false' : 'true');
        });
    }

    function focusPreventiveMaintenanceTeamButton(root, teamKey) {
        const button = Array.from(root.querySelectorAll?.('[data-equipment-preventive-maintenance-team]') || [])
            .find((candidate) => candidate.dataset.equipmentPreventiveMaintenanceTeam === teamKey);
        button?.focus?.();
    }

    function focusPreventiveMaintenanceMonthButton(root, month) {
        const button = Array.from(root.querySelectorAll?.('[data-equipment-preventive-month]') || [])
            .find((candidate) => candidate.dataset.equipmentPreventiveMonth === month);
        button?.focus?.();
    }

    function hasEquipmentMaintenanceDraftChanges(data, state) {
        if (!state.draft) return false;
        if (state.draft.photoFile || api.asList(state.draft.documents).some((row) => row.pendingFile)) return true;
        const saved = api.normalizeEquipmentItems(data).find((item) => item.id === state.selectedId);
        if (!saved) return true;
        return JSON.stringify(api.buildRecordFromDraft(state.draft)) !== JSON.stringify(api.buildRecordFromDraft(api.createDraft(saved)));
    }

    function leavePreventiveMaintenanceEditor(root, data, state) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch || state.pendingMaintenanceShare) return false;
        if (state.preventiveMaintenance?.equipmentId) {
            api.syncDraftFromForm(root, state);
            if (hasEquipmentMaintenanceDraftChanges(data, state)
                && !browser.confirm('저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 이동할까요?')) return false;
        }
        state.draft = null;
        api.getPreventiveMaintenanceState(state).equipmentId = '';
        state.message = '';
        return true;
    }

    function syncEquipmentMaintenanceBatchFromForm(root, state) {
        const batch = state.maintenanceBatch;
        if (!batch || batch.saving) return;
        root.querySelectorAll('[data-equipment-maintenance-batch-field]').forEach((input) => {
            batch.row[input.dataset.equipmentMaintenanceBatchField] = input.value;
        });
    }

    async function openEquipmentMaintenanceBatch(root, redraw, state, data, options = {}) {
        if (state.equipmentMaintenanceSaving || state.maintenanceBatch || state.pendingMaintenanceShare) return;
        if (state.draft && (state.view === 'card' || state.preventiveMaintenance?.equipmentId)) {
            api.syncDraftFromForm(root, state);
            if (hasEquipmentMaintenanceDraftChanges(data, state)
                && !await saveCurrentEquipmentHistoryView(root, data, state, redraw)) return;
        }
        const source = options.teamKey ? null : api.normalizeEquipmentItems(data).find((item) => item.id === state.selectedId);
        const teamKey = options.teamKey || api.resolveEquipmentHistoryTeamDataKey(source?.teamDataKey || source?.team);
        if (!teamKey) return;
        const category = source ? api.getEquipmentMaintenanceCategory(source) : null;
        const section = options.section === 'annualMaintenancePlan' ? options.section : 'maintenanceHistory';
        state.maintenanceBatch = {
            teamKey,
            categoryKey: category?.key || '',
            selectedIds: category?.key ? [source.id] : [],
            section,
            row: section === 'annualMaintenancePlan' ? api.createBlankAnnualMaintenancePlanRow() : api.createBlankMaintenanceRow(),
            rows: {},
            message: '',
        };
        redraw();
        root.querySelector('[data-equipment-maintenance-batch-dialog]')?.focus?.();
    }

    function trapEquipmentMaintenanceDialogFocus(event, dialog) {
        if (event.key !== 'Tab') return;
        const controls = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'))
            .filter((element) => element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        const active = dialog.ownerDocument.activeElement;
        if (event.shiftKey && (active === first || active === dialog)) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (active === last || active === dialog)) {
            event.preventDefault(); first.focus();
        }
    }

    function bindEquipmentMaintenanceBatchEvents(root, redraw, state, data) {
        root.querySelectorAll('[data-equipment-maintenance-batch], [data-equipment-maintenance-batch-team]').forEach((button) => {
            button.addEventListener('click', () => void openEquipmentMaintenanceBatch(root, redraw, state, data, {
                teamKey: button.dataset.equipmentMaintenanceBatchTeam,
                section: button.dataset.equipmentMaintenanceBatch,
            }));
        });
        const batch = state.maintenanceBatch;
        if (!batch) return;
        const close = () => {
            if (batch.saving || state.equipmentMaintenanceSaving) return;
            state.maintenanceBatch = null;
            redraw();
            (root.querySelector('[data-equipment-preventive-dialog]') || root.querySelector('[data-equipment-maintenance-batch]'))?.focus?.();
        };
        root.querySelector('[data-equipment-maintenance-batch-close]')?.addEventListener('click', close);
        root.querySelector('[data-equipment-maintenance-batch-dialog]')?.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
            trapEquipmentMaintenanceDialogFocus(event, event.currentTarget);
        });
        root.querySelector('[data-equipment-maintenance-batch-category]')?.addEventListener('change', (event) => {
            if (batch.saving) return;
            syncEquipmentMaintenanceBatchFromForm(root, state);
            batch.categoryKey = event.target.value;
            batch.selectedIds = [];
            batch.message = '';
            redraw();
            root.querySelector('[data-equipment-maintenance-batch-category]')?.focus?.();
        });
        root.querySelector('[data-equipment-maintenance-batch-section]')?.addEventListener('change', (event) => {
            if (batch.saving) return;
            syncEquipmentMaintenanceBatchFromForm(root, state);
            batch.rows[batch.section] = batch.row;
            batch.section = event.target.value;
            batch.row = batch.rows[batch.section] || (batch.section === 'annualMaintenancePlan' ? api.createBlankAnnualMaintenancePlanRow() : api.createBlankMaintenanceRow());
            batch.message = '';
            redraw();
            root.querySelector('[data-equipment-maintenance-batch-section]')?.focus?.();
        });
        root.querySelectorAll('[data-equipment-maintenance-batch-target]').forEach((input) => {
            input.addEventListener('change', () => {
                if (batch.saving) return;
                const selected = new Set(batch.selectedIds);
                if (input.checked) selected.add(input.dataset.equipmentMaintenanceBatchTarget);
                else selected.delete(input.dataset.equipmentMaintenanceBatchTarget);
                batch.selectedIds = [...selected];
                const count = root.querySelector('[data-equipment-maintenance-batch-count]');
                if (count) count.textContent = String(selected.size);
                const all = root.querySelector('[data-equipment-maintenance-batch-all]');
                const candidates = api.getEquipmentMaintenanceBatchCandidates(data, batch.teamKey, batch.categoryKey);
                if (all) all.textContent = selected.size === candidates.length ? '선택 해제' : '전체 선택';
            });
        });
        root.querySelector('[data-equipment-maintenance-batch-all]')?.addEventListener('click', () => {
            if (batch.saving) return;
            syncEquipmentMaintenanceBatchFromForm(root, state);
            const candidates = api.getEquipmentMaintenanceBatchCandidates(data, batch.teamKey, batch.categoryKey);
            batch.selectedIds = candidates.length === batch.selectedIds.length ? [] : candidates.map((item) => item.id);
            redraw();
            root.querySelector('[data-equipment-maintenance-batch-all]')?.focus?.();
        });
        root.querySelectorAll('[data-equipment-maintenance-batch-field]').forEach((input) => {
            input.addEventListener('input', () => syncEquipmentMaintenanceBatchFromForm(root, state));
        });
        root.querySelector('[data-equipment-maintenance-batch-form]')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await saveCurrentEquipmentHistoryView(root, data, state, redraw);
        });
    }

    function bindEquipmentMaintenanceShareEvents(root, redraw, state, data) {
        const share = state.pendingMaintenanceShare;
        const dialog = root.querySelector('[data-equipment-maintenance-share-dialog]');
        if (!share || !dialog) return;
        const cancel = () => {
            if (state.equipmentMaintenanceSaving) return;
            state.pendingMaintenanceShare = null;
            redraw();
            (root.querySelector('[data-equipment-save]') || root.querySelector('[data-equipment-row-section="annualMaintenancePlan"]'))?.focus?.();
        };
        root.querySelector('[data-equipment-maintenance-share-cancel]')?.addEventListener('click', cancel);
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); return; }
            if (api.isEquipmentHistorySaveShortcut(event)) { event.preventDefault(); event.stopPropagation(); return; }
            trapEquipmentMaintenanceDialogFocus(event, dialog);
        });
        const syncSelection = () => {
            const selected = new Set(share.selectedIds);
            dialog.querySelectorAll('[data-equipment-maintenance-share-target]').forEach((input) => {
                input.checked = selected.has(input.dataset.equipmentMaintenanceShareTarget);
            });
            dialog.querySelectorAll('[data-equipment-maintenance-share-group]').forEach((group) => {
                const targets = Array.from(group.querySelectorAll('[data-equipment-maintenance-share-target]'));
                const count = targets.filter((input) => input.checked).length;
                const checkbox = group.querySelector('[data-equipment-maintenance-share-category]');
                checkbox.checked = count === targets.length;
                checkbox.indeterminate = count > 0 && count < targets.length;
                group.querySelector('[data-equipment-maintenance-share-group-count]').textContent = String(count);
            });
            dialog.querySelector('[data-equipment-maintenance-share-count]').textContent = String(selected.size);
            dialog.querySelector('[data-equipment-maintenance-share-all]').textContent = selected.size === share.candidates.length ? '선택 해제' : '전체 선택';
            dialog.querySelector('[data-equipment-maintenance-share-decision="selected"]').disabled = selected.size === 0;
        };
        root.querySelectorAll('[data-equipment-maintenance-share-target]').forEach((input) => {
            input.addEventListener('change', () => {
                if (state.equipmentMaintenanceSaving) return;
                const selected = new Set(share.selectedIds);
                if (input.checked) selected.add(input.dataset.equipmentMaintenanceShareTarget);
                else selected.delete(input.dataset.equipmentMaintenanceShareTarget);
                share.selectedIds = [...selected];
                syncSelection();
            });
        });
        dialog.querySelectorAll('[data-equipment-maintenance-share-category]').forEach((input) => {
            input.addEventListener('change', () => {
                if (state.equipmentMaintenanceSaving) return;
                const group = input.closest('[data-equipment-maintenance-share-group]');
                const selected = new Set(share.selectedIds);
                group.querySelectorAll('[data-equipment-maintenance-share-target]').forEach((target) => {
                    if (input.checked) selected.add(target.dataset.equipmentMaintenanceShareTarget);
                    else selected.delete(target.dataset.equipmentMaintenanceShareTarget);
                });
                if (input.checked) group.open = true;
                share.selectedIds = [...selected];
                syncSelection();
            });
        });
        root.querySelector('[data-equipment-maintenance-share-all]')?.addEventListener('click', () => {
            if (state.equipmentMaintenanceSaving) return;
            share.selectedIds = share.selectedIds.length === share.candidates.length ? [] : share.candidates.map((item) => item.id);
            if (share.selectedIds.length) dialog.querySelectorAll('[data-equipment-maintenance-share-group]').forEach((group) => { group.open = true; });
            syncSelection();
        });
        root.querySelectorAll('[data-equipment-maintenance-share-decision]').forEach((button) => {
            button.addEventListener('click', async () => {
                if (state.equipmentMaintenanceSaving) return;
                await saveCurrentEquipmentHistoryView(root, data, state, redraw, {
                    shareDecision: button.dataset.equipmentMaintenanceShareDecision,
                    shareTargetIds: share.selectedIds,
                    showSavedPopup: true,
                });
            });
        });
        syncSelection();
        if (!state.equipmentMaintenanceSaving) dialog.focus?.();
    }

    function bindEquipmentCategoryDropdowns(root, state) {
        state.closeEquipmentCategoryDropdown?.();
        const ownerDocument = root.ownerDocument;
        const view = ownerDocument?.defaultView;
        if (!ownerDocument || !view) return;
        root.querySelectorAll('.data-equipment-category-combo').forEach((wrapper) => {
            const input = wrapper.querySelector('[data-equipment-category-input]');
            const toggle = wrapper.querySelector('[data-equipment-category-toggle]');
            const popup = wrapper.querySelector('[data-equipment-category-options]');
            if (!input || !toggle || !popup) return;
            let options = [];
            let activeIndex = -1;
            let selecting = false;
            let observer = null;
            const close = () => {
                popup.hidden = true;
                input.setAttribute('aria-expanded', 'false');
                input.removeAttribute('aria-activedescendant');
                toggle.setAttribute('aria-expanded', 'false');
                if (popup.parentElement !== wrapper) wrapper.appendChild(popup);
                ownerDocument.removeEventListener('pointerdown', outside, true);
                ownerDocument.removeEventListener('focusin', outside, true);
                ownerDocument.removeEventListener('scroll', onScroll, true);
                view.removeEventListener('resize', close);
                observer?.disconnect();
                observer = null;
                if (state.closeEquipmentCategoryDropdown === close) state.closeEquipmentCategoryDropdown = null;
            };
            const outside = (event) => {
                if (!wrapper.contains(event.target) && !popup.contains(event.target)) close();
            };
            const onScroll = (event) => { if (!popup.contains(event.target)) close(); };
            const position = () => {
                const rect = wrapper.getBoundingClientRect();
                const viewportWidth = ownerDocument.documentElement.clientWidth || view.innerWidth;
                const viewportHeight = ownerDocument.documentElement.clientHeight || view.innerHeight;
                const width = Math.min(Math.max(rect.width, 180), Math.max(0, viewportWidth - 16));
                const below = Math.max(0, viewportHeight - rect.bottom - 12);
                const above = Math.max(0, rect.top - 12);
                popup.style.width = `${width}px`;
                popup.style.left = `${Math.max(8, Math.min(rect.left, viewportWidth - width - 8))}px`;
                const desiredHeight = Math.min(popup.scrollHeight || 256, 256);
                const upwards = below < desiredHeight && above > below;
                const height = Math.min(desiredHeight, upwards ? above : below);
                popup.style.maxHeight = `${height}px`;
                popup.style.top = `${upwards ? Math.max(8, rect.top - height - 4) : rect.bottom + 4}px`;
            };
            const setActive = (index) => {
                activeIndex = index;
                options.forEach((option, optionIndex) => option.setAttribute('aria-selected', String(optionIndex === index)));
                const active = options[index];
                if (!active) { input.removeAttribute('aria-activedescendant'); return; }
                input.setAttribute('aria-activedescendant', active.id);
                if (active.offsetTop < popup.scrollTop) popup.scrollTop = active.offsetTop;
                else if (active.offsetTop + active.offsetHeight > popup.scrollTop + popup.clientHeight) {
                    popup.scrollTop = active.offsetTop + active.offsetHeight - popup.clientHeight;
                }
            };
            const show = (filter = '') => {
                if (input.disabled || input.closest('[inert]')) return;
                if (state.closeEquipmentCategoryDropdown !== close) state.closeEquipmentCategoryDropdown?.();
                const datalist = ownerDocument.getElementById(input.dataset.equipmentCategoryList);
                const query = filter.trim().toLocaleLowerCase('ko-KR');
                const values = [...new Set(Array.from(datalist?.querySelectorAll('option') || [], (option) => option.value))]
                    .filter((value) => value && (!query || value.toLocaleLowerCase('ko-KR').includes(query)));
                options = values.map((value, index) => {
                    const option = ownerDocument.createElement('div');
                    option.id = `${popup.id}-${index}`;
                    option.className = 'data-equipment-category-option';
                    option.dataset.equipmentCategoryOption = value;
                    option.setAttribute('role', 'option');
                    option.setAttribute('aria-selected', 'false');
                    option.textContent = value;
                    return option;
                });
                popup.replaceChildren(...options);
                if (!options.length) {
                    const empty = ownerDocument.createElement('div');
                    empty.className = 'data-equipment-category-empty';
                    empty.textContent = query ? '일치하는 카테고리가 없습니다. 직접 입력할 수 있습니다.' : '카테고리를 직접 입력해 주세요.';
                    popup.appendChild(empty);
                }
                const opening = popup.hidden;
                popup.hidden = false;
                (root.querySelector('[data-equipment-history-surface]') || root).appendChild(popup);
                popup.scrollTop = 0;
                input.setAttribute('aria-expanded', 'true');
                toggle.setAttribute('aria-expanded', 'true');
                state.closeEquipmentCategoryDropdown = close;
                setActive(-1);
                position();
                if (opening) {
                    ownerDocument.addEventListener('pointerdown', outside, true);
                    ownerDocument.addEventListener('focusin', outside, true);
                    ownerDocument.addEventListener('scroll', onScroll, true);
                    view.addEventListener('resize', close);
                    if (view.MutationObserver) {
                        observer = new view.MutationObserver(() => { if (!input.isConnected) close(); });
                        observer.observe(root, { childList: true, subtree: true });
                    }
                }
            };
            const choose = (option) => {
                if (!option) return;
                selecting = true;
                input.value = option.dataset.equipmentCategoryOption;
                input.dispatchEvent(new view.Event('input', { bubbles: true }));
                close();
                input.focus();
                selecting = false;
            };
            input.addEventListener('focus', () => { if (!selecting) show(); });
            input.addEventListener('input', (event) => { if (!selecting && !event.isComposing) show(input.value); });
            input.addEventListener('compositionend', () => show(input.value));
            input.addEventListener('keydown', (event) => {
                if (event.isComposing || event.keyCode === 229) return;
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault(); event.stopImmediatePropagation();
                    if (popup.hidden) show();
                    if (options.length) setActive(event.key === 'ArrowDown'
                        ? (activeIndex + 1) % options.length : (activeIndex <= 0 ? options.length : activeIndex) - 1);
                } else if (!popup.hidden && (event.key === 'Enter' || event.key === 'Escape')) {
                    if (event.key === 'Escape' || activeIndex >= 0) {
                        event.preventDefault(); event.stopImmediatePropagation();
                    }
                    if (event.key === 'Enter' && activeIndex >= 0) choose(options[activeIndex]);
                    else close();
                }
            });
            input.addEventListener('blur', (event) => {
                if (!wrapper.contains(event.relatedTarget) && !popup.contains(event.relatedTarget)) close();
            });
            toggle.addEventListener('pointerdown', (event) => event.preventDefault());
            toggle.addEventListener('click', () => {
                if (!popup.hidden) close();
                else { input.focus(); show(); }
            });
            popup.addEventListener('pointerdown', (event) => event.preventDefault());
            popup.addEventListener('click', (event) => choose(event.target.closest('[data-equipment-category-option]')));
        });
    }

    function bindPreventiveEquipmentCategoryEvents(root, redraw, state, data) {
        root.querySelectorAll('[data-equipment-preventive-record-details]').forEach((details) => {
            details.addEventListener('toggle', () => {
                if (!state.preventiveRecordDetails) state.preventiveRecordDetails = Object.create(null);
                state.preventiveRecordDetails[details.dataset.equipmentPreventiveRecordDetails] = details.open;
            });
        });
        const saveCategory = async (id) => {
            if (state.equipmentMaintenanceSaving || state.pendingMaintenanceShare || state.maintenanceBatch) return;
            const input = Array.from(root.querySelectorAll('[data-equipment-preventive-category]'))
                .find((element) => element.dataset.equipmentPreventiveCategory === id);
            if (!input) return;
            const value = input.value;
            if (!state.preventiveCategoryDrafts) state.preventiveCategoryDrafts = Object.create(null);
            state.preventiveCategoryDrafts[id] = value;
            const save = api.saveEquipmentPreventiveCategory(data, state, id, value);
            redraw();
            if (await save) delete state.preventiveCategoryDrafts[id];
            redraw();
            Array.from(root.querySelectorAll('[data-equipment-preventive-category]'))
                .find((element) => element.dataset.equipmentPreventiveCategory === id)?.focus?.();
        };
        root.querySelectorAll('[data-equipment-preventive-category]').forEach((input) => {
            input.addEventListener('input', () => {
                if (!state.preventiveCategoryDrafts) state.preventiveCategoryDrafts = Object.create(null);
                state.preventiveCategoryDrafts[input.dataset.equipmentPreventiveCategory] = input.value;
                state.preventiveCategoryMessage = '';
            });
            input.addEventListener('keydown', (event) => {
                if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
                if (event.key !== 'Enter' && !api.isEquipmentHistorySaveShortcut(event)) return;
                event.preventDefault();
                event.stopPropagation();
                void saveCategory(input.dataset.equipmentPreventiveCategory);
            });
        });
        root.querySelectorAll('[data-equipment-preventive-category-save]').forEach((button) => {
            button.addEventListener('click', () => void saveCategory(button.dataset.equipmentPreventiveCategorySave));
        });
    }

    function bindEvents(root, redraw, state, data) {
        const page = root.querySelector('.data-equipment-page');
        if (state.pendingMaintenanceShare) {
            Array.from(page?.children || []).forEach((child) => {
                if (!child.hasAttribute('data-equipment-maintenance-share-dialog')) child.inert = true;
            });
        } else if (state.maintenanceBatch) {
            Array.from(page?.children || []).forEach((child) => {
                if (!child.hasAttribute('data-equipment-maintenance-batch-dialog')) child.inert = true;
            });
        } else if (state.preventiveMaintenance?.teamKey) {
            Array.from(page?.children || []).forEach((child) => {
                if (child.matches('[data-equipment-view="board"]')) {
                    Array.from(child.children).forEach((part) => { if (!part.hasAttribute('data-equipment-preventive-dialog')) part.inert = true; });
                } else child.inert = true;
            });
        }
        bindEquipmentMaintenanceBatchEvents(root, redraw, state, data);
        bindEquipmentCategoryDropdowns(root, state);
        bindPreventiveEquipmentCategoryEvents(root, redraw, state, data);
        bindEquipmentMaintenanceShareEvents(root, redraw, state, data);
        if (state.equipmentMaintenanceSaving) {
            if (page) page.inert = true;
            root.querySelectorAll('[data-equipment-field], [data-equipment-add-row], [data-equipment-remove-row], [data-equipment-save], [data-equipment-maintenance-batch], [data-equipment-preventive-close], [data-equipment-preventive-list]').forEach((control) => { control.disabled = true; });
        }
        root.querySelectorAll('[data-equipment-history-print]').forEach((button) => {
            button.addEventListener('click', () => printEquipmentHistoryCard(root, state, data));
        });

        root.querySelectorAll('[data-equipment-view-action]').forEach((button) => {
            button.addEventListener('click', () => {
                if (button.dataset.equipmentViewAction === 'card') {
                    state.pendingAddTeam = button.dataset.equipmentAddTeam || '';
                    state.pendingAddRoom = button.dataset.equipmentAddRoom || '';
                    startNewCard(state);
                } else {
                    resetEquipmentHistoryBoardState(state);
                    replaceEquipmentHistoryBoardHistory();
                }
                redraw();
            });
        });

        root.querySelector('[data-equipment-filter-team]')?.addEventListener('change', (event) => {
            const filters = getBoardFilters(state);
            filters.team = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-status]')?.addEventListener('change', (event) => {
            const filters = getBoardFilters(state);
            filters.status = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('change', (event) => {
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('input', (event) => {
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-search]')?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            applyBoardSearchFilter(root, state, redraw, event.target);
        });

        root.querySelector('[data-equipment-filter-reset]')?.addEventListener('click', () => {
            state.filters = { team: '', status: '', search: '' };
            redraw();
        });

        root.querySelector('[data-equipment-fullscreen-toggle]')?.addEventListener('click', () => {
            void toggleEquipmentHistoryFullscreen();
        });

        root.querySelectorAll('[data-equipment-board-card][data-equipment-open-card]').forEach((card) => {
            card.addEventListener('click', (event) => {
                if (isEquipmentBoardCardInteractiveTarget(event.target)) return;
                openEquipmentBoardCard(data, state, card.dataset.equipmentOpenCard, redraw);
            });
            card.addEventListener('keydown', (event) => {
                if (event.target !== card) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault?.();
                openEquipmentBoardCard(data, state, card.dataset.equipmentOpenCard, redraw);
            });
        });

        root.querySelectorAll('[data-equipment-cycle-status-card]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await cycleBoardCardStatus(data, state, button.dataset.equipmentCycleStatusCard)) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board status save failed', error);
                    browser.alert('\uAC00\uB3D9 \uC0C1\uD0DC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelector('[data-equipment-bulk-status-toggle]')?.addEventListener('click', () => {
            const bulkStatus = getBoardBulkStatusState(state);
            bulkStatus.open = !bulkStatus.open;
            redraw();
        });

        root.querySelector('[data-equipment-bulk-status-team]')?.addEventListener('change', (event) => {
            const bulkStatus = getBoardBulkStatusState(state);
            bulkStatus.team = event.target.value || '';
            bulkStatus.room = '';
            redraw();
        });

        root.querySelector('[data-equipment-bulk-status-room]')?.addEventListener('change', (event) => {
            getBoardBulkStatusState(state).room = event.target.value || '';
            redraw();
        });

        root.querySelector('[data-equipment-bulk-status-value]')?.addEventListener('change', (event) => {
            getBoardBulkStatusState(state).status = event.target.value || '\uAC00\uB3D9\uC911';
            redraw();
        });

        root.querySelector('[data-equipment-bulk-status-apply]')?.addEventListener('click', async () => {
            const bulkStatus = getBoardBulkStatusState(state);
            const scope = bulkStatus.room ? 'room' : bulkStatus.team ? 'team' : 'all';
            try {
                const applied = await applyBoardStatus(data, state, {
                    scope,
                    team: bulkStatus.team,
                    room: bulkStatus.room,
                    status: bulkStatus.status,
                });
                if (!applied) return;
                bulkStatus.open = false;
                redraw();
            } catch (error) {
                console.warn('[kpi] equipment history bulk status save failed', error);
                browser.alert('\uAC00\uB3D9 \uC0C1\uD0DC \uC77C\uAD04 \uC801\uC6A9\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
            }
        });

        root.querySelectorAll('[data-equipment-preventive-maintenance-team]').forEach((button) => {
            button.addEventListener('click', () => {
                api.openPreventiveMaintenance(state, button.dataset.equipmentPreventiveMaintenanceTeam);
                redraw();
                root.querySelector?.('[data-equipment-preventive-dialog]')?.focus?.();
            });
        });

        root.querySelectorAll('[data-equipment-preventive-close]').forEach((button) => {
            button.addEventListener('click', () => {
                const teamKey = api.getPreventiveMaintenanceState(state).teamKey;
                if (!leavePreventiveMaintenanceEditor(root, data, state)) return;
                api.closePreventiveMaintenance(state);
                redraw();
                focusPreventiveMaintenanceTeamButton(root, teamKey);
            });
        });

        root.querySelectorAll('[data-equipment-preventive-edit]').forEach((button) => {
            button.addEventListener('click', () => {
                const view = api.getPreventiveMaintenanceState(state);
                const selected = api.normalizeEquipmentItems(data).find((item) => item.id === button.dataset.equipmentPreventiveEdit);
                if (!selected || api.resolveEquipmentHistoryTeamDataKey(selected.teamDataKey || selected.team) !== view.teamKey) return;
                if (!leavePreventiveMaintenanceEditor(root, data, state)) return;
                view.equipmentId = selected.id;
                state.selectedId = selected.id;
                state.draft = api.createDraft(selected);
                if (Object.hasOwn(state.preventiveCategoryDrafts || {}, selected.id)) {
                    state.draft.maintenanceCategory = state.preventiveCategoryDrafts[selected.id];
                    delete state.preventiveCategoryDrafts[selected.id];
                }
                redraw();
                root.querySelector('[data-equipment-preventive-dialog]')?.focus?.();
            });
        });

        root.querySelector('[data-equipment-preventive-list]')?.addEventListener('click', () => {
            if (!leavePreventiveMaintenanceEditor(root, data, state)) return;
            redraw();
            root.querySelector('[data-equipment-preventive-dialog]')?.focus?.();
        });

        root.querySelectorAll('[data-equipment-preventive-month]').forEach((button) => {
            button.addEventListener('click', () => {
                if (state.equipmentMaintenanceSaving || state.maintenanceBatch) return;
                const month = button.dataset.equipmentPreventiveMonth;
                api.setPreventiveMaintenanceMonth(state, month);
                redraw();
                focusPreventiveMaintenanceMonthButton(root, month);
            });
        });

        root.querySelector('[data-equipment-preventive-dialog]')?.addEventListener('keydown', (event) => {
            trapEquipmentMaintenanceDialogFocus(event, event.currentTarget);
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation?.();
            const teamKey = api.getPreventiveMaintenanceState(state).teamKey;
            if (!leavePreventiveMaintenanceEditor(root, data, state)) return;
            api.closePreventiveMaintenance(state);
            redraw();
            focusPreventiveMaintenanceTeamButton(root, teamKey);
        });

        root.querySelectorAll('[data-equipment-team-collapse-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const column = button.closest?.('.data-equipment-board-column');
                if (!column) return;
                const isCollapsed = !column.classList.contains('is-collapsed');
                setBoardTeamCollapsed(state, button.dataset.equipmentTeamCollapseToggle, isCollapsed);
                syncBoardTeamCollapseUi(column, button, isCollapsed);
                if (!isCollapsed || !column.classList.contains('is-editing')) return;
                const editToggle = column.querySelector?.('[data-equipment-edit-toggle-team]');
                setBoardTeamOrdering(state, editToggle?.dataset.equipmentEditToggleTeam, false);
                syncBoardTeamEditUi(column, editToggle, false);
            });
        });

        root.querySelectorAll('[data-equipment-edit-toggle-team]').forEach((button) => {
            button.addEventListener('click', () => {
                const column = button.closest?.('.data-equipment-board-column');
                if (!column) return;
                const isEditing = !column.classList.contains('is-editing');
                if (isEditing && column.classList.contains('is-collapsed')) {
                    const collapseToggle = column.querySelector?.('[data-equipment-team-collapse-toggle]');
                    setBoardTeamCollapsed(state, collapseToggle?.dataset.equipmentTeamCollapseToggle, false);
                    syncBoardTeamCollapseUi(column, collapseToggle, false);
                }
                setBoardTeamOrdering(state, button.dataset.equipmentEditToggleTeam, isEditing);
                syncBoardTeamEditUi(column, button, isEditing);
            });
        });

        root.querySelectorAll('[data-equipment-move-room]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await moveBoardRoom(data, state, {
                        team: button.dataset.equipmentMoveTeam,
                        room: button.dataset.equipmentMoveRoomTitle,
                        direction: button.dataset.equipmentMoveDirection,
                    })) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board room order save failed', error);
                    browser.alert('\uC2E4 \uC21C\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelectorAll('[data-equipment-move-card]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await moveBoardCard(data, state, button.dataset.equipmentMoveCard, button.dataset.equipmentMoveDirection)) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board order save failed', error);
                    browser.alert('\uC124\uBE44 \uC21C\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelector('[data-equipment-card-start-form]')?.addEventListener('submit', (event) => {
            event.preventDefault();
            submitStarter(root, state, redraw);
        });

        root.querySelector('[data-equipment-card-start-submit]')?.addEventListener('click', (event) => {
            event.preventDefault();
            submitStarter(root, state, redraw);
        });

        root.querySelector('[data-equipment-card-start-cancel]')?.addEventListener('click', () => {
            state.view = 'board';
            redraw();
        });

        root.querySelectorAll('[data-equipment-start-field]').forEach((input) => {
            input.addEventListener('input', (event) => updateStarterFromInput(state, event));
            input.addEventListener('change', (event) => {
                updateStarterFromInput(state, event);
                if (event.target.dataset.equipmentStartField === 'team') redraw();
            });
        });

        root.querySelector('[data-equipment-form]')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await saveCurrentEquipmentHistoryView(root, data, state, redraw, { showSavedPopup: true });
        });

        root.querySelectorAll('[data-equipment-save]').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                await saveCurrentEquipmentHistoryView(root, data, state, redraw, { showSavedPopup: true });
            });
        });

        root.querySelector('[data-equipment-cycle-current-status]')?.addEventListener('click', async () => {
            await cycleCurrentCardStatus(root, data, state, redraw);
        });

        root.querySelector('[data-equipment-clear-form]')?.addEventListener('click', () => {
            startNewCard(state);
            state.message = '';
            redraw();
        });

        root.querySelector('[data-equipment-delete-card]')?.addEventListener('click', async () => {
            try {
                if (await deleteDraft(data, state)) redraw();
            } catch (error) {
                console.warn('[kpi] equipment history delete failed', error);
                browser.alert('삭제에 실패했습니다.');
            }
        });

        root.querySelector('[data-equipment-photo-revert]')?.addEventListener('click', async () => {
            try {
                await revertPhoto(data, state, redraw);
            } catch (error) {
                console.warn('[kpi] equipment history photo revert failed', error);
                browser.alert('사진 되돌리기에 실패했습니다.');
            }
        });

        root.querySelectorAll('[data-equipment-add-row]').forEach((button) => {
            button.addEventListener('click', () => {
                addDraftRow(state, button.dataset.equipmentAddRow);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-add-block]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = addDraftBlock(state, button.dataset.equipmentAddBlock);
                if (blockKey) setEquipmentSpecBlockOpen(state, blockKey, true);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-spec-block-toggle]').forEach((button) => {
            button.addEventListener('click', () => {
                const block = button.closest('[data-equipment-spec-block]');
                if (!block) return;
                const isManaging = !block.classList.contains('is-managing');
                setEquipmentSpecBlockOpen(state, block.dataset.equipmentSpecBlockKey, isManaging);
                block.classList.toggle('is-managing', isManaging);
                button.setAttribute('aria-expanded', String(isManaging));
                block.querySelectorAll('.data-equipment-spec-block-actions').forEach((actions) => {
                    actions.setAttribute('aria-hidden', String(!isManaging));
                });
                block.querySelectorAll('.data-equipment-spec-row-actions').forEach((actions) => {
                    actions.setAttribute('aria-hidden', String(!isManaging));
                });
            });
        });

        root.querySelectorAll('[data-equipment-add-row-to-block]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.dataset.equipmentSpecBlockKey;
                if (addDraftRowToBlock(
                    state,
                    button.dataset.equipmentAddRowToBlock,
                    Number(button.dataset.equipmentRowIndex),
                    button.dataset.equipmentRowCategory,
                    button.dataset.equipmentSpecBlockId
                )) {
                    setEquipmentSpecBlockOpen(state, blockKey, true);
                    redraw();
                }
            });
        });

        root.querySelectorAll('[data-equipment-move-row]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.closest('[data-equipment-spec-block]')?.dataset.equipmentSpecBlockKey;
                if (moveDraftRow(
                    state,
                    button.dataset.equipmentMoveRow,
                    Number(button.dataset.equipmentRowIndex),
                    button.dataset.equipmentMoveDirection,
                    button.dataset.equipmentRowCategory
                )) {
                    setEquipmentSpecBlockOpen(state, blockKey, true);
                    redraw();
                }
            });
        });

        root.querySelectorAll('[data-equipment-remove-row]').forEach((button) => {
            button.addEventListener('click', () => {
                const blockKey = button.closest('[data-equipment-spec-block]')?.dataset.equipmentSpecBlockKey;
                removeDraftRow(state, button.dataset.equipmentRemoveRow, Number(button.dataset.equipmentRowIndex));
                if (button.dataset.equipmentRemoveRow === 'documents') ensureDraftDocumentEditorSlot(state.draft);
                setEquipmentSpecBlockOpen(state, blockKey, true);
                redraw();
            });
        });

        root.querySelectorAll('[data-equipment-field]').forEach((input) => {
            input.addEventListener('input', (event) => updateDraftFromInput(root, state, event));
            input.addEventListener('change', (event) => {
                updateDraftFromInput(root, state, event);
                if (event.target.dataset.equipmentField === 'team') redraw();
            });
        });

        root.querySelectorAll('[data-equipment-document-pick]').forEach((button) => {
            button.addEventListener('click', () => {
                root.querySelector(`[data-equipment-document-file-input][data-equipment-row-index="${button.dataset.equipmentDocumentPick}"]`)?.click();
            });
        });

        root.querySelectorAll('[data-equipment-document-file-input]').forEach((input) => {
            input.addEventListener('change', (event) => {
                const [file] = event.target.files || [];
                const index = Number(input.dataset.equipmentRowIndex);
                const row = state.draft?.documents?.[index];
                if (!file || !row) return;
                row.pendingFile = file;
                row.fileName = file.name || '';
                redraw();
            });
        });

        bindPhotoPreview(root, state, data, redraw);
        bindSaveShortcut(root, state, data, redraw);
        syncEquipmentHistoryFullscreenUi();
    }


    Object.assign(api, {
        hasEquipmentMaintenanceDraftChanges,
        syncEquipmentMaintenanceBatchFromForm,
        openEquipmentMaintenanceBatch,
        bindEvents,
    });
})();
