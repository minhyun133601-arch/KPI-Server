import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'utility/runtime/util/KPI.util.runtime.browser-adapter.js');
const runtimePath = path.join(repoRoot, 'utility/runtime/util/KPI.util.runtime.js');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const runtimeSource = await fs.readFile(runtimePath, 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
const kpiHtml = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');

function readScriptSources() {
  return Array.from(kpiHtml.matchAll(/<script src="([^"]+)"/g)).map(match => normalizeSource(match[1]));
}

function normalizeSource(source) {
  return String(source || '').replace(/[?#].*$/, '').replace(/^\/+/, '');
}

function assertScriptOrder(sources, before, after) {
  const beforeIndex = sources.indexOf(before);
  const afterIndex = sources.indexOf(after);

  assert.ok(beforeIndex >= 0, `${before} loader is missing`);
  assert.ok(afterIndex > beforeIndex, `${after} must load after ${before}`);
}

function loadManifestScripts() {
  const context = { ['global' + 'This']: {} };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(manifestSource, context, { filename: 'KPI.boot.manifest.js' });
  return Array.from(context.KPI_BOOT_MANIFEST.groups, group =>
    Array.from(group.scripts, script => normalizeSource(script))
  ).flat();
}

function createContext(options = {}) {
  const {
    withWindow = true,
    includeMeteringApp = true,
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
    includeProductionPersist = false,
    productionWriteEnabled = true,
  } = options;
  const registered = {
    initializers: new Map(),
    bootTasks: new Map(),
    saveProviders: new Map(),
    closers: new Map(),
    meteringInitCount: 0,
    manualSaveCalls: [],
    sheetReportContainers: [],
    printCount: 0,
  };
  const context = {
    console,
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
    KpiMeteringBridge: includeMeteringBridge
      ? {
          initIntegratedMetering() {
            registered.meteringInitCount += 1;
          },
        }
      : null,
    KpiMeteringApp: includeMeteringApp
      ? {
          manualSave(options) {
            registered.manualSaveCalls.push(options);
            return { ok: true, trigger: options?.trigger || '' };
          },
        }
      : null,
    renderUtilDualTabs() {},
    initUnifiedUtilAnalytics() {},
    initUtilAnalyticsRepeaters() {},
    initUtilTabs() {},
    initUtilEnergyLauncher() {},
    initUtilReportPanel() {},
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
  if (includeProductionPersist) {
    context.getUtilProductionServerRuntimeConfig = () => ({ writeEnabled: productionWriteEnabled });
    context.persistUtilProductionDailyState = () => {
      registered.productionPersistCount = (registered.productionPersistCount || 0) + 1;
      return { ok: true, source: 'production' };
    };
  }
  context.window = withWindow ? context : null;
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(`${adapterSource}\n${runtimeSource}`, context, {
    filename: 'KPI.util.runtime.bundle.js',
  });
  return { context, registered };
}

function createReportDeckContainer() {
  const listeners = {};
  const status = { dataset: {}, textContent: '', hidden: false };
  const counter = { textContent: '' };
  const monthSelect = {
    value: '',
    disabled: true,
    innerHTML: '',
    closest(selector) {
      return selector === '[data-report-month-select]' ? this : null;
    },
  };
  const stage = {
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
  };
  const editButton = {
    dataset: {},
    textContent: '',
    classList: {
      active: false,
      toggle(name, active) {
        if (name === 'is-active') this.active = active;
      },
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-edit-toggle]' ? this : null;
    },
  };
  const fullscreenButton = {
    closest(selector) {
      return selector === '[data-report-fullscreen]' ? this : null;
    },
  };
  const exportButton = {
    closest(selector) {
      return selector === '[data-report-export-html]' ? this : null;
    },
  };
  const printButton = {
    closest(selector) {
      return selector === '[data-report-print-pdf]' ? this : null;
    },
  };
  const productionContentsJumpButton = {
    dataset: { reportJumpSlide: '0', reportJumpView: 'public-works' },
    closest(selector) {
      return selector === '[data-report-jump-slide]' ? this : null;
    },
  };
  const reportReturnButton = {
    hidden: true,
    dataset: { reportJumpSlide: '1', reportJumpView: 'hq' },
    closest(selector) {
      return selector === '[data-report-jump-slide]' || selector === '[data-report-return-hq]' ? this : null;
    },
  };
  const overviewDialogFields = {
    team: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    title: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    effect: { value: '' },
    kind: { value: 'cause' },
    detail: { value: '' },
    date: { value: '' },
    amount: {
      value: '',
      customValidity: '',
      reportValidityCount: 0,
      focusCount: 0,
      setCustomValidity(message) {
        this.customValidity = message;
      },
      reportValidity() {
        this.reportValidityCount += 1;
        return !this.customValidity;
      },
      focus() {
        this.focusCount += 1;
      },
    },
  };
  const overviewDialog = {
    hidden: true,
    dataset: {},
    querySelector(selector) {
      const match = selector.match(/^\[data-report-overview-([a-z]+)\]$/);
      return match ? overviewDialogFields[match[1]] || null : null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-report-overview-kind-option]') return overviewKindButtons;
      return [];
    },
  };
  const overviewKindButtons = ['cause', 'purpose'].map((kind) => ({
    dataset: { reportOverviewKindOption: kind },
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-overview-kind-option]' ? this : null;
    },
  }));
  const overviewSaveButton = {
    closest(selector) {
      return selector === '[data-report-overview-save]' ? this : null;
    },
  };
  const overviewCancelButton = {
    closest(selector) {
      return selector === '[data-report-overview-cancel]' ? this : null;
    },
  };
  const dateInput = {
    value: '',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-date-input]' ? this : null;
    },
  };
  const planCountSelects = ['slide8SlotCount', 'slide9SlotCount'].map((key) => ({
    dataset: { reportPlanCountSelect: key },
    value: '',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-plan-count-select]' ? this : null;
    },
  }));
  const planAddSlotButtons = ['slide8', 'slide9'].map((slideKey) => ({
    dataset: { reportPlanAddSlot: slideKey },
    disabled: true,
    closest(selector) {
      return selector === '[data-report-plan-add-slot]' ? this : null;
    },
  }));
  const planSlotCells = [
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide8.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide9.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
  ];
  const planDeleteButtons = [
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide8', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide8.${slotIndex}`) || null;
        }
        return null;
      },
    })),
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide9', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide9.${slotIndex}`) || null;
        }
        return null;
      },
    })),
  ];
  const planImages = [
    'slide8BeforeImage1',
    'slide8BeforeImage2',
    'slide8BeforeImage3',
    'slide8BeforeImage4',
    'slide8AfterImage1',
    'slide8AfterImage2',
    'slide8AfterImage3',
    'slide8AfterImage4',
    'slide9Image1',
    'slide9Image2',
    'slide9Image3',
    'slide9Image4',
  ].map((key) => ({
    dataset: { reportPlanImage: key },
    src: '',
    hidden: false,
    setAttribute(name, value) {
      this[name] = value;
    },
    removeAttribute(name) {
      delete this[name];
    },
  }));
  const planSlides = ['slide8', 'slide9'].map((slideKey) => ({
    dataset: { reportPlanSlide: slideKey },
    querySelectorAll(selector) {
      if (selector === '[data-report-plan-slot]') {
        return planSlotCells.filter((cell) => cell.dataset.reportPlanSlot.startsWith(`${slideKey}.`));
      }
      if (selector === '[data-report-plan-delete-slot]') {
        return planDeleteButtons.filter((button) => button.dataset.reportPlanDeleteSlot === slideKey);
      }
      return [];
    },
  }));
  const planImageFrames = Object.fromEntries(planImages.map((image) => [
    image.dataset.reportPlanImage,
    {
      dataset: {},
      querySelector(selector) {
        if (selector === '[data-report-plan-image-input]') {
          return planImageInputs.find((input) => input.dataset.reportPlanImageKey === image.dataset.reportPlanImage) || null;
        }
        if (selector === '[data-report-plan-image-clear]') {
          return planImageClearButtons.find((button) => button.dataset.reportPlanImageClear === image.dataset.reportPlanImage) || null;
        }
        return null;
      },
      setAttribute(name, value) {
        this.dataset[name.replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      },
    },
  ]));
  const planImageInputs = planImages.map((image) => ({
    dataset: { reportPlanImageKey: image.dataset.reportPlanImage },
    disabled: true,
    files: [],
    value: '',
    closest(selector) {
      return selector === '[data-report-plan-image-input]' ? this : null;
    },
  }));
  const planImageClearButtons = planImages.map((image) => ({
    dataset: { reportPlanImageClear: image.dataset.reportPlanImage },
    closest(selector) {
      return selector === '[data-report-plan-image-clear]' ? this : null;
    },
  }));
  planImages.forEach((image) => {
    image.closest = (selector) => (selector === '[data-report-plan-image-frame]'
      ? planImageFrames[image.dataset.reportPlanImage] || null
      : null);
  });
  const autoChartPlots = {
    gas: { innerHTML: '' },
    electric: { innerHTML: '' },
    waste: { innerHTML: '' },
  };
  function makeClassList() {
    const classes = new Set();
    return {
      active: false,
      add(name) {
        classes.add(name);
        if (name === 'is-active') this.active = true;
      },
      remove(name) {
        classes.delete(name);
        if (name === 'is-active') this.active = false;
      },
      toggle(name, active) {
        const nextActive = active === undefined ? !classes.has(name) : !!active;
        if (nextActive) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
        if (name === 'is-active') this.active = nextActive;
      },
      contains(name) {
        return classes.has(name);
      },
    };
  }
  const chartHighlightButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightToggle: 'gas',
    },
    textContent: '',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-toggle]' ? this : null;
    },
  };
  const chartHighlightRangeButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightToggle: 'gas',
      reportChartHighlightMode: 'range',
    },
    textContent: '',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-toggle]' ? this : null;
    },
  };
  const chartHighlightResetButton = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightReset: 'gas',
    },
    textContent: '\u21B6',
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-reset]' ? this : null;
    },
  };
  const chartHighlightPoint = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightMonth: '2025-12',
    },
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-point]' ? this : null;
    },
  };
  const chartHighlightSecondPoint = {
    dataset: {
      reportChartHighlightKey: 'auto:bukjeong-utility:gas',
      reportChartHighlightMonth: '2026-01',
    },
    classList: makeClassList(),
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-chart-highlight-point]' ? this : null;
    },
  };
  const fields = [
    'title',
    'reportDate',
    'department',
    'preparedBy',
    'reviewedBy1',
    'reviewedBy2',
    'reviewedBy3',
    'approvedBy',
    'contentsItem4',
    'productionTeam1ContentsTitle',
    'productionTeam1ContentsItem1',
    'productionTeam1ContentsItem2',
    'productionTeam1ContentsItem3',
    'productionTeam1ContentsItem4',
    'slide8Title',
    'slide9Title',
    'slide8Item1Text',
    'slide8Item2Text',
    'slide8Item3Text',
    'slide8Item4Text',
  ].map((key) => ({
    dataset: {
      reportField: key,
      ...(key.match(/^slide8Item([1-4])Text$/) ? { reportSlide8Overview: key.match(/^slide8Item([1-4])Text$/)[1] } : {}),
    },
    textContent: '',
    contentEditable: 'false',
    setAttribute(name, value) {
      this[name] = value;
    },
    blurCount: 0,
    blur() {
      this.blurCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-slide8-overview]' && this.dataset.reportSlide8Overview) return this;
      if (selector === `[data-report-field="${key}"]`) return this;
      return selector === '[data-report-field]' ? this : null;
    },
  }));
  const fieldRefs = [
    'contentsItem4',
    'productionTeam1ContentsItem1',
  ].map((key) => ({
    dataset: { reportFieldRef: key },
    textContent: '',
  }));
  const root = {
    dataset: {},
    fullscreenRequestCount: 0,
    ownerDocument: {
      fullscreenElement: null,
      exitCount: 0,
      exitFullscreen() {
        this.exitCount += 1;
        this.fullscreenElement = null;
      },
    },
    requestFullscreen() {
      this.fullscreenRequestCount += 1;
      this.ownerDocument.fullscreenElement = this;
    },
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    querySelector(selector) {
      if (selector === '[data-report-save-status]') return status;
      if (selector === '[data-report-month-select]') return monthSelect;
      if (selector === '[data-report-overview-dialog]') return overviewDialog;
      if (selector === '[data-report-slide-counter]') return counter;
      if (selector === '[data-report-stage]') return stage;
      const frameMatch = selector.match(/^\[data-report-plan-image-frame="([^"]+)"\]$/);
      if (frameMatch) return planImageFrames[frameMatch[1]] || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-report-field]') return fields;
      if (selector === '[data-report-field-ref]') return fieldRefs;
      if (selector === '[data-report-date-input]') return [dateInput];
      if (selector === '[data-report-plan-count-select]') return planCountSelects;
      if (selector === '[data-report-plan-slide]') return planSlides;
      if (selector === '[data-report-plan-image]') return planImages;
      if (selector === '[data-report-plan-add-slot], [data-report-plan-image-input]') return [
        ...planAddSlotButtons,
        ...planImageInputs,
      ];
      if (selector === '[data-report-plan-add-slot]') return planAddSlotButtons;
      if (selector === '[data-report-edit-toggle]') return [editButton];
      if (selector === '[data-report-chart-highlight-toggle]') return [chartHighlightButton, chartHighlightRangeButton];
      if (selector === '[data-report-chart-highlight-reset]') return [chartHighlightResetButton];
      if (selector === '[data-report-chart-highlight-point]') return [chartHighlightPoint, chartHighlightSecondPoint];
      if (selector === '[data-report-slide-page]') return slides;
      if (selector === '[data-report-slide-target]') return navButtons;
      if (selector === '[data-report-return-hq]') return [reportReturnButton];
      const autoChartMatch = selector.match(/^\[data-report-auto-chart-plot="([^"]+)"\]$/);
      if (autoChartMatch) return autoChartPlots[autoChartMatch[1]] ? [autoChartPlots[autoChartMatch[1]]] : [];
      if (selector === '[data-report-waste-auto-chart-plot]') return [autoChartPlots.waste];
      return [];
    },
  };
  const slides = Array.from({ length: 10 }, (_, index) => {
    const pageNumber = { textContent: '' };
    return {
      dataset: {
        reportSlidePage: String(index),
        reportSlideView: index < 2 ? 'hq' : 'public-works',
      },
      pageNumber,
      classList: makeClassList(),
      setAttribute(name, value) {
        this[name] = value;
      },
      querySelector(selector) {
        return selector === '[data-report-page-number]' && index >= 2 ? pageNumber : null;
      },
    };
  });
  const navButtons = Array.from({ length: 10 }, (_, index) => ({
    dataset: { reportSlideTarget: String(index) },
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      return selector === '[data-report-slide-target]' ? this : null;
    },
  }));
  return {
    root,
    status,
    counter,
    monthSelect,
    stage,
    editButton,
    fullscreenButton,
    exportButton,
    printButton,
    chartHighlightButton,
    chartHighlightRangeButton,
    chartHighlightResetButton,
    chartHighlightPoint,
    chartHighlightSecondPoint,
    productionContentsJumpButton,
    reportReturnButton,
    overviewDialog,
    overviewDialogFields,
    overviewKindButtons,
    overviewSaveButton,
    overviewCancelButton,
    dateInput,
    planCountSelects,
    planAddSlotButtons,
    planSlotCells,
    planDeleteButtons,
    planImages,
    planImageFrames,
    planImageInputs,
    planImageClearButtons,
    autoChartPlots,
    slides,
    navButtons,
    fields,
    fieldRefs,
    listeners,
    container: {
      querySelector(selector) {
        return selector === '[data-report-deck-editor]' ? root : null;
      },
    },
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
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

test('util runtime browser adapter registers init boot save and closer hooks', async () => {
  const { context, registered } = createContext();

  assert.equal(typeof registered.initializers.get('util'), 'function');
  assert.equal(typeof registered.initializers.get('report'), 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckSingleHtml, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.printReportDeckPdf, 'function');
  assert.match(adapterSource, /data-report-export-viewer/);
  assert.match(adapterSource, /data-report-export-fullscreen/);
  assert.match(adapterSource, /data-report-export-print/);
  assert.match(adapterSource, /report-print-viewer/);
  assert.match(adapterSource, /report-print-page/);
  assert.match(adapterSource, /report-print-slide-frame/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_PAGE_WIDTH\s*=\s*'297mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_PAGE_HEIGHT\s*=\s*'210mm'/);
  assert.match(adapterSource, /REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT\s*=\s*'167\.0625mm'/);
  assert.match(adapterSource, /REPORT_DECK_CAPTURE_SLIDE_WIDTH\s*=\s*2560/);
  assert.match(adapterSource, /REPORT_DECK_CAPTURE_SLIDE_HEIGHT\s*=\s*1440/);
  assert.match(adapterSource, /captureReportDeckSlideImageUrl/);
  assert.match(adapterSource, /report-print-slide-image/);
  assert.match(adapterSource, /image\/svg\+xml;charset=utf-8/);
  assert.match(adapterSource, /if \(!String\(source \|\| ''\)\.trim\(\) \|\| image\.complete\) return Promise\.resolve\(\);/);
  assert.match(adapterSource, /getReportDeckPrintableSlides/);
  assert.match(adapterSource, /divideReportDeckMetricValues/);
  assert.match(adapterSource, /normalizeReportDeckPositiveMetric/);
  assert.match(runtimeSource, /formatReportDeckAutoPercentOrBlank/);
  assert.match(runtimeSource, /formatReportDeckAutoNumberOrBlank/);
  assert.match(runtimeSource, /String\(rowKey\) === '2'/);
  assert.match(adapterSource, /@page \{ size: \$\{REPORT_DECK_PRINT_PAGE_WIDTH\} \$\{REPORT_DECK_PRINT_PAGE_HEIGHT\}; margin: 0; \}/);
  assert.match(adapterSource, /height:\s*\$\{REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT\} !important; margin: 0 auto !important/);
  assert.match(adapterSource, /\*::-webkit-scrollbar \{ width: 0 !important; height: 0 !important; display: none !important; \}/);
  assert.equal(registered.bootTasks.size, 3);
  assert.ok(registered.closers.size >= 10);

  const utilContainer = {};
  registered.initializers.get('util')({
    category: { content: '' },
    container: utilContainer,
  });
  assert.equal(registered.meteringInitCount, 1);
  assert.equal(registered.sheetReportContainers[0], utilContainer);

  const reportContainer = {};
  registered.initializers.get('report')({
    category: { content: '' },
    container: reportContainer,
  });
  assert.equal(registered.sheetReportContainers[1], reportContainer);

  const providerFactory = registered.saveProviders.get('util-shared-save');
  const provider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(provider.canSave, true);
  assert.equal(provider.priority, 120);
  assert.deepEqual(await provider.perform({ trigger: 'manual' }), { ok: true, trigger: 'manual' });
  assert.equal(registered.manualSaveCalls.length, 1);
  assert.equal(registered.manualSaveCalls[0]?.trigger, 'manual');
});

test('report deck auto chart labels render above markers and avoid only different-value overlaps', () => {
  assert.match(runtimeSource, /function countReportDeckChartLabelCollisions/);
  assert.match(runtimeSource, /existing\.text === candidate\.text/);
  assert.match(runtimeSource, /baseLabelY: y - 11/);
  assert.match(runtimeSource, /\$\{markers\}\s+\$\{labels\}\s+\$\{hitTargets\.join\(''\)\}/);
  assert.doesNotMatch(runtimeSource, /function buildReportDeckChartHighlightMarkerSvg/);
  assert.doesNotMatch(runtimeSource, /function buildReportDeckChartHighlightRingSvg/);
  assert.match(runtimeSource, /data-report-chart-highlight-point="true"/);
  assert.match(runtimeSource, /data-report-chart-highlight-selected="\$\{selectedValue\}"/);
  assert.match(runtimeSource, /function syncReportDeckChartHighlightPointStates/);
  assert.match(runtimeSource, /button\.textContent = active/);
  assert.match(runtimeSource, /function toggleReportDeckChartHighlightRange/);
  assert.match(runtimeSource, /function clearReportDeckChartHighlights/);
  assert.match(runtimeSource, /report-chart-highlight-range/);
  assert.match(runtimeSource, /is-range-start/);
  assert.match(runtimeSource, /buildReportDeckProductionYieldAnalysis/);
  assert.match(runtimeSource, /const plotLeft = 34;/);
  assert.match(runtimeSource, /const plotBottom = 52;/);
});

test('report deck chart highlight click immediately marks the active point and button', () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext();

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.chartHighlightButton,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightButton.classList.contains('is-active'), true);
  assert.equal(deckDom.chartHighlightButton.textContent, '\uAC15\uC870\uC911');

  deckDom.listeners.click({
    target: deckDom.chartHighlightPoint,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-highlighted'), true);
  assert.equal(deckDom.chartHighlightPoint.attributes['data-report-chart-highlight-selected'], 'true');
  assert.equal(deckDom.chartHighlightButton.classList.contains('has-highlight'), true);
  assert.equal(deckDom.chartHighlightButton.textContent, '\uAC15\uC870\uC911 1');
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), true);

  deckDom.listeners.click({
    target: deckDom.chartHighlightResetButton,
    preventDefault() {},
  });

  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-highlighted'), false);
  assert.equal(deckDom.chartHighlightPoint.attributes['data-report-chart-highlight-selected'], 'false');
  assert.equal(deckDom.chartHighlightButton.classList.contains('has-highlight'), false);
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), false);
});

