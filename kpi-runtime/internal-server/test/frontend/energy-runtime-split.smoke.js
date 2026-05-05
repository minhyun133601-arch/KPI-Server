import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const energyDir = path.join(repoRoot, 'utility/runtime/util/energy');
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const globalObjectName = 'global' + 'This';

async function readEnergyFile(fileName) {
  return fs.readFile(path.join(energyDir, fileName), 'utf8');
}

function countLines(source) {
  return source.trimEnd().split(/\r?\n/).length;
}

test('kpi html loads split energy chart helpers before host runtimes', () => {
  const orderedFiles = [
    'KPI.util.energy.browser-adapter.js',
    'KPI.util.energy.dual.js',
    'KPI.util.energy.chart.js',
    'KPI.util.energy.tabs.js',
    'KPI.util.energy.trend-chart.js',
    'KPI.util.energy.segmented-chart.js',
    'KPI.util.energy.multi-series-chart.js',
    'KPI.util.energy.renderers.js',
    'KPI.util.energy.report-composition.js',
    'KPI.util.energy.modal.chart.js',
  ];

  let previousIndex = -1;
  for (const fileName of orderedFiles) {
    const currentIndex = kpiHtmlSource.indexOf(`utility/runtime/util/energy/${fileName}`);
    assert.ok(currentIndex > previousIndex, `${fileName} should load after the previous energy script`);
    previousIndex = currentIndex;
  }
});

test('energy renderer split moves chart renderers out of the host file', async () => {
  const renderersSource = await readEnergyFile('KPI.util.energy.renderers.js');

  assert.doesNotMatch(renderersSource, /function renderUtilTrendChart/);
  assert.doesNotMatch(renderersSource, /function renderUtilMultiSeriesSegmentedChart/);
  assert.doesNotMatch(renderersSource, /function renderUtilMultiSeriesChart/);
  assert.match(await readEnergyFile('KPI.util.energy.trend-chart.js'), /function renderUtilTrendChart/);
  assert.match(
    await readEnergyFile('KPI.util.energy.segmented-chart.js'),
    /function renderUtilMultiSeriesSegmentedChart/
  );
  assert.match(
    await readEnergyFile('KPI.util.energy.multi-series-chart.js'),
    /function renderUtilMultiSeriesChart/
  );
});

test('energy report composition moves aggregate helpers out of the modal host file', async () => {
  const modalSource = await readEnergyFile('KPI.util.energy.modal.chart.js');
  const compositionSource = await readEnergyFile('KPI.util.energy.report-composition.js');

  assert.doesNotMatch(modalSource, /function buildUtilEnergyReportOverviewComposition/);
  assert.match(compositionSource, /function buildUtilEnergyReportOverviewComposition/);
  assert.match(compositionSource, /function buildUtilEnergyReportGasTeamComposition/);
});

test('energy tabs routes browser globals through the data-sync adapter', async () => {
  const tabsSource = await readEnergyFile('KPI.util.energy.tabs.js');

  assert.doesNotMatch(tabsSource, /window\./);
  assert.doesNotMatch(tabsSource, new RegExp(globalObjectName));
  assert.match(tabsSource, /KpiUtilDataSyncBrowserAdapter/);
  assert.match(tabsSource, /addUtilEnergyTabsEventListener/);
  assert.match(tabsSource, /hasUtilEnergyTabsSpreadsheetApi/);
});

test('energy chart, modal, and override route browser globals through the energy adapter', async () => {
  const adapterSource = await readEnergyFile('KPI.util.energy.browser-adapter.js');
  const chartSource = await readEnergyFile('KPI.util.energy.chart.js');
  const modalSource = await readEnergyFile('KPI.util.energy.modal.chart.js');
  const overrideSource = await readEnergyFile('KPI.util.energy.tabs.override.js');

  for (const source of [chartSource, modalSource, overrideSource]) {
    assert.doesNotMatch(source, /window\./);
    assert.doesNotMatch(source, new RegExp(globalObjectName));
    assert.match(source, /KpiUtilEnergyBrowserAdapter/);
  }
  assert.match(adapterSource, new RegExp(globalObjectName));
  assert.match(chartSource, /useUtilEnergyChartRootFlag/);
  assert.match(modalSource, /openUtilEnergyModalChartPopup/);
  assert.match(modalSource, /printUtilEnergyModalChartPage/);
  assert.match(overrideSource, /exposeUtilEnergyTabsOverrideApi/);
  assert.match(overrideSource, /setUtilEnergyTabsOverrideRenderer/);
});

test('energy browser adapter exposes root-bound browser operations', async () => {
  const adapterSource = await readEnergyFile('KPI.util.energy.browser-adapter.js');
  const calls = [];
  const context = {
    addEventListener(type, listener, options) {
      calls.push({ type, listener, options });
    },
    open(url, target, features) {
      calls.push({ url, target, features });
      return { closed: false };
    },
    print() {
      calls.push({ type: 'print' });
    },
    renderUtilDualTabs() {
      calls.push({ type: 'render' });
    },
  };
  context[globalObjectName] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'KPI.util.energy.browser-adapter.js' });

  const adapter = context.KpiUtilEnergyBrowserAdapter;
  assert.equal(typeof adapter.addEventListener, 'function');
  assert.equal(adapter.useRootFlag('__energyTestFlag'), true);
  assert.equal(adapter.useRootFlag('__energyTestFlag'), false);
  assert.equal(context.__energyTestFlag, true);

  adapter.addEventListener('keydown', () => {}, { once: true });
  assert.equal(calls[0].type, 'keydown');
  assert.deepEqual(calls[0].options, { once: true });

  const popup = adapter.openPopup('', 'energy-test', 'popup=yes');
  assert.deepEqual(popup, { closed: false });
  adapter.printPage();
  assert.equal(calls.at(-1).type, 'print');

  const replacement = () => 'replacement';
  assert.equal(adapter.getRenderUtilDualTabs(), context.renderUtilDualTabs);
  assert.equal(adapter.setRenderUtilDualTabs(replacement), replacement);
  assert.equal(context.renderUtilDualTabs, replacement);

  adapter.exposeApi({ getEnergyTestValue: () => 42 });
  assert.equal(context.getEnergyTestValue(), 42);
});

test('split energy files stay below the worklog threshold', async () => {
  const files = [
    'KPI.util.energy.browser-adapter.js',
    'KPI.util.energy.trend-chart.js',
    'KPI.util.energy.segmented-chart.js',
    'KPI.util.energy.multi-series-chart.js',
    'KPI.util.energy.renderers.js',
    'KPI.util.energy.report-composition.js',
    'KPI.util.energy.modal.chart.js',
  ];

  for (const fileName of files) {
    const lineCount = countLines(await readEnergyFile(fileName));
    assert.ok(lineCount < 800, `${fileName} has ${lineCount} lines`);
  }
});
