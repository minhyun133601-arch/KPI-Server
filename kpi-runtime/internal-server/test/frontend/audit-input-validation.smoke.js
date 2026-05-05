import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const auditDataSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.data.js'),
  'utf8'
);
const auditQuarterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.quarter.js'),
  'utf8'
);
const auditLuxDataSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-data.js'),
  'utf8'
);
const auditLuxWorkspaceSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'),
  'utf8'
);
const auditRecordsAdapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const auditLuxDetachedPreviewSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-detached-preview.js'),
  'utf8'
);

function createAuditRuntime() {
  const context = {
    console,
    window: {},
    document: {
      addEventListener() {},
      querySelectorAll() {
        return [];
      },
    },
    HTMLElement: class HTMLElement {},
    HTMLInputElement: class HTMLInputElement {},
    Number,
    String,
    Math,
    Map,
    Set,
    Array,
    Object,
    Date,
    JSON,
  };
  context.window = context;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(auditRecordsAdapterSource, context, { filename: 'KPI.audit.records.browser-adapter.js' });
  vm.runInContext(auditDataSource, context, { filename: 'KPI.audit.records.data.js' });
  vm.runInContext(auditQuarterSource, context, { filename: 'KPI.audit.records.quarter.js' });
  vm.runInContext(auditLuxDataSource, context, { filename: 'KPI.audit.records.lux-data.js' });
  vm.runInContext(auditLuxDetachedPreviewSource, context, {
    filename: 'KPI.audit.records.lux-detached-preview.js',
  });
  vm.runInContext(auditLuxWorkspaceSource, context, { filename: 'KPI.audit.records.lux-workspace.js' });
  return context;
}

test('audit value status compares only complete numeric input', () => {
  const context = createAuditRuntime();
  const status = (value, options = {}) => vm.runInContext(
    `getAuditValueStatus(${JSON.stringify(value)}, { value: 100, label: '100' }, ${JSON.stringify(options)})`,
    context
  );

  assert.equal(status('').state, 'none');
  assert.equal(status('0.', { deferPendingInput: true }).state, 'none');
  assert.equal(status('12abc').state, 'none');
  assert.equal(status('12.3').state, 'fail');
  assert.equal(status('120').state, 'pass');
});

test('audit lux workspace does not count incomplete numeric values as measured', () => {
  const context = createAuditRuntime();
  context.__row = {
    standard: '100',
    values: {
      1: '0.',
      2: '',
      3: '12.3',
      4: '120',
    },
  };

  const summary = vm.runInContext('inspectAuditLuxWorkspaceRow(__row)', context);

  assert.equal(summary.measuredCount, 2);
  assert.equal(summary.failedQuarters.join(','), '3');
});