test('report deck chart range highlight selects a start point and stores a range', () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext();

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.chartHighlightRangeButton,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightRangeButton.classList.contains('is-active'), true);
  assert.equal(deckDom.chartHighlightRangeButton.textContent, '\u25A1');

  deckDom.listeners.click({
    target: deckDom.chartHighlightPoint,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-range-start'), true);

  deckDom.listeners.click({
    target: deckDom.chartHighlightSecondPoint,
    preventDefault() {},
  });
  assert.equal(deckDom.chartHighlightPoint.classList.contains('is-range-start'), false);
  assert.equal(deckDom.chartHighlightRangeButton.classList.contains('has-highlight'), true);
  assert.equal(deckDom.chartHighlightResetButton.classList.contains('has-highlight'), true);
});

test('report deck memo dialogs defer heavy work and cache repeated candidate results', () => {
  assert.match(runtimeSource, /function waitReportDeckUiFrame/);
  assert.match(runtimeSource, /await waitReportDeckUiFrame\(\);[\s\S]*buildReportDeckMemoOverview/);
  assert.match(runtimeSource, /await waitReportDeckUiFrame\(\);[\s\S]*buildReportDeckMemoCandidates/);
  assert.match(runtimeSource, /memoCandidateCache:\s*new Map\(\)/);
  assert.match(runtimeSource, /memoOverviewCache:\s*new Map\(\)/);
  assert.match(runtimeSource, /buildReportDeckMemoCandidateCacheKey/);
  assert.match(adapterSource, /function getReportDeckMemoBuildCacheMap/);
  assert.match(adapterSource, /skipUtilityReady:\s*true/);
  assert.match(adapterSource, /'productionStats'/);
  assert.match(adapterSource, /'electricRows'/);
  assert.match(adapterSource, /'lineValueMaps'/);
  assert.match(adapterSource, /'wasteRows'/);
});

