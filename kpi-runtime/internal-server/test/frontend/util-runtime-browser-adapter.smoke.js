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
const reportSectionSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/sections/KPI.sections.report.js'),
  'utf8'
);
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

function createReportDeckContainer(options = {}) {
  const withMemoOverviewWindow = options.withMemoOverviewWindow === true;
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
  const undoDeleteButton = {
    dataset: {},
    disabled: true,
    title: '',
    closest(selector) {
      return selector === '[data-report-undo-delete]' ? this : null;
    },
  };
  const fullscreenButton = {
    closest(selector) {
      return selector === '[data-report-fullscreen]' ? this : null;
    },
  };
  const editFullscreenButton = {
    dataset: {},
    title: '',
    hidden: false,
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
      return selector === '[data-report-edit-fullscreen-toggle]' ? this : null;
    },
  };
  const contentsToggleButton = {
    dataset: {},
    title: '',
    hidden: true,
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
      return selector === '[data-report-contents-toggle]' ? this : null;
    },
  };
  const saveMenu = {
    dataset: {},
    closest(selector) {
      return selector === '[data-report-save-menu]' ? this : null;
    },
  };
  const saveMenuPanel = {
    hidden: true,
  };
  const saveMenuToggleButton = {
    classList: makeClassList(),
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      if (selector === '[data-report-save-menu-toggle]') return this;
      if (selector === '[data-report-save-menu]') return saveMenu;
      return null;
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
      closest(selector) {
        return selector === '[data-report-overview-team]' ? this : null;
      },
    },
    customTeam: {
      value: '',
      disabled: false,
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
      closest(selector) {
        return selector === '[data-report-overview-custom-team]' ? this : null;
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
    hazard: {
      value: '미끄럼',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    kind: { value: 'cause' },
    detail: { value: '' },
    date: {
      value: '',
      focusCount: 0,
      focus() {
        this.focusCount += 1;
      },
    },
    amount: {
      value: '',
      disabled: false,
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
      closest(selector) {
        return selector.split(',').map((value) => value.trim()).includes('[data-report-overview-amount]') ? this : null;
      },
    },
    amountText: {
      value: '',
      disabled: false,
      closest(selector) {
        return selector.split(',').map((value) => value.trim()).includes('[data-report-overview-amount-text]') ? this : null;
      },
    },
  };
  const overviewTeamRow = { hidden: false };
  const overviewCustomTeamRow = { hidden: true };
  const overviewDialog = {
    hidden: true,
    dataset: {},
    querySelector(selector) {
      if (selector === '[data-report-overview-custom-team-row]') return overviewCustomTeamRow;
      const match = selector.match(/^\[data-report-overview-([a-z-]+)\]$/);
      if (!match) return null;
      const key = match[1].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return overviewDialogFields[key] || null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-report-overview-team-row]') return [overviewTeamRow];
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
  const memoTeamSelect = {
    value: 'team_01_01',
    closest(selector) {
      return selector === '[data-report-memo-team]' ? this : null;
    },
  };
  const memoMetricSelect = {
    value: 'production',
    innerHTML: '',
    closest(selector) {
      return selector === '[data-report-memo-metric]' ? this : null;
    },
  };
  const memoLines = { dataset: {}, innerHTML: '' };
  const memoCandidates = { innerHTML: '' };
  const memoManualInput = {
    value: '',
    closest(selector) {
      return selector === '[data-report-memo-manual-input]' ? this : null;
    },
  };
  const memoManualAddButton = {
    closest(selector) {
      return selector === '[data-report-memo-manual-add]' ? this : null;
    },
  };
  const memoNotepad = {
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-notepad]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoNotepadFontSizeButton = {
    dataset: { reportMemoNotepadFontSizeDelta: '1' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-font-size-delta]' ? this : null;
    },
  };
  const memoNotepadFontSizeInput = {
    value: '10.4',
    disabled: false,
    closest(selector) {
      return selector === '[data-report-memo-notepad-font-size-input]' ? this : null;
    },
  };
  const memoNotepadColorButton = {
    dataset: { reportMemoNotepadColor: 'red' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-color]' ? this : null;
    },
  };
  const memoNotepadColorClearButton = {
    dataset: { reportMemoNotepadColor: 'clear' },
    closest(selector) {
      return selector === '[data-report-memo-notepad-color]' ? this : null;
    },
  };
  const memoDialog = {
    hidden: true,
    dataset: {},
    __reportMemoCandidates: [],
    style: {},
    classList: makeClassList(),
    offsetWidth: 360,
    offsetHeight: 220,
    getBoundingClientRect() {
      return {
        left: Number.parseFloat(this.style.left || '620') || 620,
        top: Number.parseFloat(this.style.top || '54') || 54,
        width: 360,
        height: 220,
      };
    },
    querySelector(selector) {
      if (selector === '[data-report-memo-team]') return memoTeamSelect;
      if (selector === '[data-report-memo-metric]') return memoMetricSelect;
      if (selector === '[data-report-memo-lines]') return memoLines;
      if (selector === '[data-report-memo-candidates]') return memoCandidates;
      if (selector === '[data-report-memo-manual-input]') return memoManualInput;
      if (selector === '[data-report-memo-notepad]') return memoNotepad;
      if (selector === '[data-report-memo-notepad-font-size-input]') return memoNotepadFontSizeInput;
      if (selector === '[data-report-memo-preview]') return memoPreview;
      return null;
    },
  };
  const memoPreview = { dataset: {}, innerHTML: '' };
  const memoOverviewWindowListeners = {};
  const memoOverviewWindow = {
    innerWidth: 1000,
    innerHeight: 700,
    addEventListener(type, listener) {
      memoOverviewWindowListeners[type] = listener;
    },
    removeEventListener(type, listener) {
      if (memoOverviewWindowListeners[type] === listener) {
        delete memoOverviewWindowListeners[type];
      }
    },
  };
  const reportOwnerDocument = {
    fullscreenElement: null,
    exitCount: 0,
    documentElement: {
      clientWidth: 1000,
      clientHeight: 700,
    },
    exitFullscreen() {
      this.exitCount += 1;
      this.fullscreenElement = null;
    },
  };
  if (withMemoOverviewWindow) {
    reportOwnerDocument.defaultView = memoOverviewWindow;
  }
  memoDialog.ownerDocument = reportOwnerDocument;
  const memoOverviewList = { innerHTML: '' };
  const memoOverviewDialog = {
    hidden: true,
    dataset: {},
    style: {},
    classList: makeClassList(),
    ownerDocument: reportOwnerDocument,
    offsetWidth: 320,
    offsetHeight: 200,
    getBoundingClientRect() {
      return {
        left: Number.parseFloat(this.style.left || '24') || 24,
        top: Number.parseFloat(this.style.top || '64') || 64,
        width: 320,
        height: 200,
      };
    },
    querySelector(selector) {
      if (selector === '[data-report-memo-overview-list]') return memoOverviewList;
      return null;
    },
  };
  const memoOverviewDragHandle = {
    pointerCaptures: [],
    releasedPointerCaptures: [],
    closest(selector) {
      if (selector === '[data-report-memo-overview-drag-handle]') return this;
      return null;
    },
    setPointerCapture(pointerId) {
      this.pointerCaptures.push(pointerId);
    },
    releasePointerCapture(pointerId) {
      this.releasedPointerCaptures.push(pointerId);
    },
  };
  const memoDialogDragHandle = {
    pointerCaptures: [],
    releasedPointerCaptures: [],
    closest(selector) {
      if (selector === '[data-report-memo-drag-handle]') return this;
      return null;
    },
    setPointerCapture(pointerId) {
      this.pointerCaptures.push(pointerId);
    },
    releasePointerCapture(pointerId) {
      this.releasedPointerCaptures.push(pointerId);
    },
  };
  const memoTargets = [
    {
      dataset: {
        reportMemoKey: 'slide3GasMemo',
        reportMemoDefaultTeam: 'team_01_01',
        reportMemoDefaultMetric: 'production',
      },
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
        this[name] = value;
      },
      closest(selector) {
        return selector === '[data-report-memo-key]' ? this : null;
      },
    },
  ];
  const memoContents = [
    {
      dataset: { reportMemoContent: 'slide3GasMemo' },
      innerHTML: '',
    },
  ];
  const createStyleCapture = () => ({
    values: {},
    setProperty(name, value) {
      this.values[name] = value;
    },
    getPropertyValue(name) {
      return this.values[name] || '';
    },
  });
  const analysisColumns = Array.from({ length: 6 }, () => ({ style: createStyleCapture() }));
  const wasteLayouts = Array.from({ length: 2 }, () => ({ style: createStyleCapture() }));
  const memoLineInput = {
    dataset: { reportMemoLineInput: '0' },
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-line-input]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoManualLineInput = {
    dataset: { reportMemoLineInput: '1' },
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    closest(selector) {
      if (selector === '[data-report-memo-line-input]') return this;
      if (selector === '[data-report-memo-line-input], [data-report-memo-notepad]') return this;
      return null;
    },
  };
  const memoManualLineRow = {
    querySelector(selector) {
      return selector === '[data-report-memo-line-input]' ? memoManualLineInput : null;
    },
  };
  const memoLineMoveButton = {
    dataset: { reportMemoMoveLine: '0', reportMemoMoveDirection: 'up' },
    closest(selector) {
      return selector === '[data-report-memo-move-line]' ? this : null;
    },
  };
  const memoLineFontSizeButton = {
    dataset: { reportMemoLineFontSize: '0', reportMemoLineFontSizeDelta: '1' },
    closest(selector) {
      return selector === '[data-report-memo-line-font-size]' ? this : null;
    },
  };
  const memoManualLineFontSizeButton = {
    dataset: { reportMemoLineFontSize: '1', reportMemoLineFontSizeDelta: '1' },
    closest(selector) {
      if (selector === '[data-report-memo-line-font-size]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };
  const memoLineColorButton = {
    dataset: { reportMemoLineColor: '1', reportMemoLineColorValue: 'red' },
    closest(selector) {
      if (selector === '[data-report-memo-line-color]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };
  const memoLineColorClearButton = {
    dataset: { reportMemoLineColor: '1', reportMemoLineColorValue: 'clear' },
    closest(selector) {
      if (selector === '[data-report-memo-line-color]') return this;
      if (selector === '[data-report-memo-line-row]') return memoManualLineRow;
      return null;
    },
  };
  const dateInput = {
    value: '',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-date-input]' ? this : null;
    },
  };
  const planCountSelects = ['slide8SlotCount', 'slide9SlotCount', 'slide10SlotCount'].map((key) => ({
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
  const addPageButton = {
    dataset: { reportAddPage: 'slide10' },
    disabled: true,
    closest(selector) {
      return selector === '[data-report-add-page]' ? this : null;
    },
  };
  const planSlotCells = [
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide8.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
    ...[1, 2, 3, 4].map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide9.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
    })),
    ...Array.from({ length: 16 }, (_, index) => index + 1).map((slotIndex) => ({
      dataset: { reportPlanSlot: `slide10.${slotIndex}`, reportPlanLocalSlot: String(slotIndex) },
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
    ...Array.from({ length: 16 }, (_, index) => index + 1).map((slotIndex) => ({
      dataset: { reportPlanDeleteSlot: 'slide10', reportPlanLocalSlot: String(slotIndex) },
      disabled: false,
      closest(selector) {
        if (selector === '[data-report-plan-delete-slot]') return this;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide10.${slotIndex}`) || null;
        }
        return null;
      },
    })),
  ];
  let slide10PlanSlide = null;
  const planRowTables = Array.from({ length: 7 }, (_, rowIndex) => ({
    dataset: { reportSafetyRow: String(rowIndex) },
    closest(selector) {
      if (selector === '.report-safety-table') return this;
      if (selector === '[data-report-plan-slide="slide10"]') return slide10PlanSlide;
      if (selector === '[data-report-slide-page]') return slides[10] || null;
      return null;
    },
  }));
  const planRowLabelTexts = Array.from({ length: 7 }, () => ({ textContent: '' }));
  const safetyTeamSelect = {
    value: '0',
    disabled: true,
    closest(selector) {
      return selector === '[data-report-safety-team-select]' ? this : null;
    },
  };
  const safetyAddControl = {
    dataset: { reportSafetyTeamPickerOpen: 'false' },
    querySelector(selector) {
      if (selector === '[data-report-safety-team-select]') return safetyTeamSelect;
      if (selector === '[data-report-safety-team-menu]') return safetyTeamMenu;
      if (selector === '[data-report-safety-team-option]') return safetyTeamOptionButtons[0] || null;
      return null;
    },
  };
  const safetyTeamMenu = { hidden: true };
  const safetyAddButton = {
    dataset: { reportSafetyAddToggle: '' },
    disabled: true,
    closest(selector) {
      if (selector === '[data-report-safety-add-toggle]') return this;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      return null;
    },
  };
  const safetyTeamLabels = ['1팀 1파트', '1팀 2파트', '2팀', '3팀', '공무환경팀', '물류센터', '기타'];
  const safetyTeamOptionButtons = safetyTeamLabels.map((team, rowIndex) => ({
    dataset: {
      reportSafetyTeamOption: String(rowIndex),
      reportPlanRowSourceIndex: String(rowIndex),
    },
    textContent: team,
    disabled: true,
    focusCount: 0,
    focus() {
      this.focusCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-safety-team-option]') return this;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      return null;
    },
  }));
  const planRowLabels = safetyTeamLabels.map((_, rowIndex) => ({
    dataset: { reportPlanRowTeam: 'slide10', reportPlanRowIndex: String(rowIndex) },
    get textContent() {
      return planRowLabelTexts[rowIndex].textContent;
    },
    set textContent(value) {
      planRowLabelTexts[rowIndex].textContent = value;
    },
    querySelector(selector) {
      if (selector === '[data-report-plan-row-team-label]') return planRowLabelTexts[rowIndex] || null;
      return null;
    },
    closest(selector) {
      return selector === '.report-safety-table' ? planRowTables[rowIndex] || null : null;
    },
  }));
  const safetyTableMoveButtons = Array.from({ length: 16 }, (_, index) => index + 1).flatMap((slotIndex) => {
    const rowIndex = Math.floor((slotIndex - 1) / 4);
    const table = planRowTables[rowIndex] || planRowTables[0];
    return ['left', 'right', 'up', 'down'].map((direction) => ({
      rowIndex,
      slotIndex,
      direction,
      dataset: { reportSafetyTableMove: direction },
      disabled: true,
      closest(selector) {
        if (selector === '[data-report-safety-table-move]') return this;
        if (selector === '.report-safety-table') return table;
        if (selector === '[data-report-plan-slide="slide10"]') return slide10PlanSlide;
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.find((cell) => cell.dataset.reportPlanSlot === `slide10.${slotIndex}`) || null;
        }
        return null;
      },
    }));
  });
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
    ...Array.from({ length: 16 }, (_, index) => `slide10BeforeImage${index + 1}`),
    ...Array.from({ length: 16 }, (_, index) => `slide10AfterImage${index + 1}`),
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
  const planImagePlaceholders = Object.fromEntries(
    planImages.map((image) => [image.dataset.reportPlanImage, { textContent: '' }])
  );
  const planImageSourceLabels = Object.fromEntries(
    planImages.map((image) => [image.dataset.reportPlanImage, { textContent: '', hidden: true }])
  );
  const planImagePasteButtons = planImages.map((image) => ({
    dataset: { reportPlanImagePaste: image.dataset.reportPlanImage },
    textContent: '',
    disabled: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
      this[name] = value;
    },
    closest(selector) {
      if (selector === '[data-report-plan-image-paste]') return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planSlides = ['slide8', 'slide9', 'slide10'].map((slideKey) => {
    const planSlide = {
      dataset: { reportPlanSlide: slideKey, reportPlanPage: '0' },
      querySelectorAll(selector) {
        if (selector === '[data-report-plan-slot]') {
          return planSlotCells.filter((cell) => cell.dataset.reportPlanSlot.startsWith(`${slideKey}.`));
        }
        if (selector === '[data-report-plan-delete-slot]') {
          return planDeleteButtons.filter((button) => button.dataset.reportPlanDeleteSlot === slideKey);
        }
        if (selector === '[data-report-plan-add-slot]') {
          return slideKey === 'slide10'
            ? []
            : planAddSlotButtons.filter((button) => button.dataset.reportPlanAddSlot === slideKey);
        }
        if (selector === '[data-report-plan-row-team]') {
          return slideKey === 'slide10' ? planRowLabels : [];
        }
        if (selector === '[data-report-safety-team-select]') {
          return slideKey === 'slide10' ? [safetyTeamSelect] : [];
        }
        if (selector === '[data-report-safety-add-toggle]') {
          return slideKey === 'slide10' ? [safetyAddButton] : [];
        }
        if (selector === '[data-report-safety-team-option]') {
          return slideKey === 'slide10' ? safetyTeamOptionButtons : [];
        }
        if (selector === '[data-report-safety-table-move]') {
          return slideKey === 'slide10' ? safetyTableMoveButtons : [];
        }
        return [];
      },
      closest(selector) {
        if (selector !== '[data-report-slide-page]') return null;
        if (slideKey === 'slide10') return slides[10] || null;
        return null;
      },
    };
    if (slideKey === 'slide10') slide10PlanSlide = planSlide;
    return planSlide;
  });
  const optionalContentItems = ['slide8', 'slide9', 'slide10', 'slide8', 'slide9'].map((optionalPage) => ({
    dataset: { reportOptionalContent: optionalPage },
    hidden: true,
  }));
  const planImageFrames = Object.fromEntries(
    planImages.map((image) => [
      image.dataset.reportPlanImage,
      {
        dataset: {},
        querySelector(selector) {
          if (selector === '[data-report-plan-image-input]') {
            return (
              planImageInputs.find((input) => input.dataset.reportPlanImageKey === image.dataset.reportPlanImage) ||
              planImageInputs[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image-upload]') {
            return (
              planImageUploadButtons.find(
                (button) => button.dataset.reportPlanImageUpload === image.dataset.reportPlanImage
              ) ||
              planImageUploadButtons[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image-clear]') {
            return (
              planImageClearButtons.find(
                (button) => button.dataset.reportPlanImageClear === image.dataset.reportPlanImage
              ) ||
              planImageClearButtons[planImages.indexOf(image)] ||
              null
            );
          }
          if (selector === '[data-report-plan-image]') {
            return image;
          }
          if (selector === '[data-report-plan-image-placeholder]') {
            return planImagePlaceholders[image.dataset.reportPlanImage] || null;
          }
          if (selector === '[data-report-plan-image-source-label]') return null;
          if (selector === '[data-report-plan-image-paste]') {
            return (
              planImagePasteButtons.find(
                (button) => button.dataset.reportPlanImagePaste === image.dataset.reportPlanImage
              ) ||
              planImagePasteButtons[planImages.indexOf(image)] ||
              null
            );
          }
          return null;
        },
        closest(selector) {
          return selector === '[data-report-plan-image-frame]' ? this : null;
        },
        focusCount: 0,
        focus() {
          this.focusCount += 1;
        },
        setAttribute(name, value) {
          if (String(name).startsWith('data-')) {
            this.dataset[name.replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
            return;
          }
          this[name] = value;
        },
      },
    ])
  );
  const planImageInputs = planImages.map((image) => ({
    dataset: { reportPlanImageKey: image.dataset.reportPlanImage },
    disabled: true,
    files: [],
    value: '',
    clickCount: 0,
    click() {
      this.clickCount += 1;
    },
    closest(selector) {
      if (selector === '[data-report-plan-image-input]') return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planImageUploadButtons = planImages.map((image) => ({
    dataset: { reportPlanImageUpload: image.dataset.reportPlanImage },
    disabled: true,
    closest(selector) {
      if (selector === '[data-report-plan-image-upload]') return this;
      if (String(selector).includes('[data-report-plan-image-choice]')) return this;
      return selector === '[data-report-plan-image-frame]'
        ? planImageFrames[image.dataset.reportPlanImage] || null
        : null;
    },
  }));
  const planImageClearButtons = planImages.map((image) => ({
    dataset: { reportPlanImageClear: image.dataset.reportPlanImage },
    closest(selector) {
      return selector === '[data-report-plan-image-clear]' ? this : null;
    },
  }));
  planImages.forEach((image) => {
    image.closest = (selector) =>
      selector === '[data-report-plan-image-frame]' ? planImageFrames[image.dataset.reportPlanImage] || null : null;
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
    'contentsItem5',
    'slide3Title',
    'slide4Title',
    'slide5Title',
    'slide6Title',
    'slide7Title',
    'productionTeam1ContentsTitle',
    'productionTeam1ContentsItem1',
    'productionTeam1ContentsItem2',
    'productionTeam1ContentsItem3',
    'productionTeam1ContentsItem4',
    'slide8Section',
    'slide8Title',
    'slide9Section',
    'slide9Title',
    'slide10Section',
    'slide10Title',
    'slide8Item1Text',
    'slide8Item2Text',
    'slide8Item3Text',
    'slide8Item4Text',
  ].map((key) => ({
    dataset: {
      reportField: key,
      ...(key.match(/^slide8Item([1-4])Text$/)
        ? { reportSlide8Overview: key.match(/^slide8Item([1-4])Text$/)[1] }
        : {}),
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
  const fieldRefs = ['contentsItem4', 'productionTeam1ContentsItem1'].map((key) => ({
    dataset: { reportFieldRef: key },
    textContent: '',
  }));
  const root = {
    dataset: {},
    fullscreenRequestCount: 0,
    ownerDocument: reportOwnerDocument,
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
      if (selector === '[data-report-memo-dialog]') return memoDialog;
      if (selector === '[data-report-memo-overview-dialog]') return memoOverviewDialog;
      if (selector === '[data-report-memo-key="slide3GasMemo"]') return memoTargets[0];
      if (selector === '[data-report-slide-counter]') return counter;
      if (selector === '[data-report-stage]') return stage;
      if (selector === '[data-report-safety-add-control]') return safetyAddControl;
      if (selector === '[data-report-safety-team-select]') return safetyTeamSelect;
      if (selector === '[data-report-save-menu]') return saveMenu;
      if (selector === '[data-report-save-menu-toggle]') return saveMenuToggleButton;
      if (selector === '[data-report-save-menu-panel]') return saveMenuPanel;
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
      if (selector === '[data-report-plan-image-frame]') return Object.values(planImageFrames);
      if (selector === '[data-report-plan-add-slot], [data-report-plan-image-input], [data-report-plan-image-upload]')
        return [...planAddSlotButtons, ...planImageInputs, ...planImageUploadButtons];
      if (selector === '[data-report-plan-add-slot]') return planAddSlotButtons;
      if (selector === '[data-report-safety-add-control]') return [safetyAddControl];
      if (selector === '[data-report-safety-team-select]') return [safetyTeamSelect];
      if (selector === '[data-report-safety-add-toggle]') return [safetyAddButton];
      if (selector === '[data-report-safety-team-option]') return safetyTeamOptionButtons;
      if (selector === '[data-report-safety-table-move]') return safetyTableMoveButtons;
      if (selector === '[data-report-add-page]') return [addPageButton];
      if (selector === '[data-report-memo-key]') return memoTargets;
      if (selector === '[data-report-memo-content]') return memoContents;
      if (selector === '.report-bukjeong-analysis-column, .report-analysis-column') return analysisColumns;
      if (selector === '.report-waste-auto-layout') return wasteLayouts;
      if (selector === '[data-report-edit-toggle]') return [editButton];
      if (selector === '[data-report-chart-highlight-toggle]') return [chartHighlightButton, chartHighlightRangeButton];
      if (selector === '[data-report-chart-highlight-reset]') return [chartHighlightResetButton];
      if (selector === '[data-report-chart-highlight-point]') return [chartHighlightPoint, chartHighlightSecondPoint];
      if (selector === '[data-report-slide-page]') return slides;
      if (selector === '[data-report-slide-target]') return navButtons;
      if (selector === '[data-report-return-hq]') return [reportReturnButton];
      if (selector === '[data-report-undo-delete]') return [undoDeleteButton];
      if (selector === '[data-report-edit-fullscreen-toggle]') return [];
      if (selector === '[data-report-contents-toggle]') return [];
      if (selector === '[data-report-optional-content]') return optionalContentItems;
      const autoChartMatch = selector.match(/^\[data-report-auto-chart-plot="([^"]+)"\]$/);
      if (autoChartMatch) return autoChartPlots[autoChartMatch[1]] ? [autoChartPlots[autoChartMatch[1]]] : [];
      if (selector === '[data-report-waste-auto-chart-plot]') return [autoChartPlots.waste];
      return [];
    },
  };
  const slides = Array.from({ length: 11 }, (_, index) => {
    const pageNumber = { textContent: '' };
    return {
      dataset: {
        reportSlidePage: String(index),
        reportSlideView: index < 2 ? 'hq' : 'public-works',
        ...(index === 8 ? { reportOptionalPage: 'slide8', reportDynamicPage: '0' } : {}),
        ...(index === 9 ? { reportOptionalPage: 'slide9', reportDynamicPage: '0' } : {}),
        ...(index === 10 ? { reportOptionalPage: 'slide10', reportDynamicPage: '0' } : {}),
      },
      hidden: false,
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
  const navButtons = Array.from({ length: 11 }, (_, index) => ({
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
    undoDeleteButton,
    fullscreenButton,
    editFullscreenButton,
    contentsToggleButton,
    saveMenu,
    saveMenuPanel,
    saveMenuToggleButton,
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
    overviewTeamRow,
    overviewCustomTeamRow,
    overviewDialogFields,
    overviewKindButtons,
    overviewSaveButton,
    overviewCancelButton,
    memoTeamSelect,
    memoMetricSelect,
    memoLines,
    memoCandidates,
    memoManualInput,
    memoManualAddButton,
    memoNotepad,
    memoNotepadFontSizeButton,
    memoNotepadFontSizeInput,
    memoNotepadColorButton,
    memoNotepadColorClearButton,
    memoPreview,
    memoDialog,
    memoDialogDragHandle,
    memoOverviewDialog,
    memoOverviewDragHandle,
    memoOverviewWindowListeners,
    memoTargets,
    memoContents,
    analysisColumns,
    wasteLayouts,
    memoLineInput,
    memoManualLineInput,
    memoLineMoveButton,
    memoLineFontSizeButton,
    memoManualLineFontSizeButton,
    memoLineColorButton,
    memoLineColorClearButton,
    dateInput,
    planCountSelects,
    planAddSlotButtons,
    planSlides,
    addPageButton,
    planSlotCells,
    planDeleteButtons,
    planRowTables,
    planRowLabels,
    safetyTeamSelect,
    safetyAddControl,
    safetyTeamMenu,
    safetyAddButton,
    safetyTeamOptionButtons,
    safetyTableMoveButtons,
    planImages,
    planImagePlaceholders,
    planImageSourceLabels,
    planImagePasteButtons,
    planImageFrames,
    planImageInputs,
    planImageUploadButtons,
    planImageClearButtons,
    autoChartPlots,
    slides,
    navButtons,
    optionalContentItems,
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

function getOptionalContentItems(deckDom, optionalPage) {
  return deckDom.optionalContentItems.filter((item) => item.dataset.reportOptionalContent === optionalPage);
}

function assertOptionalContentHidden(deckDom, optionalPage, hidden) {
  const items = getOptionalContentItems(deckDom, optionalPage);
  assert.ok(items.length > 0, `${optionalPage} optional contents should exist`);
  items.forEach((item) => {
    assert.equal(item.hidden, hidden);
  });
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

test('util runtime browser adapter registers init boot save and closer hooks', async () => {
  const { context, registered } = createContext();

  assert.equal(typeof registered.initializers.get('data'), 'function');
  assert.equal(typeof registered.initializers.get('experiment'), 'function');
  assert.equal(typeof registered.initializers.get('report'), 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckSingleHtml, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckCaptureZip, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.exportReportDeckCapturePdf, 'function');
  assert.equal(typeof context.KpiUtilRuntimeBrowserAdapter.printReportDeckPdf, 'function');
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
    /@page \{ size: \$\{REPORT_DECK_PRINT_PAGE_WIDTH\} \$\{REPORT_DECK_PRINT_PAGE_HEIGHT\}; margin: 0; \}/
  );
  assert.match(adapterSource, /padding:\s*\$\{REPORT_DECK_PRINT_PAGE_MARGIN\} !important/);
  assert.match(
    adapterSource,
    /width:\s*\$\{REPORT_DECK_PRINT_SLIDE_CSS_WIDTH\} !important; height:\s*\$\{REPORT_DECK_PRINT_SLIDE_CSS_HEIGHT\} !important; max-width:\s*100% !important; max-height:\s*100% !important; margin:\s*0 auto !important/
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

test('report public works tables place prior-year month before current month', () => {
  [
    [
      'data-report-auto-month-label="reference"',
      'data-report-auto-month-label="current"',
      'data-report-auto-month-label="previous"',
    ],
    [
      'data-report-yusan-lpg-month-label="reference"',
      'data-report-yusan-lpg-month-label="current"',
      'data-report-yusan-lpg-month-label="previous"',
    ],
    [
      'data-report-yusan-lpg-cost-month-label="reference"',
      'data-report-yusan-lpg-cost-month-label="current"',
      'data-report-yusan-lpg-cost-month-label="previous"',
    ],
    [
      'data-report-waste-auto-month-label="reference"',
      'data-report-waste-auto-month-label="current"',
      'data-report-waste-auto-month-label="previous"',
    ],
  ].forEach(([referenceLabel, currentLabel, previousLabel]) => {
    assertSourceTokenOrder(reportSectionSource, [
      referenceLabel,
      currentLabel,
      '>전년대비<',
      previousLabel,
      '>전월대비<',
    ]);
  });

  [
    [
      'data-report-auto-value="${kind}.${row.key}.reference"',
      'data-report-auto-value="${kind}.${row.key}.current"',
      'data-report-auto-value="${kind}.${row.key}.yoy"',
      'data-report-auto-value="${kind}.${row.key}.previous"',
      'data-report-auto-value="${kind}.${row.key}.mom"',
    ],
    [
      'data-report-yusan-lpg-value="${row.key}.reference"',
      'data-report-yusan-lpg-value="${row.key}.current"',
      'data-report-yusan-lpg-value="${row.key}.yoy"',
      'data-report-yusan-lpg-value="${row.key}.previous"',
      'data-report-yusan-lpg-value="${row.key}.mom"',
    ],
    [
      'data-report-yusan-lpg-cost-value="${index}.reference"',
      'data-report-yusan-lpg-cost-value="${index}.current"',
      'data-report-yusan-lpg-cost-value="${index}.yoy"',
      'data-report-yusan-lpg-cost-value="${index}.previous"',
      'data-report-yusan-lpg-cost-value="${index}.mom"',
    ],
    [
      'data-report-waste-auto-value="${row.key}.reference"',
      'data-report-waste-auto-value="${row.key}.current"',
      'data-report-waste-auto-value="${row.key}.yoy"',
      'data-report-waste-auto-value="${row.key}.previous"',
      'data-report-waste-auto-value="${row.key}.mom"',
    ],
    [
      'data-report-waste-auto-value="production.reference"',
      'data-report-waste-auto-value="production.current"',
      'data-report-waste-auto-value="production.yoy"',
      'data-report-waste-auto-value="production.previous"',
      'data-report-waste-auto-value="production.mom"',
    ],
    [
      'data-report-waste-auto-value="total.reference"',
      'data-report-waste-auto-value="total.current"',
      'data-report-waste-auto-value="total.yoy"',
      'data-report-waste-auto-value="total.previous"',
      'data-report-waste-auto-value="total.mom"',
    ],
  ].forEach((tokens) => assertSourceTokenOrder(reportSectionSource, tokens));
});

test('report safety summary keeps compact team title and meta lines', () => {
  assert.match(reportSectionSource, /\.report-safety-summary-cell \{[^}]*padding: 2px 4px !important;/);
  assert.match(reportSectionSource, /\.report-safety-summary-text \{[^}]*gap: 2px;[^}]*line-height: 1\.05;/);
  assert.match(
    reportSectionSource,
    /\.report-safety-summary-team, \.report-safety-summary-title, \.report-safety-summary-meta \{[^}]*white-space: nowrap;/
  );
  assert.match(reportSectionSource, /\.report-safety-summary-team \{ color: #1d4ed8; font-size: 10px; \}/);
  assert.match(
    reportSectionSource,
    /\.report-safety-summary-title, \.report-safety-summary-meta \{ font-size: 11px; \}/
  );
  assert.doesNotMatch(reportSectionSource, /\.report-safety-summary-meta \{ font-size: 9px; \}/);
});

test('report deck auto chart labels render above markers and avoid only different-value overlaps', () => {
  assert.match(runtimeSource, /function countReportDeckChartLabelCollisions/);
  assert.match(runtimeSource, /existing\.text === candidate\.text/);
  assert.match(runtimeSource, /baseLabelY: y - 11/);
  assert.match(runtimeSource, /function alignReportDeckSameValueLabels/);
  assert.match(runtimeSource, /function sortReportDeckChartLabelsByValue/);
  assert.match(runtimeSource, /: \[0, 16, 26, 36, 46\];/);
  assert.match(runtimeSource, /options\.offsets/);
  assert.match(runtimeSource, /sortReportDeckChartLabelsByValue\(labelItems\)\.forEach/);
  assert.match(runtimeSource, /placedByInputOrder\.set\(index, chosen\);/);
  assert.match(runtimeSource, /value,\s*baseLabelY: y - 11/);
  assert.match(runtimeSource, /function renderReportDeckChartDualColorValueLabel/);
  assert.match(runtimeSource, /report-auto-chart-label-dual-outline/);
  assert.match(runtimeSource, /stroke-width="2\.6"/);
  assert.match(runtimeSource, /const labels = renderReportDeckChartValueLabels\(placedLabels\);/);
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
  assert.match(runtimeSource, /if \(normalizedDelta === 0\) return escapeReportDeckHtml\('\\uB3D9\\uC77C'\);/);
  assert.match(runtimeSource, /if \(total <= 6\) return \[3, total - 3\];\s*return \[4, total - 4\];/);
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
  assert.match(runtimeSource, /function startReportDeckMemoOverviewDrag/);
  assert.match(runtimeSource, /function startReportDeckMemoDialogDrag/);
  assert.match(runtimeSource, /data-report-memo-overview-drag-handle/);
  assert.match(runtimeSource, /data-report-memo-drag-handle/);
  assert.match(runtimeSource, /function setReportDeckMemoOverviewPosition/);
  assert.match(runtimeSource, /function setReportDeckMemoDialogPosition/);
  assert.match(runtimeSource, /function syncReportDeckMemoTeamOptions/);
  assert.match(runtimeSource, /reportMemoLineColors/);
  assert.match(runtimeSource, /reportMemoLineSizeRanges/);
  assert.match(runtimeSource, /reportMemoPreserveFormatting/);
  assert.match(runtimeSource, /function syncReportDeckMemoNotepadToState/);
  assert.match(runtimeSource, /function adjustReportDeckMemoNotepadFontSize/);
  assert.match(runtimeSource, /function setReportDeckMemoNotepadFontSize/);
  assert.match(runtimeSource, /function applyReportDeckMemoNotepadColor/);
  assert.match(runtimeSource, /function getReportDeckMemoLineSelectionFontSizeLevels/);
  assert.match(runtimeSource, /function insertReportDeckMemoCandidateAtNotepadCursor/);
  assert.match(runtimeSource, /function syncReportDeckMemoDialogPreview/);
  assert.match(runtimeSource, /function rememberReportDeckMemoNotepadSelection/);
  assert.match(runtimeSource, /data-report-memo-notepad/);
  assert.match(runtimeSource, /data-report-memo-notepad-font-size-delta/);
  assert.match(runtimeSource, /data-report-memo-notepad-font-size-input/);
  assert.doesNotMatch(runtimeSource, /data-report-memo-indent-break/);
  assert.doesNotMatch(runtimeSource, /data-report-memo-preserve-format/);
  assert.match(runtimeSource, /data-report-memo-preview/);
  assert.match(runtimeSource, /data-report-memo-notepad-color/);
  assert.match(runtimeSource, /data-report-memo-line-color/);
  assert.match(runtimeSource, /data-report-memo-line-color-value="clear"/);
  assert.match(runtimeSource, /is-preserve-format/);
  assert.match(runtimeSource, />&#8630;<\/button>/);
  assert.doesNotMatch(runtimeSource, />초기화<\/button>/);
  assert.match(runtimeSource, /function clearReportDeckMemoLineColorRange/);
  assert.match(runtimeSource, /function applyReportDeckMemoLineColor/);
  assert.match(runtimeSource, /function applyReportDeckMemoLineFontSizeRange/);
  assert.match(runtimeSource, /report-auto-memo-manual-size/);
  assert.match(runtimeSource, /REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS/);
  assert.match(adapterSource, /site_yusan:\s*Object\.freeze\(REPORT_DECK_MEMO_YUSAN_OVERVIEW_METRIC_KEYS\)/);
  assert.match(runtimeSource, /root\.addEventListener\?\.\('pointerdown'[\s\S]*startReportDeckMemoDialogDrag\(root, event\)[\s\S]*startReportDeckMemoOverviewDrag\(root, event\);/);
  assert.match(runtimeSource, /function openReportDeckMemoOverviewPopupOrDialog/);
  assert.match(runtimeSource, /ownerWindow\.open\(/);
  assert.match(runtimeSource, /void openReportDeckMemoOverviewPopupOrDialog\(root, meta\);/);
  assert.match(runtimeSource, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(runtimeSource, /data-report-memo-overview-copy/);
  assert.match(runtimeSource, /data-report-memo-copy-text/);
  assert.match(runtimeSource, /report-memo-overview-row-label" title="\$\{escapeReportDeckHtml\(metricLabel\)\}"/);
  assert.match(runtimeSource, /report-memo-overview-row-text" title="\$\{escapeReportDeckHtml\(memoText\)\}"/);
  assert.match(runtimeSource, /function copyReportDeckMemoOverviewText/);
  assert.match(runtimeSource, /copyReportDeckTextToClipboard/);
  assert.doesNotMatch(runtimeSource, /report-memo-overview-row\.is-up\{/);
  assert.doesNotMatch(runtimeSource, /report-memo-overview-row\.is-down\{/);
  assert.match(runtimeSource, /report-auto-memo-change\.is-up\{color:#c00000;\}/);
  assert.match(runtimeSource, /report-auto-memo-change\.is-down\{color:#2f75b5;\}/);
  assert.match(adapterSource, /function getReportDeckMemoBuildCacheMap/);
  assert.match(adapterSource, /skipUtilityReady:\s*true/);
  assert.match(adapterSource, /'productionStats'/);
  assert.match(adapterSource, /'electricRows'/);
  assert.match(adapterSource, /'lineValueMaps'/);
  assert.match(adapterSource, /'wasteRows'/);
});

test('report deck memo input popup can be dragged by its header', () => {
  const deckDom = createReportDeckContainer({ withMemoOverviewWindow: true });
  const { registered } = createContext();
  let preventCount = 0;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.memoDialog.hidden = false;
  deckDom.listeners.pointerdown({
    target: deckDom.memoDialogDragHandle,
    button: 0,
    pointerId: 9,
    clientX: 700,
    clientY: 100,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoDialog.classList.contains('is-dragging'), true);
  assert.deepEqual(deckDom.memoDialogDragHandle.pointerCaptures, [9]);
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointermove, 'function');
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointerup, 'function');

  deckDom.memoOverviewWindowListeners.pointermove({
    clientX: 640,
    clientY: 130,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoDialog.style.left, '560px');
  assert.equal(deckDom.memoDialog.style.top, '84px');
  assert.equal(deckDom.memoDialog.style.right, 'auto');
  assert.equal(deckDom.memoDialog.dataset.reportMemoFloating, 'true');

  const pointerUp = deckDom.memoOverviewWindowListeners.pointerup;
  pointerUp({});

  assert.equal(deckDom.memoDialog.classList.contains('is-dragging'), false);
  assert.deepEqual(deckDom.memoDialogDragHandle.releasedPointerCaptures, [9]);
  assert.equal(deckDom.memoOverviewWindowListeners.pointermove, undefined);
  assert.equal(deckDom.memoOverviewWindowListeners.pointerup, undefined);
  assert.equal(preventCount, 2);
});

test('report deck memo overview popup can be dragged as a floating panel', () => {
  const deckDom = createReportDeckContainer({ withMemoOverviewWindow: true });
  const { registered } = createContext();
  let preventCount = 0;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.memoOverviewDialog.hidden = false;
  deckDom.listeners.pointerdown({
    target: deckDom.memoOverviewDragHandle,
    button: 0,
    pointerId: 7,
    clientX: 100,
    clientY: 80,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoOverviewDialog.classList.contains('is-dragging'), true);
  assert.deepEqual(deckDom.memoOverviewDragHandle.pointerCaptures, [7]);
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointermove, 'function');
  assert.equal(typeof deckDom.memoOverviewWindowListeners.pointerup, 'function');

  deckDom.memoOverviewWindowListeners.pointermove({
    clientX: 180,
    clientY: 140,
    preventDefault() {
      preventCount += 1;
    },
  });

  assert.equal(deckDom.memoOverviewDialog.style.left, '104px');
  assert.equal(deckDom.memoOverviewDialog.style.top, '124px');
  assert.equal(deckDom.memoOverviewDialog.style.right, 'auto');
  assert.equal(deckDom.memoOverviewDialog.dataset.reportMemoOverviewFloating, 'true');

  const pointerUp = deckDom.memoOverviewWindowListeners.pointerup;
  pointerUp({});

  assert.equal(deckDom.memoOverviewDialog.classList.contains('is-dragging'), false);
  assert.deepEqual(deckDom.memoOverviewDragHandle.releasedPointerCaptures, [7]);
  assert.equal(deckDom.memoOverviewWindowListeners.pointermove, undefined);
  assert.equal(deckDom.memoOverviewWindowListeners.pointerup, undefined);
  assert.equal(preventCount, 2);
});

test('report deck memo overview opens in a separate browser popup window', async () => {
  const popup = createPopupWindowMock();
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    openImpl: () => popup,
  });
  const overviewButton = {
    closest(selector) {
      return selector === '[data-report-memo-overview-toggle]' ? this : null;
    },
  };
  let prevented = false;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  deckDom.root.__reportDeckMeta.selectedMonth = '2025-12';
  deckDom.root.__reportDeckMeta.sharedStore = createReportDeckSharedStore();

  deckDom.listeners.click({
    target: overviewButton,
    preventDefault() {
      prevented = true;
    },
  });
  await flushMicrotasks();

  assert.equal(prevented, true);
  assert.equal(registered.openCalls.length, 1);
  assert.equal(registered.openCalls[0][1], 'kpi_report_memo_overview');
  assert.match(registered.openCalls[0][2], /width=920/);
  assert.equal(deckDom.memoOverviewDialog.hidden, true);
  assert.equal(popup.document.openCount >= 2, true);
  assert.equal(popup.document.closeCount, popup.document.openCount);
  assert.equal(popup.focusCount >= 2, true);
  assert.match(popup.document.writes[0], /report-memo-overview-empty/);
  assert.match(popup.document.html, /report-memo-overview-popup-head/);
  assert.match(popup.document.html, /data-report-memo-overview-list/);
  assert.match(popup.document.html, /report-memo-overview-row/);
  assert.match(popup.document.html, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(popup.document.html, /report-memo-overview-row\{[^}]*grid-template-columns:minmax\(48px,max-content\) minmax\(0,1fr\) auto;[^}]*border:1px solid #e5e7eb;[^}]*background:#fbfdff;[^}]*font-size:5\.2px;[^}]*line-height:1\.08;/);
  assert.doesNotMatch(popup.document.html, /report-memo-overview-row\.is-up\{/);
  assert.doesNotMatch(popup.document.html, /report-memo-overview-row\.is-down\{/);
  assert.match(popup.document.html, /report-memo-overview-copy\{[^}]*height:14px;[^}]*font-size:5\.2px;/);
  assert.match(popup.document.html, /data-report-memo-overview-copy/);
  assert.match(popup.document.html, /data-report-memo-copy-state/);
  assert.match(popup.document.html, /report-auto-memo-change\.is-up\{color:#c00000;\}/);
  assert.match(popup.document.html, /report-auto-memo-change\.is-down\{color:#2f75b5;\}/);
});

test('report deck memo overview copy button writes one memo line to clipboard', async () => {
  const copiedTexts = [];
  const deckDom = createReportDeckContainer();
  const { registered } = createContext({
    clipboardWriteTextImpl: async (text) => {
      copiedTexts.push(text);
    },
  });
  const copyButton = {
    dataset: {
      reportMemoCopyText: '유산 생산량은 전월대비 10% 상승했습니다.',
    },
    textContent: '복사',
    closest(selector) {
      return selector === '[data-report-memo-overview-copy]' ? this : null;
    },
  };
  let prevented = false;

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });

  deckDom.listeners.click({
    target: copyButton,
    preventDefault() {
      prevented = true;
    },
  });
  await flushMicrotasks();

  assert.equal(prevented, true);
  assert.deepEqual(copiedTexts, ['유산 생산량은 전월대비 10% 상승했습니다.']);
  assert.equal(copyButton.textContent, '복사됨');
  assert.equal(copyButton.dataset.reportMemoCopyState, 'copied');
});

test('report deck memo dialog edits notepad text and applies selected range formatting', async () => {
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
                slide3GasMemo: '전월대비 10, 5% ↑ 검정',
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

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  const normalMemoRow = deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-memo-row');

  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });

  assert.equal(deckDom.memoDialog.hidden, false);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="site_yusan"/);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="site_total"/);
  assert.match(deckDom.memoTeamSelect.innerHTML, /value="other"/);
  assert.match(deckDom.memoNotepad.value, /10, 5%/);
  assert.match(deckDom.memoPreview.innerHTML, /report-auto-memo-change is-up/);
  assert.equal(deckDom.memoNotepadFontSizeInput.disabled, true);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '3');
  assert.match(deckDom.memoContents[0].innerHTML, /report-auto-memo-delta">/);
  assert.match(deckDom.memoContents[0].innerHTML, /<span class="report-auto-memo-change is-up"> 10, 5% ↑<\/span> 검정/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delta is-up/);

  deckDom.memoNotepad.value = 'Edited memo';
  deckDom.memoNotepad.selectionStart = deckDom.memoNotepad.value.length;
  deckDom.memoNotepad.selectionEnd = deckDom.memoNotepad.value.length;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Edited memo/);

  deckDom.memoNotepad.value = 'Edited memo\nManual memo\nSecond manual memo';
  deckDom.memoNotepad.selectionStart = deckDom.memoNotepad.value.length;
  deckDom.memoNotepad.selectionEnd = deckDom.memoNotepad.value.length;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Manual memo/);
  assert.match(deckDom.memoContents[0].innerHTML, /Second manual memo/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delete/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /data-report-memo-delete-line/);

  const memoCandidateButton = {
    dataset: { reportMemoCandidate: '0' },
    closest(selector) {
      return selector === '[data-report-memo-candidate]' ? this : null;
    },
  };
  deckDom.memoDialog.__reportMemoCandidates = [{ text: 'Candidate memo', direction: 'up' }];
  const secondManualStart = deckDom.memoNotepad.value.indexOf('Second manual memo');
  deckDom.memoNotepad.selectionStart = secondManualStart;
  deckDom.memoNotepad.selectionEnd = secondManualStart;
  deckDom.listeners.click({
    target: memoCandidateButton,
    preventDefault() {},
  });
  assert.equal(deckDom.memoNotepad.value, 'Edited memo\nManual memo\nCandidate memo\nSecond manual memo');
  assert.match(deckDom.memoContents[0].innerHTML, /Candidate memo/);

  const revisedMemoText = 'Edited memo\nManual memo revised\nrow detail\nCandidate memo\nSecond manual memo';
  deckDom.memoNotepad.value = revisedMemoText;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.match(deckDom.memoContents[0].innerHTML, /Manual memo revised[\s\S]*row detail/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-delete/);
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /data-report-memo-delete-line/);
  const selectedMemoStart = revisedMemoText.indexOf('Manual memo revised') + 'Manual '.length;
  const selectedMemoEnd = selectedMemoStart + 'memo'.length;
  deckDom.memoNotepad.selectionStart = selectedMemoStart;
  deckDom.memoNotepad.selectionEnd = selectedMemoEnd;
  deckDom.listeners.select({ target: deckDom.memoNotepad });
  assert.equal(deckDom.memoNotepadFontSizeInput.disabled, false);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '3');
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  assert.match(
    deckDom.memoPreview.innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorClearButton,
    preventDefault() {},
  });
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /report-auto-memo-manual-color/);
  deckDom.listeners.click({
    target: deckDom.memoNotepadColorButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-color is-red">memo<\/span> revised/
  );
  deckDom.memoNotepadFontSizeButton.dataset.reportMemoNotepadFontSizeDelta = '1';
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(
    deckDom.memoContents[0].innerHTML,
    /Manual <span class="report-auto-memo-manual-size" style="font-size:11\.6px;line-height:1;"><span class="report-auto-memo-manual-color is-red">memo<\/span><\/span> revised/
  );
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '4');
  assert.match(
    deckDom.memoPreview.innerHTML,
    /Manual <span class="report-auto-memo-manual-size" style="font-size:11\.6px;line-height:1;"><span class="report-auto-memo-manual-color is-red">memo<\/span><\/span> revised/
  );
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:12\.8px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '5');
  deckDom.memoNotepadFontSizeButton.dataset.reportMemoNotepadFontSizeDelta = '-1';
  deckDom.listeners.click({
    target: deckDom.memoNotepadFontSizeButton,
    preventDefault() {},
  });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:11\.6px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '4');
  deckDom.memoNotepadFontSizeInput.value = '6';
  deckDom.listeners.change({ type: 'change', target: deckDom.memoNotepadFontSizeInput });
  assert.match(deckDom.memoContents[0].innerHTML, /style="font-size:14px;line-height:1;"/);
  assert.match(deckDom.memoPreview.innerHTML, /style="font-size:14px;line-height:1;"/);
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '6');
  deckDom.memoNotepad.selectionStart = revisedMemoText.indexOf('Manual memo revised');
  deckDom.memoNotepad.selectionEnd = selectedMemoEnd;
  deckDom.listeners.select({ target: deckDom.memoNotepad });
  assert.equal(deckDom.memoNotepadFontSizeInput.value, '?');
  assert.ok(deckDom.memoNotepad.focusCount >= 6);
  let memoLineSpacePropagationStopped = false;
  deckDom.listeners.keydown({
    key: ' ',
    code: 'Space',
    target: deckDom.memoNotepad,
    preventDefault() {
      assert.fail('space in a memo notepad should remain textarea input');
    },
    stopPropagation() {
      memoLineSpacePropagationStopped = true;
    },
  });
  assert.equal(memoLineSpacePropagationStopped, true);
  let memoLineEnterPropagationStopped = false;
  deckDom.listeners.keydown({
    key: 'Enter',
    code: 'Enter',
    target: deckDom.memoNotepad,
    preventDefault() {
      assert.fail('enter in a memo notepad should remain textarea line break');
    },
    stopPropagation() {
      memoLineEnterPropagationStopped = true;
    },
  });
  assert.equal(memoLineEnterPropagationStopped, true);

  const deletedMemoText = 'Edited memo\nManual memo revised\nrow detail\nSecond manual memo';
  deckDom.memoNotepad.value = deletedMemoText;
  deckDom.listeners.input({ target: deckDom.memoNotepad });
  assert.doesNotMatch(deckDom.memoContents[0].innerHTML, /Candidate memo/);
  assert.equal(deckDom.memoNotepad.value, deletedMemoText);

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

  const saveCall = fetchCalls.filter((call) => call.options?.method === 'PUT').at(-1);
  assert.ok(saveCall, 'report memo save request was not sent');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide3GasMemo, 'Edited memo\nManual memo revised\nrow detail\nSecond manual memo');
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineSizes), {});
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineSizeRanges), {
    slide3GasMemo: [[], [{ start: 7, end: 11, size: 3 }], [], []],
  });
  assert.deepEqual(JSON.parse(savedPayload.reportMemoLineColors), {
    slide3GasMemo: [[], [{ start: 7, end: 11, color: 'red' }], [], []],
  });
  assert.notEqual(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-memo-row'), normalMemoRow);
  assert.match(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-table-row'), /%$/);
  assert.match(deckDom.analysisColumns[0].style.getPropertyValue('--report-analysis-chart-row'), /%$/);
  assert.match(deckDom.analysisColumns[5].style.getPropertyValue('--report-analysis-memo-row'), /%$/);
  assert.match(deckDom.wasteLayouts[0].style.getPropertyValue('--report-waste-main-row'), /%$/);
  assert.match(deckDom.wasteLayouts[1].style.getPropertyValue('--report-waste-memo-row'), /%$/);
});

test('report deck completion saves pending memo notepad input to server', async () => {
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
                slide3GasMemo: '',
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

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });

  deckDom.memoNotepad.value = '북정 가스 직접 입력\n북정 전기 직접 입력';
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  const saveCall = fetchCalls.filter((call) => call.options?.method === 'PUT').at(-1);
  assert.ok(saveCall, 'pending manual memo was not saved');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide3GasMemo, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(deckDom.memoNotepad.value, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(deckDom.memoDialog.hidden, true);
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다']);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.memoTargets[0],
    preventDefault() {},
  });
  deckDom.memoNotepad.value = '북정 가스 직접 입력\n북정 전기 직접 입력';
  const putCountBeforeDuplicatePending = fetchCalls.filter((call) => call.options?.method === 'PUT').length;
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(deckDom.memoNotepad.value, '북정 가스 직접 입력\n북정 전기 직접 입력');
  assert.equal(fetchCalls.filter((call) => call.options?.method === 'PUT').length, putCountBeforeDuplicatePending);
});

test('util runtime browser adapter builds production team 1 start chart model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    [
      '2024-01',
      [
        { dateLabel: '2024-01-02', lineName: 'SD', amount: 500000 },
        { dateLabel: '2024-01-03', lineName: 'MSD', amount: 200000 },
        { dateLabel: '2024-01-04', lineName: 'ICA', amount: 400000 },
        { dateLabel: '2024-01-05', lineName: '지대', amount: 300000 },
      ],
    ],
    [
      '2025-01',
      [
        { dateLabel: '2025-01-02', lineName: 'SD', amount: 800000 },
        { dateLabel: '2025-01-03', lineName: 'MSD', amount: 200000 },
        { dateLabel: '2025-01-04', lineName: 'ICA', amount: 600000 },
        { dateLabel: '2025-01-05', lineName: '지대', amount: 500000 },
      ],
    ],
    [
      '2025-12',
      [
        { dateLabel: '2025-12-02', lineName: 'SD', amount: 700000 },
        { dateLabel: '2025-12-03', lineName: 'MSD', amount: 250000 },
        { dateLabel: '2025-12-04', lineName: 'ICA', amount: 640000 },
        { dateLabel: '2025-12-05', lineName: '지대', amount: 560000 },
      ],
    ],
    [
      '2026-01',
      [
        { dateLabel: '2026-01-02', lineName: 'S/D 건조', amount: 900000 },
        { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300000 },
        { dateLabel: '2026-01-04', lineName: 'ICA', amount: 660000 },
        { dateLabel: '2026-01-05', lineName: '지대', amount: 540000 },
      ],
    ],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter((entry) => {
      const isPart2 = String(teamName).includes('2');
      const lineToken = String(entry.lineName || '')
        .replace(/[^a-z0-9가-힣]/gi, '')
        .toLowerCase();
      return isPart2
        ? entry.lineName === 'ICA' || entry.lineName === '지대'
        : lineToken.includes('sd') || lineToken.includes('msd');
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
  const part1 = model.parts.find((part) => part.key === 'part1');
  const sd = part1.rows.find((row) => row.key === 'sd');
  const total = part1.rows.find((row) => row.key === 'total');
  assert.equal(sd.reference, 800);
  assert.equal(sd.previous, 700);
  assert.equal(sd.current, 900);
  assert.equal(sd.momIndex, (900 / 700) * 100);
  assert.equal(sd.yoyIndex, (900 / 800) * 100);
  assert.equal(sd.yoyRate, 100 / 800);
  assert.equal(total.current, 1200);
  assert.equal(JSON.stringify(part1.chart.monthKeys), JSON.stringify(['2024-01', '2025-01', '2025-12', '2026-01']));
  assert.equal(
    JSON.stringify(part1.chart.series[0].points.map((point) => point.value)),
    JSON.stringify([500, 800, 700, 900])
  );
  assert.equal(part1.chart.series[0].points.length, 4);
  assert.equal(part1.chart.series[0].points.at(-1).monthKey, '2026-01');
  assert.equal(part1.chart.series[0].points.at(-1).value, 900);

  const earlyModel = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionStartAnalysis('2025-01', {
    teamKey: 'team_01',
  });
  assert.equal(earlyModel.monthKeys.includes('2023-01'), false);
  assert.equal(
    JSON.stringify(earlyModel.parts.find((part) => part.key === 'part1').chart.monthKeys),
    JSON.stringify(['2024-01', '2025-01'])
  );
});

test('util runtime browser adapter builds production team 1 yield model from daily entries', async () => {
  const { context } = createContext();
  const entriesByMonth = new Map([
    [
      '2025-01',
      [
        { dateLabel: '2025-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 90 },
        { dateLabel: '2025-01-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 80 },
        { dateLabel: '2025-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 95 },
        { dateLabel: '2025-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 97 },
      ],
    ],
    [
      '2025-12',
      [
        { dateLabel: '2025-12-02', lineName: 'SD', amount: 100, moistureExcludedYield: 92 },
        { dateLabel: '2025-12-03', lineName: 'MSD', amount: 100, moistureExcludedYield: 82 },
        { dateLabel: '2025-12-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 96 },
        { dateLabel: '2025-12-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 98 },
      ],
    ],
    [
      '2026-01',
      [
        { dateLabel: '2026-01-02', lineName: 'SD', amount: 100, moistureExcludedYield: 96 },
        { dateLabel: '2026-01-03', lineName: 'MSD', amount: 300, moistureExcludedYield: 84 },
        { dateLabel: '2026-01-04', lineName: 'ICA', amount: 100, moistureExcludedYield: 98 },
        { dateLabel: '2026-01-05', lineName: '\uC9C0\uB300', amount: 100, moistureExcludedYield: 100 },
      ],
    ],
  ]);
  context.listUtilDailyEntriesByMetric = (teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const entries = (entriesByMonth.get(monthKey) || []).filter((entry) => {
      const isPart2 = String(teamName).includes('2');
      const lineName = String(entry.lineName || '');
      return isPart2 ? lineName === 'ICA' || lineName === '\uC9C0\uB300' : lineName === 'SD' || lineName === 'MSD';
    });
    return { period: null, entries };
  };

  const model = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckProductionYieldAnalysis('2026-01', {
    teamKey: 'team_01',
  });

  assert.equal(model.ok, true);
  assert.equal(model.monthKeys[0], '2025-01');
  assert.equal(model.monthKeys.at(-1), '2026-01');
  const part1 = model.parts.find((part) => part.key === 'part1');
  const sd = part1.rows.find((row) => row.key === 'sd');
  const total = part1.rows.find((row) => row.key === 'total');
  assert.equal(sd.current, 96);
  assert.equal(total.reference, 85);
  assert.equal(total.previous, 87);
  assert.equal(total.current, 87);
  assert.equal(total.yoyDelta, 2);
  assert.equal(total.yoyIndex, (87 / 85) * 100);
  assert.equal(JSON.stringify(part1.chart.series.map((series) => series.key)), JSON.stringify(['sd', 'msd']));
  assert.equal(JSON.stringify(part1.chart.series[0].points.map((point) => point.value)), JSON.stringify([90, 92, 96]));
  const part2 = model.parts.find((part) => part.key === 'part2');
  assert.equal(part2.rows.length, 1);
  assert.equal(part2.rows[0].current, 99);
  assert.equal(part2.chart.series[0].key, 'total');
  assert.equal(JSON.stringify(part2.chart.series[0].points.map((point) => point.value)), JSON.stringify([96, 97, 99]));
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
  assert.equal(
    sharedStore.store.resourceDatasets.electric.billingSettlementEntries['2025-12'].scopes.bukjeong.completed,
    true
  );
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
  assert.equal(model.gas.rows.unit.reference, 10 / 100);
  assert.equal(model.gas.rows.unit.current, 9 / 80);
  assert.equal(model.gas.rows.unit.previous, 8 / 75);
  assert.equal(model.gas.rows.unit.delta, 9 / 80 - 10 / 100);
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
  assert.equal(model.electric.rows.unit.current, 16 / 80);
  assert.equal(model.electric.rows.unit.previous, 15 / 75);
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
  assert.equal(JSON.stringify(model.gas.chart.series.map((item) => item.key)), JSON.stringify(['2024', '2025']));
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

  assert.equal(deckDom.root.dataset.reportMonth, getLatestReportMonthKey());
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
        [
          '2025-04',
          { production: 300, lngUsage: 30, lngCost: 3000, lpgCost: 700, gasCost: 3700, ratioProduction: { lng: 300 } },
        ],
        [
          '2026-04',
          { production: 240, lngUsage: 24, lngCost: 2500, lpgCost: 800, gasCost: 3300, ratioProduction: { lng: 240 } },
        ],
      ]);
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2024-01');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'yusan');
      assert.deepEqual(Array.from(option.reportTeamFilters), ['1팀 2파트', '2팀', '3팀']);
      assert.deepEqual(Array.from(option.productionTeamNames), ['1팀 2파트', '2팀', '3팀']);
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
        [
          '2024-11',
          {
            production: 1000,
            lpgUsage: 70,
            lpgCost: 9300,
            lngCost: 12000,
            lpgConversionRatio: 9300 / 10000,
            gasCost: 21300,
            ratioProduction: { lpg: 1000 },
          },
        ],
        [
          '2025-10',
          {
            production: 780,
            lpgUsage: 60,
            lpgCost: 8200,
            lngCost: 19000,
            lpgConversionRatio: 8200 / 15000,
            gasCost: 27200,
            ratioProduction: { lpg: 780 },
          },
        ],
        [
          '2025-11',
          {
            production: 800,
            lpgUsage: 64,
            lpgCost: 8600,
            lngCost: 20000,
            lpgConversionRatio: 8600 / 16000,
            gasCost: 28600,
            ratioProduction: { lpg: 800 },
          },
        ],
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
  assert.equal(model.rows.unit.reference, 70 / 1000);
  assert.equal(model.rows.unit.current, 64 / 800);
  assert.equal(model.rows.unit.previous, 60 / 780);
  assert.equal(model.rows.unit.monthDelta, 64 / 800 - 60 / 780);
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
  assert.ok(Math.abs(model.costRows[1].reference - 10000) < 1e-9);
  assert.ok(Math.abs(model.costRows[1].current - 16000) < 1e-9);
  assert.ok(Math.abs(model.costRows[1].previous - 15000) < 1e-9);
  assert.equal(model.costRows[2].reference, 9300 / 10000);
  assert.equal(model.costRows[2].current, 8600 / 16000);
  assert.equal(model.costRows[2].previous, 8200 / 15000);
  assert.ok(Math.abs(model.costRows[2].delta - (8600 / 16000 - 9300 / 10000)) < 1e-12);
  assert.ok(Math.abs(model.costRows[2].rate - (8600 / 16000 - 9300 / 10000) / (9300 / 10000)) < 1e-12);
  assert.equal(model.costRows[3].reference, -700);
  assert.equal(model.costRows[3].current, -7400);
  assert.equal(model.costRows[3].previous, -6800);
  assert.equal(model.costRows[3].delta, -6700);
  assert.equal(model.costRows[3].monthDelta, -600);
  assert.equal(model.costChart.title, 'LPG, LNG환산 (원)');
  assert.equal(
    model.costChart.series.find((item) => item.key === '2025').points.find((point) => point.month === 11).value,
    -7400
  );
  assert.equal(
    model.costChart.series.find((item) => item.key === '2025').points.find((point) => point.month === 12).value,
    null
  );
  assert.match(runtimeSource, /const compactHeader = options\.compactHeader !== false/);
  assert.match(runtimeSource, /const roomyPlot = options\.roomyPlot === true/);
  assert.doesNotMatch(runtimeSource, /compactHeader:\s*true/);
  assert.match(runtimeSource, /function getReportDeckAutoChartLegendStart/);
  assert.match(runtimeSource, /const maxStart = width - rightMargin - legendWidth/);
  assert.match(runtimeSource, /const plotLeft = compactHeader \? \(roomyPlot \? 26 : 34\) : 52/);
  assert.match(runtimeSource, /const plotRight = compactHeader \? \(roomyPlot \? 26 : 34\) : 52/);
  assert.match(runtimeSource, /const plotTop = compactHeader \? \(roomyPlot \? 50 : 54\) : 76/);
  assert.match(runtimeSource, /const plotBottom = compactHeader \? \(roomyPlot \? 24 : 32\) : 38/);
  assert.match(runtimeSource, /height - \(roomyPlot \? 5 : 10\)/);
  assert.match(runtimeSource, /roomyPlot:\s*true/);
  assert.match(runtimeSource, /getReportDeckAutoChartLegendStart\(width,\s*plotRight,\s*series\.length,\s*legendItemWidth,\s*chart\?\.title,\s*compactHeader\)/);
  assert.match(runtimeSource, /Array\.isArray\(options\.labelOffsets\)/);
  assert.match(runtimeSource, /:\s*\[0,\s*18,\s*31,\s*44,\s*56\]/);
  assert.match(runtimeSource, /roomyPlot:\s*true,\s*labelOffsets:\s*\[0,\s*22,\s*38,\s*54,\s*70\]/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_SLOTS_PER_PAGE = 8/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_COLUMNS_PER_ROW = 4/);
  assert.match(runtimeSource, /const REPORT_DECK_SLIDE10_ROWS_PER_PAGE = 2/);
  assert.match(runtimeSource, /slide10TableOrder:\s*''/);
  assert.match(runtimeSource, /function parseReportDeckSlide10TableOrder/);
  assert.match(runtimeSource, /function moveReportDeckSlide10Table/);
  assert.match(runtimeSource, /data-report-safety-table-move/);
  assert.match(runtimeSource, /const REPORT_DECK_OTHER_TEAM_LABEL = '[^']+'/);
  assert.match(runtimeSource, /REPORT_DECK_SLIDE8_OVERVIEW_TEAMS = Object\.freeze\(\[[^\]]*REPORT_DECK_OTHER_TEAM_LABEL[^\]]*\]\)/);
  assert.match(runtimeSource, /function normalizeReportDeckSlide10Team/);
  assert.match(runtimeSource, /function syncReportDeckOverviewCustomTeamRow/);
  assert.match(runtimeSource, /data-report-overview-custom-team/);
  assert.match(runtimeSource, /function normalizeReportDeckSlide10Hazard\(value\) \{\s*return String\(value \|\| ''\)\.trim\(\);\s*\}/);
  assert.doesNotMatch(runtimeSource, /REPORT_DECK_SLIDE10_HAZARD_OPTIONS/);
  assert.match(runtimeSource, /const REPORT_DECK_PLAN_SLIDE_KEYS = Object\.freeze\(\['slide8', 'slide9', 'slide10'\]\)/);
  assert.doesNotMatch(runtimeSource, /slide10:\s*16/);
  assert.match(runtimeSource, /if \(normalizedSlideKey === 'slide10'\) return Number\.POSITIVE_INFINITY;/);
  assert.match(runtimeSource, /appendReportDeckSlide10EditableEmptyRows/);
  assert.match(runtimeSource, /function buildReportDeckYusanLpgCostBarChartSvg/);
  assert.match(runtimeSource, /label:\s*'LPG',\s*color:\s*'#c0504d'/);
  assert.match(runtimeSource, /label:\s*'LPG',\s*color:\s*'#c0504d'[\s\S]*label:\s*'LNG환산',\s*color:\s*'#4472c4'/);
  assert.match(runtimeSource, /buildReportDeckBarChartLegendHtml\(series\)/);
  assert.match(runtimeSource, /buildReportDeckChartHighlightRectSvg/);
  assert.match(runtimeSource, /data-report-chart-highlight-point="true"/);
  assert.match(runtimeSource, /buildReportDeckYusanLpgCostBarChartSvg\(model,\s*\{/);
  assert.match(runtimeSource, /const legendHtml = compactHeader \? buildReportDeckAutoChartLegendHtml\(series\) : ''/);
  assert.match(runtimeSource, /report-auto-chart-legend-overlay/);
  assert.match(runtimeSource, /formatReportDeckChartValue\(value,\s*0,\s*'number'\)/);
  assert.match(runtimeSource, /formatReportDeckChartValue\(value,\s*valueDecimals,\s*valueFormat\)/);
  assert.equal(
    model.chart.series.find((item) => item.key === '2025').points.find((point) => point.month === 11).value,
    0.08
  );
  assert.equal(
    model.chart.series.find((item) => item.key === '2025').points.find((point) => point.month === 12).value,
    null
  );
});

test('util runtime browser adapter builds report memo candidates with direction markers', async () => {
  const { context } = createContext();
  const monthly = new Map([
    [
      '2025-04',
      {
        productionByTeam: { '1팀 2파트': 1100, '2팀': 500, '3팀': 400 },
        lng: 75,
        lngCost: 7500,
        lpg: 40,
        lpgCost: 4000,
      },
    ],
    [
      '2026-03',
      {
        productionByTeam: { '1팀 2파트': 800, '2팀': 700, '3팀': 500 },
        lng: 65,
        lngCost: 6500,
        lpg: 60,
        lpgCost: 6000,
      },
    ],
    [
      '2026-04',
      {
        productionByTeam: { '1팀 2파트': 1000, '2팀': 900, '3팀': 600 },
        lng: 70,
        lngCost: 7000,
        lpg: 50,
        lpgCost: 5000,
      },
    ],
  ]);
  const readProduction = (monthKey, teamNames = []) => {
    const productionByTeam = monthly.get(monthKey)?.productionByTeam || {};
    let total = 0;
    let hasValue = false;
    (Array.isArray(teamNames) ? teamNames : []).forEach((teamName) => {
      const value = Number(productionByTeam[teamName]);
      if (!Number.isFinite(value)) return;
      total += value;
      hasValue = true;
    });
    return hasValue ? total : NaN;
  };

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
      return readProduction(monthKey, teamNames);
    },
    getUtilGasAnalysisTeamUsageValue(monthKey, teamNames) {
      if (teamNames.includes('1팀 2파트 (LPG)')) return monthly.get(monthKey)?.lpg ?? NaN;
      if (teamNames.includes('1팀 2파트 (LNG)')) return monthly.get(monthKey)?.lng ?? NaN;
      return NaN;
    },
    buildUtilGasAnalysisMetricMap(monthKeys) {
      return new Map(
        monthKeys.map((monthKey) => {
          const row = monthly.get(monthKey) || {};
          return [
            monthKey,
            {
              lngCost: row.lngCost ?? null,
              lpgCost: row.lpgCost ?? null,
            },
          ];
        })
      );
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2025-04');
      assert.equal(bounds.to, '2026-04');
      assert.equal(option.key, 'team_01_02');
      return [
        { monthKey: '2025-04', electricUsage: 120, electricCost: 12000 },
        { monthKey: '2026-03', electricUsage: 90, electricCost: 9000 },
        { monthKey: '2026-04', electricUsage: 100, electricCost: 10000 },
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
  assert.equal(
    JSON.stringify(production.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
      'electric',
      'electric_cost',
      'electric_unit',
      'lng',
      'lng_cost',
      'lng_unit',
      'lpg',
      'lpg_cost',
      'gas_cost',
      'lpg_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::지대',
      'production_line::ICA',
    ])
  );
  assert.equal(production.candidates.length, 1);
  assert.equal(production.candidates[0].direction, 'mixed');
  assert.match(
    production.candidates[0].text,
    /1팀 2파트 생산량 1,000kg 전년대비 100kg, 9\.1% ↓, 전월대비 200kg, 25\.0% ↑/
  );
  assert.equal(production.candidates[0].segments[0].direction, 'down');
  assert.equal(production.candidates[0].segments[1].direction, 'up');

  const yusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'yusan_production_share',
  });
  assert.equal(yusanShare.candidates[0].direction, 'down');
  assert.match(yusanShare.candidates[0].text, /1팀 2파트 유산 생산량 비율 40% 전년대비 15%p ↓, 전월대비 동일/);

  const electric = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric',
  });
  assert.equal(electric.candidates[0].direction, 'mixed');
  assert.match(electric.candidates[0].text, /전력량 100kWh 전년대비 20kWh, 16\.7% ↓, 전월대비 10kWh, 11\.1% ↑/);

  const electricCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric_cost',
  });
  assert.equal(electricCost.candidates[0].direction, 'mixed');
  assert.equal(electricCost.candidates[0].segments[0].direction, 'down');
  assert.equal(electricCost.candidates[0].segments[1].direction, 'up');
  assert.match(
    electricCost.candidates[0].text,
    /전기 비용 10,000원 전년대비 2,000원, 16\.7% ↓, 전월대비 1,000원, 11\.1% ↑/
  );

  const electricUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric_unit',
  });
  assert.equal(electricUnit.candidates[0].direction, 'down');
  assert.match(
    electricUnit.candidates[0].text,
    /생산량 대비 전력량 0\.100kWh\/kg 전년대비 0\.009kWh\/kg, 8\.3% ↓, 전월대비 0\.013kWh\/kg, 11\.5% ↓/
  );

  const lngUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_unit',
  });
  assert.equal(lngUnit.candidates[0].direction, 'mixed');
  assert.match(
    lngUnit.candidates[0].text,
    /생산량 대비 LNG 0\.070m³\/kg 전년대비 0\.002m³\/kg, 2\.9% ↑, 전월대비 0\.011m³\/kg, 13\.6% ↓/
  );

  const originalLngUnitReferenceMonth = monthly.get('2025-04');
  const originalLngUnitCurrentMonth = monthly.get('2026-04');
  monthly.set('2025-04', {
    ...monthly.get('2025-04'),
    productionByTeam: { ...monthly.get('2025-04')?.productionByTeam, '1팀 2파트': 1000 },
    lng: 102.4,
  });
  monthly.set('2026-04', {
    ...monthly.get('2026-04'),
    productionByTeam: { ...monthly.get('2026-04')?.productionByTeam, '1팀 2파트': 1000 },
    lng: 101.6,
  });
  const lngUnitRoundedEqual = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_unit',
  });
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].direction, 'flat');
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].text, '\uC804\uB144\uB300\uBE44 \uB3D9\uC77C');
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].displayReference, 0.102);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].displayCurrent, 0.102);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].delta, 0);
  assert.equal(lngUnitRoundedEqual.candidates[0].segments[0].rate, 0);
  monthly.set('2025-04', originalLngUnitReferenceMonth);
  monthly.set('2026-04', originalLngUnitCurrentMonth);

  const lngCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lng_cost',
  });
  assert.equal(lngCost.candidates[0].direction, 'mixed');
  assert.equal(lngCost.candidates[0].segments[0].direction, 'down');
  assert.equal(lngCost.candidates[0].segments[1].direction, 'up');
  assert.match(lngCost.candidates[0].text, /LNG 비용 7,000원 전년대비 500원, 6\.7% ↓, 전월대비 500원, 7\.7% ↑/);

  const lpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg',
  });
  assert.equal(lpg.candidates[0].direction, 'mixed');
  assert.match(lpg.candidates[0].text, /LPG 사용량 50kg 전년대비 10kg, 25\.0% ↑, 전월대비 10kg, 16\.7% ↓/);

  const lpgCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_cost',
  });
  assert.equal(lpgCost.candidates[0].direction, 'mixed');
  assert.equal(lpgCost.candidates[0].segments[0].direction, 'up');
  assert.equal(lpgCost.candidates[0].segments[1].direction, 'down');
  assert.match(lpgCost.candidates[0].text, /LPG 비용 5,000원 전년대비 1,000원, 25\.0% ↑, 전월대비 1,000원, 16\.7% ↓/);

  const gasCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'gas_cost',
  });
  assert.equal(gasCost.candidates[0].direction, 'mixed');
  assert.equal(gasCost.candidates[0].segments[0].direction, 'up');
  assert.equal(gasCost.candidates[0].segments[1].direction, 'down');
  assert.match(gasCost.candidates[0].text, /가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);

  const lpgUnit = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_unit',
  });
  assert.equal(lpgUnit.candidates[0].direction, 'mixed');
  assert.match(
    lpgUnit.candidates[0].text,
    /생산량 대비 LPG 0\.050kg\/kg 전년대비 0\.014kg\/kg, 38\.9% ↑, 전월대비 0\.025kg\/kg, 33\.3% ↓/
  );

  const originalLpgUnitReferenceMonth = monthly.get('2025-04');
  const originalLpgUnitCurrentMonth = monthly.get('2026-04');
  monthly.set('2025-04', {
    ...monthly.get('2025-04'),
    productionByTeam: { ...monthly.get('2025-04')?.productionByTeam, '1팀 2파트': 1000 },
    lpg: 50,
  });
  monthly.set('2026-04', {
    ...monthly.get('2026-04'),
    productionByTeam: { ...monthly.get('2026-04')?.productionByTeam, '1팀 2파트': 1000 },
    lpg: 49.95,
  });
  const lpgUnitTinyDelta = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'lpg_unit',
  });
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].basis, '전년대비');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].direction, 'flat');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[0].text, '전년대비 동일');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[1].basis, '전월대비');
  assert.equal(lpgUnitTinyDelta.candidates[0].segments[1].direction, 'down');
  monthly.set('2025-04', originalLpgUnitReferenceMonth);
  monthly.set('2026-04', originalLpgUnitCurrentMonth);

  const cipCount = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'cip_count',
    store: {
      resourceDatasets: {
        other: {
          teamMonthlyEntries: {
            '2025-04': { team_01_02: { cip_count: 2 } },
            '2026-03': { team_01_02: { cip_count: 5 } },
            '2026-04': { team_01_02: { cip_count: 4 } },
          },
        },
      },
    },
  });
  assert.equal(cipCount.candidates[0].direction, 'mixed');
  assert.equal(cipCount.candidates[0].segments[0].direction, 'up');
  assert.equal(cipCount.candidates[0].segments[1].direction, 'down');
  assert.match(cipCount.candidates[0].text, /1팀 2파트 CIP 횟수 4회 전년대비 2회 ↑, 전월대비 1회 ↓/);
  assert.doesNotMatch(cipCount.candidates[0].text, /%/);

  const cipTime = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'cip_time',
    store: {
      resourceDatasets: {
        other: {
          teamMonthlyEntries: {
            '2025-04': { team_01_02: { cip_time: 2 } },
            '2026-03': { team_01_02: { cip_time: 5 } },
            '2026-04': { team_01_02: { cip_time: 4.5 } },
          },
        },
      },
    },
  });
  assert.equal(cipTime.candidates[0].direction, 'mixed');
  assert.equal(cipTime.candidates[0].segments[0].direction, 'up');
  assert.equal(cipTime.candidates[0].segments[1].direction, 'down');
  assert.match(cipTime.candidates[0].text, /1팀 2파트 CIP 시간 4\.5시간 전년대비 2\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.doesNotMatch(cipTime.candidates[0].text, /%/);

  const aggregateCipStore = {
    resourceDatasets: {
      other: {
        teamMonthlyEntries: {
          '2025-04': {
            team_01_01: { cip_count: 1, cip_time: 1.5 },
            team_01_02: { cip_count: 2, cip_time: 2 },
            team_02: { cip_count: 3, cip_time: 3 },
            team_03: { cip_count: 4, cip_time: 4 },
          },
          '2026-03': {
            team_01_01: { cip_count: 2, cip_time: 2 },
            team_01_02: { cip_count: 5, cip_time: 5 },
            team_02: { cip_count: 3, cip_time: 3 },
            team_03: { cip_count: 6, cip_time: 6 },
          },
          '2026-04': {
            team_01_01: { cip_count: 3, cip_time: 3 },
            team_01_02: { cip_count: 4, cip_time: 4.5 },
            team_02: { cip_count: 4, cip_time: 4 },
            team_03: { cip_count: 5, cip_time: 5 },
          },
        },
      },
    },
  };
  const yusanCipTime = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_yusan',
    metricKey: 'cip_time',
    store: aggregateCipStore,
  });
  assert.equal(
    JSON.stringify(yusanCipTime.availableMetricKeys),
    JSON.stringify([
      'production',
      'electric',
      'electric_cost',
      'electric_unit',
      'lng',
      'lng_cost',
      'lng_unit',
      'lpg',
      'lpg_cost',
      'gas_cost',
      'lpg_unit',
      'cip_count',
      'cip_time',
    ])
  );
  assert.match(yusanCipTime.candidates[0].text, /유산 CIP 시간 13\.5시간 전년대비 4\.5시간 ↑, 전월대비 0\.5시간 ↓/);

  const yusanProduction = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_yusan',
    metricKey: 'production',
  });
  assert.equal(yusanProduction.candidates.length, 1);
  assert.match(yusanProduction.candidates[0].text, /2,500kg/);
  assert.match(yusanProduction.candidates[0].text, /500kg, 25\.0%/);

  const totalCipCount = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'site_total',
    metricKey: 'cip_count',
    store: aggregateCipStore,
  });
  assert.equal(JSON.stringify(totalCipCount.availableMetricKeys), JSON.stringify(['cip_count', 'cip_time']));
  assert.match(totalCipCount.candidates[0].text, /전체 CIP 횟수 16회 전년대비 6회 ↑, 전월대비 동일/);

  const otherTeamLpg = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lpg',
  });
  assert.equal(otherTeamLpg.ok, true);
  assert.equal(
    JSON.stringify(otherTeamLpg.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
      'electric',
      'electric_cost',
      'electric_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::로터리·버티컬',
      'production_line::스틱',
    ])
  );
  assert.equal(otherTeamLpg.metricKey, 'lpg');
  assert.equal(otherTeamLpg.candidates.length, 0);

  const team2YusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'yusan_production_share',
  });
  assert.match(team2YusanShare.candidates[0].text, /2팀 유산 생산량 비율 36% 전년대비 11%p ↑, 전월대비 1%p ↑/);

  const otherTeamLng = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_02',
    metricKey: 'lng',
  });
  assert.equal(otherTeamLng.ok, true);
  assert.equal(
    JSON.stringify(otherTeamLng.availableMetricKeys),
    JSON.stringify([
      'production',
      'yusan_production_share',
      'electric',
      'electric_cost',
      'electric_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::로터리·버티컬',
      'production_line::스틱',
    ])
  );
  assert.equal(otherTeamLng.metricKey, 'lng');
  assert.equal(otherTeamLng.candidates.length, 0);

  const team3YusanShare = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_03',
    metricKey: 'yusan_production_share',
  });
  assert.match(team3YusanShare.candidates[0].text, /3팀 유산 생산량 비율 24% 전년대비 4%p ↑, 전월대비 1%p ↓/);

  const lineProduction = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'production_line::SD',
  });
  assert.equal(lineProduction.ok, true);
  assert.equal(
    JSON.stringify(lineProduction.availableMetricKeys),
    JSON.stringify([
      'production',
      'electric',
      'electric_cost',
      'electric_unit',
      'lng',
      'lng_cost',
      'lng_unit',
      'yield_rate',
      'operation_rate',
      'work_time',
      'operation_time',
      'rework_production',
      'rework_production_share',
      'production_days',
      'off_days',
      'product_count',
      'cip_count',
      'cip_time',
      'production_line::SD',
      'production_line::MSD',
    ])
  );
  assert.equal(lineProduction.candidates.length, 1);
  assert.equal(lineProduction.candidates[0].direction, 'mixed');
  assert.match(
    lineProduction.candidates[0].text,
    /1팀 1파트 SD 생산량 700kg 전년대비 100kg, 12\.5% ↓, 전월대비 200kg, 40\.0% ↑/
  );

  const temperature = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'other',
    metricKey: 'monthly_average_temperature',
    store: {
      resourceDatasets: {
        other: {
          monthlyEntries: {
            '2025-04': { average_temperature: 21.2 },
            '2026-03': { average_temperature: 24.1 },
            '2026-04': { average_temperature: 23.4 },
          },
          teamMonthlyEntries: {
            '2025-04': {
              team_01_01: { cip_count: 1 },
              team_01_02: { cip_count: 2 },
              team_02: { cip_count: 3 },
              team_03: { cip_count: 4 },
            },
            '2026-03': {
              team_01_01: { cip_count: 2 },
              team_01_02: { cip_count: 5 },
              team_02: { cip_count: 3 },
              team_03: { cip_count: 6 },
            },
            '2026-04': {
              team_01_01: { cip_count: 3 },
              team_01_02: { cip_count: 4 },
              team_02: { cip_count: 4 },
              team_03: { cip_count: 5 },
            },
          },
        },
      },
    },
  });
  assert.equal(temperature.ok, true);
  assert.equal(JSON.stringify(temperature.availableMetricKeys), JSON.stringify(['monthly_average_temperature']));
  assert.equal(temperature.candidates.length, 1);
  assert.equal(temperature.candidates[0].direction, 'mixed');
  assert.match(temperature.candidates[0].text, /기타 월간 평균온도 23\.4℃ 전년대비 2\.2℃ ↑, 전월대비 0\.7℃ ↓/);
  assert.doesNotMatch(temperature.candidates[0].text, /%/);
});

test('util runtime browser adapter omits prior-year memo comparison when the prior year has no data', async () => {
  const { context } = createContext();
  context.KPIUtilReportSheetOptions = {
    getUtilElectricAnalysisTeamOption(value) {
      assert.equal(value, 'team_01_02');
      return {
        key: value,
        label: '1팀 2파트',
        reportTeamFilters: ['1팀 2파트'],
        productionTeamNames: ['1팀 2파트'],
      };
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2023-04');
      assert.equal(bounds.to, '2024-04');
      assert.equal(option.key, 'team_01_02');
      return [
        { monthKey: '2023-04', year: 2023, month: 4, electricUsage: 0, electricCost: 0, production: null },
        { monthKey: '2024-03', year: 2024, month: 3, electricUsage: 80, electricCost: 800, production: 800 },
        { monthKey: '2024-04', year: 2024, month: 4, electricUsage: 100, electricCost: 1000, production: 1000 },
      ];
    },
  };

  const electric = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2024-04', {
    teamKey: 'team_01_02',
    metricKey: 'electric',
  });
  assert.equal(electric.ok, true);
  assert.equal(electric.candidates.length, 1);
  assert.equal(electric.candidates[0].segments.length, 1);
  assert.equal(electric.candidates[0].segments[0].basis, '전월대비');
  assert.doesNotMatch(electric.candidates[0].text, /전년대비/);

  const makeEntry = (dateLabel) => ({
    dateLabel,
    teamName: '1팀 2파트',
    lineName: 'ICA',
    productName: '제품 A',
    amount: 100,
  });
  const periodByMonth = new Map([
    ['2024-03', { startDate: new Date(2024, 2, 1), endDate: new Date(2024, 2, 3) }],
    ['2024-04', { startDate: new Date(2024, 3, 1), endDate: new Date(2024, 3, 3) }],
  ]);
  const entriesByMonth = new Map([
    ['2024-03', [makeEntry('2024-03-01')]],
    ['2024-04', [makeEntry('2024-04-01'), makeEntry('2024-04-02')]],
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

  const productionDays = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2024-04', {
    teamKey: 'team_01_02',
    metricKey: 'production_days',
  });
  assert.equal(productionDays.ok, true);
  assert.equal(productionDays.candidates.length, 1);
  assert.equal(productionDays.candidates[0].segments.length, 1);
  assert.equal(productionDays.candidates[0].segments[0].basis, '전월대비');
  assert.doesNotMatch(productionDays.candidates[0].text, /전년대비/);
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
    [
      '2025-04',
      {
        production: 1100,
        electric: 120,
        yusanProduction: 3000,
        yusanElectric: 300,
        yusanLngCost: 7500,
        yusanLpgCost: 4000,
      },
    ],
    [
      '2026-03',
      {
        production: 800,
        electric: 90,
        yusanProduction: 2400,
        yusanElectric: 270,
        yusanLngCost: 6500,
        yusanLpgCost: 6000,
      },
    ],
    [
      '2026-04',
      {
        production: 1000,
        electric: 100,
        yusanProduction: 2700,
        yusanElectric: 330,
        yusanLngCost: 7000,
        yusanLpgCost: 5000,
      },
    ],
  ]);
  const isYusanTeamNames = (teamNames) => {
    const names = new Set((Array.isArray(teamNames) ? teamNames : []).filter(Boolean));
    return ['1팀 2파트', '2팀', '3팀'].every((teamName) => names.has(teamName));
  };
  context.KPIUtilReportSheetOptions = {
    getUtilGasAnalysisCategoryOption(value) {
      if (value === 'yusan') {
        return {
          key: 'yusan',
          label: '유산',
          usageTeams: {
            lng: ['1팀 2파트 (LNG)', '2팀 (LNG)', '3팀 (LNG)'],
            lpg: ['1팀 2파트 (LPG)'],
          },
          showLpgCard: true,
          includeYusanLngCost: true,
        };
      }
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
      if (value === 'yusan') {
        return {
          key: 'combined',
          label: '합산',
          reportTeamFilters: Object.values(teamLabels),
          productionTeamNames: Object.values(teamLabels),
        };
      }
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
    getUtilGasAnalysisProductionValue(monthKey, teamNames = []) {
      return isYusanTeamNames(teamNames)
        ? (monthly.get(monthKey)?.yusanProduction ?? NaN)
        : (monthly.get(monthKey)?.production ?? NaN);
    },
    getUtilGasAnalysisTeamUsageValue() {
      return NaN;
    },
    buildUtilGasAnalysisMetricMap(monthKeys) {
      return new Map(
        monthKeys.map((monthKey) => {
          const row = monthly.get(monthKey) || {};
          return [
            monthKey,
            {
              lngCost: row.yusanLngCost ?? null,
              lpgCost: row.yusanLpgCost ?? null,
            },
          ];
        })
      );
    },
  };
  context.KPIUtilReportSheetAnalysisElectricModel = {
    buildUtilElectricAnalysisScopedRows(bounds, option) {
      assert.equal(bounds.from, '2025-04');
      assert.equal(bounds.to, '2026-04');
      const isYusan = option?.key === 'site_yusan';
      return [
        {
          monthKey: '2025-04',
          electricUsage: isYusan ? monthly.get('2025-04').yusanElectric : monthly.get('2025-04').electric,
          production: isYusan ? monthly.get('2025-04').yusanProduction : monthly.get('2025-04').production,
        },
        {
          monthKey: '2026-03',
          electricUsage: isYusan ? monthly.get('2026-03').yusanElectric : monthly.get('2026-03').electric,
          production: isYusan ? monthly.get('2026-03').yusanProduction : monthly.get('2026-03').production,
        },
        {
          monthKey: '2026-04',
          electricUsage: isYusan ? monthly.get('2026-04').yusanElectric : monthly.get('2026-04').electric,
          production: isYusan ? monthly.get('2026-04').yusanProduction : monthly.get('2026-04').production,
        },
      ];
    },
    buildUtilElectricAnalysisLineRatioSeries() {
      return [];
    },
  };

  const overview = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoOverview('2026-04', {
    store: {
      resourceDatasets: {
        other: {
          monthlyEntries: {
            '2025-04': { average_temperature: 21.2 },
            '2026-03': { average_temperature: 24.1 },
            '2026-04': { average_temperature: 23.4 },
          },
          teamMonthlyEntries: {
            '2025-04': {
              team_01_01: { cip_count: 1, cip_time: 1.5 },
              team_01_02: { cip_count: 2, cip_time: 2 },
              team_02: { cip_count: 3, cip_time: 3 },
              team_03: { cip_count: 4, cip_time: 4 },
            },
            '2026-03': {
              team_01_01: { cip_count: 2, cip_time: 2 },
              team_01_02: { cip_count: 5, cip_time: 5 },
              team_02: { cip_count: 3, cip_time: 3 },
              team_03: { cip_count: 6, cip_time: 6 },
            },
            '2026-04': {
              team_01_01: { cip_count: 3, cip_time: 3 },
              team_01_02: { cip_count: 4, cip_time: 4.5 },
              team_02: { cip_count: 4, cip_time: 4 },
              team_03: { cip_count: 5, cip_time: 5 },
            },
          },
        },
      },
    },
  });
  assert.equal(overview.ok, true);
  assert.equal(overview.groups[0]?.key, 'site_yusan');
  assert.equal(overview.groups[0]?.label, '유산');
  assert.ok(overview.groups.some((group) => group.key === 'site_total' && group.label === '전체'));
  assert.ok(overview.groups.some((group) => group.key === 'team_01_02'));
  assert.ok(overview.groups.some((group) => group.key === 'other' && group.label === '기타'));
  const joined = overview.candidates.map((candidate) => candidate.text).join('\n');
  assert.match(joined, /유산 생산량 2,700kg 전년대비 300kg, 10\.0% ↓, 전월대비 300kg, 12\.5% ↑/);
  assert.match(joined, /유산 전력량 330kWh 전년대비 30kWh, 10\.0% ↑, 전월대비 60kWh, 22\.2% ↑/);
  assert.match(joined, /유산 가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);
  assert.match(joined, /유산 CIP 횟수 13회 전년대비 4회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /유산 CIP 시간 13\.5시간 전년대비 4\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.match(joined, /전체 CIP 횟수 16회 전년대비 6회 ↑, 전월대비 동일/);
  assert.match(joined, /전체 CIP 시간 16\.5시간 전년대비 6\.0시간 ↑, 전월대비 0\.5시간 ↑/);
  assert.match(joined, /1팀 2파트 생산량 1,000kg 전년대비 100kg, 9\.1% ↓, 전월대비 200kg, 25\.0% ↑/);
  assert.match(joined, /전력량 100kWh 전년대비 20kWh, 16\.7% ↓, 전월대비 10kWh, 11\.1% ↑/);
  assert.match(joined, /1팀 2파트 가스 비용 12,000원 전년대비 500원, 4\.3% ↑, 전월대비 500원, 4\.0% ↓/);
  assert.match(joined, /1팀 1파트 CIP 횟수 3회 전년대비 2회 ↑, 전월대비 1회 ↑/);
  assert.match(joined, /1팀 2파트 CIP 횟수 4회 전년대비 2회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /1팀 2파트 CIP 시간 4\.5시간 전년대비 2\.5시간 ↑, 전월대비 0\.5시간 ↓/);
  assert.match(joined, /2팀 CIP 횟수 4회 전년대비 1회 ↑, 전월대비 1회 ↑/);
  assert.match(joined, /3팀 CIP 횟수 5회 전년대비 1회 ↑, 전월대비 1회 ↓/);
  assert.match(joined, /기타 월간 평균온도 23\.4℃ 전년대비 2\.2℃ ↑, 전월대비 0\.7℃ ↓/);
});

test('util runtime browser adapter sums normal and rework detail rows for report production stats', async () => {
  const { context } = createContext();
  const makeEntry = (dateLabel, productionKind = 'normal') => ({
    dateLabel,
    lineName: 'ICA',
    productCode: 'P-1',
    productName: 'Product A',
    amount: 100,
    moistureExcludedYield: 95,
    workTime: 8,
    operationTime: 7,
    equipmentCapa: 120,
    equipmentUtilization: 83.3,
    productionKind,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 2) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 2) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 2) }],
  ]);
  const entriesByMonth = new Map([
    ['2025-04', [makeEntry('2025-04-01')]],
    ['2026-03', [makeEntry('2026-03-01')]],
    ['2026-04', [makeEntry('2026-04-01'), makeEntry('2026-04-01'), makeEntry('2026-04-01', 'rework')]],
  ]);
  context.listUtilDailyEntriesByMetric = (_teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };

  const result = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'work_time',
    skipUtilityReady: true,
  });

  assert.equal(result.ok, true);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].segments[0].reference, 8);
  assert.equal(result.candidates[0].segments[0].current, 16);
  assert.equal(result.candidates[0].segments[1].reference, 8);
  assert.equal(result.candidates[0].segments[1].current, 16);
});

test('util runtime browser adapter builds rework production memo candidates', async () => {
  const { context } = createContext();
  const makeEntry = (dateLabel, amount, productionKind = 'normal') => ({
    dateLabel,
    lineName: 'ICA',
    productCode: productionKind === 'rework' ? 'R-1' : 'P-1',
    productName: productionKind === 'rework' ? 'Rework Product' : 'Product A',
    amount,
    productionKind,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 2) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 2) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 2) }],
  ]);
  const entriesByMonth = new Map([
    ['2025-04', [makeEntry('2025-04-01', 900), makeEntry('2025-04-01', 100, 'rework')]],
    ['2026-03', [makeEntry('2026-03-01', 700), makeEntry('2026-03-01', 100, 'rework')]],
    ['2026-04', [makeEntry('2026-04-01', 800), makeEntry('2026-04-01', 200, 'rework')]],
  ]);
  context.listUtilDailyEntriesByMetric = (_teamName, year, month, metricKey) => {
    assert.equal(metricKey, 'amount');
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    return {
      period: periodByMonth.get(monthKey),
      entries: entriesByMonth.get(monthKey) || [],
    };
  };

  const amountResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'rework_production',
    skipUtilityReady: true,
  });
  assert.equal(amountResult.ok, true);
  assert.ok(amountResult.availableMetricKeys.includes('rework_production'));
  assert.equal(amountResult.candidates.length, 1);
  assert.equal(amountResult.candidates[0].segments[0].reference, 100);
  assert.equal(amountResult.candidates[0].segments[0].current, 200);
  assert.equal(amountResult.candidates[0].segments[0].delta, 100);
  assert.equal(amountResult.candidates[0].segments[1].reference, 100);
  assert.equal(amountResult.candidates[0].segments[1].current, 200);
  assert.equal(amountResult.candidates[0].segments[1].delta, 100);

  const shareResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'rework_production_share',
    skipUtilityReady: true,
  });
  assert.equal(shareResult.ok, true);
  assert.ok(shareResult.availableMetricKeys.includes('rework_production_share'));
  assert.equal(shareResult.candidates.length, 1);
  assert.equal(shareResult.candidates[0].segments[0].reference, 10);
  assert.equal(shareResult.candidates[0].segments[0].current, 20);
  assert.equal(shareResult.candidates[0].segments[0].delta, 10);
  assert.equal(shareResult.candidates[0].segments[1].reference, 12.5);
  assert.equal(shareResult.candidates[0].segments[1].current, 20);
  assert.equal(shareResult.candidates[0].segments[1].delta, 7.5);
});

test('util runtime browser adapter builds report memo candidates for production stats', async () => {
  const { context } = createContext();
  const makeEntry = (
    dateLabel,
    amount,
    productName,
    moistureExcludedYield,
    equipmentCapa,
    workTime = null,
    operationTime = null
  ) => ({
    dateLabel,
    teamName: '1팀 2파트',
    lineName: 'ICA',
    productName,
    amount,
    moistureExcludedYield,
    equipmentCapa,
    workTime,
    operationTime,
  });
  const periodByMonth = new Map([
    ['2025-04', { startDate: new Date(2025, 3, 1), endDate: new Date(2025, 3, 3) }],
    ['2026-03', { startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 3) }],
    ['2026-04', { startDate: new Date(2026, 3, 1), endDate: new Date(2026, 3, 3) }],
  ]);
  const entriesByMonth = new Map([
    [
      '2025-04',
      [makeEntry('2025-04-01', 100, '제품 A', 85, 200, 8, 6), makeEntry('2025-04-02', 100, '제품 B', 85, 200, 10, 8)],
    ],
    ['2026-03', [makeEntry('2026-03-01', 100, '제품 A', 70, 200, 12, 10)]],
    [
      '2026-04',
      [
        makeEntry('2026-04-01', 100, '제품 A', 90, 200, 11.5, 9.5),
        makeEntry('2026-04-03', 200, '제품 B', 80, 300, 8.5, 6.5),
      ],
    ],
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
  assert.match(yieldResult.candidates[0].text, /1팀 2파트 수율 83\.3% 전년대비 1\.7%p ↓, 전월대비 13\.3%p ↑/);

  const utilizationResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'operation_rate',
  });
  assert.match(utilizationResult.candidates[0].text, /1팀 2파트 가동률 60% 전년대비 10%p ↑, 전월대비 10%p ↑/);

  const workTimeResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'work_time',
  });
  assert.match(
    workTimeResult.candidates[0].text,
    /1팀 2파트 조업시간 20\.0시간 전년대비 2\.0시간, 11\.1% ↑, 전월대비 8\.0시간, 66\.7% ↑/
  );

  const operationTimeResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'operation_time',
  });
  assert.match(
    operationTimeResult.candidates[0].text,
    /1팀 2파트 가동시간 16\.0시간 전년대비 2\.0시간, 14\.3% ↑, 전월대비 6\.0시간, 60\.0% ↑/
  );

  const productCountResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'product_count',
  });
  assert.match(
    productCountResult.candidates[0].text,
    /1팀 2파트 고유 품목수 2개 전년대비 동일, 전월대비 1개, 100\.0% ↑/
  );

  const productionDaysResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'production_days',
  });
  assert.equal(productionDaysResult.candidates[0].segments[0].direction, 'flat');
  assert.match(
    productionDaysResult.candidates[0].text,
    /1팀 2파트 생산일수 2일 전년대비 동일, 전월대비 1일, 100\.0% ↑/
  );

  const offDaysResult = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_02',
    metricKey: 'off_days',
  });
  assert.match(offDaysResult.candidates[0].text, /1팀 2파트 휴무일수 1일 전년대비 동일, 전월대비 1일, 50\.0% ↓/);
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
  assert.match(wasteUsage.candidates[0].text, /북정 폐수량 20m³ 전년대비 4m³, 25\.0% ↑, 전월대비 5m³, 33\.3% ↑/);

  const wasteCost = await context.KpiUtilRuntimeBrowserAdapter.buildReportDeckMemoCandidates('2026-04', {
    teamKey: 'team_01_01',
    metricKey: 'waste_cost_total',
    memoKey: 'slide6WasteMemo',
  });
  assert.match(
    wasteCost.candidates[0].text,
    /북정 폐수 비용 총계 1,300원 전년대비 300원, 30\.0% ↑, 전월대비 500원, 62\.5% ↑/
  );
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
  assert.equal(model.rows.unit.reference, 20 / 1);
  assert.equal(model.rows.unit.current, 16 / 0.8);
  assert.equal(model.rows.unit.previous, 15 / 0.76);
  assert.equal(model.rows.unit.monthDelta, 16 / 0.8 - 15 / 0.76);
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
                slide5Title: '1. 유산 (가스 비용) 분석',
                slide6Title: '2. 북정 (폐수 비용) 분석',
                slide7Title: '2. 유산 (폐수 비용) 분석',
                slide8SlotCount: '3',
                slide8Item1Text: 'DB plan text',
                slide8BeforeImage1: isNovember ? '' : 'data:image/png;base64,AAAA',
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
  const slide5TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide5Title');
  const slide6TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide6Title');
  const slide7TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide7Title');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const team1ContentsTitleField = deckDom.fields.find(
    (field) => field.dataset.reportField === 'productionTeam1ContentsTitle'
  );
  const team1ContentsItem1Field = deckDom.fields.find(
    (field) => field.dataset.reportField === 'productionTeam1ContentsItem1'
  );
  const team1ContentsItem1Ref = deckDom.fieldRefs.find(
    (field) => field.dataset.reportFieldRef === 'productionTeam1ContentsItem1'
  );
  const contentsItem4Field = deckDom.fields.find((field) => field.dataset.reportField === 'contentsItem4');
  const latestReportMonth = getLatestReportMonthKey();
  const latestReportRecordUrl = getReportRecordUrl(latestReportMonth);
  const latestReportMonthNumber = getReportMonthNumber(latestReportMonth);
  const nextReportMonthNumber = getReportMonthNumber(latestReportMonth, 1);
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(departmentField.textContent, '생산본부');
  assert.equal(slide5TitleField.textContent, '1. 유 산 (가스 비용) 분석');
  assert.equal(slide6TitleField.textContent, '2. 북 정 (폐수 비용) 분석');
  assert.equal(slide7TitleField.textContent, '2. 유 산 (폐수 비용) 분석');
  assert.equal(slide8TitleField.textContent.startsWith(`3. ${latestReportMonthNumber}`), true);
  assert.equal(slide9TitleField.textContent.startsWith(`4. ${nextReportMonthNumber}`), true);
  assert.equal(dateField.textContent, getReportDateForMonth(latestReportMonth));
  assert.equal(team1ContentsTitleField.textContent, 'Contents');
  assert.equal(team1ContentsItem1Field.textContent, '생산실적(생산량)');
  assert.equal(team1ContentsItem1Ref.textContent, '생산실적(생산량)');
  assert.equal(contentsItem4Field.textContent, '주요계획');
  assert.equal(
    deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text').textContent,
    'DB plan text'
  );
  assert.equal(deckDom.planImages[0].src, 'data:image/png;base64,AAAA');
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'true');
  assert.equal(deckDom.dateInput.value, getReportDateInputForMonth(latestReportMonth));
  assert.equal(deckDom.status.textContent, '');
  assert.equal(deckDom.monthSelect.value, latestReportMonth);
  assert.equal(deckDom.monthSelect.disabled, false);
  assert.equal(deckDom.monthSelect.innerHTML.includes(latestReportMonth), true);
  assert.equal(deckDom.monthSelect.innerHTML.includes(getCurrentCalendarMonthKey()), false);
  assert.equal(fetchCalls[0].url, '/api/shared-store');
  assert.equal(fetchCalls[1].url, latestReportRecordUrl);
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
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[8].dataset.reportPrintLast, 'true');
  deckDom.listeners.click({
    target: deckDom.productionContentsJumpButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'public-works');
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 9');
  assert.equal(deckDom.reportReturnButton.hidden, false);
  assert.equal(deckDom.slides[2].classList.active, true);
  assert.equal(deckDom.slides[2].pageNumber.textContent, '1/9');
  assert.equal(deckDom.slides[9].pageNumber.textContent, '8/9');
  assert.equal(deckDom.slides[10].pageNumber.textContent, '9/9');
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(registered.printCount, 2);
  assert.equal(deckDom.root.dataset.reportPrintMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintView, 'public-works');
  assert.equal(deckDom.slides[0].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[2].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[8].dataset.reportPrintLast, 'true');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[1].disabled, true);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage2.textContent, '');
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
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다']);
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(titleField.contenteditable, 'false');
  assert.equal(dateField.contenteditable, 'false');
  assert.equal(deckDom.dateInput.disabled, true);
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[1].disabled, true);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage2.textContent, '');
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
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.editButton.textContent, '완료');

  titleField.textContent = '수정된 공유 보고서';
  deckDom.listeners.input({
    target: titleField,
  });
  await flushMicrotasks();

  assert.equal(fetchCalls.length, 2);
  assert.equal(titleField.textContent.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(deckDom.status.textContent, '');

  slide8TitleField.textContent = '수정 불가 제목';
  deckDom.listeners.input({
    target: slide8TitleField,
  });
  await flushMicrotasks();
  assert.equal(fetchCalls.length, 2);
  assert.equal(slide8TitleField.textContent.startsWith(`3. ${latestReportMonthNumber}`), true);
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
  assert.equal(dateField.textContent, getReportDateForMonth(latestReportMonth, 16));
  assert.equal(fetchCalls.length, 2);

  const slide8OverviewField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  deckDom.listeners.click({
    target: slide8OverviewField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
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
  const slide8KnownTeamLabel = deckDom.safetyTeamOptionButtons[0].textContent;
  const slide8OtherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  const slide8CustomTeam = '협력공사';
  deckDom.overviewDialogFields.team.value = slide8OtherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = slide8KnownTeamLabel;
  deckDom.overviewDialogFields.amount.value = '5.5';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.customTeam.customValidity, '기존 팀명은 해당 팀을 선택해 주세요.');
  deckDom.overviewDialogFields.customTeam.value = slide8CustomTeam;
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.overviewDialog.hidden, true);
  assert.equal(deckDom.overviewDialogFields.amount.customValidity, '');
  assert.equal(
    slide8OverviewField.textContent,
    `${slide8CustomTeam}\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원`
  );

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
  assert.equal(deckDom.overviewDialogFields.date.type, 'month');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
  deckDom.listeners.click({
    target: deckDom.overviewKindButtons[1],
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialogFields.kind.value, 'purpose');
  assert.equal(deckDom.overviewKindButtons[1].classList.active, true);
  const slide9OtherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  const slide9CustomTeam = '협력계획';
  deckDom.overviewDialogFields.team.value = slide9OtherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = slide9CustomTeam;
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
  assert.equal(fetchCalls[2].url, latestReportRecordUrl);
  assert.equal(fetchCalls[2].options.method, 'PUT');
  const savedReportPayload = JSON.parse(fetchCalls[2].options.body).payload;
  assert.equal(savedReportPayload.title.startsWith(`${latestReportMonthNumber}`), true);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.productionTeam1ContentsItem1, '생산량 실적');
  assert.equal(savedReportPayload.slide8Title.startsWith(`3. ${latestReportMonthNumber}`), true);
  assert.equal(savedReportPayload.slide9Title.startsWith(`4. ${nextReportMonthNumber}`), true);
  assert.equal(savedReportPayload.slide5Title, '1. 유 산 (가스 비용) 분석');
  assert.equal(savedReportPayload.slide6Title, '2. 북 정 (폐수 비용) 분석');
  assert.equal(savedReportPayload.slide7Title, '2. 유 산 (폐수 비용) 분석');
  assert.equal(savedReportPayload.reportDate, getReportDateForMonth(latestReportMonth, 16));
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8SlotCount, '3');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Team, slide8CustomTeam);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Title, '환경 설비 보수');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Effect, '점검 시간 단축');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Date, '2025-12-20');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Amount, '5.5');
  assert.equal(
    JSON.parse(fetchCalls[2].options.body).payload.slide8Item1Text,
    `${slide8CustomTeam}\n환경 설비 보수\n▶ 효과 : 점검 시간 단축\n▶ 완료 날짜 : 12.20 完\n▶ 금액 : 5.5 백만원`
  );
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9SlotCount, '1');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Team, slide9CustomTeam);
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Title, '외포장실 안전장치 설치');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Kind, 'purpose');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Detail, '안전사고 예방');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Date, '2025-12');
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Amount, '6.5');
  assert.equal(
    JSON.parse(fetchCalls[2].options.body).payload.slide9Item1Text,
    `${slide9CustomTeam}\n외포장실 안전장치 설치\n▶ 목적 : 안전사고 예방\n▶ 예상 날짜 : 25.12월 中\n▶ 예상 금액 : 6.5 백만원`
  );
  assert.equal(JSON.parse(fetchCalls[2].options.body).payload.slide8BeforeImage1, '');
  assert.equal(deckDom.status.textContent, '저장되었습니다');
  assert.deepEqual(registered.alertMessages, ['저장되었습니다', '저장되었습니다']);
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
  assert.equal(slide8TitleField.textContent, '3. 11월 공사 및 정비 현황');
  assert.equal(slide9TitleField.textContent, '4. 12월 주요 계획');
  assert.equal(dateField.textContent, '2025.12.15');
  assert.equal(deckDom.root.dataset.reportMonth, '2025-11');
  assert.equal(deckDom.root.dataset.reportRecordKey, 'report_2025_11');

  deckDom.listeners.click({
    target: deckDom.navButtons[3],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '3');
  assert.equal(deckDom.counter.textContent, '4 / 9');
  assert.equal(deckDom.slides[5].classList.active, true);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '4');

  let saveMenuPrevented = false;
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  deckDom.listeners.click({
    target: deckDom.saveMenuToggleButton,
    preventDefault() {
      saveMenuPrevented = true;
    },
  });
  assert.equal(saveMenuPrevented, true);
  assert.equal(deckDom.saveMenuPanel.hidden, false);
  assert.equal(deckDom.saveMenu.dataset.reportSaveMenuOpen, 'true');
  assert.equal(deckDom.saveMenuToggleButton['aria-expanded'], 'true');
  assert.equal(deckDom.saveMenuToggleButton.classList.active, true);
  let saveMenuEscapePrevented = false;
  deckDom.listeners.keydown({
    key: 'Escape',
    target: {
      closest() {
        return null;
      },
    },
    preventDefault() {
      saveMenuEscapePrevented = true;
    },
  });
  assert.equal(saveMenuEscapePrevented, true);
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  assert.equal(deckDom.saveMenu.dataset.reportSaveMenuOpen, undefined);
  assert.equal(deckDom.saveMenuToggleButton['aria-expanded'], 'false');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  team1ContentsItem1Field.textContent = '발표 전 저장';
  deckDom.listeners.input({
    target: team1ContentsItem1Field,
  });
  await flushMicrotasks();
  const presentationSaveIndex = fetchCalls.length;
  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  await flushMicrotasks();
  const presentationSaveCall = fetchCalls
    .slice(presentationSaveIndex)
    .find((call) => call.url === '/api/modules/report_runtime/records/report_2025_11' && call.options?.method === 'PUT');
  assert.ok(presentationSaveCall, 'presentation should save edited report before fullscreen');
  assert.equal(
    JSON.parse(presentationSaveCall.options.body).payload.productionTeam1ContentsItem1,
    '발표 전 저장'
  );
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');
  assert.equal(deckDom.editButton.textContent, '수정');
  assert.equal(deckDom.root.fullscreenRequestCount, 1);
  assert.equal(deckDom.stage.focusCount, 2);
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, 'true');
  assert.equal(deckDom.counter.textContent, '5 / 7');
  assert.equal(deckDom.slides[8].dataset.reportOutputPrepared, 'true');
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.slides[10].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.navButtons[7].hidden, true);

  let fullscreenClickPrevented = false;
  deckDom.listeners.click({
    target: {
      closest() {
        return null;
      },
    },
    preventDefault() {
      fullscreenClickPrevented = true;
    },
  });
  assert.equal(fullscreenClickPrevented, true);
  assert.equal(deckDom.root.dataset.reportActiveSlide, '5');

  deckDom.listeners.click({
    target: deckDom.navButtons[6],
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '6');
  assert.equal(deckDom.root.ownerDocument.fullscreenElement, deckDom.root);

  deckDom.listeners.keydown({
    key: 'ArrowRight',
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveSlide, '0');
  assert.equal(deckDom.counter.textContent, '1 / 9');
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, undefined);
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, undefined);
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

test('report deck overview blank amount renders self handled text', async () => {
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
                reportDate: '2026.05.15',
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

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });

  const slide8OverviewField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Item1Text');
  deckDom.listeners.click({
    target: slide8OverviewField,
    preventDefault() {},
  });
  deckDom.overviewDialogFields.team.value = '공무환경팀';
  deckDom.overviewDialogFields.title.value = '보일러 배관 보수';
  deckDom.overviewDialogFields.effect.value = '누수 예방';
  deckDom.overviewDialogFields.date.value = '2026-05-20';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(
    slide8OverviewField.textContent,
    '공무환경팀\n보일러 배관 보수\n▶ 효과 : 누수 예방\n▶ 완료 날짜 : 05.20 完\n▶ 금액 : 자체 처리'
  );

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
  deckDom.listeners.click({
    target: deckDom.overviewKindButtons[1],
    preventDefault() {},
  });
  deckDom.overviewDialogFields.team.value = '1팀 2파트';
  deckDom.overviewDialogFields.title.value = '압축공기 라인 개선';
  deckDom.overviewDialogFields.detail.value = '작업 안정화';
  deckDom.overviewDialogFields.date.value = '2026-06';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

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

  const savedPayload = JSON.parse(fetchCalls[2].options.body).payload;
  assert.equal(savedPayload.slide8Item1Amount, '');
  assert.equal(
    savedPayload.slide8Item1Text,
    '공무환경팀\n보일러 배관 보수\n▶ 효과 : 누수 예방\n▶ 완료 날짜 : 05.20 完\n▶ 금액 : 자체 처리'
  );
  assert.equal(savedPayload.slide9Item1Amount, '');
  assert.equal(savedPayload.slide9Item1Date, '2026-06');
  assert.equal(
    savedPayload.slide9Item1Text,
    '1팀 2파트\n압축공기 라인 개선\n▶ 목적 : 작업 안정화\n▶ 예상 날짜 : 26.06월 中\n▶ 예상 금액 : 자체 처리'
  );

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
  assert.equal(uploadBody.ownerKey, getReportRecordKey(getLatestReportMonthKey()));
  assert.equal(uploadBody.base64Data, 'QUJD');
  const savedBody = JSON.parse(fetchCalls[saveIndex].options.body);
  assert.equal(savedBody.payload.slide8BeforeImage1, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-inline-image-1/view');
  assert.equal(deckDom.status.textContent, '저장되었습니다');
});

test('report deck editor accepts clipboard image paste into plan image slots', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
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
            document: { id: 'doc-paste-image-1' },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: {
              title: 'Clipboard image report',
              reportDate: '2025.12.15',
            },
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL(file) {
      this.result = `data:${file?.type || 'image/png'};base64,UEFTVEU=`;
      this.onload?.();
    }
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, false);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, false);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, false);
  assert.equal(deckDom.planImagePlaceholders.slide8BeforeImage1.textContent, '이미지 첨부 또는 붙여넣기');

  let clickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImages[0],
    preventDefault() {
      clickPrevented = true;
    },
  });
  assert.equal(clickPrevented, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 1);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.reportPlanPasteTarget, 'true');

  let pasteButtonPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImagePasteButtons[0],
    preventDefault() {
      pasteButtonPrevented = true;
    },
  });
  assert.equal(pasteButtonPrevented, true);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 2);
  assert.equal(deckDom.status.textContent, '붙여넣을 이미지 칸 선택됨');

  let pastePrevented = false;
  deckDom.listeners.paste({
    target: deckDom.planImages[0],
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'clipboard.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {
      pastePrevented = true;
    },
  });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(pastePrevented, true);
  const uploadCall = fetchCalls.find((call) => call.url === '/api/files/base64');
  assert.ok(uploadCall, 'clipboard image upload was not called');
  const uploadBody = JSON.parse(uploadCall.options.body);
  assert.equal(uploadBody.ownerDomain, 'report.runtime');
  assert.equal(uploadBody.ownerKey, getReportRecordKey(getLatestReportMonthKey()));
  assert.equal(uploadBody.originalName, 'clipboard.png');
  assert.equal(uploadBody.mimeType, 'image/png');
  assert.equal(uploadBody.base64Data, 'UEFTVEU=');
  assert.equal(uploadBody.metadata.fieldKey, 'slide8BeforeImage1');
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-paste-image-1/view');
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'true');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);

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
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);

  let disabledPasteButtonPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImagePasteButtons[0],
    preventDefault() {
      disabledPasteButtonPrevented = true;
    },
  });
  assert.equal(disabledPasteButtonPrevented, true);
  assert.equal(deckDom.root.dataset.reportEditMode, 'editing');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 3);

  let uploadClickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImages[0],
    preventDefault() {
      uploadClickPrevented = true;
    },
  });
  assert.equal(uploadClickPrevented, true);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.focusCount, 3);

  let replacePastePrevented = false;
  deckDom.listeners.paste({
    target: deckDom.planImages[0],
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'replacement.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {
      replacePastePrevented = true;
    },
  });
  await flushMicrotasks();
  await flushMicrotasks();
  assert.equal(replacePastePrevented, true);
  assert.equal(fetchCalls.filter((call) => call.url === '/api/files/base64').length, 1);
  assert.equal(deckDom.planImages[0].src, '/api/files/doc-paste-image-1/view');

  let clearPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImageClearButtons[0],
    preventDefault() {
      clearPrevented = true;
    },
  });
  assert.equal(clearPrevented, true);
  assert.equal(deckDom.planImageFrames.slide8BeforeImage1.dataset.hasImage, 'false');
  assert.equal(deckDom.planImageInputs[0].disabled, false);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, false);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, false);
  assert.equal(deckDom.status.textContent, '저장 필요');

  let attachClickPrevented = false;
  deckDom.listeners.click({
    target: deckDom.planImageUploadButtons[0],
    preventDefault() {
      attachClickPrevented = true;
    },
  });
  assert.equal(attachClickPrevented, false);
  assert.equal(deckDom.planImageInputs[0].clickCount, 0);

  deckDom.planImageInputs[0].files = [{ name: 'manual-upload.png', type: 'image/png' }];
  deckDom.listeners.change({
    target: deckDom.planImageInputs[0],
  });
  await flushMicrotasks();
  await flushMicrotasks();

  const uploadCalls = fetchCalls.filter((call) => call.url === '/api/files/base64');
  assert.equal(uploadCalls.length, 2);
  const finalUploadBody = JSON.parse(uploadCalls.at(-1).options.body);
  assert.equal(finalUploadBody.originalName, 'manual-upload.png');
  assert.equal(deckDom.planImageInputs[0].disabled, true);
  assert.equal(deckDom.planImageUploadButtons[0].disabled, true);
  assert.equal(deckDom.planImagePasteButtons[0].disabled, true);
  assert.equal(deckDom.status.textContent, '저장 필요');
});

test('report deck safety image paste stays in the selected slide10 team row slot', async () => {
  const fetchCalls = [];
  const deckDom = createReportDeckContainer();
  const { context, registered } = createContext({
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
            document: { id: 'doc-slide10-paste' },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          record: {
            payload: options?.body
              ? JSON.parse(options.body).payload
              : {
                  title: 'Safety image report',
                  reportDate: '2025.12.15',
                },
            version: 1,
            updated_at: '2026-05-15T00:00:00.000Z',
          },
        }),
      };
    },
  });
  context.FileReader = class {
    readAsDataURL(file) {
      this.result = `data:${file?.type || 'image/png'};base64,U0FGRVRZ=`;
      this.onload?.();
    }
  };

  registered.initializers.get('report')({
    category: { content: '' },
    container: deckDom.container,
  });
  await flushMicrotasks();

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });

  const targetKey = 'slide10BeforeImage13';
  const targetImage = deckDom.planImages.find((image) => image.dataset.reportPlanImage === targetKey);
  const targetPasteButton = deckDom.planImagePasteButtons.find(
    (button) => button.dataset.reportPlanImagePaste === targetKey
  );
  assert.ok(targetImage, 'slide10 3-team image slot is missing from the test DOM');
  assert.ok(targetPasteButton, 'slide10 3-team paste button is missing from the test DOM');
  assert.equal(targetPasteButton.disabled, false);

  deckDom.listeners.click({
    target: targetPasteButton,
    preventDefault() {},
  });
  deckDom.listeners.paste({
    target: targetImage,
    clipboardData: {
      items: [
        {
          type: 'image/png',
          getAsFile() {
            return { name: 'slide10-team3.png', type: 'image/png' };
          },
        },
      ],
      files: [],
    },
    preventDefault() {},
  });
  await flushMicrotasks();
  await flushMicrotasks();

  const uploadCall = fetchCalls.find((call) => call.url === '/api/files/base64');
  assert.ok(uploadCall, 'slide10 clipboard image upload was not called');
  const uploadBody = JSON.parse(uploadCall.options.body);
  assert.equal(uploadBody.metadata.fieldKey, targetKey);
  assert.equal(targetImage.src, '/api/files/doc-slide10-paste/view');

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
  assert.equal(savedPayload.slide10BeforeImage1, '');
  assert.equal(savedPayload.slide10Item1Team, '');
  assert.equal(savedPayload.slide10BeforeImage13, '/api/files/doc-slide10-paste/view');
  assert.equal(savedPayload.slide10Item13Team, '3팀');
  assert.equal(savedPayload.slide10SlotCount, '13');
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

test('report deck plan overviews sort by team date and amount', async () => {
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
                slide8SlotCount: '7',
                slide8Item1Team: '1팀 1파트',
                slide8Item1Title: '늦은 정비',
                slide8Item1Date: '2025-12-20',
                slide8Item1Amount: '5',
                slide8Item2Team: '1팀 1파트',
                slide8Item2Title: '같은 날짜 고액 정비',
                slide8Item2Date: '2025-12-10',
                slide8Item2Amount: '7',
                slide8Item3Team: '1팀 1파트',
                slide8Item3Title: '같은 날짜 저액 정비',
                slide8Item3Date: '2025-12-10',
                slide8Item3Amount: '2',
                slide8Item4Team: '2팀',
                slide8Item4Title: '다른 팀 빠른 정비',
                slide8Item4Date: '2025-12-01',
                slide8Item4Amount: '1',
                slide8Item5Team: '기타',
                slide8Item5Title: '기타 정비',
                slide8Item5Date: '2025-11-01',
                slide8Item5Amount: '0',
                slide8Item6Team: '공무환경팀',
                slide8Item6Title: '공무 정비',
                slide8Item6Date: '2025-12-31',
                slide8Item6Amount: '9',
                slide8Item7Team: '물류센터',
                slide8Item7Title: '물류 정비',
                slide8Item7Date: '2025-10-01',
                slide8Item7Amount: '0',
                slide9SlotCount: '7',
                slide9Item1Team: '1팀 1파트',
                slide9Item1Title: '늦은 계획',
                slide9Item1Date: '2026-02',
                slide9Item1Amount: '5',
                slide9Item2Team: '1팀 1파트',
                slide9Item2Title: '같은 월 고액 계획',
                slide9Item2Date: '2026-01',
                slide9Item2Amount: '7',
                slide9Item3Team: '1팀 1파트',
                slide9Item3Title: '같은 월 저액 계획',
                slide9Item3Date: '2026-01',
                slide9Item3Amount: '2',
                slide9Item4Team: '2팀',
                slide9Item4Title: '다른 팀 빠른 계획',
                slide9Item4Date: '2025-12',
                slide9Item4Amount: '1',
                slide9Item5Team: '기타',
                slide9Item5Title: '기타 계획',
                slide9Item5Date: '2025-11',
                slide9Item5Amount: '0',
                slide9Item6Team: '공무환경팀',
                slide9Item6Title: '공무 계획',
                slide9Item6Date: '2026-03',
                slide9Item6Amount: '9',
                slide9Item7Team: '물류센터',
                slide9Item7Title: '물류 계획',
                slide9Item7Date: '2025-10',
                slide9Item7Amount: '0',
                slide10Enabled: 'true',
                slide10SlotCount: '4',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-20',
                slide10Item1Amount: '5',
                slide10Item2Team: '1팀 1파트',
                slide10Item2Effect: '넘어짐',
                slide10Item2Date: '2025-12-10',
                slide10Item2Amount: '7',
                slide10Item3Team: '1팀 1파트',
                slide10Item3Effect: '끼임',
                slide10Item3Date: '2025-12-10',
                slide10Item3Amount: '2',
                slide10Item4Team: '2팀',
                slide10Item4Effect: '충돌',
                slide10Item4Date: '2025-12-01',
                slide10Item4Amount: '1',
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

  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '3'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.3')?.dataset.reportPlanSourceSlot,
    '1'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '4'
  );

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  const preparedByField = deckDom.fields.find((field) => field.dataset.reportField === 'preparedBy');
  preparedByField.textContent = 'sort check';
  deckDom.listeners.input({ target: preparedByField });
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

  const saveCall = fetchCalls.filter((call) => call.options?.method === 'PUT').at(-1);
  assert.ok(saveCall, 'sorted report payload was not saved');
  const savedPayload = JSON.parse(saveCall.options.body).payload;
  assert.equal(savedPayload.slide8Item1Title, '같은 날짜 저액 정비');
  assert.equal(savedPayload.slide8Item2Title, '같은 날짜 고액 정비');
  assert.equal(savedPayload.slide8Item3Title, '늦은 정비');
  assert.equal(savedPayload.slide8Item4Title, '다른 팀 빠른 정비');
  assert.equal(savedPayload.slide8Item5Title, '공무 정비');
  assert.equal(savedPayload.slide8Item6Title, '물류 정비');
  assert.equal(savedPayload.slide8Item7Title, '기타 정비');
  assert.equal(savedPayload.slide9Item1Title, '같은 월 저액 계획');
  assert.equal(savedPayload.slide9Item2Title, '같은 월 고액 계획');
  assert.equal(savedPayload.slide9Item3Title, '늦은 계획');
  assert.equal(savedPayload.slide9Item4Title, '다른 팀 빠른 계획');
  assert.equal(savedPayload.slide9Item5Title, '공무 계획');
  assert.equal(savedPayload.slide9Item6Title, '물류 계획');
  assert.equal(savedPayload.slide9Item7Title, '기타 계획');
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
  assert.equal(deckDom.status.textContent, '저장되었습니다');

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

test('report deck safety starts as a team list and adds slots per selected team row', async () => {
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
              payload: { reportDate: '2025.12.15' },
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

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowLabels[1].textContent, '1팀 2파트');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(deckDom.safetyTeamSelect.disabled, true);
  assert.equal(deckDom.safetyAddButton.disabled, true);
  assert.equal(deckDom.safetyTeamMenu.hidden, true);

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamSelect.disabled, false);
  assert.equal(deckDom.safetyAddButton.disabled, false);
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  assert.equal(deckDom.safetyTeamOptionButtons.length, 7);
  assert.equal(deckDom.safetyTeamOptionButtons[4].textContent, '공무환경팀');
  assert.equal(deckDom.safetyTeamOptionButtons[5].textContent, '물류센터');
  assert.equal(deckDom.safetyTeamOptionButtons[6].textContent, '기타');
  assert.equal(deckDom.safetyTeamOptionButtons[1].disabled, false);
  assert.equal(deckDom.safetyTeamOptionButtons[0].focusCount, 1);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[1],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '1');
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewDialogFields.team.value, '1팀 2파트');

  deckDom.overviewDialogFields.hazard.value = '넘어짐';
  deckDom.overviewDialogFields.date.value = '2025-12-28';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 2파트');
  assert.equal(deckDom.planRowLabels[1].textContent, deckDom.safetyTeamOptionButtons[0].textContent);
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '1');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '0');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanActive,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanActive,
    'false'
  );

  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[3],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '3');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
  assert.equal(deckDom.overviewDialogFields.team.value, '3팀');

  deckDom.listeners.click({
    target: deckDom.overviewCancelButton,
    preventDefault() {},
  });
  deckDom.listeners.click({
    target: deckDom.safetyAddButton,
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, false);
  deckDom.listeners.click({
    target: deckDom.safetyTeamOptionButtons[4],
    preventDefault() {},
  });
  assert.equal(deckDom.safetyTeamMenu.hidden, true);
  assert.equal(deckDom.safetyTeamSelect.value, '4');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '2');
  assert.equal(deckDom.overviewDialogFields.team.value, '공무환경팀');
});

test('report deck safety groups each team and balances rows after four items', async () => {
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
                slide10SlotCount: '5',
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [`slide10Item${index + 1}Team`, '1팀 1파트'])
                ),
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [`slide10Item${index + 1}Effect`, '미끄럼'])
                ),
                ...Object.fromEntries(
                  Array.from({ length: 5 }, (_, index) => [
                    `slide10Item${index + 1}Date`,
                    `2025-12-${String(index + 1).padStart(2, '0')}`,
                  ])
                ),
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

  assert.equal(deckDom.planRowLabels[0].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowLabels[1].textContent, '1팀 1파트');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowActiveSlotCount, '3');
  assert.equal(deckDom.planRowTables[1].dataset.reportPlanRowActiveSlotCount, '2');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '1'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.3')?.dataset.reportPlanSourceSlot,
    '3'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.4')?.dataset.reportPlanActive,
    'false'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '4'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.6')?.dataset.reportPlanSourceSlot,
    '5'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.7')?.dataset.reportPlanActive,
    'false'
  );
});

test('report deck safety table arrows reorder within a row and move to the next row', async () => {
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
                slide10SlotCount: '2',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-01',
                slide10Item2Team: '1팀 1파트',
                slide10Item2Effect: '충돌',
                slide10Item2Date: '2025-12-02',
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

  const firstRightButton = deckDom.safetyTableMoveButtons.find(
    (button) => button.slotIndex === 1 && button.direction === 'right'
  );
  assert.equal(firstRightButton.disabled, false);
  deckDom.listeners.click({
    target: firstRightButton,
    preventDefault() {},
  });
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanSourceSlot,
    '1'
  );

  const secondDownButton = deckDom.safetyTableMoveButtons.find(
    (button) => button.slotIndex === 2 && button.direction === 'down'
  );
  assert.equal(secondDownButton.disabled, false);
  deckDom.listeners.click({
    target: secondDownButton,
    preventDefault() {},
  });
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanSourceSlot,
    '2'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.5')?.dataset.reportPlanSourceSlot,
    '1'
  );

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
  assert.equal(savedPayload.slide10TableOrder, '[[2],[1]]');
});

test('report deck safety page stays visible but blank output omits it and saves slide10 data', async () => {
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
              payload: { reportDate: '2025.12.15' },
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

  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', true);
  assertOptionalContentHidden(deckDom, 'slide10', true);
  assert.equal(deckDom.slides[10].hidden, false);
  assert.equal(deckDom.root.dataset.reportSlide10Enabled, 'true');
  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.addPageButton.disabled, true);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(deckDom.slides[8].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[9].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].hidden, false);
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'false');
  assert.equal(deckDom.slides[10].dataset.reportPrintPageText, undefined);
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'false');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', true);
  assertOptionalContentHidden(deckDom, 'slide10', true);
  assert.equal(deckDom.slides[7].dataset.reportPrintLast, 'true');
  deckDom.listeners.click({
    target: deckDom.productionContentsJumpButton,
    preventDefault() {},
  });
  const slide10SafetySummaryCell = {
    dataset: { reportPlanSourceSlot: '5', reportPlanLocalSlot: '5' },
    closest(selector) {
      return selector === '.report-safety-summary-cell' ? this : null;
    },
  };
  deckDom.listeners.click({
    target: slide10SafetySummaryCell,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '5');
  assert.equal(deckDom.overviewDialogFields.team.value, '1팀 2파트');
  assert.equal(deckDom.overviewTeamRow.hidden, false);
  assert.equal(deckDom.overviewDialogFields.title.focusCount, 1);
  assert.equal(deckDom.overviewDialogFields.date.focusCount, 0);
  deckDom.listeners.click({
    target: deckDom.overviewCancelButton,
    preventDefault() {},
  });
  const slide10SummaryField = {
    dataset: { reportPlanSummary: 'slide10', reportPlanSourceSlot: '1' },
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
    target: slide10SummaryField,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportActiveView, 'public-works');
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlot, '1');
  assert.equal(deckDom.overviewTeamRow.hidden, false);
  assert.equal(deckDom.overviewDialogFields.title.focusCount, 2);

  const firstTeamLabel = deckDom.safetyTeamOptionButtons[0].textContent;
  const regularTeamLabel = deckDom.safetyTeamOptionButtons[1].textContent;
  const otherTeamLabel = deckDom.safetyTeamOptionButtons.at(-1).textContent;
  deckDom.overviewDialogFields.team.value = otherTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.customTeam.value = firstTeamLabel;
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialog.hidden, false);
  assert.equal(deckDom.overviewDialogFields.customTeam.customValidity, '기존 팀명은 해당 팀을 선택해 주세요.');
  assert.equal(deckDom.overviewDialogFields.customTeam.reportValidityCount, 1);
  assert.equal(deckDom.overviewDialogFields.customTeam.focusCount, 1);

  deckDom.overviewDialogFields.customTeam.value = '협력업체';
  deckDom.overviewDialogFields.title.value = '배관 주변 정리';
  deckDom.overviewDialogFields.effect.value = '통행 위험 제거';
  deckDom.overviewDialogFields.hazard.value = '온습도 조절 불량';
  deckDom.overviewDialogFields.date.value = '2025-12-27';
  deckDom.overviewDialogFields.amount.value = '';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planRowLabels[0].textContent, '협력업체');
  assert.equal(deckDom.planRowLabels[0].dataset.reportPlanRowFilled, 'true');
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowFilled, 'true');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanFilled,
    'false'
  );
  deckDom.listeners.click({
    target: slide10SummaryField,
    preventDefault() {},
  });
  assert.equal(deckDom.overviewDialogFields.team.value, otherTeamLabel);
  assert.equal(deckDom.overviewDialogFields.customTeam.value, '협력업체');
  assert.equal(deckDom.overviewCustomTeamRow.hidden, false);
  deckDom.overviewDialogFields.team.value = regularTeamLabel;
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.team });
  assert.equal(deckDom.overviewCustomTeamRow.hidden, true);
  assert.equal(deckDom.overviewDialogFields.customTeam.value, '');
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.planRowLabels[0].textContent, regularTeamLabel);
  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });
  assert.equal(deckDom.slides[10].dataset.reportPrintVisible, 'true');
  assert.equal(deckDom.slides[10].dataset.reportPrintPageText, '7/7');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide10', false);

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
  assert.equal(savedPayload.slide10Enabled, 'true');
  assert.equal(savedPayload.slide10SlotCount, '1');
  assert.equal(savedPayload.slide10Item1Team, regularTeamLabel);
  assert.equal(savedPayload.slide10Item1Title, '배관 주변 정리');
  assert.equal(savedPayload.slide10Item1Effect, '온습도 조절 불량');
  assert.equal(savedPayload.slide10Item1Date, '2025-12-27');
  assert.equal(savedPayload.slide10Item1AmountText, '');
  assert.equal(savedPayload.slide10Item1Text, '배관 주변 정리\n12.27 完, 온습도 조절 불량 예방');
  assert.equal(savedPayload.slide10BeforeImage16, '');
  assert.equal(savedPayload.slide10AfterImage16, '');
});

test('report deck safety custom cost text follows amount when both are entered', async () => {
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
                reportDate: '2026.05.15',
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

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });

  const slide10SummaryField = {
    dataset: { reportPlanSummary: 'slide10', reportPlanSourceSlot: '1' },
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
    target: slide10SummaryField,
    preventDefault() {},
  });

  assert.equal(deckDom.overviewDialog.dataset.reportOverviewSlideKey, 'slide10');
  assert.equal(deckDom.overviewDialogFields.amountText.disabled, false);
  deckDom.overviewDialogFields.amount.value = '2';
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.amount });
  assert.equal(deckDom.overviewDialogFields.amountText.disabled, false);
  deckDom.overviewDialogFields.amountText.value = '자체 처리';
  deckDom.listeners.input({ target: deckDom.overviewDialogFields.amountText });
  assert.equal(deckDom.overviewDialogFields.amount.disabled, false);
  assert.equal(deckDom.overviewDialogFields.amount.value, '2');

  deckDom.overviewDialogFields.title.value = '배관 주변 정리';
  deckDom.overviewDialogFields.hazard.value = '넘어짐';
  deckDom.overviewDialogFields.date.value = '2025-12-28';
  deckDom.listeners.click({
    target: deckDom.overviewSaveButton,
    preventDefault() {},
  });
  await flushMicrotasks();

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
  assert.equal(savedPayload.slide10Item1Amount, '2');
  assert.equal(savedPayload.slide10Item1AmountText, '자체 처리');
  assert.equal(savedPayload.slide10Item1Text, '배관 주변 정리\n12.28 完, 2 백만원 소요, 자체 처리, 넘어짐 예방');
});

test('report deck safety deleted slot can be restored from the report payload', async () => {
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
                slide10Enabled: 'true',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
                slide10BeforeImage1: '/files/before.png',
                slide10AfterImage1: '/files/after.png',
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
  const slide10DeleteButton = deckDom.planDeleteButtons.find(
    (button) => button.dataset.reportPlanDeleteSlot === 'slide10' && button.dataset.reportPlanLocalSlot === '1'
  );
  assert.equal(slide10DeleteButton?.dataset.reportPlanSourceSlot, '1');

  deckDom.listeners.click({
    target: slide10DeleteButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, false);
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'false'
  );

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

  const deletedPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  const deletedBackups = JSON.parse(deletedPayload.slide10DeletedSlotBackups);
  assert.equal(deletedPayload.slide10SlotCount, '0');
  assert.equal(deletedPayload.slide10Item1Team, '');
  assert.equal(deletedBackups.length, 1);
  assert.equal(deletedBackups[0].slotIndex, 1);
  assert.equal(deletedBackups[0].entry.team, '1팀 1파트');
  assert.equal(deletedBackups[0].entry.effect, '미끄럼');
  assert.equal(deckDom.root.dataset.reportEditMode, 'view');

  deckDom.listeners.click({
    target: deckDom.editButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, false);

  deckDom.listeners.click({
    target: deckDom.undoDeleteButton,
    preventDefault() {},
  });
  assert.equal(deckDom.undoDeleteButton.disabled, true);
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );

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

  const restoredPayload = JSON.parse(fetchCalls.at(-1).options.body).payload;
  assert.equal(restoredPayload.slide10SlotCount, '1');
  assert.equal(restoredPayload.slide10DeletedSlotBackups, '');
  assert.equal(restoredPayload.slide10Item1Team, '1팀 1파트');
  assert.equal(restoredPayload.slide10Item1Effect, '미끄럼');
  assert.equal(restoredPayload.slide10Item1Date, '2025-12-27');
  assert.equal(restoredPayload.slide10BeforeImage1, '/files/before.png');
  assert.equal(restoredPayload.slide10AfterImage1, '/files/after.png');
});

test('report deck output derives optional order and prints only filled plan cells', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide9SlotCount: '4',
                slide9Item4Team: '2팀',
                slide9Item4Title: '포장 라인 개선',
                slide9Item4Kind: 'purpose',
                slide9Item4Detail: '작업 안정화',
                slide9Item4Date: '2025-12-25',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
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

  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  assert.equal(
    slide9TitleField.textContent.startsWith(`3. ${getReportMonthNumber(getLatestReportMonthKey(), 1)}`),
    true
  );
  assert.equal(slide10TitleField.textContent, '4. 자율 안전 신고제');
  assert.equal(slide9SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.equal(slide10SectionField.textContent, 'Ⅳ. 공무환경팀');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);
  assert.equal(deckDom.planSlides[1].dataset.reportPlanFilledSlotCount, '1');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide9.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide9.2')?.dataset.reportPlanFilled,
    'false'
  );
  assert.equal(deckDom.planRowTables[0].dataset.reportPlanRowFilledSlotCount, '1');
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.1')?.dataset.reportPlanFilled,
    'true'
  );
  assert.equal(
    deckDom.planSlotCells.find((cell) => cell.dataset.reportPlanSlot === 'slide10.2')?.dataset.reportPlanFilled,
    'false'
  );

  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assert.equal(deckDom.slides[8].dataset.reportOutputPrepared, undefined);
  assert.equal(deckDom.slides[9].dataset.reportOutputPrepared, 'true');
  assert.equal(deckDom.slides[10].dataset.reportOutputPrepared, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.fullscreenButton,
    preventDefault() {},
  });
  assert.equal(deckDom.root.dataset.reportFullscreenOutputMode, undefined);
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.saveMenuToggleButton,
    preventDefault() {},
  });
  assert.equal(deckDom.saveMenuPanel.hidden, false);

  deckDom.listeners.click({
    target: deckDom.exportButton,
    preventDefault() {},
  });
  await flushMicrotasks();
  assert.equal(deckDom.saveMenuPanel.hidden, true);
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);

  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });

  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'false');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
  assertOptionalContentHidden(deckDom, 'slide8', true);
  assertOptionalContentHidden(deckDom, 'slide9', false);
  assertOptionalContentHidden(deckDom, 'slide10', false);
});

test('report deck output titles and roman headers are corrected from printed optional pages', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide8Section: 'Ⅲ. 공무환경팀',
                slide8Title: '3. 잘못 저장된 정비 제목',
                slide8SlotCount: '1',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '보일러 배관 보수',
                slide8Item1Effect: '누수 예방',
                slide8Item1Date: '2025-12-20',
                slide9Section: 'Ⅳ. 공무환경팀',
                slide9Title: '4. 잘못 저장된 계획 제목',
                slide9SlotCount: '1',
                slide9Item1Team: '2팀',
                slide9Item1Title: '포장 라인 개선',
                slide9Item1Kind: 'purpose',
                slide9Item1Detail: '작업 안정화',
                slide9Item1Date: '2025-12',
                slide10Section: 'Ⅲ. 공무환경팀',
                slide10Title: '3. 자율 안전 신고제',
                slide10SlotCount: '1',
                slide10Item1Team: '1팀 1파트',
                slide10Item1Effect: '미끄럼',
                slide10Item1Date: '2025-12-27',
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

  const slide8SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Section');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');

  slide8SectionField.textContent = 'Ⅲ. 공무환경팀';
  slide8TitleField.textContent = '3. 잘못 남은 공사 및 정비 현황';
  slide9SectionField.textContent = 'Ⅳ. 공무환경팀';
  slide9TitleField.textContent = '4. 잘못 남은 주요 계획';

  deckDom.listeners.click({
    target: deckDom.printButton,
    preventDefault() {},
  });

  assert.equal(slide8TitleField.textContent.startsWith(`3. ${getReportMonthNumber(getLatestReportMonthKey())}`), true);
  assert.equal(
    slide9TitleField.textContent.startsWith(`4. ${getReportMonthNumber(getLatestReportMonthKey(), 1)}`),
    true
  );
  assert.equal(slide10TitleField.textContent, '5. 자율 안전 신고제');
  assert.equal(slide8SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.equal(slide9SectionField.textContent, 'Ⅳ. 공무환경팀');
  assert.equal(slide10SectionField.textContent, 'Ⅴ. 공무환경팀');
  assert.equal(deckDom.root.dataset.reportPrintSlide8Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide9Visible, 'true');
  assert.equal(deckDom.root.dataset.reportPrintSlide10Visible, 'true');
});

test('report deck optional header roman numerals follow the extracted section order', async () => {
  const deckDom = createReportDeckContainer();
  deckDom.slides[8].dataset.reportOptionalPage = 'slide8';
  deckDom.slides[8].dataset.reportDynamicPage = '0';
  deckDom.slides[9].dataset.reportOptionalPage = 'slide9';
  deckDom.slides[9].dataset.reportDynamicPage = '0';
  deckDom.slides[10].dataset.reportOptionalPage = 'slide10';
  deckDom.slides[10].dataset.reportDynamicPage = '0';

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
                slide8Section: 'Ⅴ. 공무환경팀',
                slide8Title: '5. 잘못 저장된 정비 제목',
                slide8SlotCount: '1',
                slide8Item1Team: '공무환경팀',
                slide8Item1Title: '보일러 배관 보수',
                slide8Item1Effect: '누수 예방',
                slide8Item1Date: '2025-12-20',
                slide9Section: 'Ⅴ. 공무환경팀',
                slide9Title: '5. 잘못 저장된 계획 제목',
                slide9SlotCount: '1',
                slide9Item1Team: '2팀',
                slide9Item1Title: '포장 라인 개선',
                slide9Item1Kind: 'purpose',
                slide9Item1Detail: '작업 안정화',
                slide9Item1Date: '2025-12-25',
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

  const slide8SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Section');
  const slide8TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide8Title');
  const slide9SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Section');
  const slide9TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide9Title');
  const slide10SectionField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Section');
  const slide10TitleField = deckDom.fields.find((field) => field.dataset.reportField === 'slide10Title');

  assert.equal(slide8SectionField.textContent, 'Ⅲ. 공무환경팀');
  assert.match(slide8TitleField.textContent, /^3\. /);
  assert.equal(slide9SectionField.textContent, 'Ⅳ. 공무환경팀');
  assert.match(slide9TitleField.textContent, /^4\. /);
  assert.equal(slide10SectionField.textContent, 'Ⅴ. 공무환경팀');
  assert.match(slide10TitleField.textContent, /^5\. /);
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
