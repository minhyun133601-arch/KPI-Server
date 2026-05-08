((root) => {
  const entries = [
    {
      date: '2026-05-08',
      tag: 'work-history-equipment/ui-cleanup',
      title: '작업내역 첨부/달력 표시와 설비 이력카드 정리',
      summary:
        '작업내역 첨부를 보고서, 견적서, 기타 3개 구분으로 정리하고, 작업내역이 팀 달력 날짜칸에서 별+하위카테고리+제목으로 크게 보이게 했으며, 설비 이력카드 보드는 작성된 카드를 팀별 lane과 설비 선택 묶음으로 구분되게 정리했습니다.',
      detail:
        '기존 billing/report_pdf 문서 11건과 work_history_records payload는 one-shot repair로 새 카테고리/슬롯에 맞췄고, 작업 달력은 저장 구조 변경 없이 월간 요약/날짜칸 cue 렌더링만 조정했습니다. 설비 이력카드는 팀 그룹 정렬/보드 헤더/선택 optgroup을 정리했습니다. 검증 기준: 작업내역 frontend smoke, document-storage unit, repair preview/write, equipment-history render smoke, browser smoke.',
    },
    {
      date: '2026-05-07',
      tag: 'frontend/import',
      title: '설비 이력카드·법정 설비 프론트 이식',
      summary:
        'KPI-local 참조본의 설비 이력카드 작성 시작 흐름, 사진/공정 정보 상단 배치, 사진 되돌리기와 자동 저장, 상세 정보 메모식 입력판, 저장 카드 삭제, 가동중/비가동중 토글, 법정 설비 검사/선임 일정 입력, 작업 캘린더 설비이력 요약 연동을 회사 런타임에 반영했습니다.',
      detail:
        '개인정보 영향: 신규 실데이터나 첨부 원본을 복사하지 않았고 Playwright smoke가 남긴 샘플 설비 기록은 제거했습니다. 검증 기준: targeted frontend smoke, format, lint, server-structure, browser smoke.',
    },
    {
      date: '2026-05-06',
      tag: 'runtime/env',
      title: 'KPI Server env 파일 직접값 런타임 정리',
      summary: '중앙 런타임 초기화, 시작, 백업, 복구 스크립트가 외부 secret 폴더나 file-path secret indirection 대신 clone 내부 .env.production.local의 직접 값을 읽도록 정리했습니다.',
      detail: '개인정보 영향: 실제 비밀번호는 출력하거나 커밋하지 않았고 .env, .env.*.local, var/ ignore 경계는 유지했습니다. 검증 기준: health, DB 접속, 로그인 API, 백업/복구 preview, git check-ignore, git diff --check.',
    },
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
