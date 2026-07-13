import fs from 'node:fs/promises';
import vm from 'node:vm';

const REPORT_ROOT = '../../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetConfigSource = await fs.readFile(new URL(REPORT_ROOT + '/sheet/config.js', import.meta.url), 'utf8');
const reportSheetModalRenderSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/modal/render.js', import.meta.url),
  'utf8'
);
const reportSheetGasRuntimeSyncSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/gas/runtime-sync.js', import.meta.url),
  'utf8'
);
const kpiHtml = await fs.readFile(new URL('../../../../../KPI.html', import.meta.url), 'utf8');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
    toggle: (name, force) => {
      if (force === true) {
        classes.add(name);
        return true;
      }
      if (force === false) {
        classes.delete(name);
        return false;
      }
      if (classes.has(name)) {
        classes.delete(name);
        return false;
      }
      classes.add(name);
      return true;
    },
  };
}

function createModalHarness() {
  const kicker = { textContent: '' };
  const title = { textContent: '' };
  const sub = { textContent: '' };
  const body = { innerHTML: '' };
  const monthSelect = {
    innerHTML: '',
    value: '',
    disabled: false,
  };
  const createMonthStepButton = (direction) => ({
    attrs: {},
    classList: createClassList(),
    dataset: { direction },
    disabled: false,
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  });
  const monthPrevButton = createMonthStepButton('prev');
  const monthNextButton = createMonthStepButton('next');
  const gasViewToggle = {
    attrs: {},
    classList: createClassList(),
    dataset: {},
    hidden: true,
    innerHTML: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const gasViewToggleSecondary = {
    attrs: {},
    classList: createClassList(),
    dataset: {},
    hidden: true,
    innerHTML: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
    toggleAttribute(name, force) {
      if (name === 'hidden') this.hidden = force === true;
    },
  };
  const extractButton = {
    attrs: {},
    disabled: false,
    hidden: false,
    textContent: '',
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };

  const modal = {
    dataset: {
      sheetType: 'meter',
      datasetKey: 'gas',
      compareKey: 'month',
      monthKey: '2026-03',
      gasMeterProductionKey: 'combined',
      gasAnalysisCategoryKey: 'yusan',
      electricMeterTeamKey: 'combined',
      electricAnalysisTeamKey: 'combined',
      electricMeterViewKey: 'meter',
      analysisFullscreen: 'false',
      analysisFullscreenChartKey: '',
      analysisFullscreenAutoExpanded: 'false',
      analysisInlineRatioTableKey: '',
    },
    classList: createClassList(['is-open']),
    querySelector(selector) {
      switch (selector) {
        case '[data-role="util-sheet-report-kicker"]':
          return kicker;
        case '[data-role="util-sheet-report-title"]':
          return title;
        case '[data-role="util-sheet-report-sub"]':
          return sub;
        case '[data-role="util-sheet-report-body"]':
          return body;
        case '[data-role="util-sheet-modal-month"]':
          return monthSelect;
        case '[data-util-sheet-gas-view-toggle]':
          return gasViewToggle;
        case '[data-util-sheet-gas-view-toggle-secondary]':
          return gasViewToggleSecondary;
        case '[data-role="util-sheet-report-print"]':
          return extractButton;
        default:
          return null;
      }
    },
    querySelectorAll(selector) {
      if (selector === '[data-role="util-sheet-modal-month-step"]') {
        return [monthPrevButton, monthNextButton];
      }
      return [];
    },
  };

  return {
    modal,
    kicker,
    title,
    sub,
    body,
    monthSelect,
    monthPrevButton,
    monthNextButton,
    gasViewToggle,
    gasViewToggleSecondary,
    extractButton,
  };
}

function createModalRenderContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    document: {
      getElementById() {
        return null;
      },
    },
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  vm.runInContext(reportSheetModalRenderSource, context, {
    filename: 'KPI.util.report.sheet.modal-render.js',
  });
  return context;
}

function createGasRuntimeSyncContext() {
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
  };

  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.util.report.runtime-adapter.js',
  });
  vm.runInContext(reportSheetConfigSource, context, {
    filename: 'KPI.util.report.sheet.config.js',
  });
  vm.runInContext(reportSheetGasRuntimeSyncSource, context, {
    filename: 'KPI.util.report.sheet.gas.runtime-sync.js',
  });
  return context;
}

export {
  kpiHtml,
  reportSheetModalRenderSource,
  createClassList,
  createModalHarness,
  createModalRenderContext,
  createGasRuntimeSyncContext,
};
