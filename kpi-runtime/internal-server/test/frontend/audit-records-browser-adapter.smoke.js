import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const AUDIT_RECORDS_ROOT = '../../../../audit/runtime/audit/records';

const adapterSource = await fs.readFile(
  new URL(AUDIT_RECORDS_ROOT + '/KPI.audit.records.browser-adapter.js', import.meta.url),
  'utf8'
);
const auditDataSource = await fs.readFile(
  new URL(AUDIT_RECORDS_ROOT + '/KPI.audit.records.data.js', import.meta.url),
  'utf8'
);
const auditEvidenceSource = await fs.readFile(
  new URL(AUDIT_RECORDS_ROOT + '/KPI.audit.records.evidence.js', import.meta.url),
  'utf8'
);
const auditBatchActionsSource = await fs.readFile(
  new URL(AUDIT_RECORDS_ROOT + '/KPI.audit.records.batch-actions.js', import.meta.url),
  'utf8'
);
const auditOptionsSource = await fs.readFile(
  new URL(AUDIT_RECORDS_ROOT + '/KPI.audit.records.options.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(
  new URL('../../../../KPI.html', import.meta.url),
  'utf8'
);
const bootManifestSource = await fs.readFile(
  new URL('../../../../kpi-runtime/app/boot/KPI.boot.manifest.js', import.meta.url),
  'utf8'
);

test('audit records browser adapter wraps runtime config portal data fetch and popouts', async () => {
  const fetchCalls = [];
  const openCalls = [];
  const alerts = [];
  const documentRef = { nodeType: 9 };
  const context = {
    console,
    URL,
    window: {
      document: documentRef,
      location: { href: 'http://127.0.0.1:3100/KPI.html' },
      __KPI_SERVER_RUNTIME_CONFIG__: {
        audit: {
          enabled: true,
          apiBase: '/api',
          records: {
            audit_lux: { recordKey: 'audit_lux', writeEnabled: true },
          },
        },
      },
      PortalData: {},
      KpiRuntime: {
        canUseServerWrite: (writeEnabled) => writeEnabled === true,
      },
      fetch: async (...args) => {
        fetchCalls.push(args);
        return { ok: true, args };
      },
      open: (...args) => {
        openCalls.push(args);
        return { opened: true };
      },
      alert: (message) => {
        alerts.push(message);
      },
    },
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });

  const adapter = context.window.KpiAuditRecordsBrowserAdapter;
  assert.equal(context.KpiAuditRecordsBrowserAdapter, adapter);
  assert.equal(adapter.getAuditRuntimeConfig().records.audit_lux.recordKey, 'audit_lux');
  assert.equal(adapter.getRuntime(), context.window.KpiRuntime);
  assert.equal(adapter.getDocument(), documentRef);
  const payload = { entries: [{ id: 'next' }] };
  const snapshot = adapter.writePortalPayload('audit_lux', payload);
  payload.entries[0].id = 'mutated';
  assert.equal(JSON.stringify(snapshot), JSON.stringify({ entries: [{ id: 'next' }] }));
  assert.equal(
    JSON.stringify(context.window.PortalData.audit_lux),
    JSON.stringify({ entries: [{ id: 'next' }] })
  );
  assert.equal(adapter.canUseServerWrite(true), true);
  assert.equal(adapter.canUseServerWrite(false), false);
  assert.equal(adapter.hasFetch(), true);
  assert.deepEqual(adapter.expose('AuditAdapterProbe', { ok: true }), { ok: true });
  assert.equal(context.window.AuditAdapterProbe.ok, true);
  assert.equal(context.AuditAdapterProbe.ok, true);
  assert.equal(adapter.claimRootFlag('__AuditAdapterProbeBound'), true);
  assert.equal(adapter.claimRootFlag('__AuditAdapterProbeBound'), false);
  assert.deepEqual(adapter.getRootValue('AuditAdapterProbe'), { ok: true });
  const state = adapter.getRootState('__AuditAdapterProbeState', () => ({ value: 1 }));
  assert.deepEqual(state, { value: 1 });
  assert.equal(adapter.getRootState('__AuditAdapterProbeState').value, 1);
  adapter.alert('audit warning');
  assert.deepEqual(alerts, ['audit warning']);

  const response = await adapter.fetch('/api/modules/portal_data/records/audit_lux', { method: 'PUT' });
  assert.equal(response.ok, true);
  assert.equal(fetchCalls[0][0], '/api/modules/portal_data/records/audit_lux');
  assert.equal(adapter.resolveUrl('audit/lux.png'), 'http://127.0.0.1:3100/audit/lux.png');
  assert.deepEqual(adapter.openWindow('/audit/lux.png', '_blank'), { opened: true });
  assert.deepEqual(openCalls[0], ['/audit/lux.png', '_blank']);
});

