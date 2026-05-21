(function bootstrapKpiDemoData() {
    const browser = typeof KpiDemoDataBrowserAdapter === 'object' && KpiDemoDataBrowserAdapter
        ? KpiDemoDataBrowserAdapter
        : null;
    if (!browser) {
        throw new Error('KpiDemoDataBrowserAdapter must load before KPI.demo-data.js');
    }

    const UPDATED_AT = '2026-04-26T06:00:00.000Z';
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function setPortalDataDefault(key, payload) {
        browser.setPortalDataDefault(key, clone(payload));
    }

    setPortalDataDefault('data_equipment_history_card', {
        meta: { moduleKey: 'data_equipment_history_card', moduleName: 'Demo Equipment History Card', version: 2, updatedAt: UPDATED_AT },
        header: { brandName: '', brandSub: '', title: '설비 이력 카드', subtitle: '', status: '', updatedAt: '2026.04.26 10:30', owner: '', equipmentName: '', note: '설비 현황 보드에서 설비 상태를 보고, 같은 화면에서 기록 작성과 첨부 입력을 이어서 처리합니다.' },
        equipmentList: [],
        operationInfo: [],
        detailInfo: [],
        maintenanceHistory: [],
        documents: []
    });

    browser.setRootValue('__KPI_DEMO_DATA__', Object.freeze({ enabled: true, scope: ['data_equipment_history_card'], updatedAt: UPDATED_AT, note: 'Local screen defaults only. No company records are included.' }));
})();
