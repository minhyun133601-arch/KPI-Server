const ELECTRIC_FINAL_TEAM_ALLOCATION_START_MONTH = "2026-04";
const ELECTRIC_FINAL_TEAM_ALLOCATION_TEAM_KEYS = Object.freeze([
  "team_01_02",
  "team_02",
  "team_03",
  "team_04",
]);
const ELECTRIC_FINAL_TEAM_ALLOCATION_SOURCE_IDS = Object.freeze({
  team_01_02: Object.freeze([
    "field_01",
    "field_02",
    "field_03",
    "field_04",
    "field_05",
    "field_06",
    "field_07",
    "field_08",
    "field_09",
  ]),
  team_02: Object.freeze(["field_12", "field_13"]),
  team_03: Object.freeze(["field_15", "field_16"]),
  team_04: Object.freeze(["field_17", "field_18", "field_19"]),
});
const ELECTRIC_FINAL_SHARED_COMPRESSOR_SOURCE_IDS = Object.freeze([
  "field_10",
  "field_11",
  "field_14",
  "field_custom_1777335768709_08f3az",
]);
const ELECTRIC_FINAL_LIQUID_COMPRESSOR_FIELD_ID = "field_custom_1777335768709_08f3az";
const ELECTRIC_FINAL_SHARED_COMPRESSOR_RATIOS = Object.freeze({
  team_01_02: 0.72,
  team_02: 0.28,
});

function shouldUseElectricFinalTeamAllocation(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  return Boolean(normalizedMonth) && normalizedMonth >= ELECTRIC_FINAL_TEAM_ALLOCATION_START_MONTH;
}

function normalizeElectricSnapshotNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeElectricFinalAllocationValue(value) {
  return Number.isFinite(value) ? Math.round(value * 1000000) / 1000000 : null;
}

function sumElectricSnapshotValues(values = []) {
  const finiteValues = values.map(normalizeElectricSnapshotNumber).filter(Number.isFinite);
  return finiteValues.length ? finiteValues.reduce((sum, value) => sum + value, 0) : null;
}

function calculateElectricFinalEquipmentUsage(equipmentId, monthValue) {
  if (!equipmentId || typeof calculateEquipmentMonthlyUsage !== "function") {
    return null;
  }

  const result = calculateEquipmentMonthlyUsage(equipmentId, { monthValue });
  return normalizeElectricSnapshotNumber(result?.value);
}

function calculateElectricFinalEquipmentUsageSum(equipmentIds = [], monthValue) {
  return sumElectricSnapshotValues(
    equipmentIds.map((equipmentId) => calculateElectricFinalEquipmentUsage(equipmentId, monthValue))
  );
}

function calculateElectricFinalTotalUsage(monthValue) {
  if (typeof calculateTotalPowerMonthlyUsageWindow !== "function") {
    return null;
  }

  return normalizeElectricSnapshotNumber(calculateTotalPowerMonthlyUsageWindow(monthValue)?.value);
}

function calculateElectricFinalBillingAmount(monthValue) {
  if (typeof getBillingSettlementNumericField !== "function") {
    return null;
  }

  const directAmount = normalizeElectricSnapshotNumber(
    getBillingSettlementNumericField("billing_amount", monthValue)
  );
  if (Number.isFinite(directAmount)) {
    return directAmount;
  }

  const electricityChargeTotal = normalizeElectricSnapshotNumber(
    getBillingSettlementNumericField("electricity_charge_total", monthValue)
  );
  if (!Number.isFinite(electricityChargeTotal)) {
    return null;
  }

  const additionalCharges = sumElectricSnapshotValues([
    getBillingSettlementNumericField("vat", monthValue),
    getBillingSettlementNumericField("electric_power_fund", monthValue),
    getBillingSettlementNumericField("tv_reception_fee", monthValue),
  ]) || 0;
  const roundingAdjustment = normalizeElectricSnapshotNumber(
    getBillingSettlementNumericField("rounding_adjustment", monthValue)
  ) || 0;

  return electricityChargeTotal + additionalCharges - roundingAdjustment;
}

