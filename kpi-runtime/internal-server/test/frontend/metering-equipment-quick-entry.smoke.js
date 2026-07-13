import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createQuickEntryContext,
  equipmentQuickEntrySource,
  equipmentQuickEntryUiSource,
  findPopupFieldInput,
} from './support/metering-equipment-quick-entry-harness.js';

test('quick-entry popup hosts keep browser globals behind the metering adapter', () => {
  assert.doesNotMatch(equipmentQuickEntryUiSource, /\b(?:window\.|globalThis)\b/);
  assert.doesNotMatch(equipmentQuickEntrySource, /\b(?:window\.|globalThis)\b/);
  assert.match(equipmentQuickEntryUiSource, /KpiMeteringBrowserAdapter/);
  assert.match(equipmentQuickEntrySource, /KpiMeteringBrowserAdapter/);
});

test('quick-entry popup opens from the existing button and focuses the search input', () => {
  const { context, portalRoot, getHostStateActive } = createQuickEntryContext();

  context.toggleQuickEntryMenu();

  assert.equal(context.state.openQuickEntryMenu, true);
  assert.equal(context.state.openEquipmentAddMenu, false);
  assert.equal(context.state.openEquipmentManageKey, '');
  assert.equal(context.state.openEquipmentOrderMenu, false);
  assert.equal(context.elements.quickEntryMenu.parentNode, portalRoot);
  assert.equal(context.getQuickEntryPopupSearchInput().focusCalls, 1);
  assert.equal(context.elements.quickEntryCounterFraction.textContent, '2/3');
  assert.equal(getHostStateActive(), true);
});

test('quick-entry popup skipStateRefresh option prevents closed-menu state recursion', () => {
  const { context, getDirtyStateCalls, getActionStateCalls } = createQuickEntryContext();

  context.syncQuickEntryMenu({ skipStateRefresh: true });

  assert.equal(getDirtyStateCalls(), 0);
  assert.equal(getActionStateCalls(), 0);

  context.syncQuickEntryMenu();

  assert.equal(getDirtyStateCalls(), 1);
  assert.equal(getActionStateCalls(), 1);
});

test('quick-entry popup renders electric and gas equipment rows together', () => {
  const { context } = createQuickEntryContext();

  context.toggleQuickEntryMenu();

  const popupRows = context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-row]');

  assert.equal(popupRows.length, 3);
  assert.equal(context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-section]').length, 2);
  assert.equal(
    context
      .getQuickEntryPopupBody()
      .querySelectorAll('[data-quick-entry-popup-grid]')
      .map((node) => node.className)
      .every((className) => className.includes('is-dense-entry-grid')),
    true
  );
  assert.equal(
    context
      .getQuickEntryPopupBody()
      .querySelectorAll('[data-quick-entry-resource-count]')
      .map((node) => node.textContent)
      .join('|'),
    '1/2 입력|1/1 입력'
  );
  assert.equal(context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-previous]').length, 0);
  assert.equal(popupRows[0].children[0].children[1].textContent.includes('소수점'), true);
});

