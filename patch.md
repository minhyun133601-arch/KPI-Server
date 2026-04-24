# patch.md
작성일 / Date: `2026-04-23`
개정일 / Revised: `2026-04-24`
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
