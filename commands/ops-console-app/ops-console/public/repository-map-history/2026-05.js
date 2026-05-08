((root) => {
  const entries = [
    {
      date: '2026-05-08',
      tag: 'work-history-equipment/ui-cleanup',
      title: '작업내역 첨부/달력/페이지 표시와 설비 이력카드 정리',
      summary:
        '작업내역 첨부를 보고서, 견적서, 기타 3개 구분으로 정리하고, 비용 입력은 숫자 전용/표시는 만원 단위로 줄였으며, 작업내역이 팀 달력 날짜칸에서 별+하위카테고리만 크게 보이게 했습니다. 작업내역 목록은 긴 스크롤 대신 1, 2, 3 번호 버튼으로 넘기게 했고, 설비 이력카드 보드는 작성된 카드를 팀별 lane과 팀별 내역서 컨셉 색상/아이콘으로 구분되게 정리했습니다. 브라우저 뒤로가기는 앱 내부 탭/상세 화면 이력을 먼저 복원하도록 연결했습니다.',
      detail:
        '기존 billing/report_pdf 문서 11건과 work_history_records payload는 one-shot repair로 새 카테고리/슬롯에 맞췄고, 작업 달력은 저장 구조 변경 없이 월간 요약/날짜칸 cue 렌더링만 조정하면서 우측 상단 별 카운트는 제거했습니다. 작업내역이 있는 달력 날짜칸은 휴무 표시는 유지하되 테두리와 ★ 하위카테고리 네모를 진한 작업내역 색으로 강조했습니다. 작업내역 비용은 저장값을 원 단위 숫자로 유지하되 입력창은 숫자만 남기고 화면 표시는 만원/억원 단위로 줄였으며, 비용 미입력 항목은 자체처리 문구 없이 -로 표시합니다. 작업내역 기입/수정의 작업자 칸은 미정 값을 비우고 한 줄 고정 입력으로 바꿔 입력 중 칸이 아래로 늘어나지 않게 했습니다. 작업내역 전체/팀별 목록은 8개 단위 페이지 상태를 두고 검색/필터 변경 시 첫 페이지로 돌아가게 했습니다. 설비 이력카드는 팀 그룹 정렬과 선택 optgroup은 유지하되 보드 헤더는 팀명만 남기고 내부 설비 카드는 가동중 초록, 비가동중 빨강, 정비중 노랑 상태 톤으로 통일했습니다. 설비 보드 카드에는 같은 팀 안 표시 순서를 바꾸는 위/아래 버튼과 가동중, 비가동중, 정비중을 순환 저장하는 상태 버튼을 추가했습니다. 앱 셸은 내부 탭/카테고리 이동을 history state로 쌓고 popstate에서 복원하며, 모달이 열려 있으면 화면 이동보다 먼저 닫습니다. 작업내역 작성 모달은 변경된 입력이 있으면 닫기 전 확인창을 띄웁니다. 검증 기준: 작업내역 frontend smoke, document-storage unit, repair preview/write, equipment-history render smoke, browser smoke.',
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
