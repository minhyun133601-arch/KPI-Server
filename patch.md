# patch.md
작성일 / Date: `2026-04-23`
개정일 / Revised: `2026-04-29`
상태 / Status: `supporting material only`
기준 문서 / Authority reference: `AGENTS.md`

## Architecture First / 아키텍처 먼저 보기

### Current Repo Tree / 현재 저장소 트리
```text
KPI-Server/
|-- AGENTS.md
|-- patch.md
|-- 비전공자용.md
|-- KPI.html
|-- .github/
|-- .husky/
|-- shared-assets/
|   `-- logo.jpg
|-- kpi-runtime/
|   |-- app/
|   |   |-- KPI.app.js
|   |   |-- KPI.app.navigation.js
|   |   |-- KPI.app.global-save.js
|   |   |-- KPI.app.viewer.js
|   |   `-- styles/
|   |       |-- audit/
|   |       |-- metering/
|   |       |-- shell/
|   |       `-- work/
|   |-- core/
|   |   `-- KPI.core.js
|   |-- sections/
|   |   |-- KPI.section.builders.js
|   |   |-- KPI.section.registry.js
|   |   `-- KPI.sections.owner.js
|   `-- internal-server/
|       |-- package.json
|       |-- src/
|       |   |-- server.js
|       |   |-- request-router.js
|       |   |-- config.js
|       |   |-- db/
|       |   |-- routes/
|       |   |-- services/
|       |   |-- repositories/
|       |   |-- lib/
|       |   `-- scripts/
|       |-- test/
|       |-- e2e/
|       |-- deploy/
|       `-- scripts/windows/
|-- utility/
|   |-- apps/
|   |   |-- metering/
|   |   |   |-- app.js
|   |   |   |-- billing/
|   |   |   |-- calendar/
|   |   |   |-- equipment/
|   |   |   |-- runtime/
|   |   |   |-- save/
|   |   |   |-- team-monthly/
|   |   |   |-- team-overview/
|   |   |   `-- team-settlement/
|   |   `-- production-extractor/
|   |       |-- app.js
|   |       |-- production-extractor.html
|   |       `-- runtime/
|   `-- runtime/
|       `-- util/
|           |-- KPI.util.runtime.js
|           |-- KPI.util.data-sync.js
|           |-- analytics/
|           |-- energy/
|           |-- integration/
|           |-- production/
|           |-- report/
|           `-- sections/
|-- team-report/
|   |-- runtime/
|   |   `-- work/
|   |       |-- KPI.work.runtime.js
|   |       |-- history/
|   |       `-- sections/
|   `-- work-log/
|       `-- teams/
|-- data-entry/
|   `-- runtime/data/sections/
|-- audit/
|   `-- runtime/audit/
|       |-- KPI.audit.runtime.js
|       |-- records/
|       `-- sections/
|-- commands/
|   |-- open-ops-console.cmd
|   |-- close-ops-console.cmd
|   `-- ops-console-app/
|       |-- ops-console/
|       |   |-- server.mjs
|       |   |-- lib/
|       |   `-- public/
|       |-- scripts/
|       `-- var/
`-- work-log/
```

### Tree Notes / 트리 메모
- `AGENTS.md` is the authority doc. `patch.md` and `비전공자용.md` are supporting docs.
- `node_modules/`, `kpi-runtime/internal-server/.codex-run/`, `kpi-runtime/internal-server/var/` are excluded from the main tree because they are dependencies or runtime artifacts.

## 2026-04-29 - Owner Demo Clickable Preview Tabs / 오너 시연 클릭형 미리보기 탭

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/
    |-- sections/
    |   `-- KPI.sections.owner.js
    `-- internal-server/test/frontend/
        `-- owner-section-demo.smoke.js
```

### Summary / 요약
- Changed the owner demo workbench from disabled tab buttons to CSS-only clickable tabs for `서버 관리`, `계정 관리`, and `Repository Map`.
- Added preview-only toggle switches in the server and account panels. They change visually in the browser but do not call APIs or persist data.
- Kept destructive server, DB, backup, and account action buttons disabled so the demo remains presentation-only.
- Set the Repository Map iframe to eager loading so the map is visible immediately when the demo tab is selected.

### Changed Files / 변경 파일
- `kpi-runtime/sections/KPI.sections.owner.js`
- `kpi-runtime/internal-server/test/frontend/owner-section-demo.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `node --check ../../kpi-runtime/sections/KPI.sections.owner.js` -> `pass`
- `node --test test/frontend/owner-section-demo.smoke.js test/frontend/owner-demo-navigation.smoke.js` -> `pass (4/4)`
- Live owner-demo interaction check on verification port `3192`: account tab became visible, a demo toggle changed from checked to unchecked, repository tab showed `/owner/repository-map?maxDepth=50&demo=1`, `tabCount=3`, `switchCount=6`, and all action buttons stayed disabled.

### Notes / 메모
- No script, fetch, storage mutation, or backend command was added to the owner demo content. The clickable behavior is HTML/CSS preview behavior only.

## 2026-04-29 - Owner Repository Map Full Shell Reuse / 오너 리포지토리 맵 전체 화면 재사용

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- commands/
|   `-- ops-console-app/ops-console/public/
|       `-- repository-map.js
`-- kpi-runtime/internal-server/
    |-- src/
    |   |-- lib/owner-repository-map-page.js
    |   |-- request-router.js
    |   `-- routes/owner-routes.js
    `-- test/routes/
        `-- owner-repository-map-page.test.js
```

### Summary / 요약
- Replaced the simplified owner-only Repository Map page with the full `commands/ops-console-app/ops-console/public/repository-map.html` shell from the Repository Map bundle.
- Added `/owner/repository-map.js`, served through the owner route, so the owner page can reuse the same rich Repository Map client without exposing the whole `commands/` tree as KPI static content.
- Updated the shared Repository Map client to call `/api/owner/repository-map?maxDepth=50` when it is loaded under `/owner/repository-map`, while keeping `/api/repository-map?maxDepth=50` for the ops-console page.
- Added route-level tests to lock that the owner page uses the full shell, the owner script route, and the owner-only API endpoint.

### Changed Files / 변경 파일
- `commands/ops-console-app/ops-console/public/repository-map.js`
- `kpi-runtime/internal-server/src/lib/owner-repository-map-page.js`
- `kpi-runtime/internal-server/src/request-router.js`
- `kpi-runtime/internal-server/src/routes/owner-routes.js`
- `kpi-runtime/internal-server/test/routes/owner-repository-map-page.test.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `node --test test/routes/owner-repository-map-page.test.js test/services/repository-map.test.js test/frontend/owner-section-demo.smoke.js` -> `pass (7/7)`
- `node --check src/lib/owner-repository-map-page.js` -> `pass`
- `node --check ../../commands/ops-console-app/ops-console/public/repository-map.js` -> `pass`
- `node --check src/routes/owner-routes.js` -> `pass`
- `node --check src/request-router.js` -> `pass`
- Live check on verification port `3192`: `/owner/repository-map` returned HTTP `200`, used `/owner/repository-map.js`, the script used `/api/owner/repository-map?maxDepth=50`, and the browser rendered `606` tree nodes with `102` directories and `503` files.
- `npm run format:check` -> `pass`
- `npm run lint` -> `pass`
- `npm run verify` -> `pass (436 tests)`
- `KPI_AUTH_ENABLED=false KPI_LOGIN_ENABLED=false KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser` -> `pass`

### Notes / 메모
- The `commands/` tree is still not broadly exposed through KPI static serving. Only the owner-protected Repository Map page/script route reuses the ops-console map files.
- Secret/env files, runtime artifacts, install outputs, private work-log content, and binary attachments remain excluded from the map.