test('audit records browser adapter loads before records data options evidence and batch actions', () => {
  const adapterScript = 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js';
  const dataScript = 'audit/runtime/audit/records/KPI.audit.records.data.js';
  const optionsScript = 'audit/runtime/audit/records/KPI.audit.records.options.js';
  const evidenceScript = 'audit/runtime/audit/records/KPI.audit.records.evidence.js';
  const batchScript = 'audit/runtime/audit/records/KPI.audit.records.batch-actions.js';

  const adapterIndex = kpiHtml.indexOf(adapterScript);
  const dataIndex = kpiHtml.indexOf(dataScript);
  const optionsIndex = kpiHtml.indexOf(optionsScript);
  const evidenceIndex = kpiHtml.indexOf(evidenceScript);
  const batchIndex = kpiHtml.indexOf(batchScript);
  assert.ok(adapterIndex >= 0, 'audit records browser adapter loader is missing');
  assert.ok(dataIndex > adapterIndex, 'audit data must load after the browser adapter');
  assert.ok(optionsIndex > adapterIndex, 'audit options must load after the browser adapter');
  assert.ok(evidenceIndex > adapterIndex, 'audit evidence must load after the browser adapter');
  assert.ok(batchIndex > adapterIndex, 'audit batch actions must load after the browser adapter');

  const manifestAdapterIndex = bootManifestSource.indexOf(adapterScript);
  const manifestDataIndex = bootManifestSource.indexOf(dataScript);
  const manifestOptionsIndex = bootManifestSource.indexOf(optionsScript);
  const manifestEvidenceIndex = bootManifestSource.indexOf(evidenceScript);
  const manifestBatchIndex = bootManifestSource.indexOf(batchScript);
  assert.ok(manifestAdapterIndex >= 0, 'audit records browser adapter is missing from boot manifest');
  assert.ok(manifestDataIndex > manifestAdapterIndex, 'boot manifest must load audit data after the browser adapter');
  assert.ok(manifestOptionsIndex > manifestAdapterIndex, 'boot manifest must load audit options after the browser adapter');
  assert.ok(manifestEvidenceIndex > manifestAdapterIndex, 'boot manifest must load audit evidence after the browser adapter');
  assert.ok(manifestBatchIndex > manifestAdapterIndex, 'boot manifest must load audit batch actions after the browser adapter');
});

test('audit options reads fallback portal payload through the browser adapter', () => {
  const context = {
    console,
    window: {
      PortalData: {
        audit_lux: {
          standards: [{ team: '2팀', room: 'A동' }],
          entries: [{ team: '3팀', room: 'B동', year: 2026, quarter: 2 }],
        },
      },
    },
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(auditOptionsSource, context, {
    filename: 'KPI.audit.records.options.js',
  });

  assert.deepEqual(
    [...context.getAuditFilterSourceItems('audit_lux').map((item) => item.team)],
    ['2팀', '3팀']
  );
  assert.deepEqual([...context.getAuditLuxEntryTeams('audit_lux', 2026, 2)], ['2팀', '3팀']);
});

test('audit data evidence and batch actions no longer touch browser globals directly', () => {
  assert.doesNotMatch(auditDataSource, /globalThis|window\./);
  assert.doesNotMatch(auditEvidenceSource, /globalThis|window\./);
  assert.doesNotMatch(auditBatchActionsSource, /globalThis|window\./);
  assert.doesNotMatch(auditOptionsSource, /globalThis|window\./);
  assert.match(auditOptionsSource, /getAuditOptionsData/);
});
