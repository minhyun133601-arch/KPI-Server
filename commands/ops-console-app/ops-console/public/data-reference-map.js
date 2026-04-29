const messages = {
  ko: {
    eyebrow: 'data architecture',
    title: '데이터 참조 경로',
    subtitle: '현재 구현된 입력 화면이 어떤 런타임, API, DB 레코드, 파일 저장소, 권한키를 거쳐 저장되는지 정리합니다.',
    axisModuleLabel: 'axis 1',
    axisModuleTitle: 'JSON 본문 저장',
    axisModuleCopy: '대부분의 화면 본문은 PostgreSQL app_module_records의 module_key + record_key로 저장됩니다.',
    axisDocumentsLabel: 'axis 2',
    axisDocumentsTitle: '파일/이미지 저장',
    axisDocumentsCopy: '첨부 메타는 app_documents, 실제 바이트는 KPI_STORAGE_ROOT/files 아래 도메인별 폴더로 갑니다.',
    axisDedicatedLabel: 'axis 3',
    axisDedicatedTitle: '전용 구조 테이블',
    axisDedicatedCopy: '생산일보처럼 행 단위 집계가 필요한 영역은 util_production_daily_* 전용 테이블을 씁니다.',
    searchPlaceholder: '조도, 설비, 작업내역, record_key, 권한키 검색',
    countSummary: '{count}개 데이터 흐름',
    filteredSummary: '{count}개 일치 / 전체 {total}개',
    noResults: '검색 조건에 맞는 데이터 참조 경로가 없습니다.',
    uiLabel: '화면 / 입력',
    chainLabel: '흐름',
    runtimeLabel: '런타임 / API',
    storageLabel: '본문 데이터',
    assetsLabel: '이미지 / 첨부',
    permissionLabel: '권한키',
    sourceLabel: '핵심 코드 경로',
    statusLabel: '현재 상태',
    webKicker: 'clickable architecture web',
    webTitle: '데이터 흐름 거미줄',
    webCopy: '가운데 KPI 데이터 허브에서 각 입력 화면과 저장 축이 어떻게 이어지는지 보여줍니다. 기능 노드를 누르면 오른쪽 상세 정보가 바뀝니다.',
    centerNode: 'KPI 데이터 허브',
    moduleAxisNode: 'app_module_records',
    documentsAxisNode: 'app_documents + files',
    dedicatedAxisNode: '전용 테이블',
    noPersistenceAxisNode: '저장 미연결',
    sharedEditKicker: 'shared write model',
    sharedEditTitle: '같은 권한키를 가진 사용자는 같은 저장내역을 수정합니다',
    sharedEditCopy: 'app_module_records는 개인 PC 저장이 아니라 서버 공용 DB 레코드입니다. 로그인 사용자가 해당 permission_key의 write 권한을 받으면 같은 record_key의 저장내역을 읽고 수정할 수 있습니다.',
    sharedFlowCount: '{count}개 흐름 공유',
    collaborationLabel: '공동 수정 조건',
    collaborationCopy: '가능: {permissions} write 권한이 있는 사용자는 같은 서버 저장내역을 함께 수정합니다.',
    collaborationNoPersistence: '아직 저장 API와 permission_key가 없어 다른 사용자가 수정할 공용 저장내역이 없습니다.',
    imageReferenceLabel: '이미지 / 첨부 참조 필드',
    sharedGroupLabel: '공유 묶음',
    moduleRecordToggleLabel: 'module_key 상세 보기',
    recordModuleLabel: 'module_key',
    recordCountLabel: '{count}개 record_key',
    recordFeatureLabel: '연결 화면',
    recordPermissionLabel: 'permission_key',
    recordSourceLabel: '등록 출처',
    recordNoResults: '검색 조건에 맞는 app_module_records 행이 없습니다.',
    graphFlagShared: '공용DB',
    graphFlagAsset: '이미지/첨부',
    graphFlagDedicated: '전용테이블',
    graphFlagNoStorage: '미연결',
  },
  en: {
    eyebrow: 'data architecture',
    title: 'Data Reference Paths',
    subtitle: 'Documents how the implemented input screens flow through runtime code, APIs, DB records, file storage, and permission keys.',
    axisModuleLabel: 'axis 1',
    axisModuleTitle: 'JSON payload storage',
    axisModuleCopy: 'Most screen payloads are stored in PostgreSQL app_module_records by module_key + record_key.',
    axisDocumentsLabel: 'axis 2',
    axisDocumentsTitle: 'File/image storage',
    axisDocumentsCopy: 'Attachment metadata goes to app_documents; bytes go under KPI_STORAGE_ROOT/files by domain folder.',
    axisDedicatedLabel: 'axis 3',
    axisDedicatedTitle: 'Dedicated tables',
    axisDedicatedCopy: 'Row-level reporting areas such as production daily use util_production_daily_* dedicated tables.',
    searchPlaceholder: 'Search lux, equipment, work history, record_key, permission keys',
    countSummary: '{count} data flows',
    filteredSummary: '{count} matches / {total} total',
    noResults: 'No data-reference paths match the current search.',
    uiLabel: 'Screen / input',
    chainLabel: 'Flow',
    runtimeLabel: 'Runtime / API',
    storageLabel: 'Text payload',
    assetsLabel: 'Images / attachments',
    permissionLabel: 'Permission key',
    sourceLabel: 'Key source paths',
    statusLabel: 'Current status',
    webKicker: 'clickable architecture web',
    webTitle: 'Data Flow Web',
    webCopy: 'Shows how each input screen connects from the KPI data hub to storage axes. Click a feature node to change the detail panel.',
    centerNode: 'KPI Data Hub',
    moduleAxisNode: 'app_module_records',
    documentsAxisNode: 'app_documents + files',
    dedicatedAxisNode: 'Dedicated tables',
    noPersistenceAxisNode: 'No persistence',
    sharedEditKicker: 'shared write model',
    sharedEditTitle: 'Users with the same permission key can edit the same saved records',
    sharedEditCopy: 'app_module_records is shared server DB storage, not a per-PC file. A signed-in user with write access to the relevant permission_key can read and edit the same record_key.',
    sharedFlowCount: '{count} shared flows',
    collaborationLabel: 'Shared edit rule',
    collaborationCopy: 'Available: users with write access to {permissions} can edit the same server-side saved records.',
    collaborationNoPersistence: 'No shared saved record exists yet because persistence API and permission_key are not wired.',
    imageReferenceLabel: 'Image / attachment reference fields',
    sharedGroupLabel: 'Shared group',
    moduleRecordToggleLabel: 'Show module_key details',
    recordModuleLabel: 'module_key',
    recordCountLabel: '{count} record_keys',
    recordFeatureLabel: 'Feature',
    recordPermissionLabel: 'permission_key',
    recordSourceLabel: 'Source',
    recordNoResults: 'No app_module_records rows match the current search.',
    graphFlagShared: 'shared DB',
    graphFlagAsset: 'image/files',
    graphFlagDedicated: 'tables',
    graphFlagNoStorage: 'not wired',
  },
};

