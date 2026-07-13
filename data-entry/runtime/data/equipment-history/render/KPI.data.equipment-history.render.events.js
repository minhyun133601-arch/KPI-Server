(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const syncEquipmentHistoryFullscreenUi = (...args) => api.syncEquipmentHistoryFullscreenUi(...args);
    const toggleEquipmentHistoryFullscreen = (...args) => api.toggleEquipmentHistoryFullscreen(...args);
    const getBoardFilters = (...args) => api.getBoardFilters(...args);
    const applyBoardSearchFilter = (...args) => api.applyBoardSearchFilter(...args);
    const setBoardTeamOrdering = (...args) => api.setBoardTeamOrdering(...args);
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
    const cycleBoardStatus = (...args) => api.cycleBoardStatus(...args);
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

    function bindEvents(root, redraw, state, data) {
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

        root.querySelectorAll('[data-equipment-cycle-board-status]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    if (await cycleBoardStatus(data, state, {
                        scope: button.dataset.equipmentStatusScope,
                        team: button.dataset.equipmentStatusTeam,
                        room: button.dataset.equipmentStatusRoom,
                    })) redraw();
                } catch (error) {
                    console.warn('[kpi] equipment history board status save failed', error);
                    browser.alert('\uAC00\uB3D9 \uC0C1\uD0DC \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.');
                }
            });
        });

        root.querySelectorAll('[data-equipment-order-toggle-team]').forEach((button) => {
            button.addEventListener('click', () => {
                const column = button.closest?.('.data-equipment-board-column');
                if (!column) return;
                const isOpen = !column.classList.contains('is-ordering');
                setBoardTeamOrdering(state, button.dataset.equipmentOrderToggleTeam, isOpen);
                column.classList.toggle('is-ordering', isOpen);
                button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                column.querySelectorAll('.data-equipment-board-card-tools, .data-equipment-board-room-tools').forEach((tools) => {
                    tools.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
                });
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
        bindEvents,
    });
})();
