import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const adapterScripts = [
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.api.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-dom.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.export-html.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-domain.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.memo-candidates.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.analysis.js',
  'utility/runtime/util/report-deck/browser-adapter/KPI.util.report-deck.adapter.utility-analysis.js',
  'utility/runtime/util/KPI.util.runtime.browser-adapter.js',
];
const runtimeScripts = [
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.config.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.state.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-state.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.chrome.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-format.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-overview.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.memo-editor.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.plan-editor.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.auto-render.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.charts.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.navigation-output.js',
  'utility/runtime/util/report-deck/runtime/KPI.util.report-deck.persistence-editor.js',
  'utility/runtime/util/KPI.util.runtime.js',
];
const adapterPublicMethods = [
  'getRuntime',
  'getUtilityEntryRuntimeConfig',
  'getReportRuntimeConfig',
  'fetchMeteringSharedStore',
  'fetchReportDeckCover',
  'saveReportDeckCover',
  'uploadReportDeckImage',
  'uploadReportDeckImageDataUrl',
  'exportReportDeckSingleHtml',
  'exportReportDeckCaptureZip',
  'exportReportDeckCapturePdf',
  'printReportDeckPdf',
  'buildReportDeckUtilityAnalysis',
  'buildReportDeckBukjeongAnalysis',
  'buildReportDeckYusanLpgAnalysis',
  'buildReportDeckProductionStartAnalysis',
  'buildReportDeckProductionYieldAnalysis',
  'buildReportDeckMemoCandidates',
  'buildReportDeckMemoOverview',
  'buildReportDeckWasteAnalysis',
  'saveUtilityEntryExperiment',
];
const [adapterSource, runtimeSource] = await Promise.all(
  [adapterScripts, runtimeScripts].map(async (scripts) =>
    (await Promise.all(scripts.map((script) => fs.readFile(path.join(repoRoot, script), 'utf8')))).join('\n')
  )
);
const reportSectionSource = (
  await Promise.all(
    [
      'kpi-runtime/sections/report/KPI.sections.report.shared.js',
      'kpi-runtime/sections/report/KPI.sections.report.analysis.js',
      'kpi-runtime/sections/report/KPI.sections.report.deck.js',
      'kpi-runtime/sections/report/KPI.sections.report.content.js',
      'kpi-runtime/sections/KPI.sections.report.js',
    ].map((file) => fs.readFile(path.join(repoRoot, file), 'utf8'))
  )
).join('\n');
const manifestSource = await fs.readFile(path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'), 'utf8');
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function readScriptSources() {
  return Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g)).map((match) => normalizeSource(match[1]));
}

