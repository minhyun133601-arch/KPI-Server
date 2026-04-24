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