test('quick-entry popup prioritizes the active resource when duplicate equipment names match', () => {
  const { context } = createQuickEntryContext({
    activeResourceType: 'gas',
    resourceDatasets: {
      electric: {
        equipmentItems: [
          { id: 'electric-boiler', label: 'shared boiler', decimalDigits: 0 },
          { id: 'electric-admin', label: 'shared admin', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
      gas: {
        equipmentItems: [
          { id: 'gas-boiler', label: 'shared boiler', decimalDigits: 0 },
          { id: 'gas-admin', label: 'shared admin', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
    },
  });

  context.toggleQuickEntryMenu();
  const searchInput = context.getQuickEntryPopupSearchInput();
  searchInput.value = 'shared boiler';
  searchInput.dispatch('input');

  const popupRows = context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-row]');
  assert.equal(popupRows.length, 2);
  assert.equal(popupRows[0].dataset.resourceType, 'gas');
  assert.equal(popupRows[0].dataset.fieldKey, 'gas-boiler');

  let prevented = false;
  searchInput.dispatch('keydown', {
    key: 'Enter',
    preventDefault() {
      prevented = true;
    },
  });

  const gasInput = findPopupFieldInput(context, 'gas', 'gas-boiler');
  const electricInput = findPopupFieldInput(context, 'electric', 'electric-boiler');
  assert.equal(prevented, true);
  assert.equal(gasInput.focusCalls, 1);
  assert.equal(gasInput.selectCalls, 1);
  assert.equal(electricInput.focusCalls, 0);
});

test('quick-entry popup keeps nearest search matches when the query has extra equipment words', () => {
  const { context } = createQuickEntryContext({
    activeResourceType: 'gas',
    resourceDatasets: {
      electric: {
        equipmentItems: [
          { id: 'electric-boiler', label: '3톤 보일러', decimalDigits: 0 },
          { id: 'electric-admin', label: '관리동', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
      gas: {
        equipmentItems: [
          { id: 'gas-boiler', label: '3톤 보일러', decimalDigits: 0 },
          { id: 'gas-admin', label: '관리동', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
    },
  });

  context.toggleQuickEntryMenu();
  const searchInput = context.getQuickEntryPopupSearchInput();
  searchInput.value = '3톤 보일러 관리동';
  searchInput.dispatch('input');

  const popupRows = context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-row]');
  assert.equal(popupRows.length, 4);
  assert.equal(popupRows[0].dataset.resourceType, 'gas');
  assert.equal(popupRows[0].dataset.fieldKey, 'gas-boiler');
  assert.equal(popupRows[1].dataset.resourceType, 'gas');
  assert.equal(popupRows[1].dataset.fieldKey, 'gas-admin');
  assert.equal(context.getQuickEntryPopupEmptyState().classList.contains('is-hidden'), true);
});

test('quick-entry popup resource keywords keep nearest matches in that resource', () => {
  const { context } = createQuickEntryContext({
    activeResourceType: 'electric',
    resourceDatasets: {
      electric: {
        equipmentItems: [
          { id: 'electric-boiler', label: '3톤 보일러', decimalDigits: 0 },
          { id: 'electric-admin', label: '관리동', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
      gas: {
        equipmentItems: [
          { id: 'gas-boiler', label: '3톤 보일러', decimalDigits: 0 },
          { id: 'gas-admin', label: '관리동', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
    },
  });

  context.toggleQuickEntryMenu();
  const searchInput = context.getQuickEntryPopupSearchInput();
  searchInput.value = '가스 3톤보일러 관리동';
  searchInput.dispatch('input');

  const popupRows = context.getQuickEntryPopupBody().querySelectorAll('[data-quick-entry-popup-row]');
  assert.equal(popupRows.length, 2);
  assert.equal(
    popupRows.every((row) => row.dataset.resourceType === 'gas'),
    true
  );
  assert.equal(popupRows[0].dataset.fieldKey, 'gas-boiler');
  assert.equal(popupRows[1].dataset.fieldKey, 'gas-admin');
});

test('quick-entry popup Enter navigation stays inside the current resource section', () => {
  const { context } = createQuickEntryContext({
    activeResourceType: 'gas',
    resourceDatasets: {
      electric: {
        equipmentItems: [{ id: 'electric-boiler', label: 'shared boiler', decimalDigits: 0 }],
        equipmentEntries: {},
      },
      gas: {
        equipmentItems: [
          { id: 'gas-boiler', label: 'shared boiler', decimalDigits: 0 },
          { id: 'gas-admin', label: 'shared admin', decimalDigits: 0 },
        ],
        equipmentEntries: {},
      },
    },
  });

  context.toggleQuickEntryMenu();
  const gasBoilerInput = findPopupFieldInput(context, 'gas', 'gas-boiler');
  const gasAdminInput = findPopupFieldInput(context, 'gas', 'gas-admin');
  const electricInput = findPopupFieldInput(context, 'electric', 'electric-boiler');

  let prevented = false;
  context.handleQuickEntryPopupFieldKeydown({
    target: gasBoilerInput,
    key: 'Enter',
    preventDefault() {
      prevented = true;
    },
  });

  assert.equal(prevented, true);
  assert.equal(gasAdminInput.focusCalls, 1);
  assert.equal(gasAdminInput.selectCalls, 1);
  assert.equal(electricInput.focusCalls, 0);
});