test('util runtime browser adapter builds production team 1 start chart model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    ['2024-01', [
      { dateLabel: '2024-01-02', lineName: 'SD', amount: 500000 },
      { dateLabel: '2024-01-03', lineName: 'MSD', amount: 200000 },
      { dateLabel: '2024-01-04', lineName: 'ICA', amount: 400000 },
      { dateLabel: '2024-01-05', lineName: '지대', amount: 300000 },
    ]],
    ['2025-01', [
      { dateLabel: '2025-01-02', lineName: 'SD', amount: 800000 },
      { dateLabel: '2025-01-03', lineName: 'MSD', amount: 200000 },
      { dateLabel: '2025-01-04', lineName: 'ICA', amount: 600000 },
      { dateLabel: '2025-01-05', lineName: '지대', amount: 500000 },
    ]],
    ['2025-12', [
      { dateLabel: '2025-12-02', lineName: 'SD', amount: 700000 },
      { dateLabel: '2025-12-03', lineName: 'MSD', amount: 250000 },
      { dateLabel: '2025-12-04', lineName: 'ICA', amount: 640000 },
      { dateLabel: '2025-12-05', lineName: '지대', amount: 560000 },
    ]],
    ['2026-01', [
      { dateLabel: '2026-01-02', lineName: 'S/D 건조', amount: 900000 },
      { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300000 },
      { dateLabel: '2026-01-04', lineName: 'ICA', amount: 660000 },
      { dateLabel: '2026-01-05', lineName: '지대', amount: 540000 },
    ]],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter(entry => {
      const isPart2 = String(teamName).includes('2');
      const lineToken = String(entry.lineName || '').replace(/[^a-z0-9가-힣]/gi, '').toLowerCase();
      return isPart2
        ? (entry.lineName === 'ICA' || entry.lineName === '지대')
        : (lineToken.includes('sd') || lineToken.includes('msd'));
    });
    return { period: null, entries };
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionStartAnalysis('2026-01', {
    teamKey: 'team_01',
  });

  assert.equal(model.ok, true);
  assert.equal(model.monthKeys[0], '2024-01');
  assert.equal(model.monthKeys.at(-1), '2026-01');
  assert.equal(model.monthKeys.length, 4);
  assert.equal(model.monthKeys.includes('2023-01'), false);
  const part1 = model.parts.find(part => part.key === 'part1');
  const sd = part1.rows.find(row => row.key === 'sd');
  const total = part1.rows.find(row => row.key === 'total');
  assert.equal(sd.reference, 800);
  assert.equal(sd.previous, 700);
  assert.equal(sd.current, 900);
  assert.equal(sd.momIndex, 900 / 700 * 100);
  assert.equal(sd.yoyIndex, 900 / 800 * 100);
  assert.equal(sd.yoyRate, 100 / 800);
  assert.equal(total.current, 1200);
  assert.equal(JSON.stringify(part1.chart.monthKeys), JSON.stringify(['2024-01', '2025-01', '2025-12', '2026-01']));
  assert.equal(JSON.stringify(part1.chart.series[0].points.map(point => point.value)), JSON.stringify([500, 800, 700, 900]));
  assert.equal(part1.chart.series[0].points.length, 4);
  assert.equal(part1.chart.series[0].points.at(-1).monthKey, '2026-01');
  assert.equal(part1.chart.series[0].points.at(-1).value, 900);

  const earlyModel = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionStartAnalysis('2025-01', {
    teamKey: 'team_01',
  });
  assert.equal(earlyModel.monthKeys.includes('2023-01'), false);
  assert.equal(JSON.stringify(earlyModel.parts.find(part => part.key === 'part1').chart.monthKeys), JSON.stringify(['2024-01', '2025-01']));
});

