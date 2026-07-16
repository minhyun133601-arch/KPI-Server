(function () {
    KpiSectionFactoryAdapter.registerFactory('work', function buildWorkSection() {
        const AppData = {};
        const teamCategories = [
            {
                title: '1팀 1파트',
                icon: 'fa-cheese',
                color: '#2563eb',
                secondaryColor: '#1d4ed8',
                tint: '#eff6ff',
                desc: '건조 공정 라인별 이력',
                dataKey: 'work_team_calendar_team1_part1',
                viewerMode: 'full-bleed',
                processLabel: '건조',
                emptyProductionLabel: '품목 미입력'
            },
            {
                title: '1팀 2파트',
                icon: 'fa-cheese',
                color: '#f59e0b',
                secondaryColor: '#d97706',
                tint: '#fff7ed',
                desc: '건조 공정 라인별 이력',
                dataKey: 'work_team_calendar_team1_part2',
                viewerMode: 'full-bleed',
                processLabel: '건조',
                emptyProductionLabel: '품목 미입력'
            },
            {
                title: '2팀',
                icon: 'fa-box-open',
                color: '#059669',
                secondaryColor: '#047857',
                tint: '#ecfdf5',
                desc: '스틱 및 소포장 라인별 이력',
                dataKey: 'work_team_calendar_team2',
                viewerMode: 'full-bleed',
                processLabel: '스틱 · 소포장',
                emptyProductionLabel: '품목 미입력'
            },
            {
                title: '3팀',
                icon: 'fa-bottle-water',
                color: '#7c3aed',
                secondaryColor: '#5b21b6',
                tint: '#f5f3ff',
                desc: '액상 공정 라인별 이력',
                dataKey: 'work_team_calendar_team3',
                viewerMode: 'full-bleed',
                processLabel: '액상',
                emptyProductionLabel: '품목 미입력'
            },
            {
                title: '공무환경팀',
                icon: 'fa-screwdriver-wrench',
                color: '#dc2626',
                secondaryColor: '#b91c1c',
                tint: '#fef2f2',
                desc: '폐수 · 전체 · 기타 작업 이력',
                dataKey: 'work_team_calendar_team4',
                viewerMode: 'full-bleed',
                processLabel: '공무환경',
                emptyProductionLabel: '생산량 없음'
            },
            {
                title: '통합현황',
                icon: 'fa-chart-column',
                color: '#0f766e',
                secondaryColor: '#0f172a',
                tint: '#ecfeff',
                desc: '가스, 전기, 폐수, 생산량, 작업내역을 한 번에 보는 통합 캘린더',
                dataKey: 'work_team_calendar_overview',
                viewerMode: 'full-bleed',
                processLabel: '통합현황',
                emptyProductionLabel: '생산량 없음'
            }
        ];

        AppData['work'] = {
            id: 'work',
            name: '팀별내역서',
            icon: 'fa-clipboard-list',
            color: 'green',
            accent: '#16a34a',
            openDefaultCategoryOnMain: true,
            hideNavigationChevron: true,
            teamCategories,
            categories: [
                {
                    title: '팀별내역서',
                    icon: 'fa-calendar-days',
                    color: '#0f766e',
                    secondaryColor: '#0f172a',
                    tint: '#ecfeff',
                    desc: '팀별·공정별·공장별 전환과 생산량 관리를 한 화면에 통합한 팀별내역서',
                    navHidden: true,
                    dataKey: 'work_team_calendar_team1_part1',
                    view: 'team_calendar_document',
                    viewerMode: 'full-bleed',
                    processLabel: '문서형 통합 보기',
                    emptyProductionLabel: '품목 미입력'
                },
                {
                    title: '작업 이력',
                    icon: 'fa-clipboard-list',
                    color: '#0f766e',
                    secondaryColor: '#14b8a6',
                    tint: '#ecfeff',
                    desc: '',
                    navHidden: true,
                    dataKey: 'work_history_records',
                    view: 'history_tool',
                    viewerMode: 'full-bleed'
                }
            ]
        };
        return AppData['work'];
    });
})();
