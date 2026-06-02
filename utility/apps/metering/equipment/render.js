function formatEquipmentReadingAdjustmentDateLabel(dateString) {
  if (!dateString || dateString.length !== 10) {
    return "";
  }

  return `${dateString.slice(2, 4)}.${dateString.slice(5, 7)}.${dateString.slice(8, 10)}~`;
}

function getEquipmentReadingAdjustmentButtonText(equipment) {
  const adjustment = getEquipmentReadingAdjustment(equipment);
  if (!adjustment) {
    return "보정 없음";
  }

  const signedValue = `${adjustment.value > 0 ? "+" : ""}${formatNumber(adjustment.value)}`;
  return `보정 ${signedValue} · ${formatEquipmentReadingAdjustmentDateLabel(adjustment.startDate)}`;
}

function getVisibleEquipmentFieldItemsForRender() {
  return state.store.equipmentItems.filter((field) => !isHiddenEquipmentFieldCard(field));
}

function getEquipmentFieldRenderSignature(visibleEquipmentItems, options = {}) {
  const { canEditEquipment = false, canDirectReorder = false } = options;
  return JSON.stringify({
    resourceType: typeof getCurrentResourceType === "function" ? getCurrentResourceType() : "",
    mode: getCurrentMode(),
    canEditEquipment: Boolean(canEditEquipment),
    canDirectReorder: Boolean(canDirectReorder),
    items: visibleEquipmentItems.map((field) => [
      field.id,
      getEquipmentDisplayLabel(field),
      getEquipmentIconKey(field),
      getResourceDuplicateBadgeIconKeyForEquipment(field),
      isAutoCalculatedEquipment(field),
      isTotalPowerSummaryEquipment(field),
      isReactiveSummaryEquipment(field),
      isEquipmentUsageShareTarget(field),
      isUsageCalculationExcludedEquipment(field),
      canManageEquipmentDecimalDigits(field),
    ]),
  });
}

function getRenderedEquipmentFieldSignature() {
  return elements.fieldsGrid.dataset?.equipmentRenderSignature || "";
}

function setRenderedEquipmentFieldSignature(signature) {
  if (elements.fieldsGrid.dataset) {
    elements.fieldsGrid.dataset.equipmentRenderSignature = signature;
  }
}

function canReuseRenderedEquipmentFieldInputs(visibleEquipmentItems, renderSignature) {
  if (!visibleEquipmentItems.length || elements.fieldsGrid.classList.contains("is-empty")) {
    return false;
  }

  if (!renderSignature || getRenderedEquipmentFieldSignature() !== renderSignature) {
    return false;
  }

  const cards = [...elements.fieldsGrid.querySelectorAll(".field-card[data-field-key]")];
  return (
    cards.length === visibleEquipmentItems.length &&
    visibleEquipmentItems.every((field, index) => cards[index]?.dataset.fieldKey === field.id)
  );
}

function syncEquipmentFieldRenderState(options = {}) {
  const { deferDynamicSync = false } = options;

  if (deferDynamicSync) {
    syncSelectedEquipmentCardState();
    renderEquipmentItemCount();
    return;
  }

  syncEquipmentUsageLabels();
  syncEquipmentRestIndicators();
  syncAutoCalculatedEquipmentInputs();
  syncEquipmentReadingValidationStates();
  syncSelectedEquipmentCardState();
  renderEquipmentItemCount();
}