function calculateElectricFinalFallbackTotalCost(monthValue) {
  if (typeof calculateTeamAmount !== "function") {
    return null;
  }

  return sumElectricSnapshotValues(
    ELECTRIC_FINAL_TEAM_ALLOCATION_TEAM_KEYS.map((teamKey) =>
      calculateTeamAmount(teamKey, monthValue, { selectionOnly: true })
    )
  );
}

function calculateElectricFinalTotalCost(monthValue) {
  return calculateElectricFinalBillingAmount(monthValue) ?? calculateElectricFinalFallbackTotalCost(monthValue);
}

function calculateElectricFinalDistributedCost(usage, totalUsage, totalCost) {
  if (
    !Number.isFinite(usage) ||
    !Number.isFinite(totalUsage) ||
    totalUsage <= 0 ||
    !Number.isFinite(totalCost)
  ) {
    return null;
  }

  return Math.round(totalCost * (usage / totalUsage));
}

function buildElectricFinalTeamAllocationSnapshot(monthValue) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!shouldUseElectricFinalTeamAllocation(normalizedMonth)) {
    return null;
  }

  const sharedCompressorUsage = calculateElectricFinalEquipmentUsageSum(
    ELECTRIC_FINAL_SHARED_COMPRESSOR_SOURCE_IDS,
    normalizedMonth
  );
  const team12CompressorUsage = Number.isFinite(sharedCompressorUsage)
    ? sharedCompressorUsage * ELECTRIC_FINAL_SHARED_COMPRESSOR_RATIOS.team_01_02
    : null;
  const team2CompressorUsage = Number.isFinite(sharedCompressorUsage)
    ? sharedCompressorUsage * ELECTRIC_FINAL_SHARED_COMPRESSOR_RATIOS.team_02
    : null;
  const liquidRawUsage = calculateElectricFinalEquipmentUsageSum(
    ELECTRIC_FINAL_TEAM_ALLOCATION_SOURCE_IDS.team_03,
    normalizedMonth
  );
  const liquidCompressorUsage = calculateElectricFinalEquipmentUsage(
    ELECTRIC_FINAL_LIQUID_COMPRESSOR_FIELD_ID,
    normalizedMonth
  );
  const liquidUsage = Number.isFinite(liquidRawUsage)
    ? liquidRawUsage - (Number.isFinite(liquidCompressorUsage) ? liquidCompressorUsage : 0)
    : null;

  const baseUsageByTeam = {
    team_01_02: calculateElectricFinalEquipmentUsageSum(
      ELECTRIC_FINAL_TEAM_ALLOCATION_SOURCE_IDS.team_01_02,
      normalizedMonth
    ),
    team_02: calculateElectricFinalEquipmentUsageSum(
      ELECTRIC_FINAL_TEAM_ALLOCATION_SOURCE_IDS.team_02,
      normalizedMonth
    ),
    team_03: liquidUsage,
    team_04: calculateElectricFinalEquipmentUsageSum(
      ELECTRIC_FINAL_TEAM_ALLOCATION_SOURCE_IDS.team_04,
      normalizedMonth
    ),
  };
  const usageByTeam = {
    team_01_02: sumElectricSnapshotValues([baseUsageByTeam.team_01_02, team12CompressorUsage]),
    team_02: sumElectricSnapshotValues([baseUsageByTeam.team_02, team2CompressorUsage]),
    team_03: baseUsageByTeam.team_03,
    team_04: baseUsageByTeam.team_04,
  };
  const groupedUsage = sumElectricSnapshotValues([
    baseUsageByTeam.team_01_02,
    team12CompressorUsage,
    baseUsageByTeam.team_02,
    team2CompressorUsage,
    baseUsageByTeam.team_03,
    baseUsageByTeam.team_04,
  ]);
  const totalUsage = calculateElectricFinalTotalUsage(normalizedMonth);
  const otherUsage =
    Number.isFinite(totalUsage) && Number.isFinite(groupedUsage)
      ? Math.max(totalUsage - groupedUsage, 0)
      : null;
  usageByTeam.team_04 = sumElectricSnapshotValues([usageByTeam.team_04, otherUsage]);

  if (!Object.values(usageByTeam).some(Number.isFinite)) {
    return null;
  }

  const totalCost = calculateElectricFinalTotalCost(normalizedMonth);
  const costBaseUsage =
    Number.isFinite(totalUsage) && totalUsage > 0
      ? totalUsage
      : sumElectricSnapshotValues(Object.values(usageByTeam));

  return Object.fromEntries(
    ELECTRIC_FINAL_TEAM_ALLOCATION_TEAM_KEYS.map((teamKey) => {
      const usage = normalizeElectricFinalAllocationValue(usageByTeam[teamKey]);
      return [
        teamKey,
        {
          usage,
          cost: calculateElectricFinalDistributedCost(usage, costBaseUsage, totalCost),
        },
      ];
    })
  );
}

