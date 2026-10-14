(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    let activeHistoryUnsubscribe = null;

    function render(category, context = {}, data = {}) {
        const container = context.container || document.getElementById('content-container');
        if (!container) return;
        api.ensureEquipmentHistoryFullscreenListener();
        const workingData = data;
        const items = api.normalizeEquipmentItems(workingData);
        const state = {
            view: 'board',
            selectedId: items[0]?.id || '',
            draft: null,
            starter: null,
            message: '',
            openEquipmentSpecBlocks: {},
            collapsedTeams: {},
            orderingTeams: {},
            pendingPhotoDocumentCleanupIds: [],
            bulkStatus: {
                open: false,
                team: '',
                room: '',
                status: '\uAC00\uB3D9\uC911',
            },
        };
        const redraw = () => {
            const shell = api.renderShell(category, workingData, state);
            container.innerHTML = `<div class="equipment-history-skin" data-equipment-history-surface>${shell}</div>`;
            api.bindEvents(container, redraw, state, workingData);
        };
        activeHistoryUnsubscribe?.();
        api.replaceEquipmentHistoryBoardHistory();
        activeHistoryUnsubscribe = browser.addPopStateListener?.((event) => {
            api.applyEquipmentHistoryBrowserState(workingData, state, event?.state, redraw);
        }) || null;
        api.setEquipmentHistoryActiveSaveController({
            container,
            state,
            save: (options = {}) => api.saveCurrentEquipmentHistoryView(container, workingData, state, redraw, options),
        });
        redraw();
    }

    api.render = render;
})();