## 2026-04-29 - Owner Demo Navigation Visibility / 오너 시연 목차 표시 보강

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/
    |-- app/
    |   |-- KPI.app.js
    |   |-- KPI.app.navigation.js
    |   |-- KPI.app.viewer.js
    |   `-- styles/shell/dashboard.css
    |-- sections/
    |   `-- KPI.sections.owner.js
    `-- internal-server/test/frontend/
        |-- owner-demo-navigation.smoke.js
        `-- owner-section-demo.smoke.js
```

### Summary / 요약
- Kept the real `오너 전용` parent as a direct-launch popup entry, but now keeps its child navigation visible when it has renderable categories.
- Updated both dashboard side navigation and viewer sidebar paths so `오너 전용 (시연)` appears directly under `오너 전용` for owner users.
- Reused the parent owner visual identity for the demo child: `fa-shield-halved` and `#7c3aed`.
- Added a frontend smoke guard that checks the direct-launch submenu visibility contract in the split and bundled navigation files.

### Changed Files / 변경 파일
- `kpi-runtime/app/KPI.app.js`
- `kpi-runtime/app/KPI.app.navigation.js`
- `kpi-runtime/app/KPI.app.viewer.js`
- `kpi-runtime/app/styles/shell/dashboard.css`
- `kpi-runtime/sections/KPI.sections.owner.js`
- `kpi-runtime/internal-server/test/frontend/owner-demo-navigation.smoke.js`
- `kpi-runtime/internal-server/test/frontend/owner-section-demo.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `node --test test/frontend/owner-section-demo.smoke.js test/frontend/owner-demo-navigation.smoke.js` -> `pass (4/4)`
- `npm run format:check` -> `pass`
- `npm run lint` -> `pass`
- `npm run verify` -> `pass (434 tests)`
- `KPI_AUTH_ENABLED=false KPI_LOGIN_ENABLED=false KPI_SERVER_PORT=3192 KPI_BASE_URL=http://127.0.0.1:3192 npm run smoke:kpi-browser` -> `pass`
- Live DOM check on verification port `3192` with an owner current-user bootstrap: sidebar `오너 전용` rendered as `sidebar-group is-expanded`, `오너 전용 (시연)` was visible, and clicking it opened the demo screen with `/owner/repository-map?maxDepth=50&demo=1`.

### Notes / 메모
- Open verification mode without a current user still hides `ownerOnly` UI by design. The DOM visibility check injected only the browser bootstrap current-user object as owner; it did not create or change any database account.

## 2026-04-29 - Repository Map Full Path Recovery / 리포지토리 맵 전체 경로 복구

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- commands/
|   `-- ops-console-app/ops-console/public/
|       `-- repository-map.js
`-- kpi-runtime/
    |-- sections/
    |   `-- KPI.sections.owner.js
    `-- internal-server/
        |-- src/
        |   |-- lib/owner-repository-map-page.js
        |   |-- routes/owner-routes.js
        |   `-- services/repository-map.js
        `-- test/
            |-- frontend/owner-section-demo.smoke.js
            `-- services/repository-map.test.js
```

### Summary / 요약
- Changed the repository-map scanner default depth from `7` to `50`, capped at `60`, so the owner map loads the full safe repository tree instead of a shallow partial tree.
- Added root-path recovery: if an invalid source root is requested, the scanner falls back to the current repository root instead of returning an empty map.
- Added `rootPath`, `requestedRoot`, and `rootFallback` to the repository-map API response so the UI can show which storage path was scanned.
- Updated owner routes and owner repository-map page to request `maxDepth=50`.
- Updated `오너 전용 (시연)` so its Repository Map area uses the same owner repository-map page through `/owner/repository-map?maxDepth=50&demo=1`.
- Added an operations-console fallback tree that includes the `KPI-local.git` reference URL, so the Repository Map panel is not blank even if the live map API is unavailable.
- Confirmed the provided reference repository `https://github.com/minhyun133601-arch/KPI-local.git` is the older local tree shape; this patch keeps the current serverized repo layout and uses that URL as a visible fallback reference rather than reverting the serverized paths.

### Changed Files / 변경 파일
- `commands/ops-console-app/ops-console/public/repository-map.js`
- `kpi-runtime/sections/KPI.sections.owner.js`
- `kpi-runtime/internal-server/src/lib/owner-repository-map-page.js`
- `kpi-runtime/internal-server/src/routes/owner-routes.js`
- `kpi-runtime/internal-server/src/services/repository-map.js`
- `kpi-runtime/internal-server/test/frontend/owner-section-demo.smoke.js`
- `kpi-runtime/internal-server/test/services/repository-map.test.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `node --test test/services/repository-map.test.js` -> `pass`
- `node --test test/frontend/owner-section-demo.smoke.js` -> `pass`
- `node --check ../../commands/ops-console-app/ops-console/public/repository-map.js` -> `pass`
- `node --check ../../kpi-runtime/sections/KPI.sections.owner.js` -> `pass`
- `node --check src/lib/owner-repository-map-page.js` -> `pass`
- Direct scanner check -> `ok`, `maxDepth=50`, root path `C:\Users\user\Desktop\KPI-Server`, directories `102`, files `501`
- `npm run format:check` -> `pass`
- `npm run lint` -> `pass`
- `npm run verify` -> `pass` (`432` tests passed)
- `npm run smoke:kpi-browser` on `KPI_SERVER_PORT=3192`, `KPI_BASE_URL=http://127.0.0.1:3192` -> `pass`
- Direct `3192` owner map check -> `/api/owner/repository-map?maxDepth=50` returned `ok=true`, directories `102`, files `501`; `/owner/repository-map?maxDepth=50` returned HTTP `200`

### Notes / 메모
- The map still excludes secret/env files, runtime artifacts, install/build outputs, private work-log contents, and binary attachments.
- The demo page now shares the same owner repository-map screen, so if the real map is visible, the owner demo shows the same map instead of a tiny hardcoded tree.

## 2026-04-29 - Owner Console Static Demo Category / 오너 콘솔 정적 시연 목차

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/
    |-- sections/
    |   `-- KPI.sections.owner.js
    `-- internal-server/
        |-- e2e/
        |   `-- kpi-browser.playwright.js
        `-- test/frontend/
            `-- owner-section-demo.smoke.js
```

### Summary / 요약
- Added an owner-only child navigation item named `오너 전용 (시연)` under the existing `오너 전용` section.
- Kept the real owner console parent launch behavior unchanged, while the demo child has no `launchUrl` and renders only static preview HTML inside the KPI viewer.
- Mirrored the visible shape of the current owner operations console: hero area, canonical port chips (`3100`, `5434`, `3192`), status cards, server/account/repository-map tabs, logs, DB tools, account table, and repository tree.
- Disabled all demo buttons and avoided script/fetch/API calls so the screen is presentation-only and safe to show from another computer.
- Ran `npm run format:write` because the repository formatter gate was already failing on `e2e/kpi-browser.playwright.js`; only Prettier formatting was applied there.

### Changed Files / 변경 파일
- `kpi-runtime/sections/KPI.sections.owner.js`
- `kpi-runtime/internal-server/test/frontend/owner-section-demo.smoke.js`
- `kpi-runtime/internal-server/e2e/kpi-browser.playwright.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `node --test test/frontend/owner-section-demo.smoke.js` -> `pass`
- `npm run format:check` -> initial failure on `e2e/kpi-browser.playwright.js`; after `npm run format:write`, rerun -> `pass`
- `npm run lint` -> `pass`
- `npm run verify` -> `pass` (`431` tests passed)
- `npm run smoke:kpi-browser` on `KPI_SERVER_PORT=3192`, `KPI_BASE_URL=http://127.0.0.1:3192` -> first run failed because a CI example DB URL was forced; rerun using the local env DB settings on DB port `5434` -> `pass`

