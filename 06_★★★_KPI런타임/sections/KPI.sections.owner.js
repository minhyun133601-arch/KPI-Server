(function () {
    const OPS_CONSOLE_URL = 'http://127.0.0.1:3215';

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
                    title: '데이터관리',
                    dataKey: 'owner_accounts',
                    icon: 'fa-database',
                    color: '#0f766e',
                    ownerOnly: true,
                    desc: '계정, 로그인 기록, 권한 상태를 한 화면에서 확인합니다.',
                    viewerMode: 'full-bleed',
                    content: `
                        <section class="owner-records-view" data-owner-records-root></section>
                    `
                },
                {
                    title: '서버관리',
                    dataKey: 'owner_server',
                    icon: 'fa-server',
                    color: '#2563eb',
                    ownerOnly: true,
                    desc: '로컬 운영 콘솔에서 서버, DB, 계정 작업을 관리합니다.',
                    viewerMode: 'full-bleed',
                    content: `
                        <section class="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
                            <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
                                <div class="border-b border-slate-200 pb-5">
                                    <div class="text-xs font-semibold uppercase text-slate-500">LOCAL OPS CONSOLE</div>
                                    <h2 class="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">서버관리</h2>
                                    <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                                        서버 열기, 종료, 복구, DB 확인, 계정 점검은 로컬 운영 콘솔에서 바로 처리합니다.
                                    </p>
                                </div>
                                <div class="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3">
                                    <section class="space-y-2">
                                        <div class="text-xs font-semibold uppercase text-emerald-600">Server</div>
                                        <div class="text-base font-semibold text-slate-900">실행 / 종료 / 복구</div>
                                        <p class="text-sm leading-6 text-slate-600">KPI 서버와 PostgreSQL 상태를 한 화면에서 제어합니다.</p>
                                    </section>
                                    <section class="space-y-2">
                                        <div class="text-xs font-semibold uppercase text-sky-600">Database</div>
                                        <div class="text-base font-semibold text-slate-900">DB 상태 확인</div>
                                        <p class="text-sm leading-6 text-slate-600">연결 상태, 콘솔, 최근 로그를 운영 콘솔에서 바로 확인합니다.</p>
                                    </section>
                                    <section class="space-y-2">
                                        <div class="text-xs font-semibold uppercase text-violet-600">Accounts</div>
                                        <div class="text-base font-semibold text-slate-900">계정 관리</div>
                                        <p class="text-sm leading-6 text-slate-600">오너 세션과 사용자 상태를 운영 콘솔 기준으로 점검합니다.</p>
                                    </section>
                                </div>
                                <div class="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                                    <button
                                        type="button"
                                        onclick="window.open('${OPS_CONSOLE_URL}', '_blank', 'noopener,noreferrer')"
                                        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                                    >
                                        운영 콘솔 열기
                                    </button>
                                    <span class="text-sm text-slate-500">${OPS_CONSOLE_URL}</span>
                                </div>
                            </div>
                        </section>
                    `
                }
            ]
        };
        return AppData.owner;
    };
})();
