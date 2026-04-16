# 2026-04-16 Legacy Root and Dead Reference Audit
작성일 / Date: `2026-04-16`

> 범위 / Scope  
> 이 문서는 `KPI-Server` 작업복사본 안에서 **예전 저장 루트 참조, stale 운영 스크립트, 빈 레거시 폴더, 실물은 남아 있지만 현재 코드에서 안 잡히는 흔적, 그리고 끊어진 문서 참조**를 정리한다.  
> This audit covers **old storage-root references, stale operational scripts, empty legacy folders, unreferenced runtime artifacts, and missing documentation references** inside this `KPI-Server` working copy.

## 1. 현재 권위 경로 / Current authoritative roots

- 현재 서버 설정의 저장 루트는 `./var/prod` 다.
  - 근거: `06_★★★_KPI런타임/internal-server/.env.production.local:10`
- 현재 코드가 계산하는 실제 파일 루트는 `var/prod/files` 다.
  - 근거: `06_★★★_KPI런타임/internal-server/src/config.js:112`
  - 근거: `06_★★★_KPI런타임/internal-server/src/config.js:117`
- 현재 코드가 계산하는 runtime 로그 루트는 `var/prod/logs` 다.
  - 근거: `06_★★★_KPI런타임/internal-server/src/config.js:118`
- 현재 청구서 저장 규칙은 `첨부파일/유틸리티/전기 청구서`, `첨부파일/유틸리티/가스 청구서` 다.
  - 근거: `06_★★★_KPI런타임/internal-server/src/lib/document-storage.js:20`
  - 근거: `06_★★★_KPI런타임/internal-server/src/lib/document-storage.js:32`
  - 근거: `06_★★★_KPI런타임/internal-server/src/lib/document-storage.js:33`
  - 근거: `06_★★★_KPI런타임/internal-server/src/lib/document-storage.js:58`

DB 실물 경로 분포 확인 결과:

- `첨부파일 / 유틸리티 / 가스 청구서`: `66`건
- `첨부파일 / 유틸리티 / 전기 청구서`: `44`건
- 총 `110`건

즉, 현재 `app_documents` 기준 살아 있는 첨부파일 경로는 전부 `첨부파일/...` 아래에만 있다.

## 2. 조사 결과 / Findings

### A. `var/files` 를 직접 가리키던 stale 스크립트

초기 조사 시점에는 아래 스크립트가 **예전 기본 루트 `var/files`** 를 직접 가리키고 있었다.

1. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-file-storage.ps1`
2. `06_★★★_KPI런타임/internal-server/scripts/windows/restore-file-storage.ps1`

후속 조치:

- 두 스크립트 모두 `.env.production.local` 등 환경 파일의 `KPI_STORAGE_ROOT` 를 읽어 동작하도록 수정했다.
- 현재 기준으로는 `var/prod/files`, `var/prod/backups/file-storage` 를 직접 계산해 사용한다.
- `restore-file-storage.ps1` 프리뷰 문구도 더 이상 `overwrite var/files` 를 가리키지 않는다.

검증:

- PowerShell parser 검증 통과
- `backup-retention.ps1` 프리뷰 실행 시 `var/prod/backups/...` 해석 확인

판정 / Status:

- `RESOLVED_CONFIGURED_STORAGE_ROOT`

### B. 위 stale 스크립트를 연쇄로 물고 있던 상위 스크립트

초기 조사 시점에는 아래 스크립트가 같은 예전 backup root를 전제로 동작하고 있었다.

1. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-all.ps1`
   - `backup-file-storage.ps1` 를 호출하므로 A 항목의 영향을 받는 구조였다

2. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-retention.ps1`

3. `06_★★★_KPI런타임/internal-server/scripts/windows/report-serverization-readiness.ps1`

후속 조치:

- `backup-retention.ps1`, `report-serverization-readiness.ps1` 도 동일하게 `KPI_STORAGE_ROOT` 기준으로 수정했다.
- 현재 preview 기준으로 runtime backup root는 `var/prod/backups/runtime-snapshots`, file backup root는 `var/prod/backups/file-storage` 로 해석된다.
- `backup-all.ps1` 는 수정된 `backup-file-storage.ps1` 를 호출하므로 연쇄 stale 경로도 함께 정리된 상태다.

검증:

- `backup-retention.ps1` preview 결과
  - runtime snapshots root: `06_★★★_KPI런타임/internal-server/var/prod/backups/runtime-snapshots`
  - file-storage root: `06_★★★_KPI런타임/internal-server/var/prod/backups/file-storage`

판정 / Status:

- `RESOLVED_CONFIGURED_BACKUP_ROOT`

### C. 로그 경로가 둘로 갈라져 있음

현재 로그 경로는 둘로 갈라져 있다.

1. 앱 설정 기준 로그 루트
   - `var/prod/logs`
   - 근거: `06_★★★_KPI런타임/internal-server/src/config.js:118`

2. Windows 서버 기동/상태 보고 스크립트 기준 stdout/stderr 로그
   - `var\logs`
   - `start-server.ps1:11`
   - `report-serverization-readiness.ps1:9`
   - `report-serverization-readiness.ps1:163`
   - `report-serverization-readiness.ps1:164`

추가 확인:

- `var/logs` 에는 실제 `server.stdout.log`, `server.stderr.log` 가 존재한다.
- `var/prod/logs` 는 현재 비어 있다.
- `src/services/files.js` 는 `runtimePaths.logsRoot` (`var/prod/logs`) 디렉터리를 만들기는 한다.

영향 / Impact:

- 완전한 죽은 참조는 아니지만, **운영 로그 기준이 분리**되어 있어 사람이 보기에 헷갈린다.
- 이후 정리할 때 `stdout/stderr` 를 `var/logs` 로 유지할지, `var/prod/logs` 로 통일할지 결정이 필요하다.

판정 / Status:

- `SPLIT_PATH`

### D. 현재 실물 기준 비어 있었던 레거시/중복 폴더

초기 조사 시점에는 아래 폴더가 실파일 `0` 기준의 빈 껍데기였다.

1. `06_★★★_KPI런타임/internal-server/var/files`
2. `06_★★★_KPI런타임/internal-server/var/prod/files/유틸리티`
3. `06_★★★_KPI런타임/internal-server/var/prod/files/2026`

후속 조치:

- 세 폴더 모두 절대경로 검증 후 삭제했다.

현재 실제 사용 중인 첨부 루트:

- `06_★★★_KPI런타임/internal-server/var/prod/files/첨부파일`
   - 파일 `110`, 하위 디렉터리 `3`

현재 상태:

- 위 세 legacy 폴더는 모두 현재 파일시스템 기준 `exists = false`

판정 / Status:

- `REMOVED_EMPTY_ORPHAN_DIR`

### E. `var` 아래 런타임 흔적 중 유지 대상과 고아 흔적

#### E-1. 현재 스크립트가 아직 참조하는 것

`06_★★★_KPI런타임/internal-server/var/central-runtime`

- `initialize-central-runtime.ps1` 가 생성/사용
  - 근거: `06_★★★_KPI런타임/internal-server/scripts/windows/initialize-central-runtime.ps1:11`
- `start-local-postgres.ps1` 가 `var\central-runtime\postgres\data` 와 `...logs\postgres.log` 사용
  - 근거: `06_★★★_KPI런타임/internal-server/scripts/windows/start-local-postgres.ps1:9`
  - 근거: `06_★★★_KPI런타임/internal-server/scripts/windows/start-local-postgres.ps1:10`
- 운영 콘솔도 같은 postgres 로그 경로를 참조
  - 근거: `명령어/서버관리앱/ops-console/lib/paths.mjs:32`

판정:

- `ACTIVE_RUNTIME_ASSET`
- 지금 당장 삭제 후보로 보면 안 됨

#### E-2. 현재 코드 참조가 잡히지 않던 것

초기 조사 대상:

- `06_★★★_KPI런타임/internal-server/var/codex-postgres`

조사 결과:

- 저장소 전체에서 `codex-postgres` 문자열 참조는 발견되지 않았음
- 현재 활성 Postgres 프로세스는 `var/central-runtime/postgres/data` 만 사용 중이었음
- 실물 크기 약 `48.83 MB`, 구성 `data/`, `postgres.log`

후속 조치:

- active tree 밖으로 격리 이동 완료
- 현재 위치: `archive/legacy-runtime/codex-postgres-2026-04-16`

판정:

- `MOVED_TO_ARCHIVE_PENDING_FINAL_DELETE`

주의:

- 즉시 영구삭제는 하지 않았고, 문제 없다는 운영 확인 후 최종 삭제하면 된다.

### F. 저장소 안에서 확인한 제거 문서 흔적

현재 이 작업복사본에는 아래 문서가 없다.

- `central_server_deployment_plan_ko.md`
- `새컴퓨터_동일작업환경_세팅_프롬프트.md`
- `codex_master_onprem_web_system_blueprint.md`

초기 조사 시점에는 `AGENTS.md` 와 `서버이식_오버레이_작업가이드.md` 에서 위 문서명을 직접 참조하고 있었다.

후속 조치:

- `AGENTS.md` 에서 위 문서들을 권위 체인에서 제거함
- `서버이식_오버레이_작업가이드.md` 의 직접 참조를 현재 활성 권위 문서 표현으로 교체함

현재 판정 / Current status:

- `RESOLVED_REFERENCE_CLEANUP`

메모 / Note:

- 이 세 문서는 이제 현 저장소 기준 권위 문서 체인에 포함되지 않는다.

## 3. 우선순위별 정리 대상 / Cleanup priority

### 이번 작업에서 실제 정리한 것

- `backup-file-storage.ps1`
- `restore-file-storage.ps1`
- `backup-retention.ps1`
- `report-serverization-readiness.ps1`
- `06_★★★_KPI런타임/internal-server/var/files`
- `06_★★★_KPI런타임/internal-server/var/prod/files/유틸리티`
- `06_★★★_KPI런타임/internal-server/var/prod/files/2026`
- `06_★★★_KPI런타임/internal-server/var/codex-postgres` -> `archive/legacy-runtime/codex-postgres-2026-04-16`

결과:

- 운영 스크립트는 이제 `KPI_STORAGE_ROOT` 기준 경로를 사용한다.
- 빈 legacy 폴더 3개는 실제 삭제가 끝났다.

### 최종 삭제 전에 운영 확인이 필요한 것

- `archive/legacy-runtime/codex-postgres-2026-04-16`
  - active tree 밖으로는 뺐지만, 최종 영구삭제 전에는 며칠 정도 운영 확인이 안전함

### 현재 유지해야 하는 것

- `06_★★★_KPI런타임/internal-server/var/prod/files/첨부파일`
- `06_★★★_KPI런타임/internal-server/var/prod/backups/runtime-snapshots`
- `06_★★★_KPI런타임/internal-server/var/central-runtime`

## 4. 남은 정리 순서 / Remaining cleanup order

1. `archive/legacy-runtime/codex-postgres-2026-04-16` 최종 삭제 여부 결정
2. 로그 경로를 `var/logs` 유지로 둘지, `var/prod/logs` 로 통합할지 결정

## 5. 이번 정리에서 하지 않은 것 / Not changed in this cleanup

- DB 데이터 변경 없음
- `archive/legacy-runtime/codex-postgres-2026-04-16` 영구삭제 없음
- 실제 file-storage restore 실행 없음
- 로그 경로 통합 작업 없음

즉, 이번 정리는 **운영 스크립트의 저장 루트 정합성 확보 + 빈 legacy 폴더 삭제 + 고아 Postgres 흔적의 archive 격리 이동**까지만 진행했다.