test('util runtime browser adapter builds production team 1 yield model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    ['2025-01', [
      { dateLabel: '2025-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 90 },
      { dateLabel: '2025-01-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 80 },
      { dateLabel: '2025-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 95 },
      { dateLabel: '2025-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 97 },
    ]],
    ['2025-12', [
      { dateLabel: '2025-12-02', lineName: 'SD', amount: 100, moistureExcludedYield: 92 },
      { dateLabel: '2025-12-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 82 },
      { dateLabel: '2025-12-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 96 },
      { dateLabel: '2025-12-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 98 },
    ]],
    ['2026-01', [
      { dateLabel: '2026-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 96 },
      { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300, moistureExcludedYield: 84 },
      { dateLabel: '2026-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 98 },
      { dateLabel: '2026-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 100 },
    ]],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter(entry => {
      const isPart2 = String(teamName).includes('2');
      const lineName = String(entry.lineName || '');
      return isPart2
        ? (lineName === 'ICA' || lineName === '\uC9C0\uB300')
        : (lineName === 'SD' || lineName === 'MSD');
    });
    return { period: null, entries };
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionYieldAnalysis('2026-01', {
    teamKey: 'team_01',
  });

  assert.equal(model.ok, true);
  assert.equal(model.monthKeys[0], '2025-01');
  assert.equal(model.monthKeys.at(-1), '2026-01');
  const part1 = model.parts.find(part => part.key === 'part1');
  const sd = part1.rows.find(row => row.key === 'sd');
  const total = part1.rows.find(row => row.key === 'total');
  assert.equal(sd.current, 96);
  assert.equal(total.reference, 85);
  assert.equal(total.previous, 87);
  assert.equal(total.current, 87);
  assert.equal(total.yoyDelta, 2);
  assert.equal(total.yoyIndex, 87 / 85 * 100);
  assert.equal(JSON.stringify(part1.chart.series.map(series => series.key)), JSON.stringify(['sd', 'msd']));
  assert.equal(JSON.stringify(part1.chart.series[0].points.map(point => point.value)), JSON.stringify([90, 92, 96]));
  const part2 = model.parts.find(part => part.key === 'part2');
  assert.equal(part2.rows.length, 1);
  assert.equal(part2.rows[0].current, 99);
  assert.equal(part2.chart.series[0].key, 'total');
  assert.equal(JSON.stringify(part2.chart.series[0].points.map(point => point.value)), JSON.stringify([96, 97, 99]));
});

test('util runtime browser adapter reads and writes report deck module records', async () => {
  const fetchCalls = [];
  const { context } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            module_key: 'report_runtime',
            record_key: 'cover',
            payload: { title: '서버 보고서' },
            version: 2,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });

  const adapter = context.KpiUtilRuntimeBrowserAdapter;
  assert.equal(adapter.getReportRuntimeConfig().moduleKey, 'report_runtime');
  assert.equal(adapter.getReportRuntimeConfig().recordKey, 'cover');

  const loaded = await adapter.fetchReportDeckCover({ recordKey: 'report_2026_05' });
  assert.equal(loaded.record.payload.title, '서버 보고서');
  assert.equal(fetchCalls[0].url, '/api/modules/report_runtime/records/report_2026_05');
  assert.equal(fetchCalls[0].options.method, 'GET');

  await adapter.saveReportDeckCover({ title: '수정 보고서' }, { recordKey: 'report_2026_05' });
  assert.equal(fetchCalls[1].url, '/api/modules/report_runtime/records/report_2026_05');
  assert.equal(fetchCalls[1].options.method, 'PUT');
  assert.deepEqual(JSON.parse(fetchCalls[1].options.body), {
    payload: { title: '수정 보고서' },
  });

  const sharedStore = await adapter.fetchMeteringSharedStore();
  assert.equal(fetchCalls[2].url, '/api/shared-store');
  assert.equal(fetchCalls[2].options.method, 'GET');
  assert.equal(sharedStore.store.resourceDatasets.electric.billingSettlementEntries['2025-12'].scopes.bukjeong.completed, true);
});

test('util runtime browser adapter uploads report deck images as managed files', async () => {
  const fetchCalls = [];
  const { context } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          document: { id: 'doc-report-image-1' },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL() {
      this.result = 'data:image/png;base64,QUJD';
      this.onload?.();
    }
  };

  const imageUrl = await context.KpiUtilRuntimeBrowserAdapter.uploadReportDeckImage(
    { name: 'slide.png', type: 'image/png' },
    { recordKey: 'report_2025_11', fieldKey: 'slide8BeforeImage1' }
  );

  assert.equal(imageUrl, '/api/files/doc-report-image-1/view');
  assert.equal(fetchCalls[0].url, '/api/files/base64');
  assert.equal(fetchCalls[0].options.method, 'POST');
  const body = JSON.parse(fetchCalls[0].options.body);
  assert.equal(body.permissionKey, 'util.metering.app');
  assert.equal(body.ownerDomain, 'report.runtime');
  assert.equal(body.ownerKey, 'report_2025_11');
  assert.equal(body.fileCategory, 'image');
  assert.equal(body.originalName, 'slide.png');
  assert.equal(body.mimeType, 'image/png');
  assert.equal(body.base64Data, 'QUJD');
  assert.equal(body.metadata.fieldKey, 'slide8BeforeImage1');
});

test('util runtime browser adapter builds bukjeong report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetConfig = {
    UTIL_GAS_BILLING_SCOPE_KEYS: {
      bukjeong: 'gas_bukjeong',
      yusanLng: 'yusan_lng',
    },
  };
  context.KPIUtilReportSheetBilling = {
    getUtilGasBillingScopeFields(monthKey, scopeKey) {
      const fields = {
        '2025-04|gas_bukjeong': { power_charge: '950', billing_amount: '1,000' },
        '2026-03|gas_bukjeong': { power_charge: '870', billing_amount: '920' },
        '2026-04|gas_bukjeong': { power_charge: '850', billing_amount: '900' },
      };
      return fields[`${monthKey}|${scopeKey}`] || {};
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_01');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2026-04'));
      assert.equal(monthKeys.includes('2026-05'), false);
      return new Map([
        ['2025-04', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2026-03', { production: 75, lngUsage: 8, gasCost: 920, ratioProduction: { lng: 75 } }],
        ['2026-04', { production: 80, lngUsage: 9, gasCost: 900, ratioProduction: { lng: 80 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'team_01_01');
      return [
        { monthKey: '2025-04', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2026-03', production: 75, electricUsage: 15, electricCost: 95 },
        { monthKey: '2026-04', production: 80, electricUsage: 16, electricCost: 90 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckBukjeongAnalysis('2026-04', {
    store: {
      resourceDatasets: {
        electric: { equipmentEntries: { electric_field: true } },
        gas: { equipmentEntries: { gas_field: true } },
      },
    },
  });

  assert.equal(model.ok, true);
  assert.equal(context.__LOCAL_APP_STORE__.resourceDatasets.electric.equipmentEntries.electric_field, true);
  assert.equal(context.__PRESET_GAS_ENTRIES__.gas_field, true);
  assert.equal(model.monthLabels.reference, '25.04');
  assert.equal(model.monthLabels.current, '26.04');
  assert.equal(model.monthLabels.previous, '26.03');
  assert.equal(model.gas.rows.production.reference, 100);
  assert.equal(model.gas.rows.production.current, 80);
  assert.equal(model.gas.rows.production.delta, -20);
  assert.equal(model.gas.rows.production.previous, 75);
  assert.equal(model.gas.rows.production.monthDelta, 5);
  assert.equal(model.gas.rows.production.monthRate, 5 / 75);
  assert.equal(model.gas.rows.usage.rate, -0.1);
  assert.equal(model.gas.rows.usage.previous, 8);
  assert.equal(model.gas.rows.usage.monthDelta, 1);
  assert.equal(model.gas.rows.usage.monthRate, 1 / 8);
  assert.equal(model.gas.rows.cost.reference, 950);
  assert.equal(model.gas.rows.cost.current, 850);
  assert.equal(model.gas.rows.cost.delta, -100);
  assert.equal(model.gas.rows.cost.previous, 870);
  assert.equal(model.gas.rows.cost.monthDelta, -20);
  assert.equal(model.gas.rows.cost.monthRate, -20 / 870);
  assert.equal(model.electric.rows.usage.delta, -4);
  assert.equal(model.electric.rows.usage.previous, 15);
  assert.equal(model.electric.rows.usage.monthDelta, 1);
  assert.equal(model.electric.rows.usage.monthRate, 1 / 15);
  assert.equal(model.electric.rows.cost.current, 90);
  assert.equal(model.gas.chart.series[2].points[3].value, 9 / 80);
  assert.equal(model.gas.chart.series[2].points[4].value, null);
});

test('util runtime browser adapter caps report analysis data at selected month', async () => {
  const { context } = createContext();
  const settledMonths = Array.from({ length: 24 }, (_, index) => {
    const year = index < 12 ? 2024 : 2025;
    const month = (index % 12) + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }).reverse();

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_01');
      assert.equal(monthKeys[0], '2024-01');
      assert.equal(monthKeys.at(-1), '2025-11');
      assert.equal(monthKeys.includes('2023-12'), false);
      assert.equal(monthKeys.includes('2025-12'), false);
      return new Map([
        ['2024-11', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2024-12', { production: 120, lngUsage: 12, gasCost: 1200, ratioProduction: { lng: 120 } }],
        ['2025-11', { production: 80, lngUsage: 8, gasCost: 900, ratioProduction: { lng: 80 } }],
        ['2025-12', { production: 1, lngUsage: 1, gasCost: 1, ratioProduction: { lng: 1 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2025-11');
      assert.equal(option.key, 'team_01_01');
      return [
        { monthKey: '2024-11', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2024-12', production: 120, electricUsage: 24, electricCost: 120 },
        { monthKey: '2025-11', production: 80, electricUsage: 16, electricCost: 90 },
        { monthKey: '2025-12', production: 1, electricUsage: 1, electricCost: 1 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckUtilityAnalysis('2025-11', {
    availableMonths: settledMonths,
  });

  assert.equal(model.ok, true);
  assert.equal(JSON.stringify(model.gas.chart.series.map(item => item.key)), JSON.stringify(['2024', '2025']));
  assert.equal(model.monthLabels.reference, '24.11');
  assert.equal(model.monthLabels.current, '25.11');
  assert.equal(model.gas.rows.usage.reference, 10);
  assert.equal(model.gas.rows.usage.current, 8);
  assert.equal(model.electric.rows.usage.reference, 20);
  assert.equal(model.electric.rows.usage.current, 16);
  assert.equal(model.gas.chart.series[0].points[11].value, 12 / 120);
  assert.equal(model.gas.chart.series[1].points[10].value, 8 / 80);
  assert.equal(model.gas.chart.series[1].points[11].value, null);
  assert.equal(model.electric.chart.series[1].points[11].value, null);
});

test('util runtime report deck rendering omits null future month values', async () => {
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
    fetchImpl: async (url, _options = {}) => {
      if (url === '/api/shared-store') {
        const scopedRecord = (monthValue, scopeKeys) => ({
          monthValue,
          scopes: Object.fromEntries(scopeKeys.map((scopeKey) => [scopeKey, createCompletedSettlement(monthValue)])),
        });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: {
              resourceDatasets: {
                electric: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['yusan', 'bukjeong']),
                  },
                },
                gas: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['gas_bukjeong', 'yusan_lng', 'yusan_lpg']),
                  },
                },
                waste: {
                  billingSettlementEntries: {
                    '2025-11': scopedRecord('2025-11', ['waste_bukjeong', 'waste_yusan']),
                  },
                },
              },
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            module_key: 'report_runtime',
            record_key: 'report_2025_11',
            payload: {},
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap() {
      return new Map([
        ['2024-11', { production: 100, lngUsage: 10, gasCost: 1000, ratioProduction: { lng: 100 } }],
        ['2025-11', { production: 80, lngUsage: 8, gasCost: 900, ratioProduction: { lng: 80 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows() {
      return [
        { monthKey: '2024-11', production: 100, electricUsage: 20, electricCost: 100 },
        { monthKey: '2025-11', production: 80, electricUsage: 16, electricCost: 90 },
      ];
    },
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  await flushMicrotasks();

  assert.equal(deckDom.root.dataset.reportMonth, '2025-11');
  assert.match(deckDom.autoChartPlots.gas.innerHTML, />0\.100</);
  assert.doesNotMatch(deckDom.autoChartPlots.gas.innerHTML, />0\.000</);
  assert.match(deckDom.autoChartPlots.electric.innerHTML, />0\.200</);
  assert.doesNotMatch(deckDom.autoChartPlots.electric.innerHTML, />0\.000</);
});

test('util runtime browser adapter builds yusan report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      return { key: value };
    },
    getUtilElectricMeterTeamOption(value) {
      assert.equal(value, 'combined');
      return {
        key: value,
        reportTeamFilters: ['1팀 2파트', '2팀', '3팀', '관리동'],
        productionTeamNames: ['1팀 2파트', '2팀', '3팀'],
      };
    },
    getUtilElectricAnalysisTeamOption(value) {
      return { key: value };
    },
  };
  context.KPIUtilReportSheetConfig = {
    UTIL_GAS_BILLING_SCOPE_KEYS: {
      bukjeong: 'gas_bukjeong',
      yusanLng: 'yusan_lng',
    },
  };
  context.KPIUtilReportSheetBilling = {
    getUtilGasBillingScopeFields(monthKey, scopeKey) {
      const fields = {
        '2025-04|yusan_lng': { power_charge: '2,900', billing_amount: '3,000' },
        '2026-04|yusan_lng': { power_charge: '2,400', billing_amount: '2,500' },
      };
      return fields[`${monthKey}|${scopeKey}`] || {};
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'yusan');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2026-04'));
      assert.equal(monthKeys.includes('2026-05'), false);
      return new Map([
        ['2025-04', { production: 300, lngUsage: 30, lngCost: 3000, lpgCost: 700, gasCost: 3700, ratioProduction: { lng: 300 } }],
        ['2026-04', { production: 240, lngUsage: 24, lngCost: 2500, lpgCost: 800, gasCost: 3300, ratioProduction: { lng: 240 } }],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'yusan');
      assert.deepEqual(option.reportTeamFilters, ['1팀 2파트', '2팀', '3팀', '관리동']);
      assert.deepEqual(option.productionTeamNames, ['1팀 2파트', '2팀', '3팀']);
      return [
        { monthKey: '2025-04', production: 300, electricUsage: 60, electricCost: 600 },
        { monthKey: '2026-04', production: 240, electricUsage: 48, electricCost: 500 },
      ];
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckUtilityAnalysis('2026-04', {
    scopeKey: 'yusan',
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'yusan');
  assert.equal(model.scopeLabel, '유산');
  assert.equal(model.gas.rows.production.reference, 300);
  assert.equal(model.gas.rows.usage.current, 24);
  assert.equal(model.gas.rows.cost.reference, 2900);
  assert.equal(model.gas.rows.cost.current, 2400);
  assert.equal(model.gas.rows.cost.delta, -500);
  assert.equal(model.electric.rows.usage.delta, -12);
  assert.match(model.gas.chart.title, /유산 LNG/);
  assert.match(model.electric.chart.title, /유산 전기/);
});

test('util runtime browser adapter builds yusan team 1 part 2 LPG report model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      assert.equal(value, 'team_01_02');
      return { key: value };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    buildUtilGasAnalysisMetricMap(monthKeys, option) {
      assert.equal(option.key, 'team_01_02');
      assert.ok(monthKeys.includes('2024-01'));
      assert.ok(monthKeys.includes('2025-11'));
      assert.equal(monthKeys.includes('2025-12'), false);
      return new Map([
        ['2024-11', {
          production: 1000,
          lpgUsage: 70,
          lpgCost: 9300,
          lngCost: 12000,
          lpgConversionCost: 10000,
          gasCost: 21300,
          ratioProduction: { lpg: 1000 },
        }],
        ['2025-10', {
          production: 780,
          lpgUsage: 60,
          lpgCost: 8200,
          lngCost: 19000,
          lpgConversionCost: 15000,
          gasCost: 27200,
          ratioProduction: { lpg: 780 },
        }],
        ['2025-11', {
          production: 800,
          lpgUsage: 64,
          lpgCost: 8600,
          lngCost: 20000,
          lpgConversionCost: 16000,
          gasCost: 28600,
          ratioProduction: { lpg: 800 },
        }],
      ]);
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckYusanLpgAnalysis('2025-11', {
    availableMonths: ['2024-11', '2025-10', '2025-11', '2025-12'],
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'yusan_lpg_team_01_02');
  assert.equal(model.monthLabels.reference, '24.11');
  assert.equal(model.monthLabels.current, '25.11');
  assert.equal(model.monthLabels.previous, '25.10');
  assert.equal(model.rows.production.reference, 1000);
  assert.equal(model.rows.production.current, 800);
  assert.equal(model.rows.production.previous, 780);
  assert.equal(model.rows.production.monthDelta, 20);
  assert.equal(model.rows.production.monthRate, 20 / 780);
  assert.equal(model.rows.usage.reference, 70);
  assert.equal(model.rows.usage.current, 64);
  assert.equal(model.rows.usage.previous, 60);
  assert.equal(model.rows.usage.monthDelta, 4);
  assert.equal(model.rows.usage.monthRate, 4 / 60);
  assert.equal(model.rows.amount.reference, 9300);
  assert.equal(model.rows.amount.current, 8600);
  assert.equal(model.rows.amount.delta, -700);
  assert.equal(model.rows.amount.rate, -700 / 9300);
  assert.equal(model.rows.amount.previous, 8200);
  assert.equal(model.rows.amount.monthDelta, 400);
  assert.equal(model.rows.amount.monthRate, 400 / 8200);
  assert.equal(model.costRows[0].reference, 9300);
  assert.equal(model.costRows[0].current, 8600);
  assert.equal(model.costRows[0].previous, 8200);
  assert.equal(model.costRows[1].reference, 10000);
  assert.equal(model.costRows[1].current, 16000);
  assert.equal(model.costRows[1].previous, 15000);
  assert.equal(model.costRows[2].reference, 9300 / 10000);
  assert.equal(model.costRows[2].current, 8600 / 16000);
  assert.equal(model.costRows[2].previous, 8200 / 15000);
  assert.ok(Math.abs(model.costRows[2].delta - ((8600 / 16000) - (9300 / 10000))) < 1e-12);
  assert.ok(Math.abs(model.costRows[2].rate - (((8600 / 16000) - (9300 / 10000)) / (9300 / 10000))) < 1e-12);
  assert.equal(model.costChart.title, 'LPG 실제 금액 / LNG 환산 금액');
  assert.equal(model.costChart.series.find(item => item.key === '2025').points.find(point => point.month === 11).value, 8600 / 16000);
  assert.equal(model.chart.series.find(item => item.key === '2025').points.find(point => point.month === 11).value, 0.08);
  assert.equal(model.chart.series.find(item => item.key === '2025').points.find(point => point.month === 12).value, null);
});

test('util runtime browser adapter builds report memo candidates with direction markers', async () => {
  const { context } = createContext();
  const monthly = new Map([
    ['2025-04', { production: 1100, lng: 75, lpg: 40 }],
    ['2026-03', { production: 800, lng: 65, lpg: 60 }],
    ['2026-04', { production: 1000, lng: 70, lpg: 50 }],
  ]);

  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      if (value === 'team_02') {
        return {
          key: 'team_01_02',
          usageTeams: {
            lpg: ['1팀 2파트 (LPG)'],
          },
        };
      }
      assert.equal(value, 'team_01_02');
      return {
        key: value,
        usageTeams: {
          lng: ['1팀 2파트 (LNG)'],
          lpg: ['1팀 2파트 (LPG)'],
        },
      };
    },
    getUtilElectricAnalysisTeamOption(value) {
      const teamLabels = {
        team_01_01: '1팀 1파트',
        team_01_02: '1팀 2파트',
        team_02: '2팀',
        team_03: '3팀',
      };
      assert.ok(Object.prototype.hasOwnProperty.call(teamLabels, value));
      return {
        key: value,
        label: teamLabels[value],
        reportTeamFilters: [teamLabels[value]],
        productionTeamNames: [teamLabels[value]],
      };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    getUtilGasAnalysisProductionValue(monthKey, teamNames) {
      assert.equal(JSON.stringify(teamNames), JSON.stringify(['1팀 2파트']));
      return monthly.get(monthKey)?.production ?? NaN;
    },
    getUtilGasAnalysisTeamUsageValue(monthKey, teamNames) {
      if (teamNames.includes('1팀 2파트 (LPG)')) return monthly.get(monthKey)?.lpg ?? NaN;
      if (teamNames.includes('1팀 2파트 (LNG)')) return monthly.get(monthKey)?.lng ?? NaN;
      return NaN;
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2025-04');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'team_01_02');
      return [
        { monthKey: '2025-04', electricUsage: 120 },
        { monthKey: '2026-03', electricUsage: 90 },
        { monthKey: '2026-04', electricUsage: 100 },
      ];
    },
    buildUtilElectricAnalysisLineRatioSeries(monthKeys, option) {
      assert.equal(JSON.stringify(monthKeys), JSON.stringify(['2025-04', '2026-03', '2026-04']));
      if (option.productionTeamNames?.[0] !== '1팀 1파트') return [];
      return [
        {
          key: 'productionLineRatio::1팀 1파트::SD',
          title: 'SD',
          points: [
            { monthKey: '2025-04', amountValue: 800 },
            { monthKey: '2026-03', amountValue: 500 },
            { monthKey: '2026-04', amountValue: 700 },
          ],
        },
        {
          key: 'productionLineRatio::1팀 1파트::MSD',
          title: 'MSD',
          points: [
            { monthKey: '2025-04', amountValue: 300 },
            { monthKey: '2026-03', amountValue: 280 },
            { monthKey: '2026-04', amountValue: 260 },
          ],
        },
      ];
    },
  };

  const production = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'production',
  });
  assert.equal(production.ok, true);
  assert.equal(JSON.stringify(production.availableMetricKeys), JSON.stringify([
    'production',
    'electric',
    'lng',
    'lpg',
    'yield_rate',
    'operation_rate',
    'production_days',
    'off_days',
    'product_count',
    'production_line::지대',
    'production_line::ICA',
  ]));
  assert.equal(production.candidates.length, 1);
  assert.equal(production.candidates[0].direction, 'mixed');
  assert.match(production.candidates[0].text, /1팀 2파트 생산량 1,000kg 전월대비 200kg, 25\.0% ↑, 전년대비 100kg, 9\.1% ↓/);
  assert.equal(production.candidates[0].segments[0].direction, 'up');
  assert.equal(production.candidates[0].segments[1].direction, 'down');

  const electric = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric',
  });
  assert.equal(electric.candidates[0].direction, 'mixed');
  assert.match(electric.candidates[0].text, /전력량 100kWh 전월대비 10kWh, 11\.1% ↑, 전년대비 20kWh, 16\.7% ↓/);

  const lpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg',
  });
  assert.equal(lpg.candidates[0].direction, 'mixed');
  assert.match(lpg.candidates[0].text, /LPG 사용량 50kg 전월대비 10kg, 16\.7% ↓, 전년대비 10kg, 25\.0% ↑/);

  const otherTeamLpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lpg',
  });
  assert.equal(otherTeamLpg.ok, true);
  assert.equal(JSON.stringify(otherTeamLpg.availableMetricKeys), JSON.stringify([
    'production',
    'electric',
    'yield_rate',
    'operation_rate',
    'production_days',
    'off_days',
    'product_count',
    'production_line::로터리·버티컬',
    'production_line::스틱',
  ]));
  assert.equal(otherTeamLpg.metricKey, 'lpg');
  assert.equal(otherTeamLpg.candidates.length, 0);

  const otherTeamLng = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lng',
  });
  assert.equal(otherTeamLng.ok, true);
  assert.equal(JSON.stringify(otherTeamLng.availableMetricKeys), JSON.stringify([
    'production',
    'electric',
    'yield_rate',
    'operation_rate',
    'production_days',
    'off_days',
    'product_count',
    'production_line::로터리·버티컬',
    'production_line::스틱',
  ]));
  assert.equal(otherTeamLng.metricKey, 'lng');
  assert.equal(otherTeamLng.candidates.length, 0);

  const lineProduction = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'production_line::SD',
  });
  assert.equal(lineProduction.ok, true);
  assert.equal(JSON.stringify(lineProduction.availableMetricKeys), JSON.stringify([
    'production',
    'electric',
    'lng',
    'yield_rate',
    'operation_rate',
    'production_days',
    'off_days',
    'product_count',
    'production_line::SD',
    'production_line::MSD',
  ]));
  assert.equal(lineProduction.candidates.length, 1);
  assert.equal(lineProduction.candidates[0].direction, 'mixed');
  assert.match(lineProduction.candidates[0].text, /1팀 1파트 SD 생산량 700kg 전월대비 200kg, 40\.0% ↑, 전년대비 100kg, 12\.5% ↓/);
});

test('util runtime browser adapter builds report memo overview with current values', async () => {
  const { context } = createContext();
  const teamLabels = {
    team_01_01: '1팀 1파트',
    team_01_02: '1팀 2파트',
    team_02: '2팀',
    team_03: '3팀',
  };
  const monthly = new Map([
    ['2025-04', { production: 1100, electric: 120 }],
    ['2026-03', { production: 800, electric: 90 }],
    ['2026-04', { production: 1000, electric: 100 }],
  ]);
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      const label = teamLabels[value] || value;
      return {
        key: value,
        usageTeams: {
          lng: [`${label} (LNG)`],
          lpg: value === 'team_01_02' ? [`${label} (LPG)`] : [],
        },
      };
    },
    getUtilElectricAnalysisTeamOption(value) {
      const label = teamLabels[value] || value;
      return {
        key: value,
        label,
        reportTeamFilters: [label],
        productionTeamNames: [label],
      };
    },
  };
  context.KPIUtilReportSheetGasScopedMetrics = {
    getUtilGasAnalysisProductionValue(monthKey) {
      return monthly.get(monthKey)?.production ?? NaN;
    },
    getUtilGasAnalysisTeamUsageValue() {
      return NaN;
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds) {
      assert.equal(bounds.from, '2025-04');
      assert.equal(bounds.to, '2026-04');
      return [
        { monthKey: '2025-04', electricUsage: monthly.get('2025-04').electric },
        { monthKey: '2026-03', electricUsage: monthly.get('2026-03').electric },
        { monthKey: '2026-04', electricUsage: monthly.get('2026-04').electric },
      ];
    },
    buildUtilElectricAnalysisLineRatioSeries() {
      return [];
    },
  };

  const overview = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoOverview('2026-04');
  assert.equal(overview.ok, true);
  assert.ok(overview.groups.some(group => group.key === 'team_01_02'));
  const joined = overview.candidates.map(candidate => candidate.text).join('\n');
  assert.match(joined, /1팀 2파트 생산량 1,000kg 전월대비 200kg, 25\.0% ↑, 전년대비 100kg, 9\.1% ↓/);
  assert.match(joined, /전력량 100kWh 전월대비 10kWh, 11\.1% ↑, 전년대비 20kWh, 16\.7% ↓/);
});

test('util runtime browser adapter builds report memo candidates for production stats', async () => {
  const { context } = createContext();
  const makeEntry = (dateLabel, amount, productName, moistureExcludedYield, equipmentCapa) => ({
    dateLabel,
    teamName: '1팀 2파트',
    lineName: 'ICA',
    productName,
    amount,
    moistureExcludedYield,
    equipmentCapa,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 3) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 3) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 3) }],
  ]);
  const entriesByMonth = new Map([
    ['2025-04', [
      makeEntry('2025-04-01', 100, '제품 A', 85, 200),
      makeEntry('2025-04-02', 100, '제품 B', 85, 200),
    ]],
    ['2026-03', [
      makeEntry('2026-03-01', 100, '제품 A', 70, 200),
    ]],
    ['2026-04', [
      makeEntry('2026-04-01', 100, '제품 A', 90, 200),
      makeEntry('2026-04-03', 200, '제품 B', 80, 300),
    ]],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(teamName, '1팀 2파트');
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };
  context.UTIL_PRODUCTION_DAILY_INDEX = {
    '1팀 2파트': Array.from(entriesByMonth.values()).flat(),
  };

  const yieldResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'yield_rate',
  });
  assert.equal(yieldResult.ok, true);
  assert.ok(yieldResult.availableMetricKeys.includes('yield_rate'));
  assert.equal(yieldResult.candidates.length, 1);
  assert.match(yieldResult.candidates[0].text, /1팀 2파트 수율 83\.3% 전월대비 13\.3%p ↑, 전년대비 1\.7%p ↓/);

  const utilizationResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'operation_rate',
  });
  assert.match(utilizationResult.candidates[0].text, /1팀 2파트 가동률 60% 전월대비 10%p ↑, 전년대비 10%p ↑/);

  const productCountResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'product_count',
  });
  assert.match(productCountResult.candidates[0].text, /1팀 2파트 고유 품목수 2개 전월대비 1개, 100\.0% ↑, 전년대비 0개, 0\.0% -/);

  const offDaysResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'off_days',
  });
  assert.match(offDaysResult.candidates[0].text, /1팀 2파트 휴무일수 1일 전월대비 1일, 50\.0% ↓, 전년대비 0일, 0\.0% -/);
});

