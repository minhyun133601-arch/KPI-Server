# 2026-05-08 Patch Note

Status: 작업내역 첨부 정리, 설비 이력카드 팀별 표시, 작업내역 달력 별/하위카테고리 표시, 작업내역 페이지 넘김, 앱 내부 뒤로가기를 반영했습니다.

## App Internal Back Navigation

Goal: 브라우저 뒤로가기/Backspace가 통합 관리 툴을 바로 빠져나가지 않고, 앱 내부 이전 화면으로 먼저 돌아가게 합니다.

Touched areas: KPI app browser adapter, app navigation history state, global modal/backspace handling, runtime shortcut closer return flow, work-history overlay close confirmation, frontend smoke tests.

Verification: `node --test kpi-runtime/internal-server/test/frontend/kpi-app-browser-adapter.smoke.js`, `node --test kpi-runtime/internal-server/test/frontend/work-history-view-actions.smoke.js`, `npm run smoke:work-history-view-actions`, `npm run smoke:work-history-core`, `npm run smoke:kpi-shell-css`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, and `npm run smoke:kpi-browser` passed.

Risk: 내부 탭/카테고리 이동은 `#kpi?...` 히스토리 상태로 복원합니다. 앱 첫 화면에서 더 돌아갈 내부 화면이 없을 때는 브라우저 기본 뒤로가기가 그대로 동작합니다.

## Work History Assignee Input Fix

Goal: 작업내역 기입/수정 시 작업자 칸에 `미정`이 자동으로 남지 않게 하고, 작업자 입력칸이 내용 때문에 아래로 늘어나지 않도록 한 줄 고정 입력으로 정리합니다.

Touched areas: work-history assignee normalization, record modal template, work-history modal CSS, asset cache version, work-history frontend smoke.

Verification: `node --check` for changed work-history records/layout/templates/record-actions/test JS and Repository Map history JS passed; `npm run smoke:work-history-core`, `npm run smoke:work-history-layout-templates`, `npm run smoke:work-history-render-print`, `npm run smoke:work-history-view-actions`, `npm run smoke:work-production`, `npm run smoke:kpi-shell-css`, `node --test test/frontend/repository-map-architecture.smoke.js test/frontend/ops-console-data-reference.smoke.js`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 여러 작업자는 기존처럼 쉼표로 구분해 저장하며, 줄바꿈 입력 안내/미리보기 pill은 입력칸 높이 밀림 방지를 위해 제거했습니다.

## Equipment Board Order And Status Quick Actions

Goal: 설비 이력카드 보드에서 이미 기입한 설비의 표시 순서를 바꾸고, 전체 카드 화면에서도 가동중/비가동중/정비중을 한 번씩 클릭할 때마다 순환 변경할 수 있게 합니다.

Touched areas: equipment-history item normalization/display order, board card render actions, board card status/order CSS, asset cache version, equipment-history render smoke.

Verification: `node --check` for changed equipment-history model/render/test JS and Repository Map history JS passed; `node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js`, `npm run smoke:kpi-shell-css`, `node --test test/frontend/repository-map-architecture.smoke.js test/frontend/ops-console-data-reference.smoke.js`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 순서 변경은 같은 팀 안의 설비끼리 위/아래 버튼으로 교환하며, 팀 lane 자체 정렬은 기존 팀 순서 기준을 유지합니다.

## Work Calendar History Highlight

Goal: 휴무 표시는 유지하되 작업내역이 있는 날짜칸은 테두리를 별도로 강조하고, `★ 하위카테고리` 네모와 글자 색은 휴무/평일 모두 같은 진한 작업내역 스타일로 보이게 합니다.

Touched areas: 작업 팀 달력 날짜칸 class, 작업내역 cue CSS, work CSS/team-calendar render asset cache version, work-team-calendar render smoke.

Verification: `node --check` for changed work-team-calendar render/test JS passed; `npm run smoke:work-team-calendar-render`, `npm run smoke:kpi-shell-css`, `npm run smoke:work-production`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 저장 데이터 구조는 바꾸지 않고 달력 강조 표시만 조정합니다.

## Equipment History Status Card Colors

Goal: 설비 이력카드 보드의 설비 네모가 상태별로 확실히 구분되도록 가동중은 초록, 비가동중은 빨강, 정비중은 노랑으로 통일합니다.

Touched areas: 설비 상태 메타, 설비 상태 토글, 설비 board card status class, 설비 board card CSS, asset cache version, equipment-history render smoke.

Verification: `node --check` for changed equipment-history model/form/render JS passed; `node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js`, `npm run smoke:kpi-shell-css`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 기존 점검중/점검예정 데이터는 정비중 노랑 카드로 표시되며, 저장 구조는 바꾸지 않습니다.

