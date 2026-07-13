# Final frontend static audit

Date: `2026-07-13`
Scope: G007 final static integration audit after the util-runtime and section-factory test splits stabilized
Authority: repository `AGENTS.md`, `DESIGN.md`, `vowline`, `superloopy-frontend` with anti-slop/design-system/perfection references, and `kpi-server-change-gate`
Mutation boundary: audit-only; no product, test, package, loader, or manifest file was edited

## Decision

- **Static product/loader/debt gate: PASS.** No production JavaScript exceeds 1,500 lines, no production CSS exceeds 800 lines, no frontend smoke or support file exceeds 800 lines, and the maintainability verifier reports zero warnings.
- **Facade/loader/public-contract gate: PASS.** The normalized HTML and boot-manifest script orders match exactly, the required cache versions are present once, all bounded facades use their intended registry/API boundary, and the focused VM/contract batch passes.
- **Repository hygiene gate: PASS for tracked diff and changed text.** `git diff --check`, UTF-8 decoding, replacement/mojibake detection, high-signal secret scanning, stale-version scanning, format, lint, and server structure all pass. The server-structure command retains two pre-existing, out-of-scope soft warnings.
- **Move-only evidence completeness: PARTIAL.** CSS, report-section, experiment, and utility-graph lanes have numerical source/output hashes. Five other move-only lanes rely partly or wholly on assertion/AST/behavior summaries without a retained post-split equivalence hash. This is an evidence-quality finding, not a detected runtime defect, and should be closed before the final Superloopy completion claim.
- **Final browser gate: PENDING outside this static audit.** Real-browser evidence at 390/768/1280 and the final `VISUAL_QA.md` remain required before completion.

## 1. Debt and stale-baseline audit

Command:

```text
npm run verify:frontend-maintainability
```

Result:

```json
{
  "ok": true,
  "scannedProductionJsCount": 331,
  "scannedProductionCssCount": 66,
  "scannedFrontendSmokeCount": 214,
  "scannedFrontendSupportCount": 15,
  "warningCount": 0
}
```

Independent line-count readback:

| Category | Files | Files over requested ceiling | Maximum | Maximum file |
| --- | ---: | ---: | ---: | --- |
| Production JS | 331 | 0 over 1,500 | 1,185 | `utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-editor.js` |
| Production CSS | 66 | 0 over 800 | 797 | `team-report/runtime/work/history/styles/reference-ui.css` |
| Frontend smoke | 214 | 0 over 800 | 769 | `test/frontend/report-sheet-electric-comparison-summary.smoke.js` |
| Frontend support | 15 | 0 over 800 | 598 | `test/frontend/support/report-deck-controls-harness.js` |

`verifyFrontendMaintainability.js` now contains four empty legacy-baseline maps: `productionJs`, `productionCss`, `smoke`, and `support`. No stale no-growth baseline remains.

## 2. Loader order and cache-version alignment

Focused command:

```text
node --test test/frontend/kpi-boot-manifest.smoke.js test/frontend/frontend-refactor-contracts.smoke.js test/frontend/data-css-split.smoke.js test/frontend/residual-css-split.smoke.js test/frontend/kpi-shell-css.smoke.js test/frontend/utility-graph-template.smoke.js test/frontend/experiment-line-selection-labels.smoke.js test/frontend/equipment-history-render-adapter.smoke.js
```

Result: **PASS, 32/32**.

The boot-manifest test normalizes query/hash suffixes and proves exact equality between the static `KPI.html` order and the flattened manifest order. The refactor contract also proves the dependency order for graph-template parts/facade, utility-entry parts/facade, report section, experiment section, report adapter/runtime, report-sheet shell, and equipment-history renderer.

Exact `KPI.html` version readback:

| Asset | Required | Occurrences | Result |
| --- | --- | ---: | --- |
| Boot manifest | `KPI.boot.manifest.js?v=4` | 1 | PASS |
| Utility graph facade | `utility-graph-template/app.js?v=43` | 1 | PASS |
| Utility-entry facade | `KPI.sections.data.js?v=139` | 1 | PASS |
| Experiment facade | `KPI.sections.experiment.js?v=70` | 1 | PASS |
| Dashboard CSS | `dashboard.css?v=108` | 1 | PASS |
| Shell-chrome CSS | `shell-chrome.css?v=059` | 1 | PASS |
| Metering CSS | `metering.css?v=085` | 1 | PASS |
| Data CSS | `data.css?v=109` | 1 | PASS |
| Utility graph CSS | `utility-graph-template/styles.css?v=29` | 1 | PASS |