function renderEquipmentFieldInputs(options = {}) {
  const { reuseExisting = false, deferDynamicSync = false } = options;
  clearEquipmentFieldCardDropState();
  const canEditEquipment = supportsEquipmentEditingForCurrentResource();
  const canDirectReorder = canEditEquipment && canDirectReorderEquipmentFields();

  if (
    state.openEquipmentManageKey &&
    !state.store.equipmentItems.some((item) => item.id === state.openEquipmentManageKey)
  ) {
    state.openEquipmentManageKey = "";
  }

  const selectedEquipmentIds = getSelectedEquipmentIds();
  if (selectedEquipmentIds.length !== state.selectedEquipmentKeys.length) {
    state.selectedEquipmentKeys = selectedEquipmentIds;
    if (getCurrentMode() === MODES.EQUIPMENT) {
      syncSelectedDatePresentation();
    }
  }

  const visibleEquipmentItems = getVisibleEquipmentFieldItemsForRender();
  const renderSignature = getEquipmentFieldRenderSignature(visibleEquipmentItems, {
    canEditEquipment,
    canDirectReorder,
  });

  if (!visibleEquipmentItems.length) {
    setRenderedEquipmentFieldSignature("");
    elements.fieldsGrid.innerHTML = "";
    state.openEquipmentOrderMenu = false;
    clearEquipmentFieldCardDragState();
    elements.fieldsGrid.classList.add("is-empty");
    elements.equipmentOrderHead.innerHTML = "";
    elements.equipmentOrderList.innerHTML = "";
    syncEquipmentOrderMenu();

    const emptyState = document.createElement("div");
    emptyState.className = "team-empty-state";
    emptyState.innerHTML = `
      <strong>${getEquipmentEmptyStateTitle()}</strong>
    `;
    elements.fieldsGrid.appendChild(emptyState);
    renderEquipmentItemCount();
    return { reused: false, empty: true };
  }

  elements.fieldsGrid.classList.remove("is-empty");

  if (reuseExisting && canReuseRenderedEquipmentFieldInputs(visibleEquipmentItems, renderSignature)) {
    renderEquipmentOrderHead();
    renderEquipmentOrderList();
    syncEquipmentOrderMenu();
    syncEquipmentFieldRenderState({ deferDynamicSync });
    return { reused: true, empty: false };
  }

  elements.fieldsGrid.innerHTML = "";
  const fragment = document.createDocumentFragment();

  visibleEquipmentItems.forEach((field) => {
    const isAutoCalculated = isAutoCalculatedEquipment(field);
    const displayLabel = getEquipmentDisplayLabel(field);
    const wrapper = document.createElement("div");
    wrapper.className = "field-card";
    wrapper.dataset.fieldKey = field.id;
    wrapper.draggable = false;
    wrapper.classList.toggle("is-selected", selectedEquipmentIds.includes(field.id));
    wrapper.classList.toggle("is-auto-calculated", isAutoCalculated);
    wrapper.classList.toggle("is-reorder-draggable", canDirectReorder);
    wrapper.classList.toggle("is-power-total-summary", isTotalPowerSummaryEquipment(field));
    wrapper.classList.toggle("is-reactive-summary", isReactiveSummaryEquipment(field));

    if (canDirectReorder) {
      wrapper.title = "드래그해 순서를 변경";
    }

    const head = document.createElement("div");
    head.className = "field-head";

    const titleRow = document.createElement("div");
    titleRow.className = "field-title-row";

    const title = document.createElement("label");
    title.className = "field-title";
    title.htmlFor = `${field.id}_input`;
    title.appendChild(
      createIconLabel(displayLabel, getEquipmentIconKey(field), {
        containerClass: "field-title-content",
        textClass: "field-title-copy",
        iconClass: "category-icon field-category-icon",
        trailingIconKey: getResourceDuplicateBadgeIconKeyForEquipment(field),
      })
    );

    const actions = document.createElement("div");
    actions.className = "field-actions";

    if (canDirectReorder) {
      const dragHandle = document.createElement("span");
      dragHandle.className = "field-drag-handle";
      dragHandle.setAttribute("aria-hidden", "true");
      dragHandle.title = "드래그해 순서를 변경";
      dragHandle.draggable = true;
      actions.appendChild(dragHandle);
    }

    const input = document.createElement("input");
    input.id = `${field.id}_input`;
    input.type = "text";
    input.inputMode = "decimal";
    input.placeholder = isAutoCalculated ? "자동 계산" : getEquipmentInputPlaceholder(field.id);
    input.dataset.fieldKey = field.id;
    input.readOnly = isAutoCalculated;

    if (!isAutoCalculated && canEditEquipment) {
      const manage = document.createElement("div");
      manage.className = "field-manage";
      manage.dataset.manageFieldKey = field.id;

      const manageButton = document.createElement("button");
      manageButton.type = "button";
      manageButton.className = "field-manage-toggle";
      manageButton.dataset.manageToggleKey = field.id;
      manageButton.setAttribute("aria-expanded", String(state.openEquipmentManageKey === field.id));
      manageButton.setAttribute("aria-label", `${displayLabel} 관리`);
      manageButton.title = `${displayLabel} 관리`;
      manageButton.appendChild(createCategoryIcon("manage", "field-manage-icon"));

      const manageMenu = document.createElement("div");
      manageMenu.className = "field-manage-menu";
      manageMenu.classList.toggle("is-hidden", state.openEquipmentManageKey !== field.id);

      const factorButton = document.createElement("button");
      factorButton.type = "button";
      factorButton.className = "field-manage-action field-factor-button";
      factorButton.dataset.factorFieldKey = field.id;
      factorButton.textContent = getEquipmentManageFactorButtonText(field);

      const decimalButton = document.createElement("button");
      decimalButton.type = "button";
      decimalButton.className = "field-manage-action field-decimal-button";
      decimalButton.dataset.decimalFieldKey = field.id;
      decimalButton.textContent = formatEquipmentDecimalDigitsLabel(field.id);
      decimalButton.classList.toggle("is-hidden", !canManageEquipmentDecimalDigits(field));

      const adjustmentButton = document.createElement("button");
      adjustmentButton.type = "button";
      adjustmentButton.className = "field-manage-action field-adjustment-button";
      adjustmentButton.dataset.adjustmentFieldKey = field.id;
      adjustmentButton.textContent = getEquipmentReadingAdjustmentButtonText(field);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "field-manage-action field-delete-button";
      deleteButton.dataset.deleteFieldKey = field.id;
      deleteButton.textContent = "삭제";

      manageMenu.append(factorButton, decimalButton, adjustmentButton, deleteButton);
      manage.append(manageButton, manageMenu);
      actions.appendChild(manage);
    }

    titleRow.prepend(title);
    if (actions.childElementCount > 0) {
      titleRow.append(actions);
    }
    head.append(titleRow);

    const meta = document.createElement("div");
    meta.className = "field-card-meta";
    if (isEquipmentUsageShareTarget(field)) {
      const share = document.createElement("span");
      share.className = "field-card-share";
      share.dataset.fieldShareKey = field.id;
      share.classList.add("is-hidden");
      meta.appendChild(share);
    }
    const charge = document.createElement("span");
    charge.className = "field-card-share";
    charge.dataset.fieldChargeKey = field.id;
    charge.classList.add("is-hidden");
    meta.appendChild(charge);
    if (!isAutoCalculated) {
      const restChip = document.createElement("span");
      restChip.className = "field-card-rest-chip is-hidden";
      restChip.dataset.fieldRestKey = field.id;
      restChip.textContent = "휴동";
      meta.appendChild(restChip);
    }
    if (isUsageCalculationExcludedEquipment(field)) {
      const exclusionChip = document.createElement("span");
      exclusionChip.className = "field-card-exclusion-chip";
      exclusionChip.textContent = "계산 제외";
      meta.appendChild(exclusionChip);
    }
    wrapper.append(head, input, meta);
    syncEquipmentCardMetaVisibility(wrapper);
    fragment.appendChild(wrapper);
  });

  elements.fieldsGrid.appendChild(fragment);
  setRenderedEquipmentFieldSignature(renderSignature);
  applyEquipmentEntryLockState();
  renderEquipmentOrderHead();
  renderEquipmentOrderList();
  syncEquipmentOrderMenu();
  syncEquipmentFieldRenderState({ deferDynamicSync });
  return { reused: false, empty: false };
}

