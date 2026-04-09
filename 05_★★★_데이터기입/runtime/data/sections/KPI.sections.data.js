(function () {
    window.KpiSectionFactories = window.KpiSectionFactories || {};
    window.KpiSectionFactories.data = function buildDataSection() {
        const AppData = {};
        AppData['data'] = {
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
                    desc: '유틸리티 기입 화면 바로가기',
                    shortcutTarget: {
                        sectionId: 'util',
                        title: '유틸리티 기입',
                        options: {
                            keepSidebarCollapsed: true
                        }
                    }
                },
                {
                    title: '작업 내역 기입',
                    icon: 'fa-clipboard-list',
                    color: '#2563eb',
                    desc: '팀별내역서 작업내역 입력 화면 바로가기',
                    shortcutTarget: {
                        sectionId: 'work',
                        title: '작업내역',
                        options: {
                            keepSidebarCollapsed: true
                        }
                    }
                },
                {
                    title: '보고서 관리',
                    icon: 'fa-file-lines',
                    color: '#0ea5e9',
                    desc: '월간 실적 보고서 관리 화면 바로가기',
                    shortcutTarget: {
                        sectionId: 'audit',
                        dataKey: 'audit_monthly_report',
                        options: {
                            keepSidebarCollapsed: true
                        }
                    }
                }
            ]
        };
        return AppData['data'];
    };
})();
