import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const adapterSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/runtime/browser-adapter.js', import.meta.url),
  'utf8'
);
const appSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/app.js', import.meta.url),
  'utf8'
);
const viewModelSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/runtime/view-model.js', import.meta.url),
  'utf8'
);
const renderSource = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/runtime/render.js', import.meta.url),
  'utf8'
);
const productionExtractorHtml = await fs.readFile(
  new URL('../../../../utility/apps/production-extractor/production-extractor.html', import.meta.url),
  'utf8'
);

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function readScriptSources() {
  return Array.from(productionExtractorHtml.matchAll(/<script[^>]+src="([^"]+)"/g)).map(match =>
    normalizeSource(match[1])
  );
}

function createContext(options = {}) {
  const state = {
    events: [],
    messages: [],
    wentBack: false,
  };
  const parent = {
    postMessage(payload, target) {
      state.messages.push({ payload, target });
    },
  };
  const context = {
    ['global' + 'This']: null,
    window: null,
    self: null,
    top: null,
    parent: options.withParent === false ? null : parent,
    location: {
      search: options.search || '?embed=1',
    },
    history: {
      length: options.historyLength ?? 2,
      back() {
        state.wentBack = true;
      },
    },
    KPIProductionExtractorImportParsing: { kind: 'import' },
    KPIProductionExtractorExportActions: { kind: 'export' },
    addEventListener(type, listener) {
      state.events.push({ type, listener });
    },
  };
  context.window = options.withWindow === false ? null : context;
  context.self = context;
  context.top = options.embedded === false ? context : {};
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, { filename: 'runtime/browser-adapter.js' });
  return { context, state };
}

test('production extractor browser adapter wraps APIs embed messages and history', () => {
  const { context, state } = createContext();
  const adapter = context.ProductionExtractorBrowserAdapter;

  assert.equal(adapter.getImportParsingApi()?.kind, 'import');
  assert.equal(adapter.getExportActionsApi()?.kind, 'export');
  assert.equal(adapter.getWindowContext()?.KPIProductionExtractorImportParsing?.kind, 'import');
  assert.equal(adapter.getLocationSearch(), '?embed=1');
  assert.equal(adapter.isEmbeddedWindow(), true);

  adapter.addMessageListener(() => {});
  assert.equal(state.events[0]?.type, 'message');

  assert.equal(adapter.canPostToParent(), true);
  adapter.postToParent({ type: 'payload' }, '*');
  assert.equal(state.messages[0]?.payload?.type, 'payload');
  assert.equal(state.messages[0]?.target, '*');

  assert.equal(adapter.requestParentClose(), true);
  assert.equal(state.messages[1]?.payload?.type, 'kpi-production-close');
  assert.equal(state.messages[1]?.target, '*');

  assert.equal(adapter.canGoBack(), true);
  adapter.goBack();
  assert.equal(state.wentBack, true);
});

test('production extractor browser adapter handles standalone and no-window modes', () => {
  const standalone = createContext({ embedded: false, withParent: false, historyLength: 1 });
  assert.equal(standalone.context.ProductionExtractorBrowserAdapter.isEmbeddedWindow(), false);
  assert.equal(standalone.context.ProductionExtractorBrowserAdapter.canPostToParent(), false);
  assert.equal(standalone.context.ProductionExtractorBrowserAdapter.requestParentClose(), false);
  assert.equal(standalone.context.ProductionExtractorBrowserAdapter.canGoBack(), false);

  const noWindow = createContext({ withWindow: false });
  assert.equal(noWindow.context.ProductionExtractorBrowserAdapter.getImportParsingApi()?.kind, 'import');
});

test('production extractor html loads browser adapter before app host', () => {
  const sources = readScriptSources();
  const importIndex = sources.indexOf('runtime/import-parsing.js');
  const exportIndex = sources.indexOf('runtime/export-actions.js');
  const adapterIndex = sources.indexOf('runtime/browser-adapter.js');
  const viewModelIndex = sources.indexOf('runtime/view-model.js');
  const renderIndex = sources.indexOf('runtime/render.js');
  const appIndex = sources.indexOf('app.js');

  assert.ok(importIndex >= 0, 'import parser loader is missing');
  assert.ok(exportIndex > importIndex, 'export actions must load after import parser');
  assert.ok(adapterIndex > exportIndex, 'browser adapter must load after export actions');
  assert.ok(viewModelIndex > adapterIndex, 'view model split must load after browser adapter');
  assert.ok(renderIndex > viewModelIndex, 'render split must load after the view model split');
  assert.ok(appIndex > renderIndex, 'app host must load after split runtime files');
});

test('production extractor split hosts use the browser adapter for direct global access', () => {
  for (const [fileName, source] of [
    ['app.js', appSource],
    ['runtime/view-model.js', viewModelSource],
    ['runtime/render.js', renderSource],
  ]) {
    assert.doesNotMatch(source, /window\./, fileName);
    assert.doesNotMatch(source, new RegExp('global' + 'This'), fileName);
  }
});