## Equipment History Team Header Trim

Goal: 설비 이력카드 팀별 보드 헤더는 `1팀 2파트` 같은 팀명만 남기고, 내부 설비 카드 네모는 팀 lane 색상 스타일에 휩쓸리지 않게 중립 톤으로 고정합니다.

Touched areas: 설비 이력카드 board header markup, 설비 board card CSS, data CSS/render asset cache version, equipment-history render smoke.

Verification: `node --check` for changed equipment-history render JS passed; `node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js`, `npm run smoke:kpi-shell-css`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 팀별 lane 구분과 정렬은 유지하고, 헤더 장식과 설비 카드 색상 번짐만 제거합니다.

## Work History Blank Cost Label

Goal: 작업내역 비용을 입력하지 않은 항목에 `자체처리` 문구를 표시하지 않고 빈 비용 표시는 `-`로 정리합니다.

Touched areas: 작업내역 비용 표시 formatter, 팀 달력 작업내역 비용 fallback, asset cache version, work-history/work-production smoke.

Verification: `node --check` for changed work-history/work-production JS passed; `npm run smoke:work-history-layout-templates`, `npm run smoke:work-history-core`, `npm run smoke:work-production`, `git diff --check`, `npm run format:check`, `npm run lint`, and `npm run verify:server-structure` passed.

Risk: 저장 데이터 구조는 바꾸지 않고 비용 미입력 표시 문구만 바꿉니다.

## Work History Pagination

Goal: 작업내역 목록을 길게 드래그해 내리는 방식 대신 1, 2, 3 번호 버튼과 이전/다음으로 페이지를 넘기게 합니다.

Touched areas: 작업내역 전체/팀별 목록 렌더링, 페이지 상태, 검색/카테고리/날짜 필터 초기화, 페이지 버튼 CSS, work-history frontend smoke.

Verification: `node --check` for changed pagination/render/action JS passed; `npm run smoke:work-history-render-card-parts`, `npm run smoke:work-history-view-actions`, `npm run smoke:work-history-layout-templates`, `npm run smoke:work-history-render-print`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 저장 데이터 구조는 바꾸지 않고 화면에 한 번에 표시하는 작업내역 개수만 8개 단위로 나눕니다.

## Work History Cost Input

Goal: 작업내역 비용 입력은 숫자만 남기고, 화면에 표시되는 작업내역 비용은 `1억 5천만원` 같은 만원 단위로 줄여 보여줍니다.

Touched areas: 작업내역 비용 normalize, 입력창 sanitizing, 작업내역 비용 표시 formatter, 팀 달력 작업내역 비용 요약, work-history/work-production frontend smoke.

Verification: `node --check` for changed work-history JS passed; targeted `node --test` for work-history core/layout/card/print and work-production passed; `npm run smoke:work-history-core` passed; `npm run smoke:work-production` passed.

Risk: 저장값은 기존처럼 원 단위 숫자로 유지하고 표시 포맷만 줄였습니다. 1만원 미만 금액은 `1만원 미만`으로 표시됩니다.

## Work Calendar History Cues

Goal: 작업내역으로 기입한 항목이 팀 달력 날짜칸에서 더 크게 보이고, 우측 상단 별 카운트 없이 각 항목 앞에 별과 하위카테고리만 표시되게 합니다.

Touched areas: 작업내역 월간 요약 생성, 팀 달력 날짜칸 작업내역 cue 렌더링, 작업 달력 CSS, shell asset cache version, work-production/team-calendar frontend smoke.

Verification: `node --check` for changed work-history/team-calendar JS passed; targeted `node --test` for work-production, work-team-calendar-render, and kpi-shell-css passed; `npm run smoke:work-production`, `npm run smoke:work-team-calendar-render`, `npm run smoke:work-renderers`, `npm run smoke:work-history-core`, `node --test test/frontend/ops-console-data-reference.smoke.js`, `npm run format:check`, `npm run lint`, `npm run verify:server-structure`, `git diff --check`, and `npm run smoke:kpi-browser` passed.

Risk: 저장 데이터는 바꾸지 않고 달력 표시용 요약과 렌더링만 조정했습니다. 날짜칸에는 최대 2개 하위카테고리를 먼저 보여주고 초과분은 `+N건`으로 축약합니다.

## Equipment History Team Board

Goal: 설비 이력카드 보드에서 작성된 카드를 팀별로 더 명확하게 구분하고, 각 팀 lane을 팀별 내역서의 색상/아이콘/공정 컨셉과 맞춰 보여줍니다.

