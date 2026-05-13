import path from 'node:path';

import { config } from '../../../config.js';

export const LEGACY_PORTAL_MODULE_KEY = 'portal_data';

export const TEAM_01_01_KEY = 'team_01_01';
export const WASTE_BUKJEONG_TEAM_KEY = 'waste_bukjeong';
export const WASTE_YUSAN_TEAM_KEY = 'waste_yusan';

export const GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY = 'gas_bukjeong';
export const GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY = 'yusan_lng';
export const GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY = 'yusan_lpg';
export const WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY = 'waste_bukjeong';
export const WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY = 'waste_yusan';

export const BILLING_SCOPE_KEYS = Object.freeze([
  GAS_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
  GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LNG_KEY,
  GAS_BILLING_SETTLEMENT_SCOPE_YUSAN_LPG_KEY,
  WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
  WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY,
  'bukjeong',
  'yusan',
]);

export const GAS_DIRECT_LEGACY_TEAM_NAME = '1팀 1파트 (LNG)';
export const GAS_YUSAN_LNG_LEGACY_TEAM_NAMES = Object.freeze(['1팀 2파트 (LNG)', '3팀 (LNG)']);
export const GAS_YUSAN_LPG_LEGACY_TEAM_NAME = '1팀 2파트 (LPG)';
export const ELECTRIC_DIRECT_LEGACY_TEAM_NAME = '1팀 1파트';

export const WASTE_TEAM_CONFIG = Object.freeze({
  유산: Object.freeze({
    teamKey: WASTE_YUSAN_TEAM_KEY,
    scopeKey: WASTE_BILLING_SETTLEMENT_SCOPE_YUSAN_KEY,
    allowedCostKeys: Object.freeze(['water', 'share', 'sludge', 'resin', 'labor']),
  }),
  북정: Object.freeze({
    teamKey: WASTE_BUKJEONG_TEAM_KEY,
    scopeKey: WASTE_BILLING_SETTLEMENT_SCOPE_BUKJEONG_KEY,
    allowedCostKeys: Object.freeze(['water', 'share', 'sludge', 'resin', 'labor']),
  }),
});

export const backupDir = path.join(config.storageRoot, 'migration-backups');
