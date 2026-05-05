import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const auditRuntimeSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/KPI.audit.runtime.js'),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(['global', 'This'].join('') + '|window' + '\\.');

function createAuditRuntimeContext() {
  const sectionRenderers = new Map();
  const saveProviders = new Map();
  const savedPayloads = [];
  const context = {
    console,
    window: {
      KpiRuntime: {
        hasServerAuthority: () => true,
        canUseServerWrite: (writeEnabled) => writeEnabled === true,
        registerSectionRenderer(sectionId, renderer) {
          sectionRenderers.set(sectionId, renderer);
        },
        registerSaveProvider(providerId, provider) {
          saveProviders.set(providerId, provider);
        },
      },
    },
    renderAuditContent(category) {
      context.renderedCategory = category;
    },
    getAuditServerRuntimeConfig(dataKey) {
      return dataKey === 'audit_lux' ? { writeEnabled: true } : { writeEnabled: false };
    },
    getAuditEntryFormState() {
      return { editIndex: null, team: '', room: '', type: '', value: '', note: '' };
    },
    getAuditStandardFormState() {
      return { editIndex: null, team: '', room: '', type: '', standard: '' };
    },
    getAuditData(dataKey, title) {
      return { dataKey, title, entries: [{ value: 0 }] };
    },
    saveAuditData(dataKey, data) {
      savedPayloads.push({ dataKey, data });
      return true;
    },
    sectionRenderers,
    saveProviders,
    savedPayloads,
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(auditRuntimeSource, context, {
    filename: 'KPI.audit.runtime.js',
  });
  return context;
}

test('audit runtime gets KpiRuntime through the browser adapter', async () => {
  const context = createAuditRuntimeContext();
  const renderer = context.sectionRenderers.get('audit');
  const saveProviderFactory = context.saveProviders.get('audit-record-save');

  assert.equal(typeof renderer, 'function');
  assert.equal(typeof saveProviderFactory, 'function');

  const category = { dataKey: 'audit_lux', title: 'Audit Lux' };
  renderer(category);
  assert.equal(context.renderedCategory, category);

  const provider = saveProviderFactory({ sectionId: 'audit', category });
  assert.equal(provider.priority, 90);
  assert.equal(provider.canSave, true);
  assert.equal(await provider.perform(), true);
  assert.deepEqual(context.savedPayloads, [
    {
      dataKey: 'audit_lux',
      data: { dataKey: 'audit_lux', title: 'Audit Lux', entries: [{ value: 0 }] },
    },
  ]);
});

test('audit runtime preserves excluded and read-only save provider branches', () => {
  const context = createAuditRuntimeContext();
  const saveProviderFactory = context.saveProviders.get('audit-record-save');

  assert.equal(saveProviderFactory({ sectionId: 'work', category: { dataKey: 'audit_lux' } }), null);
  assert.equal(saveProviderFactory({ sectionId: 'audit', category: { dataKey: 'audit_legal_facility' } }), null);

  const readOnlyProvider = saveProviderFactory({
    sectionId: 'audit',
    category: { dataKey: 'audit_readonly', title: 'Read Only' },
  });
  assert.equal(readOnlyProvider.canSave, false);
});

test('audit runtime loads after records browser adapter and does not touch browser globals directly', () => {
  const adapterScript = 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js';
  const runtimeScript = 'audit/runtime/audit/KPI.audit.runtime.js';
  const adapterHtmlIndex = kpiHtmlSource.indexOf(adapterScript);
  const runtimeHtmlIndex = kpiHtmlSource.indexOf(runtimeScript);
  const adapterManifestIndex = manifestSource.indexOf(adapterScript);
  const runtimeManifestIndex = manifestSource.indexOf(runtimeScript);

  assert.ok(adapterHtmlIndex >= 0, 'audit records browser adapter loader is missing');
  assert.ok(runtimeHtmlIndex > adapterHtmlIndex, 'audit runtime must load after the browser adapter');
  assert.ok(adapterManifestIndex >= 0, 'audit records browser adapter is missing from boot manifest');
  assert.ok(runtimeManifestIndex > adapterManifestIndex, 'boot manifest must load audit runtime after the browser adapter');
  assert.doesNotMatch(auditRuntimeSource, directBrowserGlobalPattern);
  assert.match(auditRuntimeSource, /KpiAuditRecordsBrowserAdapter/);
});
