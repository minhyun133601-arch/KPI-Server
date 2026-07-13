# File Diet Visual QA

- Scope: remove two unreferenced duplicate logo files and trim non-visual test infrastructure.
- Browser target: `http://127.0.0.1:3100/`
- Command: `npm run smoke:kpi-browser` with `KPI_BASE_URL=http://127.0.0.1:3100/`
- Result: FAIL at the existing authentication identity assertion after two runs.
- Expected: `#viewer-auth-identity` is `Codex E2E`.
- Actual: the asserted viewer element remains `-`, while the visible dashboard authentication bar shows `Codex E2E`.
- Asset inspection: the captured page renders without a broken-image marker or a visible request for either deleted logo.
- Responsive coverage: not completed because the existing authentication gate failed before the breakpoint pass.
- Visual change assessment: no layout, typography, color, spacing, motion, or visible copy was changed by this cleanup.

Artifact: `browser-1440.png`

Status: partial evidence; browser gate remains failing for an unrelated existing auth UI/E2E mismatch.
