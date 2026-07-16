(function () {
    KpiSectionFactoryAdapter.registerFactory('work', function buildWorkSection() {
        const AppData = {};
        const teamReportDocumentExperimentEnabled = KpiSectionFactoryAdapter.isExperimentEnabled?.('teamReportDocumentUi') === true;
        const teamCategories = [
            {
                title: '1팀 1파트',
                icon: 'fa-cheese',
                color: '#2563eb',
                secondaryColor: '#1d4ed8',
                tint: '#eff6ff',
                desc: '건조 공정 라인별 이력',
                dataKey: 'work_team_calendar_team1_part1',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'dry',
                processLabel: '건조',
                processTag: '분말',
                processDesc: '분말류 작업 제품 흐름에 맞춘 1팀 1파트 주간 이력입니다.',
                emptyProductionLabel: '품목 미입력',
                emptyWorkLabel: '작업 내역 미입력'
            },
            {
                title: '1팀 2파트',
                icon: 'fa-cheese',
                color: '#f59e0b',
                secondaryColor: '#d97706',
                tint: '#fff7ed',
                desc: '건조 공정 라인별 이력',
                dataKey: 'work_team_calendar_team1_part2',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'dry',
                processLabel: '건조',
                processTag: '분말',
                processDesc: '분말류 작업 제품 흐름에 맞춘 1팀 2파트 주간 이력입니다.',
                emptyProductionLabel: '품목 미입력',
                emptyWorkLabel: '작업 내역 미입력'
            },
            {
                title: '2팀',
                icon: 'fa-box-open',
                color: '#059669',
                secondaryColor: '#047857',
                tint: '#ecfdf5',
                desc: '스틱 및 소포장 라인별 이력',
                dataKey: 'work_team_calendar_team2',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'stick',
                processLabel: '스틱 · 소포장',
                processTag: '포장',
                processDesc: '스틱과 소포장 제품 흐름에 맞춘 2팀 주간 이력입니다.',
                emptyProductionLabel: '품목 미입력',
                emptyWorkLabel: '작업 내역 미입력'
            },
            {
                title: '3팀',
                icon: 'fa-bottle-water',
                color: '#7c3aed',
                secondaryColor: '#5b21b6',
                tint: '#f5f3ff',
                desc: '액상 공정 라인별 이력',
                dataKey: 'work_team_calendar_team3',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'liquid',
                processLabel: '액상',
                processTag: '액상',
                processDesc: '액상 제품 흐름에 맞춘 3팀 주간 이력입니다.',
                emptyProductionLabel: '품목 미입력',
                emptyWorkLabel: '작업 내역 미입력'
            },
            {
                title: '공무환경팀',
                icon: 'fa-screwdriver-wrench',
                color: '#dc2626',
                secondaryColor: '#b91c1c',
                tint: '#fef2f2',
                desc: '폐수 · 전체 · 기타 작업 이력',
                dataKey: 'work_team_calendar_team4',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'maintenance',
                processLabel: '공무환경',
                processTag: '폐수 · 기타',
                processDesc: '폐수, 전체, 기타 작업 중심의 공무환경팀 주간 이력입니다.',
                emptyProductionLabel: '생산량 없음',
                emptyWorkLabel: '작업 내역 미입력'
            },
            {
                title: '통합현황',
                icon: 'fa-chart-column',
                color: '#0f766e',
                secondaryColor: '#0f172a',
                tint: '#ecfeff',
                desc: '가스, 전기, 폐수, 생산량, 작업내역을 한 번에 보는 통합 캘린더',
                dataKey: 'work_team_calendar_overview',
                view: 'team_calendar',
                viewerMode: 'full-bleed',
                productVisual: 'dry',
                processLabel: '통합현황',
                processTag: '전체 집계',
                processDesc: '전체 팀의 유틸리티, 생산, 작업내역을 월 합계와 일자 상세로 함께 확인하는 통합 현황입니다.',
                emptyProductionLabel: '생산량 없음',
                emptyWorkLabel: '작업 내역 미기입'
            }
        ];

        AppData['work'] = {
            id: 'work',
            name: '팀별내역서',
            icon: 'fa-clipboard-list',
            color: 'green',
            accent: '#16a34a',
            teamCategories,
            categories: [
                {
                    title: '팀별내역',
                    icon: 'fa-calendar-days',
                    color: '#2563eb',
                    secondaryColor: '#1d4ed8',
                    tint: '#eff6ff',
                    desc: '1팀 1파트부터 공무환경팀까지 통합 팀별내역',
                    dataKey: 'work_team_calendar_team1_part1',
                    view: 'team_calendar',
                    viewerMode: 'full-bleed',
                    productVisual: 'dry',
                    processLabel: '통합 보기',
                    processTag: '팀별',
                    processDesc: '모달 상단의 팀 전환 버튼으로 1팀 1파트부터 공무환경팀까지 한 화면에서 전환합니다.',
                    emptyProductionLabel: '품목 미입력',
                    emptyWorkLabel: '작업 내역 미입력'
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
                },
                ...(teamReportDocumentExperimentEnabled ? [{
                    title: '팀별내역서 LAB',
                    icon: 'fa-flask',
                    color: '#0f766e',
                    secondaryColor: '#0f172a',
                    tint: '#ecfeff',
                    desc: '기존 화면과 데이터를 그대로 사용하는 Daniel 전용 문서형 실험 화면',
                    dataKey: 'work_team_calendar_team1_part1',
                    view: 'team_calendar_experiment',
                    viewerMode: 'full-bleed',
                    productVisual: 'dry',
                    processLabel: '문서형 실험',
                    processTag: 'LAB',
                    processDesc: '팀별·공정별·공장별 전환과 팀 선택을 한 줄 문서형 컨트롤로 정리한 실험 화면입니다.',
                    emptyProductionLabel: '품목 미입력',
                    emptyWorkLabel: '작업 내역 미입력'
                }] : [])
            ]
        };
        return AppData['work'];
    });
})();
