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
const loaderSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.loader.js'), 'utf8');

function readScriptSources() {
  return Array.from(kpiHtmlSource.matchAll(/<script src="([^"]+)"/g)).map(match => match[1]);
}

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function loadManifest() {
  const context = { globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(manifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return context.KPI_BOOT_MANIFEST;
}

test('kpi html loads boot manifest before static scripts and validator after app bootstrap', () => {
  const scriptSources = readScriptSources();
  const manifestIndex = scriptSources.findIndex(source => source.includes('KPI.boot.manifest.js'));
  const xlsxIndex = scriptSources.findIndex(source => source.includes('xlsx.full.min.js'));
  const appIndex = scriptSources.findIndex(source => source.includes('kpi-runtime/app/KPI.app.js'));
  const loaderIndex = scriptSources.findIndex(source => source.includes('KPI.boot.loader.js'));

  assert.ok(manifestIndex >= 0, 'boot manifest script is missing');
  assert.ok(xlsxIndex > manifestIndex, 'vendor scripts must load after the boot manifest');
  assert.ok(appIndex > xlsxIndex, 'app bootstrap must load after runtime scripts');
  assert.ok(loaderIndex > appIndex, 'boot validator must run after app bootstrap');
});

test('boot manifest groups cover the current static KPI script order', () => {
  const manifest = loadManifest();
  const expectedGroups = [
    'vendor',
    'demoData',
    'meteringIntegration',
    'sections',
    'core',
    'dataEntry',
    'utilityBase',
    'workPlanning',
    'workHistory',
    'auditRecords',
    'energyRuntime',
    'reportRuntime',
    'reportSheet',
    'reportSheetTail',
    'utilityAnalytics',
    'workRenderers',
    'appBootstrap',
  ];

  assert.deepEqual([...manifest.groups.map(group => String(group.key))], expectedGroups);

  const manifestScripts = Array.from(manifest.groups, group =>
    Array.from(group.scripts, script => normalizeSource(script))
  ).flat();
  const htmlScripts = readScriptSources()
    .map(normalizeSource)
    .filter(source => !source.includes('KPI.boot.manifest.js') && !source.includes('KPI.boot.loader.js'));

  assert.deepEqual(htmlScripts, manifestScripts);
});

test('boot loader validates the static manifest against KPI html scripts', () => {
  const manifest = loadManifest();
  const context = {
    KPI_BOOT_MANIFEST: manifest,
    globalThis: null,
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, 'script[src]');
        return readScriptSources().map(source => ({
          getAttribute(name) {
            assert.equal(name, 'src');
            return source;
          },
        }));
      },
    },
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(loaderSource, context, { filename: 'KPI.boot.loader.js' });

  assert.equal(context.KPI_BOOT_VALIDATION.ok, true);
  assert.deepEqual([...context.KPI_BOOT_VALIDATION.missing], []);
  assert.deepEqual([...context.KPI_BOOT_VALIDATION.unexpected], []);
  assert.deepEqual([...context.KPI_BOOT_VALIDATION.outOfOrder], []);
});