### Notes / 메모
- The demo screen intentionally does not prove owner command execution. It only proves that the owner-only feature shape can be shown inside the KPI UI.
- User check URL for the current local runtime remains `http://127.0.0.1:3100/`; verification-only browser smoke used `http://127.0.0.1:3192/`.

## 2026-04-28 - Electric Other Usage Switches To Team Residual From 2026-03 / 2026-03부터 전기 기타를 팀 배분 후 잔여분으로 계산

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- apps/metering/
|       |-- app.js
|       |-- equipment/usage-display.js
|       `-- runtime/
|           |-- monthly-usage-core.js
|           `-- team-usage-support.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        |-- metering-equipment-usage-display.smoke.js
        `-- metering-runtime-monthly-usage-core.smoke.js
```

### Summary / 요약
- Changed electric `other_01` monthly usage so, from `2026-03`, `기타` is no longer a pure equipment residual.
- The new path first finishes team-side allocation, including shared-compressor settlement and the team 03 liquid-compressor deduction, and then computes `기타 = 전력총량 - 팀 배분 합계`.
- Kept the change calculation-only. No PostgreSQL authority readings or monthly settlement source records were rewritten in this patch.

### Changed Files / 변경 파일
- `utility/apps/metering/app.js`
- `utility/apps/metering/runtime/monthly-usage-core.js`
- `utility/apps/metering/runtime/team-usage-support.js`
- `utility/apps/metering/equipment/usage-display.js`
- `kpi-runtime/internal-server/test/frontend/metering-runtime-monthly-usage-core.smoke.js`
- `kpi-runtime/internal-server/test/frontend/metering-equipment-usage-display.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `npm run smoke:metering-runtime-monthly-usage-core` -> `pass`
- `npm run smoke:metering-equipment-usage-display` -> `pass`
- `npm run smoke:metering-runtime-team-usage-support` -> `pass`
- `npm run smoke:metering-runtime-monthly-summary-support` -> `pass`
- `npm run smoke:metering-utility-snapshots` -> `pass`
- `npm run smoke:metering-resource-summary` -> `pass`

### Notes / 메모
- The `기타` detail text now reflects the new meaning in monthly mode: it shows team-allocated monthly usage instead of the older equipment-sum wording when `team_residual` mode is active.
- Daily `기타` calculation remains equipment-residual based; only monthly electric `기타` switches to the team-residual path from `2026-03`.

## 2026-04-28 - Team 03 Liquid Compressor Deduction Rule / 3팀 합산에서 액상 컴프 x120 차감

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- apps/metering/
|       |-- app.js
|       `-- runtime/team-usage-support.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        `-- metering-runtime-team-usage-support.smoke.js
```

### Summary / 요약
- Added a special electric rule so `team_03` monthly usage subtracts the liquid-compressor raw monthly reading difference multiplied by `120`.
- Kept the earlier shared-compressor logic unchanged for `team_01_02` and `team_02`: `액상 컴프` still joins their shared pool before the `72:28` split.
- Scoped the new deduction to team-total calculation only, so no authority readings or equipment assignments were rewritten.

### Changed Files / 변경 파일
- `utility/apps/metering/app.js`
- `utility/apps/metering/runtime/team-usage-support.js`
- `kpi-runtime/internal-server/test/frontend/metering-runtime-team-usage-support.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `npm run smoke:metering-runtime-team-usage-support` -> `pass`
- `npm run smoke:metering-runtime-monthly-summary-support` -> `pass`
- `npm run smoke:metering-team-overview-assigned-list` -> `pass`
- March 2026 raw check -> `액상 컴프` difference `49.94`, deduction rule `49.94 x 120 = 5992.8`, display rounded `5993`
- March 2026 team 03 usage check -> original `94945.4`, after deduction `88952.6`

### Notes / 메모
- The deduction is calculation-only and does not change billing amount logic in this patch.
- The source-equipment chip totals for team 03 still reflect the physical equipment sums; only the team monthly aggregate gets the extra deduction.

## 2026-04-28 - Shared Compressor Liquid Source From 2026-03 / 2026-03부터 액상 컴프를 공유 컴프에 포함

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- apps/metering/
|       |-- app.js
|       `-- team-overview/charge-support.js
|-- kpi-runtime/internal-server/
|   |-- PostgreSQL app_module_records
|   |   `-- util_metering:electric_v1
|   `-- test/frontend/
|       `-- metering-team-overview-charge-support.smoke.js
```

### Summary / 요약
- Added `field_custom_1777335768709_08f3az` (`액상 컴프`) to the shared-compressor source pool as a standalone source that becomes active from `2026-03`.
- Updated the electric authority data so the item now starts at `2026-03`, uses factor `50`, and has a baseline reading `0` on `2026-03-01`.
- Kept the new source out of normal direct-team equipment assignment logic; it only joins the shared-compressor settlement sum.

### Changed Files / 변경 파일
- `utility/apps/metering/app.js`
- `utility/apps/metering/team-overview/charge-support.js`
- `kpi-runtime/internal-server/test/frontend/metering-team-overview-charge-support.smoke.js`
- `patch.md`
- `비전공자용.md`

### Changed Data / 변경 데이터
- `PostgreSQL app_module_records`
- `util_metering:electric_v1`

### Verification / 검증
- `npm run backup:postgres-dump` -> `pass`, dump created at `var/prod/backups/postgres-dumps/postgres-dump-20260428-131159.dump`
- `npm run smoke:metering-team-overview-charge-support` -> `pass`
- `npm run smoke:metering-team-overview-assigned-list` -> `pass`
- `npm run smoke:metering-runtime-team-usage-support` -> `pass`
- Authority readback -> `액상 컴프` factor `50`, `visibleFromMonth = 2026-03`, `2026-03-01 = 0`, `2026-04-01 = 49.94`
- Derived March shared-source usage -> `49.94 - 0 = 49.94`, `49.94 x 50 = 2497`

### Notes / 메모
- March shared-compressor total now includes the extra `2497` from `액상 컴프`.
- Using the current March 1 to April 1 readings, the shared pool totals `75727`, which splits to about `54523.44` for `team_01_02` and `21203.56` for `team_02` before display rounding.

## 2026-04-28 - Metering Validation-Only Reading Fixes / 월간 사용량 유지 검침 오류 보정

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- apps/metering/
|       |-- app.js
|       `-- equipment/input-state.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        `-- metering-equipment-input-state.smoke.js
```

### Summary / 요약
- Cleared historical electric and gas daily-reading validation errors without changing stored authority readings or monthly usage calculations.
- Added validation-only surrogate readings for simple one-point anomalies and comparison-skip rules for a small set of historical drop/reset pairs that would otherwise require moving month-sensitive raw readings.
- Kept the fix in the metering validation layer so the current monthly usage numbers stay unchanged.

### Changed Files / 변경 파일
- `utility/apps/metering/app.js`
- `utility/apps/metering/equipment/input-state.js`
- `kpi-runtime/internal-server/test/frontend/metering-equipment-input-state.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `npm run smoke:metering-equipment-input-state` -> `pass`
- `npm run smoke:metering-equipment-reading-timeline` -> `pass`
- Local authority scan with the new validation-only corrections/exceptions -> electric issues `0`, gas issues `0`
- Monthly-usage preservation review -> authority readings were not rewritten, and the fix stays in the validation path (`ENTRY_VALUE_CORRECTIONS` / comparison exceptions) instead of the usage-calculation path