test('util runtime browser adapter limits waste memo candidates to waste slides', async () => {
  const { context } = createContext();
  const rows = [
    {
      monthKey: '2025-04',
      wasteUsage: 16,
      wasteCost: 1000,
      wasteCostDetails: { water: 100, share: 200, sludge: 300, resin: 250, labor: 150 },
    },
    {
      monthKey: '2026-03',
      wasteUsage: 15,
      wasteCost: 800,
      wasteCostDetails: { water: 80, share: 180, sludge: 220, resin: 200, labor: 120 },
    },
    {
      monthKey: '2026-04',
      wasteUsage: 20,
      wasteCost: 1300,
      wasteCostDetails: { water: 120, share: 260, sludge: 360, resin: 350, labor: 210 },
    },
  ];
  context.KPIUtilReportSheetAnalysisWasteModel = {
    buildUtilWasteAnalysisScopedDatasetResult(monthKey, siteKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(siteKey, 'bukjeong');
      return { allRows: rows };
    },
  };

  const blocked = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_usage',
    memoKey: 'slide5LpgMemo',
  });
  assert.equal(blocked.ok, true);
  assert.equal(blocked.availableMetricKeys.includes('waste_usage'), false);
  assert.equal(blocked.candidates.length, 0);

  const wasteUsage = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_usage',
    memoKey: 'slide6WasteMemo',
  });
  assert.equal(wasteUsage.ok, true);
  assert.ok(wasteUsage.availableMetricKeys.includes('waste_cost_total'));
  assert.match(wasteUsage.candidates[0].text, /북정 폐수량 20m³ 전월대비 5m³, 33\.3% ↑, 전년대비 4m³, 25\.0% ↑/);

  const wasteCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_cost_total',
    memoKey: 'slide6WasteMemo',
  });
  assert.match(wasteCost.candidates[0].text, /북정 폐수 비용 총계 1,300원 전월대비 500원, 62\.5% ↑, 전년대비 300원, 30\.0% ↑/);
});

