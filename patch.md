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
