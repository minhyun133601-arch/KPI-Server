((root) => {
  const entries = [
    {
      date: '2026-05-19',
      tag: 'local-experiment/upstream-sync',
      title: 'KPI-Server 최신 기능 로컬 실험본 이식',
      summary:
        '원격 origin/main 최신 기능을 fast-forward로 흡수한 뒤 로컬 실험본 운영 경계를 KPI 18080, PostgreSQL 55432, .env.local-experiment, var/local-experiment 기준으로 다시 맞췄습니다.',
      detail:
        '마이그레이션 전 로컬 PostgreSQL custom dump를 생성하고 005/006 util production daily time metric 마이그레이션을 kpi_local_experiment에 적용했습니다. Ops Console과 서버 실행/중지/DB 콘솔/계정 보조 스크립트의 기본값이 로컬 실험본 env를 우선하도록 정리되었고, 서버는 http://127.0.0.1:18080, Ops Console은 http://127.0.0.1:3215에서 확인했습니다. Follow-up: 상위 유틸리티 메뉴를 제거하고 데이터 관리 > 유틸리티 기입/분석으로 재배치했으며, 생산량 기입/삭제/추출은 팀별내역서 생산량 카드 안으로 이동했습니다. 생산량 import/parser/API/DB/report 값 경로는 유지했습니다. 추가로 production_kind normal/rework를 저장/중복키/표시 경로에 붙여 정상 기입과 재가공품 기입을 분리했고, 재가공품은 팀별내역서 생산 상세에서 배지로 표시됩니다. 총괄비율/분석/보고서의 생산량 계산은 정상+재가공품 합산 기준으로 유지합니다. 적용 전 로컬 PostgreSQL custom dump를 만들고 008_util_production_daily_production_kind.sql을 적용했습니다. 검증 기준: format, lint, npm test, server-structure, root smoke, Playwright browser smoke, ops console health/overview/DB tables, git diff --check.',
    },
    {
      date: '2026-05-18',
      tag: 'production-import/time-metrics',
      title: '생산량 엑셀 조업시간/가동시간 추출',
      summary:
        '생산량 기입 엑셀의 J열 조업시간과 L열 가동시간을 기존 보조값처럼 추출해 브리지, 저장, 중복판별, 보고서 집계 경로에 보존하도록 확장했습니다.',
      detail:
        'util_production_daily_entries에 nullable 시간 컬럼을 추가하는 005 마이그레이션과 work_time/operation_time 기준을 맞추는 006 마이그레이션을 만들고, 적용 전 PostgreSQL 덤프 백업을 생성했습니다. 기존 행은 시간이 비어 있는 상태로 유지되며, 새 시트 재기입부터 같은 날짜/팀/라인/품명/생산량에 조업시간 또는 가동시간이 다르면 별도 보조 중복키로 판별됩니다. 검증 기준: production extractor/import/state/report/work smoke, format, lint, server-structure, git diff --check, npm run verify.',
    },
    {
      date: '2026-05-15',
      tag: 'report-deck/template',
      title: '공무환경팀 PPT형 보고서 템플릿',
      summary:
        '보고서 메뉴를 공무환경팀 실적보고서 참조 파일의 9장 흐름에 맞춘 PPT형 전체화면 덱으로 바꾸고, 실제 수치 없이 빈 표·차트·이미지 자리만 유지하는 재사용 템플릿을 추가했습니다.',
      detail:
        '표지, 목차, 가스·전기 분석, 폐수 분석, 공사 및 정비, 주요 계획 순서로 슬라이드를 구성했습니다. DB 필드 패널은 화면에서 제거했고 수정 버튼을 눌렀을 때만 문구를 편집해 report_runtime.cover 공용 레코드에 저장합니다. 전체화면 버튼은 브라우저 Fullscreen API로 슬라이드만 16:9 전체화면 표시합니다. 검증 기준: section factory smoke, util runtime browser-adapter smoke, report runtime adapter smoke, report browser smoke, format, lint, git diff --check.',
    },
    {
      date: '2026-05-11',
      tag: 'equipment-history-print/account-admin',
      title: '설비이력카드 A4 출력과 사용자 계정 관리',
      summary:
        '설비이력카드 작성 화면에 A4 출력 액션을 추가해 사진/기본정보/설비 스펙/정비 이력/관련 문서/비고 카드 양식을 유지한 인쇄 문서로 배치하고, 운영 콘솔 계정 관리에는 기존 계정을 선택해 viewer/admin/삭제를 적용하는 사용자 관리 폼을 추가했습니다.',
      detail:
        '데이터 변경 전 PostgreSQL custom dump를 생성했고 Andryu, Bogus, Danny, Eric, Felix, Jeff, Mike, Shine 계정을 viewer에서 admin으로 변경했습니다. 운영 콘솔의 사용자 삭제 폼은 owner 계정을 제외한 기존 아이디 드롭다운과 viewer/admin/삭제 선택으로 구성한 사용자 관리 폼으로 바꿨고, 서버 스크립트도 owner 변경/삭제를 차단합니다. 이후 일괄 승격 액션은 제거해 계정 변경은 개별 사용자 관리 폼으로만 처리합니다. A4 출력은 숨은 인쇄 프레임을 우선 사용해 팝업 허용 안내 없이 인쇄 대화상자를 열도록 조정했고, 별도 조밀표 대신 작성 화면과 같은 카드 양식을 쓰도록 정리했습니다. 검증 기준: equipment-history render smoke, ops-console account management smoke, ops-console data-reference smoke, format, lint, server-structure, git diff --check, KPI browser smoke.',
    },
    {
      date: '2026-05-08',
      tag: 'work-history-equipment/ui-cleanup',
      title: '작업내역 첨부/달력/페이지 표시와 설비 이력카드 정리',
      summary:
        '작업내역 첨부를 보고서, 견적서, 기타 3개 구분으로 정리하고, 비용 입력은 숫자 전용/표시는 만원 단위로 줄였으며, 작업내역이 팀 달력 날짜칸에서 별+하위카테고리만 크게 보이게 했습니다. 작업내역 목록은 긴 스크롤 대신 1, 2, 3 번호 버튼으로 넘기게 했고, 설비 이력카드 보드는 작성된 카드를 팀별 lane과 팀별 내역서 컨셉 색상/아이콘으로 구분되게 정리했습니다. 설비 보드는 팀 lane 우측 상단의 눈에 띄는 이동 아이콘을 눌렀을 때만 해당 팀의 순서 변경 화살표가 보이고, 상태 변경은 카드 순서에 영향을 주지 않게 했습니다. 브라우저 뒤로가기는 앱 내부 탭/상세 화면 이력을 먼저 복원하도록 연결했습니다.',
      detail:
        '기존 billing/report_pdf 문서 11건과 work_history_records payload는 one-shot repair로 새 카테고리/슬롯에 맞췄고, 작업 달력은 저장 구조 변경 없이 월간 요약/날짜칸 cue 렌더링만 조정하면서 우측 상단 별 카운트는 제거했습니다. 작업내역이 있는 달력 날짜칸은 휴무 표시는 유지하되 테두리와 ★ 하위카테고리 네모를 진한 작업내역 색으로 강조했습니다. 작업내역 비용은 저장값을 원 단위 숫자로 유지하되 입력창은 숫자만 남기고 화면 표시는 만원/억원 단위로 줄였으며, 비용 미입력 항목은 자체처리 문구 없이 -로 표시합니다. 작업내역 기입/수정의 작업자 칸은 미정 값을 비우고 한 줄 고정 입력으로 바꿔 입력 중 칸이 아래로 늘어나지 않게 했습니다. `1팀 2파트 / 건조기 V/F 안전발판 개선` 작업내역은 자동 중요 표시 규칙에서 제외해 제목 앞 별표가 붙지 않게 했습니다. 작업내역 전체/팀별 목록은 8개 단위 페이지 상태를 두고 검색/필터 변경 시 첫 페이지로 돌아가게 했습니다. 설비 이력카드는 팀 그룹 정렬과 선택 optgroup은 유지하되 보드 헤더는 팀명만 남기고 내부 설비 카드는 가동중 초록, 비가동중 빨강, 정비중 노랑 상태 톤으로 통일했습니다. 설비 보드 카드는 상태와 무관하게 기존 입력/수동 이동 순서를 유지하고, 각 팀 lane 우측 상단의 노란 이동 아이콘을 눌렀을 때만 해당 팀 카드들의 위/아래 순서 변경 화살표를 보여줍니다. 설비 보드 카드에는 가동중, 비가동중, 정비중을 순환 저장하는 상태 버튼을 추가했고, 카드 보조 지표는 다음 점검만 남겨 간소화했습니다. 설비 작성 화면의 담당 업체 칸은 여러 줄 입력으로 바꿔 업체명과 전화번호를 같이 적을 수 있게 했습니다. 앱 셸은 내부 탭/카테고리 이동을 history state로 쌓고 popstate에서 복원하며, 모달이 열려 있으면 화면 이동보다 먼저 닫습니다. 작업내역 작성 모달은 변경된 입력이 있으면 닫기 전 확인창을 띄웁니다. 검증 기준: 작업내역 frontend smoke, document-storage unit, repair preview/write, equipment-history render smoke, browser smoke.',
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
