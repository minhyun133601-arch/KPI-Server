# 2026-05-05 Patch Note

Status: split refactor complete for the company runtime.

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

## Risk

No local experiment DB, logs, `.env`, uploads, runtime storage, auth/token cache, or secret material was copied or modified. Company runtime contract remains KPI `3100`, verification `3192`, PostgreSQL `5434`.
