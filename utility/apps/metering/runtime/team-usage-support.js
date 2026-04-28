function getCorrectedEquipmentMonthlyUsage(equipmentId) {
  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  if (usage === null) {
    return null;
  }

  if (isGasResourceType() && equipmentId === GAS_LPG_CORRECTION_EQUIPMENT_ID) {
    return usage * GAS_LPG_CORRECTION_USAGE_FACTOR;
  }

  return usage;
}

function getGasTeamDisplayUsageFactor(equipmentId) {
  if (!isGasResourceType()) {
    return null;
  }

  if (equipmentId === GAS_TOTAL_USAGE_EQUIPMENT_ID) {
    return 1;
  }

  if (equipmentId === GAS_LPG_CORRECTION_EQUIPMENT_ID) {
    return GAS_LPG_CORRECTION_USAGE_FACTOR;
  }

  if (GAS_CORRECTION_TARGET_IDS.has(equipmentId)) {
    const factor = calculateGasCorrectionFactorForMonth();
    return Number.isFinite(factor) ? factor : null;
  }

  return null;
}

function isGasTeamDisplayUsageEquipment(equipmentId) {
  return Number.isFinite(getGasTeamDisplayUsageFactor(equipmentId));
}

function getTeamAssignedChipDisplayUsage(equipmentId) {
  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  if (usage === null) {
    return null;
  }

  const factor = getGasTeamDisplayUsageFactor(equipmentId);
  if (!Number.isFinite(factor)) {
    return usage;
  }

  return usage * factor;
}

function getTeamAssignedChipUsageText(equipmentId) {
  if (isGasTeamDisplayUsageEquipment(equipmentId)) {
    return formatDailyUsage(getTeamAssignedChipDisplayUsage(equipmentId));
  }

  return formatEquipmentUsage(equipmentId);
}

function getTeamAssignedChipChargeText(equipmentId, monthValue = state.currentMonth) {
  if (isGasTeamDisplayUsageEquipment(equipmentId)) {
    return "(사용량)";
  }

  return getEquipmentUsageChargeText(equipmentId, monthValue);
}

function getTeamAssignedChipDetailText(equipmentId) {
  const detailText = getEquipmentUsageDetailText(equipmentId);
  if (!isGasTeamDisplayUsageEquipment(equipmentId)) {
    return detailText;
  }

  const usage = calculateEquipmentMonthlyUsage(equipmentId).value;
  const displayUsage = getTeamAssignedChipDisplayUsage(equipmentId);
  const factor = getGasTeamDisplayUsageFactor(equipmentId);
  if (!Number.isFinite(usage) || !Number.isFinite(displayUsage) || !Number.isFinite(factor)) {
    return detailText;
  }

  const displayDetailText = `팀별 표시 사용량 ${formatWholeNumber(usage)} x ${formatNumber(
    factor
  )} = ${formatWholeNumber(displayUsage)}`;
  return detailText ? `${detailText}\n${displayDetailText}` : displayDetailText;
}

function shouldShowTeamAssignedChipShare(teamKey) {
  return (
    Boolean(teamKey) &&
    !isPowerActiveTeamKey(teamKey) &&
    !isPowerReactiveTeamKey(teamKey) &&
    getSelectedTeamKeys().includes(teamKey)
  );
}

function getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options = {}) {
  if (!teamKey || !equipmentId) {
    return null;
  }

  const selectionOnly = options.selectionOnly === true;
  const activeIds = selectionOnly ? getTeamCalendarSelection(teamKey) : getTeamCalendarSelectableIds(teamKey);
  if (!activeIds.includes(equipmentId)) {
    return null;
  }

  if (equipmentId === SHARED_COMPRESSOR_VIRTUAL_ID) {
    const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, state.currentMonth, {
      selectionOnly,
    });
    return Number.isFinite(sharedUsage) ? sharedUsage : null;
  }

  const usage = isGasTeamDisplayUsageEquipment(equipmentId)
    ? getTeamAssignedChipDisplayUsage(equipmentId)
    : calculateDisplayedEquipmentMonthlyUsage(equipmentId).value;
  return Number.isFinite(usage) ? usage : null;
}

function getTeamAssignedChipShareTotalUsage(teamKey, options = {}) {
  if (!teamKey) {
    return null;
  }

  const selectionOnly = options.selectionOnly === true;
  const total = (selectionOnly ? getTeamCalendarSelection(teamKey) : getTeamCalendarSelectableIds(teamKey))
    .map((equipmentId) =>
      getTeamAssignedChipShareUsageValue(teamKey, equipmentId, {
        selectionOnly,
      })
    )
    .filter((value) => value !== null);

  if (!total.length) {
    return null;
  }

  return total.reduce((sum, value) => sum + value, 0);
}

function getTeamAssignedChipShareText(teamKey, equipmentId, options = {}) {
  const usage = getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options);
  const totalUsage = getTeamAssignedChipShareTotalUsage(teamKey, options);
  const usageShare = calculateUsageShare(usage, totalUsage);
  if (usageShare === null) {
    return "";
  }

  return `팀 기준 ${formatUsageShare(usageShare)}`;
}

function getTeamAssignedChipShareDetailText(teamKey, equipmentId, options = {}) {
  const usage = getTeamAssignedChipShareUsageValue(teamKey, equipmentId, options);
  const totalUsage = getTeamAssignedChipShareTotalUsage(teamKey, options);
  const usageShare = calculateUsageShare(usage, totalUsage);
  if (usageShare === null) {
    return "";
  }

  const teamLabel = getTeamDisplayLabel(teamKey) || "선택 팀";
  return `${teamLabel} 합계 ${formatDailyUsage(totalUsage)} 중 ${formatDailyUsage(
    usage
  )} = ${formatUsageShare(usageShare)}`;
}

