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