function renderEquipmentOrderHead() {
  if (!elements.equipmentOrderHead) {
    return;
  }

  elements.equipmentOrderHead.innerHTML = "";
  if (!state.openEquipmentOrderMenu || state.store.equipmentItems.length < 2) {
    return;
  }

  const draft = document.createElement("span");
  draft.className = "equipment-order-draft";
  draft.textContent = "카드를 드래그해 설비 순서를 바꾸세요.";

  const count = document.createElement("span");
  count.className = "equipment-order-count";
  count.textContent = `${state.store.equipmentItems.length}개`;

  elements.equipmentOrderHead.append(draft, count);
}

function renderEquipmentOrderList() {
  if (!elements.equipmentOrderList) {
    return;
  }

  clearEquipmentOrderDropState();
  elements.equipmentOrderList.innerHTML = "";
  if (!state.openEquipmentOrderMenu || state.store.equipmentItems.length < 2) {
    return;
  }

  state.store.equipmentItems.forEach((item, index) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "team-picker-option equipment-order-option";
    optionButton.dataset.orderFieldKey = item.id;
    optionButton.draggable = false;
    optionButton.title = "드래그해 순서를 변경";

    const number = document.createElement("span");
    number.className = "equipment-order-badge";
    number.textContent = String(index + 1).padStart(2, "0");

    const dragHandle = document.createElement("span");
    dragHandle.className = "equipment-order-drag-handle";
    dragHandle.setAttribute("aria-hidden", "true");
    dragHandle.title = "드래그해 순서를 변경";
    dragHandle.draggable = true;

    optionButton.append(
      number,
      dragHandle,
      createIconLabel(getEquipmentDisplayLabel(item), getEquipmentIconKey(item), {
        containerClass: "team-picker-option-content equipment-order-option-content",
        textClass: "team-picker-option-text equipment-order-option-text",
        iconClass: "category-icon team-picker-icon equipment-order-option-icon",
        trailingIconKey: getResourceDuplicateBadgeIconKeyForEquipment(item),
      })
    );

    elements.equipmentOrderList.appendChild(optionButton);
  });
}

