# AGENTS.md

Repository contract for the desktop `KPI-Server` central server workspace. User-facing responses are Korean-first unless requested otherwise.

## Runtime

- KPI server: `0.0.0.0:3100`; PostgreSQL: `127.0.0.1:5434`.
- Ops console: `3215-3218`; verification runtime: `3192`.
- Env files: `kpi-runtime/internal-server/.env.production.local` and `.env.development.local`.
- Runtime state: `kpi-runtime/internal-server/var`.
- Use `commands/open-ops-console.cmd` and `commands/close-ops-console.cmd` for normal start and stop operations.
- Run npm commands from `kpi-runtime/internal-server`; run root smoke checks with `KPI_BASE_URL=http://127.0.0.1:3100/`.

## Safety

- Read relevant files first, make the smallest coherent change, and preserve unrelated user changes.
- Treat desktop `kpi-local/KPI-local-main` as read-only. Do not copy its secrets, env files, runtime data, logs, dumps, uploads, or repository metadata.
- Require explicit approval for commit, push, deployment, external messaging, public exposure, production restore, or destructive recovery.
- Before migrations, bulk import or replacement, destructive repair, or production-like database changes, create a PostgreSQL custom-format backup.
- Keep authentication, authorization, input validation, and storage-path enforcement on the server.

## Verification

- Docs and config: UTF-8 readback, syntax check where applicable, and stale-reference scan.
- Server changes: `npm run format:check`, `npm run lint`, and relevant tests; use `npm run verify` for shared or high-risk behavior when available.
- Browser-visible changes: verify with a real server or the existing browser smoke tests.
- Report changed files, verification results, and remaining risk. Do not commit, push, deploy, or publish unless explicitly requested.
