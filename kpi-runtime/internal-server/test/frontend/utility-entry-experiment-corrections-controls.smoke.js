import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createUtilityEntryExperimentContext as createCorrectionContext,
  createDailyValidationRow,
  createDailyCurrentHost,
} from './support/utility-entry-experiment-harness.js';

test('utility entry toolbar shows document-style correction criteria control near daily inputs', () => {
  const api = createCorrectionContext();
  const monthOptions = [{ value: '05', label: '5월' }];
  const dailyHtml = api.buildToolbar('daily', {
    date: '2026-05-29',
    rulesId: 'utility-rules-daily',
    monthOptions,
  });
  const ruleIndex = dailyHtml.indexOf('utility-entry-experiment-rule-card');
  const quickIndex = dailyHtml.indexOf('data-role="utility-entry-experiment-quick-entry"');

  assert.doesNotMatch(dailyHtml, /data-role="utility-entry-experiment-complete"/);
  assert.doesNotMatch(dailyHtml, /utility-entry-experiment-check/);
  assert.ok(quickIndex > ruleIndex, 'quick input should remain after the correction criteria control');
  assert.match(dailyHtml, /보정기준/);
  assert.match(dailyHtml, /fa-file-lines/);
  assert.doesNotMatch(dailyHtml, /공유컴프/);
  assert.doesNotMatch(dailyHtml, /액상2/);
  assert.doesNotMatch(dailyHtml, /보정 제외/);

  const monthlyHtml = api.buildToolbar('monthly', {
    year: '2026',
    month: '5월',
    rulesId: 'utility-rules-monthly',
    monthOptions,
  });

  assert.match(monthlyHtml, /utility-entry-experiment-rule-card/);
  assert.match(monthlyHtml, /fa-file-lines/);
  assert.doesNotMatch(monthlyHtml, /원본 - 컴프 1 - 컴프 2/);
});

test('utility entry gas monthly meter link opens from raw meter readings before settlement', () => {
  const api = createCorrectionContext();
  const emptyState = api.getMonthlyMeterLinkState(
    {
      gas: {
        equipmentEntries: {},
        billingSettlementEntries: {},
      },
    },
    'gas_yusan',
    '2026-05',
    'gas'
  );

  assert.equal(emptyState.ready, false);
  assert.deepEqual(Array.from(emptyState.missingLabels), ['가스 검침값']);

  const readyState = api.getMonthlyMeterLinkState(
    {
      gas: {
        equipmentEntries: {
          '2026-06-01': {
            values: {
              gas_field_01: '2453.06',
            },
          },
        },
        billingSettlementEntries: {},
      },
    },
    'gas_yusan',
    '2026-05',
    'gas'
  );

  assert.equal(readyState.ready, true);
  assert.equal(readyState.datasetKey, 'gas');
  assert.equal(readyState.statusLabel, '검침값 입력');
  assert.deepEqual(Array.from(readyState.missingLabels), []);
});

test('utility entry monthly meter link states reuse meter-reading scans per dataset and month', () => {
  const api = createCorrectionContext();
  const scanCounts = {
    electric: 0,
    gas: 0,
  };
  const createTrackedEntries = (datasetKey, entries) =>
    new Proxy(entries, {
      ownKeys(target) {
        scanCounts[datasetKey] += 1;
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, property) {
        return Object.getOwnPropertyDescriptor(target, property);
      },
      get(target, property, receiver) {
        return Reflect.get(target, property, receiver);
      },
    });
  const states = api.getMonthlyMeterLinkStates(
    {
      electric: {
        equipmentEntries: createTrackedEntries('electric', {
          '2026-06-01': {
            values: {
              field_01: '123',
            },
          },
        }),
      },
      gas: {
        equipmentEntries: createTrackedEntries('gas', {
          '2026-06-01': {
            values: {
              gas_field_01: '2453.06',
            },
          },
        }),
      },
      waste: {
        billingSettlementEntries: {},
      },
    },
    '2026-05'
  );

  assert.equal(states.electric_yusan.ready, true);
  assert.equal(states.electric_bukjeong.ready, true);
  assert.equal(states.gas_yusan.ready, true);
  assert.equal(states.gas_yusan_lng.ready, true);
  assert.equal(states.gas_yusan_lpg.ready, true);
  assert.equal(scanCounts.electric, 1);
  assert.equal(scanCounts.gas, 1);
});

