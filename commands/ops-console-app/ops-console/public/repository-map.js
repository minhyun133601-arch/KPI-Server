const messages = {
  ko: {
    eyebrow: 'KPI Server',
    title: 'Repository Map',
    subtitle: '저장소 안의 실제 폴더와 파일, 핵심 자료, 패치 이력을 이 화면 한곳에서 확인합니다.',
    runtimePort: 'Runtime',
    opsPort: 'Ops console',
    dbPort: 'DB',
    verifyPort: 'Verification',
    directoriesLabel: 'Directories',
    filesLabel: 'Files',
    changedLabel: 'Git changes',
    generatedLabel: 'Generated',
    liveKicker: 'Live repository structure',
    treeTitle: 'Current Tree',
    sourceChecking: 'checking',
    sourceLoading: '로컬 운영 콘솔 repository map API를 불러오는 중입니다.',
    sourceLoaded: '{endpoint}에서 읽었습니다. .git, node_modules, runtime var, logs, env 파일은 제외됩니다.',
    sourceUnavailable: 'repository map API를 불러오지 못했습니다.',
    searchPlaceholder: '파일 또는 폴더 검색',
    expandAll: '전체 펼치기',
    collapseAll: '전체 접기',
    loading: 'repository map을 불러오는 중입니다.',
    emptyTree: '조건에 맞는 파일이나 폴더가 없습니다.',
    loadError: 'repository map을 불러오지 못했습니다.',
    recentKicker: 'recent and changed',
    recentTitle: '최근 / 추가 / 수정',
    noRecent: '최근 변경 또는 Git 변경 파일이 없습니다.',
    safetyKicker: 'safety boundary',
    safetyTitle: '이 맵에서 숨기는 항목',
    hideEnv: '비밀정보 파일',
    hideRuntime: '런타임 산출물',
    hideGenerated: '설치 및 빌드 결과물',
    hidePrivate: '개인 작업 내용',
    hideAttachments: '첨부파일과 바이너리',
    historyKicker: 'records',
    historyTitle: '패치 이력',
    architectureKicker: 'repository coverage',
    architectureTitle: '아키텍처 개요',
    materialsKicker: 'key materials',
    materialsTitle: '리포지토리 핵심 자료',
    policyKicker: 'stored here from now on',
    policyTitle: '여기에 저장하는 기준',
    noArchitecture: '요약할 저장소 영역이 없습니다.',
    noMaterials: '표시할 핵심 자료를 찾지 못했습니다.',
    inventoryFilesLabel: 'files',
    inventoryLinesLabel: 'lines',
    inventoryBytesLabel: 'bytes',
    inventoryRootFiles: 'repo root files',
    historySummaryLabel: '요약',
    historyTouchedLabel: '영향 경로',
    historyVerificationLabel: '검증',
    historyBoundaryLabel: '경계',
    metricDirectories: 'dirs',
    metricFiles: 'files',
    metricDirty: 'dirty',
    metricRecent: 'recent',
    fileType: 'file',
    directoryType: 'dir',
    clean: 'clean',
    dirty: '{count} changed',
    rootPath: 'repository root',
    updated: '수정',
    purposeAgentRules: 'AI 작업 규칙',
    purposeMainShell: '메인 화면',
    purposeReadme: '실행 안내',
    purposeIgnore: '제외 규칙',
    purposePackage: 'Node 스크립트',
    purposeLock: '의존성 잠금',
    purposeMapScreen: '리포지토리맵 화면',
    purposeMapLogic: '리포지토리맵 동작',
    purposeOpsServer: 'ops console 서버',
    purposeConsoleLogic: '콘솔 화면 동작',
    purposeCommand: '실행 바로가기',
    purposePowerShell: 'Windows 실행 스크립트',
    purposeTest: '검증 테스트',
    purposeBrowserTest: '브라우저 검증',
    purposeMigration: 'DB 변경',
    purposeRoute: 'API 라우트',
    purposeService: '서비스 로직',
    purposeRepository: 'DB 접근',
    purposeStyle: '화면 스타일',
    purposeSection: '메뉴 연결',
    purposeDemoData: '데모 데이터',
    purposeAsset: '공유 자산',
    purposeWorkflow: '자동화 설정',
    purposeConfig: '설정 데이터',
    purposeDocument: '문서',
    purposeScript: '로직 파일',
    purposeHtml: '브라우저 화면',
    recentLastHour: '최근 1시간',
    recentToday: '오늘',
    recentThisWeek: '이번 주',
  },
  en: {
    eyebrow: 'KPI Server',
    title: 'Repository Map',
    subtitle: 'See the live repository tree, key materials, and stored patch history in one place.',
    runtimePort: 'Runtime',
    opsPort: 'Ops console',
    dbPort: 'DB',
    verifyPort: 'Verification',
    directoriesLabel: 'Directories',
    filesLabel: 'Files',
    changedLabel: 'Git changes',
    generatedLabel: 'Generated',
    liveKicker: 'Live repository structure',
    treeTitle: 'Current Tree',
    sourceChecking: 'checking',
    sourceLoading: 'Loading the local ops-console repository map API.',
    sourceLoaded: 'Loaded from {endpoint}. Excluded: .git, node_modules, runtime var, logs, and env files.',
    sourceUnavailable: 'Could not load the repository map API.',
    searchPlaceholder: 'Search files or folders',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    loading: 'Loading repository map.',
    emptyTree: 'No matching file or folder.',
    loadError: 'Could not load the repository map.',
    recentKicker: 'recent and changed',
    recentTitle: 'Recent / Added / Modified',
    noRecent: 'No recent or Git-changed files to show.',
    safetyKicker: 'safety boundary',
    safetyTitle: 'Hidden from this map',
    hideEnv: 'secret files',
    hideRuntime: 'runtime artifacts',
    hideGenerated: 'install and build outputs',
    hidePrivate: 'private work contents',
    hideAttachments: 'attachments and binary files',
    historyKicker: 'records',
    historyTitle: 'Patch history',
    architectureKicker: 'repository coverage',
    architectureTitle: 'Architecture Overview',
    materialsKicker: 'key materials',
    materialsTitle: 'Core Repository Materials',
    policyKicker: 'stored here from now on',
    policyTitle: 'Repository Map storage rules',
    noArchitecture: 'No repository areas are available to summarize.',
    noMaterials: 'Could not find the key materials to show.',
    inventoryFilesLabel: 'files',
    inventoryLinesLabel: 'lines',
    inventoryBytesLabel: 'bytes',
    inventoryRootFiles: 'repo root files',
    historySummaryLabel: 'Summary',
    historyTouchedLabel: 'Touched paths',
    historyVerificationLabel: 'Verification',
    historyBoundaryLabel: 'Boundary',
    metricDirectories: 'dirs',
    metricFiles: 'files',
    metricDirty: 'dirty',
    metricRecent: 'recent',
    fileType: 'file',
    directoryType: 'dir',
    clean: 'clean',
    dirty: '{count} changed',
    rootPath: 'repository root',
    updated: 'Updated',
    purposeAgentRules: 'AI work rules',
    purposeMainShell: 'main screen',
    purposeReadme: 'run guide',
    purposeIgnore: 'ignore rules',
    purposePackage: 'Node scripts',
    purposeLock: 'dependency lock',
    purposeMapScreen: 'map screen',
    purposeMapLogic: 'map behavior',
    purposeOpsServer: 'ops console server',
    purposeConsoleLogic: 'console UI behavior',
    purposeCommand: 'launch shortcut',
    purposePowerShell: 'Windows script',
    purposeTest: 'verification test',
    purposeBrowserTest: 'browser verification',
    purposeMigration: 'DB migration',
    purposeRoute: 'API route',
    purposeService: 'business logic',
    purposeRepository: 'DB access',
    purposeStyle: 'screen styling',
    purposeSection: 'menu wiring',
    purposeDemoData: 'demo data',
    purposeAsset: 'shared asset',
    purposeWorkflow: 'automation config',
    purposeConfig: 'config data',
    purposeDocument: 'document',
    purposeScript: 'logic file',
    purposeHtml: 'browser screen',
    recentLastHour: 'last hour',
    recentToday: 'today',
    recentThisWeek: 'this week',
  },
};

const messageOverrides = {
  ko: {
    subtitle: '실시간 트리, 핵심 자료, 최근 패치 이력을 한 화면에서 보고 기능·파일·패치 기록까지 함께 검색합니다.',
    searchPlaceholder: '기능, 파일, 최근 패치 이력 검색',
    architectureKicker: 'full repository blueprint',
    architectureTitle: '전체 아키텍처',
    architectureSubtitle: '기능, 파일, 패치 이력으로 검색하면서 저장소 전체 아키텍처를 전체폭으로 훑고, 아래 패널들도 같은 조건으로 함께 좁혀봅니다.',
    searchSummaryIdle: '기능명, 파일 경로, 최근 패치 이력으로 검색하면 아래 아키텍처, 핵심 자료, 패치 이력 패널이 같이 좁혀집니다.',
    searchSummaryActive: '{groups}개 묶음 / {count}건 일치',
    searchNoResults: '기능, 파일, 최근 패치 이력에서 일치하는 항목을 찾지 못했습니다.',
    searchGroupArchitecture: '아키텍처',
    searchGroupFiles: '파일',
    searchGroupMaterials: '핵심 자료',
    searchGroupRecent: '최근 변경',
    searchGroupHistory: '패치 이력',
    searchKindArchitecture: 'architecture',
    searchKindFile: 'file',
    searchKindMaterial: 'material',
    searchKindRecent: 'recent',
    searchKindHistory: 'history',
    treeFilterNote: '위 검색어가 현재 트리, 최근 변경, 핵심 자료, 패치 이력에도 같이 적용됩니다.',
    noArchitecture: '검색 조건에 맞는 아키텍처 영역을 찾지 못했습니다.',
    noHistory: '검색 조건에 맞는 패치 이력이 없습니다.',
    architectureChildrenLabel: '주요 하위 영역',
  },
  en: {
    subtitle: 'See the live tree, core materials, and recent patch history in one place, then search across features, files, and patch records.',
    searchPlaceholder: 'Search features, files, or patch history',
    architectureKicker: 'full repository blueprint',
    architectureTitle: 'Total Architecture',
    architectureSubtitle: 'Search by feature, file, or patch history while scanning the full repository architecture in one wide view.',
    searchSummaryIdle: 'Search by feature name, file path, or patch history. The architecture, materials, and history panels below follow the same query.',
    searchSummaryActive: '{groups} groups / {count} matches',
    searchNoResults: 'No matches were found across features, files, or patch history.',
    searchGroupArchitecture: 'Architecture',
    searchGroupFiles: 'Files',
    searchGroupMaterials: 'Core materials',
    searchGroupRecent: 'Recent changes',
    searchGroupHistory: 'Patch history',
    searchKindArchitecture: 'architecture',
    searchKindFile: 'file',
    searchKindMaterial: 'material',
    searchKindRecent: 'recent',
    searchKindHistory: 'history',
    treeFilterNote: 'The live tree, recent changes, materials, and patch history all follow the search above.',
    noArchitecture: 'No architecture areas match the current search.',
    noHistory: 'No patch-history entries match the current search.',
    architectureChildrenLabel: 'Key child areas',
  },
};

Object.entries(messageOverrides).forEach(([language, overrides]) => {
  Object.assign(messages[language], overrides);
});

Object.assign(messages.ko, {
  subtitle: '실시간 트리, 최근 변경, 패치 이력을 이 화면 한곳에서 확인합니다.',
  searchSummaryIdle: '기능명, 파일 경로, 최근 패치 이력으로 검색하면 아래 아키텍처와 패치 이력이 같이 좁혀집니다.',
  treeFilterNote: '위 검색어가 현재 트리, 최근 변경, 패치 이력에도 같이 적용됩니다.',
});

Object.assign(messages.en, {
  subtitle: 'See the live tree, recent changes, and patch history in one place.',
  searchSummaryIdle: 'Search by feature name, file path, or patch history. The architecture and patch-history panels below follow the same query.',
  treeFilterNote: 'The live tree, recent changes, and patch history all follow the search above.',
});

