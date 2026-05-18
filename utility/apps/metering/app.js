const meteringBrowserAdapter =
  typeof KpiMeteringBrowserAdapter !== "undefined"
    ? KpiMeteringBrowserAdapter
    : {
        fetch: (...args) => fetch(...args),
      };

const state = {
  store: loadStore(),
  currentMonth: "",
  selectedDate: "",
  selectedCalendarDates: [],
  loadedSnapshot: "",
  cleanStatusText: "저장된 기록이 없습니다.",
  openTeamPickerKey: "",
  openEquipmentManageKey: "",
  openEquipmentOrderMenu: false,
  openEquipmentAddMenu: false,
  openQuickEntryMenu: false,
  quickEntryResults: [],
  selectedEquipmentKeys: [],
  selectedTeamKey: "",
  selectedTeamKeys: [],
  teamPickerSelections: {},
  teamCalendarSelections: {},
  isEquipmentFullscreen: false,
  selectionDisplayMode: "monthly",
  calendarSelectionAnchorDate: "",
  equipmentSelectionAnchorKey: "",
  teamSelectionAnchorKey: "",
  eventsBound: false,
  isBillingDocumentUploading: false,
  isTeamSettlementPanelOpen: false,
  activeTeamSettlementScope: DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY,
};

const TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER = Object.freeze(
  ["1팀 1파트", "중부하(4)", "최대부하(5)", "경부하(6)"].map(normalizeEquipmentFactorLabel)
);
const TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER_MAP = Object.freeze(
  Object.fromEntries(
    TOTAL_POWER_CARD_PREFERRED_LABEL_ORDER.map((labelKey, index) => [labelKey, index])
  )
);

const equipmentReadingTimelineCache = new Map();
const equipmentValidationReadingTimelineCache = new Map();

const equipmentTitleInteractionState = {
  clickTimeoutId: 0,
};

const localFilePersistenceState = {
  billingDocumentDirectoryHandle: null,
};

const billingDocumentPreviewState = {
  monthValue: "",
  resourceType: "",
  billingDocument: null,
};

const sharedServerPersistenceState = {
  writeChain: Promise.resolve(),
  lastErrorMessage: "",
  meta: getPresetSharedStoreMeta(),
  conflictMeta: null,
};

let equipmentLocalAutosaveTimer = 0;
const QUICK_ENTRY_RESULT_LIMIT = 6;
const QUICK_ENTRY_HIGHLIGHT_DURATION = 1400;
const REPORT_SETTLEMENT_READINESS_ITEMS = Object.freeze([
  Object.freeze({
    resourceType: RESOURCE_TYPES.ELECTRIC,
    resourceLabel: "전기",
    scopeKey: "yusan",
    scopeLabel: "유산",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.ELECTRIC,
    resourceLabel: "전기",
    scopeKey: "bukjeong",
    scopeLabel: "북정",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.GAS,
    resourceLabel: "가스",
    scopeKey: GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    scopeLabel: "북정",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.GAS,
    resourceLabel: "가스",
    scopeKey: GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
    scopeLabel: "유산 LNG",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.GAS,
    resourceLabel: "가스",
    scopeKey: GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY,
    scopeLabel: "유산 LPG",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.WASTE,
    resourceLabel: "폐수",
    scopeKey: WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    scopeLabel: "북정",
  }),
  Object.freeze({
    resourceType: RESOURCE_TYPES.WASTE,
    resourceLabel: "폐수",
    scopeKey: WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY,
    scopeLabel: "유산",
  }),
]);