const dataFlows = [
  {
    id: 'audit-lux',
    tone: 'cyan',
    title: { ko: '오디트 조도', en: 'Audit Lux' },
    summary: {
      ko: '조도 기준, 연도별 측정값, 근거 스캔본을 audit 화면에서 입력하고 서버 module record와 파일 저장소에 나눠 저장합니다.',
      en: 'Lux standards, yearly measurements, and evidence scans are entered in the audit screen and split between module records and file storage.',
    },
    status: {
      ko: '기입 가능. 본문과 스캔본 모두 서버 저장 경로가 있습니다.',
      en: 'Writable. Both payload and evidence scans have server storage paths.',
    },
    chain: ['Audit UI', 'KpiRuntime save provider', '/api/modules + /api/files/base64', 'PostgreSQL + KPI_STORAGE_ROOT/files'],
    ui: [
      'audit/runtime/audit/sections/KPI.sections.audit.js',
      'audit/runtime/audit/records/KPI.audit.records.render.js',
      'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js',
    ],
    runtime: [
      'audit/runtime/audit/KPI.audit.runtime.js',
      '/api/modules/portal_data/records/audit_lux',
      '/api/files/base64',
    ],
    storage: [
      'app_module_records(module_key=portal_data, record_key=audit_lux)',
    ],
    assets: [
      'app_documents(ownerDomain=audit.lux.evidence, fileCategory=evidence)',
      'KPI_STORAGE_ROOT/files/첨부파일/Audit/조도 스캔본',
    ],
    permissions: ['audit.lux'],
    sharedGroups: ['portal-data', 'app-documents'],
    imageRefs: [
      'evidence[].documentId',
      'evidence[].previewUrl -> /api/files/<documentId>/view',
      'evidence[].downloadUrl -> /api/files/<documentId>/download',
      'app_documents.owner_domain=audit.lux.evidence',
    ],
    source: [
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
      'kpi-runtime/internal-server/src/routes/module-routes.js',
      'kpi-runtime/internal-server/src/routes/file-routes.js',
    ],
    tags: ['조도', 'lux', 'audit_lux', 'audit.lux', 'evidence', 'app_documents'],
  },
  {
    id: 'audit-legal-facility',
    tone: 'rose',
    title: { ko: '법정 설비 관리', en: 'Legal Facility Management' },
    summary: {
      ko: '법정 설비 텍스트 정보는 audit_legal_facility 레코드에, 사진과 문서는 설비명 기반 폴더에 저장합니다.',
      en: 'Legal-facility text data is stored in audit_legal_facility; photos and attachments are stored in facility-name folders.',
    },
    status: {
      ko: '기입 가능. 설비명 기준 이미지/첨부 폴더 분리가 연결되어 있습니다.',
      en: 'Writable. Image and attachment folders are split by facility name.',
    },
    chain: ['Legal facility UI', '/api/modules/portal_data/records/audit_legal_facility', '/api/files/base64', 'equipment-assets/legal-facility'],
    ui: [
      'audit/runtime/audit/records/KPI.audit.records.legal.js',
      'audit/runtime/audit/records/KPI.audit.records.legal.assets.js',
    ],
    runtime: [
      '/api/modules/portal_data/records/audit_legal_facility',
      '/api/files/base64',
    ],
    storage: [
      'app_module_records(module_key=portal_data, record_key=audit_legal_facility)',
    ],
    assets: [
      'app_documents(ownerDomain=audit.legal_facility, fileCategory=photo|attachment)',
      'KPI_STORAGE_ROOT/files/equipment-assets/legal-facility/<설비명>/images',
      'KPI_STORAGE_ROOT/files/equipment-assets/legal-facility/<설비명>/attachments',
    ],
    permissions: ['audit.legal_facility'],
    sharedGroups: ['portal-data', 'app-documents'],
    imageRefs: [
      'records[].imageDocumentId / imagePreviewUrl / imageDownloadUrl',
      'records[].documentId / previewUrl / downloadUrl',
      'app_documents.owner_domain=audit.legal_facility',
      'KPI_STORAGE_ROOT/files/equipment-assets/legal-facility/<설비명>/images',
    ],
    source: [
      'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
    ],
    tags: ['법정 설비', 'legal facility', 'audit_legal_facility', 'audit.legal_facility', 'equipment-assets'],
  },
  {
    id: 'equipment-history',
    tone: 'green',
    title: { ko: '설비 이력 카드', en: 'Equipment History Cards' },
    summary: {
      ko: '설비 보드와 이력 카드 본문은 data_equipment_history_card 레코드에, 사진/첨부는 설비명 기반 폴더에 저장합니다.',
      en: 'Equipment board and card payloads go to data_equipment_history_card; photos and attachments go to equipment-name folders.',
    },
    status: {
      ko: '기입 가능. 본문 JSON과 설비별 이미지/문서 저장 경로가 연결되어 있습니다.',
      en: 'Writable. Payload JSON plus equipment-specific image/document storage is wired.',
    },
    chain: ['Data entry UI', 'equipment-history storage module', '/api/modules + /api/files/base64', 'equipment-assets/equipment-history'],
    ui: [
      'data-entry/runtime/data/sections/KPI.sections.data.js',
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.render.js',
      'data-entry/runtime/data/KPI.data.runtime.js',
    ],
    runtime: [
      'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js',
      '/api/modules/portal_data/records/data_equipment_history_card',
      '/api/files/base64',
    ],
    storage: [
      'app_module_records(module_key=portal_data, record_key=data_equipment_history_card)',
    ],
    assets: [
      'app_documents(ownerDomain=data.equipment_history, fileCategory=photo|attachment)',
      'KPI_STORAGE_ROOT/files/equipment-assets/equipment-history/<설비명>/images',
      'KPI_STORAGE_ROOT/files/equipment-assets/equipment-history/<설비명>/attachments',
    ],
    permissions: ['data.equipment_history'],
    sharedGroups: ['portal-data', 'app-documents'],
    imageRefs: [
      'photoDocumentId / photoPreviewUrl / photoDownloadUrl',
      'documents[].documentId / documents[].previewUrl / documents[].downloadUrl',
      'app_documents.owner_domain=data.equipment_history',
      'KPI_STORAGE_ROOT/files/equipment-assets/equipment-history/<설비명>/images',
    ],
    source: [
      'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
    ],
    tags: ['설비 이력', 'equipment history', 'data_equipment_history_card', 'data.equipment_history', 'photo'],
  },
  {
    id: 'work-history',
    tone: 'amber',
    title: { ko: '작업내역 / 팀 캘린더', en: 'Work History / Team Calendar' },
    summary: {
      ko: '작업내역 도구는 work_history_records에 저장하고, 팀 캘린더 쪽 작업 데이터는 work_runtime 팀별 레코드로 분리됩니다.',
      en: 'The work-history tool saves to work_history_records, while team-calendar work data is split into work_runtime team records.',
    },
    status: {
      ko: '기입 가능. 작업내역 본문과 청구서/보고서 첨부 저장 경로가 있습니다.',
      en: 'Writable. Work-history payloads plus billing/report attachments have storage paths.',
    },
    chain: ['Work UI', 'KpiWorkHistory storage', '/api/modules/portal_data/records/work_history_records', 'app_documents for attachments'],
    ui: [
      'team-report/runtime/work/sections/KPI.sections.work.js',
      'team-report/runtime/work/history',
      'team-report/runtime/work/KPI.work.runtime.js',
    ],
    runtime: [
      'team-report/runtime/work/history/KPI.work.history.core.storage.js',
      '/api/modules/portal_data/records/work_history_records',
      '/api/modules/work_runtime/records/work_team_calendar_*',
      '/api/files/base64',
    ],
    storage: [
      'app_module_records(module_key=portal_data, record_key=work_history_records)',
      'app_module_records(module_key=work_runtime, record_key=work_team_calendar_team1_part1|team1_part2|team2|team3|team4|overview)',
    ],
    assets: [
      'app_documents(ownerDomain=work.history, fileCategory=billing_pdf|report_pdf)',
      'KPI_STORAGE_ROOT/files/첨부파일/작업내역/청구서',
      'KPI_STORAGE_ROOT/files/첨부파일/작업내역/보고서',
    ],
    permissions: ['work.team_calendar'],
    sharedGroups: ['portal-data', 'work-runtime', 'app-documents'],
    imageRefs: [
      'attachmentSlots.billing.documentId / previewUrl / downloadUrl',
      'attachmentSlots.report.documentId / previewUrl / downloadUrl',
      'attachments[].documentId',
      'app_documents.owner_domain=work.history',
    ],
    source: [
      'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
    ],
    tags: ['작업내역', 'work_history_records', 'work_runtime', 'work.team_calendar', 'billing_pdf', 'report_pdf'],
  },
  {
    id: 'utility-metering',
    tone: 'blue',
    title: { ko: '유틸리티 검침 / 청구서', en: 'Utility Metering / Billing' },
    summary: {
      ko: '전기·가스·폐수·생산 검침 상태는 util_metering module record 묶음으로 저장하고, 청구서 문서는 app_documents로 분리합니다.',
      en: 'Electric, gas, wastewater, and production metering state is stored as util_metering module records; billing documents are split into app_documents.',
    },
    status: {
      ko: '기입 가능. 검침 store와 전기/가스 청구서 저장 경로가 있습니다.',
      en: 'Writable. Metering store and electric/gas billing document paths exist.',
    },
    chain: ['Utility UI', 'Integrated metering bridge', '/api/shared-store', 'app_module_records(util_metering)'],
    ui: [
      'utility/runtime/util/KPI.util.runtime.js',
      'utility/runtime/util/integration/KPI.util.metering.bridge.js',
      'utility/apps/metering',
    ],
    runtime: [
      '/api/shared-store',
      '/api/billing-document',
      'kpi-runtime/internal-server/src/services/metering-authority.js',
    ],
    storage: [
      'app_module_records(module_key=util_metering, record_key=ui_state_v1)',
      'app_module_records(module_key=util_metering, record_key=electric_v1|gas_v1|waste_v1|production_v1)',
    ],
    assets: [
      'app_documents(ownerDomain=metering.billing_document, fileCategory=billing_document)',
      'KPI_STORAGE_ROOT/files/첨부파일/유틸리티/전기 청구서',
      'KPI_STORAGE_ROOT/files/첨부파일/유틸리티/가스 청구서',
    ],
    permissions: ['util.metering.app'],
    sharedGroups: ['util-metering', 'app-documents'],
    imageRefs: [
      'billingDocument.documentId / previewUrl / downloadUrl',
      'app_documents.owner_domain=metering.billing_document',
      'KPI_STORAGE_ROOT/files/첨부파일/유틸리티/전기 청구서',
      'KPI_STORAGE_ROOT/files/첨부파일/유틸리티/가스 청구서',
    ],
    source: [
      'kpi-runtime/internal-server/src/routes/shared-store-routes.js',
      'kpi-runtime/internal-server/src/repositories/metering-authority.js',
      'kpi-runtime/internal-server/src/lib/document-storage.js',
    ],
    tags: ['유틸리티', '검침', 'metering', 'util_metering', 'shared-store', 'billing_document'],
  },
  {
    id: 'utility-production-daily',
    tone: 'slate',
    title: { ko: '유틸리티 생산일보', en: 'Utility Production Daily' },
    summary: {
      ko: '생산량 기입 시트에서 들어온 일자별 생산 데이터는 JSON 단일 레코드가 아니라 전용 테이블로 정규화됩니다.',
      en: 'Daily production data imported from production sheets is normalized into dedicated tables instead of a single JSON record.',
    },
    status: {
      ko: '기입 가능. 생산량 행 데이터만 전용 테이블에 저장하고, 업로드한 원본 시트 파일은 보관하지 않습니다.',
      en: 'Writable. Only production rows are stored in dedicated tables; uploaded source sheet files are not archived.',
    },
    chain: ['Utility production UI', '/api/util-production/daily', 'util-production repository', 'util_production_daily_entries'],
    ui: [
      'utility/runtime/util/production',
      'utility/runtime/util/KPI.util.data-sync.js',
    ],
    runtime: [
      '/api/util-production/daily',
      'kpi-runtime/internal-server/src/routes/util-production-routes.js',
      'kpi-runtime/internal-server/src/repositories/util-production-daily.js',
    ],
    storage: [
      'util_production_daily_state',
      'util_production_daily_entries',
      { ko: '원본 시트 파일은 저장하지 않음', en: 'Source sheet files are not stored' },
    ],
    assets: [
      { ko: '없음: 생산량 기입 원본 파일은 app_documents에 저장하지 않음', en: 'None: production-entry source files are not stored in app_documents' },
    ],
    permissions: ['util.production.daily'],
    sharedGroups: ['dedicated-tables'],
    imageRefs: [
      { ko: '없음: documentId / previewUrl / downloadUrl 참조 없음', en: 'None: no documentId / previewUrl / downloadUrl references' },
    ],
    source: [
      'kpi-runtime/internal-server/src/db/migrations/004_util_production_daily_tables.sql',
      'kpi-runtime/internal-server/src/lib/portal-bootstrap/runtime-config.js',
      'utility/runtime/util/production/KPI.util.production.extractor.js',
    ],
    tags: ['생산일보', 'production daily', 'util_production_daily', 'util.production.daily', 'no source archive'],
  },
  {
    id: 'monthly-performance-report',
    tone: 'green',
    title: { ko: '월간 실적보고', en: 'Monthly Performance Report' },
    summary: {
      ko: '현재는 Repository Map 옆 운영 콘솔 항목이 아니라 KPI 화면의 별도 팝업 진입점입니다. 팀 선택 UI만 있고, 아직 DB 저장 경로는 없습니다.',
      en: 'Currently this is a KPI popup entry point with team selection only. It does not yet have a DB storage path.',
    },
    status: {
      ko: '저장 미연결. 작업내역 work_history_records를 원천으로 쓰지 않도록 분리된 상태입니다.',
      en: 'Storage not wired. It is intentionally separated from work_history_records.',
    },
    chain: ['KPI section launcher', 'monthly-performance-report-popup.html', 'team selection UI', 'no persistence yet'],
    ui: [
      'kpi-runtime/sections/KPI.sections.production-report.js',
      'kpi-runtime/sections/monthly-performance-report-popup.html',
    ],
    runtime: [{ ko: '없음: 저장 API 미연결', en: 'None: persistence API not wired yet' }],
    storage: [{ ko: '없음: DB record/table 미정', en: 'None: DB record/table not decided yet' }],
    assets: [{ ko: '없음', en: 'None' }],
    permissions: [{
      ko: '미정: 저장 기능 추가 시 별도 permission_key 필요',
      en: 'TBD: needs a permission_key when persistence is added',
    }],
    sharedGroups: ['no-storage'],
    imageRefs: [{ ko: '없음: 이미지/첨부 참조 필드 미정', en: 'None: image/attachment reference fields are not decided yet' }],
    source: [
      'kpi-runtime/internal-server/test/frontend/production-report-section.smoke.js',
      'kpi-runtime/internal-server/e2e/kpi-browser.playwright.js',
    ],
    tags: ['월간 실적보고', 'monthly performance', 'no persistence', 'popup'],
  },
];

