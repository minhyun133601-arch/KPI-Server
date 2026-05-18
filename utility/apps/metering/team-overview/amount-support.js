function getElectricOtherCostDescriptors(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return [];
  }

  const shouldSplitBukjeongCosts = [
    getBillingSettlementNumericField("vat", monthValue, "bukjeong"),
    getBillingSettlementNumericField("electric_power_fund", monthValue, "bukjeong"),
    getBillingSettlementNumericField("tv_reception_fee", monthValue, "bukjeong"),
    getBillingSettlementNumericField("rounding_adjustment", monthValue, "bukjeong"),
  ].some((value) => Number.isFinite(value));
  const descriptors = [];
  const pushDescriptor = (label, value, selectionId) => {
    if (!Number.isFinite(value)) {
      return;
    }
    descriptors.push({ label, value, selectionId });
  };

  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 부가가치세" : "부가가치세",
    getBillingSettlementNumericField("vat", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.vat
  );
  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 전력기금" : "전력기금",
    getBillingSettlementNumericField("electric_power_fund", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.electricPowerFund
  );
  pushDescriptor(
    shouldSplitBukjeongCosts ? "유산 TV수신료" : "TV수신료",
    getBillingSettlementNumericField("tv_reception_fee", monthValue, "yusan"),
    ELECTRIC_OTHER_COST_SELECTION_IDS.tvReceptionFee
  );

  const yusanRoundingAdjustment = getBillingSettlementNumericField(
    "rounding_adjustment",
    monthValue,
    "yusan"
  );
  if (Number.isFinite(yusanRoundingAdjustment)) {
    pushDescriptor(
      shouldSplitBukjeongCosts ? "유산 원단위 절삭" : "원단위 절삭",
      -yusanRoundingAdjustment,
      ELECTRIC_OTHER_COST_SELECTION_IDS.roundingAdjustment
    );
  }

  if (shouldSplitBukjeongCosts) {
    pushDescriptor(
      "북정 부가가치세",
      getBillingSettlementNumericField("vat", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongVat
    );
    pushDescriptor(
      "북정 전력기금",
      getBillingSettlementNumericField("electric_power_fund", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongElectricPowerFund
    );
    pushDescriptor(
      "북정 TV수신료",
      getBillingSettlementNumericField("tv_reception_fee", monthValue, "bukjeong"),
      ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongTvReceptionFee
    );

    const bukjeongRoundingAdjustment = getBillingSettlementNumericField(
      "rounding_adjustment",
      monthValue,
      "bukjeong"
    );
    if (Number.isFinite(bukjeongRoundingAdjustment)) {
      pushDescriptor(
        "북정 원단위 절삭",
        -bukjeongRoundingAdjustment,
        ELECTRIC_OTHER_COST_SELECTION_IDS.bukjeongRoundingAdjustment
      );
    }
  }

  const amountAdjustment = getTeamAmountAdjustmentValue("team_04", monthValue);
  if (amountAdjustment) {
    pushDescriptor(
      "월별 보정",
      amountAdjustment,
      ELECTRIC_OTHER_COST_SELECTION_IDS.monthlyAdjustment
    );
  }

  return descriptors;
}

function getElectricOtherCostDisplayDescriptors(monthValue = state.currentMonth, options = {}) {
  const descriptors = getElectricOtherCostDescriptors(monthValue);
  if (options.selectionOnly !== true) {
    return descriptors;
  }

  const activeIds = new Set(getTeamCalendarSelection(ELECTRIC_OTHER_COST_TEAM_KEY, monthValue));
  return descriptors.filter((item) => item.selectionId && activeIds.has(item.selectionId));
}

function calculateElectricOtherCostAmount(monthValue = state.currentMonth, options = {}) {
  return sumFiniteValues(
    getElectricOtherCostDisplayDescriptors(monthValue, options).map((item) => item.value)
  );
}

function getElectricOtherCostAmountText(monthValue = state.currentMonth, options = {}) {
  const amount = calculateElectricOtherCostAmount(monthValue, options);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getElectricOtherCostDetailText(monthValue = state.currentMonth, options = {}) {
  const descriptors = getElectricOtherCostDisplayDescriptors(monthValue, options);
  if (!descriptors.length) {
    return "";
  }

  const parts = descriptors.map(
    (item) => `${item.label} ${formatSettlementAmount(item.value)}`
  );
  const amount = calculateElectricOtherCostAmount(monthValue, options);
  if (Number.isFinite(amount)) {
    parts.push(`그 외 비용 ${formatSettlementAmount(amount)}`);
  }
  return parts.join("\n");
}

function getGasOtherCostDescriptors(monthValue = state.currentMonth) {
  if (!isGasResourceType()) {
    return [];
  }

  const descriptors = [];
  const pushDescriptor = (label, value, selectionId) => {
    if (!Number.isFinite(value) || value === 0) {
      return;
    }
    descriptors.push({ label, value, selectionId });
  };

  const pushLngScopeDescriptors = (scopeKey, scopeLabel, selectionIds) => {
    pushDescriptor(
      `${scopeLabel} 교체비`,
      getBillingSettlementNumericField("operation_fee", monthValue, scopeKey),
      selectionIds.operationFee
    );
    pushDescriptor(
      `${scopeLabel} 부가세`,
      getBillingSettlementNumericField("vat", monthValue, scopeKey),
      selectionIds.vat
    );
    pushDescriptor(
      `${scopeLabel} 가산세`,
      getBillingSettlementNumericField("fuel_adjustment_charge", monthValue, scopeKey),
      selectionIds.fuelAdjustmentCharge
    );

    const roundingAdjustment = getBillingSettlementNumericField(
      "rounding_adjustment",
      monthValue,
      scopeKey
    );
    if (Number.isFinite(roundingAdjustment) && roundingAdjustment !== 0) {
      pushDescriptor(
        `${scopeLabel} 원절삭`,
        -roundingAdjustment,
        selectionIds.roundingAdjustment
      );
    }
  };

  pushLngScopeDescriptors(
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    "북정",
    {
      operationFee: GAS_OTHER_COST_SELECTION_IDS.bukjeongOperationFee,
      vat: GAS_OTHER_COST_SELECTION_IDS.bukjeongVat,
      fuelAdjustmentCharge: GAS_OTHER_COST_SELECTION_IDS.bukjeongFuelAdjustmentCharge,
      roundingAdjustment: GAS_OTHER_COST_SELECTION_IDS.bukjeongRoundingAdjustment,
    }
  );
  pushLngScopeDescriptors(
    GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
    "유산 LNG",
    {
      operationFee: GAS_OTHER_COST_SELECTION_IDS.yusanLngOperationFee,
      vat: GAS_OTHER_COST_SELECTION_IDS.yusanLngVat,
      fuelAdjustmentCharge: GAS_OTHER_COST_SELECTION_IDS.yusanLngFuelAdjustmentCharge,
      roundingAdjustment: GAS_OTHER_COST_SELECTION_IDS.yusanLngRoundingAdjustment,
    }
  );
  pushDescriptor(
    "유산 LPG 세액",
    getBillingSettlementNumericField(
      "vat",
      monthValue,
      GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY
    ),
    GAS_OTHER_COST_SELECTION_IDS.yusanLpgVat
  );

  return descriptors;
}

function getGasOtherCostDisplayDescriptors(monthValue = state.currentMonth, options = {}) {
  const descriptors = getGasOtherCostDescriptors(monthValue);
  if (options.selectionOnly !== true) {
    return descriptors;
  }

  const activeIds = new Set(getTeamCalendarSelection(GAS_OTHER_COST_TEAM_KEY, monthValue));
  return descriptors.filter((item) => item.selectionId && activeIds.has(item.selectionId));
}

function calculateGasOtherCostAmount(monthValue = state.currentMonth, options = {}) {
  return sumFiniteValues(
    getGasOtherCostDisplayDescriptors(monthValue, options).map((item) => item.value)
  );
}

function getGasOtherCostAmountText(monthValue = state.currentMonth, options = {}) {
  const amount = calculateGasOtherCostAmount(monthValue, options);
  return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
}

function getGasOtherCostDetailText(monthValue = state.currentMonth, options = {}) {
  const descriptors = getGasOtherCostDisplayDescriptors(monthValue, options);
  if (!descriptors.length) {
    return "";
  }

  const parts = descriptors.map(
    (item) => `${item.label} ${formatSettlementAmount(item.value)}`
  );
  const amount = calculateGasOtherCostAmount(monthValue, options);
  if (Number.isFinite(amount)) {
    parts.push(`그 외 비용 ${formatSettlementAmount(amount)}`);
  }
  return parts.join("\n");
}

function calculateElectricManageDisplayAmount(monthValue = state.currentMonth, options = {}) {
  if (!isElectricResourceType()) {
    return null;
  }

  return calculateTeamEquipmentVariableChargeSum("team_04", monthValue, options);
}

function getElectricManageDisplayDetailText(monthValue = state.currentMonth, options = {}) {
  const variableChargeSum = calculateTeamEquipmentVariableChargeSum("team_04", monthValue, options);
  const amount = calculateElectricManageDisplayAmount(monthValue, options);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = [];
  if (Number.isFinite(variableChargeSum)) {
    parts.push(`설비별 사용요금 합계 ${formatSettlementAmount(variableChargeSum)}`);
  }
  if (getElectricOtherCostDescriptors(monthValue).length) {
    parts.push("그 외 비용은 별도 카드에서 표시합니다.");
  }
  parts.push(`관리동 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}

function getTeamAmountAdjustmentValue(teamKey, monthValue = state.currentMonth, options = {}) {
  if (options.selectionOnly) {
    return 0;
  }

  const monthAdjustments = TEAM_AMOUNT_ADJUSTMENTS[monthValue];

  if (!monthAdjustments) {
    return 0;
  }

  const adjustment = monthAdjustments[teamKey];
  return Number.isFinite(adjustment) ? adjustment : 0;
}

function calculateTeamAmount(teamKey, monthValue = state.currentMonth, options = {}) {
  if (
    !hasTeamGroup(teamKey) ||
    isPowerActiveTeamKey(teamKey) ||
    isPowerReactiveTeamKey(teamKey)
  ) {
    return null;
  }

  if (isElectricResourceType() && (teamKey === TEAM_01_01_KEY || isPowerBukjeongTeamKey(teamKey))) {
    return resolveBukjeongSettlementAmount(monthValue);
  }

  if (!isBillingSettlementCompleted(monthValue)) {
    return null;
  }

  const components = [
    calculateTeamEquipmentVariableChargeSum(teamKey, monthValue, options),
  ];

  if (teamKey === "team_04") {
    components.push(
      getBillingSettlementNumericField("vat", monthValue),
      getBillingSettlementNumericField("electric_power_fund", monthValue),
      getBillingSettlementNumericField("tv_reception_fee", monthValue)
    );
  }

  const validComponents = components.filter((value) => Number.isFinite(value));

  if (!validComponents.length) {
    return null;
  }

  return validComponents.reduce((sum, value) => sum + value, 0) + getTeamAmountAdjustmentValue(teamKey, monthValue, options);
}

function getTeamAmountText(teamKey, options = {}, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    const amount = calculateGasTeamDisplayAmount(teamKey, monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isWasteResourceType()) {
    const amount = calculateWasteTeamDisplayAmount(teamKey, monthValue);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isElectricResourceType() && isPowerReactiveTeamKey(teamKey)) {
    return "";
  }

  if (isElectricResourceType() && teamKey === BUKJEONG_POWER_TEAM_KEY) {
    const amount = getBukjeongTotalCardAmountValue(monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  if (isElectricResourceType() && teamKey === "team_04") {
    const amount = calculateElectricManageDisplayAmount(monthValue, options);
    return Number.isFinite(amount) ? `금액 ${formatSettlementAmount(amount)}` : "";
  }

  const amount = calculateTeamAmount(teamKey, monthValue, options);
  return amount === null ? "" : `금액 ${formatSettlementAmount(amount)}`;
}

function getTeamAmountDetailText(teamKey, options = {}, monthValue = state.currentMonth) {
  if (isGasResourceType()) {
    return getGasTeamAmountDetailText(teamKey, monthValue, options);
  }

  if (isWasteResourceType()) {
    return getWasteTeamAmountDetailText(teamKey, monthValue);
  }

  if (
    !hasTeamGroup(teamKey) ||
    isPowerActiveTeamKey(teamKey) ||
    isPowerReactiveTeamKey(teamKey)
  ) {
    return "";
  }

  if (isElectricResourceType() && (teamKey === TEAM_01_01_KEY || isPowerBukjeongTeamKey(teamKey))) {
    const amount =
      teamKey === BUKJEONG_POWER_TEAM_KEY
        ? getBukjeongTotalCardAmountValue(monthValue, options)
        : resolveBukjeongSettlementAmount(monthValue);
    if (!Number.isFinite(amount)) {
      return "";
    }

    const directAmount = getDirectTeamMonthlyAmount(
      BUKJEONG_POWER_TEAM_KEY,
      monthValue,
      RESOURCE_TYPES.ELECTRIC
    );
    const scopedEntry = getBillingSettlementEntry(monthValue, "bukjeong");
    const scopedFields = scopedEntry?.fields || {};
    const electricityChargeTotal = resolveBillingSettlementElectricityChargeTotalValue(scopedFields);
    if (Number.isFinite(electricityChargeTotal)) {
      const parts = [
        `북정 기준 팀 1팀 1파트`,
        `북정 전기요금계 ${formatSettlementAmount(electricityChargeTotal)}`,
      ];
      parts.push("북정 그 외 비용은 별도 카드에서 표시합니다.");
      parts.push(`북정 금액 ${formatSettlementAmount(amount)}`);
      return parts.join("\n");
    }

    const parts = [
      `북정 기준 팀 1팀 1파트`,
      `북정 금액 ${formatSettlementAmount(amount)}`,
    ];
    if (Number.isFinite(directAmount)) {
      parts.push(`직접 입력 금액 ${formatSettlementAmount(directAmount)}`);
    } else {
      parts.push("직접 입력 금액이 없어서 기존 전력 비율 계산값을 표시합니다.");
    }
    return parts.join("\n");
  }

  if (isElectricResourceType() && teamKey === "team_04") {
    return getElectricManageDisplayDetailText(monthValue, options);
  }

  const teamLabel = getTeamDisplayLabel(teamKey) || "팀";
  const variableChargeSum = calculateTeamEquipmentVariableChargeSum(teamKey, monthValue, options);
  const vat = getBillingSettlementNumericField("vat", monthValue);
  const electricPowerFund = getBillingSettlementNumericField("electric_power_fund", monthValue);
  const tvReceptionFee = getBillingSettlementNumericField("tv_reception_fee", monthValue);
  const amountAdjustment = getTeamAmountAdjustmentValue(teamKey, monthValue, options);
  const amount = calculateTeamAmount(teamKey, monthValue, options);

  if (!Number.isFinite(amount)) {
    return "";
  }

  const parts = [];

  if (Number.isFinite(variableChargeSum)) {
    parts.push(`설비별 사용요금 합계 ${formatSettlementAmount(variableChargeSum)}`);
  }

  if (teamKey === "team_04") {
    if (Number.isFinite(vat)) {
      parts.push(`부가가치세 ${formatSettlementAmount(vat)}`);
    }

    if (Number.isFinite(electricPowerFund)) {
      parts.push(`전력기금 ${formatSettlementAmount(electricPowerFund)}`);
    }

    if (Number.isFinite(tvReceptionFee)) {
      parts.push(`TV수신료 ${formatSettlementAmount(tvReceptionFee)}`);
    }
  }

  if (amountAdjustment) {
    parts.push(`금액 보정 ${formatSettlementAmount(amountAdjustment)}`);
  }

  parts.push(`${teamLabel} 금액 ${formatSettlementAmount(amount)}`);
  return parts.join("\n");
}
