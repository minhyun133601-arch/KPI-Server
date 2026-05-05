        function getUtilReportDetachedTableStyles() {
            return `
                :root { color-scheme: dark; }
                * { box-sizing: border-box; }
                body { margin: 0; font-family: 'Noto Sans KR', sans-serif; background: #020617; color: #e2e8f0; }
                .util-report-detached-shell { min-height: 100vh; display: grid; grid-template-rows: auto minmax(0, 1fr); }
                .util-report-detached-head { position: sticky; top: 0; z-index: 3; display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; padding: 12px 14px; border-bottom: 1px solid #1e293b; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(6px); }
                .util-report-detached-meta { display: grid; gap: 0.14rem; min-width: 0; }
                .util-report-detached-title { font-size: 0.94rem; font-weight: 900; color: #f8fafc; }
                .util-report-detached-sub { font-size: 0.74rem; color: #94a3b8; font-weight: 700; }
                .util-report-detached-status { font-size: 0.7rem; color: #cbd5e1; font-weight: 700; }
                .util-report-detached-close { border: 1px solid #475569; background: #0b1220; color: #f8fafc; border-radius: 999px; padding: 6px 12px; font-size: 0.74rem; font-weight: 800; cursor: pointer; }
                .util-report-detached-close:hover { border-color: #93c5fd; color: #dbeafe; }
                .util-report-detached-body { min-height: 0; overflow: auto; padding: 12px 14px 16px; }
                .util-report-detached-table-wrap { border: 1px solid #1e293b; border-radius: 14px; overflow: auto; background: #0b1220; }
                .util-report-detached-empty { border: 1px dashed #334155; border-radius: 12px; padding: 20px; text-align: center; font-size: 0.78rem; color: #94a3b8; }
                .util-report-yoy-table { width: 100%; min-width: 740px; border-collapse: separate; border-spacing: 0; font-size: 0.74rem; color: #e2e8f0; font-variant-numeric: tabular-nums; }
                .util-report-yoy-table.is-timeline { min-width: 360px; }
                .util-report-yoy-table.is-timeline th:first-child, .util-report-yoy-table.is-timeline td:first-child { min-width: 94px; }
                .util-report-yoy-table.is-timeline th:nth-child(2), .util-report-yoy-table.is-timeline td:nth-child(2) { min-width: 180px; }
                .util-report-yoy-table th, .util-report-yoy-table td { border-bottom: 1px solid rgba(148, 163, 184, 0.22); padding: 8px 10px; white-space: nowrap; text-align: right; background: rgba(8, 18, 34, 0.96); }
                .util-report-yoy-table tbody tr:nth-child(even) td { background: rgba(15, 23, 42, 0.78); }
                .util-report-yoy-table th:first-child, .util-report-yoy-table td:first-child { text-align: left; position: sticky; left: 0; background: #0b1220; z-index: 1; }
                .util-report-yoy-table th { position: sticky; top: 0; background: #111827; color: #cbd5e1; font-weight: 800; z-index: 2; vertical-align: top; }
                .util-report-yoy-table tfoot td { background: rgba(15, 23, 42, 0.96); font-weight: 900; }
                .util-report-yoy-table tbody tr.is-focused td { background: rgba(254, 249, 195, 0.9); color: #111827; box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.72); }
                .util-report-yoy-table tbody tr.is-focused td:first-child { background: rgba(253, 230, 138, 0.95); }
                .util-report-yoy-table td.is-cell-focused { background: rgba(250, 204, 21, 0.96); color: #111827; box-shadow: inset 0 0 0 2px rgba(180, 83, 9, 0.9), 0 0 0 1px rgba(254, 240, 138, 0.35); }
                .util-report-yoy-table.is-structured th .util-head-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
                .util-report-yoy-table.is-structured th:first-child .util-head-cell { align-items: flex-start; text-align: left; }
                .util-report-yoy-table.is-structured th:not(:first-child) .util-head-cell { align-items: flex-end; text-align: right; }
                .util-report-yoy-table.is-structured th .util-head-label { font-size: 0.76rem; font-weight: 900; line-height: 1.08; letter-spacing: 0.01em; color: #f8fafc; }
                .util-report-yoy-table.is-structured th .util-head-sub { font-size: 0.64rem; font-weight: 800; line-height: 1.14; color: #cbd5e1; }
                .util-report-yoy-table.is-structured th.is-primary,
                .util-report-yoy-table.is-structured th.is-current { color: #bfdbfe; background: rgba(37, 99, 235, 0.18); box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18); }
                .util-report-yoy-table.is-structured th.is-primary .util-head-label,
                .util-report-yoy-table.is-structured th.is-current .util-head-label { color: #eff6ff; }
                .util-report-yoy-table.is-structured th.is-primary .util-head-sub,
                .util-report-yoy-table.is-structured th.is-current .util-head-sub { color: #dbeafe; }
                .util-report-yoy-table.is-structured th.is-prev { color: #fdba74; background: rgba(249, 115, 22, 0.18); box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.18); }
                .util-report-yoy-table.is-structured th.is-prev .util-head-label { color: #fff7ed; }
                .util-report-yoy-table.is-structured th.is-prev .util-head-sub { color: #ffedd5; }
                .util-report-yoy-table.is-structured th.is-delta,
                .util-report-yoy-table.is-structured th.is-rate { color: #e2e8f0; background: rgba(71, 85, 105, 0.28); box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16); }
                .util-report-yoy-table.is-structured th.is-delta .util-head-label,
                .util-report-yoy-table.is-structured th.is-rate .util-head-label { color: #f8fafc; }
                .util-report-yoy-table.is-structured th.is-delta .util-head-sub,
                .util-report-yoy-table.is-structured th.is-rate .util-head-sub { color: #e2e8f0; }
                .util-report-yoy-table.is-structured td.is-primary,
                .util-report-yoy-table.is-structured td.is-current { color: #eff6ff; font-weight: 800; }
                .util-report-yoy-table.is-structured td.is-prev { color: #ffedd5; }
                .util-report-yoy-table.is-structured tbody td:first-child,
                .util-report-yoy-table.is-structured tfoot td:first-child { color: #f8fafc; font-weight: 800; }
                .util-report-yoy-table.is-structured .util-report-yoy-row-label { display: inline-flex; align-items: center; min-height: 22px; font-weight: 800; }
                .util-report-yoy-table.is-structured .util-report-yoy-value { display: inline-flex; align-items: center; justify-content: flex-end; min-height: 22px; font-weight: 800; letter-spacing: -0.01em; }
                .util-report-yoy-table.is-structured .util-report-yoy-pill { display: inline-flex; align-items: center; justify-content: flex-end; min-height: 28px; padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.18); background: rgba(148, 163, 184, 0.1); font-size: 0.76rem; font-weight: 900; line-height: 1.15; }
                .util-report-yoy-table.is-structured .util-report-yoy-pill.is-rate { min-width: 88px; }
                .util-report-yoy-table.is-structured .util-report-yoy-pill.is-up { color: #fecaca; border-color: rgba(248, 113, 113, 0.34); background: rgba(127, 29, 29, 0.18); }
                .util-report-yoy-table.is-structured .util-report-yoy-pill.is-down { color: #bae6fd; border-color: rgba(56, 189, 248, 0.34); background: rgba(8, 47, 73, 0.24); }
                .util-report-yoy-table.is-structured .util-report-yoy-pill.is-flat { color: #cbd5e1; border-color: rgba(148, 163, 184, 0.18); background: rgba(15, 23, 42, 0.46); }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack { display: inline-grid; justify-items: end; gap: 4px; padding: 4px 10px; border-radius: 14px; border: 1px solid rgba(148, 163, 184, 0.18); background: rgba(148, 163, 184, 0.1); min-width: 132px; }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-value { font-size: 0.8rem; font-weight: 900; line-height: 1.1; letter-spacing: -0.01em; }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-rate { font-size: 0.66rem; font-weight: 800; line-height: 1.05; color: #cbd5e1; }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack.is-up { color: #fecaca; border-color: rgba(248, 113, 113, 0.34); background: rgba(127, 29, 29, 0.18); }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack.is-up .util-report-yoy-delta-rate { color: #fecaca; }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack.is-down { color: #bae6fd; border-color: rgba(56, 189, 248, 0.34); background: rgba(8, 47, 73, 0.24); }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack.is-down .util-report-yoy-delta-rate { color: #bae6fd; }
                .util-report-yoy-table.is-structured .util-report-yoy-delta-stack.is-flat { color: #cbd5e1; border-color: rgba(148, 163, 184, 0.18); background: rgba(15, 23, 42, 0.46); }
                .util-report-yoy-table.is-structured .util-report-yoy-summary { display: grid; gap: 2px; }
                .util-report-yoy-table.is-structured .util-report-yoy-summary-title { font-size: 0.72rem; font-weight: 900; color: #f8fafc; line-height: 1.08; }
                .util-report-yoy-table.is-structured .util-report-yoy-summary-sub { font-size: 0.6rem; font-weight: 800; color: #94a3b8; line-height: 1.08; }
                .util-report-yoy-table.is-structured tfoot tr.util-report-yoy-total td { background: rgba(15, 23, 42, 0.96) !important; }
                .util-report-yoy-table.is-structured tfoot tr.util-report-yoy-total td.is-primary,
                .util-report-yoy-table.is-structured tfoot tr.util-report-yoy-total td.is-current { color: #bfdbfe; }
                .util-report-yoy-table.is-structured tfoot tr.util-report-yoy-total td.is-prev { color: #fdba74; }
                .util-report-inline-table-wrap { min-height: 100%; padding-top: 2px; display: grid; gap: 10px; align-content: start; }
                .util-report-yoy-compare-block { display: grid; gap: 10px; align-content: start; }
                .util-report-yoy-compare-block .util-report-builder-viz-compare-meta { grid-template-columns: repeat(auto-fit, minmax(176px, 1fr)); justify-content: stretch; padding: 0; }
                .util-report-yoy-compare-block .util-report-builder-viz-compare-chip { min-height: 64px; }
                .util-report-builder-viz-timeline-table tbody tr.is-row-focused td { background: rgba(254, 249, 195, 0.82); color: #111827; box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.62); }
                .util-report-builder-viz-timeline-table tbody tr.is-row-focused td:first-child { background: rgba(253, 230, 138, 0.94); }
                .util-report-builder-viz-timeline-table td.is-cell-focused { position: relative; background: rgba(250, 204, 21, 0.96); color: #111827; box-shadow: inset 0 0 0 2px rgba(180, 83, 9, 0.9), 0 0 0 1px rgba(254, 240, 138, 0.35); z-index: 1; }
                .util-report-builder-viz-timeline-table td.is-cell-focused:first-child { box-shadow: inset 0 0 0 2px rgba(180, 83, 9, 0.9), 0 0 0 1px rgba(254, 240, 138, 0.35); }
                .util-report-yoy-table, .util-report-yoy-table * { user-select: text; }
                .util-report-builder-viz-detail-block { display: grid; gap: 10px; padding: 10px; }
                .util-report-builder-viz-detail-title { font-size: 0.82rem; font-weight: 900; color: #dbeafe; }
                .util-report-builder-viz-compare-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(154px, 1fr)); gap: 8px; padding: 0 0 4px; }
                .util-report-builder-viz-compare-chip { border: 1px solid rgba(71, 85, 105, 0.44); border-radius: 14px; padding: 9px 11px; background: rgba(15, 23, 42, 0.5); display: grid; gap: 3px; min-height: 68px; align-content: start; }
                .util-report-builder-viz-compare-chip .label { font-size: 0.64rem; color: #94a3b8; font-weight: 800; letter-spacing: 0.01em; }
                .util-report-builder-viz-compare-chip .value { font-size: 0.94rem; color: #f8fafc; font-weight: 900; letter-spacing: -0.02em; }
                .util-report-builder-viz-compare-chip .meta { font-size: 0.68rem; color: #cbd5e1; font-weight: 800; }
                .util-report-builder-viz-compare-chip.is-actual { border-color: rgba(59, 130, 246, 0.38); background: rgba(30, 64, 175, 0.12); }
                .util-report-builder-viz-compare-chip.is-applied { border-color: rgba(249, 115, 22, 0.38); background: rgba(154, 52, 18, 0.12); }
                .util-report-builder-viz-compare-chip.is-delta { border-color: rgba(148, 163, 184, 0.3); box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.04); }
                .util-report-builder-viz-compare-chip.is-delta .label { color: #e2e8f0; }
                .util-report-builder-viz-compare-chip.is-delta .value { font-size: 1.08rem; }
                .util-report-builder-viz-compare-chip.is-peak { border-color: rgba(125, 211, 252, 0.3); background: rgba(15, 23, 42, 0.72); }
                .util-report-builder-viz-compare-chip.is-delta.util-report-builder-viz-detail-delta-up,
                .util-report-builder-viz-compare-chip.is-peak.util-report-builder-viz-detail-delta-up { border-color: rgba(248, 113, 113, 0.42); background: rgba(127, 29, 29, 0.16); }
                .util-report-builder-viz-compare-chip.is-delta.util-report-builder-viz-detail-delta-down,
                .util-report-builder-viz-compare-chip.is-peak.util-report-builder-viz-detail-delta-down { border-color: rgba(56, 189, 248, 0.42); background: rgba(8, 47, 73, 0.2); }
                .util-report-builder-viz-compare-table th .util-head-cell { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
                .util-report-builder-viz-compare-table th:first-child .util-head-cell { align-items: flex-start; text-align: left; }
                .util-report-builder-viz-compare-table th:not(:first-child) .util-head-cell { align-items: flex-end; text-align: right; }
                .util-report-builder-viz-compare-table th .util-head-label { font-size: 0.76rem; font-weight: 900; line-height: 1.08; letter-spacing: 0.01em; color: #f8fafc; }
                .util-report-builder-viz-compare-table th .util-head-sub { font-size: 0.64rem; font-weight: 800; line-height: 1.14; color: #cbd5e1; }
                .util-report-builder-viz-compare-table th.is-actual { color: #bfdbfe; background: rgba(37, 99, 235, 0.18); box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18); }
                .util-report-builder-viz-compare-table th.is-actual .util-head-label { color: #eff6ff; }
                .util-report-builder-viz-compare-table th.is-actual .util-head-sub { color: #dbeafe; }
                .util-report-builder-viz-compare-table th.is-applied { color: #fdba74; background: rgba(249, 115, 22, 0.18); box-shadow: inset 0 0 0 1px rgba(251, 146, 60, 0.18); }
                .util-report-builder-viz-compare-table th.is-applied .util-head-label { color: #fff7ed; }
                .util-report-builder-viz-compare-table th.is-applied .util-head-sub { color: #ffedd5; }
                .util-report-builder-viz-compare-table th.is-delta { color: #e2e8f0; background: rgba(71, 85, 105, 0.28); box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.16); }
                .util-report-builder-viz-compare-table th.is-delta .util-head-label { color: #f8fafc; }
                .util-report-builder-viz-compare-table th.is-delta .util-head-sub { color: #e2e8f0; }
                .util-report-builder-viz-compare-table td.is-actual { color: #eff6ff; font-weight: 800; background: transparent; }
                .util-report-builder-viz-compare-table td.is-applied { color: #ffedd5; background: transparent; }
                .util-report-builder-viz-compare-table tbody td:first-child,
                .util-report-builder-viz-compare-table tfoot td:first-child { color: #f8fafc; font-weight: 800; }
                .util-report-builder-viz-compare-delta-cell { min-width: 140px; }
                .util-report-builder-viz-compare-delta-value { display: inline-flex; align-items: center; justify-content: flex-end; padding: 4px 10px; border-radius: 999px; font-size: 0.79rem; font-weight: 900; background: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.16); }
                .util-report-builder-viz-compare-delta-cell.util-report-builder-viz-detail-delta-up .util-report-builder-viz-compare-delta-value { background: rgba(127, 29, 29, 0.18); border-color: rgba(248, 113, 113, 0.34); }
                .util-report-builder-viz-compare-delta-cell.util-report-builder-viz-detail-delta-down .util-report-builder-viz-compare-delta-value { background: rgba(8, 47, 73, 0.22); border-color: rgba(56, 189, 248, 0.34); }
                .util-report-builder-viz-compare-delta-rate { margin-top: 4px; font-size: 0.68rem; font-weight: 800; }
                .util-report-builder-viz-compare-total td { background: rgba(15, 23, 42, 0.86) !important; font-weight: 900; }
                .util-report-builder-viz-compare-total td.is-actual { color: #bfdbfe; }
                .util-report-builder-viz-compare-total td.is-applied { color: #fdba74; }
                .util-report-builder-viz-detail-delta-up { color: #fca5a5; font-weight: 900; }
                .util-report-builder-viz-detail-delta-down { color: #7dd3fc; font-weight: 900; }
                .util-report-delta.is-up { color: #ef4444; }
                .util-report-delta.is-down { color: #38bdf8; }
                .util-report-delta.is-flat { color: #94a3b8; }
                @media (max-width: 920px) {
                    .util-report-builder-viz-compare-meta { grid-template-columns: 1fr; }
                }
            `;
        }
