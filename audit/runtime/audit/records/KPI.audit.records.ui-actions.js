const auditUiBrowser = typeof KpiAuditRecordsBrowserAdapter !== 'undefined'
    ? KpiAuditRecordsBrowserAdapter
    : null;

if (!auditUiBrowser) {
    throw new Error('KpiAuditRecordsBrowserAdapter must load before KPI.audit.records.ui-actions.js');
}

function getDocument() {
    return auditUiBrowser.getDocument?.() || null;
}

function toggleAuditNote(dataKey) {
    const documentRef = getDocument();
    const panel = documentRef?.getElementById(`audit-note-panel-${dataKey}`);
    if (!panel) return;
    panel.classList.toggle('open');
    const textarea = documentRef.getElementById(`audit-note-${dataKey}`);
    if (textarea && typeof textarea.focus === 'function') {
        textarea.focus();
    }
}

function syncAuditNoticeButton(button, willOpen) {
    if (!button) return;
    button.classList.toggle('is-open', willOpen);
    button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    button.setAttribute('title', willOpen ? '주의사항 닫기' : '주의사항 보기');
}

function toggleAuditNotice(dataKey) {
    const documentRef = getDocument();
    const modal = documentRef?.getElementById(`audit-notice-modal-${dataKey}`);
    const button = documentRef?.getElementById(`audit-notice-toggle-${dataKey}`);
    if (modal) {
        const willOpen = !modal.classList.contains('is-open');
        modal.classList.toggle('is-open', willOpen);
        modal.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
        syncAuditNoticeButton(button, willOpen);
        return;
    }

    const panel = documentRef?.getElementById(`audit-notice-panel-${dataKey}`);
    if (!panel || !button) return;
    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    syncAuditNoticeButton(button, willOpen);
}

auditUiBrowser.expose('toggleAuditNote', toggleAuditNote);
auditUiBrowser.expose('toggleAuditNotice', toggleAuditNotice);

auditUiBrowser.expose('KPIAuditRecordUiActions', {
    toggleAuditNote,
    toggleAuditNotice
});