test('util runtime browser adapter builds waste report analysis model from sheet APIs', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilWasteAnalysisSiteOption(value) {
      assert.equal(value, 'bukjeong');
      return {
        key: value,
        label: '북정',
        wasteTeam: '북정',
        productionTeam: '북정',
      };
    },
  };
  context.KPIUtilReportSheetAnalysisWasteModel = {
    buildUtilWasteAnalysisScopedDatasetResult(monthKey, siteKey) {
      assert.equal(monthKey, '2026-04');
      assert.equal(siteKey, 'bukjeong');
      return {
        allRows: [
          {
            monthKey: '2025-04',
            production: 1000,
            wasteUsage: 20,
            wasteCost: 1000,
            wasteCostDetails: {
              water: 100,
              share: 200,
              sludge: 300,
              resin: 150,
              labor: 250,
            },
          },
          {
            monthKey: '2026-03',
            production: 760,
            wasteUsage: 15,
            wasteCost: 860,
            wasteCostDetails: {
              water: 85,
              share: 190,
              sludge: 240,
              resin: 115,
              labor: 230,
            },
          },
          {
            monthKey: '2026-04',
            production: 800,
            wasteUsage: 16,
            wasteCost: 900,
            wasteCostDetails: {
              water: 90,
              share: 210,
              sludge: 250,
              resin: 120,
              labor: 230,
            },
          },
        ],
      };
    },
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckWasteAnalysis('2026-04', {
    scopeKey: 'bukjeong',
  });

  assert.equal(model.ok, true);
  assert.equal(model.scopeKey, 'bukjeong');
  assert.equal(model.scopeLabel, '북정');
  assert.equal(model.monthLabels.previous, '26.03');
  assert.equal(model.rows.production.reference, 1000);
  assert.equal(model.rows.production.previous, 760);
  assert.equal(model.rows.production.monthDelta, 40);
  assert.equal(model.rows.production.monthRate, 40 / 760);
  assert.equal(model.rows.usage.current, 16);
  assert.equal(model.rows.usage.previous, 15);
  assert.equal(model.rows.usage.monthDelta, 1);
  assert.equal(model.rows.usage.monthRate, 1 / 15);
  assert.equal(model.rows.water.delta, -10);
  assert.equal(model.rows.water.previous, 85);
  assert.equal(model.rows.water.monthDelta, 5);
  assert.equal(model.rows.water.monthRate, 5 / 85);
  assert.equal(model.rows.share.delta, 10);
  assert.equal(model.rows.total.current, 900);
  assert.equal(model.rows.total.previous, 860);
  assert.equal(model.rows.total.monthDelta, 40);
  assert.equal(model.rows.total.monthRate, 40 / 860);
  assert.equal(model.chart.series[2].points[3].value, 16 / 0.8);
  assert.equal(model.chart.series[2].points[4].value, null);
});

