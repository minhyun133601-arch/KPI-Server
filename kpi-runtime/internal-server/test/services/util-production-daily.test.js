import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatePayload, normalizeStateSnapshot } from '../../src/services/util-production-daily/state.js';

test('normalizeStateSnapshot clamps period and dedupes entries', () => {
  const snapshot = normalizeStateSnapshot({
    periodDefault: { startDay: 99 },
    teams: [
      {
        name: '유틸팀',
        entries: [
          {
            date: '2026-04-01',
            amount: '12.5',
            lineName: '1호기',
            productName: '슬러리',
            sourceFileName: 'first.xlsx',
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: '1호기',
            productName: '슬러리',
            teamName: '유틸팀',
            sourceFileName: 'second.xlsx',
          },
        ],
      },
    ],
    archives: [
      {
        id: 'archive-a',
        fileName: 'daily.xlsx',
        size: '1024',
        lastModified: '10',
        savedAt: '2026-04-02T00:00:00.000Z',
      },
      {
        id: 'archive-a',
        fileName: 'daily.xlsx',
        size: '1024',
        lastModified: '10',
        savedAt: '2026-04-02T00:00:00.000Z',
      },
    ],
  });

  assert.equal(snapshot.periodStartDay, 31);
  assert.equal(snapshot.entries.length, 1);
  assert.equal(snapshot.entries[0].teamName, '유틸팀');
  assert.equal(snapshot.entries[0].sourceFileName, 'second.xlsx');
  assert.equal(snapshot.archives.length, 1);
  assert.equal(snapshot.archives[0].folderName, 'default');
});

test('normalizeStateSnapshot overwrites same production row when supplemental metrics differ', () => {
  const snapshot = normalizeStateSnapshot({
    teams: [
      {
        name: 'Team A',
        entries: [
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            moistureExcludedYield: 97,
          },
          {
            date: '2026-04-01',
            amount: '12.5',
            lineName: 'Line 1',
            productName: 'Product A',
            moistureExcludedYield: '97.0',
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            moistureExcludedYield: 98,
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            equipmentUtilization: 88,
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            workTime: 6,
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            workTime: '6.0',
          },
          {
            date: '2026-04-01',
            amount: 12.5,
            lineName: 'Line 1',
            productName: 'Product A',
            operationTime: 4.5,
          },
        ],
      },
    ],
  });

  assert.equal(snapshot.entries.length, 1);
  assert.equal(snapshot.entries[0].operationTime, 4.5);
  assert.equal(snapshot.entries[0].workTime, null);
  assert.equal(snapshot.entries[0].moistureExcludedYield, null);
});

test('buildStatePayload groups rows by team and derives archive summary', () => {
  const payload = buildStatePayload(
    {
      period_start_day: 5,
      version: 2,
      updated_at: '2026-04-05T10:00:00.000Z',
    },
    [
      {
        production_date: '2026-04-01',
        team_name: 'A조',
        line_name: '1호기',
        production_kind: 'rework',
        product_code: 'P-A',
        product_name: '제품A',
        amount: '10',
        moisture_excluded_yield: '9.5',
        work_time: '6',
        operation_time: '4.5',
        equipment_capa: '15',
        equipment_utilization: '66.7',
        regular_workers: '2.5',
        contract_workers: '0.5',
        material_standard: '12.1',
        material_actual: '12.4',
        total_work_time: '8',
        stick_ea: '1200',
        labor_productivity_ea: '15.5',
        source_archive_id: 'archive-a',
        source_fingerprint: 'archive-a-fingerprint',
        source_file_name: 'daily-a.xlsx',
      },
      {
        production_date: '2026-04-02',
        team_name: 'B조',
        line_name: '2호기',
        product_name: '제품B',
        amount: '20',
        moisture_excluded_yield: '18',
        work_time: '7',
        operation_time: '5.5',
        equipment_capa: '30',
        equipment_utilization: '70',
        source_archive_id: 'archive-a',
        source_fingerprint: 'archive-a-fingerprint',
        source_file_name: 'daily-a.xlsx',
      },
    ],
    [
      {
        id: 'archive-a',
        file_name: 'daily-a.xlsx',
        byte_size: 4096,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        last_modified: 100,
        saved_at: '2026-04-03T00:00:00.000Z',
        folder_name: 'imports',
        fingerprint: 'archive-a-fingerprint',
        document_id: 'doc-1',
        storage: 'server',
        preview_url: '/preview/archive-a',
        download_url: '/download/archive-a',
      },
    ]
  );

  assert.equal(payload.periodDefault.startDay, 5);
  assert.equal(payload.meta.version, 2);
  assert.equal(payload.teams[0].entries[0].productionKind, 'rework');
  assert.equal(payload.teams[0].entries[0].productCode, 'P-A');
  assert.equal(payload.teams[0].entries[0].workTime, 6);
  assert.equal(payload.teams[0].entries[0].operationTime, 4.5);
  assert.equal(payload.teams[0].entries[0].regularWorkers, 2.5);
  assert.equal(payload.teams[0].entries[0].contractWorkers, 0.5);
  assert.equal(payload.teams[0].entries[0].materialStandard, 12.1);
  assert.equal(payload.teams[0].entries[0].materialActual, 12.4);
  assert.equal(payload.teams[0].entries[0].totalWorkTime, 8);
  assert.equal(payload.teams[0].entries[0].stickEa, 1200);
  assert.equal(payload.teams[0].entries[0].laborProductivityEa, 15.5);
  assert.deepEqual(payload.teams.map((team) => team.name), ['A조', 'B조']);
  assert.equal(payload.archives.length, 1);
  assert.deepEqual(payload.archives[0].teams, ['A조', 'B조']);
  assert.deepEqual(payload.archives[0].yearMonths, ['2026-04']);
});