Touched areas: 설비 이력카드 팀 그룹 정렬, 팀별 보드 lane header, 팀별 내역서 메타 adapter 연결, 설비 선택 드롭다운 optgroup, data CSS, equipment-history render smoke.

Verification: `node --check` for changed equipment-history JS passed; `node --test kpi-runtime/internal-server/test/frontend/equipment-history-render.smoke.js` passed; `npm run format:check` passed; `npm run lint` passed; `npm run verify:server-structure` passed with warningCount 0; `npm run smoke:kpi-browser` passed.

Risk: 저장 데이터 구조는 바꾸지 않고 화면 그룹/정렬과 팀 컨셉 표시만 조정했습니다.

## Work History Attachments

Goal: 작업 제목 영역에 청구서/첨부 파일명이 섞이지 않게 하고, 첨부 문서를 보고서/견적서/기타로 구분합니다.

Touched areas: 작업내역 첨부 슬롯, 첨부 파일명 생성 규칙, 작업내역 카드 제목 생성, 서버 문서 저장 폴더, 기존 work.history 문서 카테고리 repair script, Data Reference Map, 관련 smoke/unit tests.

Data repair: PostgreSQL dump `kpi-runtime/internal-server/var/prod/backups/postgres-dumps/postgres-dump-20260508-092642.dump` created before write. `npm run repair:work-history-attachment-categories -- --write` updated 11 work.history document rows, copied 1 legacy billing file into the new 기타 folder, skipped 0 missing files, and moved `work_history_records` from version 29 to 30. Follow-up preview now reports legacyDocumentCount 0 and payload changed false.

Verification: `node --check` for changed runtime/public JS passed; targeted work-history smoke tests passed; one-shot repair tests passed; `npm run smoke:work-production` passed; `npm run smoke:work-renderers` passed; `node --test test/lib/document-storage.test.js test/frontend/ops-console-data-reference.smoke.js` passed; `npm run format:check` passed; `npm run lint` passed; `npm run verify:server-structure` passed with warningCount 0; `npm run smoke:kpi-browser` passed.

Risk: 기존 `billing` 첨부는 `기타` 슬롯으로 정규화됐고 DB 참조는 `report_document|estimate_document|other_document`만 사용합니다. 원본 레거시 파일은 삭제하지 않았습니다. `npm run verify` 전체 게이트는 작업내역과 무관한 기존 audit records threshold/global-access 실패 및 `var/backups/code-patches` 백업 테스트 발견으로 blocked.

---

# 2026-05-07 Patch Note

Status: KPI-local reference frontend import completed for equipment history cards, legal facility entry, and team-calendar equipment summaries.

## KPI-local Frontend Import

Goal: bring the reviewed KPI-local equipment history card writing flow and legal facility entry flow into the company runtime while preserving company paths, ports, and storage boundaries.

Touched areas: equipment history form/model/render, legal facility form/render, team calendar equipment-summary integration, KPI boot manifest, shared work category mapping, related styles, frontend smoke tests, and browser smoke coverage.

Verification: targeted frontend smoke tests passed; `npm run format:check` passed; `npm run lint` passed; `npm run verify:server-structure` passed; `npm run smoke:kpi-browser` passed after updating stale assertions for empty legal-facility data and the current monthly performance popup.

Follow-up: equipment history card photo upload now renders as a one-image preview after selection, without keeping the photo upload trigger visible or clickable.

Follow-up: equipment history card keeps the sidebar/table-of-contents label as "설비 이력 카드", while the authoring header uses the selected team and equipment name instead of KPI/management-record branding.

Follow-up: equipment history card authoring now includes an optional Korean text "실" field beside team, saves it with the record, and shows the header as team, room, and equipment name at matching title size.

Follow-up: equipment history card authoring removed the visible basic-info panel and expands the equipment photo area across the former basic-info space.

Follow-up: equipment history card authoring removed the header helper text, made team, room, and equipment title text the same neutral color and smaller size, and restored the expanded photo area to its original height after the smaller preview cropped attached images.

Follow-up: equipment history card authoring now supports deleting saved cards, toggling run status beside the equipment name, and showing only running/stopped status on the board instead of utilization rate.

Follow-up: equipment history card detailed-info authoring now uses a fixed two-column memo-style input grid; pressing Enter moves to the next cell and adds rows automatically.

Follow-up: equipment history card top area now keeps attached photos uncropped with contain-fit, uses a 3:1 photo/info layout, and limits the side inputs to process, utilization rate, and vendor.

Follow-up: equipment history status toggles and photo attachments now auto-save, and attached photos include a revert button that clears the photo and removes the stored file when possible.

