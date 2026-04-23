function getBukjeongTotalCardMonthlyUsage(monthValue = state.currentMonth, options = {}) {
  if (!isElectricResourceType()) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, BUKJEONG_TOTAL_SELECTION_ID, monthValue)
  ) {
    return null;
  }

  const usage = getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC);
  return Number.isFinite(usage) ? usage : null;
}

function getBukjeongTotalCardAmountValue(monthValue = state.currentMonth, options = {}) {
  const amount = resolveBukjeongSettlementAmount(monthValue);
  if (!Number.isFinite(amount)) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, BUKJEONG_TOTAL_SELECTION_ID, monthValue)
  ) {
    return null;
  }

  return amount;
}

function getBukjeongTotalCardChargePool(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return null;
  }

  return getBukjeongTotalCardAmountValue(monthValue);
}

function getBukjeongTotalCardDescriptorUsageValue(item, monthValue = state.currentMonth, options = {}) {
  if (!item || !item.isDirectTeamUsage) {
    return null;
  }

  if (
    options.selectionOnly === true &&
    item.selectionId &&
    !isTeamCalendarSelectionActive(BUKJEONG_POWER_TEAM_KEY, item.selectionId, monthValue)
  ) {
    return null;
  }

  const usage = getDirectTeamMonthlyUsage(item.teamKey, monthValue, RESOURCE_TYPES.ELECTRIC);
  return Number.isFinite(usage) ? usage : null;
}

function getBukjeongTotalCardDescriptorUsageShare(item, monthValue = state.currentMonth, options = {}) {
  const usage = getBukjeongTotalCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getBukjeongTotalCardMonthlyUsage(monthValue);
  return calculateUsageShare(usage, totalUsage);
}

function calculateBukjeongTotalCardDescriptorCharge(item, monthValue = state.currentMonth, options = {}) {
  const chargePool = getBukjeongTotalCardChargePool(monthValue);
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  if (!Number.isFinite(chargePool) || !Number.isFinite(usageShare)) {
    return null;
  }

  return chargePool * usageShare;
}

function getBukjeongTotalCardDescriptorShareText(item, monthValue = state.currentMonth, options = {}) {
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  return usageShare === null ? "" : `전력총량 ${formatUsageShare(usageShare)}`;
}

function getBukjeongTotalCardDescriptorChargeText(item, monthValue = state.currentMonth, options = {}) {
  const charge = calculateBukjeongTotalCardDescriptorCharge(item, monthValue, options);
  return Number.isFinite(charge) ? `금액 ${formatSettlementAmount(charge)}` : "";
}

function getBukjeongTotalCardDescriptorDetailText(item, monthValue = state.currentMonth, options = {}) {
  const usage = getBukjeongTotalCardDescriptorUsageValue(item, monthValue, options);
  const totalUsage = getBukjeongTotalCardMonthlyUsage(monthValue);
  const usageShare = getBukjeongTotalCardDescriptorUsageShare(item, monthValue, options);
  const chargePool = getBukjeongTotalCardChargePool(monthValue);
  const charge = calculateBukjeongTotalCardDescriptorCharge(item, monthValue, options);
  const parts = [];

  if (Number.isFinite(usage) && Number.isFinite(totalUsage) && Number.isFinite(usageShare)) {
    parts.push(
      `북정 전력총량 ${formatWholeNumber(totalUsage)} 중 ${formatWholeNumber(usage)} = ${formatUsageShare(
        usageShare
      )}`
    );
  }

  if (Number.isFinite(chargePool) && Number.isFinite(charge) && Number.isFinite(usageShare)) {
    parts.push(
      `북정 금액 ${formatSettlementAmount(chargePool)} x ${formatUsageShare(
        usageShare
      )} = ${formatSettlementAmount(charge)}`
    );
  }

  return parts.join("\n");
}

function getBukjeongTotalCardToggleDescriptors(monthValue = state.currentMonth) {
  if (!isElectricResourceType()) {
    return [];
  }

  const team = getTeamGroup(BUKJEONG_POWER_TEAM_KEY);
  return [
    {
      id: BUKJEONG_TOTAL_SELECTION_ID,
      selectionId: BUKJEONG_TOTAL_SELECTION_ID,
      label: "북정 전력 총량",
      iconKey: team?.iconKey || "power_active",
      usageText: formatDailyUsage(
        getDirectTeamMonthlyUsage(TEAM_01_01_KEY, monthValue, RESOURCE_TYPES.ELECTRIC)
      ),
      chargeText: getBukjeongTotalCardDescriptorChargeText(
        {
          isDirectTeamUsage: true,
          teamKey: TEAM_01_01_KEY,
        },
        monthValue
      ),
      detailText: getTeamContextDetailText(BUKJEONG_POWER_TEAM_KEY),
      removable: false,
      isDirectTeamUsage: true,
      teamKey: TEAM_01_01_KEY,
      sourceTeamKey: BUKJEONG_POWER_TEAM_KEY,
    },
  ];
}
