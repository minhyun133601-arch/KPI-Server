import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildArchiveFingerprint,
  buildEntryDedupeKey,
  normalizeArchiveMeta,
  normalizeArchiveTeams,
  normalizeArchiveYearMonths,
  normalizeArchiveYears,
  normalizeDateKey,
  normalizeEntry,
  normalizeNumber,
  normalizeProductionKind,
} from '../../src/services/util-production-daily/normalizers.js';
import { buildStatePayload } from '../../src/services/util-production-daily/state.js';

function formatLocalDate(date) {
  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

test('normalizeDateKey preserves the local calendar day for Date values', () => {
  const localMidnight = new Date(2024, 0, 2);

  assert.equal(normalizeDateKey(localMidnight), formatLocalDate(localMidnight));
});

test('normalizeNumber handles grouped blank and invalid production values', () => {
  assert.equal(normalizeNumber(' 1,234.50 '), 1234.5);
  assert.equal(normalizeNumber(0), 0);
  assert.equal(normalizeNumber(''), null);
  assert.equal(normalizeNumber('not-a-number'), null);
});

test('normalizeDateKey rejects impossible calendar dates', () => {
  assert.equal(normalizeDateKey('2026-02-31'), '');
  assert.equal(normalizeDateKey('2024-02-29'), '2024-02-29');
  assert.equal(normalizeDateKey('2025-02-29'), '');
  assert.equal(normalizeDateKey('2026-13-01'), '');
});

test('normalizeProductionKind keeps normal and rework import classes stable', () => {
  assert.equal(normalizeProductionKind(''), 'normal');
  assert.equal(normalizeProductionKind('normal'), 'normal');
  assert.equal(normalizeProductionKind('rework'), 'rework');
  assert.equal(normalizeProductionKind('reprocessed_product'), 'rework');
  assert.equal(normalizeProductionKind('\uC7AC\uAC00\uACF5\uD488'), 'rework');
});

test('buildEntryDedupeKey normalizes row identity and ignores mutable metrics', () => {
  const baseEntry = {
    date: '2026-04-01',
    teamName: ' A팀 (야간) ',
    lineName: ' 1 호기 ',
    productName: ' 제품 A ',
    amount: 0,
  };

  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      teamName: 'A팀',
      lineName: '1 호기',
      productName: '제품 A',
      amount: '0',
    })
  );
  assert.notEqual(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      productionKind: 'rework',
    })
  );
  assert.notEqual(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      productCode: 'P-001',
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      amount: 10,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      moistureExcludedYield: 98,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      workTime: 6,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      operationTime: 4.5,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      equipmentCapa: 120,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      equipmentUtilization: 85,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      regularWorkers: 2.5,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      totalWorkTime: 8,
    })
  );
  assert.equal(
    buildEntryDedupeKey(baseEntry),
    buildEntryDedupeKey({
      ...baseEntry,
      stickEa: 1200,
    })
  );
});

test('normalizeEntry preserves production and value aliases including zero', () => {
  const productionEntry = normalizeEntry({
    date: '2026-04-01',
    team: 'A팀',
    line: '1호기',
    productCode: 'P-000',
    product: '제품A',
    production: '0',
  });
  const valueEntry = normalizeEntry({
    date: '2026-04-02',
    teamName: 'B팀',
    lineNm: '2호기',
    productionType: 'rework',
    itemCode: 'P-125',
    itemName: '제품B',
    value: '12.5',
    yieldRate: '9.5',
    workTime: '6',
    operatingTime: '4.5',
    equipmentCapacity: '20',
    utilizationRate: '62.5',
    regularWorkerCount: '2.5',
    outsourcedWorkers: '0.5',
    rawMaterialStandard: '12.1',
    rawMaterialActual: '12.4',
    totalLaborHours: '8',
    stickEA: '1200',
    laborProductivityEA: '15.5',
  });

  assert.equal(productionEntry.amount, 0);
  assert.equal(valueEntry.amount, 12.5);
  assert.equal(productionEntry.productionKind, 'normal');
  assert.equal(valueEntry.productionKind, 'rework');
  assert.equal(valueEntry.productCode, 'P-125');
  assert.equal(valueEntry.moistureExcludedYield, 9.5);
  assert.equal(valueEntry.workTime, 6);
  assert.equal(valueEntry.operationTime, 4.5);
  assert.equal(valueEntry.equipmentCapa, 20);
  assert.equal(valueEntry.equipmentUtilization, 62.5);
  assert.equal(valueEntry.regularWorkers, 2.5);
  assert.equal(valueEntry.contractWorkers, 0.5);
  assert.equal(valueEntry.materialStandard, 12.1);
  assert.equal(valueEntry.materialActual, 12.4);
  assert.equal(valueEntry.totalWorkTime, 8);
  assert.equal(valueEntry.stickEa, 1200);
  assert.equal(valueEntry.laborProductivityEa, 15.5);
});

test('normalizeArchiveMeta builds stable lowercase fingerprint and server storage fallback', () => {
  const archive = normalizeArchiveMeta({
    fileName: 'Daily.XLSX',
    size: '1024',
    lastModified: '200',
    documentId: 'doc-1',
    savedAt: new Date('2026-04-03T00:00:00.000Z'),
  });

  assert.equal(buildArchiveFingerprint('Daily.XLSX', '1024', '200'), 'daily.xlsx|1024|200');
  assert.equal(archive.fingerprint, 'daily.xlsx|1024|200');
  assert.equal(archive.storage, 'server');
  assert.equal(archive.documentId, 'doc-1');
});

test('archive year month and team normalizers dedupe and sort deterministically', () => {
  assert.deepEqual(normalizeArchiveYears([2026, '2025', 1800, 2026]), [2026, 2025]);
  assert.deepEqual(normalizeArchiveYearMonths(['2026-04', 'bad', '2026-03', '2026-04']), ['2026-04', '2026-03']);
  assert.deepEqual(normalizeArchiveTeams(['B팀', 'A팀', 'B팀', '']), ['A팀', 'B팀']);
});

test('buildStatePayload keeps database date rows on the same local calendar day', () => {
  const localMidnight = new Date(2024, 0, 2);
  const payload = buildStatePayload(
    {
      period_start_day: 1,
      version: 1,
      updated_at: '2026-04-24T00:00:00.000Z',
    },
    [
      {
        production_date: localMidnight,
        team_name: 'Team A',
        line_name: 'Line 1',
        product_name: 'Item 1',
        amount: '10',
        regular_workers: '2.5',
        contract_workers: '0.5',
        material_standard: '12.1',
        material_actual: '12.4',
        total_work_time: '8',
        stick_ea: '1200',
        labor_productivity_ea: '15.5',
        source_archive_id: '',
        source_fingerprint: '',
        source_file_name: '',
      },
    ],
    []
  );

  assert.equal(payload.teams.length, 1);
  assert.equal(payload.teams[0].entries.length, 1);
  assert.equal(payload.teams[0].entries[0].date, formatLocalDate(localMidnight));
  assert.equal(payload.teams[0].entries[0].regularWorkers, 2.5);
  assert.equal(payload.teams[0].entries[0].contractWorkers, 0.5);
  assert.equal(payload.teams[0].entries[0].materialStandard, 12.1);
  assert.equal(payload.teams[0].entries[0].materialActual, 12.4);
  assert.equal(payload.teams[0].entries[0].totalWorkTime, 8);
  assert.equal(payload.teams[0].entries[0].stickEa, 1200);
  assert.equal(payload.teams[0].entries[0].laborProductivityEa, 15.5);
});
