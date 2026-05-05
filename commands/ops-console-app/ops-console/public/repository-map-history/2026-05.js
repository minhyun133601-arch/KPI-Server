((root) => {
  const entries = [
    {
      date: '2026-05-05',
      tag: 'refactor/split',
      title: '대형 런타임 split refactor 완료',
      summary: 'KPI 앱 bootstrap, 유틸리티 동기화와 유지관리, 생산량 추출기, Data Path 화면, Ops Console 서비스를 800줄 이하 split 파일 구조로 정리했습니다.',
      detail: '개인정보 영향: KPI-local의 로컬 실험 DB, 로그, .env, 업로드, 인증 토큰, runtime storage는 복사하거나 변경하지 않았습니다. 검증 기준: split 로더 순서, Data Path split, history 중복 방지, targeted smoke, 최종 게이트.',
    },
    {
      date: '2026-05-04',
      tag: 'repository/runtime',
      title: 'Repository Map과 adapter/runtime 정리',
      summary: 'Repository 탭 역할 분리, Data Path 분리, browser adapter/runtime split, owner route, production provenance, metering preview adapter 흐름을 회사 운영 기준으로 정리했습니다.',
      detail: '개인정보 영향: 실제 조직/사람/현장/설비/운영값/자격 증명 추가 없음. 검증: targeted smoke, npm test, npm run verify 통과.',
    },
    {
      date: '2026-05-02',
      tag: 'owner/docs',
      title: '오너콘솔과 공개 문서 정리',
      summary: 'Repository Map, 오너 콘솔, README, agent/skill 규칙, 보안 문구, 서버 도구 설명을 회사 운영 기준으로 정리했습니다.',
      detail: '개인정보 영향: 비공개 산출물, 내부 스크린샷, 자격 증명 추가 없음. 검증: 문구 스캔, smoke test, syntax check.',
    },
    {
      date: '2026-05-01',
      tag: 'server sync',
      title: '서버 런타임 변경분 반영',
      summary: 'KPI Runtime, shared DB save path, app_documents file path, README, seed data, Repository Map을 운영 안전 구조로 맞췄습니다.',
      detail: '개인정보 영향: 실제 운영 라벨과 값은 합성 라벨로 작성함. 검증: format check, lint, node test, runtime smoke.',
    },
  ];

  root.KPI_REPOSITORY_MAP_DAILY_HISTORY = [
    ...(root.KPI_REPOSITORY_MAP_DAILY_HISTORY || []),
    ...entries,
  ].sort((left, right) => String(right.date).localeCompare(String(left.date)));
})(this);
