import fs from 'node:fs/promises';
import vm from 'node:vm';


const REPORT_ROOT = '../../../../../utility/runtime/util/report';

const adapterSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.runtime-adapter.js', import.meta.url),
  'utf8'
);
const reportSheetConfigSource = await fs.readFile(
  new URL(REPORT_ROOT + '/sheet/config.js', import.meta.url),
  'utf8'
);
export const reportSheetModalShellPartPaths = [
  'core.js',
  'extract-core.js',
  'analysis-runtime-foundation.js',
  'analysis-runtime-charts.js',
  'analysis-runtime-tables.js',
  'analysis-runtime-interactions.js',
  'monthly-state.js',
  'print-assets.js',
  'document-builders.js',
  'monthly-runner.js',
  'modal-dom.js',
];
const reportSheetModalShellAssetPaths = [
  ...reportSheetModalShellPartPaths.map((file) => REPORT_ROOT + '/sheet/modal/shell/' + file),
  REPORT_ROOT + '/sheet/modal/shell.js',
];
export const reportSheetModalShellSources = await Promise.all(
  reportSheetModalShellAssetPaths.map((relativePath) => fs.readFile(
    new URL(relativePath, import.meta.url),
    'utf8'
  ))
);
export const reportSheetModalShellSource = reportSheetModalShellSources.join('\n');
export const reportSheetModalShellFacadeSource = reportSheetModalShellSources.at(-1);
export const kpiUtilReportSheetSource = await fs.readFile(
  new URL(REPORT_ROOT + '/KPI.util.report.sheet.js', import.meta.url),
  'utf8'
);
export const kpiHtml = await fs.readFile(
  new URL('../../../../../KPI.html', import.meta.url),
  'utf8'
);
export const meteringCssSource = (await Promise.all(['01-metering-core.css', '02-report-builder.css'].map(file => fs.readFile(new URL(`../../../../app/styles/metering/metering/${file}`, import.meta.url), 'utf8')))).join('');

function createDocumentHarness() {
  const harness = {
    appendedNode: null,
    appendedDownloads: [],
    alertMessages: [],
    blobOptions: null,
    blobParts: [],
    blobHistory: [],
    clickedDownloads: [],
    focusedPopupCount: 0,
    openedHtml: '',
    openWindowCalls: [],
    popupCloseCount: 0,
    popupOpenCount: 0,
    popupPrintCount: 0,
    timeoutCalls: [],
  };

  const document = {
    head: {
      querySelectorAll(selector) {
        if (selector === 'link[rel="stylesheet"]') {
          return [
            {
              getAttribute(name) {
                return name === 'href'
                  ? 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
                  : '';
              },
              outerHTML: '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
            },
            {
              getAttribute(name) {
                return name === 'href' ? 'app/styles/metering/metering.css?v=1' : '';
              },
              outerHTML: '<link rel="stylesheet" href="app/styles/metering/metering.css?v=1">',
            },
          ];
        }
        if (selector === 'style') {
          return [{ outerHTML: '<style>.extract-test-style{display:block}</style>' }];
        }
        return [];
      },
    },
    body: {
      appendChild(node) {
        if (node?.id === 'util-sheet-report-modal') {
          harness.appendedNode = node;
        } else {
          harness.appendedDownloads.push(node);
        }
        return node;
      },
    },
    getElementById(id) {
      return id === 'util-sheet-report-modal' ? harness.appendedNode : null;
    },
    createElement(tagName = '') {
      if (String(tagName).toLowerCase() === 'a') {
        return {
          download: '',
          href: '',
          style: {},
          click() {
            harness.clickedDownloads.push({ href: this.href, download: this.download });
          },
          remove() {
            harness.removedDownloadCount = (harness.removedDownloadCount || 0) + 1;
          },
        };
      }
      const listeners = {};
      const classes = new Set();

      return {
        dataset: {},
        style: {},
        innerHTML: '',
        className: '',
        id: '',
        tabIndex: 0,
        listeners,
        classList: {
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
        },
        addEventListener(type, handler) {
          listeners[type] = handler;
        },
      };
    },
  };

  return { document, harness };
}

export function createTarget(selectorMap = {}, dataset = {}, value = '') {
  return {
    dataset,
    value,
    checked: false,
    closest(selector) {
      return selectorMap[selector] ? this : null;
    },
  };
}

export function createModalShellContext() {
  const { document, harness } = createDocumentHarness();
  const context = {
    console,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    document,
    Blob: class TestBlob {
      constructor(parts, options) {
        harness.blobParts = parts;
        harness.blobOptions = options;
        harness.blobHistory.push({ parts, options });
      }
    },
    URL: {
      createObjectURL(blob) {
        harness.createdBlob = blob;
        return 'blob:meter-report';
      },
      revokeObjectURL(url) {
        harness.revokedUrls = [...(harness.revokedUrls || []), url];
      },
    },
    alert(message) {
      harness.alertMessages.push(message);
    },
    open(url, target, features) {
      harness.openWindowCalls.push({ url, target, features });
      return {
        document: {
          open() {
            harness.popupOpenCount += 1;
          },
          write(html) {
            harness.openedHtml = String(html || '');
          },
          close() {
            harness.popupCloseCount += 1;
          },
        },
        focus() {
          harness.focusedPopupCount += 1;
        },
        print() {
          harness.popupPrintCount += 1;
        },
      };
    },
    print() {},
    setTimeout(callback, delay) {
      harness.timeoutCalls.push(delay);
      callback();
      return 1;
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
  reportSheetModalShellSources.forEach((source, index) => {
    vm.runInContext(source, context, {
      filename: reportSheetModalShellAssetPaths[index],
    });
  });
  return { context, harness };
}