Follow-up: equipment history detailed-info rows now have a delete button again, and the item-name column is narrower.

Follow-up: equipment history starts detailed-info authoring with one row, shows the photo revert control only while hovering/focusing the photo, and now matches maintenance/document sections with a detailed-info add-row button plus reliable row delete/clear behavior.

Follow-up: utility metering gas settlement inputs now keep the active manual field unformatted while typing, refresh calculated fields separately, and derive a missing LNG calorific value from stored billed quantity plus monthly usage when old data only has billed quantity.

Risk: no KPI-local runtime data, env files, uploads, logs, or secrets were copied. The browser smoke created one sample equipment-history row during verification; that exact sample row was removed and rechecked.

---

# 2026-05-06 Patch Note

Status: KPI Server env handling now follows the portable single-env-file runtime pattern.

## Goal

Make `KPI-Server` run from one carried env file copied into `kpi-runtime/internal-server/.env.production.local`, without secret folder indirection or file-path secret variables.

## Touched Areas

- Runtime config env selection: `kpi-runtime/internal-server/src/config.js`.
- Windows runtime scripts: initialize, start, DB console, PostgreSQL dump backup, file-storage backup/restore preview, retention preview, readiness report.
- Ops console server launcher env handoff.
- Placeholder-only env examples.
- Repository Map daily history.

## Verification

- PowerShell parser check for changed scripts: pass.
- `node --check` for changed Node/MJS files: pass.
- `start-central-stack.ps1`: pass.
- `start-server.prod.ps1 -ForceRestart`: pass.
- `/api/health`: pass, authenticated server with DB ok.
- DB connection through `open-db-console.ps1`: pass, `kpi_internal` as `kpi_app`.
- Login API test with existing local e2e account: pass, `/api/auth/login` 200 and `/api/auth/me` 200.
- Backup scripts: PostgreSQL custom dump pass; file-storage backup pass; retention preview pass.
- Restore script preview: pass without `-Force`.
- `git check-ignore`: `.env`, `.env.*.local`, and `var/` ignored; example env files not ignored.
- `git status --ignored`: ignored runtime/env files remain untracked.
- `npm run format:check`: pass.
- `npm run lint`: pass.
- `npm run verify:server-structure`: pass, warningCount 0.
- `node --test` over tracked `test/**/*.js`: pass, 677 tests.
- `npm test`: blocked by an ignored `var/backups/code-patches/.../untracked-files/...smoke.js` backup artifact being discovered by Node's default test search, unrelated to this patch.
- `git diff --check`: pass.

## Risk

No real password was printed or added to tracked files. The existing ignored `.env.production.local` and `.env` were locally supplemented with the PostgreSQL superuser key copied from the old ignored runtime secret so this machine continues to start from the env file directly. Initial owner login env keys are documented in examples; this machine did not have an old initial-owner password file to migrate.

---

## Production Import Data Repair

Goal: keep existing production rows on import and normalize `1팀 1파트` blank/MSD line names to stored `MSD`.

Touched areas: production import merge logic, production extractor copy, report delta line-bucket tests, and current DB production rows.

Verification: pre-repair PostgreSQL dump created; targeted production/report smoke tests passed; `node --check` passed; `/api/health` passed with DB ok; DB now has 12,769 production rows, `1팀 1파트` blank/dash line rows 0 and `MSD` line rows 1,685; `npm run lint`, `npm run format:check`, `npm run smoke:kpi-root`, and `git diff --check` passed.

Risk: existing `MSD 건조` 1,544 rows and blank 141 rows were normalized to `MSD`; no duplicate rows were deleted.

---

## Analysis Sheet Standalone Export

Goal: make extracted gas/electric analysis HTML keep usable popup, range, unit/display/label controls, basis selectors, combined toggle states, and horizontal chart drag scrolling.

Touched areas: `utility/runtime/util/report/sheet/modal/shell.js` and `report-sheet-modal-shell` smoke coverage.

Verification: `node --check` for modal shell passed; targeted report sheet modal/actions/chart/popup/panel tests passed; Playwright memory-page smoke passed for standalone team -> unit -> display toggles, popup open, and transparent chart-hit drag scroll; `/api/health` passed; `npm run smoke:kpi-root` passed; `git diff --check` passed.

Follow-up: fixed an analysis export stall risk by limiting heavy interaction variant generation to the active extracted range and stopping combined variant generation immediately at the cap. Added guarded export error handling so a failed export reports a controlled message instead of leaving the UI stuck.

Risk: standalone export prebuilds interaction variants from the active extracted range and caps combined variant generation. Common sequential selector/unit/display/label changes are covered; very large combination sets may still fall back to the latest prebuilt change.