### Notes / 메모
- No PostgreSQL authority data was rewritten in this patch.
- The preserved comparison skips are limited to historical drop/reset pairs where forcing monotonic readings into stored data would distort trusted monthly totals or cascade into neighboring dates.

## 2026-04-28 - Electric Power-Meter Field Backfill For 2026-03 And 2026-04-21 / 2026-03 및 2026-04-21 전력량계 필드 보강

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    `-- PostgreSQL app_module_records
        `-- util_metering:electric_v1
```

### Summary / 요약
- Created a PostgreSQL dump backup before writing: `var/prod/backups/postgres-dumps/postgres-dump-20260428-125543.dump`.
- Filled only blank electric power-meter fields (`field_21` to `field_27`) for the March 2026 reading dates and for `2026-04-21`.
- Left February 2026 unchanged because those seven fields were already fully present on the target dates.

### Changed Data / 변경 데이터
- `PostgreSQL app_module_records`
- `util_metering:electric_v1`

### Verification / 검증
- `npm run backup:postgres-dump` -> `pass`, dump created at `var/prod/backups/postgres-dumps/postgres-dump-20260428-125543.dump`
- Save result -> `116` blank field values filled across `18` dates
- Readback check -> `2026-03-01`, `2026-03-03`, `2026-03-31`, `2026-04-21` now each have all `field_21`..`field_27`
- Readback check -> `2026-02-01`, `2026-02-25` remained unchanged and fully populated

### Notes / 메모
- Filled dates: `2026-03-01`, `03`, `05`, `06`, `09`, `10`, `11`, `16`, `17`, `19`, `20`, `23`, `24`, `25`, `27`, `30`, `31`, and `2026-04-21`
- The write path used the local Node metering authority service with expected split-record versions; no unrelated electric fields were touched.

## 2026-04-28 - Shared Compressor Team Split From 2026-02 / 2026-02부터 공유 컴프 72:28 배분

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- apps/metering/
|       |-- app.js
|       `-- team-overview/charge-support.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        `-- metering-team-overview-charge-support.smoke.js
```

### Summary / 요약
- Enabled the existing shared-compressor split path for electric team calculations starting from `2026-02`.
- Configured the shared source pool as `field_11` (`컴프(380v)`) plus `field_14` (`컴프레셔`, used here as 2-team compressor) and split that pool `72%` to `team_01_02` and `28%` to `team_02`.
- Normalized the shared-compressor detail text so the UI now explains the split as `컴프(380v) + 2팀컴프`.

### Changed Files / 변경 파일
- `utility/apps/metering/app.js`
- `utility/apps/metering/team-overview/charge-support.js`
- `kpi-runtime/internal-server/test/frontend/metering-team-overview-charge-support.smoke.js`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `npm run smoke:metering-team-overview-charge-support` -> `pass`
- `npm run smoke:metering-team-overview-assigned-list` -> `pass`
- `npm run smoke:metering-runtime-team-usage-support` -> `pass`
- Authority readback check -> current electric team assignments still map `field_11` to `team_01_02` and `field_14` to `team_02`

### Notes / 메모
- This patch changes calculation/display behavior only; it does not rewrite PostgreSQL authority readings.
- The split starts at `2026-02`, so months before `2026-02` keep the previous direct-equipment team allocation behavior.

## 2026-04-28 - April 2026 Gas Metering Backfill / 2026-04 가스 검침 보강

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    `-- PostgreSQL app_module_records
        `-- util_metering:gas_v1
```

### Summary / 요약
- Created a PostgreSQL dump backup before writing: `var/prod/backups/postgres-dumps/postgres-dump-20260428-122440.dump`.
- Filled missing April 2026 gas metering dates in the authority store while preserving existing values that were already present.
- Added 6 missing date entries so the April 2026 gas dataset now contains 8 dated records: `2026-04-01`, `03`, `06`, `08`, `13`, `20`, `21`, `28`.
- Backfilled only the daily meter-reading fields (`금일`) for gas equipment entries; usage, corrected-usage, and trailing source-note columns were not written because they are derived or outside the direct gas equipment-entry schema.

### Changed Data / 변경 데이터
- `PostgreSQL app_module_records`
- `util_metering:gas_v1`

### Verification / 검증
- `npm run backup:postgres-dump` → `pass`, dump created at `var/prod/backups/postgres-dumps/postgres-dump-20260428-122440.dump`
- Readback verification after save → `2026-04` gas entry count `8`
- Readback spot check → `2026-04-01`, `2026-04-03`, `2026-04-20`, `2026-04-21` values present in `resourceDatasets.gas.equipmentEntries`

### Notes / 메모
- `2026-04-01` already existed and only the missing `gas_field_04` (`DSI 보일러`) value was filled.
- Existing `2026-04-28` gas authority values were preserved as-is.

## 2026-04-28 - April 2026 Electric Metering Backfill / 2026-04 전기 검침 보강

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    `-- PostgreSQL app_module_records
        `-- util_metering:electric_v1
```

### Summary / 요약
- Created a PostgreSQL dump backup before writing: `var/prod/backups/postgres-dumps/postgres-dump-20260428-121917.dump`.
- Filled missing April 2026 electric metering dates in the authority store while preserving existing values that were already present.
- Added 7 missing date entries so the April 2026 electric dataset now contains 8 dated records: `2026-04-01`, `03`, `06`, `08`, `13`, `20`, `21`, `28`.
- Mapped the April-only custom meter field to the existing `visibleFromMonth=2026-04` authority field and filled it from the source column used for `3팀 컴프`.

### Changed Data / 변경 데이터
- `PostgreSQL app_module_records`
- `util_metering:electric_v1`

### Verification / 검증
- `npm run backup:postgres-dump` → `pass`, dump created at `var/prod/backups/postgres-dumps/postgres-dump-20260428-121917.dump`
- Readback verification after save → `2026-04` electric entry count `8`
- Readback spot check → `2026-04-01`, `2026-04-08`, `2026-04-21` values present in `resourceDatasets.electric.equipmentEntries`

### Notes / 메모
- The source text included `1팀 2파트` and `3팀` values on `2026-04-08`, `2026-04-13`, `2026-04-20`, and `2026-04-21`, but the current electric authority store does not persist those figures as direct equipment-entry fields, so they were not written into `equipmentEntries`.
- The April-only custom field was resolved from the current authority schema by `visibleFromMonth=2026-04` and filled from the source column that appears alongside `컴프레셔` and `액상`.

## 2026-04-28 - March 2026 Electric Metering Backfill / 2026-03 전기 검침 보강

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    `-- PostgreSQL app_module_records
        `-- util_metering:electric_v1
```

### Summary / 요약
- Created a PostgreSQL dump backup before writing: `var/prod/backups/postgres-dumps/postgres-dump-20260428-121207.dump`.
- Filled missing March 2026 electric metering dates in the authority store while preserving existing values that were already present.
- Added 16 missing date entries so the March 2026 electric dataset now contains 17 dated records: `2026-03-01`, `03`, `05`, `06`, `09`, `10`, `11`, `16`, `17`, `19`, `20`, `23`, `24`, `25`, `27`, `30`, `31`.
- Kept the existing `2026-03-01` authority values as-is and only inserted values for dates that were not yet stored.

### Changed Data / 변경 데이터
- `PostgreSQL app_module_records`
- `util_metering:electric_v1`

### Verification / 검증
- `npm run backup:postgres-dump` → `pass`, dump created at `var/prod/backups/postgres-dumps/postgres-dump-20260428-121207.dump`
- Readback verification after save → `2026-03` electric entry count `17`
- Readback spot check → `2026-03-03`, `2026-03-30`, `2026-03-31` values present in `resourceDatasets.electric.equipmentEntries`

### Notes / 메모
- The source text included `3팀 컴프` values on `2026-03-30` (`2.04`) and `2026-03-31` (`15.6`), but the current March electric schema has no dedicated mapped field for that source column, so those two values were not written into the authority store.
- The source text did not provide a clearly separable `카페` value for `2026-03-01`, so that missing field was left unchanged instead of being guessed.

## 2026-04-24 - Audit Placeholder Navigation Cleanup / 오디트 placeholder 목차 정리

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- audit/
|   `-- runtime/audit/
|       |-- KPI.audit.runtime.js
|       |-- sections/KPI.sections.audit.js
|       `-- records/
|           |-- KPI.audit.records.data.js
|           |-- KPI.audit.records.options.js
|           `-- KPI.audit.records.render.js
`-- kpi-runtime/internal-server/
    `-- e2e/kpi-browser.playwright.js
