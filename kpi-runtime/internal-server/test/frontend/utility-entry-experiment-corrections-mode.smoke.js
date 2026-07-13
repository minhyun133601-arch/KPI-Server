import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createDailyCurrentInput,
  createCorrectionModeButton,
  createCorrectionModeHost,
  createDailyGroupRow,
  createDailyCurrentHost,
} from './support/utility-entry-experiment-harness.js';

test('utility entry correction source current values lock in corrected views and unlock before correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const options = { beforeCorrection: false };

  ['field_10', 'field_11', ids.compressorFieldId, ids.liquidCompressorId, ids.liquidFieldId].forEach((fieldId) => {
    assert.equal(api.isCorrectionLockedDailyField('electric', fieldId, '2026-04', options), true);
    assert.equal(
      api.isCorrectionLockedDailyField('electric', fieldId, '2026-04', {
        beforeCorrection: true,
      }),
      false
    );
  });
  assert.equal(api.isCorrectionLockedDailyField('electric', ids.liquid2FieldId, '2026-04', options), false);
  assert.equal(api.isCorrectionLockedDailyField('electric', ids.sharedCompressorId, '2026-04', options), true);
  assert.equal(
    api.isCorrectionLockedDailyField('electric', ids.team1SharedCompressorId, '2026-04', {
      correctionMode: 'before',
    }),
    true
  );
  assert.equal(api.isCorrectionLockedDailyField('gas', ids.liquidFieldId, '2026-04', options), false);
});

test('utility entry correction source inputs lock in corrected view and unlock before correction', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const liquidInput = createDailyCurrentInput({ fieldId: ids.liquidFieldId });
  const liquid2Input = createDailyCurrentInput({
    fieldId: ids.liquid2FieldId,
    readOnly: true,
  });
  liquid2Input.dataset.utilityEntryExperimentCorrectionManaged = 'true';
  liquid2Input.dataset.utilityEntryExperimentCorrectionLocked = 'true';
  const compressorSourceInputs = ['field_10', 'field_11', ids.compressorFieldId, ids.liquidCompressorId].map(
    (fieldId) => createDailyCurrentInput({ fieldId })
  );
  const calculatedSourceInput = createDailyCurrentInput({
    entryMode: 'calculated',
    saveKind: '',
    fieldId: '',
    readOnly: true,
    ariaLabel: '1팀 2파트 컴프레셔 현재값',
  });
  const normalInput = createDailyCurrentInput({ fieldId: 'field_01' });
  const staleNormalInput = createDailyCurrentInput({
    fieldId: 'field_02',
    readOnly: true,
  });
  const gasInput = createDailyCurrentInput({
    resourceType: 'gas',
    fieldId: 'gas_field_03',
  });
  const host = createDailyCurrentHost([
    liquidInput,
    liquid2Input,
    ...compressorSourceInputs,
    calculatedSourceInput,
    normalInput,
    staleNormalInput,
    gasInput,
  ]);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', { beforeCorrection: false });

  assert.equal(liquidInput.readOnly, true);
  assert.equal(liquidInput.getAttribute('aria-readonly'), 'true');
  assert.equal(liquidInput.classList.contains('is-correction-locked'), true);
  assert.equal(liquid2Input.readOnly, false);
  assert.equal(liquid2Input.classList.contains('is-correction-locked'), false);
  assert.equal(liquid2Input.dataset.utilityEntryExperimentCorrectionManaged, undefined);
  compressorSourceInputs.forEach((input) => {
    assert.equal(input.readOnly, true);
    assert.equal(input.classList.contains('is-correction-locked'), true);
  });
  assert.equal(calculatedSourceInput.readOnly, true);
  assert.equal(calculatedSourceInput.classList.contains('is-correction-locked'), true);
  assert.equal(normalInput.readOnly, false);
  assert.equal(staleNormalInput.readOnly, true);
  assert.equal(gasInput.readOnly, false);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
    editUnlocked: true,
  });

  assert.equal(liquidInput.readOnly, false);
  assert.equal(liquidInput.getAttribute('aria-readonly'), null);
  assert.equal(liquidInput.classList.contains('is-correction-locked'), false);
  assert.equal(liquidInput.dataset.entryMode, 'manual');
  assert.equal(liquidInput.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  assert.equal(liquid2Input.readOnly, false);
  assert.equal(liquid2Input.dataset.entryMode, 'manual');
  assert.equal(liquid2Input.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  compressorSourceInputs.forEach((input) => {
    assert.equal(input.readOnly, false);
    assert.equal(input.dataset.entryMode, 'manual');
    assert.equal(input.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  });
  assert.equal(staleNormalInput.readOnly, false);
  assert.equal(staleNormalInput.dataset.entryMode, 'manual');
  assert.equal(staleNormalInput.dataset.utilityEntryExperimentSaveKind, 'daily-current');
  assert.equal(calculatedSourceInput.readOnly, true);
  assert.equal(calculatedSourceInput.dataset.entryMode, 'calculated');
  assert.equal(calculatedSourceInput.dataset.utilityEntryExperimentSaveKind, '');
  assert.equal(calculatedSourceInput.dataset.utilityEntryExperimentFieldId, ids.team1SharedCompressorId);
});

test('utility entry gas refresh does not relock before-correction electric source inputs', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const electricSourceInput = createDailyCurrentInput({
    fieldId: ids.liquidFieldId,
    readOnly: true,
  });
  electricSourceInput.dataset.utilityEntryExperimentCorrectionManaged = 'true';
  electricSourceInput.dataset.utilityEntryExperimentCorrectionLocked = 'true';
  const gasInput = createDailyCurrentInput({
    resourceType: 'gas',
    fieldId: 'gas_field_03',
  });
  const host = createDailyCurrentHost([electricSourceInput, gasInput]);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
  });

  assert.equal(electricSourceInput.readOnly, false);
  assert.equal(electricSourceInput.classList.contains('is-correction-locked'), false);

  api.syncCorrectionLockedDailyInputs(host, 'gas', '2026-04', {
    beforeCorrection: false,
  });

  assert.equal(electricSourceInput.readOnly, false);
  assert.equal(electricSourceInput.classList.contains('is-correction-locked'), false);
});

