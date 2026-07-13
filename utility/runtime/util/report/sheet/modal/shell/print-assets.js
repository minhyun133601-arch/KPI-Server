(function registerUtilReportSheetModalShellPrintAssets(root) {
    const parts = root[Symbol.for('kpi.utilReport.sheet.modalShell.parts')] ||= Object.create(null);

    function getGasMeterPrintExtractCss() {
        return `
                    @page { size: A4 landscape; margin: 5mm; }
                    body.is-gas-meter-print { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .util-sheet-meter-extract-page.is-gas-meter-print {
                        width: 287mm;
                        min-height: 0 !important;
                        box-sizing: border-box;
                        margin: 0 auto;
                        padding: 0;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section-head,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-main-controls,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-window-actions,
                    .util-sheet-meter-extract-page.is-gas-meter-print [data-role="util-sheet-billing-preview-toggle"] {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-extract-body,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-body,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section {
                        width: 100% !important;
                        min-width: 0 !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        box-sizing: border-box;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-section {
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-report-body {
                        display: grid !important;
                        gap: 2.4mm !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-layout {
                        display: grid !important;
                        grid-template-columns: minmax(0, 1fr) 82mm !important;
                        gap: 3mm !important;
                        align-items: start !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-stack {
                        display: grid !important;
                        gap: 2.4mm !important;
                        min-width: 0 !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-card {
                        display: grid !important;
                        gap: 1.4mm !important;
                        padding: 2mm !important;
                        border: 1px solid #dbeafe !important;
                        border-radius: 3mm !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                        break-inside: avoid;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-card.is-current {
                        border-color: #dbeafe !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-head {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 1.4mm !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        border-bottom: 0 !important;
                        background: transparent !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-title {
                        font-size: 8pt !important;
                        line-height: 1.12 !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table-sub {
                        margin-top: 0.3mm !important;
                        font-size: 5.6pt !important;
                        line-height: 1.1 !important;
                        font-weight: 700 !important;
                        color: #64748b !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table-wrap {
                        max-height: none !important;
                        overflow: visible !important;
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 2mm !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table td {
                        padding: 0.9mm 1.2mm !important;
                        border: 0 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        color: #334155 !important;
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                        vertical-align: middle !important;
                        white-space: nowrap !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table th {
                        background: #f8fafc !important;
                        color: #475569 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table th:first-child,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table td:first-child {
                        width: 25% !important;
                        text-align: left !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table td:not(:first-child),
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-table th:not(:first-child) {
                        text-align: right !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-table td.is-accent {
                        color: #0f172a !important;
                        font-weight: 900 !important;
                        background: rgba(251, 191, 36, 0.12) !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-name {
                        display: flex !important;
                        align-items: center !important;
                        gap: 1mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-label {
                        font-size: 6.1pt !important;
                        line-height: 1.08 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-caption,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-meter-cell-meta {
                        font-size: 5pt !important;
                        line-height: 1.05 !important;
                        color: #64748b !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary {
                        display: grid !important;
                        gap: 1.8mm !important;
                        min-width: 0 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-shell {
                        display: grid !important;
                        gap: 1.8mm !important;
                        padding: 2mm !important;
                        border-radius: 3mm !important;
                        border: 1px solid #e2e8f0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group {
                        display: grid !important;
                        gap: 1.2mm !important;
                        padding: 1.6mm !important;
                        border-radius: 2mm !important;
                        border: 1px solid #e2e8f0 !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group.is-lpg { background: #fff7ed !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-group.is-lng { background: #eff6ff !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-head {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 1mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-title {
                        display: inline-flex !important;
                        align-items: center !important;
                        gap: 1mm !important;
                        font-size: 6.4pt !important;
                        line-height: 1.12 !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-icon {
                        width: 4.2mm !important;
                        height: 4.2mm !important;
                        border-radius: 1.2mm !important;
                        font-size: 4.8pt !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-actions,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-doc-btn {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table-wrap,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table-wrap {
                        overflow: visible !important;
                        border-radius: 2mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 5.4pt !important;
                        line-height: 1.08 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table td,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table td {
                        padding: 0.75mm 0.9mm !important;
                        border-color: #dbe4f3 !important;
                        font-size: 5.4pt !important;
                        line-height: 1.08 !important;
                        vertical-align: middle !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-row-label,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-total-label,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-row-label,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team {
                        gap: 0.55mm !important;
                        font-size: 5.1pt !important;
                        line-height: 1.05 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-row-label span,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-total-label span,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-row-label span,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team span {
                        font-size: inherit !important;
                        line-height: inherit !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-row-icon {
                        width: 3.6mm !important;
                        height: 3.6mm !important;
                        border-radius: 1mm !important;
                        font-size: 4.4pt !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table td.is-amount,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage-table td {
                        font-size: 5.2pt !important;
                        line-height: 1.06 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-table td.is-note {
                        font-size: 4.7pt !important;
                        line-height: 1.08 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-block {
                        display: grid !important;
                        gap: 1.4mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-table th,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-summary-grand-table td {
                        padding: 1mm 1.2mm !important;
                        font-size: 6pt !important;
                        line-height: 1.06 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-usage {
                        display: grid !important;
                        gap: 0 !important;
                        border-radius: 2mm !important;
                        border: 1px solid #cbd5e1 !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 0.8mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-production-team-mark {
                        min-width: 5.5mm !important;
                        height: 4.8mm !important;
                        border-radius: 999px !important;
                        font-size: 5.2pt !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance {
                        display: grid !important;
                        gap: 1mm !important;
                        padding: 2mm !important;
                        border-radius: 2mm !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-head {
                        gap: 1mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-icon {
                        width: 4.4mm !important;
                        height: 4.4mm !important;
                        border-radius: 1mm !important;
                        font-size: 4.8pt !important;
                        flex: 0 0 4.4mm !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-copy {
                        gap: 0.65mm !important;
                        padding-left: 0 !important;
                    }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-title { font-size: 6.2pt !important; }
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-sub,
                    .util-sheet-meter-extract-page.is-gas-meter-print .util-sheet-gas-guidance-line {
                        font-size: 4.8pt !important;
                        line-height: 1.1 !important;
                    }
                    @media print {
                        html,
                        body.is-gas-meter-print {
                            width: auto !important;
                            height: auto !important;
                            min-height: 0 !important;
                            overflow: visible !important;
                        }
                        .util-sheet-meter-extract-page.is-gas-meter-print {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
        `;
    }

    function getElectricMeterPrintExtractCss() {
        return `
                    @page { size: A4; margin: 0; }
                    body.is-electric-meter-print { background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .util-sheet-meter-extract-page.is-electric-meter-print {
                        --util-electric-print-row-pad-y: 0.58mm;
                        --util-electric-print-card-gap: 2mm;
                        --util-electric-print-card-pad: 1.6mm;
                        --util-electric-print-table-card-gap: 1mm;
                        --util-electric-print-number-font-size: 4.35pt;
                        --util-electric-print-number-pad-x: 0.34mm;
                        width: 100vw;
                        max-width: none;
                        min-height: 0 !important;
                        box-sizing: border-box;
                        margin: 0 auto;
                        padding: 0;
                        overflow: visible !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-extract-head,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-head,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-section-head,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-main-controls,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-window-actions,
                    .util-sheet-meter-extract-page.is-electric-meter-print [data-role="util-sheet-report-print"],
                    .util-sheet-meter-extract-page.is-electric-meter-print [data-role="util-sheet-billing-preview-toggle"],
                    .util-sheet-meter-extract-page.is-electric-meter-print [data-role="util-sheet-meter-electric-view-toggle"] {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-extract-body,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-body,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-section {
                        width: 100% !important;
                        min-width: 0 !important;
                        height: auto !important;
                        min-height: 0 !important;
                        max-height: none !important;
                        box-sizing: border-box;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-card,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-section {
                        margin: 0 !important;
                        padding: 0 !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-report-body {
                        display: block !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-stack {
                        display: grid !important;
                        gap: var(--util-electric-print-card-gap, 2mm) !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-card {
                        display: grid !important;
                        gap: var(--util-electric-print-table-card-gap, 1mm) !important;
                        padding: var(--util-electric-print-card-pad, 1.6mm) !important;
                        border: 1px solid #dbeafe !important;
                        border-radius: 2mm !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        overflow: visible !important;
                        break-inside: avoid;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-card.is-current {
                        border-color: #dbeafe !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-head {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: space-between !important;
                        gap: 1mm !important;
                        min-height: 0 !important;
                        padding: 0 !important;
                        border-bottom: 0 !important;
                        background: transparent !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-title-wrap {
                        display: flex !important;
                        align-items: center !important;
                        gap: 1mm !important;
                        min-width: 0 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-badge {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-title {
                        font-size: 8pt !important;
                        line-height: 1.08 !important;
                        font-weight: 900 !important;
                        color: #0f172a !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-sub {
                        margin-top: 0.2mm !important;
                        font-size: 5.4pt !important;
                        line-height: 1.05 !important;
                        font-weight: 700 !important;
                        color: #64748b !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-table-wrap,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-disclosure-table-stack {
                        width: 100% !important;
                        max-height: none !important;
                        overflow: visible !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-table-wrap {
                        border: 1px solid #e2e8f0 !important;
                        border-radius: 1.5mm !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-table,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric {
                        width: 100% !important;
                        min-width: 0 !important;
                        table-layout: fixed !important;
                        border-collapse: collapse !important;
                        font-size: 5.2pt !important;
                        line-height: 1.05 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td {
                        position: static !important;
                        min-width: 0 !important;
                        padding: var(--util-electric-print-row-pad-y, 0.58mm) 0.7mm !important;
                        border: 0 !important;
                        border-right: 1px solid #e2e8f0 !important;
                        border-bottom: 1px solid #e2e8f0 !important;
                        box-shadow: none !important;
                        color: #334155 !important;
                        font-size: 5.2pt !important;
                        line-height: 1.05 !important;
                        vertical-align: middle !important;
                        white-space: normal !important;
                        overflow-wrap: anywhere !important;
                        word-break: keep-all !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th {
                        background: #f8fafc !important;
                        color: #475569 !important;
                        font-weight: 900 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th:first-child,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td:first-child {
                        width: 9% !important;
                        text-align: left !important;
                        color: #0f172a !important;
                        background: #ffffff !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric thead th:first-child {
                        background: #f8fafc !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td:not(:first-child),
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th:not(:first-child) {
                        text-align: center !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td:not(:first-child) {
                        white-space: nowrap !important;
                        overflow-wrap: normal !important;
                        word-break: normal !important;
                        padding-left: var(--util-electric-print-number-pad-x, 0.34mm) !important;
                        padding-right: var(--util-electric-print-number-pad-x, 0.34mm) !important;
                        font-size: var(--util-electric-print-number-font-size, 4.35pt) !important;
                        line-height: 1 !important;
                        font-variant-numeric: tabular-nums !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-row-label {
                        display: inline-grid !important;
                        gap: 0.14mm !important;
                        align-items: center !important;
                        line-height: 1 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-row-label-main,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-row-label-unit {
                        display: block !important;
                        white-space: nowrap !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-row-label-unit {
                        color: #64748b !important;
                        font-size: 0.84em !important;
                        font-weight: 800 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-cell {
                        display: grid !important;
                        gap: 0.2mm !important;
                        min-width: 0 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-label-wrap {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        gap: 0.35mm !important;
                        min-width: 0 !important;
                        flex-wrap: wrap !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-label,
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-sub {
                        min-width: 0 !important;
                        color: inherit !important;
                        white-space: normal !important;
                        overflow-wrap: anywhere !important;
                        word-break: keep-all !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-label {
                        font-size: 4.8pt !important;
                        line-height: 1 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric .util-head-sub {
                        font-size: 4.3pt !important;
                        line-height: 1 !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-team-chip {
                        width: 1.8mm !important;
                        height: 1.8mm !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td[data-team-key] {
                        background: color-mix(in srgb, var(--util-team-soft, #f8fafc) 62%, #ffffff) !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th[data-team-group-start],
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td[data-team-group-start] {
                        border-left: 1.5px solid var(--util-team-color, #cbd5e1) !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th[data-team-group-end],
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td[data-team-group-end] {
                        border-right: 1.5px solid var(--util-team-color, #cbd5e1) !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td.is-accent {
                        color: #0f172a !important;
                        font-weight: 900 !important;
                        background: #f8fafc !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric th[data-correction-source="true"],
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-meter-table-electric td[data-correction-source="true"] {
                        color: #0f766e !important;
                        background: #f0fdfa !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-disclosure {
                        border: 0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-disclosure summary {
                        display: none !important;
                    }
                    .util-sheet-meter-extract-page.is-electric-meter-print .util-sheet-disclosure-body {
                        padding: 0 !important;
                    }
                    @media print {
                        html,
                        body.is-electric-meter-print {
                            width: auto !important;
                            height: auto !important;
                            min-height: 0 !important;
                            overflow: visible !important;
                        }
                        .util-sheet-meter-extract-page.is-electric-meter-print {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
        `;
    }

    function buildElectricMeterPrintFitScript() {
        const runtimeSource = function utilSheetElectricMeterPrintFit() {
            const root = document.querySelector('[data-electric-print-fit-root="true"]');
            if (!root) return;
            const view = document.defaultView || null;

            const BASE = {
                rowPad: 0.58,
                cardGap: 2,
                cardPad: 1.6,
                tableCardGap: 1,
                numberFont: 4.35
            };
            const LIMITS = {
                rowPadMin: 0.34,
                rowPadMax: 3.1,
                cardGapMin: 1,
                cardGapMax: 8,
                cardPadMin: 0.8,
                cardPadMax: 3.6,
                tableCardGapMin: 0.6,
                tableCardGapMax: 2.4,
                numberFontMin: 3.2,
                numberFontMax: 4.35
            };
            const A4 = {
                landscapeWidth: 297,
                landscapeHeight: 210,
                portraitWidth: 210,
                portraitHeight: 297
            };

            function clamp(value, min, max) {
                return Math.min(max, Math.max(min, value));
            }

            function toMm(value) {
                return `${Number(value || 0).toFixed(2)}mm`;
            }

            function toPt(value) {
                return `${Number(value || 0).toFixed(2)}pt`;
            }

            function getMmPx() {
                const ruler = document.createElement('div');
                ruler.style.cssText = 'position:absolute;left:-10000px;top:-10000px;width:100mm;height:1mm;visibility:hidden;pointer-events:none;';
                document.body.appendChild(ruler);
                const width = ruler.getBoundingClientRect().width;
                ruler.remove();
                return width > 0 ? width / 100 : 3.7795275591;
            }

            function setRootVars(vars) {
                root.style.setProperty('--util-electric-print-row-pad-y', toMm(vars.rowPad));
                root.style.setProperty('--util-electric-print-card-gap', toMm(vars.cardGap));
                root.style.setProperty('--util-electric-print-card-pad', toMm(vars.cardPad));
                root.style.setProperty('--util-electric-print-table-card-gap', toMm(vars.tableCardGap));
                root.style.setProperty('--util-electric-print-number-font-size', toPt(vars.numberFont || BASE.numberFont));
            }

            function serializeVars(vars) {
                return [
                    `--util-electric-print-row-pad-y: ${toMm(vars.rowPad)} !important;`,
                    `--util-electric-print-card-gap: ${toMm(vars.cardGap)} !important;`,
                    `--util-electric-print-card-pad: ${toMm(vars.cardPad)} !important;`,
                    `--util-electric-print-table-card-gap: ${toMm(vars.tableCardGap)} !important;`,
                    `--util-electric-print-number-font-size: ${toPt(vars.numberFont || BASE.numberFont)} !important;`
                ].join('');
            }

            function getContentMetrics(mmPx, pageWidthMm) {
                const measureWidth = Number(pageWidthMm) || 0;
                const previousWidth = root.style.width;
                const previousMaxWidth = root.style.maxWidth;
                if (measureWidth > 0) {
                    root.style.width = toMm(measureWidth);
                    root.style.maxWidth = 'none';
                }
                setRootVars(BASE);
                root.dataset.electricPrintFit = 'measuring';
                try {
                    const body = root.querySelector('[data-electric-print-fit-body="true"]')
                        || root.querySelector('.util-sheet-meter-extract-body')
                        || root;
                    const stack = root.querySelector('.util-sheet-meter-table-stack') || body;
                    const bodyRect = body.getBoundingClientRect();
                    const stackRect = stack.getBoundingClientRect();
                    const contentHeightPx = Math.max(
                        bodyRect.height || 0,
                        stackRect.height || 0,
                        body.scrollHeight || 0,
                        stack.scrollHeight || 0
                    );
                    return {
                        contentHeightMm: contentHeightPx > 0 ? contentHeightPx / mmPx : 0,
                        rowCount: Math.max(1, root.querySelectorAll('.util-sheet-meter-table-electric tr').length),
                        cardCount: Math.max(1, root.querySelectorAll('.util-sheet-meter-table-card').length)
                    };
                } finally {
                    if (measureWidth > 0) {
                        root.style.width = previousWidth;
                        root.style.maxWidth = previousMaxWidth;
                    }
                }
            }

            function buildFitVars(pageHeightMm, metrics) {
                const vars = { ...BASE };
                const contentHeightMm = Number(metrics.contentHeightMm) || 0;
                const remaining = pageHeightMm - contentHeightMm;
                const rowCount = Math.max(1, Number(metrics.rowCount) || 1);
                const cardCount = Math.max(1, Number(metrics.cardCount) || 1);

                if (remaining < -1) {
                    const overRatio = clamp(Math.abs(remaining) / Math.max(1, pageHeightMm), 0, 1);
                    vars.rowPad = clamp(BASE.rowPad - (overRatio * 0.22), LIMITS.rowPadMin, BASE.rowPad);
                    vars.cardGap = clamp(BASE.cardGap - (overRatio * 1.1), LIMITS.cardGapMin, BASE.cardGap);
                    vars.cardPad = clamp(BASE.cardPad - (overRatio * 0.9), LIMITS.cardPadMin, BASE.cardPad);
                    vars.tableCardGap = clamp(BASE.tableCardGap - (overRatio * 0.4), LIMITS.tableCardGapMin, BASE.tableCardGap);
                    return vars;
                }

                if (remaining <= 0) return vars;

                const rowSlots = Math.max(1, rowCount * 2);
                const cardSlots = Math.max(1, cardCount * 2);
                const gapSlots = Math.max(1, cardCount - 1);
                const rowExtra = clamp((remaining * 0.78) / rowSlots, 0, LIMITS.rowPadMax - BASE.rowPad);
                vars.rowPad = BASE.rowPad + rowExtra;

                let unused = Math.max(0, remaining - (rowExtra * rowSlots));
                const cardExtra = clamp((unused * 0.48) / cardSlots, 0, LIMITS.cardPadMax - BASE.cardPad);
                vars.cardPad = BASE.cardPad + cardExtra;

                unused = Math.max(0, unused - (cardExtra * cardSlots));
                const tableGapExtra = clamp((unused * 0.2) / cardCount, 0, LIMITS.tableCardGapMax - BASE.tableCardGap);
                vars.tableCardGap = BASE.tableCardGap + tableGapExtra;

                unused = Math.max(0, unused - (tableGapExtra * cardCount));
                const cardGapExtra = clamp(unused / gapSlots, 0, LIMITS.cardGapMax - BASE.cardGap);
                vars.cardGap = BASE.cardGap + cardGapExtra;
                return vars;
            }

            function hasNumberOverflow() {
                return Array.from(root.querySelectorAll('.util-sheet-meter-table-electric td:not(:first-child)')).some(cell => {
                    const width = cell.clientWidth || cell.getBoundingClientRect?.().width || 0;
                    if (!width) return false;
                    return (cell.scrollWidth || 0) > width + 0.5;
                });
            }

            function fitNumberFont(vars, pageWidthMm) {
                const next = { ...vars };
                const measureWidth = Number(pageWidthMm) || 0;
                const previousWidth = root.style.width;
                const previousMaxWidth = root.style.maxWidth;
                if (measureWidth > 0) {
                    root.style.width = toMm(measureWidth);
                    root.style.maxWidth = 'none';
                }
                try {
                    for (let font = LIMITS.numberFontMax; font >= LIMITS.numberFontMin; font -= 0.15) {
                        next.numberFont = font;
                        setRootVars(next);
                        if (!hasNumberOverflow()) return next;
                    }
                    next.numberFont = LIMITS.numberFontMin;
                    setRootVars(next);
                    return next;
                } finally {
                    if (measureWidth > 0) {
                        root.style.width = previousWidth;
                        root.style.maxWidth = previousMaxWidth;
                    }
                }
            }

            function upsertPrintStyle(landscapeVars, portraitVars) {
                let style = document.getElementById('util-sheet-electric-print-fit-style');
                if (!style) {
                    style = document.createElement('style');
                    style.id = 'util-sheet-electric-print-fit-style';
                    document.head.appendChild(style);
                }
                style.textContent = `
                    @media print and (orientation: landscape) {
                        .util-sheet-meter-extract-page.is-electric-meter-print { ${serializeVars(landscapeVars)} }
                    }
                    @media print and (orientation: portrait) {
                        .util-sheet-meter-extract-page.is-electric-meter-print { ${serializeVars(portraitVars)} }
                    }
                `;
            }

            const mmPx = getMmPx();
            function fit() {
                const landscapeMetrics = getContentMetrics(mmPx, A4.landscapeWidth);
                const portraitMetrics = getContentMetrics(mmPx, A4.portraitWidth);
                const landscapeVars = fitNumberFont(buildFitVars(A4.landscapeHeight, landscapeMetrics), A4.landscapeWidth);
                const portraitVars = fitNumberFont(buildFitVars(A4.portraitHeight, portraitMetrics), A4.portraitWidth);
                const screenVars = ((view && view.innerWidth) || 0) >= ((view && view.innerHeight) || 0)
                    ? landscapeVars
                    : portraitVars;
                upsertPrintStyle(landscapeVars, portraitVars);
                setRootVars(screenVars);
                root.dataset.electricPrintFit = 'ready';
            }

            let fitTimer = 0;
            function scheduleFit() {
                if (fitTimer && view && typeof view.clearTimeout === 'function') {
                    view.clearTimeout(fitTimer);
                }
                const setTimer = view && typeof view.setTimeout === 'function'
                    ? view.setTimeout.bind(view)
                    : setTimeout;
                fitTimer = setTimer(() => {
                    fitTimer = 0;
                    if (view && typeof view.requestAnimationFrame === 'function') {
                        view.requestAnimationFrame(fit);
                    } else {
                        fit();
                    }
                }, 60);
            }

            if (view && typeof view.addEventListener === 'function') {
                view.addEventListener('load', scheduleFit, { once: true });
                view.addEventListener('beforeprint', fit);
                view.addEventListener('resize', scheduleFit);
            }
            scheduleFit();
        };
        return `<script>(${runtimeSource})();</script>`;
    }

    Object.assign(parts, {
        getGasMeterPrintExtractCss,
        getElectricMeterPrintExtractCss,
        buildElectricMeterPrintFitScript
    });
})(this);