```

### Summary / 요약
- Removed the detailed `법정 설비` content from the audit UI and replaced it with a placeholder that clearly says `추후 추가예정`.
- Added `안전 관리` as the third audit category so the audit 목차 now shows `조도 (Lux)`, `법정 설비`, `안전 관리`.
- Marked the two unfinished audit categories as placeholders so they render lightweight notice cards and do not expose save actions.
- Deleted the unused legal-facility render/filter helpers that were only supporting the removed detail table.
- Updated the Playwright browser smoke to verify the two placeholder screens instead of the old legal-facility detail table.

### Changed Files / 변경 파일
- `patch.md`
- `비전공자용.md`
- `audit/runtime/audit/KPI.audit.runtime.js`
- `audit/runtime/audit/sections/KPI.sections.audit.js`
- `audit/runtime/audit/records/KPI.audit.records.data.js`
- `audit/runtime/audit/records/KPI.audit.records.options.js`
- `audit/runtime/audit/records/KPI.audit.records.render.js`
- `kpi-runtime/internal-server/e2e/kpi-browser.playwright.js`

### Verification / 검증
- targeted Playwright check on `http://127.0.0.1:3192/` -> `pass`; `법정 설비`, `안전 관리` 모두 `추후 추가예정` placeholder 확인
- `npm run smoke:kpi-browser` -> `fail`; existing unrelated metering title expectation `/월간 (전기|가스 검침|폐수|생산량) .* 시트/` did not match current title `월간 가스 검침 시트`

## 2026-04-24 - PostgreSQL Dump Backup Rule / PostgreSQL 전체 DB 백업 규칙

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- AGENTS.md
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    |-- package.json
    `-- scripts/windows/
        |-- backup-postgres-dump.ps1
        |-- backup-all.ps1
        `-- backup-retention.ps1
