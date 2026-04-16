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

### A. `var/files` 를 직접 가리키는 stale 스크립트

다음 스크립트는 현재 운영 경로 `var/prod/files` 가 아니라 **예전 기본 루트 `var/files`** 를 직접 가리킨다.

1. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-file-storage.ps1`
   - `var\files` 를 백업 원본으로 사용
   - 근거: `:4`
   - `var\backups\file-storage` 를 백업 목적지로 사용
   - 근거: `:5`

2. `06_★★★_KPI런타임/internal-server/scripts/windows/restore-file-storage.ps1`
   - `var\backups\file-storage` 에서 읽음
   - 근거: `:9`
   - `var\files` 로 복원함
   - 근거: `:10`
   - 프리뷰 문구도 `overwrite var/files` 라고 적혀 있음
   - 근거: `:47`

영향 / Impact:

- 지금 이 상태로 실행하면 **현재 첨부파일 110건이 있는 `var/prod/files` 는 건드리지 못한다.**
- `backup-file-storage.ps1` 는 사실상 빈 `var/files` 를 백업할 가능성이 높다.
- `restore-file-storage.ps1` 는 현재 루트가 아닌 예전 루트로 복원한다.

판정 / Status:

- `STALE_REF`

### B. 위 stale 스크립트를 연쇄로 물고 있는 상위 스크립트

다음 스크립트들은 위 A 항목을 간접 호출하거나, 같은 예전 backup root를 기준으로 보고서를 만든다.

1. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-all.ps1`
   - `backup-file-storage.ps1` 를 직접 호출
   - 결과적으로 파일 백업 단계가 예전 `var/files` 기준이 된다

2. `06_★★★_KPI런타임/internal-server/scripts/windows/backup-retention.ps1`
   - runtime snapshot retention root를 `var\backups\runtime-snapshots` 로 잡음
   - 근거: `:64`
   - file-storage retention root를 `var\backups\file-storage` 로 잡음
   - 근거: `:65`

3. `06_★★★_KPI런타임/internal-server/scripts/windows/report-serverization-readiness.ps1`
   - runtime backup root를 `var\backups\runtime-snapshots` 로 잡음
   - 근거: `:165`
   - file backup root를 `var\backups\file-storage` 로 잡음
   - 근거: `:166`
   - `restore-file-storage.ps1` 프리뷰를 그대로 호출함
   - 근거: `:173`

반면 현재 Node 쪽 runtime snapshot 스크립트는 `config.storageRoot/backups/runtime-snapshots`, 즉 **`var/prod/backups/runtime-snapshots`** 를 쓴다.

- 근거: `06_★★★_KPI런타임/internal-server/src/scripts/backupRuntimeSnapshot.js:33`

실물 상태:

- 현재 존재: `06_★★★_KPI런타임/internal-server/var/prod/backups/runtime-snapshots`
- 현재 없음: `06_★★★_KPI런타임/internal-server/var/backups`

영향 / Impact:

- readiness report 와 retention preview 가 **현재 백업 위치를 놓치거나 빈 경로를 보는** 상태다.
- runtime snapshot 은 `var/prod/backups/...` 에 생성되는데, 운영 스크립트는 `var/backups/...` 를 보고 있다.

판정 / Status:

- `STALE_REF`

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

### D. 현재 실물 기준 비어 있는 레거시/중복 폴더

아래 폴더들은 현재 실물 파일이 없고, DB 기준 살아 있는 첨부 경로도 아니다.

1. `06_★★★_KPI런타임/internal-server/var/files`
   - 파일 `0`, 하위 디렉터리 `0`
   - 의미: 예전 기본 storage root의 빈 껍데기

2. `06_★★★_KPI런타임/internal-server/var/prod/files/유틸리티`
   - 파일 `0`, 하위 디렉터리 `2`
   - 하위 폴더:
     - `가스 청구서`
     - `전기 청구서`
   - 의미: `첨부파일/유틸리티/...` 로 통일되기 전/중간 단계 흔적 가능성이 높음

3. `06_★★★_KPI런타임/internal-server/var/prod/files/2026`
   - 파일 `0`, 하위 디렉터리 `2`
   - 하위 폴더:
     - `04`
     - `04/15`
   - 의미: 날짜 기반 임시 구조 또는 migration 흔적로 보이나, 현재 코드/DB 참조는 발견되지 않음

현재 실제 사용 중인 첨부 루트:

- `06_★★★_KPI런타임/internal-server/var/prod/files/첨부파일`
   - 파일 `110`, 하위 디렉터리 `3`

판정 / Status:

- `EMPTY_ORPHAN_DIR`

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

#### E-2. 현재 코드 참조가 잡히지 않는 것

