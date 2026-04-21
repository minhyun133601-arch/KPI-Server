import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const bukjeongCardSource = await fs.readFile(
  new URL(
    '../../../../02_★★★★_유틸리티/apps/metering/team-overview/bukjeong-card.js',
    import.meta.url
  ),
  'utf8'
);

function createBukjeongCardContext(options = {}) {
  let isElectric = options.isElectric !== false;
  let activeSelectionIds = new Set(options.activeSelectionIds ?? ['bukjeong_total']);

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
    BUKJEONG_POWER_TEAM_KEY: 'bukjeong_power',
    BUKJEONG_TOTAL_SELECTION_ID: 'bukjeong_total',
    TEAM_01_01_KEY: 'team_01_01',
    RESOURCE_TYPES: {
      ELECTRIC: 'electric',
    },
    state: {
      currentMonth: '2026-04',
    },
    isElectricResourceType() {
      return isElectric;
    },
    isTeamCalendarSelectionActive(_teamKey, selectionId) {
      return activeSelectionIds.has(selectionId);
    },
    getDirectTeamMonthlyUsage(teamKey) {
      if (teamKey === 'team_01_01') {
        return 40;
      }

      return null;
    },
    resolveBukjeongSettlementAmount() {
      return 200;
    },
    calculateUsageShare(usage, totalUsage) {
      if (!Number.isFinite(usage) || !Number.isFinite(totalUsage) || totalUsage === 0) {
        return null;
      }

      return usage / totalUsage;
    },
    formatUsageShare(value) {
      return `share:${Math.round(Number(value) * 100)}%`;
    },
    formatSettlementAmount(value) {
      return `amt:${Math.round(Number(value) || 0)}`;
    },
    formatWholeNumber(value) {
      return `whole:${Math.round(Number(value) || 0)}`;
    },
    formatDailyUsage(value) {
      return `usage:${Math.round(Number(value) || 0)}`;
    },
    getTeamGroup(teamKey) {
      return {
        key: teamKey,
        iconKey: 'power',
      };
    },
    getTeamContextDetailText(teamKey) {
      return `context:${teamKey}`;
    },
    __setActiveSelectionIds(nextIds = []) {
      activeSelectionIds = new Set(nextIds);
    },
    __setElectric(nextValue) {
      isElectric = Boolean(nextValue);
    },
  };

  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(bukjeongCardSource, context, {
    filename: 'team-overview/bukjeong-card.js',
  });
  return context;
}

test('bukjeong card returns usage and amount only for electric active selection', () => {
  const context = createBukjeongCardContext();

  assert.equal(context.getBukjeongTotalCardMonthlyUsage('2026-04'), 40);
  assert.equal(context.getBukjeongTotalCardAmountValue('2026-04'), 200);

  context.__setActiveSelectionIds([]);
  assert.equal(
    context.getBukjeongTotalCardMonthlyUsage('2026-04', { selectionOnly: true }),
    null
  );
  assert.equal(
    context.getBukjeongTotalCardAmountValue('2026-04', { selectionOnly: true }),
    null
  );

  context.__setElectric(false);
  assert.equal(context.getBukjeongTotalCardMonthlyUsage('2026-04'), null);
  assert.equal(context.getBukjeongTotalCardChargePool('2026-04'), null);
});

test('bukjeong card derives descriptor usage share and charge from direct usage', () => {
  const context = createBukjeongCardContext();
  const descriptor = {
    isDirectTeamUsage: true,
    teamKey: 'team_01_01',
    selectionId: 'bukjeong_total',
  };

  assert.equal(context.getBukjeongTotalCardDescriptorUsageValue(descriptor, '2026-04'), 40);
  assert.equal(context.getBukjeongTotalCardDescriptorUsageShare(descriptor, '2026-04'), 1);
  assert.equal(context.calculateBukjeongTotalCardDescriptorCharge(descriptor, '2026-04'), 200);
  assert.match(
    context.getBukjeongTotalCardDescriptorShareText(descriptor, '2026-04'),
    /share:100%/
  );
  assert.match(
    context.getBukjeongTotalCardDescriptorChargeText(descriptor, '2026-04'),
    /amt:200/
  );
});

test('bukjeong card detail text includes usage share and charge math', () => {
  const context = createBukjeongCardContext();
  const detailText = context.getBukjeongTotalCardDescriptorDetailText(
    {
      isDirectTeamUsage: true,
      teamKey: 'team_01_01',
      selectionId: 'bukjeong_total',
    },
    '2026-04'
  );

  assert.match(detailText, /whole:40/);
  assert.match(detailText, /share:100%/);
  assert.match(detailText, /amt:200/);
});

test('bukjeong card toggle descriptor exposes direct team usage metadata', () => {
  const context = createBukjeongCardContext();
  const [descriptor] = context.getBukjeongTotalCardToggleDescriptors('2026-04');

  assert.equal(descriptor.id, 'bukjeong_total');
  assert.equal(descriptor.selectionId, 'bukjeong_total');
  assert.equal(descriptor.teamKey, 'team_01_01');
  assert.equal(descriptor.sourceTeamKey, 'bukjeong_power');
  assert.equal(descriptor.isDirectTeamUsage, true);
  assert.equal(descriptor.iconKey, 'power');
  assert.equal(descriptor.usageText, 'usage:40');
  assert.match(descriptor.chargeText, /amt:200/);
  assert.equal(descriptor.detailText, 'context:bukjeong_power');
});
