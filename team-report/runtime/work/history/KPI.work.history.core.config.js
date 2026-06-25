(function initKpiWorkHistoryCoreConfig() {
    const history = KpiWorkHistoryBrowserAdapter.getHistory();

    const DATA_KEY = 'work_history_records';
    const TEAM_KEYS = ['team1part1', 'team1part2', 'team2', 'team3', 'team4'];
    const TEAM_DATA_VAR_NAMES = Object.freeze({
        team1part1: 'Team1Part1Data',
        team1part2: 'Team1Part2Data',
        team2: 'Team2Data',
        team3: 'Team3Data',
        team4: 'Team4Data'
    });
    const TeamInfo = Object.freeze({
        team1part1: { name: '1팀 1파트', desc: '건조', class: 'team1part1' },
        team1part2: { name: '1팀 2파트', desc: '건조', class: 'team1part2' },
        team2: { name: '2팀', desc: '스틱·소포장', class: 'team2' },
        team3: { name: '3팀', desc: '액상', class: 'team3' },
        team4: { name: '공무환경팀', desc: '폐수 · 전체 · 기타', class: 'team4' }
    });
    const LOCAL_BACKUP_KEY = `workhistory:${DATA_KEY}`;
    const KPI_FLAG_LABEL = '★';
    const KPI_FLAG_PILL_LABEL = '★';
    const IMPORTANT_FLAG_LABEL = '★';
    const IMPORTANT_FLAG_PILL_LABEL = '★';
    const ACTUAL_ACHIEVEMENT_RULES = Object.freeze([
        Object.freeze({
            team: 'team2',
            startDate: '2026-02-22',
            endDate: '2026-02-22',
            workIncludes: Object.freeze(['배합실 무중력혼합기 핀밀 축 점검'])
        })
    ]);
    const RECORD_CATEGORY_GROUP_ORDER = Object.freeze(['kpi', 'focus', 'report']);
    const RECORD_CATEGORY_GROUPS = Object.freeze({
        kpi: Object.freeze({
            label: '1차 KPI',
            categories: Object.freeze([
                '설비 가동률 증대',
                '자체 정비 비용 절감',
                '연간 투자 계획 이행률'
            ])
        }),
        focus: Object.freeze({
            label: '중점추진과제',
            categories: Object.freeze([
                '통합 모니터링 운영 체계 구축',
                '유틸리티 데이터 관리 체계 구축',
                '대외 지적 사항 선제 대응'
            ])
        }),
        report: Object.freeze({
            label: '보고',
            categories: Object.freeze([])
        })
    });
    const RECORD_CATEGORY_ALIAS_MAP = Object.freeze({
        '자체 정비': '자체 정비 비용 절감',
        '계획 이행': '연간 투자 계획 이행률',
        '계획 이행률': '연간 투자 계획 이행률',
        '연간 투자 계획': '연간 투자 계획 이행률',
        '모니터링 운영 체계': '통합 모니터링 운영 체계 구축',
        '운영 체계 구축': '통합 모니터링 운영 체계 구축',
        '데이터 관리 체계': '유틸리티 데이터 관리 체계 구축',
        '유틸리티 데이터 관리 체계': '유틸리티 데이터 관리 체계 구축',
        '대외 지적 사항 대응': '대외 지적 사항 선제 대응'
    });
    const RECORD_CATEGORY_OPTIONS = Object.freeze(
        RECORD_CATEGORY_GROUP_ORDER.flatMap(groupKey => RECORD_CATEGORY_GROUPS[groupKey]?.categories || [])
    );
    const DEFAULT_RECORD_RESULT_TYPE = 'non-performance';
    const RECORD_RESULT_TYPE_OPTIONS = Object.freeze([
        Object.freeze({ value: 'non-performance', label: '실적외' }),
        Object.freeze({ value: 'performance', label: '실적' })
    ]);
    const DEFAULT_WORKSPACE_MODE = 'default';
    const PRODUCTION_REPORT_WORKSPACE_MODE = 'production-report';

    Object.assign(history, {
        DATA_KEY,
        TEAM_KEYS,
        TEAM_DATA_VAR_NAMES,
        TeamInfo,
        LOCAL_BACKUP_KEY,
        KPI_FLAG_LABEL,
        KPI_FLAG_PILL_LABEL,
        IMPORTANT_FLAG_LABEL,
        IMPORTANT_FLAG_PILL_LABEL,
        ACTUAL_ACHIEVEMENT_RULES,
        RECORD_CATEGORY_GROUP_ORDER,
        RECORD_CATEGORY_GROUPS,
        RECORD_CATEGORY_ALIAS_MAP,
        RECORD_CATEGORY_OPTIONS,
        DEFAULT_RECORD_RESULT_TYPE,
        RECORD_RESULT_TYPE_OPTIONS,
        DEFAULT_WORKSPACE_MODE,
        PRODUCTION_REPORT_WORKSPACE_MODE
    });

    KpiWorkHistoryBrowserAdapter.setHistory(history);
})();
