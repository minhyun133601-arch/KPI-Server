import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createDailyCurrentInput,
} from './support/utility-entry-experiment-harness.js';

test('utility entry corrected readings include shared compressor allocation and liquid correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = { equipmentItems: [], equipmentEntries: {} };
  const options = { beforeCorrection: false };
  const previousValues = {
    field_01: '100',
    field_10: '10',
    field_11: '20',
    [ids.liquidCompressorId]: '30',
    [ids.compressorFieldId]: '40',
    [ids.liquidFieldId]: '200',
    [ids.liquid2FieldId]: '50',
  };
  const currentValues = {
    field_01: '110',
    field_10: '15',
    field_11: '25',
    [ids.liquidCompressorId]: '35',
    [ids.compressorFieldId]: '45',
    [ids.liquidFieldId]: '230',
    [ids.liquid2FieldId]: '55',
  };
  const monthValue = '2026-04';

  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.team1SharedCompressorId,
      '2026-04-02',
      previousValues,
      'electric',
      monthValue,
      options
    ),
    72
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.team2SharedCompressorId,
      '2026-04-03',
      currentValues,
      'electric',
      monthValue,
      options
    ),
    33.6
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      currentValues,
      'electric',
      monthValue,
      options
    ),
    185
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '1팀 2파트',
      ['field_01'],
      '2026-04-02',
      previousValues,
      'electric',
      options
    ),
    172
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '3팀',
      [ids.liquidFieldId, ids.liquid2FieldId],
      '2026-04-03',
      currentValues,
      'electric',
      options
    ),
    240
  );
  assert.equal(
    api.calculateElectricGroupSharedReading(
      dataset,
      monthValue,
      '3팀',
      [ids.liquidFieldId, ids.liquid2FieldId],
      '2026-04-03',
      { ...currentValues, [ids.liquid2FieldId]: '' },
      'electric',
      options
    ),
    null
  );
});

test('utility entry liquid correction reading uses electric usage factors', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [
      { id: ids.liquidFieldId, factor: '2' },
      { id: ids.liquidCompressorId, factor: '3' },
      { id: ids.compressorFieldId, factor: '4' },
    ],
    equipmentEntries: {},
  };
  const values = {
    [ids.liquidFieldId]: '230',
    [ids.liquidCompressorId]: '10',
    [ids.compressorFieldId]: '5',
  };

  assert.equal(
    api.calculateEquipmentSummaryReading(dataset, ids.liquidFieldId, '2026-04-03', values, 'electric', '2026-04', {
      beforeCorrection: false,
    }),
    220
  );
});

test('utility entry corrected view applies liquid correction to visible source rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = { equipmentItems: [], equipmentEntries: {} };
  const options = { beforeCorrection: false };
  const values = {
    field_10: '15',
    field_11: '25',
    [ids.liquidCompressorId]: '35',
    [ids.compressorFieldId]: '45',
    [ids.liquidFieldId]: '230',
    [ids.liquid2FieldId]: '55',
  };
  const resolveUsage = (_sourceDataset, sourceId) =>
    ({
      field_10: 5,
      field_11: 7,
      [ids.liquidCompressorId]: 11,
      [ids.compressorFieldId]: 13,
      [ids.liquidFieldId]: 40,
      [ids.liquid2FieldId]: 6,
    })[sourceId] ?? null;

  assert.equal(
    api.calculateDailyRowReading(dataset, ids.liquidFieldId, '2026-04-03', values, 'electric', '2026-04', options),
    185
  );
  assert.equal(
    api.calculateEquipmentSummaryReading(
      dataset,
      ids.liquidFieldId,
      '2026-04-03',
      values,
      'electric',
      '2026-04',
      options
    ),
    185
  );
  assert.equal(api.calculateDailyRowUsage(dataset, ids.liquidFieldId, resolveUsage, '2026-04', options), 27);
});

