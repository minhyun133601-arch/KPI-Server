import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { resolveMeteringBundleSourceUrl } from '../../src/lib/metering-bundle-draft.js';

const equipmentRenderSource = await fs.readFile(
  resolveMeteringBundleSourceUrl('equipment/render.js'),
  'utf8'
);

function createClassList(initialNames = []) {
  const names = new Set(initialNames);
  return {
    add(...nextNames) {
      nextNames.forEach((name) => names.add(String(name)));
    },
    remove(...nextNames) {
      nextNames.forEach((name) => names.delete(String(name)));
    },
    toggle(name, force) {
      if (force === undefined) {
        if (names.has(name)) {
          names.delete(name);
          return false;
        }

        names.add(name);
        return true;
      }

      if (force) {
        names.add(name);
        return true;
      }

      names.delete(name);
      return false;
    },
    contains(name) {
      return names.has(name);
    },
  };
}

function createFieldCard(fieldKey) {
  return {
    dataset: {
      fieldKey,
    },
    classList: createClassList(),
  };
}

test('equipment render reuses existing field cards when the visible structure is unchanged', () => {
  const calls = {
    clearEquipmentFieldCardDropState: 0,
    syncEquipmentOrderMenu: 0,
    renderEquipmentItemCount: 0,
  };
  const cards = [createFieldCard('eq_01'), createFieldCard('eq_02')];
  const fieldsGrid = {
    dataset: {},
    classList: createClassList(),
    innerHtmlWrites: 0,
    _innerHTML: '',
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(value) {
      this.innerHtmlWrites += 1;
      this._innerHTML = value;
    },
    querySelectorAll(selector) {
      if (selector === '.field-card[data-field-key]' || selector === '.field-card') {
        return cards;
      }

      return [];
    },
  };
  const context = {
    console,
    Array,
    Boolean,
    Math,
    Number,
    Object,
    Set,
    String,
    state: {
      currentMonth: '2026-04',
      openEquipmentManageKey: '',
      openEquipmentOrderMenu: false,
      selectedEquipmentKeys: [],
      store: {
        equipmentItems: [{ id: 'eq_01' }, { id: 'eq_02' }],
      },
    },
    elements: {
      fieldsGrid,
      equipmentOrderHead: null,
      equipmentOrderList: null,
    },
    MODES: {
      EQUIPMENT: 'equipment',
    },
    clearEquipmentFieldCardDropState() {
      calls.clearEquipmentFieldCardDropState += 1;
    },
    supportsEquipmentEditingForCurrentResource() {
      return false;
    },
    getSelectedEquipmentIds() {
      return [];
    },
    getCurrentMode() {
      return 'equipment';
    },
    getCurrentResourceType() {
      return 'electric';
    },
    isHiddenEquipmentFieldCard() {
      return false;
    },
    getEquipmentDisplayLabel(field) {
      return field.label || field.id;
    },
    getEquipmentIconKey() {
      return 'equipment';
    },
    getResourceDuplicateBadgeIconKeyForEquipment() {
      return '';
    },
    isAutoCalculatedEquipment(field) {
      return Boolean(field.autoCalculated);
    },
    isTotalPowerSummaryEquipment() {
      return false;
    },
    isReactiveSummaryEquipment() {
      return false;
    },
    isEquipmentUsageShareTarget() {
      return false;
    },
    isUsageCalculationExcludedEquipment() {
      return false;
    },
    canManageEquipmentDecimalDigits() {
      return false;
    },
    syncEquipmentOrderMenu() {
      calls.syncEquipmentOrderMenu += 1;
    },
    renderEquipmentItemCount() {
      calls.renderEquipmentItemCount += 1;
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(equipmentRenderSource, context, {
    filename: 'equipment/render.js',
  });

  fieldsGrid.dataset.equipmentRenderSignature = context.getEquipmentFieldRenderSignature(
    context.state.store.equipmentItems,
    {
      canEditEquipment: false,
      canDirectReorder: false,
    }
  );
  const renderResult = context.renderEquipmentFieldInputs({
    reuseExisting: true,
    deferDynamicSync: true,
  });

  assert.equal(renderResult.reused, true);
  assert.equal(renderResult.empty, false);
  assert.equal(fieldsGrid.innerHtmlWrites, 0);
  assert.equal(calls.clearEquipmentFieldCardDropState, 1);
  assert.equal(calls.syncEquipmentOrderMenu, 1);
  assert.equal(calls.renderEquipmentItemCount, 1);
});

test('equipment render refuses reuse when the static render signature changed', () => {
  const fieldsGrid = {
    dataset: {
      equipmentRenderSignature: 'stale-signature',
    },
    classList: createClassList(),
    querySelectorAll() {
      return [createFieldCard('eq_01')];
    },
  };
  const context = {
    console,
    Array,
    Boolean,
    Math,
    Number,
    Object,
    Set,
    String,
    state: {
      currentMonth: '2026-04',
      store: {
        equipmentItems: [{ id: 'eq_01', label: 'Pump' }],
      },
    },
    elements: {
      fieldsGrid,
    },
    getCurrentMode() {
      return 'equipment';
    },
    getCurrentResourceType() {
      return 'electric';
    },
    getEquipmentDisplayLabel(field) {
      return field.label || field.id;
    },
    getEquipmentIconKey() {
      return 'equipment';
    },
    getResourceDuplicateBadgeIconKeyForEquipment() {
      return '';
    },
    isAutoCalculatedEquipment() {
      return false;
    },
    isTotalPowerSummaryEquipment() {
      return false;
    },
    isReactiveSummaryEquipment() {
      return false;
    },
    isEquipmentUsageShareTarget() {
      return false;
    },
    isUsageCalculationExcludedEquipment() {
      return false;
    },
    canManageEquipmentDecimalDigits() {
      return false;
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(equipmentRenderSource, context, {
    filename: 'equipment/render.js',
  });

  const nextSignature = context.getEquipmentFieldRenderSignature(
    context.state.store.equipmentItems,
    {
      canEditEquipment: false,
      canDirectReorder: false,
    }
  );

  assert.equal(
    context.canReuseRenderedEquipmentFieldInputs(context.state.store.equipmentItems, nextSignature),
    false
  );
});