```

### Summary / 요약
- Added an AGENTS rule requiring a full PostgreSQL custom-format dump before schema migrations, bulk import/replace, destructive repair, or auth/user/document-storage DB changes.
- Added `npm run backup:postgres-dump`, which writes `pg_dump --format=custom` output under `KPI_STORAGE_ROOT/backups/postgres-dumps/` without printing DB credentials.
- Added `npm run backup:all`, now covering PostgreSQL dump, runtime JSON snapshot, and file-storage backup together.
- Extended backup retention preview/deletion to include PostgreSQL dump files.
- Kept generated dump files out of Git; they live under `kpi-runtime/internal-server/var/prod/backups/postgres-dumps/` in this local environment.

### Changed Files / 변경 파일
- `AGENTS.md`
- `patch.md`
- `비전공자용.md`
- `kpi-runtime/internal-server/package.json`
- `kpi-runtime/internal-server/scripts/windows/backup-postgres-dump.ps1`
- `kpi-runtime/internal-server/scripts/windows/backup-all.ps1`
- `kpi-runtime/internal-server/scripts/windows/backup-retention.ps1`

### Verification / 검증
- `npm run backup:postgres-dump` -> `pass`; created `postgres-dump-20260424-160043.dump`, `848320` bytes
- `npm run backup:all` -> `pass`; created PostgreSQL dump `postgres-dump-20260424-160058.dump`, runtime snapshot, and file-storage backup
- `backup-retention.ps1` preview -> `pass`; PostgreSQL dump retention sees `2` dump files, `deleteCount: 0`
- `git status --short -- kpi-runtime/internal-server/var/prod/backups/postgres-dumps` -> no tracked/untracked dump files

## 2026-04-24 - Cleanup Imported Reference Materials / 반입 참고자료 정리

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- 서버전달용_수정본 2/                 removed imported reference snapshot
`-- 서버전달용_수정본 3/                 removed imported reference snapshot
```

### Summary / 요약
- Removed the imported `서버전달용_수정본 2` and `서버전달용_수정본 3` reference snapshots from the working tree.
- Kept the already-ported implementation files under the current repository structure; only the external reference copies were cleaned up.
- Confirmed no root-level `KPI-local-main`, `1.png`~`4.png`, or `생산량` temporary reference artifacts remain in the filesystem.

### Changed Files / 변경 파일
- `patch.md`
- `비전공자용.md`
- `서버전달용_수정본 2/**` removed
- `서버전달용_수정본 3/**` removed

### Verification / 검증
- `git -c core.quotePath=false status --short -- "서버전달용_수정본 2" "서버전달용_수정본 3"` -> removed reference files only
- `Get-ChildItem -Force -Directory` cleanup filter -> no remaining `서버전달용_*`, `KPI-local-main`, or `생산량` directory at repo root

## 2026-04-24 - Utility Analysis Production-Line Click Verification / 유틸 분석표 생산라인 클릭 검증

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- KPI-local-main/                         reference source for production-line behavior
|-- utility/runtime/util/report/sheet/
|   |-- analysis/render.js                  verified render path; no runtime edit
|   `-- analysis/electric/
|       |-- chart-model.js                  verified production-line series path; no runtime edit
|       `-- model.js                        verified electric team model path; no runtime edit
`-- kpi-runtime/internal-server/test/frontend/
    |-- report-sheet-analysis-models.smoke.js
    `-- report-sheet-analysis-render.smoke.js
```

### Summary / 요약
- Compared `KPI-local-main` with the current split report-sheet runtime for the electric/gas production-line analysis path.
- Confirmed the production-line logic was not missing; it is split across `controls.js`, `modal/actions.js`, `analysis/render.js`, `analysis/electric/model.js`, and `analysis/electric/chart-model.js`.
- Added smoke coverage so the model test now uses real `생산라인::팀::라인` keys and asserts line-specific amount/ratio series.
- Added render coverage so production-line summary controls and chart keys remain present in the analysis body.
- No runtime behavior file was changed in this entry because browser verification showed the current UI already matches the `KPI-local-main` line-split behavior.

### Changed Files / 변경 파일
- `patch.md`
- `비전공자용.md`
- `kpi-runtime/internal-server/test/frontend/report-sheet-analysis-models.smoke.js`
- `kpi-runtime/internal-server/test/frontend/report-sheet-analysis-render.smoke.js`

### Verification / 검증
- `node --test test/frontend/report-sheet-analysis-models.smoke.js test/frontend/report-sheet-analysis-render.smoke.js` -> `pass`
- Browser verification on `http://127.0.0.1:3100/` -> `pass`; electric analysis team select clicked through `1팀 1파트`, `1팀 2파트`, `2팀`, `3팀`, `합산`.
- Electric line split confirmed: `SD/MSD`, `지대/ICA`, `로터리·버티컬/스틱`, `Bottle/기타` summary cards and chart legends appeared for team views, and disappeared for `합산`.
- Gas analysis category select clicked through `1팀 1파트`, `1팀 2파트`, `3팀`, `유산`, `합계`; single-team categories showed production-line cards and controls, multi-team aggregate categories did not.
- Line controls confirmed in browser: unit select `%/kg/ton`, display buttons `막대/선/표시없음`, and `표 팝업` buttons were present for production-line series.

## 2026-04-24 - KPI-local-main Utility Sheet Visual Parity / 유틸리티 분석표 시각 맞춤 강화

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
|-- KPI-local-main/                         reference source for sheet modal CSS
`-- kpi-runtime/
    |-- app/
    |   |-- KPI.app.shell.css
    |   `-- styles/metering/metering.css    utility sheet modal, panel, meter, analysis CSS
    `-- internal-server/test/frontend/
        `-- kpi-shell-css.smoke.js          CSS cache and local-main modal shape guard
```

### Summary / 요약
- Matched the current split-server utility sheet CSS to the `KPI-local-main` sheet modal shape instead of keeping the previous fullscreen-like default.
- Added all missing `KPI-local-main` `util-sheet-*` selectors to the current `metering.css`; selector parity check now reports `missingCount: 0`.
- Restored the local-main centered report card, panel color bars, gas/electric meter summary controls, inline help popovers, analysis chart cards, table cards, and chart fullscreen sizing rules.
- Preserved the current server-only extra chart control selectors because the split runtime still uses them.
- Bumped the visible KPI version to `V454` and metering CSS cache key to `v=060`.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `kpi-runtime/app/KPI.app.shell.css`
- `kpi-runtime/app/styles/metering/metering.css`
- `kpi-runtime/internal-server/test/frontend/kpi-shell-css.smoke.js`

### Verification / 검증
- `node --test kpi-runtime/internal-server/test/frontend/kpi-shell-css.smoke.js` -> `pass`
- `node --test test/frontend/report-sheet-modal-render.smoke.js` -> `pass`
- `node --test test/frontend/report-sheet-modal-shell.smoke.js test/frontend/report-sheet-modal-actions.smoke.js test/frontend/report-sheet-analysis-render.smoke.js test/frontend/report-sheet-electric-comparison-summary.smoke.js test/frontend/report-sheet-gas-comparison-summary.smoke.js test/frontend/report-sheet-summary-render.smoke.js` -> `pass`
- `node src/scripts/verifyServerStructure.js` -> `pass`, `warningCount: 0`
- Browser verification on `http://127.0.0.1:3100/` -> `pass`; gas meter `2` tables, gas analysis `2` charts, electric meter `3` tables, electric analysis `2` charts, centered card modal, no console/page/HTTP errors.

## 2026-04-24 - Utility Sheet Report Restore from KPI-local-main / 유틸리티 분석표 복구

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
|-- KPI-local-main/                         reference only; not copied wholesale
|-- kpi-runtime/
|   |-- app/
|   |   |-- KPI.app.shell.css
|   |   `-- styles/metering/metering.css
|   `-- internal-server/test/frontend/
|       |-- kpi-shell-css.smoke.js
|       |-- report-sheet-modal-render.smoke.js
|       `-- report-sheet-*.smoke.js          loader cache-version assertions
`-- utility/runtime/util/report/
    |-- KPI.util.report.sheet.js
    `-- sheet/
        |-- config.js
        |-- gas/runtime-sync.js              new split gas sync module
        `-- modal/render.js
```

### Summary / 요약
- Used `KPI-local-main` as the visual/behavior reference, but kept the current split report-sheet architecture instead of replacing it with the old monolithic file.
- Added a split gas report runtime-sync module so the gas meter/analysis modal forces one metering-data sync before showing the no-data fallback.
- Wired the gas sync helper into `KPI.util.report.sheet.js` and `sheet/modal/render.js`, matching the existing electric report sync behavior.
- Ported the `KPI-local-main` utility sheet meter/analysis table styling into `kpi-runtime/app/styles/metering/metering.css` while preserving the current server fullscreen modal shell.
- Bumped visible KPI version to `V453`, metering CSS cache to `v=059`, and affected report-sheet script cache keys to `v=054`.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `kpi-runtime/app/KPI.app.shell.css`
- `kpi-runtime/app/styles/metering/metering.css`
- `kpi-runtime/internal-server/test/frontend/kpi-shell-css.smoke.js`
- `kpi-runtime/internal-server/test/frontend/report-sheet-modal-render.smoke.js`
- `kpi-runtime/internal-server/test/frontend/report-sheet-*.smoke.js` loader version assertions
- `utility/runtime/util/report/KPI.util.report.sheet.js`
- `utility/runtime/util/report/sheet/config.js`
- `utility/runtime/util/report/sheet/gas/runtime-sync.js`
- `utility/runtime/util/report/sheet/modal/render.js`

### Verification / 검증
- `node --test test/frontend/report-sheet-modal-render.smoke.js` -> `pass`
- `node --test test/frontend/report-sheet-config.smoke.js ... test/frontend/report-sheet-electric-comparison-summary.smoke.js` -> `pass (18 tests)`
- `node --test test/frontend/report-sheet-analysis-state.smoke.js ... test/frontend/report-sheet-modal-shell.smoke.js` -> `pass (26 tests)`
- `node --test test/frontend/kpi-shell-css.smoke.js` -> `pass`
- Browser verification on `http://127.0.0.1:3100/` -> `pass`: gas meter table rendered (`2 tables`), gas analysis rendered (`1 section`, `2 charts`), electric meter rendered (`3 tables`), electric analysis rendered (`1 section`, `2 charts`), with no console or page errors.

### Notes / 메모
- `KPI-local-main` was treated as a reference source only. Its old single-file report sheet was not copied into the current split runtime.
- The previous failure mode was timing-sensitive: opening the analysis page before metering runtime hydration could show "no report data" for gas. The modal now syncs gas data once and rerenders.

## 2026-04-24 - Production Date Read-Day Fix / 생산 날짜 읽기 보정 수정

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
`-- kpi-runtime/internal-server/
    |-- src/services/util-production-daily/normalizers.js
    `-- test/services/util-production-daily-normalizers.test.js
```

### Summary / 요약
- Fixed the server-side util production date normalizer so PostgreSQL `DATE` rows keep the same calendar day when they are converted into browser payloads.
- This removes the KST read-path shift where production saved as `1/2` could be exposed back to the UI as `1/1`.
- Bumped the KPI body version to `V451` because the user-visible production date display changed.
- Added a focused server test to pin the local-calendar handling for `Date` inputs and `buildStatePayload`.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `kpi-runtime/internal-server/src/services/util-production-daily/normalizers.js`
- `kpi-runtime/internal-server/test/services/util-production-daily-normalizers.test.js`

### Verification / 검증
- `node --test test/services/util-production-daily.test.js` -> `pass`
- `node --test test/services/util-production-daily-normalizers.test.js` -> `pass`
- `npm run lint` -> `pass`
- Direct DB check via local Node/`pg` confirmed `production_date` rows are returned as local-midnight `Date` objects, which explained the previous UTC day-back shift
- `MCP postgres/query` -> `failed (password auth error)`, so DB verification used the local Node repository runtime instead

### Notes / 메모
- The fix is read-path only; it does not rewrite existing DB rows because the stored `DATE` values were already intact.
- Browser/UI verification fell back to code-path and DB-shape verification because the root cause was isolated in the server normalization layer.

## 2026-04-24 - Utility Delete Scope Lock / 유틸 삭제 범위 생산량 고정

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   `-- runtime/util/KPI.util.maintenance.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/util-maintenance-delete-scope.smoke.js
```

### Summary / 요약
- Locked the utility data-management delete modal to production only, so usage/cost can no longer be deleted from that flow.
- Kept the utility export modal on the existing multi-select contract, so usage, cost, and production can still be exported together or separately.
- Bumped the KPI body version to `V449` because the user-facing delete flow changed.
- Added a frontend smoke to pin the delete/export split contract in `KPI.util.maintenance.js`.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `utility/runtime/util/KPI.util.maintenance.js`
- `kpi-runtime/internal-server/test/frontend/util-maintenance-delete-scope.smoke.js`

### Verification / 검증
- `node --test test/frontend/util-maintenance-delete-scope.smoke.js` → `pass (1/1)`
- `npm run format:check` → `pass`
- `npm run lint` → `pass`
- `npm run verify` → `fail at test/frontend/metering-bundle-draft.smoke.js ("metering bundle draft keeps the current bridge source order")`
- `npm run smoke:kpi-browser` → `pass`
- `MCP Playwright` direct check to `http://127.0.0.1:3100/` → login page rendered (`/login?next=%2F`), browser session closed after verification

### Notes / 메모
- The delete modal now fixes the target to production and explicitly says usage/cost are not deleted there.
- Usage/cost export remains on the existing `all / usage / cost / production` toggle set.

## 2026-04-24 - Production Date Zero Offset / 생산 날짜 0일 보정 전환

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   |-- apps/production-extractor/
|   |   |-- app.js
|   |   |-- production-extractor.html
|   |   `-- runtime/export-actions.js
|   `-- runtime/util/
|       |-- KPI.util.data-sync.js
|       `-- production/KPI.util.production.extractor.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        |-- production-extractor-export-actions.smoke.js
        |-- production-extractor-import-parsing.smoke.js
        `-- util-production-upload-offset.smoke.js
```

### Summary / 요약
- Switched production date handling from `+1 day` to `0 day` so the extractor now keeps the original production date from column `A` without shifting it.
- Matched the shared util upload contract by changing `UTIL_PRODUCTION_UPLOAD_DATE_OFFSET_DAYS` to `0`, so extractor import and util upload no longer disagree on saved dates.
- Kept the current calendar-month grouping (`1일~말일`) and the fixed period-start-day contract while changing only the date-shift rule.
- Bumped the extractor asset version to `v=15`, the KPI body version to `V448`, and the util data-sync cache key to `v=206` so the changed runtime loads immediately.
- Added a new frontend smoke to pin the shared zero-day upload contract between `KPI.util.data-sync.js` and `KPI.util.production-import.js`.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `utility/apps/production-extractor/app.js`
- `utility/apps/production-extractor/production-extractor.html`
- `utility/apps/production-extractor/runtime/export-actions.js`
- `utility/runtime/util/KPI.util.data-sync.js`
- `utility/runtime/util/production/KPI.util.production.extractor.js`
- `kpi-runtime/internal-server/test/frontend/production-extractor-export-actions.smoke.js`
- `kpi-runtime/internal-server/test/frontend/production-extractor-import-parsing.smoke.js`
- `kpi-runtime/internal-server/test/frontend/util-production-upload-offset.smoke.js`

### Verification / 검증
- `node --test test/frontend/production-extractor-import-parsing.smoke.js` → `pass (4/4)`
- `node --test test/frontend/production-extractor-export-actions.smoke.js` → `pass (4/4)`
- `node --test test/frontend/util-production-upload-offset.smoke.js` → `pass (1/1)`
- `node --test test/frontend/kpi-util-data-sync.smoke.js` → `pass (2/2)`
- `node --test test/frontend/metering-utility-snapshot-hydration.smoke.js` → `pass (1/1)`
- `npm run format:check` → `pass`
- `npm run lint` → `pass`
- `npm run verify` → `fail at test/frontend/metering-bundle-draft.smoke.js ("metering bundle draft keeps the current bridge source order")`
- `npm run smoke:kpi-browser` → `pass`
- `MCP Playwright` direct check to `http://127.0.0.1:3100/utility/apps/production-extractor/production-extractor.html?embed=1&v=15` → `auth-guarded ("ok": false, "error": "unauthorized")`, browser session closed after verification

### Notes / 메모
- After this patch, re-imported production rows keep the original date instead of being stored one day later.
- The remaining `npm run verify` failure is unchanged and outside the touched production-extractor/util-upload paths.

## 2026-04-24 - Server Delivery Revision 2 / 서버전달용 수정본 2

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- KPI.html
|-- patch.md
|-- 비전공자용.md
|-- utility/
|   |-- apps/production-extractor/
|   |   |-- app.js
|   |   |-- production-extractor.html
|   |   `-- runtime/
|   |       |-- export-actions.js
|   |       `-- import-parsing.js
|   `-- runtime/util/
|       |-- energy/KPI.util.energy.tabs.js
|       `-- production/KPI.util.production.extractor.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/
        |-- production-extractor-export-actions.smoke.js
        `-- production-extractor-import-parsing.smoke.js
```

### Summary / 요약
- Reviewed `서버전달용_수정본 2` against the current split repo and ported only the safe delta instead of copying the external monolithic files.
- Kept the split `production-extractor` architecture, removed the user-editable cycle-start field, and changed period grouping/display to calendar-month boundaries (`1일~말일`).
- Preserved the current `PRODUCTION_DATE_OFFSET_DAYS = 1` contract so extractor parsing stays aligned with the existing util import/data-sync behavior.
- Updated `production-extractor.html`, `KPI.util.production.extractor.js`, and the related frontend smokes to cache/version `v=14`, and removed the redundant fixed `production-start` selector from `KPI.util.energy.tabs.js`.
- Did not port the external `KPI.util.data-sync.js` because it would regress the wastewater fallback and hydration-safety behavior already guarded by the current smoke coverage.
- Bumped the visible `KPI.html` body version and the energy-tabs cache key because the KPI-served util UI changed.

### Changed Files / 변경 파일
- `KPI.html`
- `patch.md`
- `비전공자용.md`
- `utility/apps/production-extractor/app.js`
- `utility/apps/production-extractor/production-extractor.html`
- `utility/apps/production-extractor/runtime/export-actions.js`
- `utility/apps/production-extractor/runtime/import-parsing.js`
- `utility/runtime/util/energy/KPI.util.energy.tabs.js`
- `utility/runtime/util/production/KPI.util.production.extractor.js`
- `kpi-runtime/internal-server/test/frontend/production-extractor-export-actions.smoke.js`
- `kpi-runtime/internal-server/test/frontend/production-extractor-import-parsing.smoke.js`

### Verification / 검증
- `node --test test/frontend/production-extractor-import-parsing.smoke.js` → `pass (4/4)`
- `node --test test/frontend/production-extractor-export-actions.smoke.js` → `pass (4/4)`
- `node --test test/frontend/kpi-util-data-sync.smoke.js` → `pass (2/2)`
- `node --test test/frontend/metering-utility-snapshot-hydration.smoke.js` → `pass (1/1)`
- `npm run format:check` → `pass`
- `npm run lint` → `pass`
- `npm run verify` → `fail at test/frontend/metering-bundle-draft.smoke.js ("metering bundle draft keeps the current bridge source order")`
- `npm run smoke:kpi-browser` → `pass`
- `MCP Playwright` direct check to `http://127.0.0.1:3100/utility/apps/production-extractor/production-extractor.html?embed=1&v=14` → `auth-guarded ("ok": false, "error": "unauthorized")`, browser session closed after verification

### Notes / 메모
- This patch intentionally did not import the external `0-day` offset change because the current repo still treats production extractor dates with the existing `+1 day` contract.
- The `npm run verify` failure is outside the touched production-extractor and energy-tabs paths and remains the same metering bundle draft baseline issue.
- This entry was later superseded on `2026-04-24` by `Production Date Zero Offset / 생산 날짜 0일 보정 전환`.

## 2026-04-24 - Server Delivery Revision 1 / 서버전달용 수정본 1

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- patch.md
|-- 비전공자용.md
|-- team-report/
|   `-- runtime/work/KPI.work.team-calendar.render.js
`-- kpi-runtime/internal-server/
    `-- test/frontend/work-team-calendar-render.smoke.js
```

### Summary / 요약
- Imported `서버전달용_수정본/01_★★★_팀별내역서/runtime/work/KPI.work.team-calendar.js` was reviewed against the current split runtime instead of being copied wholesale.
- Ported the valid render delta into `team-report/runtime/work/KPI.work.team-calendar.render.js`: offday cells now keep today's flag, KPI flag, and production/history summary cues in the flag slot when data exists.
- Kept the current `options.teamDataKey` preference and did not import the external `preferredDataKey` regression.
- Did not port `equipUtilityChipHtml` because the current repo has no live `window.KpiEquipView?.openFromWorkCalendar?.(...)` entrypoint, and the existing smoke guard expects no stray `equipUtilityChipHtml` references.
- Updated `kpi-runtime/internal-server/test/frontend/work-team-calendar-render.smoke.js` to cover the offday cue behavior in the current split-file structure.

### Changed Files / 변경 파일
- `patch.md`
- `비전공자용.md`
- `team-report/runtime/work/KPI.work.team-calendar.render.js`
- `kpi-runtime/internal-server/test/frontend/work-team-calendar-render.smoke.js`

### Verification / 검증
- `node --test test/frontend/work-team-calendar-render.smoke.js` → `pass (3/3)`
- `npm run format:check` → `pass`
- `npm run lint` → `pass`
- `npm run verify` → `fail at test/frontend/metering-bundle-draft.smoke.js ("metering bundle draft keeps the current bridge source order")`
- `npm run smoke:kpi-browser` → `pass`

### Notes / 메모
- The `npm run verify` failure is outside the touched work-team-calendar path and currently reports a bridge source-order mismatch in the metering bundle draft smoke.
- This patch intentionally preserved the current split architecture and did not overwrite the repo with the external monolithic file.

## 2026-04-24

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- AGENTS.md
|   `-- existing patch/companion rule reused
|-- patch.md
|   `-- 2026-04-24 entry updated for plain-language label change
`-- 비전공자용.md
    `-- English path labels now include Korean role descriptions
```

### Summary / 요약
- 상단 아키텍처 설명을 문장 목록이 아니라 폴더를 한 번에 볼 수 있는 트리 형태로 바꿨다.
- `patch.md`와 `비전공자용.md` 모두 "저장소 전체 트리"와 "이번 패치가 건드린 트리"가 먼저 보이도록 재편했다.
- `AGENTS.md`에 앞으로도 두 문서가 tree-first 형식으로 유지되도록 규칙을 보강했다.
- `비전공자용.md`에서는 영어 경로 옆에 한글 기능 설명을 추가해 비전공자도 역할을 바로 읽을 수 있게 했다.

### Changed Files / 변경 파일
- `AGENTS.md`
- `patch.md`
- `비전공자용.md`

### Verification / 검증
- `rg -n "Current Repo Tree|KPI-Server/|existing patch/companion rule reused|English path labels now include Korean role descriptions" patch.md` → `matched-expected-tree-sections`
- `rg -n "저장소 트리 먼저 보기|KPI-Server/|공식 규칙 문서|쉬운 설명용 저장소 트리" 비전공자용.md` → `matched-expected-plain-tree-sections`
- `rg -n "tree-shaped view|트리\\(tree\\) 형태|touched-path tree" AGENTS.md` → `matched-expected-tree-rules`
- `rg -n "앱 시작점|요청 분기기|청구와 정산 기능|브라우저 시나리오 점검" 비전공자용.md` → `matched-expected-korean-role-labels`

### Notes / 메모
- 이 상단 아키텍처 설계도는 change tracking 용 supporting view 이며, authority 기준은 계속 `AGENTS.md`가 소유한다.

## 2026-04-23

### Architecture Impact / 아키텍처 수정사항
```text
KPI-Server/
|-- AGENTS.md
|-- patch.md
|-- .gitignore
|-- utility/
|   |-- runtime/util/KPI.util.data-sync.js
|   `-- apps/metering/runtime/utility-snapshots.js
`-- kpi-runtime/internal-server/
    |-- test/frontend/kpi-util-data-sync.smoke.js
    |-- test/frontend/metering-utility-snapshot-hydration.smoke.js
    `-- e2e/kpi-browser.playwright.js
```

### Summary / 요약
- 진행/status 정리 문서 3개를 제거했다.
- `AGENTS.md`를 장기 진행 추적용이 아니라 실작업용 규칙 문서로 재정의했다.
- `patch.md`를 repo root patch history 로그로 도입했다.
- 다른 로컬 작업공간에서 가져오는 파일도 이 저장소 규격에 맞춰 재편 후 patch 하도록 `AGENTS.md`에 명시했다.

### Changed Files / 변경 파일
- `AGENTS.md`
- `patch.md`
- `.gitignore`
- `utility/runtime/util/KPI.util.data-sync.js`
- `utility/apps/metering/runtime/utility-snapshots.js`
- `kpi-runtime/internal-server/test/frontend/kpi-util-data-sync.smoke.js`
- `kpi-runtime/internal-server/test/frontend/metering-utility-snapshot-hydration.smoke.js`
- `kpi-runtime/internal-server/e2e/kpi-browser.playwright.js`

### Removed Files / 삭제 파일
- `구조-개선-실행-페이즈.md`
- `구조-문제점-진단.md`
- `비전공자용.md`

### Verification / 검증
- `rg -n "구조-개선-실행-페이즈|구조-문제점-진단|비전공자용|supporting status 문서|supporting status docs" -S . -g '!patch.md'` → `no-active-references`

### Notes / 메모
- `patch.md`는 authority 문서가 아니라 patch 기록용 supporting 문서다.

### Cleanup Update / 테스트 산출물 정리
- 루트 `.codex-run/` 추적 스크래치 파일을 제거했다.
- `test-results/.last-run.json`, `kpi-runtime/internal-server/var/playwright/.last-run.json`을 제거했다.
- `kpi-runtime/internal-server/var/logs/readiness/`와 `var/tmp-*.log` 임시 검증 산출물을 제거했다.
- `.gitignore`에 `.playwright-mcp/`, `test-results/`를 추가했다.

### Wastewater Utility Fallback / 폐수 유틸리티 fallback
- `utility/runtime/util/KPI.util.data-sync.js` now restores initial waste utility rows from `PortalData.util_wastewater_data` when that legacy bootstrap record is present.
- Empty metering snapshots no longer wipe visible waste utility data while `window.__LOCAL_APP_STORE__` has not been hydrated.
- Added `kpi-runtime/internal-server/test/frontend/kpi-util-data-sync.smoke.js` to cover the fallback and the hydrated-empty-store clear path.
- `utility/apps/metering/runtime/utility-snapshots.js` now resolves the effective hydrated store before collecting month keys, so non-mounted waste snapshots no longer collapse to `months: []`.
- Added `kpi-runtime/internal-server/test/frontend/metering-utility-snapshot-hydration.smoke.js` to cover the stale `state.store` plus hydrated `loadStore()` case.
- Updated `kpi-runtime/internal-server/e2e/kpi-browser.playwright.js` to assert the current waste utility screen copy after selecting the waste utility page.