test('utility entry corrected view hides raw compressor source rows and before view hides allocation rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const rows = {
    source: { dataset: { utilityEntryExperimentRowFieldId: 'field_10' }, hidden: false },
    liquidSource: {
      dataset: {
        utilityEntryExperimentRowFieldId: ids.liquidFieldId,
        utilityEntryExperimentCorrectionSourceRow: 'true',
      },
      hidden: false,
    },
    liquidCorrected: {
      dataset: {
        utilityEntryExperimentRowFieldId: ids.liquidFieldId,
        utilityEntryExperimentCorrectionCorrectedRow: 'true',
      },
      hidden: false,
    },
    allocation: {
      dataset: { utilityEntryExperimentRowFieldId: ids.team1SharedCompressorId },
      hidden: false,
    },
    sourceGroup: {
      dataset: {
        utilityEntryExperimentGroupFieldIds: [
          'field_10',
          'field_11',
          ids.liquidCompressorId,
          ids.compressorFieldId,
        ].join(','),
      },
      hidden: false,
    },
  };
  const host = {
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return Object.values(rows);
    },
  };

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: false });

  assert.equal(rows.source.hidden, true);
  assert.equal(rows.liquidSource.hidden, true);
  assert.equal(rows.liquidCorrected.hidden, false);
  assert.equal(rows.sourceGroup.hidden, true);
  assert.equal(rows.allocation.hidden, false);

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: true });

  assert.equal(rows.source.hidden, false);
  assert.equal(rows.liquidSource.hidden, false);
  assert.equal(rows.liquidCorrected.hidden, true);
  assert.equal(rows.sourceGroup.hidden, false);
  assert.equal(rows.allocation.hidden, true);
});

test('utility entry before-correction view realigns group labels after hiding allocation rows', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const groupCell = {
    hidden: false,
    rowSpan: 0,
    attrs: new Map(),
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    },
  };
  const rows = [
    createDailyGroupRow({ fieldId: 'field_01', groupCell }),
    createDailyGroupRow({ fieldId: ids.team1SharedCompressorId }),
    createDailyGroupRow({ groupFieldIds: ['field_01', ids.team1SharedCompressorId] }),
  ];
  const host = {
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('data-utility-entry-experiment')) return rows;
      return [];
    },
  };

  api.updateConditionalRows(host, 'electric', '2026-04', { beforeCorrection: true });

  assert.equal(rows[0].hidden, false);
  assert.equal(rows[1].hidden, true);
  assert.equal(rows[2].hidden, false);
  assert.equal(groupCell.rowSpan, 2);
  assert.equal(groupCell.attrs.get('rowspan'), '2');
});