function syncSelectedEquipmentCardState() {
  const selectedIds = new Set(getSelectedEquipmentIds());
  elements.fieldsGrid.querySelectorAll(".field-card").forEach((card) => {
    card.classList.toggle("is-selected", selectedIds.has(card.dataset.fieldKey || ""));
    card.classList.toggle("is-monthly-focus", selectedIds.has(card.dataset.fieldKey || ""));
  });
}

function syncEquipmentUsageLabels() {
  const isGasResource = isGasResourceType();
  const canShowUsageCharges =
    !isGasResource && isBillingSettlementCompleted(state.currentMonth);
  let overallUsage = null;
  let didResolveOverallUsage = false;
  const resolveOverallUsage = () => {
    if (!didResolveOverallUsage) {
      overallUsage = getCurrentOverallMonthlyUsage();
      didResolveOverallUsage = true;
    }

    return overallUsage;
  };

  elements.fieldsGrid.querySelectorAll(".field-card").forEach((card) => {
    const fieldKey = card.dataset.fieldKey || "";
    const equipment = getEquipmentItem(fieldKey);
    const meta = card.querySelector(".field-card-meta");

    if (!equipment) {
      return;
    }

    if (!meta) {
      return;
    }

    let share = meta.querySelector(`[data-field-share-key="${fieldKey}"]`);
    if (!isEquipmentUsageShareTarget(equipment)) {
      share?.remove();
    } else {
      if (!share) {
        share = document.createElement("span");
        share.className = "field-card-share";
        share.dataset.fieldShareKey = fieldKey;
        meta.appendChild(share);
      }

      const usageShareText = getEquipmentUsageShareText(fieldKey, resolveOverallUsage());
      share.textContent = usageShareText;
      share.classList.toggle("is-hidden", !usageShareText);
    }

    let charge = meta.querySelector(`[data-field-charge-key="${fieldKey}"]`);
    if (!charge) {
      charge = document.createElement("span");
      charge.className = "field-card-share";
      charge.dataset.fieldChargeKey = fieldKey;
      meta.appendChild(charge);
    }

    const usageChargeText = canShowUsageCharges ? getEquipmentUsageChargeText(fieldKey) : "";
    charge.textContent = usageChargeText;
    charge.classList.toggle("is-hidden", !usageChargeText);

    meta.querySelector(`[data-field-previous-key="${fieldKey}"]`)?.remove();

    let correction = meta.querySelector(`[data-field-correction-key="${fieldKey}"]`);
    const correctionText = isGasResource ? getGasMonthlyBoundaryOverrideBadgeText(fieldKey) : "";
    const correctionDetailText = correctionText
      ? getGasMonthlyBoundaryOverrideDetailText(fieldKey)
      : "";
    if (!correctionText) {
      correction?.remove();
    } else {
      if (!correction) {
        correction = document.createElement("span");
        correction.className = "field-card-correction-chip";
        correction.dataset.fieldCorrectionKey = fieldKey;
        meta.appendChild(correction);
      }

      correction.textContent = correctionText;
      correction.title = correctionDetailText;
    }

    syncEquipmentCardMetaVisibility(card);
  });
}

function syncEquipmentFieldDayStatusIndicators() {
  return;
}

function getDisplayedEquipmentFieldDayStatus(entry, fieldKey, options = {}) {
  void entry;
  void fieldKey;
  void options;
  return "";
}

function syncEquipmentCardMetaVisibility(card) {
  const meta = card?.querySelector(".field-card-meta");
  if (!meta) {
    return;
  }

  const hasVisibleContent = [...meta.children].some(
    (child) => !child.classList.contains("is-hidden") && Boolean(child.textContent?.trim())
  );
  meta.classList.toggle("is-hidden", !hasVisibleContent);
}