function getElectricSnapshotTeamKeys(finalAllocations = null) {
  const keySet = new Set(ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS);
  if (finalAllocations && typeof finalAllocations === "object") {
    Object.keys(finalAllocations).forEach((teamKey) => keySet.add(teamKey));
  }
  return [...keySet];
}

function buildElectricSnapshotTeamEntry(teamKey, monthValue, finalAllocations = null) {
  const finalEntry = finalAllocations?.[teamKey] || null;
  const rawUsage = getTeamBoardMonthlyUsage(teamKey, {
    monthValue,
    selectionOnly: true,
  });
  const rawCost = calculateTeamAmount(teamKey, monthValue, {
    selectionOnly: true,
  });
  const hasFinalUsage = Number.isFinite(finalEntry?.usage);
  const hasFinalCost = Number.isFinite(finalEntry?.cost);
  const usage = hasFinalUsage ? finalEntry.usage : rawUsage;
  const cost = hasFinalCost ? finalEntry.cost : rawCost;

  return {
    usage: Number.isFinite(usage) ? (hasFinalUsage ? usage : Math.round(usage)) : null,
    cost: Number.isFinite(cost) ? Math.round(cost) : null,
  };
}

function buildElectricMonthlyTeamSnapshot(monthValue, store = state.store) {
  const normalizedMonth = normalizeMonthValue(monthValue);
  if (!normalizedMonth) {
    return null;
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.ELECTRIC,
    normalizedMonth,
    () => {
      state.currentMonth = normalizedMonth;
      const teams = {};
      const finalAllocations = buildElectricFinalTeamAllocationSnapshot(normalizedMonth);

      getElectricSnapshotTeamKeys(finalAllocations).forEach((teamKey) => {
        teams[teamKey] = buildElectricSnapshotTeamEntry(teamKey, normalizedMonth, finalAllocations);
      });

      return {
        monthValue: normalizedMonth,
        teams,
      };
    },
    store
  );
}

function buildElectricUtilityDatasetSnapshot(store = state.store) {
  const effectiveStore = resolveDetachedSnapshotSourceStore(store);
  const monthValues = collectElectricUtilitySnapshotMonthValues(effectiveStore);
  return buildElectricUtilityDatasetSnapshotForMonthValues(monthValues, effectiveStore);
}

function buildElectricUtilityDatasetSnapshotForMonths(monthValues = [], store = state.store) {
  const effectiveStore = resolveDetachedSnapshotSourceStore(store);
  const normalizedMonthValues = Array.from(
    new Set(
      (Array.isArray(monthValues) ? monthValues : [])
        .map((monthValue) => normalizeMonthValue(monthValue))
        .filter(Boolean)
    )
  ).sort((left, right) => left.localeCompare(right, "ko"));
  return buildElectricUtilityDatasetSnapshotForMonthValues(normalizedMonthValues, effectiveStore);
}