function getTeamCorrectedMonthlyUsage(teamKey, options = {}) {
  if (!isGasResourceType()) {
    return null;
  }

  const values = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, state.currentMonth, options)
    .map((equipmentId) => getCorrectedEquipmentMonthlyUsage(equipmentId))
    .filter((value) => value !== null);
  const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, state.currentMonth, options);

  if (Number.isFinite(sharedUsage)) {
    values.push(sharedUsage);
  }

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}

function getSelectedTeamCorrectedSummaryInfo() {
  const selectedTeamKeys = getSelectedTeamKeys();
  if (!selectedTeamKeys.length) {
    return null;
  }

  const label =
    selectedTeamKeys.length === 1
      ? `${getTeamDisplayLabel(selectedTeamKeys[0]) || "선택 팀"} 보정 사용량`
      : `선택 팀 ${selectedTeamKeys.length}개 보정 사용량`;
  const values = selectedTeamKeys
    .map((teamKey) => getTeamCorrectedMonthlyUsage(teamKey, { selectionOnly: true }))
    .filter((value) => value !== null);

  return {
    value: values.length ? values.reduce((sum, value) => sum + value, 0) : null,
    label: `${label} (LPG x ${formatNumber(GAS_LPG_CORRECTION_USAGE_FACTOR)})`,
  };
}

function getElectricLiquidCompressorTeamUsageAdjustmentRule() {
  if (typeof ELECTRIC_LIQUID_COMPRESSOR_TEAM_USAGE_ADJUSTMENT === "undefined") {
    return null;
  }

  return ELECTRIC_LIQUID_COMPRESSOR_TEAM_USAGE_ADJUSTMENT &&
    typeof ELECTRIC_LIQUID_COMPRESSOR_TEAM_USAGE_ADJUSTMENT === "object"
    ? ELECTRIC_LIQUID_COMPRESSOR_TEAM_USAGE_ADJUSTMENT
    : null;
}

function normalizeElectricTeamUsageAdjustmentMonthValue(monthValue = state.currentMonth) {
  const normalizedMonth =
    typeof normalizeMonthValue === "function"
      ? normalizeMonthValue(monthValue)
      : String(monthValue || "").trim();
  return /^\d{4}-\d{2}$/.test(normalizedMonth) ? normalizedMonth : "";
}

function compareElectricTeamUsageAdjustmentMonths(leftMonthValue, rightMonthValue) {
  if (typeof compareMonthValues === "function") {
    return compareMonthValues(leftMonthValue, rightMonthValue);
  }

  return String(leftMonthValue || "").localeCompare(String(rightMonthValue || ""));
}

function shouldApplyElectricLiquidCompressorTeamUsageAdjustment(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  if (isGasResourceType()) {
    return false;
  }

  const rule = getElectricLiquidCompressorTeamUsageAdjustmentRule();
  if (!rule || teamKey !== rule.teamKey) {
    return false;
  }

  const normalizedMonth = normalizeElectricTeamUsageAdjustmentMonthValue(monthValue);
  const startMonth = normalizeElectricTeamUsageAdjustmentMonthValue(rule.startMonth);
  if (!normalizedMonth) {
    return false;
  }

  if (startMonth && compareElectricTeamUsageAdjustmentMonths(normalizedMonth, startMonth) < 0) {
    return false;
  }

  if (options.selectionOnly !== true) {
    return true;
  }

  const selectedEquipmentIds = getTeamChargeEquipmentIdsExcludingSharedCompressor(
    teamKey,
    monthValue,
    options
  );
  const fullEquipmentIds = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, monthValue);

  return (
    fullEquipmentIds.length > 0 &&
    fullEquipmentIds.every((equipmentId) => selectedEquipmentIds.includes(equipmentId))
  );
}

function calculateElectricLiquidCompressorTeamUsageAdjustment(
  teamKey,
  monthValue = state.currentMonth,
  options = {}
) {
  if (!shouldApplyElectricLiquidCompressorTeamUsageAdjustment(teamKey, monthValue, options)) {
    return null;
  }

  const rule = getElectricLiquidCompressorTeamUsageAdjustmentRule();
  const deductionFactor = Number(rule?.deductionFactor);
  if (!Number.isFinite(deductionFactor)) {
    return null;
  }

  const sourceUsage = calculateEquipmentMonthlyUsage(rule.equipmentId, { monthValue });
  const rawDifference = sourceUsage?.difference;
  if (!Number.isFinite(rawDifference)) {
    return null;
  }

  return rawDifference * deductionFactor;
}

function getTeamMonthlyUsage(teamKey, options = {}) {
  const monthValue = options.monthValue || state.currentMonth;
  if (supportsDirectTeamMonthlyUsage(teamKey)) {
    return getDirectTeamMonthlyUsage(teamKey, monthValue);
  }

  const values = getTeamChargeEquipmentIdsExcludingSharedCompressor(teamKey, monthValue, options)
    .filter((equipmentId) => {
      if (options.excludeOtherEquipment !== true) {
        return true;
      }

      return !isOtherEquipment(getEquipmentItem(equipmentId));
    })
    .map((equipmentId) => calculateEquipmentMonthlyUsage(equipmentId).value)
    .filter((value) => value !== null);
  const sharedUsage = calculateTeamSharedCompressorSettlementUsage(teamKey, monthValue, options);

  if (Number.isFinite(sharedUsage)) {
    values.push(sharedUsage);
  }

  const liquidCompressorAdjustment = calculateElectricLiquidCompressorTeamUsageAdjustment(
    teamKey,
    monthValue,
    options
  );
  if (Number.isFinite(liquidCompressorAdjustment)) {
    values.push(-liquidCompressorAdjustment);
  }

  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0);
}