test('utility entry correction view stays on raw daily readings after source readings are filled', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const host = { dataset: { utilityEntryExperimentCorrectionMode: 'corrected' } };
  const missingLiquidCompressorValues = {
    field_10: '10',
    field_11: '20',
    [ids.compressorFieldId]: '40',
    [ids.liquidFieldId]: '200',
    [ids.liquid2FieldId]: '50',
  };

  const notReadyOptions = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: missingLiquidCompressorValues,
    monthValue: '2026-04',
  });

  assert.equal(notReadyOptions.correctionMode, 'before');
  assert.equal(notReadyOptions.beforeCorrection, true);
  assert.equal(notReadyOptions.correctionReadiness.ready, false);
  assert.deepEqual(Array.from(notReadyOptions.correctionReadiness.missingIds), [ids.liquidCompressorId]);
  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected';
  const readyOptions = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: {
      ...missingLiquidCompressorValues,
      [ids.liquidCompressorId]: '30',
    },
    monthValue: '2026-04',
  });

  assert.equal(readyOptions.correctionMode, 'before');
  assert.equal(readyOptions.beforeCorrection, true);
  assert.equal(readyOptions.correctionReadiness.ready, true);
  assert.equal(readyOptions.correctionReadiness.requiredIds.includes(ids.liquid2FieldId), false);

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected';
  const missingLiquid2Options = api.getCorrectionOptions(host, 'electric', '2026-04-02', {
    values: {
      ...missingLiquidCompressorValues,
      [ids.liquidCompressorId]: '30',
      [ids.liquid2FieldId]: '',
    },
    monthValue: '2026-04',
  });

  assert.equal(missingLiquid2Options.correctionMode, 'before');
  assert.equal(missingLiquid2Options.beforeCorrection, true);
  assert.equal(missingLiquid2Options.correctionReadiness.ready, true);
});

test('utility entry correction before February source set keeps raw daily readings', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const host = { dataset: { utilityEntryExperimentCorrectionMode: 'corrected' } };

  const options = api.getCorrectionOptions(host, 'electric', '2026-03-02', {
    values: {
      field_10: '10',
      field_11: '20',
      [ids.compressorFieldId]: '40',
      [ids.liquidFieldId]: '200',
      [ids.liquid2FieldId]: '50',
    },
    monthValue: '2026-03',
  });

  assert.equal(options.correctionMode, 'before');
  assert.equal(options.beforeCorrection, true);
  assert.equal(options.correctionReadiness.ready, true);
  assert.equal(options.correctionReadiness.requiredIds.includes(ids.liquidCompressorId), false);
  assert.equal(options.correctionReadiness.requiredIds.includes(ids.liquid2FieldId), false);
});

test('utility entry correction mode stays on raw daily readings without a corrected toggle', () => {
  const api = createCorrectionContext();
  const beforeButton = createCorrectionModeButton('before', '보정전');
  const correctedButton = createCorrectionModeButton('corrected', '보정후');
  const corrected2Button = createCorrectionModeButton('corrected2', '보정후2');
  const host = createCorrectionModeHost([beforeButton, correctedButton, corrected2Button], {
    mode: 'corrected',
  });

  api.updateBeforeCorrectionToggle(host, '2026-04-01', {
    ready: false,
    requiredIds: ['field_15'],
    missingIds: ['field_15'],
    missingLabels: ['액상 1'],
  });

  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');
  assert.equal(host.hidden, undefined);
  assert.equal(host.querySelectorAll('[data-role="utility-entry-experiment-correction-modes"]')[0]?.hidden, true);
  assert.equal(beforeButton.disabled, false);
  assert.equal(beforeButton.classList.contains('is-active'), true);
  assert.equal(correctedButton.disabled, true);
  assert.equal(correctedButton.hidden, true);
  assert.equal(correctedButton.getAttribute('aria-disabled'), 'true');
  assert.equal(corrected2Button.hidden, true);
  assert.equal(corrected2Button.disabled, true);
  assert.equal(corrected2Button.getAttribute('aria-disabled'), 'true');

  host.dataset.utilityEntryExperimentCorrectionMode = 'corrected2';
  api.updateBeforeCorrectionToggle(host, '2026-04-01', {
    ready: true,
    requiredIds: ['field_15'],
    missingIds: [],
    missingLabels: [],
  });

  assert.equal(host.dataset.utilityEntryExperimentCorrectionMode, 'before');
  assert.equal(correctedButton.hidden, true);
  assert.equal(correctedButton.disabled, true);
  assert.equal(correctedButton.getAttribute('aria-disabled'), 'true');
  assert.equal(correctedButton.classList.contains('is-active'), false);
  assert.equal(corrected2Button.hidden, true);
  assert.equal(corrected2Button.disabled, true);
  assert.equal(corrected2Button.classList.contains('is-active'), false);
});