function renderSummary() {
  const summaryInfo = getCurrentMonthlySummaryInfo();
  const usageCard = elements.totalPowerMonthUsageTotal?.parentElement;
  usageCard?.classList.remove("is-focus-highlight");
  usageCard?.classList.add("is-focus-highlight");
  const selectedEquipmentIds = getSelectedEquipmentIds();
  const isGas = isGasResourceType();
  const isWaste = isWasteResourceType();
  const isProduction = isProductionResourceType();
  const isElectricTeamMode = !isProduction && !isGas && !isWaste && getCurrentMode() === MODES.TEAM;

  if (isGas) {
    const isGasTeamMode = getCurrentMode() === MODES.TEAM;
    const focusedGasSummaryInfo =
      getCurrentMode() === MODES.EQUIPMENT && selectedEquipmentIds.length
        ? getMonthlyFocusedSummaryInfo()
        : null;
    const gasPrimarySummaryInfo = isGasTeamMode ? getGasTeamModeSummaryInfo() : summaryInfo;
    const gasSecondarySummaryInfo = isGasTeamMode
      ? getGasTeamModeFocusedSummaryInfo()
      : focusedGasSummaryInfo || getDefaultGasFocusedSummaryInfo();
    const gasStandaloneSummaryInfo = isGasTeamMode
      ? getGasTeamModeStandaloneSummaryInfo()
      : getGasStandaloneSummaryInfo();

    if (elements.totalPowerMonthUsageTotal) {
      elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(gasPrimarySummaryInfo.value);
    }
    if (elements.summaryFocusLabel) {
      let gasSummaryLabel = gasPrimarySummaryInfo.label;
      if (hasGasMonthlyBoundaryReadingOverrideForMonth()) {
        gasSummaryLabel = `${gasSummaryLabel} · 경계보정 포함`;
      }
      elements.summaryFocusLabel.textContent = gasSummaryLabel;
    }
    if (elements.equipmentMonthUsageTotal) {
      elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(gasSecondarySummaryInfo.value);
    }
    if (elements.equipmentMonthUsageLabel) {
      elements.equipmentMonthUsageLabel.textContent = gasSecondarySummaryInfo.label;
    }
    if (elements.otherMonthUsageTotal) {
      elements.otherMonthUsageTotal.textContent = formatDailyUsage(gasStandaloneSummaryInfo.value);
    }
    if (elements.otherMonthUsageLabel) {
      elements.otherMonthUsageLabel.textContent = gasStandaloneSummaryInfo.label;
    }
    syncCalendarDisplayModeToggleButton();
    syncClearCardSelectionButton();
    syncCalendarPopupWindow();
    renderSettlementReadinessPanel();
    return;
  }

  if (isWaste) {
    const overallUsage = calculateWasteOverallMonthlyUsage();
    const yusanUsage = getTeamBoardMonthlyUsage(WASTE_YUSAN_TEAM_KEY, {
      monthValue: state.currentMonth,
      selectionOnly: true,
    });
    const bukjeongUsage = getTeamBoardMonthlyUsage(WASTE_BUKJEONG_TEAM_KEY, {
      monthValue: state.currentMonth,
      selectionOnly: true,
    });

    if (elements.totalPowerMonthUsageTotal) {
      elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(overallUsage);
    }
    if (elements.summaryFocusLabel) {
      elements.summaryFocusLabel.textContent = "폐수 총사용량";
    }
    if (elements.equipmentMonthUsageTotal) {
      elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(yusanUsage);
    }
    if (elements.equipmentMonthUsageLabel) {
      elements.equipmentMonthUsageLabel.textContent = "유산";
    }
    if (elements.otherMonthUsageTotal) {
      elements.otherMonthUsageTotal.textContent = formatDailyUsage(bukjeongUsage);
    }
    if (elements.otherMonthUsageLabel) {
      elements.otherMonthUsageLabel.textContent = "북정";
    }
    syncCalendarDisplayModeToggleButton();
    syncClearCardSelectionButton();
    syncCalendarPopupWindow();
    renderSettlementReadinessPanel();
    return;
  }

  const focusedSummaryInfo =
    getCurrentMode() === MODES.EQUIPMENT && selectedEquipmentIds.length
      ? getMonthlyFocusedSummaryInfo()
      : null;
  const equipmentSummaryInfo = focusedSummaryInfo || {
    value: isElectricTeamMode
      ? getElectricTeamModeEquipmentSummaryUsage()
      : calculateEquipmentGroupMonthlyUsage(
          isProduction ? getAllEquipmentIds() : getEquipmentSummaryIds()
        ),
    label:
      getCurrentMode() === MODES.TEAM
        ? getTeamModeSummaryLabel()
        : isProduction
          ? "입력 항목"
          : "설비 전력",
  };
  const otherUsage = isProduction ? null : calculateOtherMonthlyUsage();
  const summaryValue = isElectricTeamMode
    ? getElectricTeamModeOverallMonthlyUsage()
    : summaryInfo.value;

  if (elements.totalPowerMonthUsageTotal) {
    elements.totalPowerMonthUsageTotal.textContent = formatDailyUsage(summaryValue);
  }
  if (elements.summaryFocusLabel) {
    elements.summaryFocusLabel.textContent = summaryInfo.label;
  }
  if (elements.equipmentMonthUsageTotal) {
    elements.equipmentMonthUsageTotal.textContent = formatDailyUsage(equipmentSummaryInfo.value);
  }
  if (elements.equipmentMonthUsageLabel) {
    elements.equipmentMonthUsageLabel.textContent = equipmentSummaryInfo.label;
  }
  if (elements.otherMonthUsageTotal) {
    elements.otherMonthUsageTotal.textContent = formatDailyUsage(otherUsage);
  }
  if (elements.otherMonthUsageLabel) {
    elements.otherMonthUsageLabel.textContent = "기타";
  }
  syncCalendarDisplayModeToggleButton();
  syncClearCardSelectionButton();
  syncCalendarPopupWindow();
  renderSettlementReadinessPanel();
}

