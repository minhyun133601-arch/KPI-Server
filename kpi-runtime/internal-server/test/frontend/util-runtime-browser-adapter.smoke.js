import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adapterScripts,
  runtimeScripts,
  adapterPublicMethods,
  adapterSource,
  runtimeSource,
  readScriptSources,
  assertScriptOrder,
  loadManifestScripts,
  createContext,
} from './support/util-runtime-source-harness.js';

test('util runtime browser adapter registers init boot save and closer hooks', async () => {
  const { context, registered } = createContext();

  assert.equal(typeof registered.initializers.get('data'), 'function');
  assert.equal(typeof registered.initializers.get('experiment'), 'function');
  assert.equal(typeof registered.initializers.get('report'), 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckSingleHtml, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckCaptureZip, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckCapturePdf, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.printReportDeckPdf, 'function');
  assert.deepEqual(Object.keys(context.KpiUtilRuntimeBrowserAdapter), adapterPublicMethods);
  assert.equal(Object.isFrozen(context.KpiUtilRuntimeBrowserAdapter), true);
  assert.match(adapterSource, /data-report-export-viewer/);
  assert.match(adapterSource, /data-report-export-capture-zip/);
  assert.doesNotMatch(adapterSource, /showDirectoryPicker/);
  assert.match(adapterSource, /data-report-export-fullscreen/);
  assert.match(adapterSource, /isReportDeckExportFullscreenAdvanceClick/);
  assert.match(adapterSource, /isReportDeckExportFullscreenAdvanceClick\(event\.target\)[\s\S]*moveSlide\(1\);/);
  assert.match(adapterSource, /data-report-export-print/);
  assert.doesNotMatch(adapterSource, /<button[^>]+data-report-export-print/);
  assert.doesNotMatch(adapterSource, /PDF\uC778\uC1C4/);
  assert.match(adapterSource, /data-report-output-prepared/);
  assert.doesNotMatch(adapterSource, /function buildReportDeckExportMemoOverviewDialog/);
  assert.doesNotMatch(adapterSource, /data-report-memo-overview-toggle>특이사항/);
  assert.doesNotMatch(adapterSource, /deck\.appendChild\(buildReportDeckExportMemoOverviewDialog/);
  assert.doesNotMatch(
    adapterSource,
    /const memoOverviewButton = event\.target\.closest\?\.\('\[data-report-memo-overview-toggle\]'\);/
  );
  assert.match(adapterSource, /report-print-viewer/);
  assert.match(adapterSource, /report-print-page/);
  assert.match(adapterSource, /report-print-slide-frame/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_PAGE_WIDTH\s*=\s*'297mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_PAGE_HEIGHT\s*=\s*'210mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_PAGE_MARGIN\s*=\s*'10mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_SLIDE_CSS_WIDTH\s*=\s*'277mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT\s*=\s*'155\.8125mm'/);
  assert.match(adapterSource, /REPORT_DECK_CAPTURE_SLIDE_WIDTH\s*=\s*1920/);
  assert.match(adapterSource, /REPORT_DECK_CAPTURE_SLIDE_HEIGHT\s*=\s*1080/);
  assert.match(adapterSource, /getReportDeckCaptureViewport/);
  assert.match(adapterSource, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(adapterSource, /captureReportDeckSlideImageUrl/);
  assert.match(adapterSource, /buildReportDeckCaptureZipEndpoint/);
  assert.match(adapterSource, /buildReportDeckCapturePageHtml/);
  assert.match(adapterSource, /format:\s*'zip'/);
  assert.match(adapterSource, /format:\s*'pdf'/);
  assert.match(adapterSource, /pageNumbers/);
  assert.match(adapterSource, /pageRange/);
  assert.match(
    adapterSource,
    /const range = normalizeReportDeckCapturePageRange\(options\.pageRange, slides\.length\);/
  );
  assert.match(adapterSource, /const captureZipDataUrl = String\(options\.captureZipDataUrl \|\| ''\)\.trim\(\);/);
  assert.match(
    adapterSource,
    /const captureZipFileName = String\(options\.captureZipFileName \|\| options\.filename \|\| 'report-capture\.zip'\)\.replace/
  );
  assert.match(adapterSource, /pageRange:\s*options\.pageRange/);
  assert.match(runtimeSource, /buildReportDeckExportTimeMinuteToken/);
  assert.match(
    runtimeSource,
    /KPI-report-capture-\$\{buildReportDeckExportDateToken\(state, meta\)\}-\$\{buildReportDeckExportTimeMinuteToken\(\)\}\.zip/
  );
  assert.match(runtimeSource, /data-report-capture-zip/);
  assert.match(runtimeSource, /data-report-capture-pdf/);
  assert.match(runtimeSource, /data-report-save-menu-toggle/);
  assert.match(runtimeSource, /data-report-save-menu-panel/);
  assert.match(runtimeSource, /toggleReportDeckSaveMenu/);
  assert.match(runtimeSource, /closeReportDeckSaveMenu/);
  assert.match(runtimeSource, /data-report-capture-range-start/);
  assert.match(runtimeSource, /data-report-capture-range-end/);
  assert.match(runtimeSource, /data-report-capture-current-only/);
  assert.match(runtimeSource, /includeCaptureFiles:\s*false/);
  assert.match(runtimeSource, /pageRange,/);
  assert.match(runtimeSource, /exportReportDeckCapturePdf/);
  assert.match(runtimeSource, /reportCaptureBusy/);
  assert.match(adapterSource, /report-print-slide-image/);
  assert.match(adapterSource, /image\/svg\+xml;charset=utf-8/);
  assert.match(
    adapterSource,
    /if \(!String\(source \|\| ''\)\.trim\(\) \|\| image\.complete\) return Promise\.resolve\(\);/
  );
  assert.match(adapterSource, /getReportDeckPrintableSlides/);
  assert.match(adapterSource, /divideReportDeckMetricValues/);
  assert.match(adapterSource, /normalizeReportDeckPositiveMetric/);
  assert.match(runtimeSource, /formatReportDeckAutoPercentOrBlank/);
  assert.match(runtimeSource, /formatReportDeckAutoNumberOrBlank/);
  assert.match(runtimeSource, /slide3Title:\s*'1\. 북 정 \(가스, 전기 비용\) 분석'/);
  assert.match(runtimeSource, /slide4Title:\s*'1\. 유 산 \(가스, 전기 비용\) 분석'/);
  assert.match(runtimeSource, /slide5Title:\s*'1\. 유 산 \(가스 비용\) 분석'/);
  assert.match(runtimeSource, /slide6Title:\s*'2\. 북 정 \(폐수 비용\) 분석'/);
  assert.match(runtimeSource, /slide7Title:\s*'2\. 유 산 \(폐수 비용\) 분석'/);
  assert.match(runtimeSource, /String\(rowKey\) === '2'/);
  assert.match(
    adapterSource,
    /@page \{ size: \$\{parts\.REPORT_DECK_PRINT_PAGE_WIDTH\} \$\{parts\.REPORT_DECK_PRINT_PAGE_HEIGHT\}; margin: 0; \}/
  );
  assert.match(adapterSource, /padding:\s*\$\{parts\.REPORT_DECK_PRINT_PAGE_MARGIN\} !important/);
  assert.match(
    adapterSource,
    /width:\s*\$\{parts\.REPORT_DECK_PRINT_SLIDE_CSS_WIDTH\} !important; height:\s*\$\{parts\.REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT\} !important; max-width:\s*100% !important; max-height:\s*100% !important; margin:\s*0 auto !important/
  );
  assert.match(
    adapterSource,
    /\*::-webkit-scrollbar \{ width: 0 !important; height: 0 !important; display: none !important; \}/
  );
  assert.equal(registered.bootTasks.size, 3);
  assert.ok(registered.closers.size >= 10);

  const dataUtilityContainer = {};
  registered.initializers.get('data')({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment', content: '' },
    container: dataUtilityContainer,
  });
  assert.equal(registered.reportPanelContainers.length, 0);
  assert.equal(registered.sheetReportContainers.length, 0);

  let dataAnalysisModalOpenCount = 0;
  const dataAnalysisOpenButton = {
    dataset: {},
    click() {
      dataAnalysisModalOpenCount += 1;
    },
  };
  const dataAnalysisContainer = {
    querySelector(selector) {
      return selector === '[data-role="util-report-open-modal"]' ? dataAnalysisOpenButton : null;
    },
  };
  registered.initializers.get('data')({
    sectionId: 'data',
    category: { utilitySurface: 'analysis', autoOpenUtilityReportModal: true, content: '' },
    container: dataAnalysisContainer,
  });
  assert.equal(registered.reportPanelContainers.length, 0);
  assert.equal(dataAnalysisModalOpenCount, 0);
  assert.equal(registered.sheetReportContainers.length, 0);

  let experimentAnalysisModalOpenCount = 0;
  const experimentAnalysisOpenButton = {
    dataset: {},
    click() {
      experimentAnalysisModalOpenCount += 1;
    },
  };
  const experimentAnalysisContainer = {
    querySelector(selector) {
      return selector === '[data-role="util-report-open-modal"]' ? experimentAnalysisOpenButton : null;
    },
  };
  registered.initializers.get('experiment')({
    sectionId: 'experiment',
    category: { utilitySurface: 'analysis', autoOpenUtilityReportModal: true, content: '' },
    container: experimentAnalysisContainer,
  });
  assert.equal(registered.reportPanelContainers.length, 0);
  assert.equal(experimentAnalysisModalOpenCount, 0);

  registered.initializers.get('data')({
    sectionId: 'data',
    category: { content: '' },
    container: {},
  });
  assert.equal(registered.reportPanelContainers.length, 0);

  const reportContainer = {};
  registered.initializers.get('report')({
    category: { content: '' },
    container: reportContainer,
  });
  assert.equal(registered.sheetReportContainers[0], reportContainer);

  const utilityEntryHost = {
    querySelector(selector) {
      return selector === '#utility-entry-experiment-monthly:checked' ? null : null;
    },
  };
  const providerFactory = registered.saveProviders.get('util-entry-experiment-save');
  const provider = providerFactory({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment' },
    container: {
      querySelector(selector) {
        return selector === '[data-role="utility-entry-experiment"]' ? utilityEntryHost : null;
      },
    },
  });

  assert.equal(provider.canSave, true);
  assert.equal(provider.priority, 120);
  assert.deepEqual(await provider.perform({ trigger: 'manual' }), { ok: true, period: 'daily' });
  assert.equal(registered.utilityEntrySaveCalls.length, 1);
  assert.equal(registered.utilityEntrySaveCalls[0]?.host, utilityEntryHost);
  assert.equal(registered.utilityEntrySaveCalls[0]?.period, 'daily');

  const utilityEntryMonthlyHost = {
    querySelector(selector) {
      return selector === '#utility-entry-experiment-monthly:checked' ? {} : null;
    },
  };
  const monthlyProvider = providerFactory({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment' },
    container: {
      querySelector(selector) {
        return selector === '[data-role="utility-entry-experiment"]' ? utilityEntryMonthlyHost : null;
      },
    },
  });
  assert.deepEqual(await monthlyProvider.perform({ trigger: 'shortcut' }), { ok: true, period: 'monthly' });
  assert.equal(registered.utilityEntrySaveCalls.length, 2);
  assert.equal(registered.utilityEntrySaveCalls[1]?.host, utilityEntryMonthlyHost);
  assert.equal(registered.utilityEntrySaveCalls[1]?.period, 'monthly');

  const activeMonthlyInput = {
    closest(selector) {
      return selector === '.utility-entry-experiment-view.is-monthly' ? {} : null;
    },
  };
  context.document = { activeElement: activeMonthlyInput };
  const focusedMonthlyHost = {
    contains(element) {
      return element === activeMonthlyInput;
    },
    querySelector() {
      return null;
    },
  };
  const focusedMonthlyProvider = providerFactory({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment' },
    container: {
      querySelector(selector) {
        return selector === '[data-role="utility-entry-experiment"]' ? focusedMonthlyHost : null;
      },
    },
  });
  assert.deepEqual(await focusedMonthlyProvider.perform({ trigger: 'shortcut' }), { ok: true, period: 'monthly' });
  assert.equal(registered.utilityEntrySaveCalls.length, 3);
  assert.equal(registered.utilityEntrySaveCalls[2]?.host, focusedMonthlyHost);
  assert.equal(registered.utilityEntrySaveCalls[2]?.period, 'monthly');

  context.document = { activeElement: null };
  const rememberedMonthlyHost = {
    dataset: { utilityEntryExperimentActivePeriod: 'monthly' },
    querySelector() {
      return null;
    },
  };
  const rememberedMonthlyProvider = providerFactory({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment' },
    container: {
      querySelector(selector) {
        return selector === '[data-role="utility-entry-experiment"]' ? rememberedMonthlyHost : null;
      },
    },
  });
  assert.deepEqual(await rememberedMonthlyProvider.perform({ trigger: 'shortcut' }), { ok: true, period: 'monthly' });
  assert.equal(registered.utilityEntrySaveCalls.length, 4);
  assert.equal(registered.utilityEntrySaveCalls[3]?.host, rememberedMonthlyHost);
  assert.equal(registered.utilityEntrySaveCalls[3]?.period, 'monthly');

  assert.equal(
    providerFactory({
      sectionId: 'data',
      category: { utilitySurface: 'analysis' },
      container: {},
    }),
    null
  );
});

test('util runtime browser adapter supports no-window and disabled-write branches', async () => {
  const { registered } = createContext({
    withWindow: false,
    includeMeteringBridge: false,
    meteringWriteEnabled: false,
  });

  assert.equal(typeof registered.initializers.get('data'), 'function');
  assert.doesNotThrow(() => {
    registered.initializers.get('data')({
      sectionId: 'data',
      category: { utilitySurface: 'entry-experiment', content: '' },
      container: {},
    });
  });

  const utilityEntryHost = {
    querySelector() {
      return null;
    },
  };
  const providerFactory = registered.saveProviders.get('util-entry-experiment-save');
  const provider = providerFactory({
    sectionId: 'data',
    category: { utilitySurface: 'entry-experiment' },
    container: {
      querySelector(selector) {
        return selector === '[data-role="utility-entry-experiment"]' ? utilityEntryHost : null;
      },
    },
  });

  assert.equal(provider.canSave, false);
  assert.equal(await provider.perform({ trigger: 'manual' }), false);
  assert.equal(registered.utilityEntrySaveCalls.length, 0);
});

test('util runtime save provider only serves the utility entry experiment host', () => {
  const { registered } = createContext();
  const providerFactory = registered.saveProviders.get('util-entry-experiment-save');

  assert.equal(
    providerFactory({
      sectionId: 'data',
      category: { utilitySurface: 'entry' },
      container: {},
    }),
    null
  );
  assert.equal(
    providerFactory({
      sectionId: 'data',
      category: { utilitySurface: 'entry-experiment' },
      container: {},
    }),
    null
  );
});

test('kpi html and boot manifest load report runtime parts between browser adapter and host', () => {
  for (const sources of [readScriptSources(), loadManifestScripts()]) {
    adapterScripts.slice(1).forEach((script, index) => assertScriptOrder(sources, adapterScripts[index], script));
    assertScriptOrder(sources, adapterScripts.at(-1), runtimeScripts[0]);
    runtimeScripts.slice(1).forEach((script, index) => assertScriptOrder(sources, runtimeScripts[index], script));
  }
});

test('util runtime host uses the browser adapter and private report registry', () => {
  assert.doesNotMatch(runtimeSource, /window\./);
  assert.match(runtimeSource, /Symbol\.for\('kpi\.reportDeck\.runtime\.parts'\)/);
});