`06_★★★_KPI런타임/internal-server/var/codex-postgres`

- 실제 PostgreSQL 데이터 디렉터리/로그 파일이 남아 있음
- 하지만 현재 저장소 전체에서 `codex-postgres` 문자열 참조는 발견되지 않음

판정:

- `LIKELY_ORPHAN_RUNTIME`

주의:

- 이 폴더는 빈 폴더가 아니라 **실데이터가 들어 있는 별도 Postgres cluster 흔적**이므로, 삭제 전에는 외부 백업/용도 확인이 먼저다.

### F. 저장소 안에서 실제로 끊어진 문서 참조

현재 이 작업복사본에는 아래 문서가 없다.

- `central_server_deployment_plan_ko.md`
- `새컴퓨터_동일작업환경_세팅_프롬프트.md`
- `codex_master_onprem_web_system_blueprint.md`

그런데 `AGENTS.md` 는 이 문서들을 반복적으로 권위/참조 문서로 가리킨다.

- 근거:
  - `AGENTS.md:24`
  - `AGENTS.md:25`
  - `AGENTS.md:65`
  - `AGENTS.md:69`
  - `AGENTS.md:77`
  - `AGENTS.md:85`
  - `AGENTS.md:103`
  - `AGENTS.md:145`
  - `AGENTS.md:425`

또한 `서버이식_오버레이_작업가이드.md` 도 `central_server_deployment_plan_ko.md` 를 함께 읽으라고 적고 있다.

- 근거: `서버이식_오버레이_작업가이드.md:90`

판정 / Status:

- `MISSING_DOC_REF`

영향 / Impact:

- 사람/AI 모두 “권위 문서 체인”을 따라가려다 중간에서 끊긴다.
- 이 저장소 단독으로 보면 운영 기준 문서가 비어 있는 상태다.

## 3. 우선순위별 정리 대상 / Cleanup priority

### 바로 삭제 검토 가능한 것

다음은 **현재 조사 기준으로는 빈 폴더**다.

- `06_★★★_KPI런타임/internal-server/var/files`
- `06_★★★_KPI런타임/internal-server/var/prod/files/유틸리티`
- `06_★★★_KPI런타임/internal-server/var/prod/files/2026`

단, 삭제 전에 묶어서 확인할 것:

- `backup-file-storage.ps1`
- `restore-file-storage.ps1`
- `backup-all.ps1`
- `backup-retention.ps1`
- `report-serverization-readiness.ps1`

이 다섯 군데가 아직 예전 경로나 빈 경로를 보고 있기 때문에, 스크립트를 먼저 맞추지 않으면 “폴더는 지웠는데 운영 스크립트는 계속 옛 경로를 찾는” 상태가 된다.

### 삭제 전에 외부 확인이 반드시 필요한 것

- `06_★★★_KPI런타임/internal-server/var/codex-postgres`
  - 코드 참조는 안 잡히지만 실데이터가 들어 있는 Postgres cluster 흔적이라 바로 지우면 안 됨

### 현재 유지해야 하는 것

- `06_★★★_KPI런타임/internal-server/var/prod/files/첨부파일`
- `06_★★★_KPI런타임/internal-server/var/prod/backups/runtime-snapshots`
- `06_★★★_KPI런타임/internal-server/var/central-runtime`

## 4. 권장 정리 순서 / Recommended cleanup order

1. 운영 권위 경로를 명시적으로 확정
   - files: `var/prod/files`
   - runtime snapshot backups: `var/prod/backups/runtime-snapshots`
   - stdout/stderr logs: `var/logs` 유지 여부 또는 `var/prod/logs` 통합 여부

2. Windows 운영 스크립트 경로 정리
   - `backup-file-storage.ps1`
   - `restore-file-storage.ps1`
   - `backup-all.ps1`
   - `backup-retention.ps1`
   - `report-serverization-readiness.ps1`
   - 필요하면 `start-server.ps1` 로그 경로도 함께 결정

3. 빈 레거시 폴더 삭제
   - `var/files`
   - `var/prod/files/유틸리티`
   - `var/prod/files/2026`

4. 문서 참조 정리
   - 권위 문서가 실제로 이 저장소에 있어야 하는지
   - 아니면 `AGENTS.md` 에서 외부 저장소 의존으로 명시할지 결정

5. `var/codex-postgres` 용도 확인 후 보관/삭제 결정

## 5. 이번 조사에서 하지 않은 것 / Not changed in this audit

- 코드 수정 없음
- 폴더 삭제 없음
- DB 데이터 변경 없음
- 백업/복원 스크립트 실행 없음

즉, 이 문서는 **현황 조사 문서**이며 아직 정리 작업은 시작하지 않았다.