test('utility entry other usage uses the total-power window and waits for missing compressor values', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [
      { id: 'field_01', factor: '1' },
      { id: 'field_10', factor: '1' },
      { id: 'field_11', factor: '1' },
      { id: ids.compressorFieldId, factor: '1' },
      { id: ids.liquidCompressorId, factor: '1' },
      { id: ids.liquidFieldId, factor: '1' },
      { id: ids.liquid2FieldId, factor: '1' },
    ],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '10',
        field_10: '5',
        field_11: '7',
        [ids.compressorFieldId]: '20',
        [ids.liquidCompressorId]: '30',
        [ids.liquidFieldId]: '1000',
        [ids.liquid2FieldId]: '50',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '12',
        field_10: '6',
        field_11: '8',
        [ids.compressorFieldId]: '23',
        [ids.liquidCompressorId]: '34',
        [ids.liquidFieldId]: '1010',
        [ids.liquid2FieldId]: '52',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(dataset, ids.otherFieldId, '2026-05-29', 'electric', {
      beforeCorrection: false,
    }),
    5380
  );

  const missingCompressorDataset = {
    ...dataset,
    equipmentEntries: {
      ...dataset.equipmentEntries,
      '2026-05-29': {
        ...dataset.equipmentEntries['2026-05-29'],
        [ids.compressorFieldId]: '',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(missingCompressorDataset, ids.otherFieldId, '2026-05-29', 'electric', {
      beforeCorrection: false,
    }),
    null
  );
});

test('utility entry other usage clamps negative residual usage to zero', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const dataset = {
    equipmentItems: [{ id: 'field_01', factor: '1' }],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '0',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '6000',
      },
    },
  };

  assert.equal(
    api.calculateEquipmentPeriodUsage(dataset, ids.otherFieldId, '2026-05-29', 'electric', {
      beforeCorrection: false,
    }),
    0
  );
});

test('utility entry other row shows only usage and fixes readings to dashes', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const previousInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const currentInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const usageInput = createDailyCurrentInput({ entryMode: 'calculated', saveKind: '' });
  const row = {
    dataset: { utilityEntryExperimentRowFieldId: ids.otherFieldId },
    hidden: false,
    querySelectorAll(selector) {
      if (selector === '.utility-entry-experiment-input') {
        return [previousInput, currentInput, usageInput];
      }
      return [];
    },
  };
  const host = {
    dataset: { utilityEntryExperimentCorrectionMode: 'corrected' },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('[data-utility-entry-experiment-row-field-id]')) return [row];
      if (selector.includes('utility-entry-experiment-input')) {
        return [previousInput, currentInput, usageInput];
      }
      return [];
    },
  };
  const dataset = {
    equipmentItems: [{ id: 'field_01', factor: '1' }],
    equipmentEntries: {
      '2026-05-28': {
        field_21: '100',
        field_22: '200',
        field_23: '300',
        field_01: '10',
      },
      '2026-05-29': {
        field_21: '101',
        field_22: '201',
        field_23: '301',
        field_01: '12',
      },
    },
  };

  api.populateDailyResource(host, dataset, 'electric', '2026-05-29');

  assert.equal(previousInput.value, '-');
  assert.equal(currentInput.value, '-');
  assert.equal(usageInput.value, '5,398');
});

test('utility entry corrected shared compressor readings display at most two decimal places', () => {
  const api = createCorrectionContext();
  const ids = api.constants;

  assert.equal(
    api.getEquipmentSummaryReadingDisplayValue(ids.team1SharedCompressorId, 88.88832, { beforeCorrection: false }),
    88.89
  );
  assert.equal(
    api.getEquipmentSummaryReadingDisplayValue(ids.team2SharedCompressorId, 34.56789, { beforeCorrection: false }),
    34.57
  );
  assert.equal(api.getEquipmentSummaryReadingDisplayValue('field_01', 12.34567, { beforeCorrection: false }), 12.34567);
});