All 4 graph parts, 12 utility-entry parts, and 9 experiment parts use `?v=1`. Searches for the immediately stale values (`manifest v3`, graph app `v42`, utility facade `v138`, experiment `v69`, dashboard `v107`, shell chrome `v058`, metering `v084`, data CSS `v108`, graph CSS `v28`, report shell `v123`, report adapter `v74`, report runtime `v308`, report section `v107`, and equipment renderer `v52`) returned zero matches outside `.superloopy` and dependency metadata.

## 3. Facade, registry, line-cap, and public-surface audit

Line counts below use the repository verifier's trailing-newline semantics.

| Facade/host | Lines | Private boundary | Preserved public surface | Result |
| --- | ---: | --- | --- | --- |
| Equipment renderer | 39 | Existing browser-adapter shared API, intentionally not a new symbol registry | `render`, `getEquipmentHistorySaveAction`, `buildEquipmentHistoryPrintDocument` | PASS |
| Utility graph template | 29 | `kpi.utilityGraphTemplate.parts` | exact mutable 4-key API: `createEmptyData`, `mergeData`, `render`, `buildMonths` | PASS |
| Utility entry | 139 | `kpi.utilityEntryExperiment.parts` | exact 12-key `KpiUtilityEntryExperiment` API | PASS |
| Report section | 40 | `kpi.reportDeck.section.parts` | `report` section factory and unchanged cover content | PASS |
| Experiment section | 443 | `kpi.experiment.section.parts` | exact frozen 10-key normalization rules and frozen 37-key graph prototype | PASS |
| Report browser adapter | 61 | `kpi.reportDeck.browserAdapter.parts` | exact frozen 21-key adapter API | PASS |
| Report runtime host | 146 | `kpi.reportDeck.runtime.parts` | existing non-deck registrations; report initialization delegated privately | PASS |
| Report-sheet modal shell | 32 | `kpi.utilReport.sheet.modalShell.parts` | exact frozen 3-key API | PASS |

All 73 new/changed production JavaScript files in these split families pass `node --check`.

Focused public-surface/behavior command assembled 46 explicit split specs across equipment, section factory, utility entry, report-sheet shell, and report-deck/util runtime. Result: **PASS, 139/139**. The separate loader/CSS batch above contributes **32/32** more passing assertions.

## 4. Package smoke-script coverage

The extraction map required updates only for six pre-existing named package scripts. A JSON readback compared every expected replacement path and its explicit path count.

| Package script | Explicit specs | Result |
| --- | ---: | --- |
| `smoke:work-production` | 2 | PASS |
| `smoke:report-sheet-modal-shell` | 4 | PASS |
| `smoke:report-sheet-modal-render` | 3 | PASS |
| `smoke:metering-billing-settlement` | 2 | PASS |
| `smoke:metering-equipment-quick-entry` | 3 | PASS |
| `smoke:metering-save-validation` | 2 | PASS |

Result: **6 scripts, 0 missing paths, 0 implicit globs**. Equipment-history, util-runtime/report-deck, utility-entry corrections, and section-factory had no dedicated package script before the split; per `frontend-test-debt-map.md`, they are covered by explicit targeted commands and `npm test`, not by newly invented package scripts.

## 5. Hygiene, encoding, and sensitive-string audit

| Check | Result |
| --- | --- |
| `git diff --check` | PASS; only LF-to-CRLF working-copy notices |
| Changed/untracked text strict UTF-8 scan | 293 files; invalid UTF-8 0 |
| Unicode replacement character scan | 0 files |
| Mojibake heuristic (`Ã`, `Â`, broken UTF-8 Korean sequences, etc.) | 0 files |
| Conflict markers | 0 |
| High-signal secret scan | 293 files; private-key/API-token/JWT/literal-secret hits 0 |
| `npm run format:check` | PASS |
| `npm run lint` | PASS, zero warnings |
| `npm run verify:server-structure` | PASS; two pre-existing soft warnings only |

The two server-structure soft warnings are outside this frontend debt batch:

- `src/repositories/util-production-daily.js`: 399 lines, soft limit 300
- `team-report/runtime/work/history/KPI.work.history.view.render.js`: 433 lines, A-40 soft limit 300

