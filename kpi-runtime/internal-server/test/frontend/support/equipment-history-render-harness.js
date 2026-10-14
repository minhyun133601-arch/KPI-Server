import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
export const adapterSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.browser-adapter.js'),
  'utf8'
);
export const modelSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.model.js'),
  'utf8'
);
export const formSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.form.js'),
  'utf8'
);
export const storageSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.storage.js'),
  'utf8'
);
export const renderModuleFiles = [
  'render/KPI.data.equipment-history.render.board.js',
  'render/KPI.data.equipment-history.render.preventive.js',
  'render/KPI.data.equipment-history.render.card.js',
  'render/KPI.data.equipment-history.render.persistence.js',
  'render/KPI.data.equipment-history.render.print.js',
  'render/KPI.data.equipment-history.render.photo.js',
  'render/KPI.data.equipment-history.render.events.js',
  'KPI.data.equipment-history.render.js',
];
export const renderSource = (
  await Promise.all(
    renderModuleFiles.map((file) =>
      fs.readFile(path.join(repoRoot, 'data-entry/runtime/data/equipment-history', file), 'utf8')
    )
  )
).join('\n');
export const bridgeSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/KPI.data.runtime.js'),
  'utf8'
);
export const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
export const equipmentHistoryStyleSource = await fs.readFile(
  path.join(repoRoot, 'data-entry/runtime/data/equipment-history/KPI.data.equipment-history.css'),
  'utf8'
);
export const bootManifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
export const dataCssSource = (
  await Promise.all(
    [
      '01-equipment-foundation.css',
      '02-utility-entry-shell.css',
      '03-utility-entry-workspace.css',
      '04-utility-entry-graph-responsive.css',
      '05-equipment-detail.css',
      '06-equipment-dashboard.css',
      '07-equipment-board.css',
      '08-equipment-responsive.css',
    ].map((file) => fs.readFile(path.join(repoRoot, 'kpi-runtime/app/styles/data/data', file), 'utf8'))
  )
).join('');

export function createEquipmentHistoryRuntime() {
  const container = {
    innerHTML: '',
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  let registeredRenderer = null;
  let registeredSaveProvider = null;
  const alertMessages = [];
  const context = {
    console,
    document: {
      getElementById(id) {
        return id === 'content-container' ? container : null;
      },
    },
    KpiRuntime: {
      canUseServerWrite(writeEnabled) {
        return writeEnabled === true;
      },
      registerSectionRenderer(scope, renderer) {
        if (scope === 'data') registeredRenderer = renderer;
      },
      registerSaveProvider(key, provider) {
        if (key === 'data-equipment-history-save') registeredSaveProvider = provider;
      },
    },
    PortalData: {},
    FileReader: class FileReader {},
    alert(message) {
      alertMessages.push(message);
    },
    print() {},
    Array,
    Object,
    String,
    Number,
    Boolean,
    Date,
    Math,
    Map,
    Set,
  };

  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.data.equipment-history.browser-adapter.js' });
  vm.runInContext(modelSource, context, { filename: 'KPI.data.equipment-history.model.js' });
  vm.runInContext(formSource, context, { filename: 'KPI.data.equipment-history.form.js' });
  vm.runInContext(storageSource, context, { filename: 'KPI.data.equipment-history.storage.js' });
  vm.runInContext(renderSource, context, { filename: 'KPI.data.equipment-history.render.js' });
  vm.runInContext(bridgeSource, context, { filename: 'KPI.data.runtime.js' });

  assert.equal(typeof registeredRenderer, 'function', 'data section renderer must be registered');
  assert.equal(typeof registeredSaveProvider, 'function', 'equipment-history save provider must be registered');
  return { context, container, registeredRenderer, registeredSaveProvider, alertMessages };
}
