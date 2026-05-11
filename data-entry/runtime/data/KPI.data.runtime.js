(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const runtime = browser.getKpiRuntime();
    if (!runtime) return;

    const EQUIPMENT_HISTORY_DATA_KEY = 'data_equipment_history_card';

    function getEquipmentHistoryData() {
        const payload = browser.getPortalPayload(EQUIPMENT_HISTORY_DATA_KEY);
        return payload && typeof payload === 'object' ? payload : {};
    }

    runtime.registerSaveProvider('data-equipment-history-save', (context = {}) => {
        if (context.sectionId !== 'data') return null;
        if (String(context.category?.dataKey || '').trim() !== EQUIPMENT_HISTORY_DATA_KEY) return null;
        const api = browser.getApi();
        if (typeof api.getEquipmentHistorySaveAction !== 'function') return null;
        const action = api.getEquipmentHistorySaveAction(context);
        if (!action || typeof action !== 'object') return null;
        return {
            priority: 110,
            buttonLabel: '\uC800\uC7A5',
            historyLabel: '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uC800\uC7A5',
            title: '\uC124\uBE44 \uC774\uB825\uCE74\uB4DC \uC800\uC7A5',
            statusText: '\uD604\uC7AC \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uB97C \uC800\uC7A5\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
            ...action,
        };
    });

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
