function getTeamSettlementDocumentActionsBrowserAdapter() {
  return typeof KpiMeteringBrowserAdapter === "object" && KpiMeteringBrowserAdapter
    ? KpiMeteringBrowserAdapter
    : null;
}

function alertTeamSettlementDocumentAction(message) {
  const adapter = getTeamSettlementDocumentActionsBrowserAdapter();
  if (typeof adapter?.alert === "function") {
    adapter.alert(message);
  }
}

function getCurrentMonthBillingDocument() {
  const monthValue = normalizeMonthValue(state.currentMonth);
  const scopeKey = getCurrentBillingSettlementScope();
  return monthValue ? getBillingDocumentForMonth(monthValue, scopeKey) : null;
}

function handleTeamSettlementPreviewClick(event) {
  event?.preventDefault();

  const monthValue = normalizeMonthValue(state.currentMonth);
  const billingDocument = getCurrentMonthBillingDocument();
  if (!monthValue || !billingDocument) {
    alertTeamSettlementDocumentAction("미리볼 청구서가 없습니다.");
    return;
  }

  const scopeKey = getCurrentBillingSettlementScope();
  openBillingDocumentPreview(monthValue, billingDocument, getCurrentResourceType(), scopeKey);
}

function handleTeamSettlementOpenClick(event) {
  event?.preventDefault();

  const monthValue = normalizeMonthValue(state.currentMonth);
  const billingDocument = getCurrentMonthBillingDocument();
  if (!monthValue || !billingDocument) {
    alertTeamSettlementDocumentAction("다운할 청구서가 없습니다.");
    return;
  }

  downloadBillingDocument(monthValue, billingDocument, getCurrentResourceType());
}
