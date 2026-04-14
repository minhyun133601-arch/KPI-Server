(function () {
    const OPS_CONSOLE_BASE_URL = 'http://127.0.0.1:3215';
    const OWNER_POPUP_WINDOW_NAME = 'kpi-owner-ops-console';

    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.owner = function buildOwnerSection() {
        return {
            id: 'owner',
            name: '오너 전용',
            icon: 'fa-shield-halved',
            color: 'violet',
            accent: '#7c3aed',
            ownerOnly: true,
            directLaunch: true,
            desc: '오너 전용 운영 콘솔을 별도 창으로 엽니다.',
            launchUrl: OPS_CONSOLE_BASE_URL,
            launchTarget: 'popup',
            launchWindowName: OWNER_POPUP_WINDOW_NAME,
            launchWindowWidth: 1540,
            launchWindowHeight: 980,
            categories: []
        };
    };
})();