const sharedStorageGroups = [
  {
    id: 'portal-data',
    tone: 'green',
    title: { ko: 'portal_data 공용 JSON 레코드', en: 'portal_data shared JSON records' },
    summary: {
      ko: '오디트, 법정 설비, 설비 이력, 작업내역 본문이 같은 app_module_records 테이블을 공유합니다. record_key는 다르고 permission_key별로 읽기/쓰기가 갈립니다.',
      en: 'Audit, legal facility, equipment history, and work-history payloads share the same app_module_records table. record_key differs, and read/write access is split by permission_key.',
    },
    flowIds: ['audit-lux', 'audit-legal-facility', 'equipment-history', 'work-history'],
  },
  {
    id: 'app-documents',
    tone: 'blue',
    title: { ko: 'app_documents 이미지/첨부 참조', en: 'app_documents image/file references' },
    summary: {
      ko: '이미지와 문서의 메타는 app_documents에 남고, 본문 JSON에는 documentId, previewUrl, downloadUrl 같은 참조만 저장됩니다.',
      en: 'Image and document metadata lives in app_documents; payload JSON keeps references such as documentId, previewUrl, and downloadUrl.',
    },
    flowIds: ['audit-lux', 'audit-legal-facility', 'equipment-history', 'work-history', 'utility-metering'],
  },
  {
    id: 'work-runtime',
    tone: 'amber',
    title: { ko: 'work_runtime 팀 캘린더 묶음', en: 'work_runtime team-calendar bundle' },
    summary: {
      ko: '작업내역은 portal_data 기록과 별개로 팀 캘린더용 work_runtime 레코드 묶음도 같이 사용합니다.',
      en: 'Work history also uses the work_runtime record bundle for team calendars, separate from the portal_data record.',
    },
    flowIds: ['work-history'],
  },
  {
    id: 'util-metering',
    tone: 'cyan',
    title: { ko: 'util_metering 검침 공유 저장소', en: 'util_metering metering shared store' },
    summary: {
      ko: '전기·가스·폐수·생산 검침은 util_metering module record 묶음으로 나뉘어 같은 유틸리티 화면에서 공유됩니다.',
      en: 'Electric, gas, wastewater, and production metering are split into util_metering module records shared by the utility UI.',
    },
    flowIds: ['utility-metering'],
  },
  {
    id: 'dedicated-tables',
    tone: 'slate',
    title: { ko: '생산일보 전용 구조 테이블', en: 'Production-daily dedicated tables' },
    summary: {
      ko: '일자별 생산 데이터처럼 SQL 집계가 필요한 자료는 JSON 레코드가 아니라 util_production_daily_* 테이블을 씁니다.',
      en: 'SQL-queryable daily production data uses util_production_daily_* tables instead of one JSON record.',
    },
    flowIds: ['utility-production-daily'],
  },
  {
    id: 'no-storage',
    tone: 'rose',
    title: { ko: '저장 미연결 항목', en: 'No-persistence items' },
    summary: {
      ko: '월간 실적보고는 현재 팝업 진입점만 있고, 아직 DB record/table과 permission_key가 정해지지 않았습니다.',
      en: 'Monthly Performance Report currently has only a popup entry point; DB record/table and permission_key are not decided yet.',
    },
    flowIds: ['monthly-performance-report'],
  },
];

