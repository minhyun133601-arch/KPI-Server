import fs from 'node:fs/promises';
import vm from 'node:vm';

import { resolveMeteringBundleSourceUrl } from '../../../src/lib/metering-bundle-draft.js';

const billingSettlementCalculationsSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('billing/settlement-calculations.js'),
  'utf8'
);
const billingSettlementSource = await fs.readFile(resolveMeteringBundleSourceUrl('billing/settlement.js'), 'utf8');
const billingSettlementRecordsSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('billing/settlement-records.js'),
  'utf8'
);

export function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

export function formatLocaleNumber(value, options = {}) {
  return Number(value).toLocaleString('en-US', options);
}

export function createBillingSettlementEntries(options = {}, currentMonth = '2026-04') {
  if (Object.prototype.hasOwnProperty.call(options, 'billingSettlementEntries')) {
    return options.billingSettlementEntries || {};
  }

  if (options.entry == null) {
    return {};
  }

  return {
    [currentMonth]: options.entry,
  };
}

export function createBillingSettlementContext(options = {}) {
  const resourceType = options.resourceType || 'electric';
  const usageBaseValue = Object.prototype.hasOwnProperty.call(options, 'usageBaseValue') ? options.usageBaseValue : 10;
  const currentScopeKey = options.currentScopeKey || 'default';
  const currentMonth = options.currentMonth || '2026-04';
  const billingSettlementEntries = createBillingSettlementEntries(options, currentMonth);
  const billingSettlementFieldKeys = new Set([
    'base_charge',
    'power_charge',
    'vat',
    'electric_power_fund',
    'tv_reception_fee',
    'rounding_adjustment',
    'electricity_charge_total',
    'calorific_value',
    'billed_quantity_mj',
    'unit_price',
    'billing_amount',
    'usage_fee',
    'discount',
    'water',
    'share',
    'sludge',
    'resin',
    'labor',
    'outsourcing',
    'waste_per_production_ton',
  ]);

  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    RegExp,
    Promise,
    DEFAULT_BILLING_SETTLEMENT_SCOPE_KEY: 'default',
    BILLING_SETTLEMENT_SCOPE_KEYS: ['default', 'bukjeong', 'gas_lpg'],
    BILLING_SETTLEMENT_FIELD_KEYS: billingSettlementFieldKeys,
    RESOURCE_TYPES: {
      ELECTRIC: 'electric',
      GAS: 'gas',
      WASTE: 'waste',
    },
    BILLING_SETTLEMENT_TOTAL_COMPONENTS: [
      { key: 'base_charge', sign: 1 },
      { key: 'energy_charge', sign: 1 },
      { key: 'fuel_adjustment', sign: 1 },
    ],
    GAS_LPG_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS: [
      { key: 'power_charge', sign: 1 },
      { key: 'vat', sign: 1 },
    ],
    GAS_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS: [
      { key: 'power_charge', sign: 1 },
      { key: 'vat', sign: 1 },
      { key: 'rounding_adjustment', sign: -1 },
    ],
    ELECTRIC_BILLING_SETTLEMENT_BILLING_AMOUNT_COMPONENTS: [
      { key: 'electricity_charge_total', sign: 1 },
      { key: 'vat', sign: 1 },
      { key: 'electric_power_fund', sign: 1 },
      { key: 'tv_reception_fee', sign: 1 },
      { key: 'rounding_adjustment', sign: -1 },
    ],
    state: {
      currentMonth,
      store: {
        billingSettlementEntries: billingSettlementEntries,
      },
    },
    isPlainObject(value) {
      return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    },
    normalizeText(value) {
      return String(value ?? '').trim();
    },
    normalizeMonthValue(value) {
      const normalizedValue = String(value ?? '').trim();
      return /^\d{4}-\d{2}$/.test(normalizedValue) ? normalizedValue : '';
    },
    countPlainObjectKeys(value) {
      return context.isPlainObject(value) ? Object.keys(value).length : 0;
    },
    getCurrentResourceType() {
      return resourceType;
    },
    getCurrentBillingSettlementScope() {
      return currentScopeKey;
    },
    normalizeBillingSettlementScope(scopeKey, fallbackScope = currentScopeKey) {
      const normalizedScopeKey = String(scopeKey ?? '').trim();
      return normalizedScopeKey || fallbackScope;
    },
    normalizeResourceType(value) {
      const normalizedValue = String(value ?? '').trim();
      return normalizedValue || resourceType;
    },
    isGasBillingSettlementScope(scopeKey) {
      return scopeKey === 'gas_lpg' || options.resourceTypeByScope?.[scopeKey] === 'gas';
    },
    isWasteBillingSettlementScope(scopeKey) {
      return options.resourceTypeByScope?.[scopeKey] === 'waste';
    },
    isGasLpgBillingSettlementScope(scopeKey) {
      return scopeKey === 'gas_lpg';
    },
    isGasLpgConversionBillingSettlementScope(scopeKey) {
      return scopeKey === 'gas_lpg_conversion';
    },
    GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY: 'bukjeong',
    GAS_SETTLEMENT_SCOPE_TEAM_KEYS: options.gasSettlementScopeTeamKeys || {
      default: ['gas_team'],
    },
    TEAM_01_01_KEY: 'team_01_01',
    getDirectTeamMonthlyUsage(teamKey, monthValue = currentMonth, nextResourceType = resourceType) {
      const key = `${teamKey}:${monthValue}:${nextResourceType}`;
      if (options.directTeamUsageMap && Object.prototype.hasOwnProperty.call(options.directTeamUsageMap, key)) {
        return options.directTeamUsageMap[key];
      }

      return usageBaseValue;
    },
    getTeamBoardMonthlyUsage(teamKey, { monthValue = currentMonth } = {}) {
      const key = `${teamKey}:${monthValue}`;
      if (
        options.teamBoardMonthlyUsageMap &&
        Object.prototype.hasOwnProperty.call(options.teamBoardMonthlyUsageMap, key)
      ) {
        return options.teamBoardMonthlyUsageMap[key];
      }

      return teamKey === 'gas_team' ? usageBaseValue : null;
    },
    calculateWasteSettlementScopeMonthlyUsage(scopeKey, monthValue = currentMonth) {
      const key = `${scopeKey}:${monthValue}`;
      if (options.wasteUsageBaseValueMap && Object.prototype.hasOwnProperty.call(options.wasteUsageBaseValueMap, key)) {
        return options.wasteUsageBaseValueMap[key];
      }

      return Object.prototype.hasOwnProperty.call(options, 'wasteUsageBaseValue')
        ? options.wasteUsageBaseValue
        : usageBaseValue;
    },
    calculateTotalPowerMonthlyUsageWindow() {
      return {
        value: Object.prototype.hasOwnProperty.call(options, 'totalPowerMonthlyUsageWindowValue')
          ? options.totalPowerMonthlyUsageWindowValue
          : usageBaseValue,
      };
    },
    roundCalculatedUsage(value) {
      return Math.round(value);
    },
    formatFixedDecimalNumber(value, digits) {
      return formatLocaleNumber(value, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    },
    formatNumber(value) {
      return formatLocaleNumber(value, {
        maximumFractionDigits: 3,
      });
    },
    formatWholeNumber(value) {
      return formatLocaleNumber(Math.round(value), {
        maximumFractionDigits: 0,
      });
    },
    getBillingSettlementFields(nextResourceType = resourceType, scopeKey = currentScopeKey) {
      if (options.fields) {
        return options.fields;
      }

      if (nextResourceType === 'gas' && scopeKey === 'gas_lpg') {
        return [{ key: 'power_charge' }, { key: 'vat' }, { key: 'unit_price' }, { key: 'billing_amount' }];
      }

      if (nextResourceType === 'gas' && scopeKey !== 'gas_lpg') {
        return [
          { key: 'power_charge' },
          { key: 'vat' },
          { key: 'rounding_adjustment' },
          { key: 'calorific_value' },
          { key: 'billed_quantity_mj' },
          { key: 'unit_price' },
          { key: 'billing_amount' },
        ];
      }

      if (nextResourceType === 'electric') {
        return [
          { key: 'base_charge' },
          { key: 'vat' },
          { key: 'electric_power_fund' },
          { key: 'tv_reception_fee' },
          { key: 'rounding_adjustment' },
          { key: 'electricity_charge_total' },
          { key: 'unit_price' },
          { key: 'billing_amount' },
        ];
      }

      return [{ key: 'usage_fee' }, { key: 'discount' }, { key: 'unit_price' }, { key: 'billing_amount' }];
    },
    getBillingSettlementAutoCalculatedFieldKeySet(nextResourceType = resourceType, scopeKey = currentScopeKey) {
      if (options.autoCalculatedFieldKeys) {
        return new Set(options.autoCalculatedFieldKeys);
      }

      if (nextResourceType === 'gas' && scopeKey === 'gas_lpg') {
        return new Set(['unit_price', 'billing_amount']);
      }

      if (nextResourceType === 'gas' && scopeKey !== 'gas_lpg') {
        return new Set(['billed_quantity_mj', 'unit_price', 'billing_amount']);
      }

      if (nextResourceType === 'electric') {
        return new Set(['electricity_charge_total', 'unit_price', 'billing_amount']);
      }

      return new Set(['billing_amount', 'unit_price', 'waste_per_production_ton']);
    },
    getBillingSettlementZeroDefaultFieldKeys(nextResourceType = resourceType, scopeKey = currentScopeKey) {
      if (options.zeroDefaultFieldKeys) {
        return [...options.zeroDefaultFieldKeys];
      }

      if (nextResourceType === 'gas' && scopeKey !== 'gas_lpg') {
        return ['vat'];
      }

      if (nextResourceType === 'electric') {
        return ['vat', 'electric_power_fund', 'tv_reception_fee', 'rounding_adjustment'];
      }

      return [];
    },
    getBillingSettlementManualFieldKeys(nextResourceType = resourceType, scopeKey = currentScopeKey) {
      if (options.manualFieldKeys) {
        return [...options.manualFieldKeys];
      }

      if (nextResourceType === 'gas' && scopeKey === 'gas_lpg') {
        return ['power_charge', 'vat'];
      }

      if (nextResourceType === 'gas' && scopeKey !== 'gas_lpg') {
        return ['power_charge', 'calorific_value', 'vat'];
      }

      return ['usage_fee'];
    },
    getWasteBillingSettlementBillingAmountComponents() {
      if (options.wasteBillingAmountComponents) {
        return options.wasteBillingAmountComponents;
      }

      return [
        { key: 'usage_fee', sign: 1 },
        { key: 'discount', sign: -1 },
      ];
    },
    getUtilDailyProductionValue(teamName, year, month) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const key = `${teamName}:${monthKey}`;
      if (options.productionValueMap && Object.prototype.hasOwnProperty.call(options.productionValueMap, key)) {
        return { value: options.productionValueMap[key] };
      }

      return null;
    },
    buildWasteBillingSettlementFallbackEntry(monthValue, scopeKey) {
      return {
        monthValue,
        scopeKey,
        fields: {},
        completed: false,
        updatedAt: '',
      };
    },
  };

  context.KpiMeteringBrowserAdapter = {
    getGlobal(name) {
      return context[name];
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(billingSettlementCalculationsSource, context, {
    filename: 'billing/settlement-calculations.js',
  });
  vm.runInContext(billingSettlementSource, context, {
    filename: 'billing/settlement.js',
  });
  vm.runInContext(billingSettlementRecordsSource, context, {
    filename: 'billing/settlement-records.js',
  });

  return { context };
}
