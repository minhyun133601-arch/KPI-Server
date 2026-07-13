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
            orderingTeams: {},
            pendingPhotoDocumentCleanupIds: [],
        };
        const redraw = () => {
            container.innerHTML = api.renderShell(category, workingData, state);
            api.bindEvents(container, redraw, state, workingData);
        };
        activeHistoryUnsubscribe?.();
        api.replaceEquipmentHistoryBoardHistory();
        activeHistoryUnsubscribe = browser.addPopStateListener?.((event) => {
            api.applyEquipmentHistoryBrowserState(workingData, state, event?.state, redraw);
        }) || null;
        api.setEquipmentHistoryActiveSaveController({
            container,
            save: (options = {}) => api.saveCurrentEquipmentHistoryView(container, workingData, state, redraw, options),
        });
        redraw();
    }

    api.render = render;
})();
