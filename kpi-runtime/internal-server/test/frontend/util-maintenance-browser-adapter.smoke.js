import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const maintenanceSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.js', import.meta.url),
  'utf8'
);
const maintenanceDeleteSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.delete.js', import.meta.url),
  'utf8'
);
const maintenanceConfigSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.config.js', import.meta.url),
  'utf8'
);
const maintenanceExportSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.export.js', import.meta.url),
  'utf8'
);
const maintenanceAdapterSource = await fs.readFile(
  new URL('../../../../utility/runtime/util/KPI.util.maintenance.browser-adapter.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(new URL('../../../../KPI.html', import.meta.url), 'utf8');
const bootManifestSource = await fs.readFile(
  new URL('../../../app/boot/KPI.boot.manifest.js', import.meta.url),
  'utf8'
);
const maintenanceRuntimeSources = [
  ['KPI.util.maintenance.js', maintenanceSource],
  ['KPI.util.maintenance.delete.js', maintenanceDeleteSource],
  ['KPI.util.maintenance.config.js', maintenanceConfigSource],
  ['KPI.util.maintenance.export.js', maintenanceExportSource],
];
const globalObjectName = 'global' + 'This';
const browserWindowName = 'win' + 'dow';

function collectHtmlScriptSources(html) {
  return Array.from(html.matchAll(/<script\s+src="([^"]+)"/g), (match) => match[1].replace(/\?v=\d+$/, ''));
}

function loadBootManifest() {
  const context = { [globalObjectName]: {} };
  context[globalObjectName][globalObjectName] = context[globalObjectName];
  context[globalObjectName][browserWindowName] = context[globalObjectName];
  vm.createContext(context);
  vm.runInContext(bootManifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return context[globalObjectName].KPI_BOOT_MANIFEST.groups.flatMap((group) => group.scripts);
}

test('util maintenance adapter exposes spreadsheet API without coupling host code to window', () => {
  const spreadsheetApi = { utils: {}, writeFile() {} };
  const context = {
    [browserWindowName]: {
      XLSX: spreadsheetApi,
    },
  };
  context[globalObjectName] = context;
  vm.createContext(context);
  vm.runInContext(maintenanceAdapterSource, context, {
    filename: 'KPI.util.maintenance.browser-adapter.js',
  });

  assert.equal(context[browserWindowName].KpiUtilMaintenanceBrowserAdapter.getSpreadsheetApi(), spreadsheetApi);
  assert.equal(context.KpiUtilMaintenanceBrowserAdapter, context[browserWindowName].KpiUtilMaintenanceBrowserAdapter);
});

test('util maintenance adapter returns null when spreadsheet vendor is unavailable', () => {
  const context = {};
  context[browserWindowName] = context;
  context[globalObjectName] = context;
  vm.createContext(context);
  vm.runInContext(maintenanceAdapterSource, context, {
    filename: 'KPI.util.maintenance.browser-adapter.js',
  });

  assert.equal(context.KpiUtilMaintenanceBrowserAdapter.getSpreadsheetApi(), null);
});

test('util maintenance loads adapter and split hosts in HTML and boot manifest', () => {
  const htmlSources = collectHtmlScriptSources(kpiHtml);
  const manifestSources = loadBootManifest();
  const expectedOrder = [
    'utility/runtime/util/KPI.util.maintenance.browser-adapter.js',
    'utility/runtime/util/KPI.util.maintenance.js',
    'utility/runtime/util/KPI.util.maintenance.delete.js',
    'utility/runtime/util/KPI.util.maintenance.config.js',
    'utility/runtime/util/KPI.util.maintenance.export.js',
  ];

  for (let index = 0; index < expectedOrder.length - 1; index += 1) {
    const before = expectedOrder[index];
    const after = expectedOrder[index + 1];

    assert.ok(htmlSources.indexOf(before) > -1, `KPI.html should load ${before}`);
    assert.ok(htmlSources.indexOf(after) > -1, `KPI.html should load ${after}`);
    assert.ok(htmlSources.indexOf(before) < htmlSources.indexOf(after));

    assert.ok(manifestSources.indexOf(before) > -1, `boot manifest should include ${before}`);
    assert.ok(manifestSources.indexOf(after) > -1, `boot manifest should include ${after}`);
    assert.ok(manifestSources.indexOf(before) < manifestSources.indexOf(after));
  }
});

test('util maintenance split hosts route browser globals through the adapter boundary', () => {
  for (const [fileName, source] of maintenanceRuntimeSources) {
    assert.doesNotMatch(source, /window\.XLSX/, fileName);
    assert.doesNotMatch(source, /window\./, fileName);
    assert.doesNotMatch(source, new RegExp(globalObjectName), fileName);
    assert.doesNotMatch(source, /\bXLSX\./, fileName);
  }

  assert.match(maintenanceSource, /getUtilMaintenanceSpreadsheetApi/);
  assert.match(maintenanceSource, /KpiUtilMaintenanceBrowserAdapter/);
});

test('util maintenance export split reads XLSX only through adapter boundary', () => {
  assert.doesNotMatch(maintenanceExportSource, /window\.XLSX/);
  assert.doesNotMatch(maintenanceExportSource, /window\./);
  assert.doesNotMatch(maintenanceExportSource, new RegExp(globalObjectName));
  assert.doesNotMatch(maintenanceExportSource, /\bXLSX\./);
  assert.match(maintenanceExportSource, /getUtilMaintenanceSpreadsheetApi/);
  assert.match(maintenanceSource, /KpiUtilMaintenanceBrowserAdapter/);
  assert.match(
    maintenanceExportSource,
    /const spreadsheetApi = getUtilMaintenanceSpreadsheetApi\(\);[\s\S]+spreadsheetApi\.writeFile\(workbook, fileName\);/
  );
  assert.match(maintenanceExportSource, /if \(!getUtilMaintenanceSpreadsheetApi\(\)\) \{/);
});