const appModuleRecordGroups = [
  {
    moduleKey: 'portal_data',
    tone: 'green',
    summary: {
      ko: 'KPI 일반 입력 화면의 JSON 본문 저장 묶음입니다. 오디트, 법정 설비, 설비 이력, 작업내역 본문이 여기서 record_key별로 갈립니다.',
      en: 'JSON payload bundle for general KPI input screens. Audit, legal facility, equipment history, and work-history payloads split by record_key here.',
    },
    source: 'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
    records: [
      { recordKey: 'audit_lux', feature: { ko: '오디트 조도', en: 'Audit Lux' }, permissionKey: 'audit.lux' },
      { recordKey: 'audit_regulation', feature: { ko: '오디트 법규/규정', en: 'Audit Regulation' }, permissionKey: 'audit.regulation' },
      { recordKey: 'audit_legal_facility', feature: { ko: '법정 설비 관리', en: 'Legal Facility Management' }, permissionKey: 'audit.legal_facility' },
      { recordKey: 'data_equipment_history_card', feature: { ko: '설비 이력 카드', en: 'Equipment History Cards' }, permissionKey: 'data.equipment_history' },
      { recordKey: 'work_history_records', feature: { ko: '작업내역 통합 기록', en: 'Work History Records' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_monthly_plan', feature: { ko: '작업 월간 계획', en: 'Work Monthly Plan' }, permissionKey: 'work.plan.monthly' },
      { recordKey: 'work_kim_mingyu', feature: { ko: '김민규 개인 작업 기록', en: 'Kim Mingyu work record' }, permissionKey: 'work.person.kim_mingyu' },
      { recordKey: 'work_shin_taeseob', feature: { ko: '신태섭 개인 작업 기록', en: 'Shin Taeseob work record' }, permissionKey: 'work.person.shin_taeseob' },
      { recordKey: 'work_ahn_junsoo', feature: { ko: '안준수 개인 작업 기록', en: 'Ahn Junsoo work record' }, permissionKey: 'work.person.ahn_junsoo' },
      { recordKey: 'work_shin_jungrae', feature: { ko: '신정래 개인 작업 기록', en: 'Shin Jungrae work record' }, permissionKey: 'work.person.shin_jungrae' },
      { recordKey: 'work_lee_hyoseok', feature: { ko: '이효석 개인 작업 기록', en: 'Lee Hyoseok work record' }, permissionKey: 'work.person.lee_hyoseok' },
      { recordKey: 'work_kim_minhyun', feature: { ko: '김민현 개인 작업 기록', en: 'Kim Minhyun work record' }, permissionKey: 'work.person.kim_minhyun' },
    ],
  },
  {
    moduleKey: 'work_runtime',
    tone: 'amber',
    summary: {
      ko: '팀 캘린더/작업 현황 런타임 저장 묶음입니다. 현재 서버 bootstrap 기준은 1팀 1파트, 1팀 2파트, 2팀, 3팀 레코드입니다.',
      en: 'Runtime storage bundle for team calendars and work status. Current server bootstrap records cover team 1 part 1, team 1 part 2, team 2, and team 3.',
    },
    source: 'kpi-runtime/internal-server/src/lib/portal-data-registry.js',
    records: [
      { recordKey: 'work_team_calendar_team1_part1', feature: { ko: '1팀 1파트 팀 캘린더', en: 'Team 1 Part 1 calendar' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_team_calendar_team1_part2', feature: { ko: '1팀 2파트 팀 캘린더', en: 'Team 1 Part 2 calendar' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_team_calendar_team2', feature: { ko: '2팀 팀 캘린더', en: 'Team 2 calendar' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_team_calendar_team3', feature: { ko: '3팀 팀 캘린더', en: 'Team 3 calendar' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_team_calendar_team4', feature: { ko: '4팀 화면 호환 키', en: 'Team 4 UI compatibility key' }, permissionKey: 'work.team_calendar' },
      { recordKey: 'work_team_calendar_overview', feature: { ko: '전체/공정 요약 화면 호환 키', en: 'Overview/process summary UI compatibility key' }, permissionKey: 'work.team_calendar' },
    ],
  },
  {
    moduleKey: 'util_metering',
    tone: 'cyan',
    summary: {
      ko: '유틸리티 검침 권위본 저장 묶음입니다. 전기, 가스, 폐수, 생산량 검침 상태를 같은 module_key 아래 record_key별로 나눕니다.',
      en: 'Authority storage bundle for utility metering. Electric, gas, wastewater, and production metering state are split by record_key under the same module_key.',
    },
    source: 'kpi-runtime/internal-server/src/repositories/metering-authority.js',
    records: [
      { recordKey: 'ui_state_v1', feature: { ko: '검침 앱 UI 상태', en: 'Metering app UI state' }, permissionKey: 'util.metering.app' },
      { recordKey: 'electric_v1', feature: { ko: '전기 검침 권위본', en: 'Electric metering authority' }, permissionKey: 'util.metering.app' },
      { recordKey: 'gas_v1', feature: { ko: '가스 검침 권위본', en: 'Gas metering authority' }, permissionKey: 'util.metering.app' },
      { recordKey: 'waste_v1', feature: { ko: '폐수 검침 권위본', en: 'Wastewater metering authority' }, permissionKey: 'util.metering.app' },
      { recordKey: 'production_v1', feature: { ko: '생산량 검침 권위본', en: 'Production metering authority' }, permissionKey: 'util.metering.app' },
      { recordKey: 'shared_store_v1', feature: { ko: '레거시 통합 저장 호환 키', en: 'Legacy shared-store compatibility key' }, permissionKey: 'util.metering.app' },
    ],
  },
];

const state = {
  language: 'ko',
  query: '',
  selectedFlowId: 'audit-lux',
  showModuleRecords: false,
};

const graphAxes = [
  { id: 'module', titleKey: 'moduleAxisNode', x: 50, y: 13 },
  { id: 'documents', titleKey: 'documentsAxisNode', x: 16, y: 80 },
  { id: 'dedicated', titleKey: 'dedicatedAxisNode', x: 84, y: 80 },
  { id: 'none', titleKey: 'noPersistenceAxisNode', x: 50, y: 94 },
];

const graphLayout = {
  'audit-lux': { x: 22, y: 25, axes: ['module', 'documents'] },
  'audit-legal-facility': { x: 12, y: 54, axes: ['module', 'documents'] },
  'equipment-history': { x: 32, y: 75, axes: ['module', 'documents'] },
  'work-history': { x: 68, y: 75, axes: ['module', 'documents'] },
  'utility-metering': { x: 88, y: 54, axes: ['module', 'documents'] },
  'utility-production-daily': { x: 78, y: 25, axes: ['documents', 'dedicated'] },
  'monthly-performance-report': { x: 50, y: 84, axes: ['none'] },
};

const moduleRecordLayout = {
  portal_data: { x: 27, y: 16 },
  work_runtime: { x: 50, y: 30 },
  util_metering: { x: 73, y: 16 },
};

function getFlowLayout(flow) {
  return graphLayout[flow.id] || { x: 50, y: 50, axes: ['module'] };
}

function t(key, values = {}) {
  const template = messages[state.language]?.[key] || messages.ko[key] || key;
  return String(template).replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? '');
}

function pickText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[state.language] || value.ko || value.en || '';
}

function collectText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(collectText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(collectText).join(' ');
  return String(value);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCount(value = 0) {
  return new Intl.NumberFormat(state.language === 'ko' ? 'ko-KR' : 'en-US').format(Number(value) || 0);
}

function getQueryTerms() {
  return String(state.query || '')
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function flowMatches(flow) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const haystack = collectText(flow).toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function getFilteredFlows() {
  return dataFlows.filter(flowMatches);
}

function getSelectedFlow() {
  return dataFlows.find((flow) => flow.id === state.selectedFlowId) || dataFlows[0] || null;
}

function getFlowById(flowId) {
  return dataFlows.find((flow) => flow.id === flowId) || null;
}

function ensureSelectedFlow(flows) {
  if (!flows.length) {
    state.selectedFlowId = '';
    return;
  }
  if (!flows.some((flow) => flow.id === state.selectedFlowId)) {
    state.selectedFlowId = flows[0].id;
  }
}

function flowHasPersistence(flow) {
  return !(flow?.sharedGroups || []).includes('no-storage');
}

function getPermissionText(flow) {
  return (flow?.permissions || [])
    .map(pickText)
    .filter(Boolean)
    .join(', ');
}

function getFlowFlags(flow) {
  const groups = new Set(flow?.sharedGroups || []);
  const flags = [];
  if (groups.has('portal-data') || groups.has('work-runtime') || groups.has('util-metering')) flags.push(t('graphFlagShared'));
  if (groups.has('app-documents')) flags.push(t('graphFlagAsset'));
  if (groups.has('dedicated-tables')) flags.push(t('graphFlagDedicated'));
  if (groups.has('no-storage')) flags.push(t('graphFlagNoStorage'));
  return flags;
}

function renderCollaboration(flow) {
  const copy = flowHasPersistence(flow)
    ? t('collaborationCopy', { permissions: getPermissionText(flow) || '-' })
    : t('collaborationNoPersistence');
  return `
    <section class="flow-collaboration">
      <strong>${escapeHtml(t('collaborationLabel'))}</strong>
      <span>${escapeHtml(copy)}</span>
    </section>
  `;
}

function renderSharedGroups() {
  const container = document.querySelector('#sharingMatrix');
  if (!container) return;
  container.innerHTML = sharedStorageGroups.map((group) => {
    const flows = group.flowIds.map(getFlowById).filter(Boolean);
    const flowBadges = flows
      .map((flow) => `<span class="badge">${escapeHtml(pickText(flow.title))}</span>`)
      .join('');
    return `
      <details class="shared-group-card ${escapeHtml(group.tone || 'slate')}">
        <summary class="shared-card-summary">
          <span class="shared-card-summary-main">
            <span class="axis-label">${escapeHtml(t('sharedGroupLabel'))}</span>
            <span class="shared-card-summary-row">
              <strong class="shared-group-title">${escapeHtml(pickText(group.title))}</strong>
              <span class="badge">${escapeHtml(t('sharedFlowCount', { count: formatCount(flows.length) }))}</span>
            </span>
          </span>
        </summary>
        <div class="shared-card-body">
          <p class="shared-group-copy">${escapeHtml(pickText(group.summary))}</p>
          <div class="shared-group-flows">${flowBadges}</div>
        </div>
      </details>
    `;
  }).join('');
}

function recordGroupMatches(group) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const groupHaystack = [
    group.moduleKey,
    pickText(group.summary),
    group.source,
  ].join(' ').toLowerCase();
  return terms.every((term) => groupHaystack.includes(term));
}

function recordMatches(record, group) {
  const terms = getQueryTerms();
  if (!terms.length) return true;
  const haystack = [
    group.moduleKey,
    record.recordKey,
    pickText(record.feature),
    record.permissionKey,
    group.source,
  ].join(' ').toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function getVisibleRecordRows(group) {
  return recordGroupMatches(group)
    ? group.records
    : group.records.filter((record) => recordMatches(record, group));
}

function renderModuleRecordLayer() {
  const container = document.querySelector('#moduleRecordLayer');
  if (!container) return;

  if (!state.showModuleRecords) {
    container.hidden = true;
    container.innerHTML = '';
    return;
  }

  const cards = appModuleRecordGroups
    .map((group) => {
      const visibleRecords = getVisibleRecordRows(group);
      if (!visibleRecords.length) return '';
      const layout = moduleRecordLayout[group.moduleKey] || { x: 50, y: 20 };
      const chips = visibleRecords.map((record) => `
        <span class="module-record-chip" title="${escapeHtml(`${record.recordKey} / ${record.permissionKey}`)}">
          <code>${escapeHtml(record.recordKey)}</code>
          <span>${escapeHtml(record.permissionKey)}</span>
        </span>
      `).join('');

      return `
        <article class="module-record-cluster ${escapeHtml(group.tone || 'slate')}" style="--x:${layout.x}%; --y:${layout.y}%;">
          <header class="module-record-head">
            <strong>${escapeHtml(group.moduleKey)}</strong>
            <span class="badge">${escapeHtml(t('recordCountLabel', { count: formatCount(visibleRecords.length) }))}</span>
          </header>
          <span class="module-record-source">${escapeHtml(group.source)}</span>
          <div class="module-record-chips">${chips}</div>
        </article>
      `;
    })
    .filter(Boolean);

  container.hidden = false;
  container.innerHTML = cards.length
    ? cards.join('')
    : `<div class="empty">${escapeHtml(t('recordNoResults'))}</div>`;
}

function renderCodeItem(value) {
  const text = pickText(value);
  if (!text) return '';
  if (/^(없음|미정|None|TBD)/i.test(text)) {
    return `<li>${escapeHtml(text)}</li>`;
  }
  return `<li><code>${escapeHtml(text)}</code></li>`;
}

function renderBlock(label, items = []) {
  const list = (Array.isArray(items) ? items : [items]).map(renderCodeItem).filter(Boolean).join('');
  if (!list) return '';
  return `
    <section class="path-block">
      <span class="path-label">${escapeHtml(label)}</span>
      <ul class="path-list">${list}</ul>
    </section>
  `;
}

function renderChain(chain = []) {
  return `
    <section class="path-block">
      <span class="path-label">${escapeHtml(t('chainLabel'))}</span>
      <div class="flow-chain">
        ${chain.map((item, index) => `
          ${index ? '<span class="chain-arrow">→</span>' : ''}
          <span class="chain-node">${escapeHtml(item)}</span>
        `).join('')}
      </div>
    </section>
  `;
}

function renderFlowCard(flow) {
  const tags = (flow.tags || []).slice(0, 6)
    .map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`)
    .join('');
  return `
    <article class="flow-card ${escapeHtml(flow.tone || 'slate')}">
      <div class="flow-head">
        <div class="flow-title-row">
          <h2 class="flow-title">${escapeHtml(pickText(flow.title))}</h2>
          <span class="badge">${escapeHtml(flow.id)}</span>
        </div>
        <p class="flow-summary">${escapeHtml(pickText(flow.summary))}</p>
        <p class="flow-status"><strong>${escapeHtml(t('statusLabel'))}</strong> · ${escapeHtml(pickText(flow.status))}</p>
        ${renderCollaboration(flow)}
        <div class="badge-row">${tags}</div>
      </div>
      <div class="flow-body">
        ${renderChain(flow.chain)}
        ${renderBlock(t('uiLabel'), flow.ui)}
        ${renderBlock(t('runtimeLabel'), flow.runtime)}
        ${renderBlock(t('storageLabel'), flow.storage)}
        ${renderBlock(t('assetsLabel'), flow.assets)}
        ${renderBlock(t('imageReferenceLabel'), flow.imageRefs)}
        ${renderBlock(t('permissionLabel'), flow.permissions)}
        ${renderBlock(t('sourceLabel'), flow.source)}
      </div>
    </article>
  `;
}

function renderLine(from, to, options = {}) {
  const classes = [
    options.active ? 'is-active' : '',
    options.muted ? 'is-muted' : '',
  ].filter(Boolean).join(' ');
  return `<line class="${classes}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
}

function renderArchitectureWeb(flows) {
  const lineContainer = document.querySelector('#webLines');
  const nodeContainer = document.querySelector('#webNodes');
  const selectedFlow = getSelectedFlow();
  const selectedId = selectedFlow?.id || '';
  const center = { x: 50, y: 50 };
  const axisById = new Map(graphAxes.map((axis) => [axis.id, axis]));

  const lines = [];
  for (const flow of flows) {
    const layout = getFlowLayout(flow);
    const isActive = flow.id === selectedId;
    lines.push(renderLine(center, layout, { active: isActive, muted: !isActive && selectedId }));
    for (const axisId of layout.axes || []) {
      const axis = axisById.get(axisId);
      if (!axis) continue;
      lines.push(renderLine(layout, axis, { active: isActive, muted: !isActive && selectedId }));
    }
  }

  const axisNodes = graphAxes.map((axis) => `
    <div class="web-node axis" style="--x:${axis.x}%; --y:${axis.y}%;">
      ${escapeHtml(t(axis.titleKey))}
    </div>
  `).join('');

  const flowNodes = dataFlows.map((flow) => {
    const layout = getFlowLayout(flow);
    const isVisible = flows.some((item) => item.id === flow.id);
    const isActive = flow.id === selectedId;
    const flags = getFlowFlags(flow)
      .map((flag) => `<span class="node-flag">${escapeHtml(flag)}</span>`)
      .join('');
    return `
      <button
        class="web-node flow ${isActive ? 'is-active' : ''} ${!isVisible ? 'is-hidden' : ''} ${selectedId && !isActive ? 'is-muted' : ''}"
        style="--x:${layout.x}%; --y:${layout.y}%;"
        type="button"
        data-flow-id="${escapeHtml(flow.id)}"
      >
        <span class="node-kicker">${escapeHtml(flow.id)}</span>
        <span class="node-title">${escapeHtml(pickText(flow.title))}</span>
        <span class="node-meta">${escapeHtml((flow.permissions || []).map(pickText).filter(Boolean).join(' / '))}</span>
        <span class="node-flags">${flags}</span>
      </button>
    `;
  }).join('');

  lineContainer.innerHTML = lines.join('');
  nodeContainer.innerHTML = `
    <div class="web-node center" style="--x:50%; --y:50%;">${escapeHtml(t('centerNode'))}</div>
    ${axisNodes}
    ${flowNodes}
  `;
}

function renderSelectedDetail(flows) {
  const container = document.querySelector('#flowDetail');
  if (!flows.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noResults'))}</div>`;
    return;
  }
  const selectedFlow = getSelectedFlow();
  container.innerHTML = selectedFlow ? renderFlowCard(selectedFlow) : '';
}

function renderMiniFlowList(flows) {
  const container = document.querySelector('#flowList');
  if (!flows.length) {
    container.innerHTML = `<div class="empty">${escapeHtml(t('noResults'))}</div>`;
    return;
  }
  container.innerHTML = flows.map((flow) => `
    <button
      class="mini-flow-button ${flow.id === state.selectedFlowId ? 'is-active' : ''}"
      type="button"
      data-flow-id="${escapeHtml(flow.id)}"
    >
      ${escapeHtml(pickText(flow.title))}
    </button>
  `).join('');
}

function renderFlows() {
  const summary = document.querySelector('#flowSummary');
  const flows = getFilteredFlows();
  ensureSelectedFlow(flows);
  summary.textContent = state.query
    ? t('filteredSummary', { count: formatCount(flows.length), total: formatCount(dataFlows.length) })
    : t('countSummary', { count: formatCount(dataFlows.length) });
  renderArchitectureWeb(flows);
  renderSelectedDetail(flows);
  renderMiniFlowList(flows);
  renderSharedGroups();
  renderModuleRecordLayer();
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
  const toggle = document.querySelector('#moduleRecordToggle');
  if (toggle) toggle.checked = state.showModuleRecords;
}

function chooseLanguage(language) {
  state.language = language === 'en' ? 'en' : 'ko';
  updateStaticText();
  renderFlows();
}

function readRequestedLanguage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'ko';
}

document.querySelectorAll('[data-language]').forEach((button) => {
  button.addEventListener('click', () => chooseLanguage(button.dataset.language));
});

document.querySelector('#dataFlowSearch').addEventListener('input', (event) => {
  state.query = String(event.target.value || '').trim().toLowerCase();
  renderFlows();
});

document.querySelector('#moduleRecordToggle')?.addEventListener('change', (event) => {
  state.showModuleRecords = event.target.checked === true;
  renderFlows();
});

document.querySelector('#webNodes').addEventListener('click', (event) => {
  const button = event.target.closest('[data-flow-id]');
  if (!button) return;
  state.selectedFlowId = button.dataset.flowId;
  renderFlows();
});

document.querySelector('#flowList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-flow-id]');
  if (!button) return;
  state.selectedFlowId = button.dataset.flowId;
  renderFlows();
});

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.data?.type !== 'kpi-ops-language') return;
  chooseLanguage(event.data.language);
});

state.language = readRequestedLanguage();
updateStaticText();
renderFlows();
