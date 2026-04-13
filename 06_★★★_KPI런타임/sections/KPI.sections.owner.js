(function () {
    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.owner = function buildOwnerSection() {
        const AppData = {};
        AppData.owner = {
            id: 'owner',
            name: '오너 전용',
            icon: 'fa-shield-halved',
            color: 'violet',
            accent: '#7c3aed',
            ownerOnly: true,
            categories: [
                {
                    title: '계정 관리',
                    dataKey: 'owner_accounts',
                    icon: 'fa-user-shield',
                    color: '#7c3aed',
                    ownerOnly: true,
                    desc: '오너 계정의 로그인 기록과 등록 계정을 확인합니다.',
                    viewerMode: 'full-bleed',
                    content: `
                        <section class="owner-records-view" data-owner-records-root></section>
                    `
                },
                {
                    title: '서버 관리',
                    dataKey: 'owner_server',
                    icon: 'fa-server',
                    color: '#8b5cf6',
                    ownerOnly: true,
                    desc: '오너 전용 서버 관리 메뉴입니다.',
                    content: `
                        <div class="space-y-3 text-slate-700">
                            <p>서버 관리 화면은 다음 단계에서 구성합니다.</p>
                        </div>
                    `
                }
            ]
        };
        return AppData.owner;
    };
})();