function formatSettlementReadinessMonthLabel(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return "";
  }

  const [year, month] = normalizedMonth.split("-");
  return `${year}년 ${Number(month)}월`;
}

function getSettlementReadinessPanel() {
  if (!elements.teamModeSection || !elements.teamTotalsGrid) {
    return null;
  }

  if (elements.settlementReadinessPanel?.isConnected) {
    return elements.settlementReadinessPanel;
  }

  const panel = document.createElement("section");
  panel.id = "settlementReadinessPanel";
  panel.className = "settlement-readiness-panel is-hidden";
  panel.dataset.settlementReadinessPanel = "true";
  elements.teamModeSection.insertBefore(
    panel,
    elements.teamSettlementSection || elements.teamTotalsGrid
  );
  elements.settlementReadinessPanel = panel;
  return panel;
}

function getSettlementReadinessDataset(resourceType) {
  const normalizedResourceType = normalizeResourceType(resourceType);
  if (normalizeResourceType(state.store?.resourceType) === normalizedResourceType) {
    syncActiveResourceDatasetToStore(state.store);
  }

  return getActiveResourceDataset(state.store, normalizedResourceType) || {};
}

function getSettlementReadinessScopeEntry(resourceType, monthValue, scopeKey) {
  const dataset = getSettlementReadinessDataset(resourceType);
  const entries = isPlainObject(dataset.billingSettlementEntries)
    ? dataset.billingSettlementEntries
    : {};
  const monthRecord = normalizeBillingSettlementEntry(monthValue, entries[monthValue] || null);
  if (!monthRecord) {
    return null;
  }

  const scopeMap = getBillingSettlementScopeRawMap(monthRecord);
  return normalizeBillingSettlementLeafEntry(monthValue, scopeMap[scopeKey], scopeKey);
}

function getSettlementReadinessItemState(item, monthValue) {
  const entry = getSettlementReadinessScopeEntry(item.resourceType, monthValue, item.scopeKey);
  const hasValues =
    typeof hasBillingSettlementEntryStoredValues === "function" &&
    hasBillingSettlementEntryStoredValues(entry);
  const isReady = Boolean(entry?.completed === true && hasValues);

  if (isReady) {
    return {
      ...item,
      statusKey: "ready",
      statusLabel: "완료",
      detailText: "보고서 포함",
    };
  }

  if (hasValues) {
    return {
      ...item,
      statusKey: "pending",
      statusLabel: "값 있음 / 완료 누락",
      detailText: "저장 시 완료",
    };
  }

  return {
    ...item,
    statusKey: "missing",
    statusLabel: "값 없음",
    detailText: "정산값 필요",
  };
}

function createSettlementReadinessItemElement(item) {
  const row = document.createElement("div");
  row.className = `settlement-readiness-item is-${item.statusKey}`;
  row.dataset.settlementReadinessResource = item.resourceType;
  row.dataset.settlementReadinessScope = item.scopeKey;

  const label = document.createElement("span");
  label.className = "settlement-readiness-label";
  label.textContent = `${item.resourceLabel} ${item.scopeLabel}`;

  const status = document.createElement("strong");
  status.className = "settlement-readiness-status";
  status.textContent = item.statusLabel;

  const detail = document.createElement("span");
  detail.className = "settlement-readiness-detail";
  detail.textContent = item.detailText;

  row.append(label, status, detail);
  return row;
}

function renderSettlementReadinessPanel() {
  const panel = getSettlementReadinessPanel();
  if (!panel) {
    return;
  }

  const monthValue = normalizeMonthValue(state.currentMonth);
  const shouldShow =
    getCurrentMode() === MODES.TEAM && !isProductionResourceType() && Boolean(monthValue);
  panel.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    panel.replaceChildren();
    return;
  }

  const itemStates = REPORT_SETTLEMENT_READINESS_ITEMS.map((item) =>
    getSettlementReadinessItemState(item, monthValue)
  );
  const readyCount = itemStates.filter((item) => item.statusKey === "ready").length;
  const pendingCount = itemStates.filter((item) => item.statusKey === "pending").length;
  const monthLabel = formatSettlementReadinessMonthLabel(monthValue);

  const head = document.createElement("div");
  head.className = "settlement-readiness-head";

  const copy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "settlement-readiness-eyebrow";
  eyebrow.textContent = "보고서 월 준비 상태";
  const title = document.createElement("h3");
  title.textContent = monthLabel ? `${monthLabel} 정산` : "정산";
  copy.append(eyebrow, title);

  const pill = document.createElement("span");
  pill.className = `settlement-readiness-pill${readyCount === itemStates.length ? " is-ready" : ""}`;
  pill.textContent = `${readyCount}/${itemStates.length} 완료`;
  if (pendingCount > 0) {
    pill.title = `${pendingCount}개 항목은 저장하면 완료 처리됩니다.`;
  }

  head.append(copy, pill);

  const grid = document.createElement("div");
  grid.className = "settlement-readiness-grid";
  itemStates.forEach((item) => {
    grid.appendChild(createSettlementReadinessItemElement(item));
  });

  panel.replaceChildren(head, grid);
}

