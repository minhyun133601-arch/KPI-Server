(function () {
    const { buildWorkDataEntryContent } = window.KpiSectionBuilders || {};

    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.util = function buildUtilSection() {
        const AppData = {};

        AppData['util'] = {
            id: 'util',
            name: '유틸리티',
            icon: 'fa-sliders',
            color: 'yellow',
            accent: '#eab308',
            categories: [
                {
                    title: '전기',
                    icon: 'fa-bolt',
                    color: '#f59e0b',
                    reportShortcutKey: 'electric',
                    desc: '전기 사용량과 비용',
                    content: `
                        <div class="util-dual" data-util-dual="electric">
                            <div class="util-team-tabs" data-util-dual-tabs></div>
                            <div class="util-dual-section" data-util-dual-section="combined">
                                <div class="util-dual-header">
                                    <div class="util-dual-title">데이터</div>
                                    <div class="util-dual-controls" data-util-dual-controls></div>
                                </div>
                                <div class="util-team-content" data-util-dual-content="combined"></div>
                            </div>
                        </div>
                    `
                },
                {
                    title: '가스',
                    icon: 'fa-fire-flame-curved',
                    color: '#f97316',
                    reportShortcutKey: 'gas',
                    desc: '가스 사용량과 비용',
                    content: `
                        <div class="util-dual" data-util-dual="gas">
                            <div class="util-team-tabs" data-util-dual-tabs></div>
                            <div class="util-dual-section" data-util-dual-section="combined">
                                <div class="util-dual-header">
                                    <div class="util-dual-title">데이터</div>
                                    <div class="util-dual-controls" data-util-dual-controls></div>
                                </div>
                                <div class="util-team-content" data-util-dual-content="combined"></div>
                            </div>
                        </div>
                    `
                },
                {
                    title: '폐수',
                    icon: 'fa-water',
                    color: '#14b8a6',
                    reportShortcutKey: 'waste',
                    desc: '폐수 사용량과 비용',
                    content: `
                        <div class="util-dual" data-util-dual="waste">
                            <div class="util-team-tabs" data-util-dual-tabs></div>
                            <div class="util-dual-section" data-util-dual-section="combined">
                                <div class="util-dual-header">
                                    <div class="util-dual-title">데이터</div>
                                    <div class="util-dual-controls" data-util-dual-controls></div>
                                </div>
                                <div class="util-team-content" data-util-dual-content="combined"></div>
                            </div>
                        </div>
                    `
                },
                {
                    title: '유틸리티 기입',
                    icon: 'fa-pen-to-square',
                    color: '#0f766e',
                    desc: '유틸리티 기입 화면',
                    navHidden: true,
                    viewerMode: 'full-bleed',
                    content: buildWorkDataEntryContent()
                },
                {
                    title: '분석',
                    icon: 'fa-file-lines',
                    color: '#0ea5e9',
                    desc: '전기, 가스, 폐수 통합 보고서',
                    content: `
                        <div class="util-report-panel" data-role="util-report-panel" data-util-report-panel>
                            <div class="util-report-header">
                                <div>
                                    <div class="util-report-title">유틸리티 통합 보고서</div>
                                    <div class="util-report-desc">보고서 열기를 누르면 통합 보고서가 바로 열리고 안에서 비용과 생산량을 축으로 바꿔 볼 수 있습니다.</div>
                                </div>
                                <div class="util-report-header-actions">
                                    <button type="button" class="work-btn primary" data-role="util-report-open-modal">보고서 열기</button>
                                </div>
                            </div>
                            <div class="util-report-preview-note" data-role="util-report-note">비용과 생산량 보고서는 필터 변경 즉시 그래프와 표에 반영됩니다.</div>
                        </div>
                    `
                }
            ]
        };

        return AppData['util'];
    };
})();