test('buildStatePayload filters invalid production rows before grouping', () => {
  const payload = buildStatePayload(
    { period_start_day: 1, version: 1, updated_at: '2026-04-01T00:00:00.000Z' },
    [
      { production_date: '2026-04-01', team_name: 'A조', amount: '0' },
      { production_date: '2026-02-31', team_name: 'A조', amount: '10' },
      { production_date: '2026-04-02', team_name: '', amount: '10' },
      { production_date: '2026-04-03', team_name: 'B조', amount: 'bad' },
    ],
    []
  );

  assert.deepEqual(payload.teams.map((team) => team.name), ['A조']);
  assert.equal(payload.teams[0].entries.length, 1);
  assert.equal(payload.teams[0].entries[0].amount, 0);
});

test('buildStatePayload sorts grouped entries by date line product and amount', () => {
  const payload = buildStatePayload(
    { period_start_day: 1, version: 1, updated_at: '2026-04-01T00:00:00.000Z' },
    [
      { production_date: '2026-04-02', team_name: 'A조', line_name: '2호기', product_name: 'B', amount: '3' },
      { production_date: '2026-04-01', team_name: 'A조', line_name: '2호기', product_name: 'B', amount: '2' },
      { production_date: '2026-04-01', team_name: 'A조', line_name: '1호기', product_name: 'C', amount: '2' },
      { production_date: '2026-04-01', team_name: 'A조', line_name: '1호기', product_name: 'A', product_code: 'B', amount: '2' },
      { production_date: '2026-04-01', team_name: 'A조', line_name: '1호기', product_name: 'A', product_code: 'A', amount: '2' },
      { production_date: '2026-04-01', team_name: 'A조', line_name: '1호기', product_name: 'A', product_code: 'A', amount: '1' },
    ],
    []
  );

  assert.deepEqual(
    payload.teams[0].entries.map((entry) => `${entry.date}/${entry.lineName}/${entry.productName}/${entry.productCode}/${entry.amount}`),
    [
      '2026-04-01/1호기/A/A/1',
      '2026-04-01/1호기/A/B/2',
      '2026-04-01/1호기/C//2',
      '2026-04-01/2호기/B//2',
      '2026-04-02/2호기/B//3',
    ]
  );
});

test('buildStatePayload derives archive summaries by fingerprint or file name fallback', () => {
  const payload = buildStatePayload(
    { period_start_day: 1, version: 1, updated_at: '2026-04-01T00:00:00.000Z' },
    [
      {
        production_date: '2026-03-31',
        team_name: 'B조',
        amount: '10',
        source_fingerprint: 'same-fingerprint',
      },
      {
        production_date: '2026-04-01',
        team_name: 'A조',
        amount: '20',
        source_file_name: 'Daily.xlsx',
      },
    ],
    [
      { id: 'by-fingerprint', file_name: 'other.xlsx', fingerprint: 'same-fingerprint', saved_at: '2026-01-01T00:00:00.000Z' },
      { id: 'by-file', file_name: 'daily.xlsx', saved_at: '2026-01-02T00:00:00.000Z' },
    ]
  );

  assert.deepEqual(payload.archives[0].teams, ['B조']);
  assert.deepEqual(payload.archives[0].yearMonths, ['2026-03']);
  assert.deepEqual(payload.archives[1].teams, ['A조']);
  assert.deepEqual(payload.archives[1].yearMonths, ['2026-04']);
});

test('normalizeStateSnapshot accepts zero production aliases and sorts archives by saved time', () => {
  const snapshot = normalizeStateSnapshot({
    teams: [
      {
        name: 'A조',
        entries: [
          { date: '2026-04-01', teamName: 'A조', production: '0' },
          { date: '2026-04-02', teamName: 'A조', value: '5' },
        ],
      },
    ],
    archives: [
      { id: 'old', fileName: 'old.xlsx', savedAt: '2026-04-01T00:00:00.000Z' },
      { id: 'new', fileName: 'new.xlsx', savedAt: '2026-04-02T00:00:00.000Z' },
    ],
  });

  assert.deepEqual(snapshot.entries.map((entry) => entry.amount), [0, 5]);
  assert.deepEqual(snapshot.archives.map((archive) => archive.id), ['new', 'old']);
});
