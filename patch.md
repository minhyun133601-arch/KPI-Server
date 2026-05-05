# 2026-05-05 Patch Note

Status: split refactor complete for the company runtime; calculation regression fixtures added without production formula changes.

## Goal

Bring `KPI-Server` to the completed `KPI-local-main` split-refactor level while preserving company runtime ports, env boundaries, DB state, storage, logs, and credentials.

## Touched Areas

- KPI shell loader order: `KPI.html` and `kpi-runtime/app/boot/KPI.boot.manifest.js`.
- KPI app split: `kpi-runtime/app/KPI.app*.js`.
- Utility split: data sync, production sync, maintenance delete/config/export, report window shell.
- Production extractor split: app host, view model, render, and runtime script order.
- Ops console split: Data Path HTML/CSS/content/runtime and `ops-service` runtime/overview/actions.
- Repository Map: split Data Path entries and one 2026-05-05 history entry.
- Tests: split-loader and split-file smoke coverage.
- Tests/work-log: A~F calculation fixture locks for report deltas, report builder viz/pivot, gas correction ratio, electric allocation, billing signed totals, and KPI sync numeric normalization.

## Verification

- Active JS/MJS/HTML over 800 lines: 0.
- Patch history duplicate dates: 0.
- `node --check` active JS/MJS: pass.
- Targeted split smoke: 40 passed.
- `npm.cmd run format:check`: pass.
- `npm.cmd run lint`: pass.
- `npm.cmd run verify:server-structure`: pass, `warningCount: 0`.
- `npm.cmd test`: pass, 663 tests.
- `npm.cmd run verify`: pass, 663 tests in verify.
- Calculation fixture batch: changed JS `node --check` pass, targeted `node --test` pass (38 tests), `npm.cmd --prefix kpi-runtime/internal-server run lint` pass, `npm.cmd --prefix kpi-runtime/internal-server run format:check` pass, `npm.cmd --prefix kpi-runtime/internal-server test` pass (677 tests).
- Calculation fixture batch excluded `npm.cmd --prefix kpi-runtime/internal-server run verify` because the request excludes DB/runtime storage/cleanup/report access risk.

## Risk

No local experiment DB, logs, `.env`, uploads, runtime storage, auth/token cache, or secret material was copied or modified. Company runtime contract remains KPI `3100`, verification `3192`, PostgreSQL `5434`.
