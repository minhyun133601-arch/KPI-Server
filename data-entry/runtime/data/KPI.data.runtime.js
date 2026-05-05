(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const runtime = browser.getKpiRuntime();
    if (!runtime) return;

    const EQUIPMENT_HISTORY_DATA_KEY = 'data_equipment_history_card';

    function getEquipmentHistoryData() {
        const payload = browser.getPortalPayload(EQUIPMENT_HISTORY_DATA_KEY);
        return payload && typeof payload === 'object' ? payload : {};
    }

    runtime.registerSectionRenderer('data', (category, context = {}) => {
        if (String(category?.dataKey || '').trim() === EQUIPMENT_HISTORY_DATA_KEY) {
            const api = browser.getApi();
            if (typeof api.render === 'function') {
                api.render(category, context, getEquipmentHistoryData());
                return;
            }
        }

        const container = context.container || document.getElementById('content-container');
        if (container) container.innerHTML = category?.content || '';
    });
})();
