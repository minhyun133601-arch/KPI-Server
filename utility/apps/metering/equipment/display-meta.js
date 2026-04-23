function getAssignedTeamForEquipment(equipmentId) {
  return (
    getCurrentTeamGroups().find(
      (team) => (state.store.teamAssignments[team.key] || []).includes(equipmentId)
    ) ||
    null
  );
}

function inferEquipmentIconKey(label) {
  const normalizedLabel = normalizeText(label).toLowerCase();

  if (!normalizedLabel) {
    return "equipment";
  }

  if (normalizedLabel.includes("무효전력")) {
    return "power_reactive";
  }

  if (normalizedLabel.includes("유효전력")) {
    return "power_active";
  }

  if (normalizedLabel.includes("액상")) {
    return "liquid";
  }

  if (normalizedLabel.includes("관리동") || normalizedLabel.includes("카페")) {
    return "building";
  }

  if (normalizedLabel.includes("스틱") || normalizedLabel.includes("소포장")) {
    return "packaging";
  }

  if (normalizedLabel.includes("건물")) {
    return "drying";
  }

  return "equipment";
}

function getEquipmentIconKey(equipment) {
  if (!equipment) {
    return "equipment";
  }

  const assignedTeam = getAssignedTeamForEquipment(equipment.id);
  return assignedTeam?.iconKey || inferEquipmentIconKey(equipment.label);
}

function getEquipmentDisplayLabel(equipmentOrLabel) {
  const baseLabel = normalizeText(
    typeof equipmentOrLabel === "string" ? equipmentOrLabel : equipmentOrLabel?.label
  );
  if (!baseLabel) {
    return "";
  }

  return EQUIPMENT_DISPLAY_LABEL_OVERRIDES[normalizeEquipmentFactorLabel(baseLabel)] || baseLabel;
}

function getResourceDuplicateBadgeIconKeyForEquipment(
  equipmentOrLabel,
  resourceType = getCurrentResourceType()
) {
  const labelKey = normalizeEquipmentFactorLabel(
    typeof equipmentOrLabel === "string" ? equipmentOrLabel : equipmentOrLabel?.label
  );
  if (!labelKey || !isPlainObject(state?.store?.resourceDatasets)) {
    return "";
  }

  const otherResourceType = isGasResourceType(resourceType)
    ? RESOURCE_TYPES.ELECTRIC
    : RESOURCE_TYPES.GAS;
  const otherItems = getActiveResourceDataset(state.store, otherResourceType)?.equipmentItems;
  if (
    !Array.isArray(otherItems) ||
    !otherItems.some((item) => normalizeEquipmentFactorLabel(item?.label) === labelKey)
  ) {
    return "";
  }

  return isGasResourceType(resourceType) ? "resource_gas" : "resource_electric";
}
