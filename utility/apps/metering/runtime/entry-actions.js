function getMeteringRuntimeEntryActionsBrowserAdapter() {
  return typeof KpiMeteringBrowserAdapter === "object" && KpiMeteringBrowserAdapter
    ? KpiMeteringBrowserAdapter
    : null;
}

function confirmMeteringRuntimeEntryAction(message) {
  const adapter = getMeteringRuntimeEntryActionsBrowserAdapter();
  return typeof adapter?.confirm === "function" ? adapter.confirm(message) : false;
}

function handleClearCurrentEntry() {
  if (getCurrentMode() !== MODES.EQUIPMENT || !state.selectedDate) {
    return;
  }

  const hasStoredEntry = Boolean(state.store.equipmentEntries[state.selectedDate]);
  if (!hasStoredEntry && !equipmentHasAnyInput()) {
    return;
  }

  if (!confirmMeteringRuntimeEntryAction("삭제하시겠습니까?")) {
    return;
  }

  clearEquipmentLocalAutosaveTimer();

  delete state.store.equipmentEntries[state.selectedDate];
  resetEquipmentForm();
  setCurrentEntryDayStatus("");
  state.cleanStatusText = "선택한 날짜 입력을 삭제했습니다.";
  persistStore();
  loadEntryToForm(null);
  renderCalendar();
  renderSummary();
  renderTeamMode();
}

function resetEquipmentForm() {
  getEquipmentInputs().forEach((input) => {
    input.value = "";
    input.dataset.lastValue = "";
    input.placeholder = getEquipmentInputPlaceholder(input.dataset.fieldKey);
  });
  setCurrentEntryDayStatus("");
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentRestIndicators();
  syncEquipmentReadingValidationStates();
}

function equipmentHasAnyInput() {
  const formData = readEquipmentFormData();
  return Object.keys(formData.values).length > 0 || Boolean(getCurrentEntryDayStatus());
}
