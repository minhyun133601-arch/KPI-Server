(function () {
    const browser = KpiDataEquipmentHistoryBrowserAdapter;
    const api = browser.getApi();
    const EQUIPMENT_PRINT_POPUP_FEATURES = 'width=900,height=1200';
    const getEquipmentDraftDisplayName = (...args) => api.getEquipmentDraftDisplayName(...args);
    const getEquipmentTeamIconSvg = (...args) => api.getEquipmentTeamIconSvg(...args);
    const getBoardTeamStyle = (...args) => api.getBoardTeamStyle(...args);
    const syncDraftFromForm = (...args) => api.syncDraftFromForm(...args);

    function normalizePrintText(value) {
        return api.normalizeText(value);
    }

    function renderPrintText(value, fallback = '-') {
        const text = normalizePrintText(value);
        return api.escapeHtml(text || fallback).replace(/\r?\n/g, '<br>');
    }

    function isPrintRowBlank(row, keys) {
        return api.asList(keys).every((key) => !normalizePrintText(row?.[key]));
    }

    function renderEquipmentPrintPhoto(draft) {
        const photoSrc = api.getEquipmentPhotoPreviewUrl?.(draft) || draft.photoDataUrl || draft.photoPreviewUrl || '';
        if (!photoSrc) {
            return `
                <div class="data-equipment-photo-placeholder equipment-print-photo-empty">
                    <strong>${api.escapeHtml('\uC0AC\uC9C4 \uC5C6\uC74C')}</strong>
                </div>
            `;
        }
        return `<img class="data-equipment-photo-preview" src="${api.escapeHtml(photoSrc)}" alt="${api.escapeHtml('\uC124\uBE44 \uC0AC\uC9C4')}">`;
    }

    function getEquipmentPrintSpecRows(draft) {
        return api.asList(draft?.detailGroups?.equipmentSpecs)
            .filter((row) => !isPrintRowBlank(row, ['label', 'value']));
    }

    function renderEquipmentPrintSpecRows(draft) {
        const rows = getEquipmentPrintSpecRows(draft);
        if (!rows.length) {
            return `<div class="equipment-print-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uC124\uBE44 \uC2A4\uD399\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`;
        }
        return `
            <div class="equipment-print-spec-grid">
                ${rows.map((row) => `
                    <div class="equipment-print-spec-cell">
                        <span>${renderPrintText(row?.label)}</span>
                        <strong>${renderPrintText(row?.value)}</strong>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function getEquipmentPrintAnnualMaintenancePlanRows(draft) {
        const fields = api.ANNUAL_MAINTENANCE_PLAN_FIELDS || [];
        const contentKeys = fields.slice(1).map((field) => field.key);
        const enteredRows = api.asList(draft?.annualMaintenancePlan)
            .filter((row) => !isPrintRowBlank(row, contentKeys));
        const rows = enteredRows.map((row) => ({
            ...row,
            equipmentName: normalizePrintText(row?.equipmentName) || normalizePrintText(draft?.name),
        }));
        const minimumRows = Math.max(3, Number(api.DEFAULT_ANNUAL_MAINTENANCE_PLAN_ROW_COUNT) || 3);
        while (rows.length < minimumRows) {
            rows.push(api.createBlankAnnualMaintenancePlanRow?.(rows.length === 0 ? draft?.name : '') || {});
        }
        return rows;
    }

    function renderEquipmentPrintAnnualMaintenancePlanRows(draft) {
        return getEquipmentPrintAnnualMaintenancePlanRows(draft).map((row) => `
            <tr>
                ${(api.ANNUAL_MAINTENANCE_PLAN_FIELDS || []).map((field) => `
                    <td><div class="equipment-print-table-value">${renderPrintText(row?.[field.key], '')}</div></td>
                `).join('')}
            </tr>
        `).join('');
    }

    function getEquipmentPrintDocumentRows(draft) {
        return api.asList(draft?.documents)
            .filter((row) => !isPrintRowBlank(row, ['title', 'fileName', 'originalName', 'downloadUrl']));
    }

    function renderEquipmentPrintDocumentRows(draft) {
        const rows = getEquipmentPrintDocumentRows(draft);
        if (!rows.length) {
            return `<div class="equipment-print-empty equipment-print-doc-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uAD00\uB828 \uBB38\uC11C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`;
        }
        return rows.map((row) => {
            const fileLabel = row?.pendingFile?.name || row?.fileName || row?.originalName || row?.downloadUrl || '-';
            const title = normalizePrintText(row?.title);
            const isDuplicate = api.isDocumentTitleDuplicate?.(title, fileLabel) === true;
            const primaryLabel = title || fileLabel;
            const secondaryLabel = title && fileLabel && !isDuplicate ? fileLabel : '';
            return `
                <div class="equipment-print-doc-cell">
                    <strong>${renderPrintText(primaryLabel, '\uBB38\uC11C')}</strong>
                    ${secondaryLabel ? `<span>${renderPrintText(secondaryLabel, '')}</span>` : ''}
                </div>
            `;
        }).join('');
    }

    function renderEquipmentPrintDocumentsCard(draft, className = '') {
        return `
            <article class="data-equipment-card data-equipment-doc-card equipment-print-documents${className ? ` ${api.escapeHtml(className)}` : ''}">
                <h3 class="data-equipment-section-title">${api.escapeHtml('\uBB38\uC11C \uCCA8\uBD80')}</h3>
                <div class="equipment-print-doc-grid">
                    ${renderEquipmentPrintDocumentRows(draft)}
                </div>
            </article>
        `;
    }

    function getEquipmentPrintMaintenanceRows(draft) {
        return api.asList(draft?.maintenanceHistory)
            .filter((row) => !isPrintRowBlank(row, ['date', 'type', 'content', 'worker', 'note']));
    }

    function renderEquipmentPrintMaintenanceRows(draft) {
        const rows = getEquipmentPrintMaintenanceRows(draft);
        if (!rows.length) {
            return `<tr><td colspan="5" class="equipment-print-empty-cell">${api.escapeHtml('\uB4F1\uB85D\uB41C \uC815\uBE44 \uC774\uB825\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.')}</td></tr>`;
        }
        return rows.map((row) => `
            <tr>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.date)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.type)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.content)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.worker)}</div></td>
                <td><div class="equipment-print-table-value">${renderPrintText(row?.note)}</div></td>
            </tr>
        `).join('');
    }

    function renderEquipmentPrintNote(draft) {
        const hasNote = Boolean(normalizePrintText(draft?.note));
        return `
            <article class="data-equipment-card data-equipment-note-card equipment-print-note-card${hasNote ? '' : ' is-empty'}">
                <h3 class="data-equipment-section-title">${api.escapeHtml('\uBE44\uACE0')}</h3>
                ${hasNote
                    ? `<div class="equipment-print-static-note">${renderPrintText(draft.note, '-')}</div>`
                    : `<div class="equipment-print-empty">${api.escapeHtml('\uB4F1\uB85D\uB41C \uBE44\uACE0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.')}</div>`}
            </article>
        `;
    }

    function buildEquipmentHistoryPrintDocument(draftInput, options = {}) {
        const draft = api.createDraft(draftInput);
        const title = normalizePrintText(getEquipmentDraftDisplayName(draft)) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC';
        const source = draftInput && typeof draftInput === 'object' ? draftInput : {};
        const printOptions = options && typeof options === 'object' ? options : {};
        const updatedAt = normalizePrintText(printOptions.updatedAt || source.updatedAt || source?.header?.updatedAt || source?.meta?.updatedAt) || '-';
        const teamLabel = normalizePrintText(draft.team) || '-';
        const roomLabel = normalizePrintText(draft.room) || '-';
        const teamMeta = api.getEquipmentHistoryTeamMeta?.(draft.team) || {};
        const teamIconSvg = getEquipmentTeamIconSvg(teamMeta);
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>${api.escapeHtml(title)} ${api.escapeHtml('\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC')}</title>
    <style>
        @page { size: A4 portrait; margin: 8mm; }
        * { box-sizing: border-box; }
        figure { margin: 0; }
        html, body { margin: 0; background: #ffffff; color: #111827; font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .equipment-print-page { width: 100%; min-height: 0; height: auto; max-height: none; overflow: visible; display: grid; align-content: start; gap: 2.4mm; }
        .data-equipment-topbar { display: grid; grid-template-columns: 11mm minmax(0, 1fr) auto; gap: 4mm; align-items: center; }
        .data-equipment-topbar-dashboard.is-card-mode { min-height: 17mm; padding: 3.4mm 4mm; border: 1px solid #132844; border-radius: 8px; background: linear-gradient(135deg, #071a31 0%, #102b4b 100%); color: #ffffff; }
        .data-equipment-brand { display: inline-flex; align-items: center; justify-content: center; min-width: 0; }
        .data-equipment-brand-mark { width: 8.8mm; height: 8.8mm; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgba(34, 197, 94, 0.28); background: rgba(34, 197, 94, 0.16); color: #35d47e; font-size: 8px; font-weight: 900; }
        .data-equipment-title-block { min-width: 0; }
        .data-equipment-title-pair { margin: 0; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 2mm 4mm; line-height: 1.1; }
        .data-equipment-title-team,
        .data-equipment-title-room,
        .data-equipment-title-name { color: #ffffff; font-size: 16px; font-weight: 900; word-break: keep-all; }
        .data-equipment-title-room { min-width: 22mm; padding: 2.1mm 3.2mm; border: 1px solid rgba(255, 255, 255, 0.24); border-radius: 7px; background: rgba(255, 255, 255, 0.1); text-align: center; }
        .data-equipment-title-name { min-width: 44mm; }
        .equipment-print-date { color: rgba(226, 238, 255, 0.8); font-size: 8px; font-weight: 800; text-align: right; white-space: nowrap; }
        .data-equipment-card-view { min-height: 0; display: grid; align-content: start; }
        .data-equipment-layout,
        .data-equipment-edit-form { min-height: 0; display: grid; grid-template-rows: auto; align-content: start; gap: 2.4mm; }
        .equipment-print-form { height: auto; }
        .data-equipment-top-grid,
        .equipment-print-top-grid { min-width: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2mm; align-items: stretch; }
        .data-equipment-card-heading,
        .equipment-print-card-heading { min-width: 0; display: grid; grid-template-columns: minmax(34mm, 0.32fr) minmax(0, 1fr); gap: 2mm; align-items: center; }
        .data-equipment-hero-photo { min-width: 0; display: grid; align-items: start; }
        .data-equipment-hero-updated { min-width: 0; min-height: 9mm; display: flex; align-items: center; gap: 1.5mm; padding: 1.3mm 2mm; border: 1px solid #d1d5db; border-radius: 4px; background: #f8fafc; color: #374151; line-height: 1.15; }
        .data-equipment-hero-updated span { flex: 0 0 auto; color: #64748b; font-size: 8px; font-weight: 900; white-space: nowrap; }
        .data-equipment-hero-updated strong { min-width: 0; overflow: hidden; color: #1f2a44; font-size: 8.4px; font-weight: 900; text-overflow: ellipsis; white-space: nowrap; }
        .data-equipment-photo-title-row { min-width: 0; display: grid; grid-template-columns: minmax(34mm, 0.62fr) minmax(28mm, 0.48fr) minmax(0, 1.4fr); gap: 2mm; align-items: center; border: 0; background: transparent; padding: 0; }
        .data-equipment-photo-title-row .data-equipment-title-team,
        .data-equipment-photo-title-row .data-equipment-title-room,
        .data-equipment-photo-title-row .data-equipment-title-name { min-width: 0; min-height: 9mm; display: flex; align-items: center; justify-content: flex-start; gap: 1.6mm; border: 1px solid #d1d5db; border-radius: 4px; background: #ffffff; color: #111827; padding: 1.5mm 2mm; font-family: 'Noto Sans KR', 'Malgun Gothic', Arial, sans-serif; line-height: 1.15; word-break: keep-all; }
        .data-equipment-title-team-icon { width: 7mm; height: 7mm; display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, var(--equipment-team-color, #2563eb) 24%, #ffffff); border-radius: 4px; background: color-mix(in srgb, var(--equipment-team-color, #2563eb) 10%, #ffffff); color: var(--equipment-team-color, #2563eb); font-size: 8.5px; flex: 0 0 auto; }
        .data-equipment-title-team-icon svg { width: 4.8mm; height: 4.8mm; display: block; }
        .data-equipment-title-value { min-width: 0; overflow: hidden; color: #111827; font-size: 13px; font-weight: 900; letter-spacing: 0; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-section-stack { min-height: 0; display: grid; gap: 2mm; align-content: start; }
        .data-equipment-card,
        .data-equipment-photo-card { overflow: hidden; background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; box-shadow: none; }
        .data-equipment-card-pad,
        .data-equipment-detail-card,
        .data-equipment-annual-plan-card,
        .data-equipment-history-card,
        .data-equipment-note-card,
        .data-equipment-doc-card { min-width: 0; padding: 3mm; }
        .data-equipment-history-card,
        .data-equipment-note-card,
        .data-equipment-doc-card { display: grid; align-content: start; }
        .data-equipment-photo-card { width: 100%; min-height: 0; aspect-ratio: 16 / 5; display: grid; place-items: center; background: #f8fbff; }
        .data-equipment-photo-preview { width: 100%; height: 100%; min-height: 0; object-fit: contain; display: block; background: #f8fbff; }
        .data-equipment-photo-placeholder,
        .equipment-print-photo-empty { width: 100%; height: 100%; display: grid; place-items: center; color: #63748e; font-size: 10px; font-weight: 800; text-align: center; }
        .data-equipment-section-title { display: flex; align-items: center; gap: 2mm; margin: 0 0 2mm; padding-bottom: 1.5mm; border-bottom: 1px solid #d1d5db; color: #111827; font-size: 11px; font-weight: 900; line-height: 1.25; }
        .data-equipment-edit-grid { display: grid; gap: 2mm; }
        .data-equipment-note-field { display: grid; gap: 1.2mm; min-width: 0; color: #34476c; font-size: 8.5px; font-weight: 900; }
        .data-equipment-note-field span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-static-note,
        .equipment-print-table-value { width: 100%; min-width: 0; border: 1px solid #d1d5db; border-radius: 2px; background: #ffffff; color: #374151; padding: 1.45mm 1.7mm; font-size: 9.2px; font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
        .data-equipment-detail-card { display: grid; align-content: start; }
        .equipment-print-spec-grid { min-width: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 1.5mm; align-items: stretch; }
        .equipment-print-spec-cell { min-width: 0; display: grid; gap: 0.9mm; border: 1px solid #d1d5db; border-radius: 2px; background: #ffffff; padding: 1.45mm 1.5mm; }
        .equipment-print-spec-cell span,
        .equipment-print-spec-cell strong { min-width: 0; overflow: hidden; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-spec-cell span { color: #405270; font-size: 8px; font-weight: 900; }
        .equipment-print-spec-cell strong { color: #132844; font-size: 9.4px; font-weight: 900; }
        .data-equipment-table-scroll { min-width: 0; border: 1px solid #d1d5db; border-radius: 4px; background: #f8fafc; padding: 2mm; }
        .data-equipment-edit-table,
        .equipment-print-table { width: 100%; border-collapse: separate; border-spacing: 0 1mm; table-layout: fixed; font-size: 8.5px; line-height: 1.2; }
        .data-equipment-edit-table th,
        .data-equipment-edit-table td { border: 0; padding: 0 0.8mm; vertical-align: top; word-break: break-word; }
        .data-equipment-edit-table th { background: transparent; color: #34476c; font-size: 8px; font-weight: 900; text-align: left; padding-bottom: 0.4mm; }
        .equipment-print-table-value { min-height: 5.8mm; padding: 1.25mm 1.5mm; }
        .equipment-print-maintenance-table th:nth-child(1),
        .equipment-print-maintenance-table td:nth-child(1) { width: 14%; }
        .equipment-print-maintenance-table th:nth-child(2),
        .equipment-print-maintenance-table td:nth-child(2) { width: 12%; }
        .equipment-print-maintenance-table th:nth-child(3),
        .equipment-print-maintenance-table td:nth-child(3) { width: 44%; }
        .equipment-print-maintenance-table th:nth-child(4),
        .equipment-print-maintenance-table td:nth-child(4) { width: 12%; }
        .equipment-print-maintenance-table th:nth-child(5),
        .equipment-print-maintenance-table td:nth-child(5) { width: 18%; }
        .equipment-print-annual-plan-table th:nth-child(1), .equipment-print-annual-plan-table td:nth-child(1) { width: 11%; }
        .equipment-print-annual-plan-table th:nth-child(2), .equipment-print-annual-plan-table td:nth-child(2) { width: 12%; }
        .equipment-print-annual-plan-table th:nth-child(3), .equipment-print-annual-plan-table td:nth-child(3) { width: 25%; }
        .equipment-print-annual-plan-table th:nth-child(4), .equipment-print-annual-plan-table td:nth-child(4) { width: 8%; }
        .equipment-print-annual-plan-table th:nth-child(5), .equipment-print-annual-plan-table td:nth-child(5) { width: 8%; }
        .equipment-print-annual-plan-table th:nth-child(6), .equipment-print-annual-plan-table td:nth-child(6) { width: 36%; }
        .equipment-print-doc-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.5mm; }
        .equipment-print-doc-cell { min-width: 0; display: grid; gap: 0.9mm; border: 1px solid #d1d5db; border-radius: 2px; background: #ffffff; padding: 1.45mm 1.5mm; }
        .equipment-print-doc-cell span,
        .equipment-print-doc-cell strong { min-width: 0; overflow: hidden; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
        .equipment-print-doc-cell span { color: #405270; font-size: 8px; font-weight: 900; }
        .equipment-print-doc-cell strong { color: #111827; font-size: 9.4px; font-weight: 900; }
        .equipment-print-doc-empty { grid-column: 1 / -1; }
        .equipment-print-static-note { min-height: 0; }
        .equipment-print-note-card.is-empty .equipment-print-empty { padding-top: 1.2mm; padding-bottom: 1.2mm; }
        .equipment-print-section-stack > .data-equipment-card { overflow: visible; }
        .equipment-print-empty,
        .equipment-print-empty-cell { color: #6b7280; font-size: 9px; font-weight: 800; text-align: center; }
        .equipment-print-empty { border: 1px dashed #dce8f5; border-radius: 6px; background: #f8fbff; padding: 1.6mm 2mm; }
        .equipment-print-top-grid,
        .equipment-print-spec-summary,
        .equipment-print-note-card,
        .equipment-print-documents,
        .equipment-print-doc-cell { break-inside: avoid; page-break-inside: avoid; }
        .equipment-print-table thead { display: table-header-group; }
        .equipment-print-table tr { break-inside: avoid; page-break-inside: avoid; }
        .equipment-print-table th,
        .equipment-print-table td,
        .equipment-print-doc-cell span,
        .equipment-print-doc-cell strong { overflow: visible; text-overflow: clip; white-space: normal; }
        @media screen {
            body { padding: 10mm; background: #e5e7eb; }
            .equipment-print-page { width: 194mm; margin: 0 auto; padding: 0; background: #ffffff; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18); }
        }
    </style>
</head>
<body>
    <main class="equipment-print-page">
        <section class="data-equipment-card-view" data-equipment-view="card-print">
            <form class="data-equipment-layout data-equipment-edit-form equipment-print-form" aria-label="${api.escapeHtml('\uC124\uBE44 \uAE30\uB85D \uCD9C\uB825')}">
                <div class="data-equipment-top-grid equipment-print-top-grid">
                    <div class="data-equipment-card-heading equipment-print-card-heading">
                        <div class="data-equipment-hero-updated">
                            <span>${api.escapeHtml('\uCD5C\uADFC \uC5C5\uB370\uC774\uD2B8 :')}</span>
                            <strong>${renderPrintText(updatedAt, '-')}</strong>
                        </div>
                        <div class="data-equipment-photo-title-row equipment-print-photo-title-row" style="${getBoardTeamStyle(teamMeta)}">
                            <span class="data-equipment-title-team">
                                <span class="data-equipment-title-team-icon" aria-hidden="true">${teamIconSvg}</span>
                                <span class="data-equipment-title-value">${renderPrintText(teamLabel, '-')}</span>
                            </span>
                            <span class="data-equipment-title-room">
                                <span class="data-equipment-title-value">${renderPrintText(roomLabel, '-')}</span>
                            </span>
                            <span class="data-equipment-title-name">
                                <span class="data-equipment-title-value">${renderPrintText(title, '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC')}</span>
                            </span>
                        </div>
                    </div>
                    <div class="data-equipment-hero-photo">
                        <figure class="data-equipment-photo-card">${renderEquipmentPrintPhoto(draft)}</figure>
                    </div>
                </div>
                <div class="equipment-print-section-stack">
                    <article class="data-equipment-card data-equipment-detail-card equipment-print-spec-summary">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('\uC124\uBE44 \uC2A4\uD399')}</h3>
                        ${renderEquipmentPrintSpecRows(draft)}
                    </article>
                    <article class="data-equipment-card data-equipment-annual-plan-card equipment-print-annual-plan">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('연간정비계획표')}</h3>
                        <div class="data-equipment-table-scroll">
                            <table class="data-equipment-edit-table equipment-print-table equipment-print-annual-plan-table">
                                <thead>
                                    <tr>
                                        ${(api.ANNUAL_MAINTENANCE_PLAN_FIELDS || []).map((field) => `<th>${api.escapeHtml(field.label)}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>${renderEquipmentPrintAnnualMaintenancePlanRows(draft)}</tbody>
                            </table>
                        </div>
                    </article>
                    <article class="data-equipment-card data-equipment-history-card equipment-print-maintenance">
                        <h3 class="data-equipment-section-title">${api.escapeHtml('\uC815\uBE44 \uC774\uB825')}</h3>
                        <div class="data-equipment-table-scroll">
                            <table class="data-equipment-edit-table equipment-print-table equipment-print-maintenance-table">
                                <thead>
                                    <tr>
                                        <th>${api.escapeHtml('\uC77C\uC790')}</th>
                                        <th>${api.escapeHtml('\uAD6C\uBD84')}</th>
                                        <th>${api.escapeHtml('\uB0B4\uC6A9')}</th>
                                        <th>${api.escapeHtml('\uC791\uC5C5\uC790')}</th>
                                        <th>${api.escapeHtml('\uBE44\uACE0')}</th>
                                    </tr>
                                </thead>
                                <tbody>${renderEquipmentPrintMaintenanceRows(draft)}</tbody>
                            </table>
                        </div>
                    </article>
                    ${renderEquipmentPrintNote(draft)}
                    ${renderEquipmentPrintDocumentsCard(draft)}
                </div>
            </form>
        </section>
    </main>
</body>
</html>
        `;
    }

    function printEquipmentHistoryCard(root, state, data) {
        if (!state.draft) {
            browser.alert('\uCD9C\uB825\uD560 \uC124\uBE44 \uC774\uB825\uCE74\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.');
            return;
        }
        syncDraftFromForm(root, state);
        const printDocument = buildEquipmentHistoryPrintDocument(state.draft, {
            updatedAt: data?.header?.updatedAt || data?.meta?.updatedAt,
        });
        const printTitle = `${normalizePrintText(getEquipmentDraftDisplayName(state.draft)) || '\uC124\uBE44 \uC774\uB825 \uCE74\uB4DC'} \uCD9C\uB825`;
        if (browser.printHtmlDocument?.(printDocument, { title: printTitle })) {
            return;
        }

        const popup = browser.openPopup?.('', '_blank', EQUIPMENT_PRINT_POPUP_FEATURES);
        if (!popup || !popup.document) {
            browser.alert('\uC778\uC1C4 \uCC3D\uC744 \uC5F4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uC758 \uC0C8 \uCC3D/\uC778\uC1C4 \uAD8C\uD55C\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uCD9C\uB825\uD574 \uC8FC\uC138\uC694.');
            return;
        }
        try {
            popup.opener = null;
        } catch {}
        const printOnce = () => {
            if (popup.__equipmentHistoryPrinted) return;
            popup.__equipmentHistoryPrinted = true;
            popup.focus?.();
            popup.print?.();
            popup.close?.();
        };
        popup.document.write(printDocument);
        popup.document.close?.();
        popup.onload = printOnce;
        if (typeof popup.setTimeout === 'function') popup.setTimeout(printOnce, 250);
    }


    Object.assign(api, {
        normalizePrintText,
        renderPrintText,
        isPrintRowBlank,
        renderEquipmentPrintPhoto,
        getEquipmentPrintSpecRows,
        renderEquipmentPrintSpecRows,
        getEquipmentPrintAnnualMaintenancePlanRows,
        renderEquipmentPrintAnnualMaintenancePlanRows,
        getEquipmentPrintDocumentRows,
        renderEquipmentPrintDocumentRows,
        renderEquipmentPrintDocumentsCard,
        getEquipmentPrintMaintenanceRows,
        renderEquipmentPrintMaintenanceRows,
        renderEquipmentPrintNote,
        buildEquipmentHistoryPrintDocument,
        printEquipmentHistoryCard,
    });
    api.buildEquipmentHistoryPrintDocument = buildEquipmentHistoryPrintDocument;
})();
