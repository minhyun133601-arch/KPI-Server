function getTeamSettlementActionsBrowserAdapter() {
  return typeof KpiMeteringBrowserAdapter === "object" && KpiMeteringBrowserAdapter
    ? KpiMeteringBrowserAdapter
    : null;
}

function alertTeamSettlementAction(message) {
  const adapter = getTeamSettlementActionsBrowserAdapter();
  if (typeof adapter?.alert === "function") {
    adapter.alert(message);
  }
}

function setTeamSettlementActionTimeout(callback, delay = 0) {
  const adapter = getTeamSettlementActionsBrowserAdapter();
  return typeof adapter?.setTimeout === "function" ? adapter.setTimeout(callback, delay) : null;
}

async function handleTeamSettlementClick(event) {
  event?.preventDefault();

  if (getCurrentMode() !== MODES.TEAM || !supportsBillingSettlementForCurrentResource()) {
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  if (!monthValue) {
    alertTeamSettlementAction("기입 년월을 먼저 선택해 주세요.");
    syncEquipmentFullscreenUI();
    return;
  }

  if (isElectricResourceType() && calculateTotalPowerMonthlyUsage() === null) {
    alertTeamSettlementAction("전력총량이 계산되어야 정산을 열 수 있습니다.");
    syncEquipmentFullscreenUI();
    return;
  }

  state.isTeamSettlementPanelOpen = !state.isTeamSettlementPanelOpen;
  renderTeamMode();
  if (state.isTeamSettlementPanelOpen) {
    focusTeamSettlementPrimaryInput();
  } else {
    elements.teamSettlementBtn?.focus();
  }
}

function focusTeamSettlementPrimaryInput() {
  setTeamSettlementActionTimeout(() => {
    const target =
      elements.teamSettlementFields?.querySelector(
        'input[data-billing-settlement-field]:not([readonly])'
      ) || elements.teamSettlementAttachBtn;
    target?.focus();
  }, 0);
}
