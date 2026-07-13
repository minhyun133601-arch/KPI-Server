(function (root) {
    const parts = root[Symbol.for('kpi.reportDeck.section.parts')];
    if (!parts || typeof parts.buildReportDeckCoverContent !== 'function') {
        throw new Error('Report section parts must load before the report section facade.');
    }

    KpiSectionFactoryAdapter.registerFactory('report', function buildReportSection() {
        return {
            id: 'report',
            name: '보고서',
            icon: 'fa-file-lines',
            color: 'blue',
            accent: '#2563eb',
            directLaunch: true,
            hideNavigationChevron: true,
            launchTarget: 'popup',
            launchWindowName: 'kpi-report-editor',
            launchFillScreen: true,
            launchWindowWidth: 1920,
            launchWindowHeight: 1080,
            launchPopupMode: 'report',
            launchRoute: {
                view: 'category',
                sectionId: 'report',
                categoryIndex: 0
            },
            categories: [
                {
                    title: 'PPT 보고서',
                    icon: 'fa-display',
                    color: '#2563eb',
                    desc: 'PPT 형태의 보고서 템플릿',
                    navHidden: true,
                    viewerMode: 'full-bleed',
                    content: parts.buildReportDeckCoverContent()
                }
            ]
        };
    });
})(this);