One conditional whitespace note remains: the untracked evidence set contains 11 Markdown two-space hard-breaks near metadata headers. They are intentional Markdown formatting, but `git diff --check` cannot inspect untracked files. If `.superloopy` evidence is later staged, run `git diff --cached --check`; either keep the hard breaks under an explicit Markdown exception or normalize them before commit.

## 6. DESIGN and move-only/source-hash evidence

`DESIGN.md` is complete and defines the refactor as a `dense operational ledger` with `DESIGN_VARIANCE=1`, `MOTION_INTENSITY=0`, `VISUAL_DENSITY=8`, import-only CSS facades, cascade-order preservation, and unchanged public globals/data attributes/endpoints/payloads/print output. No visual redesign is authorized.

Numerically locked evidence already present:

- All five CSS split families: pre-split SHA-256 values and exact concatenation/order tests in `css-splits-implementation.md`; dashboard also retains raw and normalized hashes.
- Report section: pre/post generated content length `391429` and SHA-256 `0f856524c8f392709ec8b4530e8279b64c61be3213b968548188f0a9d9675da1`.
- Experiment section: generated content SHA-256 `752e00d405450c4beb3c108a8cb46945843fb05c1ea91ba9afda6237d8bec86e` and ordered-card hash `cb7ca08e6ad7fc4543eb85ca043239e269c95cf61322da479948dc16aa0e6a0b`.
- Utility graph: original source plus five source-span hashes and two output hashes.
- Report-sheet print assets: normalized original/current body hash `b663ace7ee20679327f82da469ddf6f2d2400ee866bddda7d3518c920c7708e0`.

Evidence-only findings to close before the final Superloopy completion claim:

1. **F-E01, medium, equipment renderer:** `equipment-split-implementation.md:25` states that every extracted body was found exactly, but retains no numerical source/body hash or command capture. Add the original revision identifier plus per-part or normalized concatenation hashes, or retain the exact comparison output as a G001 capture.
2. **F-E02, medium, report browser adapter:** `report-adapter-split-implementation.md:39` summarizes an AST literal/template-quasi audit with zero missing items, but no source hash or audit artifact is retained. Record the source revision/hash and the machine-readable audit output.
3. **F-E03, medium, report runtime:** `report-runtime-split-implementation.md:45-49` proves 551 registry symbols and zero unresolved cross-part references, but it does not hash or otherwise parity-lock moved template/copy bodies. Add a source-span/literal-quasi audit artifact or deterministic rendered-output hashes for the report-deck states covered by the split.
4. **F-E04, medium, utility entry:** `utility-entry-extraction-map.md:8` records the original snapshot SHA-256, while `utility-entry-product-split.md:32` proves 370 registry functions and zero missing references. There is no post-split source/output equivalence hash tying those two facts together. Add a normalized mapped-body hash or deterministic daily/monthly rendered-contract hashes.
5. **F-E05, low-to-medium, report-sheet shell:** `report-sheet-shell-split-implementation.md:41` parity-locks only the print-asset body. The other moved modal/extract/analysis fragments rely on behavior tests and per-file current hashes. Add one deterministic generated-analysis runtime/output hash or a mapped-fragment equivalence capture.

These findings do not indicate a discovered behavior regression. They identify where the move-only claim is less reproducible than the CSS/report/experiment/graph lanes.

## 7. Required next gates

No product/test/loader/package fix is required by this static audit. Before declaring the frontend debt goal complete:

1. Close or explicitly waive F-E01 through F-E05 with reproducible evidence.
2. Retain the parent integration's already completed `npm test` **951/951** and `npm run verify` PASS captures; this static audit deliberately did not duplicate that full-suite run.
3. Complete real-browser QA at 390, 768, and 1280 pixels, verify nested CSS imports, no horizontal page scroll, authenticated utility/report/equipment/experiment surfaces, interactive/error states, and unchanged print/export behavior.
4. Write the final `VISUAL_QA.md` and `PERF.md`/design-compliance evidence required by `superloopy-frontend`, then run the Superloopy audit/final gate.
5. If evidence files will be committed, stage them and repeat `git diff --cached --check` so untracked Markdown hard-break whitespace is intentionally resolved.

SUPERLOOPY_EVIDENCE: .superloopy/sessions/frontend-debt-refactor-20260713/evidence/final-frontend-static-audit.md