function normalizeSource(source) {
  return String(source || '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+/, '');
}

function assertScriptOrder(sources, before, after) {
  const beforeIndex = sources.indexOf(before);
  const afterIndex = sources.indexOf(after);

  assert.ok(beforeIndex >= 0, `${before} loader is missing`);
  assert.ok(afterIndex > beforeIndex, `${after} must load after ${before}`);
}

function assertSourceTokenOrder(source, tokens) {
  let offset = 0;
  tokens.forEach((token) => {
    const index = source.indexOf(token, offset);
    assert.ok(index >= 0, `${token} must appear after offset ${offset}`);
    offset = index + token.length;
  });
}

function loadManifestScripts() {
  const context = { ['global' + 'This']: {} };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(manifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return Array.from(context.KPI_BOOT_MANIFEST.groups, (group) =>
    Array.from(group.scripts, (script) => normalizeSource(script))
  ).flat();
}

function createContext(options = {}) {
  const {
    withWindow = true,
    includeMeteringBridge = true,
    meteringWriteEnabled = true,
    reportRuntimeConfig = {
      enabled: true,
      apiBase: '/api',
      moduleKey: 'report_runtime',
      recordKey: 'cover',
      permissionKey: 'util.metering.app',
      readEnabled: true,
      writeEnabled: true,
    },
    fetchImpl = null,
    openImpl = null,
    clipboardWriteTextImpl = null,
  } = options;
  const registered = {
    initializers: new Map(),
    bootTasks: new Map(),
    saveProviders: new Map(),
    closers: new Map(),
    utilityEntrySaveCalls: [],
    reportPanelContainers: [],
    sheetReportContainers: [],
    printCount: 0,
    alertMessages: [],
    openCalls: [],
  };
  const context = {
    console,
    setTimeout,
    clearTimeout,
    alert(message) {
      registered.alertMessages.push(String(message || ''));
    },
    navigator:
      typeof clipboardWriteTextImpl === 'function'
        ? {
            clipboard: {
              writeText: clipboardWriteTextImpl,
            },
          }
        : undefined,
    open(...args) {
      registered.openCalls.push(args);
      return typeof openImpl === 'function' ? openImpl(...args) : null;
    },
    window: null,
    ['global' + 'This']: null,
    __KPI_SERVER_RUNTIME_CONFIG__: {
      metering: { writeEnabled: meteringWriteEnabled },
      report: reportRuntimeConfig,
    },
    KpiRuntime: {
      registerSectionInitializer(sectionId, initializer) {
        registered.initializers.set(sectionId, initializer);
      },
      registerBootTask(key, task) {
        registered.bootTasks.set(key, task);
      },
      registerSaveProvider(key, provider) {
        registered.saveProviders.set(key, provider);
      },
      registerShortcutCloser(key, closer) {
        registered.closers.set(key, closer);
      },
      canUseServerWrite(writeEnabled) {
        return writeEnabled === true;
      },
    },
    KpiMeteringBridge: includeMeteringBridge ? {} : null,
    KpiUtilityEntryExperiment: {
      save(host, period) {
        registered.utilityEntrySaveCalls.push({ host, period });
        return { ok: true, period };
      },
    },
    renderUtilDualTabs() {},
    initUnifiedUtilAnalytics() {},
    initUtilAnalyticsRepeaters() {},
    initUtilTabs() {},
    initUtilEnergyLauncher() {},
    initUtilReportPanel(container) {
      registered.reportPanelContainers.push(container);
    },
    initUtilSheetReports(container) {
      registered.sheetReportContainers.push(container);
    },
    bootUtilElectricMeteringSync() {},
    bootUtilGasMeteringSync() {},
    bootUtilWasteMeteringSync() {},
    print() {
      registered.printCount += 1;
    },
  };
  if (typeof fetchImpl === 'function') {
    context.fetch = fetchImpl;
  }
  context.window = withWindow ? context : null;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(`${adapterSource}\n${runtimeSource}`, context, {
    filename: 'KPI.util.runtime.bundle.js',
  });
  return { context, registered };
}

function createPopupWindowMock() {
  return {
    closed: false,
    focusCount: 0,
    document: {
      openCount: 0,
      closeCount: 0,
      html: '',
      writes: [],
      open() {
        this.openCount += 1;
      },
      write(html) {
        this.html = String(html || '');
        this.writes.push(this.html);
      },
      close() {
        this.closeCount += 1;
      },
    },
    focus() {
      this.focusCount += 1;
    },
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function getCurrentCalendarMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLatestReportMonthKey() {
  const now = new Date();
  const latest = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${latest.getFullYear()}-${String(latest.getMonth() + 1).padStart(2, '0')}`;
}

function getReportRecordUrl(monthKey) {
  return `/api/modules/report_runtime/records/report_${String(monthKey || '').replace('-', '_')}`;
}

function getReportRecordKey(monthKey) {
  return `report_${String(monthKey || '').replace('-', '_')}`;
}

function getReportMonthNumber(monthKey, offset = 0) {
  const year = Number.parseInt(String(monthKey || '').slice(0, 4), 10);
  const month = Number.parseInt(String(monthKey || '').slice(5, 7), 10);
  const date = new Date(year, month - 1 + offset, 1);
  return date.getMonth() + 1;
}

function getReportDateForMonth(monthKey, day = 15) {
  const year = Number.parseInt(String(monthKey || '').slice(0, 4), 10);
  const month = Number.parseInt(String(monthKey || '').slice(5, 7), 10);
  const date = new Date(year, month, day);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function getReportDateInputForMonth(monthKey, day = 15) {
  return getReportDateForMonth(monthKey, day).replaceAll('.', '-');
}

function createCompletedSettlement(monthValue) {
  return {
    monthValue,
    fields: { billing_amount: '1' },
    completed: true,
    updatedAt: '2026-05-15T00:00:00.000Z',
  };
}

function createReportDeckSharedStore() {
  const scopedRecord = (monthValue, scopeKeys) => ({
    monthValue,
    scopes: Object.fromEntries(scopeKeys.map((scopeKey) => [scopeKey, createCompletedSettlement(monthValue)])),
  });
  return {
    resourceDatasets: {
      electric: {
        billingSettlementEntries: {
          '2025-11': scopedRecord('2025-11', ['yusan', 'bukjeong']),
          '2025-12': scopedRecord('2025-12', ['yusan', 'bukjeong']),
          '2026-01': scopedRecord('2026-01', ['yusan']),
        },
      },
      gas: {
        billingSettlementEntries: {
          '2025-11': scopedRecord('2025-11', ['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
          '2025-12': scopedRecord('2025-12', ['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
          '2026-01': scopedRecord('2026-01', ['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
        },
      },
      waste: {
        billingSettlementEntries: {
          '2025-11': scopedRecord('2025-11', ['waste_bukjeong', 'waste_yusan']),
          '2025-12': scopedRecord('2025-12', ['waste_bukjeong', 'waste_yusan']),
        },
      },
    },
  };
}

export {
  adapterScripts,
  runtimeScripts,
  adapterPublicMethods,
  adapterSource,
  runtimeSource,
  reportSectionSource,
  manifestSource,
  kpiHtml,
  readScriptSources,
  normalizeSource,
  assertScriptOrder,
  assertSourceTokenOrder,
  loadManifestScripts,
  createContext,
  createPopupWindowMock,
  flushMicrotasks,
  getCurrentCalendarMonthKey,
  getLatestReportMonthKey,
  getReportRecordUrl,
  getReportRecordKey,
  getReportMonthNumber,
  getReportDateForMonth,
  getReportDateInputForMonth,
  createCompletedSettlement,
  createReportDeckSharedStore,
};