test('utility entry correction summary includes current compressor correction rules', () => {
  const api = createCorrectionContext();
  const body = { innerHTML: '' };
  const host = {
    querySelectorAll(selector) {
      if (selector === '[data-role="utility-entry-experiment-correction-summary"] tbody') {
        return [body];
      }
      return [];
    },
  };

  api.renderCorrectionSummary(
    host,
    {
      electric: {},
      gas: { equipmentItems: [] },
      waste: { teamMonthlyEntries: {} },
    },
    '2026-05'
  );

  assert.match(body.innerHTML, /공유 컴프 배분/);
  assert.match(body.innerHTML, /공유 컴프 = 컴프\(220v\) \+ 컴프\(380v\) \+ 컴프 1 \+ 컴프 2/);
  assert.match(body.innerHTML, /1팀 2파트 컴프레셔 = 공유 컴프 x 72%/);
  assert.match(body.innerHTML, /액상 1 보정/);
  assert.match(body.innerHTML, /액상 1 보정 사용량 = 액상 1 전력사용량 - 컴프 2 전력사용량/);
  assert.match(body.innerHTML, /컴프 배분 조건/);
  assert.doesNotMatch(body.innerHTML, /보정후/);
  assert.doesNotMatch(body.innerHTML, /액상 2/);
  assert.doesNotMatch(body.innerHTML, /액상2/);
  assert.doesNotMatch(body.innerHTML, /보정 제외/);
  assert.doesNotMatch(body.innerHTML, /전력총량 환산/);
  assert.doesNotMatch(body.innerHTML, /기타 사용량/);
  assert.doesNotMatch(body.innerHTML, /LNG 배분계수/);
  assert.doesNotMatch(body.innerHTML, /LPG 표시 보정/);
  assert.doesNotMatch(body.innerHTML, /역률료 표시/);
  assert.doesNotMatch(body.innerHTML, /사용량 직접입력/);
  assert.match(body.innerHTML, /2026-04/);
});

test('utility entry quick candidates include correction source fields in before-correction entry mode', () => {
  const api = createCorrectionContext();
  const ids = api.constants;
  const liquidRow = createDailyValidationRow({
    label: '액상 1',
    previousValue: '200',
    fieldId: ids.liquidFieldId,
  });
  liquidRow.currentInput.readOnly = true;
  const host = createDailyCurrentHost([liquidRow.currentInput]);

  assert.equal(api.getQuickCandidateRows(host, '201').length, 0);

  api.syncCorrectionLockedDailyInputs(host, 'electric', '2026-04', {
    beforeCorrection: true,
  });
  const rows = api.getQuickCandidateRows(host, '201');

  assert.equal(liquidRow.currentInput.readOnly, false);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].targetLabel, liquidRow.currentInput.getAttribute('aria-label'));
});

test('utility entry quick input applies duplicate labels to the candidate resource field', () => {
  const api = createCorrectionContext();
  const electricRow = createDailyValidationRow({
    label: 'shared item',
    previousValue: '90',
    fieldId: 'field_17',
    resourceType: 'electric',
  });
  const gasRow = createDailyValidationRow({
    label: 'shared item',
    previousValue: '100',
    fieldId: 'gas_field_05',
    resourceType: 'gas',
  });
  const quickInput = {
    value: '101',
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
  const host = createDailyCurrentHost([electricRow.currentInput, gasRow.currentInput]);
  const originalQuerySelector = host.querySelector.bind(host);
  host.querySelector = (selector) => {
    if (selector === '[data-role="utility-entry-experiment-quick-input"]') return quickInput;
    return originalQuerySelector(selector);
  };

  const rows = api.getQuickCandidateRows(host, '101');
  const applied = api.applyQuickInput(host, {
    label: rows[0].targetLabel,
    resourceType: rows[0].targetResourceType,
    fieldId: rows[0].targetFieldId,
  });

  assert.equal(rows[0].targetResourceType, 'gas');
  assert.equal(rows[0].targetFieldId, 'gas_field_05');
  assert.equal(applied, true);
  assert.equal(gasRow.currentInput.value, '101');
  assert.equal(electricRow.currentInput.value, '');
  assert.equal(gasRow.currentInput.lastEvent?.type, 'input');
});