test('report deck editor loads and saves through server module records', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      if (options.method === 'GET') {
        const isNovember = String(url).endsWith('/report_2025_11');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                title: isNovember ? '11월 공유 보고서' : 'DB 공유 보고서',
                reportDate: isNovember ? '2025.11.15' : '2025.12.15',
                department: '생산본부 공무환경팀',
                preparedBy: '작성자',
                slide8SlotCount: '3',
                slide8Item1Text: 'DB plan text',
                slide8BeforeImage1: 'data:image/png;base64,AAAA',
              },
              version: 7,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: JSON.parse(options.body).payload,
            version: 8,
            updated_at: '2026-05-15T00:01:00.000Z',
          },
        }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  await flushMicrotasks();
  const titleField = deckDom.fields.find((field) => field.dataset.reportField === 'title');
  const dateField = deckDom.fields.find((field) => field.dataset.reportField === 'reportDate');
  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const team1ContentsTitleField = deckDom.fields.find((field) => field.dataset.reportField === 'productionTeam1ContentsTitle');
  const team1ContentsItem1Field = deckDom.fields.find((field) => field.dataset.reportField === 'productionTeam1ContentsItem1');
  const team1ContentsItem1Ref = deckDom.fieldRefs.find((field) => field.dataset.reportFieldRef === 'productionTeam1ContentsItem1');
  const contentsItem4Field = deckDom.fields.find((field) => field.dataset.reportField === 'contentsItem4');
  assert.equal(titleField.textContent, '12월 실적 보고');
  assert.equal(departmentField.textContent, '생산본부');
  assert.equal(slide8TitleField.textContent, '3. 12월 공사 및 정비 현황 1/1');
  assert.equal(slide9TitleField.textContent, '4. 1월 주요 계획 1/1');
  assert.equal(dateField.textContent, '2026.01.15');
  assert.equal(team1ContentsTitleField.textContent, 'Contents');
  assert.equal(team1ContentsItem1Field.textContent, '생산실적(생산량)');
  assert.equal(team1ContentsItem1Ref.textContent, '생산실적(생산량)');
  assert.equal(contentsItem4Field.textContent, '주요계획');
  assert.equal(deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text').textContent, 'DB plan text');
  assert.equal(deckDom.planImages[0].src, 'data:image/png;base64,AAAA');
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'true');
  assert.equal(deckDom.dateInput.value, '2026-01-15');
  assert.equal(deckDom.status.textContent, '');
  assert.equal(deckDom.monthSelect.value, '2025-12');
  assert.equal(deckDom.monthSelect.disabled, false);
  assert.match(deckDom.monthSelect.innerHTML, /2025-12/);
  assert.doesNotMatch(deckDom.monthSelect.innerHTML, /2026-01/);
  assert.equal(fetchCalls[0].url, '/api/shared-store');
  assert.equal(fetchCalls[1].url, '/api/modules/report_runtime/records/report_2025_12');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(deckDom.root.dataset.reportActiveView, 'hq');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 2');
  assert.equal(deckDom.reportReturnButton.hidden, true);
  assert.equal(deckDom.slides[0].classList.active, true);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(registered.printCount, 1);
  assert.equal(deckDom.root.dataset.reportPrintMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintView, 'all');
  assert.equal(deckDom.slides[0].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[2].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintLast, 'true');
  deckDom.listeners.click({
    target: deckDom.productionContentsJumpButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'public-works');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 8');
  assert.equal(deckDom.reportReturnButton.hidden, false);
  assert.equal(deckDom.slides[2].classList.active, true);
  assert.equal(deckDom.slides[2].pageNumber.textContent, '1/8');
  assert.equal(deckDom.slides[9].pageNumber.textContent, '8/8');
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(registered.printCount, 2);
  assert.equal(deckDom.root.dataset.reportPrintMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintView, 'public-works');
  assert.equal(deckDom.slides[0].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[2].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintLast, 'true');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);
  assert.equal(titleField.textContent, '12월 실적 보고');
  assert.equal(deckDom.status.textContent, '저장 완료');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.editButton.textContent, '수정');

  titleField.textContent = '수정된 공유 보고서';
  deckDom.listeners.input({
    target: titleField,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(slide8TitleField.contenteditable, 'false');
  assert.equal(slide9TitleField.contenteditable, 'false');
  assert.equal(team1ContentsTitleField.contenteditable, 'true');
  assert.equal(team1ContentsItem1Field.contenteditable, 'true');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, false);
  assert.equal(deckDom.planImageInputs[0].disabled, false);
  assert.equal(deckDom.editButton.textContent, '완료');

  titleField.textContent = '수정된 공유 보고서';
  deckDom.listeners.input({
    target: titleField,
  });
  await flushMicrotasks();

  assert.equal(fetchCalls.length, 2);
  assert.equal(titleField.textContent, '12월 실적 보고');
  assert.equal(deckDom.status.textContent, '');

  slide8TitleField.textContent = '수정 불가 제목';
  deckDom.listeners.input({
    target: slide8TitleField,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);
  assert.equal(slide8TitleField.textContent, '3. 12월 공사 및 정비 현황 1/1');
  assert.equal(deckDom.status.textContent, '');

  team1ContentsItem1Field.textContent = '생산량 실적';
  deckDom.listeners.input({
    target: team1ContentsItem1Field,
  });
  await flushMicrotasks();
  assert.equal(team1ContentsItem1Ref.textContent, '생산량 실적');
  assert.equal(deckDom.status.textContent, '저장 필요');

  deckDom.dateInput.value = '2025-12-16';
  deckDom.listeners.change({
    target: deckDom.dateInput,
  });
  await flushMicrotasks();
  assert.equal(dateField.textContent, '2026.01.16');
  assert.equal(fetchCalls.length, 2);

  const slide8OverviewField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  deckDom.listeners.click({
    target: slide8OverviewField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  deckDom.overviewDialogFields.team.value = '공무환경팀';
  deckDom.overviewDialogFields.title.value = '환경 설비 보수';
  deckDom.overviewDialogFields.effect.value = '점검 시간 단축';
  deckDom.overviewDialogFields.date.value = '2025-12-20';
  deckDom.overviewDialogFields.amount.value = 'abc';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.amount.customValidity, '백만원 단위 숫자만 입력해 주세요.');
  assert.equal(deckDom.overviewDialogFields.amount.reportValidityCount, 1);
  assert.equal(deckDom.overviewDialogFields.amount.focusCount, 1);
  assert.equal(deckDom.status.textContent, '금액은 숫자만 입력해 주세요');
  deckDom.overviewDialogFields.amount.value = '5.5';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);
  assert.equal(deckDom.overviewDialogFields.amount.customValidity, '');
  assert.equal(slide8OverviewField.textContent, '공무환경팀\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원');

  const slide9SummaryField = {
    dataset: { reportPlanSummary: 'slide9', reportPlanSourceSlot: '1' },
    textContent: '',
    closest(selector) {
      return selector === '[data-report-plan-summary]' ? this : null;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    blur() {},
  };
  deckDom.listeners.click({
    target: slide9SummaryField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide9');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewDialogFields.kind.value, 'cause');
  deckDom.listeners.click({
    target: deckDom.overviewKindButtons[1],
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialogFields.kind.value, 'purpose');
  assert.equal(deckDom.overviewKindButtons[1].classList.active, true);
  deckDom.overviewDialogFields.team.value = '1팀 2파트';
  deckDom.overviewDialogFields.title.value = '외포장실 안전장치 설치';
  deckDom.overviewDialogFields.detail.value = '안전사고 예방';
  deckDom.overviewDialogFields.date.value = '2025-12-25';
  deckDom.overviewDialogFields.amount.value = '6.5';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);

  deckDom.listeners.click({
    target: deckDom.planImageClearButtons[0],
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planImages[0].src, undefined);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'false');

  let ctrlSavePrevented = false;
  let ctrlSaveStopped = false;
  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {
      ctrlSavePrevented = true;
    },
    stopPropagation() {
      ctrlSaveStopped = true;
    },
  });
  await flushMicrotasks();
  assert.equal(ctrlSavePrevented, true);
  assert.equal(ctrlSaveStopped, true);
  assert.equal(fetchCalls[2].url, '/api/modules/report_runtime/records/report_2025_12');
  assert.equal(fetchCalls[2].options.method, 'PUT');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.title, '12월 실적 보고');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.productionTeam1ContentsItem1, '생산량 실적');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Title, '3. 12월 공사 및 정비 현황 1/1');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Title, '4. 1월 주요 계획 1/1');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.reportDate, '2026.01.16');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8SlotCount, '3');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Team, '공무환경팀');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Title, '환경 설비 보수');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Effect, '점검 시간 단축');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Date, '2025-12-20');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Amount, '5.5');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Text, '공무환경팀\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9SlotCount, '1');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Team, '1팀 2파트');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Title, '외포장실 안전장치 설치');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Kind, 'purpose');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Detail, '안전사고 예방');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Date, '2025-12-25');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Amount, '6.5');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Text, '1팀 2파트\n외포장실 안전장치 설치\n▶ 목적 : 안전사고 예방\n▶ 예상 날짜 : 25.12월 중\n▶ 예상 금액 : 6.5 백만원');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8BeforeImage1, '');
  assert.equal(deckDom.status.textContent, '저장 완료');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.editButton.textContent, '수정');

  deckDom.monthSelect.value = '2025-11';
  deckDom.listeners.change({
    target: deckDom.monthSelect,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls[3].url, '/api/modules/report_runtime/records/report_2025_11');
  assert.equal(titleField.textContent, '11월 실적 보고');
  assert.equal(slide8TitleField.textContent, '3. 11월 공사 및 정비 현황 1/1');
  assert.equal(slide9TitleField.textContent, '4. 12월 주요 계획 1/1');
  assert.equal(dateField.textContent, '2025.12.15');
  assert.equal(deckDom.root.dataset.reportMonth, '2025-11');
  assert.equal(deckDom.root.dataset.reportRecordKey, 'report_2025_11');

  deckDom.listeners.click({
    target: deckDom.navButtons[3],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '3');
  assert.equal(deckDom.counter.textContent, '4 / 8');
  assert.equal(deckDom.slides[5].classList.active, true);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '4');

  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.fullscreenRequestCount, 1);
  assert.equal(deckDom.stage.focusCount, 2);

  deckDom.listeners.click({
    target: deckDom.navButtons[7],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '7');
  assert.equal(deckDom.root.ownerDocument.fullscreenElement, deckDom.root);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 8');
  assert.equal(deckDom.root.ownerDocument.exitCount, 1);
  assert.equal(deckDom.root.ownerDocument.fullscreenElement, null);

  deckDom.listeners.click({
    target: deckDom.reportReturnButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'hq');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '1');
  assert.equal(deckDom.counter.textContent, '2 / 2');
  assert.equal(deckDom.reportReturnButton.hidden, true);
  assert.equal(deckDom.slides[1].classList.active, true);
});

