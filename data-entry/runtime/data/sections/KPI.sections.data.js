(function () {
    const buildUtilityDataEntryContent = KpiSectionFactoryAdapter.getBuilder('buildUtilityDataEntryContent');

    function buildUtilityOverviewRatioContent() {
        return `
            <div class="util-sheet-stack" data-role="util-overview-ratio-surface">
                <div class="util-sheet-panel is-overview" data-role="util-report-panel">
                    <div class="util-sheet-header">
                        <div class="util-sheet-title-block">
                            <div class="util-sheet-title-row">
                                <span class="util-sheet-title-icon is-overview" aria-hidden="true"><i class="fa-solid fa-chart-pie"></i></span>
                                <div class="util-report-title">총괄 비율</div>
                            </div>
                            <div class="util-report-desc">총괄 비율 도넛과 월별 표를 확인합니다.</div>
                        </div>
                        <div class="util-sheet-actions">
                            <button type="button" class="work-btn primary" data-role="util-report-open-modal" aria-label="총괄 비율 도넛 열기">
                                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                                <span>이동</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    KpiSectionFactoryAdapter.registerFactory('data', function buildDataSection() {
        const AppData = {};
        AppData.data = {
            id: 'data',
            name: '데이터 관리',
            icon: 'fa-database',
            color: 'slate',
            accent: '#64748b',
            categories: [
                {
                    title: '유틸리티 기입',
                    icon: 'fa-pen-to-square',
                    color: '#0f766e',
                    desc: '전기, 가스, 폐수 검침 데이터와 비용을 기입합니다.',
                    viewerMode: 'full-bleed',
                    utilitySurface: 'entry',
                    content: buildUtilityDataEntryContent()
                },
                {
                    title: '총괄 비율',
                    icon: 'fa-chart-pie',
                    color: '#0891b2',
                    desc: '전기, 가스, 폐수 비용의 총괄 비율 도넛을 확인합니다.',
                    viewerMode: 'full-bleed',
                    utilitySurface: 'analysis',
                    autoOpenUtilityReportModal: true,
                    content: buildUtilityOverviewRatioContent()
                },
                {
                    title: '작업 이력 기입',
                    icon: 'fa-clipboard-list',
                    color: '#2563eb',
                    desc: '팀별 작업 이력 입력 및 문서 첨부 화면 바로가기',
                    shortcutTarget: {
                        sectionId: 'work',
                        dataKey: 'work_history_records',
                        options: { keepSidebarCollapsed: true }
                    }
                },
                {
                    title: '설비 이력 카드',
                    icon: 'fa-screwdriver-wrench',
                    color: '#475569',
                    viewerMode: 'full-bleed',
                    desc: '설비 현황 보드와 이력 카드 작성 화면에서 설비 정보, 정비 이력, 첨부 문서를 함께 관리합니다.',
                    dataKey: 'data_equipment_history_card',
                    fileName: 'Central Server DB / Equipment History Card',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5 text-sm text-slate-600">
                            설비 현황 보드와 설비 이력 카드 작성 화면을 불러오는 중입니다.
                        </div>
                    `
                },
                {
                    title: '조도',
                    icon: 'fa-sun',
                    color: '#f59e0b',
                    viewerMode: 'full-bleed',
                    desc: '분기별 조도 측정값, 기준값, 개선 조치, 첨부 스캔본을 관리합니다.',
                    dataKey: 'audit_lux',
                    fileName: 'Central Server DB / Lux Data',
                    readOnly: false,
                    content: `
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
                            조도 화면을 불러오는 중입니다.
                        </div>
                    `
                }
            ]
        };
        return AppData.data;
    });
})();
