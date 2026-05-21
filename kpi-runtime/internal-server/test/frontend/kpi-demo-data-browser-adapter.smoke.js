import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const adapterSource = await fs.readFile(
  new URL('../../../../kpi-runtime/demo/KPI.demo-data.browser-adapter.js', import.meta.url),
  'utf8'
);
const demoDataSource = await fs.readFile(
  new URL('../../../../kpi-runtime/demo/KPI.demo-data.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(new URL('../../../../KPI.html', import.meta.url), 'utf8');
const directGlobalPattern = new RegExp(['global' + 'This', 'window' + '\\.', 'global' + 'Scope'].join('|'));

function createDemoDataContext() {
  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Boolean,
    PortalData: {
      data_equipment_history_card: {
        existing: true,
      },
    },
  };
  context.window = context;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.demo-data.browser-adapter.js',
  });
  vm.runInContext(demoDataSource, context, {
    filename: 'KPI.demo-data.js',
  });
  return context;
}

test('demo data host routes PortalData defaults through the browser adapter', () => {
  const context = createDemoDataContext();

  assert.equal(typeof context.KpiDemoDataBrowserAdapter.setPortalDataDefault, 'function');
  assert.deepEqual(context.PortalData.data_equipment_history_card, { existing: true });
  assert.equal(context.__KPI_DEMO_DATA__.enabled, true);
  assert.deepEqual(Array.from(context.__KPI_DEMO_DATA__.scope), ['data_equipment_history_card']);
  assert.doesNotMatch(demoDataSource, directGlobalPattern);
  assert.match(demoDataSource, /KpiDemoDataBrowserAdapter/);
});

test('kpi html loads demo data browser adapter before demo data', () => {
  const adapterIndex = kpiHtml.indexOf('kpi-runtime/demo/KPI.demo-data.browser-adapter.js?v=1');
  const demoDataIndex = kpiHtml.indexOf('kpi-runtime/demo/KPI.demo-data.js?v=9');

  assert.ok(adapterIndex >= 0, 'demo data browser adapter loader is missing');
  assert.ok(demoDataIndex > adapterIndex, 'demo data must load after demo data browser adapter');
});
