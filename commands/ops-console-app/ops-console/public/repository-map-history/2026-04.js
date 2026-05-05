((root) => {
  const entries = [
    {
      date: '2026-04-27',
      tag: 'privacy gate',
      title: '공개 안전 경계 정리',
      summary: '비공개 로컬 산출물, 업로드형 파일, 환경 파일, 전달용 메모를 공개 저장소 경계 밖으로 분리했습니다.',
      detail: '개인정보 영향: README와 공개 문서만 추적. 검증: git ignore 상태, 민감 문자열 스캔, 포트 스캔.',
    },
    {
      date: '2026-04-26',
      tag: 'demo baseline',
      title: 'KPI Server 공개 기준 구성',
      summary: '정적 데모, 합성 데이터, audit/data/work/utility 화면, owner console launch, command wrapper 기준을 구성했습니다.',
      detail: '개인정보 영향: 합성 팀/설비/문서/값만 사용. 검증: JavaScript syntax check, browser smoke, targeted runtime checks.',
    },
    {
      date: '2026-04-25',
      tag: 'ports',
      title: '로컬 포트 기준 통일',
      summary: 'KPI Runtime 3100, PostgreSQL 5434, owner console 3215 기준으로 정리했습니다.',
      detail: '개인정보 영향: 포트 설정만 변경. 검증: 설정 스캔과 저장소 계약 확인.',
    },
  ];

  root.KPI_REPOSITORY_MAP_DAILY_HISTORY = [
    ...(root.KPI_REPOSITORY_MAP_DAILY_HISTORY || []),
    ...entries,
  ].sort((left, right) => String(right.date).localeCompare(String(left.date)));
})(this);