test('report deck editor externalizes inline image data before saving records', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      if (url === '/api/files/base64') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            ok: true,
            document: { id: 'doc-inline-image-1' },
          }),
        };
      }
      if (options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                title: 'Inline image report',
                reportDate: '2025.12.15',
                slide8BeforeImage1: 'data:image/png;base64,QUJD',
              },
              version: 1,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: JSON.parse(options.body).payload,
            version: 2,
            updated_at: '2026-05-15T00:01:00.000Z',
          },
        }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  departmentField.textContent = 'Saved with file image';
  deckDom.listeners.input({ target: departmentField });
  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  await flushMicrotasks();

  const uploadIndex = fetchCalls.findIndex((call) => call.url === '/api/files/base64');
  const saveIndex = fetchCalls.findIndex((call) => call.options?.method === 'PUT');
  assert.ok(uploadIndex > 0, 'inline image upload was not called');
  assert.ok(saveIndex > uploadIndex, 'record save must happen after image upload');
  const uploadBody = JSON.parse(fetchCalls[uploadIndex].options.body);
  assert.equal(uploadBody.ownerDomain, 'report.runtime');
  assert.equal(uploadBody.ownerKey, 'report_2025_12');
  assert.equal(uploadBody.base64Data, 'QUJD');
  const savedBody = JSON.parse(fetchCalls[saveIndex].options.body);
  assert.equal(savedBody.payload.slide8BeforeImage1, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.status.textContent, '저장 완료');
});

test('report deck editor sorts slide8 overview columns by team order', async () => {
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    fetchImpl: async (url, options = {}) => {
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      if (options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                reportDate: '2025.12.15',
                slide8SlotCount: '2',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '공무 작업',
                slide8BeforeImage1: 'image-env-before',
                slide8AfterImage1: 'image-env-after',
                slide8Item2Team: '1팀 1파트',
                slide8Item2Title: '1파트 작업',
                slide8BeforeImage2: 'image-team-before',
                slide8AfterImage2: 'image-team-after',
              },
              version: 1,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, record: { payload: JSON.parse(options.body).payload } }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  const firstOverview = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  const secondOverview = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item2Text');
  assert.equal(firstOverview.textContent, '1팀 1파트\n1파트 작업');
  assert.equal(secondOverview.textContent, '공무환경팀\n공무 작업');
  assert.equal(deckDom.planImages[0].src, 'image-team-before');
  assert.equal(deckDom.planImages[1].src, 'image-env-before');
  assert.equal(deckDom.planImages[4].src, 'image-team-after');
  assert.equal(deckDom.planImages[5].src, 'image-env-after');
});

test('report deck plan slot add requires saved complete overview and delete removes a slot', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    fetchImpl: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if (url === '/api/shared-store') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            store: createReportDeckSharedStore(),
          }),
        };
      }
      if (options.method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            record: {
              payload: {
                reportDate: '2025.12.15',
                slide8SlotCount: '1',
                slide8Item1Team: '1팀 1파트',
                slide8Item1Title: '저장된 작업',
                slide8Item1Effect: '설비 안정',
                slide8Item1Date: '2025-12-10',
                slide8Item1Amount: '1.2',
              },
              version: 1,
              updated_at: '2026-05-15T00:00:00.000Z',
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, record: { payload: JSON.parse(options.body).payload } }),
      };
    },
  });

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  const departmentField = deckDom.fields.find((field) => field.dataset.reportField === 'department');
  departmentField.textContent = '저장 전 변경';
  deckDom.listeners.input({ target: departmentField });
  deckDom.listeners.click({
    target: deckDom.planAddSlotButtons[0],
    preventDefault() {},
  });
  assert.equal(deckDom.status.textContent, '저장 완료 후 칸을 추가해 주세요');
  assert.equal(deckDom.overviewDialog.hidden, true);

  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.status.textContent, '저장 완료');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.planAddSlotButtons[0],
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
  assert.equal(deckDom.status.textContent, '저장 필요');

  deckDom.listeners.click({
    target: deckDom.planDeleteButtons[1],
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);
  deckDom.listeners.keydown({
    key: 's',
    code: 'KeyS',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });
  await flushMicrotasks();
  const savedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(savedPayload.slide8SlotCount, '1');
  assert.equal(savedPayload.slide8Item1Title, '저장된 작업');
  assert.equal(savedPayload.slide8Item2Title, '');
});

test('util runtime browser adapter supports no-window and disabled-write branches', async () => {
  const { registered } = createContext({
    withWindow: false,
    includeMeteringBridge: false,
    meteringWriteEnabled: false,
  });

  assert.equal(typeof registered.initializers.get('util'), 'function');
  assert.doesNotThrow(() => {
    registered.initializers.get('util')({ category: { content: '' }, container: {} });
  });

  const providerFactory = registered.saveProviders.get('util-shared-save');
  const provider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(provider.canSave, false);
  assert.equal(await provider.perform({ trigger: 'manual' }), false);
  assert.equal(registered.manualSaveCalls.length, 0);
});

test('util runtime save provider falls back to production persistence only when available', async () => {
  const withFallback = createContext({
    includeMeteringApp: false,
    includeProductionPersist: true,
  });
  const providerFactory = withFallback.registered.saveProviders.get('util-shared-save');

  const productionProvider = providerFactory({
    sectionId: 'util',
    container: {
      querySelector(selector) {
        return selector === '[data-kpi-metering-root]' ? { shadowRoot: {} } : null;
      },
    },
  });

  assert.equal(productionProvider.priority, 40);
  assert.equal(productionProvider.canSave, true);
  assert.deepEqual(await productionProvider.perform(), { ok: true, source: 'production' });
  assert.equal(withFallback.registered.productionPersistCount, 1);

  const withoutFallback = createContext({ includeMeteringApp: false });
  const emptyProviderFactory = withoutFallback.registered.saveProviders.get('util-shared-save');
  assert.equal(emptyProviderFactory({ sectionId: 'util', container: {} }), null);
});

test('kpi html and boot manifest load util runtime browser adapter before util runtime', () => {
  const adapterScript = 'utility/runtime/util/KPI.util.runtime.browser-adapter.js';
  const runtimeScript = 'utility/runtime/util/KPI.util.runtime.js';

  assertScriptOrder(readScriptSources(), adapterScript, runtimeScript);
  assertScriptOrder(loadManifestScripts(), adapterScript, runtimeScript);
});

test('util runtime host uses the browser adapter for direct global access', () => {
  assert.doesNotMatch(runtimeSource, /window\./);
  assert.doesNotMatch(runtimeSource, new RegExp('global' + 'This'));
});