Object.assign(messages.ko, {
  searchSummaryIdle: '기능명, 파일 경로, 최근 패치 이력으로 검색하면 아래 아키텍처와 패치 이력이 같이 좁혀집니다.',
});

Object.assign(messages.ko, {
  includeDescendantsLabel: '하위 파일/경로까지 포함',
  searchHelp: '예: 영역:kpi-runtime 경로:internal-server/src 파일:request-router.js 이력:오너 상태:dirty',
});

Object.assign(messages.en, {
  includeDescendantsLabel: 'Include child files and paths',
  searchHelp: 'Examples: area:kpi-runtime path:internal-server/src file:request-router.js history:owner status:dirty',
});

const historyEntries = [
  {
    date: '2026-04-30',
    title: {
      ko: 'Data Reference 개발자형 데이터 흐름도 정리',
      en: 'Converted Data Reference into a developer-style data flow diagram',
    },
    summary: {
      ko: 'Repository Map 옆 Data Reference 화면에서 축 카드와 공유 묶음 카드처럼 자잘하게 보이던 영역을 걷어내고, 선택한 기능의 UI, Client Runtime, Single Instance KPI Server, Persistence 흐름을 레이어 박스, dashed server boundary, DB/file cylinder, KPI Data Hub 노드로 보여주도록 재구성했습니다.',
      en: 'Removed the small axis and shared-group card clutter from the Data Reference screen beside Repository Map, and rebuilt the view as a developer-style architecture diagram with UI, Client Runtime, Single Instance KPI Server, Persistence layers, a dashed server boundary, DB/file cylinders, and KPI Data Hub nodes.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'cd kpi-runtime/internal-server && npm run lint',
      'cd kpi-runtime/internal-server && npm test',
      'Headless Playwright served UI check on http://127.0.0.1:3215/data-reference-map.html',
    ],
    boundary: {
      ko: '표현 구조만 바꿨습니다. module_key, record_key, permission_key, DB schema, 저장 API, KPI_STORAGE_ROOT/files 폴더 규칙은 변경하지 않았고, 별도 장기 보고서 문서는 남기지 않았습니다.',
      en: 'Changed presentation only. Did not change module keys, record keys, permission keys, DB schema, storage APIs, or KPI_STORAGE_ROOT/files folder rules, and did not leave a separate long-lived report document.',
    },
  },
  {
    date: '2026-04-30',
    title: {
      ko: '작업 자동저장과 팀 캘린더 첨부 저장 확정 보강',
      en: 'Hardened work autosave status and team-calendar attachment persistence',
    },
    summary: {
      ko: '입력 위험 점검 보고서의 남은 R-08/R-09 범위를 보완했습니다. 주간·월간·팀 캘린더 자동저장에 pending/saved/failed/blocked 상태 배지를 붙이고, 팀 캘린더 첨부 추가·삭제는 서버 record 저장 성공을 확인한 뒤 파일 정리와 화면 확정을 진행하도록 바꿨습니다.',
      en: 'Completed the remaining R-08/R-09 scope from the input-risk audit. Weekly, monthly, and team-calendar autosaves now expose pending, saved, failed, and blocked status badges, and team-calendar attachment add/remove flows now confirm record persistence before file cleanup or UI finalization.',
    },
    touched: [
      'KPI.html',
      'kpi-runtime/app/KPI.app.shell.css',
      'kpi-runtime/app/styles/work/work.css',
      'utility/runtime/util/analytics/KPI.util.analytics.js',
      'team-report/runtime/work/KPI.work.shared.js',
      'team-report/runtime/work/KPI.work.renderers.js',
      'team-report/runtime/work/KPI.work.renderers.monthly-plan.js',
      'team-report/runtime/work/KPI.work.team-calendar.render.js',
      'team-report/runtime/work/KPI.work.team-calendar.draft-actions.js',
      'kpi-runtime/internal-server/test/frontend/work-save-status.smoke.js',
      'kpi-runtime/internal-server/test/frontend/work-renderers.smoke.js',
      'kpi-runtime/internal-server/test/frontend/work-team-calendar-render.smoke.js',
      'kpi-runtime/internal-server/test/frontend/kpi-shell-css.smoke.js',
      'work-log/input-entry-risk-audit-2026-04-30.md',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check on changed work autosave and smoke-test JS files',
      'node --test kpi-runtime/internal-server/test/frontend/work-save-status.smoke.js kpi-runtime/internal-server/test/frontend/work-renderers.smoke.js kpi-runtime/internal-server/test/frontend/work-team-calendar-render.smoke.js kpi-runtime/internal-server/test/frontend/work-production.smoke.js kpi-runtime/internal-server/test/frontend/work-shared.smoke.js kpi-runtime/internal-server/test/frontend/kpi-shell-css.smoke.js',
      'git diff --check on changed work autosave files',
      'npm run lint',
      'npm test',
    ],
    boundary: {
      ko: '기존 함수 공개 이름, 데이터 key, DB schema, 파일 저장 폴더는 유지했습니다. 자동저장 상태 표시, 저장 실패 표시, 팀 캘린더 첨부 저장/삭제 순서와 실패 복구만 조정했습니다.',
      en: 'Kept existing public function names, data keys, DB schema, and file storage folders. Changed only autosave status display, failed-save visibility, and team-calendar attachment save/delete ordering plus failure recovery.',
    },
  },
  {
    date: '2026-04-30',
    title: {
      ko: '고위험 입력·기입 저장 확정 흐름 보강',
      en: 'Hardened high-risk entry save confirmation flows',
    },
    summary: {
      ko: '입력 위험 점검 보고서의 고위험 항목 중 생산량 엑셀 반입, 감사 법정설비 등록, 감사 조도 일괄입력·증빙 교체, 설비이력카드 첨부 저장을 먼저 보완했습니다. 성공 표시는 서버 저장 완료 뒤로 미루고, 저장 실패 시 optimistic 화면 반영이나 새 첨부 orphan을 되돌리도록 했습니다.',
      en: 'Addressed the high-risk items from the input-risk report first: production Excel import, audit legal-facility registration, audit lux batch and evidence replacement, and equipment-history asset saves. Success is now reported after server persistence, and failed saves roll back optimistic UI state or newly uploaded orphan assets.',
    },
    touched: [
      'utility/runtime/util/production/KPI.util.production.extractor.js',
      'utility/runtime/util/KPI.util.production-import.js',
      'audit/runtime/audit/records/KPI.audit.records.legal.js',
      'audit/runtime/audit/records/KPI.audit.records.legal.assets.js',
      'audit/runtime/audit/records/KPI.audit.records.render.js',
      'audit/runtime/audit/records/KPI.audit.records.data.js',
      'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js',
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js',
      'kpi-runtime/internal-server/src/routes/file-routes.js',
      'kpi-runtime/internal-server/test/frontend/production-extractor-export-actions.smoke.js',
      'kpi-runtime/internal-server/test/frontend/audit-legal-form.smoke.js',
      'kpi-runtime/internal-server/test/frontend/audit-lux-save.smoke.js',
      'kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'work-log/input-entry-risk-audit-2026-04-30.md',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check on changed runtime, route, and smoke-test JS files',
      'node --test kpi-runtime/internal-server/test/frontend/production-extractor-export-actions.smoke.js kpi-runtime/internal-server/test/frontend/audit-legal-form.smoke.js kpi-runtime/internal-server/test/frontend/audit-lux-save.smoke.js kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'node --test kpi-runtime/internal-server/test/frontend/production-extractor-import-parsing.smoke.js kpi-runtime/internal-server/test/frontend/util-production-replace-import.smoke.js kpi-runtime/internal-server/test/frontend/util-production-upload-offset.smoke.js',
      'git diff --check on changed entry-risk files',
    ],
    boundary: {
      ko: '사용자 입력 화면의 의미와 저장 위치는 유지했습니다. 함수 공개 이름과 module_key, record_key, DB schema, 파일 저장 폴더는 바꾸지 않았고, 저장 완료 판정·실패 rollback·서버 파일 검증만 보강했습니다.',
      en: 'Kept user-facing entry meaning and storage locations intact. Did not change public function names, module keys, record keys, DB schema, or file storage folders; only strengthened save confirmation, failure rollback, and server file validation.',
    },
  },
  {
    date: '2026-04-30',
    title: {
      ko: '입력·기입 저장 위험 점검 보고서 작성',
      en: 'Added the input-entry save-risk audit report',
    },
    summary: {
      ko: '유틸리티 전기·가스 기입과 같은 입력값 유실, 서버 저장 미확정, 첨부 orphan 위험이 생길 수 있는 기입·첨부·엑셀 반입 흐름을 코드 기준으로 점검하고 work-log 보고서로 정리했습니다.',
      en: 'Reviewed entry, attachment, and Excel-import flows that can create utility-entry-like input loss, unconfirmed server saves, or orphaned attachments, then recorded the findings in a work-log report.',
    },
    touched: [
      'work-log/input-entry-risk-audit-2026-04-30.md',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'utility/apps/metering',
      'utility/apps/production-extractor',
      'utility/runtime/util',
      'audit/runtime/audit/records',
      'data-entry/runtime/data/equipment-history',
      'team-report/runtime/work',
      'kpi-runtime/internal-server/src/routes/file-routes.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/repository-map.js',
      'git diff --check -- work-log/input-entry-risk-audit-2026-04-30.md commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    boundary: {
      ko: '보고서와 Repository Map 변경 이력만 추가했습니다. 런타임 코드, DB schema, module_key, record_key, 저장 API, 권한 경계는 바꾸지 않았습니다.',
      en: 'Added only the report and Repository Map history entry. Did not change runtime code, DB schema, module keys, record keys, storage APIs, or permission boundaries.',
    },
  },
  {
    date: '2026-04-30',
    title: {
      ko: '유틸리티 기입을 전기/가스 통합 전체화면 팝업으로 전환',
      en: 'Switched utility entry to a shared fullscreen electric and gas popup',
    },
    summary: {
      ko: '기존 줄단위 textarea 일괄기입을 화면에서 빼고, 기존 기입 버튼이 전기와 가스 설비를 한 번에 보여주는 검색형 전체화면 팝업을 열도록 바꿨습니다. 현재 리소스 입력칸과 다른 리소스 저장 draft를 함께 다루도록 스냅샷 비교를 넓혀서, 팝업에서 전기와 가스를 같이 수정해도 저장 버튼과 오류 상태가 즉시 반영되게 맞췄습니다.',
      en: 'Removed the line-by-line textarea batch-entry flow from the visible UI and turned the existing entry button into a searchable fullscreen popup that shows both electric and gas equipment at once. Snapshot comparison now includes the active form plus the other resource draft so save-state and validation feedback react immediately when both resources are edited in the popup.',
    },
    touched: [
      'utility/apps/metering/equipment/quick-entry-ui.js',
      'utility/apps/metering/equipment/quick-entry.js',
      'utility/apps/metering/save/persistence.js',
      'utility/apps/metering/runtime/resource-ui.js',
      'utility/apps/metering/styles.css',
      'utility/apps/metering/embedded.css',
      'kpi-runtime/internal-server/test/frontend/metering-equipment-quick-entry.smoke.js',
      'kpi-runtime/internal-server/test/frontend/metering-save-validation.smoke.js',
      'kpi-runtime/internal-server/test/frontend/metering-resource-ui.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check utility/apps/metering/equipment/quick-entry-ui.js utility/apps/metering/equipment/quick-entry.js utility/apps/metering/save/persistence.js utility/apps/metering/runtime/resource-ui.js',
      'node --test kpi-runtime/internal-server/test/frontend/metering-equipment-quick-entry.smoke.js kpi-runtime/internal-server/test/frontend/metering-save-validation.smoke.js kpi-runtime/internal-server/test/frontend/metering-resource-ui.smoke.js kpi-runtime/internal-server/test/frontend/metering-runtime-bootstrap.smoke.js kpi-runtime/internal-server/test/frontend/metering-fullscreen-popup.smoke.js kpi-runtime/internal-server/test/frontend/metering-runtime-mount-dom.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '유틸리티 기입 UI, 설비 draft 비교, 저장 전 dirty/validation 판정만 조정했습니다. DB schema, module_key, 문서 저장 경로, 권한 경계는 바꾸지 않았습니다.',
      en: 'Adjusted only the utility-entry UI, equipment draft comparison, and dirty or validation checks before save. Did not change DB schema, module keys, document storage paths, or permission boundaries.',
    },
  },
  {
    date: '2026-04-30',
    title: {
      ko: '유틸리티 전체화면 토글 때 기입값이 비는 문제 보정',
      en: 'Preserved utility entry drafts across fullscreen toggles',
    },
    summary: {
      ko: '유틸리티 기입 화면이 전체화면 진입/해제 중 입력 패널을 다시 그릴 때 설비 입력값이 빈 상태로 덮이던 흐름을 막기 위해, 토글 직전에 draft를 상태로 먼저 동기화하고 다시 그린 뒤 현재 entry 값을 폼에 다시 주입하도록 바꿨습니다. 팀 모드 수동 저장도 저장 직전에 pending draft를 먼저 반영하도록 보강했습니다.',
      en: 'Stopped the utility entry screen from wiping equipment inputs during fullscreen enter and exit by syncing drafts into state before the rerender, then restoring the current entry back into the rebuilt form. Team-mode manual save now also flushes pending draft inputs before saving.',
    },
    touched: [
      'utility/apps/metering/save/persistence.js',
      'utility/apps/metering/save/store-sync.js',
      'utility/apps/metering/fullscreen/popup.js',
      'kpi-runtime/internal-server/test/frontend/metering-save-validation.smoke.js',
      'kpi-runtime/internal-server/test/frontend/metering-fullscreen-popup.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check utility/apps/metering/save/persistence.js utility/apps/metering/save/store-sync.js utility/apps/metering/fullscreen/popup.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/metering-save-validation.smoke.js kpi-runtime/internal-server/test/frontend/metering-fullscreen-popup.smoke.js kpi-runtime/internal-server/test/frontend/metering-resource-ui.smoke.js',
      'npm run lint',
      'Headless Playwright check on http://127.0.0.1:3192/: utility input value remained after fullscreen enter and exit',
    ],
    boundary: {
      ko: '유틸리티 기입 화면의 draft sync, 전체화면 rerender, 수동 저장 직전 반영 흐름만 조정했습니다. DB schema, module_key, 문서 저장 경로, 권한 경계는 바꾸지 않았습니다.',
      en: 'Adjusted only utility-entry draft syncing, fullscreen rerender behavior, and pre-save flush timing. Did not change DB schema, module keys, document storage paths, or permission boundaries.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '팀별내역서 헤더 도구 숨김과 팀 색 배지 정리',
      en: 'Hid work-history header tools and aligned team badges to team colors',
    },
    summary: {
      ko: '팀별내역서 작업내역 헤더의 보고 전용, 전체, 주간 뷰, 날짜 표시 묶음을 화면에서 숨기고, 통합현황과 상단 팀 탭에서 보이는 팀명 배지와 칩이 각 팀 색을 따르도록 조정했습니다.',
      en: 'Hid the report-only, all, weekly-view, and date pills in the work-history header, then aligned visible team-name badges and tab chips to each team color.',
    },
    touched: [
      'team-report/runtime/work/history/KPI.work.history.view.layout.js',
      'team-report/runtime/work/history/KPI.work.history.css',
      'KPI.html',
      'kpi-runtime/internal-server/test/frontend/work-history-layout-templates.smoke.js',
      'kpi-runtime/internal-server/test/frontend/work-history-core.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --test kpi-runtime/internal-server/test/frontend/work-history-layout-templates.smoke.js kpi-runtime/internal-server/test/frontend/work-history-core.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '팀별내역서 화면의 표시 요소와 색상만 조정했습니다. 저장 구조, 데이터 경로, 검색과 필터 규칙은 바꾸지 않았습니다.',
      en: 'Adjusted only visible work-history UI elements and colors. Did not change storage structure, data paths, or search and filter rules.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '데이터 참조 첫 화면 접힘과 module_key 토글 정리',
      en: 'Collapsed data-reference landing cards and moved module_key details behind a toggle',
    },
    summary: {
      ko: '데이터 참조 경로 첫 화면에서 axis 카드와 공유 묶음 카드를 기본 접힘 상태로 맞추고, app_module_records 논리 레코드 매트릭스는 별도 섹션에서 제거해 거미줄 설계도 안의 module_key 상세 보기 체크박스를 켰을 때만 보이도록 옮겼습니다.',
      en: 'Collapsed the data-reference landing axis and shared-group cards by default, removed the standalone app_module_records matrix section, and moved module_key record details into the architecture web behind a checkbox toggle.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '데이터 경로 내용과 저장 구조는 바꾸지 않았습니다. 첫 화면 노출 밀도와 module_key 상세 표시 방식만 조정했습니다.',
      en: 'Did not change data-path content or storage structure. Only adjusted initial visual density and how module_key details are shown.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '설비 이력 카드 기본 정보 입력 필드 축소',
      en: 'Reduced equipment-history basic info fields',
    },
    summary: {
      ko: '설비 이력 카드 작성 화면의 설비 기본 정보와 설비 운영 정보 입력 영역을 하나로 합치고, 새 작성 폼에는 설비명, 관리팀, 공정, 가동률만 남겼습니다.',
      en: 'Merged the equipment-history basic and operation info input areas, leaving only equipment name, managing team, process, and operating rate in the new authoring form.',
    },
    touched: [
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js',
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js',
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
      'kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
      'node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '저장 record_key, 첨부 파일 경로, DB 경로는 바꾸지 않았습니다. 기존 과거 데이터는 읽을 수 있게 두고, 새 작성/요약 기준만 4개 핵심 필드로 줄였습니다.',
      en: 'Did not change the storage record_key, attachment file paths, or DB paths. Existing older data remains readable, while new authoring and summary fields are reduced to the four core fields.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: 'AGENTS에 Data Reference 최신 경로 원칙 추가',
      en: 'Added Data Reference latest-path rule to AGENTS',
    },
    summary: {
      ko: '데이터 저장/참조 경로가 바뀌면 운영 콘솔 Data Reference Paths를 최신 상태로 갱신하되, Data Reference에는 패치 로그를 쌓지 않고 변경 이력과 검증 기록은 Repository Map에만 남기도록 AGENTS 규칙을 추가했습니다.',
      en: 'Added an AGENTS rule requiring Data Reference Paths to stay current when data storage/reference paths change, while keeping patch logs and verification records only in Repository Map history.',
    },
    touched: [
      'AGENTS.md',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/repository-map-architecture.smoke.js kpi-runtime/internal-server/test/frontend/repository-map-surface-trim.smoke.js kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'npm run lint',
    ],
    boundary: {
      ko: '새 규칙만 추가했습니다. Data Reference 화면 내용은 이번 패치에서 변경하지 않았고, 변경 이력은 Repository Map에만 남겼습니다.',
      en: 'Only added the new rule. Did not change Data Reference screen content in this patch, and recorded the change history only in Repository Map.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '데이터 참조 공유 묶음 카드 접힘 처리',
      en: 'Collapsed shared-storage cards in the data-reference map',
    },
    summary: {
      ko: '운영 콘솔 데이터 참조 경로의 shared write model과 공유 저장소 묶음 카드를 기본 접힘 상태로 바꿔, 제목과 공유 개수만 먼저 보이고 필요한 카드만 눌러 상세 설명과 연결 흐름을 확인하게 했습니다.',
      en: 'Changed the data-reference shared write model and shared-storage group cards to collapsed details cards, showing only titles and shared-flow counts until a user opens the card.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '데이터 참조 내용, 저장 경로, 권한 구조는 바꾸지 않았고 공유 묶음 영역의 노출 방식만 줄였습니다.',
      en: 'Did not change data-reference content, storage paths, or permission structure; only reduced the default visual footprint of the shared-group area.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '데이터 참조 경로 app_module_records 레코드 매트릭스 추가',
      en: 'Added app_module_records record matrix to data-reference paths',
    },
    summary: {
      ko: '운영 콘솔 데이터 참조 경로 화면에서 app_module_records를 물리 테이블 1개로만 보지 않도록 portal_data, work_runtime, util_metering별 module_key/record_key/permission_key 매트릭스를 추가했습니다.',
      en: 'Added a module_key/record_key/permission_key matrix for portal_data, work_runtime, and util_metering so the data-reference map does not show app_module_records as only one opaque physical table.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: 'DB 스키마와 저장 API는 바꾸지 않았습니다. 기존 공용 테이블 안의 논리 저장 슬롯을 화면에서 더 자세히 보이게 한 표시 변경입니다.',
      en: 'Did not change DB schema or storage APIs. This is a display-only change that makes the logical saved slots inside the existing shared table more visible.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '유틸리티 생산량 원본 시트 보관 제거',
      en: 'Removed source-sheet archiving from utility production entry',
    },
    summary: {
      ko: '유틸리티 관리에서 생산량을 기입할 때 업로드한 원본 시트 파일을 KPI_STORAGE_ROOT/files 아래에 보관하지 않도록 런타임 archive 경로를 비활성화하고, 데이터 참조 경로도 생산량 행 데이터만 전용 테이블에 저장한다고 정리했습니다.',
      en: 'Disabled the runtime archive path so source sheet files uploaded for utility production entry are not stored under KPI_STORAGE_ROOT/files, and updated the data-reference map to show only production row data going to dedicated tables.',
    },
    touched: [
      'KPI.html',
      'utility/runtime/util/KPI.util.data-sync.js',
      'utility/runtime/util/KPI.util.production-management.js',
      'utility/runtime/util/production/KPI.util.production.archive.js',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'kpi-runtime/internal-server/test/frontend/util-production-upload-offset.smoke.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check utility/runtime/util/KPI.util.data-sync.js commands/ops-console-app/ops-console/public/data-reference-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js kpi-runtime/internal-server/test/frontend/util-production-upload-offset.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '생산량 전용 테이블 저장은 유지했습니다. 기존 DB 스키마와 과거 archive 테이블은 즉시 삭제하지 않았고, 새 기입 흐름에서 원본 파일 보관만 끊었습니다.',
      en: 'Kept dedicated-table storage for production rows. Did not immediately drop existing DB schema or historical archive tables; only disconnected source-file archiving for new entry flows.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '데이터 참조 경로 공용 수정/이미지 참조 가시성 보강',
      en: 'Data-reference map visibility improved for shared editing and image references',
    },
    summary: {
      ko: '운영 콘솔 데이터 참조 경로 화면에 app_module_records 공용 수정 조건, permission_key/write 권한 설명, 이미지·첨부 documentId/previewUrl/downloadUrl 참조 필드, 공유 저장소별 묶음 카드를 추가했습니다.',
      en: 'Added shared-edit rules for app_module_records, permission_key/write-access explanation, image and attachment documentId/previewUrl/downloadUrl reference fields, and shared-storage grouping cards to the ops-console data-reference map.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: 'DB 스키마, 권한 정책, 저장 API는 바꾸지 않았고, 현재 구현된 공용 저장/파일 참조 구조를 더 눈에 띄게 설명하는 운영 콘솔 화면만 보강했습니다.',
      en: 'Did not change DB schema, permission policy, or storage APIs; only made the existing shared-storage and file-reference structure clearer in the ops-console UI.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '설비 이력 관련 문서 수동 식별키 입력 제거',
      en: 'Removed attachment-key entry from equipment-history documents',
    },
    summary: {
      ko: '설비 이력 카드 작성 화면의 관련 문서 영역에서 수동 식별키 입력칸을 빼고, 문서명과 파일 첨부 + 버튼만 남겼습니다. 깨진 제거 라벨과 영어 안내 문구도 한국어로 정리했습니다.',
      en: 'Removed the manual attachment-key input from the equipment-history related-documents editor, leaving document title plus a file-attach button. Broken remove labels and English user-facing copy were also cleaned up in Korean.',
    },
    touched: [
      'data-entry/runtime/data/equipment-history',
      'kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check data-entry/runtime/data/equipment-history/*.js',
      'node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '설비 이력 본문 저장 키와 파일 저장 경로는 유지했습니다. 기존 수동 식별키 기반 옛 데이터는 문서명 fallback으로만 읽고, 새 작성/업로드 흐름에는 수동 식별키를 다시 저장하지 않습니다.',
      en: 'Kept the equipment-history payload key and file-storage path unchanged. Older attachment-key-only data is only read as a title fallback, while new authoring and upload flows no longer save a manual attachment key.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '오너 전용 런처 표시명을 운영 콘솔로 변경',
      en: 'Owner-only launcher label changed to Operations Console',
    },
    summary: {
      ko: '오너 로그인 시에만 보이는 팝업 런처의 표시명을 `운영 콘솔`로 바꿔, 실제로 열리는 운영 콘솔 이름과 맞췄습니다.',
      en: 'Renamed the owner-only popup launcher label to Operations Console so the label matches the actual ops console it opens.',
    },
    touched: [
      'kpi-runtime/sections/KPI.sections.owner.js',
      'kpi-runtime/internal-server/test/frontend/owner-popup-section.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'node --check kpi-runtime/sections/KPI.sections.owner.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test test/frontend/owner-popup-section.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '오너 권한 전용 노출 조건과 운영 콘솔 팝업 URL은 유지하고, 사용자에게 보이는 메뉴 이름만 바꿨습니다.',
      en: 'Kept the owner-only visibility and ops-console popup URL unchanged; only the user-facing menu label changed.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '데이터 참조 경로 거미줄 아키텍처 전환',
      en: 'Data-reference map changed to a clickable architecture web',
    },
    summary: {
      ko: '운영 콘솔의 데이터 참조 경로 화면을 긴 카드 나열 대신 중앙 KPI 데이터 허브, 저장소 축, 기능 노드가 연결된 거미줄형 아키텍처로 바꾸고, 기능 노드를 클릭하면 해당 데이터 흐름 상세가 오른쪽에 뜨도록 정리했습니다.',
      en: 'Changed the ops-console data-reference page from a long card list into a clickable web architecture with a central KPI data hub, storage axes, feature nodes, and a detail panel that updates per selected node.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test test/frontend/ops-console-data-reference.smoke.js',
      'npm run lint',
    ],
    boundary: {
      ko: '데이터 저장 경로 자체는 바꾸지 않고, 운영 콘솔의 시각화 방식과 클릭 상세 동작만 바꿨습니다.',
      en: 'Did not change any storage path; only changed the ops-console visualization and click-through detail behavior.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '운영 콘솔 데이터 참조 경로 항목 추가',
      en: 'Ops console data-reference map tab added',
    },
    summary: {
      ko: 'Repository Map 안에 더 넣지 않고, 운영 콘솔의 Repository Map 옆에 데이터 참조 경로 탭을 따로 추가해 조도, 법정 설비, 설비 이력, 작업내역, 유틸리티 데이터가 어떤 화면·API·DB·파일 저장소를 거치는지 한 화면에 정리했습니다.',
      en: 'Added a separate Data Reference Paths tab beside Repository Map in the ops console, documenting how lux audit, legal facility, equipment history, work history, and utility data flow through screens, APIs, DB records, and file storage.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/index.html',
      'commands/ops-console-app/ops-console/public/app.js',
      'commands/ops-console-app/ops-console/public/data-reference-map.html',
      'commands/ops-console-app/ops-console/public/data-reference-map.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/ops-console-data-reference.smoke.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/app.js commands/ops-console-app/ops-console/public/data-reference-map.js commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test test/frontend/ops-console-data-reference.smoke.js test/frontend/repository-map-architecture.smoke.js test/frontend/repository-map-surface-trim.smoke.js',
      'node --test test/routes/owner-repository-map-page.test.js',
      'npm run lint',
    ],
    boundary: {
      ko: '새 저장 경로나 DB 스키마는 만들지 않았고, 현재 구현된 데이터 흐름만 문서화했습니다. 월간 실적보고는 현재 팝업 진입점만 있고 저장 경로가 아직 없다는 상태를 명시했습니다.',
      en: 'No new storage path or DB schema was introduced; this documents only the current implemented data flows. Monthly Performance Report is explicitly marked as popup-only with no storage path yet.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '월간 실적보고 팝업 런처 분리',
      en: 'Separated monthly performance reporting into a popup launcher',
    },
    summary: {
      ko: '생산 본부 실적보고를 작업이력 보고서 검색/작성 화면으로 붙였던 연결을 제거하고, 월간 실적보고를 클릭하면 팀별 생산량·수율·노무비를 고르는 별도 팝업이 열리게 바꿨습니다.',
      en: 'Removed the incorrect work-history report workspace connection and changed Monthly Performance Report into a popup launcher with team selection for production, yield, and labor-cost reporting.',
    },
    touched: [
      'kpi-runtime/sections/KPI.sections.production-report.js',
      'kpi-runtime/sections/monthly-performance-report-popup.html',
      'kpi-runtime/sections/KPI.section.registry.js',
      'kpi-runtime/app/KPI.app.js',
      'team-report/runtime/work/KPI.work.runtime.js',
      'kpi-runtime/internal-server/test/frontend/production-report-section.smoke.js',
      'kpi-runtime/internal-server/test/frontend/work-history-layout-templates.smoke.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'node --check kpi-runtime/sections/KPI.sections.production-report.js team-report/runtime/work/KPI.work.runtime.js kpi-runtime/app/KPI.app.js',
      'node --test test/frontend/production-report-section.smoke.js test/frontend/work-history-layout-templates.smoke.js',
      'npm run lint',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '작업이력/작업내역 자체는 유지했고, 월간 실적보고가 work_history_records를 읽거나 저장하지 않도록 진입점만 분리했습니다. KPI-local 중첩 참고 clone은 더 이상 필요하지 않아 삭제했습니다.',
      en: 'Kept the work-history module itself intact and only separated the monthly performance entry point so it no longer reads or writes work_history_records. The nested KPI-local reference clone was removed because it is no longer needed.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '설비 이력과 법정 설비 파일 저장 경로 연결',
      en: 'Connected equipment-history and legal-facility file storage paths',
    },
    summary: {
      ko: '설비 이력 카드와 법정 설비 관리의 본문 데이터는 portal_data DB 레코드에 저장하고, 사진/첨부 파일은 app_documents와 KPI_STORAGE_ROOT/files 아래 설비명 폴더로 저장하도록 연결했습니다.',
      en: 'Stores equipment-history and legal-facility text payloads in portal_data records, while photos and attachments go through app_documents into equipment-name folders under KPI_STORAGE_ROOT/files.',
    },
    touched: [
      'KPI.html',
      'data-entry/runtime/data/equipment-history',
      'audit/runtime/audit/records/KPI.audit.records.legal.assets.js',
      'audit/runtime/audit/records/KPI.audit.records.legal.js',
      'audit/runtime/audit/records/KPI.audit.records.data.js',
      'kpi-runtime/internal-server/src/lib/permission-registry.js',
      'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
      'kpi-runtime/internal-server/src/routes/file-routes.js',
    ],
    verification: [
      'node --check equipment/audit storage scripts and server storage modules',
      'node --test test/lib/document-storage.test.js test/lib/portal-bootstrap.test.js',
      'node --test test/frontend/equipment-history-render.smoke.js test/frontend/audit-legal-form.smoke.js',
      'npm run lint',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '새 전용 테이블은 만들지 않았고, 텍스트 본문은 module record JSON으로 유지했습니다. 파일 바이트만 설비명 기반 폴더로 분리하며, 기존 work/history 저장 경로는 건드리지 않았습니다.',
      en: 'Did not add dedicated tables; text payloads remain module-record JSON. Only file bytes are separated into equipment-name folders, and existing work/history storage paths were left unchanged.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '작업 이력 기입 팀 카드 크기 축소',
      en: 'Reduced the work-history team card size',
    },
    summary: {
      ko: '작업 이력 기입 화면의 팀 선택 카드가 너무 크게 보이지 않도록 카드 높이, 패딩, 아이콘, 설명, 태그, 메트릭 여백만 줄였습니다.',
      en: 'Reduced only the team-selector card height, padding, icon, description, tag, and metric spacing on the work-history entry screen.',
    },
    touched: [
      'team-report/runtime/work/history/KPI.work.history.css',
    ],
    verification: [
      'git diff --check -- team-report/runtime/work/history/KPI.work.history.css',
      'npm run lint',
      'node --test test/frontend/work-history-layout-templates.smoke.js test/frontend/production-report-section.smoke.js',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '데이터 저장, 팀 전환, 검색, 보고서 작성 로직은 건드리지 않고 작업 이력 팀 카드의 시각적 밀도만 조정했습니다.',
      en: 'Changed only the visual density of the work-history team cards; data storage, tab switching, search, and report-writing behavior were left unchanged.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '생산 본부 실적보고를 더미 팝업 대신 실시간 보고 작업공간으로 흡수',
      en: 'Absorbed production-HQ reporting as a live workspace instead of a dummy popup',
    },
    summary: {
      ko: 'KPI-local의 preview.html 더미 시연을 다시 붙이지 않고, 현재 work_history_records 위에 생산 본부 실적보고 전용 workspace를 만들어 1팀 1파트부터 공무환경팀까지 실제 보고서를 작성하고 조회하게 바꿨습니다.',
      en: 'Skipped the old KPI-local preview.html demo and built a production-report workspace on top of live work_history_records so Team 1-A through the Utility/Environment team can write and review real reports.',
    },
    touched: [
      'KPI.html',
      'kpi-runtime/sections/KPI.sections.production-report.js',
      'kpi-runtime/sections/KPI.section.registry.js',
      'team-report/runtime/work/KPI.work.runtime.js',
      'team-report/runtime/work/history',
      'kpi-runtime/internal-server/test/frontend/work-history-layout-templates.smoke.js',
      'kpi-runtime/internal-server/test/frontend/production-report-section.smoke.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/work-history-layout-templates.smoke.js',
      'node --test test/frontend/production-report-section.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: 'KPI-local의 정적 preview.html과 더미 슬라이드 데이터는 가져오지 않았고, 현재 저장소의 작업이력 저장 구조와 첨부 규칙을 그대로 재사용하는 보고 전용 표면만 추가했습니다.',
      en: 'Did not import the KPI-local static preview.html or its dummy slide data; only added a report-specific surface that reuses the current repo work-history storage model and attachment rules.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: 'KPI-local 설비 이력 작성 화면 흡수',
      en: 'Absorbed the KPI-local equipment-history authoring flow',
    },
    summary: {
      ko: '설비 이력 더미 카드를 걷어내고, 설비 현황 보드와 설비 코드·관리팀·정비 이력·관련 문서를 직접 입력하는 작성 폼으로 data-entry 화면을 다시 묶었습니다.',
      en: 'Replaced the old dummy equipment card with a live equipment board plus an authoring form that captures equipment code, team, maintenance history, and related documents.',
    },
    touched: [
      'KPI.html',
      'data-entry/runtime/data/KPI.data.runtime.js',
      'data-entry/runtime/data/equipment-history',
      'data-entry/runtime/data/sections/KPI.sections.data.js',
      'kpi-runtime/app/styles/data/data.css',
      'kpi-runtime/demo/KPI.demo-data.js',
      'kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/equipment-history-render.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '기존 더미 설비 카드 내용은 제거했고, 실제 회사 설비 데이터나 첨부 파일은 반입하지 않은 채 로컬 작성 흐름과 화면 구조만 현재 저장소 스타일에 맞게 흡수했습니다.',
      en: 'Removed the old dummy equipment-card content and absorbed only the local authoring flow and UI structure, without importing real company equipment data or attachments.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: 'KPI-local 최신 작업이력 UI와 법정 설비 폼 흡수',
      en: 'Absorbed the latest KPI-local work-history UI and legal-facility form',
    },
    summary: {
      ko: 'KPI-local 최신본에서 승인된 범위만 가져와 작업이력 화면 헤더/스타일을 정리하고, 법정 설비 화면에는 등록 폼·관리번호·첨부 파일 흐름을 추가했습니다.',
      en: 'Pulled only the approved scope from the latest KPI-local clone: refreshed the work-history header and styling, then added the legal-facility registration form plus management-number and attachment-file flow.',
    },
    touched: [
      'team-report/runtime/work/history/KPI.work.history.css',
      'team-report/runtime/work/history/KPI.work.history.view.layout.js',
      'team-report/runtime/work/history/layout/templates.js',
      'audit/runtime/audit/records/KPI.audit.records.legal.js',
      'kpi-runtime/app/styles/audit/audit.css',
      'kpi-runtime/internal-server/test/frontend/work-history-layout-templates.smoke.js',
      'kpi-runtime/internal-server/test/frontend/audit-legal-form.smoke.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/work-history-layout-templates.smoke.js',
      'node --test test/frontend/audit-legal-form.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '작업이력 UI와 법정 설비 폼만 흡수했고, KPI-local의 생산보고 팝업과 설비 이력 작성 화면 묶음은 이번 패치에서 들여오지 않았습니다.',
      en: 'Absorbed only the work-history UI and the legal-facility form; the KPI-local production-report popup and the equipment-history authoring bundle were intentionally left out of this patch.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 검색 범위 보조 추가',
      en: 'Repository Map search scope helpers added',
    },
    summary: {
      ko: 'area/path/file/history/recent/status prefix와 하위 파일·경로 포함 토글을 추가해, 기본 검색은 얕게 유지하고 필요할 때만 깊게 좁힐 수 있게 했습니다.',
      en: 'Added area/path/file/history/recent/status prefixes plus an include-descendants toggle so the default search stays shallow and only narrows deeply when requested.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/repository-map-architecture.smoke.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/repository-map-architecture.smoke.js',
      'node --test test/routes/owner-repository-map-page.test.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실시간 트리와 패치 이력 구조는 그대로 두고, 검색 입력 해석과 아키텍처 매칭 범위만 더 구체적으로 제어할 수 있게 바꿨습니다.',
      en: 'Kept the live-tree and patch-history structures intact and only made the search parsing plus architecture match range more explicit and controllable.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '우측 패널 개별 접기/펼치기 추가',
      en: 'Side panels now collapse independently',
    },
    summary: {
      ko: '최근 수정, 안전 경계, 패치 이력을 각각 독립적으로 접고 펼칠 수 있게 바꾸고, 패치 이력 카드는 원하는 기록만 열어볼 수 있게 정리했습니다.',
      en: 'Made recent changes, safety boundary, and patch history collapse independently, and changed patch-history cards so only the selected records need to be opened.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/repository-map-surface-trim.smoke.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/repository-map-surface-trim.smoke.js',
      'node --test test/routes/owner-repository-map-page.test.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실시간 트리와 상단 아키텍처 검색 구조는 유지하고, 우측 보조 패널과 패치 이력 카드의 기본 노출 방식만 접힘 형태로 바꿨습니다.',
      en: 'Kept the live tree and top architecture-search structure intact and only changed the default disclosure behavior of the right-side support panels and patch-history cards.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '아키텍처 목록 묶음 접기/펼치기 추가',
      en: 'Architecture surface now collapses as a group',
    },
    summary: {
      ko: '검색창은 위에 따로 두고, 그 아래의 아키텍처와 검색 결과 묶음 전체를 한 번에 접고 펼칠 수 있게 정리했습니다.',
      en: 'Kept the search input separate at the top and made the architecture plus search-results surface collapsible as one group below it.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/repository-map-architecture.smoke.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/repository-map-architecture.smoke.js',
      'node --test test/routes/owner-repository-map-page.test.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '검색 입력창은 독립된 채로 두고, 아키텍처 카드와 실시간 트리 데이터 구조는 유지한 채 상단 노출 묶음의 접힘 동작만 추가했습니다.',
      en: 'Left the search input independent and kept the architecture-card and live-tree data structure intact while only adding collapse behavior to the top surface.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 보조 패널 정리',
      en: 'Repository Map auxiliary panels trimmed',
    },
    summary: {
      ko: '구조도와 최근 변경, 안전 경계, 패치 이력은 남기고 우측의 핵심 자료와 저장 규칙 패널은 제거해 스크롤 길이를 줄였습니다.',
      en: 'Kept the architecture, recent changes, safety boundary, and patch history while removing the side key-materials and storage-rules panels to shorten the page.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/repository-map-surface-trim.smoke.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/repository-map-surface-trim.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '구조도와 실시간 트리 데이터는 그대로 두고, 스크롤만 길게 만드는 보조 설명 패널만 화면에서 걷어냈습니다.',
      en: 'Kept the architecture and live tree data intact and removed only the auxiliary explanation panels that were stretching the page.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '아키텍처 카드 기본 접힘 동작 추가',
      en: 'Architecture cards now start collapsed',
    },
    summary: {
      ko: 'Repository Map 아키텍처 카드가 처음부터 전부 펼쳐져 보이지 않도록 카드별 열기/닫기 동작을 추가하고, 기본 상태를 접힘으로 바꿨습니다.',
      en: 'Added per-card expand and collapse behavior to the Repository Map architecture cards and changed the default state to collapsed.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/frontend/repository-map-architecture.smoke.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/repository-map-architecture.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실시간 트리와 상위 구조 데이터는 그대로 두고, 아키텍처 카드의 기본 노출 방식만 접힘 상태로 줄였습니다.',
      en: 'Kept the live tree and structure data intact and only reduced the default visual exposure of the architecture cards.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 하위파일 스냅샷 패널 제거',
      en: 'Repository Map descendant-file snapshot panel removed',
    },
    summary: {
      ko: '위쪽 실시간 구조와 아키텍처 화면은 유지한 채, 전체 하위파일 스냅샷/매니페스트 패널만 화면에서 제거했습니다.',
      en: 'Kept the live structure and architecture views while removing only the descendant-file snapshot and manifest panel from the screen.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'node --test test/routes/owner-repository-map-page.test.js',
      'npm run lint',
      'node --test',
    ],
    boundary: {
      ko: '실시간 트리, 아키텍처, 핵심 자료, 패치 이력, owner 전용 라우트는 유지하고 스냅샷 패널만 뺐습니다.',
      en: 'Kept the live tree, architecture, core materials, patch history, and owner-only route, and removed only the snapshot panel.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '운영 콘솔 팝업 목차만 복구',
      en: 'Ops console popup launcher restored without demos',
    },
    summary: {
      ko: 'KPI 메인 UI에서 오너 시연 화면은 계속 제거한 채, 오너 로그인 시에만 보이는 얇은 운영 콘솔 목차를 복구해 클릭하면 운영 콘솔 `#server` 탭이 팝업으로 열리도록 정리했습니다.',
      en: 'Kept the owner demo screens removed from the KPI main UI while restoring a thin owner-only launcher that opens the ops console `#server` tab in a popup.',
    },
    touched: [
      'KPI.html',
      'kpi-runtime/sections/KPI.sections.owner.js',
      'kpi-runtime/internal-server/test/frontend/owner-popup-section.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/frontend/owner-popup-section.smoke.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '인라인 오너 시연 화면과 데모 마크업은 되살리지 않았고, 오너 권한일 때만 보이는 팝업 런처만 다시 연결했습니다.',
      en: 'Did not revive any inline owner demo screens or demo markup; only reconnected the owner-only popup launcher.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: 'KPI 메인 UI의 오너 시연 섹션 제거',
      en: 'Owner demo section removed from the KPI main UI',
    },
    summary: {
      ko: 'KPI 메인 화면에서 오너 시연 섹션 로드와 전용 브라우저 검증을 제거해, 더 이상 owner 서버·계정·Repository Map 시연 화면이 KPI 안에서 노출되지 않도록 정리했습니다.',
      en: 'Removed the owner demo section load and its dedicated browser checks from the KPI main surface so the owner server, account, and Repository Map demo screens no longer appear inside KPI.',
    },
    touched: [
      'KPI.html',
      'kpi-runtime/sections/KPI.sections.owner.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
      'kpi-runtime/internal-server/test/frontend/owner-section-demo.smoke.js',
      'kpi-runtime/internal-server/test/frontend/owner-demo-navigation.smoke.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'npm run lint',
      'node --test test/routes/owner-repository-map-page.test.js',
      'node --test',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '오너 권한 검사와 /owner/repository-map 라우트 자체는 유지하고, KPI 메인 앱 안에서 보이던 시연 섹션과 그 전용 테스트만 제거했습니다.',
      en: 'Kept the owner authorization checks and the /owner/repository-map route itself, while removing only the demo section and its dedicated tests from the KPI main app.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 스냅샷/매니페스트 화면 복구',
      en: 'Repository Map snapshot and manifest view restored',
    },
    summary: {
      ko: 'handoff 폴더의 snapshot/manifest 기준처럼 보이도록 검색과 전체 아키텍처 화면은 유지하면서, 안전 범위 안의 전체 하위 파일을 경로순으로 길게 보여주는 스냅샷 패널로 다시 맞췄습니다.',
      en: 'Restored the handoff-like snapshot and manifest feel by keeping repository search and the wide architecture view while switching the descendant-file surface back to a long path-ordered snapshot list.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '지우라고 한 경로는 건드리지 않았고, 숨김 제외 규칙과 owner 전용 경로, 로컬 포트 계약은 그대로 유지한 채 리포지토리맵 표면만 다시 두껍게 만들었습니다.',
      en: 'Did not delete any additional paths; only restored the Repository Map surface density while keeping the hidden-exclusion rules, owner-only route, and local port contract intact.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리 검색과 전체 아키텍처 화면 추가',
      en: 'Repository search and full-width architecture view added',
    },
    summary: {
      ko: '영역별 모든 하위 파일 패널을 걷어내고, 기능·파일·최근 패치 이력까지 함께 찾는 검색 결과 패널과 전체폭 아키텍처 화면으로 리포지토리맵을 재구성했습니다.',
      en: 'Removed the descendant-file inventory panel and rebuilt the map around repository search plus a full-width architecture screen that searches features, files, and recent patch history together.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'node --check commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실시간 스캐너, owner 전용 경로, 숨김 경계, 로컬 포트 계약은 그대로 두고 화면 정보 구조와 검색 경험만 바꿨습니다.',
      en: 'Kept the live scanner, owner-only route, hidden boundary, and local port contract intact while changing only the information layout and search experience.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 자료 밀도 보강',
      en: 'Repository Map density increased with grouped inventory',
    },
    summary: {
      ko: 'handoff manifest 기준을 참고해서 모든 하위 파일을 상위 영역별로 다시 묶어 보여주고, 파일별 line count와 더 넓은 핵심 자료 목록을 함께 보이도록 바꿨습니다.',
      en: 'Using the handoff manifest as a reference, regrouped all descendant files by top-level area and added per-file line counts plus a broader core-material list.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/src/services/repository-map.js',
      'kpi-runtime/internal-server/test/services/repository-map.test.js',
    ],
    verification: [
      'git diff --check',
      'node --check commands/ops-console-app/ops-console/public/repository-map.js',
      'node --test kpi-runtime/internal-server/test/services/repository-map.test.js',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실시간 맵 범위만 촘촘하게 늘렸고, KPI-local 참조본과 숨김 제외 규칙, 포트 계약은 그대로 유지했습니다.',
      en: 'Only increased the density of the live map surface while keeping the KPI-local reference boundary, hidden exclusions, and port contract unchanged.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '리포지토리맵 중심 기록 화면 확장',
      en: 'Repository Map expanded as the primary record surface',
    },
    summary: {
      ko: '트리만 보여주던 화면에 아키텍처 개요, 핵심 자료, 저장 규칙, 구조화된 패치 이력을 추가해서 이 화면 하나에서 저장소 설명과 변경 기록을 읽게 만들었습니다.',
      en: 'Expanded the screen beyond the raw tree by adding architecture coverage, key materials, storage rules, and structured patch records so the repository explanation and change history live in one place.',
    },
    touched: [
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
      'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
    ],
    verification: [
      'node --test kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: 'KPI-local/ 참조 로컬본은 그대로 gitignored 상태로 두었고, 새 markdown 기록 문서는 다시 만들지 않았으며, 포트 계약도 바꾸지 않았습니다.',
      en: 'Left the KPI-local/ reference clone gitignored, did not recreate separate markdown patch docs, and kept the existing port contract unchanged.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: 'Repository Map 기록 일원화와 참조 로컬본 경계 정리',
      en: 'Repository Map history unified with a bounded reference clone',
    },
    summary: {
      ko: 'patch.md와 비전공자용.md 흐름을 정리하고, 사용자에게 보여줄 변경 이력을 Repository Map으로 모으는 방향으로 저장소 기준을 맞췄습니다.',
      en: 'Aligned the repository so user-facing change history moves into Repository Map instead of continuing separate patch-log markdown flows.',
    },
    touched: [
      'AGENTS.md',
      '.gitignore',
      'kpi-runtime/internal-server/src/services/repository-map.js',
      'kpi-runtime/internal-server/test/services/repository-map.test.js',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: [
      'git diff --check',
      'npm run format:check',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '중첩 참조 로컬본 KPI-local/은 부모 Git 추적과 실시간 맵 양쪽에서 제외했고, 로컬 포트 계약 3100 / 3192 / 5434는 그대로 유지했습니다.',
      en: 'Kept the nested KPI-local/ reference clone outside both parent Git tracking and the live map, while preserving the 3100 / 3192 / 5434 local port contract.',
    },
  },
  {
    date: '2026-04-29',
    title: {
      ko: '법정 설비와 설비 이력 카드 화면 흡수',
      en: 'Legal facility and equipment card views absorbed',
    },
    summary: {
      ko: 'KPI-local 참조본의 법정 설비 관리와 설비 이력 카드 형식을 현재 저장소 구조에 맞는 본문형 화면으로 옮기고 데모 fixture 기반으로 붙였습니다.',
      en: 'Moved the KPI-local legal facility and equipment history views into the current repository as inline screens backed by demo fixtures.',
    },
    touched: [
      'KPI.html',
      'data-entry/runtime/data',
      'audit/runtime/audit/sections',
      'audit/runtime/audit/records',
      'kpi-runtime/app/styles',
      'kpi-runtime/demo',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    verification: [
      'git diff --check',
      'npm run format:check',
      'npm run lint',
      'npm run verify',
      'KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser',
    ],
    boundary: {
      ko: '실제 운영 데이터나 개인정보는 반입하지 않았고, KPI-local 자체 저장소를 수정하지 않았습니다.',
      en: 'No production or private data was imported, and the KPI-local repository itself was not modified.',
    },
  },
  {
    date: '2026-04-28',
    title: {
      ko: 'Repository Map demo 방식 맞춤',
      en: 'Repository Map demo parity controls',
    },
    summary: {
      ko: '실시간 트리에 수정 시각과 용도 표시를 붙이고, 맵 조작을 전체 펼치기와 전체 접기로 단순화했습니다.',
      en: 'Added modified timestamps and short purpose labels to the live tree while simplifying controls to expand-all and collapse-all.',
    },
    touched: [
      'AGENTS.md',
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: ['manual ops console review'],
    boundary: {
      ko: '시연용 조작 개선만 했고 저장소 구조나 포트 계약은 바꾸지 않았습니다.',
      en: 'This only adjusted the operator-facing interaction surface and did not change the repository structure or port contract.',
    },
  },
  {
    date: '2026-04-28',
    title: {
      ko: 'Repository Map 전체 트리 전환',
      en: 'Repository Map full tree view',
    },
    summary: {
      ko: 'operations console이 내부 스캐너를 호출해서 실제 저장소의 폴더와 파일을 전체 트리로 보여주도록 바꿨습니다.',
      en: 'Switched the operations console to render the actual repository folders and files as a full tree from the internal scanner.',
    },
    touched: [
      'commands/ops-console-app/ops-console/server.mjs',
      'commands/ops-console-app/ops-console/public/repository-map.html',
      'commands/ops-console-app/ops-console/public/repository-map.js',
    ],
    verification: ['manual ops console review'],
    boundary: {
      ko: '실제 파일 스캔을 하되 비밀정보, 첨부파일, work-log 내용은 제외하는 경계를 유지했습니다.',
      en: 'Kept the live scan bounded so secrets, attachments, and private work-log contents stay excluded.',
    },
  },
];

const repositoryPolicies = [
  {
    tone: 'blue',
    title: {
      ko: '패치 기록은 여기 저장',
      en: 'Store patch records here',
    },
    body: {
      ko: '사용자에게 보여줄 패치 요약, 영향 경로, 검증 결과는 이제 별도 markdown 대신 Repository Map change history 카드에 둡니다.',
      en: 'User-facing patch summaries, touched paths, and verification notes now live in Repository Map change-history cards instead of separate markdown files.',
    },
    chips: ['Change History', 'Architecture Overview', 'Key Materials'],
  },
  {
    tone: 'green',
    title: {
      ko: '참조 clone은 작업 후 제거',
      en: 'Remove reference clones after absorption',
    },
    body: {
      ko: 'KPI-local/ 같은 중첩 참고 clone은 필요한 흡수 작업이 끝나면 루트 작업공간에 남겨두지 않습니다.',
      en: 'Nested reference clones such as KPI-local/ should not remain in the root workspace after the needed absorption work is complete.',
    },
    chips: ['temporary clone', 'absorb then delete', 'no parent-git impact'],
  },
  {
    tone: 'amber',
    title: {
      ko: '포트 계약 유지',
      en: 'Keep the port contract',
    },
    body: {
      ko: 'KPI 로컬 계약은 운영 3100, 검증 3192, DB 5434입니다. 브라우저 확인이 필요하면 3192를 재사용합니다.',
      en: 'The local KPI contract remains runtime 3100, verification 3192, and DB 5434. Reuse 3192 when browser verification is needed.',
    },
    chips: ['3100', '3192', '5434'],
  },
  {
    tone: 'rose',
    title: {
      ko: '숨김 범위는 유지',
      en: 'Keep the hidden boundary',
    },
    body: {
      ko: 'coverage를 넓혀도 env, dump, private work-log 내용, 첨부파일/바이너리는 실시간 트리에서 계속 숨깁니다.',
      en: 'Even with broader coverage, env files, dumps, private work-log contents, and attachment or binary files stay hidden from the live tree.',
    },
    chips: ['.env', '*.dump', 'work-log', '*.xlsx/*.pdf'],
  },
];

const keyMaterialSpecs = [
  { path: 'AGENTS.md', tone: 'slate' },
  { path: 'KPI.html', tone: 'blue' },
  { path: 'commands/open-ops-console.cmd', tone: 'violet' },
  { path: 'commands/close-ops-console.cmd', tone: 'violet' },
  { path: 'commands/ops-console-app/scripts/start-ops-console.ps1', tone: 'violet' },
  { path: 'commands/ops-console-app/scripts/stop-ops-console.ps1', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/server.mjs', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/lib/paths.mjs', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/lib/ops-service.mjs', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/public/index.html', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/public/app.js', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/public/styles.css', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/public/repository-map.html', tone: 'violet' },
  { path: 'commands/ops-console-app/ops-console/public/repository-map.js', tone: 'violet' },
  { path: 'kpi-runtime/internal-server/src/config.js', tone: 'blue' },
  { path: 'kpi-runtime/internal-server/src/request-router.js', tone: 'blue' },
  { path: 'kpi-runtime/internal-server/src/routes/owner-routes.js', tone: 'blue' },
  { path: 'kpi-runtime/internal-server/src/lib/owner-repository-map-page.js', tone: 'blue' },
  { path: 'kpi-runtime/internal-server/src/services/repository-map.js', tone: 'blue' },
  { path: 'kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js', tone: 'green' },
  { path: 'kpi-runtime/internal-server/test/services/repository-map.test.js', tone: 'green' },
];

const allowedTones = new Set(['blue', 'green', 'violet', 'amber', 'rose', 'cyan', 'slate']);
const searchScopeKeys = ['area', 'path', 'file', 'history', 'recent', 'status'];
const searchScopeAliases = {
  area: 'area',
  '영역': 'area',
  path: 'path',
  '경로': 'path',
  file: 'file',
  '파일': 'file',
  history: 'history',
  '이력': 'history',
  recent: 'recent',
  '최근': 'recent',
  status: 'status',
  '상태': 'status',
};
const state = {
  language: 'ko',
  map: null,
  query: '',
  endpoint: '',
  includeDescendants: false,
  parsedQuery: null,
};

const fallbackRepositoryTree = {
  name: 'KPI-Server',
  path: '',
  type: 'directory',
  tone: 'blue',
  label: 'fallback',
  desc: 'safe built-in tree shown when the live repository API is unavailable',
  children: [
    { name: 'AGENTS.md', path: 'AGENTS.md', type: 'file', tone: 'slate', label: 'rules', children: [] },
    { name: 'KPI.html', path: 'KPI.html', type: 'file', tone: 'blue', label: 'main shell', children: [] },
    { name: 'kpi-runtime', path: 'kpi-runtime', type: 'directory', tone: 'blue', label: 'runtime', children: [] },
    { name: 'commands', path: 'commands', type: 'directory', tone: 'violet', label: 'ops console', children: [] },
    { name: 'utility', path: 'utility', type: 'directory', tone: 'amber', label: 'utility', children: [] },
    { name: 'team-report', path: 'team-report', type: 'directory', tone: 'rose', label: 'work', children: [] },
    { name: 'audit', path: 'audit', type: 'directory', tone: 'cyan', label: 'audit', children: [] },
  ],
};

function buildFallbackRepositoryMap() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    repoRoot: 'KPI-Server',
    rootPath: 'live API unavailable; fallback excludes temporary reference clones',
    maxDepth: 0,
    tree: fallbackRepositoryTree,
    recent: [],
    totals: { directories: 6, files: 2, dirty: 0, recent: 0 },
    git: { available: false, disabled: true, error: 'repository_map_api_unavailable', dirtyCount: 0 },
  };
}

function t(key, values = {}) {
  const template = messages[state.language][key] || messages.ko[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function pickText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[state.language] || value.ko || value.en || '';
}

function collectText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return [value.ko, value.en].filter(Boolean).join(' ');
}

function normalizePath(value = '') {
  return String(value || '').replaceAll('\\', '/').replace(/^\/+/, '');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateTime(value = '') {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat(state.language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatSize(bytes = 0) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatCount(value = 0) {
  return new Intl.NumberFormat(state.language === 'ko' ? 'ko-KR' : 'en-US').format(Number(value) || 0);
}

function formatRecentLabel(label = '') {
  if (label === 'last hour') return t('recentLastHour');
  if (label === 'today') return t('recentToday');
  if (label === 'this week') return t('recentThisWeek');
  return label;
}

function safeTone(nodeOrTone) {
  const tone = typeof nodeOrTone === 'string' ? nodeOrTone : nodeOrTone?.tone;
  return allowedTones.has(tone) ? tone : 'slate';
}

function createEmptyParsedQuery() {
  return {
    free: [],
    scoped: Object.fromEntries(searchScopeKeys.map((scope) => [scope, []])),
  };
}

function updateParsedQuery() {
  const parsed = createEmptyParsedQuery();
  const tokens = String(state.query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const scopedMatch = token.match(/^([^:\s]+):(.*)$/);
    if (!scopedMatch) {
      parsed.free.push(token);
      continue;
    }

    const scopeKey = searchScopeAliases[scopedMatch[1]];
    const scopeValue = String(scopedMatch[2] || '').trim();
    if (!scopeKey || !scopeValue) {
      parsed.free.push(token);
      continue;
    }

    parsed.scoped[scopeKey].push(scopeValue);
  }

  state.parsedQuery = parsed;
}

function getParsedQuery() {
  if (!state.parsedQuery) updateParsedQuery();
  return state.parsedQuery;
}

function getQueryTerms() {
  return getParsedQuery().free;
}

function hasActiveQuery() {
  const parsed = getParsedQuery();
  return parsed.free.length > 0 || searchScopeKeys.some((scope) => parsed.scoped[scope].length > 0);
}

function collectSearchHaystack(values = []) {
  return values
    .flat(Infinity)
    .map((value) => collectText(value))
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesTerms(terms, values = []) {
  if (!terms.length) return true;
  const haystack = collectSearchHaystack(values);
  return terms.every((term) => haystack.includes(term));
}

function matchesQueryText(...values) {
  return matchesTerms(getQueryTerms(), values);
}

function matchesSearchFilters({ free = [], scopes = {}, strictScopes = false } = {}) {
  const parsed = getParsedQuery();
  if (!matchesTerms(parsed.free, free)) return false;

  let hasRelevantScopedTerms = false;
  for (const scope of searchScopeKeys) {
    if (!(scope in scopes)) continue;
    if (!parsed.scoped[scope].length) continue;
    hasRelevantScopedTerms = true;
    if (!matchesTerms(parsed.scoped[scope], scopes[scope])) return false;
  }

  if (strictScopes && !parsed.free.length) {
    const hasAnyScopedTerms = searchScopeKeys.some((scope) => parsed.scoped[scope].length > 0);
    if (hasAnyScopedTerms && !hasRelevantScopedTerms) return false;
  }

  return true;
}

function getPathSegments(pathValue = '') {
  return normalizePath(pathValue).split('/').filter(Boolean);
}

function getPathBasename(pathValue = '') {
  const segments = getPathSegments(pathValue);
  return segments.at(-1) || normalizePath(pathValue);
}

function buildAreaValuesFromPath(pathValue = '') {
  const segments = getPathSegments(pathValue);
  if (!segments.length) return [];
  const values = [];
  for (let index = 0; index < segments.length; index += 1) {
    values.push(segments[index]);
    values.push(segments.slice(0, index + 1).join('/'));
  }
  return [...new Set(values)];
}

function nodeMatchesSearch(node, options = {}) {
  return matchesSearchFilters({
    free: [node.name, node.path, node.label, node.desc, node.status, describePurpose(node)],
    scopes: {
      area: buildAreaValuesFromPath(node.path || node.name || ''),
      path: [node.path || node.name || ''],
      file: node.type === 'file' ? [node.name, node.path] : [],
      recent: [node.recentLabel || '', node.updatedAt || ''],
      status: [node.status || ''],
    },
    strictScopes: options.strictScopes === true,
  });
}

function nodeIsVisible(node, options = {}) {
  const selfMatches = nodeMatchesSearch(node, options);
  return selfMatches || (node.children || []).some((child) => nodeIsVisible(child, options));
}

function flattenTree(node, output = []) {
  if (!node) return output;
  output.push(node);
  for (const child of node.children || []) flattenTree(child, output);
  return output;
}

function buildNodeIndex(tree) {
  const nodes = flattenTree(tree, []);
  return new Map(nodes.map((node) => [normalizePath(node.path || node.name), node]));
}

function getVisibleFiles(options = {}) {
  return flattenTree(state.map?.tree, [])
    .filter((node) => node.type === 'file' && nodeIsVisible(node, options))
    .sort((left, right) => String(left.path || '').localeCompare(String(right.path || ''), 'en'));
}

function describePurpose(node) {
  const path = normalizePath(node.path || node.name || '');
  const name = String(node.name || '').toLowerCase();
  const lowerPath = path.toLowerCase();
  if (name === 'agents.md') return t('purposeAgentRules');
  if (name === 'kpi.html') return t('purposeMainShell');
  if (name === 'readme.md') return t('purposeReadme');
  if (name === '.gitignore' || name === '.gitattributes') return t('purposeIgnore');
  if (name === 'package.json') return t('purposePackage');
  if (name === 'package-lock.json') return t('purposeLock');
  if (name === 'repository-map.html') return t('purposeMapScreen');
  if (name === 'repository-map.js' && lowerPath.includes('ops-console/public/')) return t('purposeMapLogic');
  if (name === 'server.mjs') return t('purposeOpsServer');
  if (name === 'app.js') return t('purposeConsoleLogic');
  if (lowerPath.includes('/e2e/')) return t('purposeBrowserTest');
  if (lowerPath.includes('/test/') || name.includes('.test.') || name.includes('.smoke.')) return t('purposeTest');
  if (lowerPath.includes('/migrations/')) return t('purposeMigration');
  if (lowerPath.includes('/routes/')) return t('purposeRoute');
  if (lowerPath.includes('/services/')) return t('purposeService');
  if (lowerPath.includes('/repositories/')) return t('purposeRepository');
  if (lowerPath.includes('/sections/')) return t('purposeSection');
  if (lowerPath.includes('/demo/')) return t('purposeDemoData');
  if (lowerPath.startsWith('shared-assets/')) return t('purposeAsset');
  if (lowerPath.includes('/styles/') || name.endsWith('.css')) return t('purposeStyle');
  if (name.endsWith('.cmd')) return t('purposeCommand');
  if (name.endsWith('.ps1')) return t('purposePowerShell');
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return t('purposeWorkflow');
  if (name.endsWith('.json')) return t('purposeConfig');
  if (name.endsWith('.svg')) return t('purposeAsset');
  if (name.endsWith('.md')) return t('purposeDocument');
  if (name.endsWith('.html')) return t('purposeHtml');
  if (name.endsWith('.js') || name.endsWith('.mjs')) return t('purposeScript');
  if (node.desc) return node.desc;
  return '';
}

function metaBadges(node) {
  const badges = [`<span class="badge">${node.type === 'directory' ? t('directoryType') : t('fileType')}</span>`];
  if (node.updatedAt) badges.push(`<span class="badge updated">${escapeHtml(t('updated'))} ${escapeHtml(formatDateTime(node.updatedAt))}</span>`);
  if (node.label) badges.push(`<span class="badge">${escapeHtml(node.label)}</span>`);
  if (node.status) badges.push(`<span class="badge status">${escapeHtml(node.status)}</span>`);
  if (node.recentLabel) badges.push(`<span class="badge">${escapeHtml(formatRecentLabel(node.recentLabel))}</span>`);
  const sizeLabel = formatSize(node.size);
  if (sizeLabel) badges.push(`<span class="badge">${escapeHtml(sizeLabel)}</span>`);
  return badges.join('');
}

function renderNodeRow(node, depth) {
  const isDirectory = node.type === 'directory';
  const name = node.path ? node.name : state.map?.repoRoot || node.name;
  const pathLabel = node.path || t('rootPath');
  const glyph = isDirectory ? (depth === 0 ? '/' : '+') : '-';
  const purpose = describePurpose(node);
  const purposeHtml = purpose ? `<span class="node-purpose">${escapeHtml(purpose)}</span>` : '';
  return `
    <div class="node-row">
      <span class="node-glyph">${glyph}</span>
      <span class="node-main">
        <span class="node-name-line">
          <span class="node-name">${escapeHtml(name)}</span>
          ${purposeHtml}
        </span>
        <span class="node-path">${escapeHtml(pathLabel)}</span>
      </span>
      <span class="node-meta">${metaBadges(node)}</span>
    </div>
  `;
}

function renderNode(node, depth = 0) {
  if (!nodeIsVisible(node)) return '';
  const tone = safeTone(node);
  const children = (node.children || []).filter(nodeIsVisible);
  if (node.type !== 'directory') return `<div class="tree-node ${tone} leaf">${renderNodeRow(node, depth)}</div>`;

  const childHtml = children.map((child) => renderNode(child, depth + 1)).join('');
  return `
    <details class="tree-node ${tone}" open>
      <summary>${renderNodeRow(node, depth)}</summary>
      <div class="children">${childHtml}</div>
    </details>
  `;
}

function getFilteredRecentNodes() {
  return (state.map?.recent || []).filter((node) => matchesSearchFilters({
    free: [
      node.name,
      node.path,
      node.status,
      node.recentLabel,
      node.label,
      node.desc,
      describePurpose(node),
    ],
    scopes: {
      area: buildAreaValuesFromPath(node.path || node.name || ''),
      path: [node.path || node.name || ''],
      file: [node.name, node.path],
      recent: [node.recentLabel || '', node.updatedAt || ''],
      status: [node.status || ''],
    },
    strictScopes: true,
  }));
}

function historyEntryMatchesSearch(entry) {
  const touchedPaths = entry.touched || [];
  return matchesSearchFilters({
    free: [
      entry.date,
      entry.title,
      entry.summary,
      entry.boundary,
      touchedPaths,
      entry.verification || [],
    ],
    scopes: {
      area: touchedPaths.flatMap((pathValue) => buildAreaValuesFromPath(pathValue)),
      path: touchedPaths,
      file: touchedPaths.map((pathValue) => getPathBasename(pathValue)),
      history: [entry.title, entry.summary, entry.boundary, entry.verification || []],
      recent: [entry.date],
    },
    strictScopes: true,
  });
}

function getFilteredHistoryEntries() {
  return historyEntries.filter(historyEntryMatchesSearch);
}

function buildArchitectureCards() {
  return (state.map?.tree?.children || [])
    .map((node) => {
      const stats = collectBranchStats(node);
      const summary = node.desc || describePurpose(node) || '';
      const preview = (node.children || []).slice(0, 6).map((child) => ({
        name: child.name,
        path: child.path || child.name,
      }));
      const descendants = flattenTree(node, []).slice(1);
      const descendantText = descendants.map((child) => `${child.name} ${child.path || ''} ${child.desc || ''} ${describePurpose(child)}`);
      const descendantPaths = descendants.map((child) => child.path || child.name || '');
      const descendantFiles = descendants
        .filter((child) => child.type === 'file')
        .map((child) => child.name);
      const descendantRecent = descendants.map((child) => child.recentLabel || '');
      const descendantStatus = descendants.map((child) => child.status || '');
      const previewText = preview.map((item) => `${item.name} ${item.path}`);
      return {
        node,
        stats,
        summary,
        preview,
        tone: safeTone(node),
        matches: matchesSearchFilters({
          free: [
            node.name,
            node.path,
            summary,
            previewText,
            state.includeDescendants ? descendantText : [],
          ],
          scopes: {
            area: [node.name, node.path],
            path: [node.path || node.name || '', preview.map((item) => item.path), state.includeDescendants ? descendantPaths : []],
            file: [preview.map((item) => item.name), state.includeDescendants ? descendantFiles : []],
            recent: [node.recentLabel || '', state.includeDescendants ? descendantRecent : []],
            status: [node.status || '', state.includeDescendants ? descendantStatus : []],
          },
          strictScopes: true,
        }),
      };
    })
    .filter((card) => card.matches);
}

function buildSearchGroups() {
  if (!hasActiveQuery()) return [];

  const architectureCards = buildArchitectureCards().map((card) => ({
    kind: t('searchKindArchitecture'),
    title: card.node.name,
    path: card.node.path || t('rootPath'),
    summary: card.summary,
    chips: [
      `${t('metricDirectories')} ${formatCount(card.stats.directories)}`,
      `${t('metricFiles')} ${formatCount(card.stats.files)}`,
      ...card.preview.slice(0, 3).map((item) => item.name),
    ],
    tone: card.tone,
  }));

  const fileCards = getVisibleFiles({ strictScopes: true }).map((node) => ({
    kind: t('searchKindFile'),
    title: node.name,
    path: node.path || node.name,
    summary: describePurpose(node) || node.desc || '',
    chips: [
      node.status || '',
      formatRecentLabel(node.recentLabel || ''),
      node.lines !== null && node.lines !== undefined ? `${t('inventoryLinesLabel')} ${formatCount(node.lines)}` : '',
      node.updatedAt ? formatDateTime(node.updatedAt) : '',
    ].filter(Boolean),
    tone: safeTone(node),
  }));

  const recentCards = getFilteredRecentNodes().map((node) => ({
    kind: t('searchKindRecent'),
    title: node.path || node.name,
    path: node.updatedAt ? formatDateTime(node.updatedAt) : '',
    summary: describePurpose(node) || node.desc || '',
    chips: [node.status || '', formatRecentLabel(node.recentLabel || '')].filter(Boolean),
    tone: safeTone(node),
  }));

  const historyCards = getFilteredHistoryEntries().map((entry) => ({
    kind: t('searchKindHistory'),
    title: pickText(entry.title),
    path: entry.date,
    summary: pickText(entry.summary),
    chips: [
      ...(entry.touched || []).slice(0, 3),
      `${t('historyVerificationLabel')} ${(entry.verification || []).length}`,
    ],
    tone: 'amber',
  }));

  const buildGroup = (title, entries, limit = 6) => {
    if (!entries.length) return null;
    return {
      title,
      total: entries.length,
      items: entries.slice(0, limit),
    };
  };

  return [
    buildGroup(t('searchGroupArchitecture'), architectureCards, 6),
    buildGroup(t('searchGroupFiles'), fileCards, 8),
    buildGroup(t('searchGroupRecent'), recentCards, 6),
    buildGroup(t('searchGroupHistory'), historyCards, 6),
  ].filter(Boolean);
}

function renderSearchCard(item) {
  const chips = (item.chips || [])
    .filter(Boolean)
    .map((chip) => `<span class="badge">${escapeHtml(chip)}</span>`)
    .join('');
  const pathHtml = item.path ? `<span class="search-card-path">${escapeHtml(item.path)}</span>` : '';
  const summaryHtml = item.summary ? `<span class="search-card-copy">${escapeHtml(item.summary)}</span>` : '';
  const chipsHtml = chips ? `<div class="search-chip-row">${chips}</div>` : '';
  return `
    <article class="search-card ${safeTone(item.tone)}">
      <span class="search-card-kind">${escapeHtml(item.kind)}</span>
      <span class="search-card-title">${escapeHtml(item.title)}</span>
      ${pathHtml}
      ${summaryHtml}
      ${chipsHtml}
    </article>
  `;
}

function renderSearchResults() {
  const summaryNode = document.querySelector('#searchSummary');
  const container = document.querySelector('#searchResults');
  const surface = document.querySelector('#architectureSurface');

  if (!hasActiveQuery()) {
    summaryNode.textContent = t('searchSummaryIdle');
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const groups = buildSearchGroups();
  const total = groups.reduce((count, group) => count + group.total, 0);
  if (surface) surface.open = true;
  container.hidden = false;

  if (!groups.length || !total) {
    summaryNode.textContent = t('searchNoResults');
    container.innerHTML = `<div class="empty">${escapeHtml(t('searchNoResults'))}</div>`;
    return;
  }

  summaryNode.textContent = t('searchSummaryActive', {
    groups: formatCount(groups.length),
    count: formatCount(total),
  });

  container.innerHTML = groups.map((group) => `
    <section class="search-group">
      <div class="search-group-head">
        <span class="search-group-title">${escapeHtml(group.title)}</span>
        <span class="badge">${escapeHtml(formatCount(group.total))}</span>
      </div>
      <div class="search-group-list">${group.items.map(renderSearchCard).join('')}</div>
    </section>
  `).join('');
}

function renderRecentList() {
  const container = document.querySelector('#recentList');
  const recent = getFilteredRecentNodes();
  if (!recent.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noRecent'))}</div>`;
    return;
  }
  container.innerHTML = recent.map((node) => `
    <div class="mini-item">
      <span class="mini-title">${escapeHtml(node.path || node.name)}</span>
      <span class="mini-text">${escapeHtml([node.status, formatRecentLabel(node.recentLabel), formatDateTime(node.updatedAt)].filter(Boolean).join(' / '))}</span>
    </div>
  `).join('');
}

function collectBranchStats(node) {
  const stats = { directories: 0, files: 0, dirty: 0, recent: 0 };
  if (node.type === 'directory') stats.directories += 1;
  if (node.type === 'file') stats.files += 1;
  if (node.status) stats.dirty += 1;
  if (node.recentLabel) stats.recent += 1;
  for (const child of node.children || []) {
    const childStats = collectBranchStats(child);
    stats.directories += childStats.directories;
    stats.files += childStats.files;
    stats.dirty += childStats.dirty;
    stats.recent += childStats.recent;
  }
  return stats;
}

function metricBadge(label, count) {
  return `<span class="badge">${escapeHtml(label)} ${escapeHtml(formatCount(count))}</span>`;
}

function renderArchitecture() {
  const container = document.querySelector('#architectureList');
  const cards = buildArchitectureCards();
  if (!cards.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noArchitecture'))}</div>`;
    return;
  }
  container.innerHTML = cards.map((card) => {
    const meta = [
      metricBadge(t('metricDirectories'), card.stats.directories),
      metricBadge(t('metricFiles'), card.stats.files),
      metricBadge(t('metricDirty'), card.stats.dirty),
      metricBadge(t('metricRecent'), card.stats.recent),
    ].join('');
    const previewHtml = card.preview.length
      ? `
        <div class="card-preview">
          <span class="card-preview-label">${escapeHtml(t('architectureChildrenLabel'))}</span>
          <div class="card-preview-row">
            ${card.preview.map((item) => `<span class="badge">${escapeHtml(item.name)}</span>`).join('')}
          </div>
        </div>
      `
      : '';
    const summaryHtml = card.summary
      ? `<span class="card-copy">${escapeHtml(card.summary)}</span>`
      : '';
    const nodeMetaHtml = metaBadges(card.node);
    return `
      <details class="architecture-card ${card.tone}">
        <summary class="architecture-card-summary">
          <div class="architecture-card-summary-row">
            <div class="card-head">
              <span class="card-title">${escapeHtml(card.node.name)}</span>
              <span class="card-path">${escapeHtml(card.node.path || t('rootPath'))}</span>
            </div>
            <span class="architecture-card-toggle" aria-hidden="true">›</span>
          </div>
          <div class="card-meta">${meta}</div>
        </summary>
        <div class="architecture-card-body">
          ${summaryHtml}
          ${previewHtml}
          ${nodeMetaHtml ? `<div class="card-meta">${nodeMetaHtml}</div>` : ''}
        </div>
      </details>
    `;
  }).join('');
}

function renderHistory() {
  const container = document.querySelector('#historyList');
  const entries = getFilteredHistoryEntries();
  if (!entries.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noHistory'))}</div>`;
    return;
  }
  container.innerHTML = entries.map((entry) => {
    const touchedHtml = (entry.touched || []).map((path) => `<span class="history-chip">${escapeHtml(path)}</span>`).join('');
    const verificationHtml = (entry.verification || []).map((item) => `<span class="history-chip">${escapeHtml(item)}</span>`).join('');
    return `
      <details class="history-card">
        <summary>
          <div class="history-head">
            <div class="history-head-copy">
              <time class="history-date">${escapeHtml(entry.date)}</time>
              <h3 class="history-title">${escapeHtml(pickText(entry.title))}</h3>
            </div>
            <span class="history-card-toggle" aria-hidden="true">›</span>
          </div>
        </summary>
        <div class="history-card-body">
          <div class="history-section">
            <span class="history-label">${escapeHtml(t('historySummaryLabel'))}</span>
            <span class="history-summary">${escapeHtml(pickText(entry.summary))}</span>
          </div>
          <div class="history-section">
            <span class="history-label">${escapeHtml(t('historyTouchedLabel'))}</span>
            <div class="history-chip-row">${touchedHtml}</div>
          </div>
          <div class="history-section">
            <span class="history-label">${escapeHtml(t('historyVerificationLabel'))}</span>
            <div class="history-chip-row">${verificationHtml}</div>
          </div>
          <div class="history-section">
            <span class="history-label">${escapeHtml(t('historyBoundaryLabel'))}</span>
            <span class="history-boundary">${escapeHtml(pickText(entry.boundary))}</span>
          </div>
        </div>
      </details>
    `;
  }).join('');
}

function updateStats() {
  const totals = state.map?.totals || {};
  document.querySelector('[data-stat="directories"]').textContent = totals.directories ?? '-';
  document.querySelector('[data-stat="files"]').textContent = totals.files ?? '-';
  document.querySelector('[data-stat="dirty"]').textContent = totals.dirty ? t('dirty', { count: totals.dirty }) : t('clean');
  document.querySelector('[data-stat="generated"]').textContent = formatDateTime(state.map?.generatedAt);
}

function renderSource() {
  const chip = document.querySelector('#sourceChip');
  const text = document.querySelector('#sourceText');
  if (!state.map) {
    chip.textContent = 'offline';
    text.textContent = t('sourceUnavailable');
    return;
  }
  chip.textContent = state.map.git?.available ? 'live git + fs' : 'live fs';
  text.textContent = t('sourceLoaded', { endpoint: state.endpoint || '/api/repository-map' });
}

function renderMap() {
  renderHistory();
  updateStats();
  renderSource();
  renderSearchResults();
  renderRecentList();
  renderArchitecture();
  const treeRoot = document.querySelector('#treeRoot');
  if (!state.map?.tree) {
    treeRoot.innerHTML = `<div class="empty">${escapeHtml(t('loadError'))}</div>`;
    return;
  }
  const html = renderNode(state.map.tree);
  treeRoot.innerHTML = html || `<div class="empty">${escapeHtml(t('emptyTree'))}</div>`;
}

function updateStaticText() {
  document.documentElement.lang = state.language;
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    const isActive = button.dataset.language === state.language;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  const includeDescendantsToggle = document.querySelector('#includeDescendantsToggle');
  if (includeDescendantsToggle) includeDescendantsToggle.checked = state.includeDescendants;
}

function chooseLanguage(nextLanguage) {
  state.language = nextLanguage === 'en' ? 'en' : 'ko';
  updateStaticText();
  renderMap();
}

function readRequestedLanguage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'ko';
}

function resolveRepositoryMapEndpoint() {
  const pathname = String(window.location.pathname || '');
  if (pathname.startsWith('/owner/repository-map')) {
    return '/api/owner/repository-map?maxDepth=50';
  }
  return '/api/repository-map?maxDepth=50';
}

async function loadRepositoryMap() {
  const endpoint = resolveRepositoryMapEndpoint();
  document.querySelector('#sourceChip').textContent = 'loading';
  document.querySelector('#sourceText').textContent = t('sourceLoading');
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) throw new Error(`http_${response.status}`);
    state.map = await response.json();
    state.endpoint = endpoint;
  } catch {
    state.map = buildFallbackRepositoryMap();
    state.endpoint = 'built-in fallback';
  }
  renderMap();
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => chooseLanguage(button.dataset.language));
});
document.querySelector('#mapSearch').addEventListener('input', (event) => {
  state.query = event.target.value.trim().toLowerCase();
  updateParsedQuery();
  renderMap();
});
document.querySelector('#includeDescendantsToggle').addEventListener('change', (event) => {
  state.includeDescendants = Boolean(event.target.checked);
  renderMap();
});
document.querySelector('#expandAllButton').addEventListener('click', () => {
  document.querySelectorAll('#treeRoot details').forEach((node) => { node.open = true; });
});
document.querySelector('#collapseAllButton').addEventListener('click', () => {
  document.querySelectorAll('#treeRoot details').forEach((node) => { node.open = false; });
});
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== 'kpi-ops-language') return;
  chooseLanguage(event.data.language);
});

state.language = readRequestedLanguage();
updateParsedQuery();
updateStaticText();
renderHistory();
loadRepositoryMap();