function getEquipmentFieldCardDisplayPriority(card) {
  const equipment = getEquipmentItem(card?.dataset.fieldKey || "");
  if (!equipment) {
    return 99;
  }

  if (isOtherEquipment(equipment)) {
    return 2;
  }

  if (card.classList.contains("is-rest-equal") || card.classList.contains("is-inactive")) {
    return 1;
  }

  return 0;
}

function syncEquipmentFieldCardDisplayOrder() {
  if (!elements.fieldsGrid) {
    return;
  }

  const sourceOrder = new Map(
    state.store.equipmentItems.map((item, index) => [item.id, index])
  );
  const cards = [...elements.fieldsGrid.querySelectorAll(".field-card[data-field-key]")];
  if (cards.length < 2) {
    return;
  }

  cards
    .sort((leftCard, rightCard) => {
      const priorityDiff =
        getEquipmentFieldCardDisplayPriority(leftCard) -
        getEquipmentFieldCardDisplayPriority(rightCard);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      const leftIndex = sourceOrder.get(leftCard.dataset.fieldKey || "") ?? Number.MAX_SAFE_INTEGER;
      const rightIndex =
        sourceOrder.get(rightCard.dataset.fieldKey || "") ?? Number.MAX_SAFE_INTEGER;
      return leftIndex - rightIndex;
    })
    .forEach((card) => {
      elements.fieldsGrid.appendChild(card);
    });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(reader.result instanceof ArrayBuffer ? reader.result : new ArrayBuffer(0));
    });

    reader.addEventListener("error", () => {
      reject(reader.error || new Error("billing_document_read_failed"));
    });

    reader.readAsArrayBuffer(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      resolve(String(reader.result || ""));
    });

    reader.addEventListener("error", () => {
      reject(reader.error || new Error("billing_document_read_failed"));
    });

    reader.readAsDataURL(file);
  });
}

function removeEquipmentFieldFromEntries(fieldKey, options = {}) {
  const shouldRemoveDate =
    typeof options.shouldRemoveDate === "function" ? options.shouldRemoveDate : () => true;

  Object.keys(state.store.equipmentEntries).forEach((dateString) => {
    if (!shouldRemoveDate(dateString)) {
      return;
    }

    const entry = state.store.equipmentEntries[dateString];

    delete entry?.values?.[fieldKey];
    delete entry?.statuses?.[fieldKey];
    delete entry?.fieldDayStatuses?.[fieldKey];

    if (!hasEntryData(entry)) {
      delete state.store.equipmentEntries[dateString];
    }
  });
}

function removeEquipmentFromAllTeams(equipmentId) {
  TEAM_GROUPS.forEach((team) => {
    state.store.teamAssignments[team.key] = (state.store.teamAssignments[team.key] || []).filter(
      (itemId) => itemId !== equipmentId
    );
  });
}

function renderTeamMode() {
  syncTeamSettlementButtonState();

  if (!state.currentMonth) {
    syncClearCardSelectionButton();
    return;
  }

  syncTeamCalendarSelectionState();

  const currentTeamGroups = getCurrentTeamGroups();
  syncOpenTeamPickerSelectionState(currentTeamGroups);

  elements.teamUsagePeriodText.textContent = getTeamUsagePeriodText();
  renderTeamSettlementSection();
  renderTeamTotals();
  renderTeamBoards();
  syncTeamSettlementButtonState();

  if (getCurrentMode() === MODES.TEAM) {
    syncSelectedDatePresentation();
  }
  syncClearCardSelectionButton();
}

async function deleteBillingDocumentFromSharedServer(billingDocument) {
  const documentId = normalizeText(billingDocument?.documentId);
  if (!supportsSharedServerPersistence() || !documentId) {
    return false;
  }

  const response = await meteringBrowserAdapter.fetch(
    `${SHARED_APP_CONFIG.apiBase.replace(/\/+$/, "")}/files/${encodeURIComponent(documentId)}`,
    {
      method: "DELETE",
      cache: "no-store",
      credentials: "same-origin",
    }
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`billing_document_delete_failed:${response.status}`);
  }

  return true;
}

async function deleteBillingDocumentStorage(
  billingDocument,
  resourceType = getCurrentResourceType()
) {
  const documentId = normalizeText(billingDocument?.documentId);
  if (documentId) {
    return deleteBillingDocumentFromSharedServer(billingDocument);
  }

  return deleteBillingDocumentFromLocalDirectory(billingDocument, resourceType);
}