function buildElectricUtilityDatasetSnapshotForMonthValues(monthValues = [], effectiveStore = state.store) {
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.ELECTRIC,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        ELECTRIC_UTILITY_SNAPSHOT_TEAM_KEYS.map((teamKey) => [teamKey, {}])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        const finalAllocations = buildElectricFinalTeamAllocationSnapshot(monthValue);
        getElectricSnapshotTeamKeys(finalAllocations).forEach((teamKey) => {
          if (!teams[teamKey]) {
            teams[teamKey] = {};
          }
          teams[teamKey][monthValue] = buildElectricSnapshotTeamEntry(
            teamKey,
            monthValue,
            finalAllocations
          );
        });
      });

      return {
        months: monthValues,
        teams,
      };
    },
    effectiveStore
  );
}

function buildGasUtilityDatasetSnapshot(store = state.store) {
  const effectiveStore = resolveDetachedSnapshotSourceStore(store);
  const monthValues = collectGasUtilitySnapshotMonthValues(effectiveStore);
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.GAS,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        Object.values(GAS_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).map((teamName) => [teamName, {}])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        Object.entries(GAS_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).forEach(([teamKey, teamName]) => {
          const usage = getTeamBoardMonthlyUsage(teamKey, {
            monthValue,
            selectionOnly: true,
          });
          const rawCost = calculateGasUtilitySnapshotTeamCost(teamName, usage, monthValue);
          if (
            !hasStoredTeamMonthlyUsageOverride(teamKey, monthValue, RESOURCE_TYPES.GAS) &&
            !Number.isFinite(usage) &&
            !Number.isFinite(rawCost)
          ) {
            return;
          }

          teams[teamName][monthValue] = {
            usage: Number.isFinite(usage) ? Math.round(usage) : null,
            cost: Number.isFinite(rawCost) ? Math.round(rawCost) : null,
          };
        });
      });

      return {
        months: monthValues,
        teams,
      };
    },
    effectiveStore
  );
}

function buildWasteUtilityDatasetSnapshot(store = state.store) {
  const effectiveStore = resolveDetachedSnapshotSourceStore(store);
  const monthValues = collectWasteUtilitySnapshotMonthValues(effectiveStore);
  if (!monthValues.length) {
    return {
      months: [],
      teams: {},
    };
  }

  return withDetachedResourceSnapshot(
    RESOURCE_TYPES.WASTE,
    monthValues[0],
    () => {
      const teams = Object.fromEntries(
        Object.entries(WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).map(([teamKey, teamName]) => [
          teamName,
          {},
        ])
      );

      monthValues.forEach((monthValue) => {
        state.currentMonth = monthValue;
        Object.entries(WASTE_UTILITY_SNAPSHOT_TEAM_NAMES_BY_KEY).forEach(([teamKey, teamName]) => {
          const usage = getDirectTeamMonthlyUsage(teamKey, monthValue, RESOURCE_TYPES.WASTE);
          const scopeKey = getWasteBillingSettlementScopeKeyForTeam(teamKey);
          const entryFields = getBillingSettlementEntry(monthValue, scopeKey)?.fields || {};
          const totalCost = calculateBillingSettlementBillingAmountValue(entryFields, scopeKey);
          const costs = buildWasteUtilitySnapshotCosts(entryFields, scopeKey);
          if (!Number.isFinite(usage) && !Number.isFinite(totalCost) && !costs) {
            return;
          }

          teams[teamName][monthValue] = {
            usage: Number.isFinite(usage) ? Math.round(usage) : null,
            cost: Number.isFinite(totalCost) ? Math.round(totalCost) : null,
            costs,
          };
        });
      });

      return {
        months: monthValues,
        teams,
      };
    },
    effectiveStore
  );
}


