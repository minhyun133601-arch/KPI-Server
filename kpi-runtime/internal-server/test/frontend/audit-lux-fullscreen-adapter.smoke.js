import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const manifestSource = await fs.readFile(
  path.join(repoRoot, 'kpi-runtime/app/boot/KPI.boot.manifest.js'),
  'utf8'
);
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const fullscreenSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.lux-fullscreen.js'),
  'utf8'
);
const directBrowserGlobalPattern = new RegExp(['global', 'This'].join('') + '|window' + '\\.');

function createClassList() {
  const classes = new Set();
  return {
    contains(className) {
      return classes.has(className);
    },
    toggle(className, force) {
      const shouldAdd = force === undefined ? !classes.has(className) : Boolean(force);
      if (shouldAdd) {
        classes.add(className);
      } else {
        classes.delete(className);
      }
      return shouldAdd;
    },
  };
}

function createButton() {
  const icon = { className: '' };
  return {
    attributes: {},
    classList: createClassList(),
    icon,
    querySelector(selector) {
      return selector === '[data-audit-lux-fullscreen-icon] i' ? icon : null;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function createFullscreenContext({ prebound = false } = {}) {
  const listeners = [];
  const button = createButton();
  const target = {
    classList: createClassList(),
    async requestFullscreen() {
      context.document.fullscreenElement = target;
    },
  };
  const context = {
    console,
    document: {
      fullscreenElement: null,
      addEventListener(type, listener) {
        listeners.push({ type, listener });
      },
      getElementById(id) {
        return id === 'content-container' ? target : null;
      },
      querySelectorAll(selector) {
        return selector === '[data-action="audit-lux-toggle-fullscreen"]' ? [button] : [];
      },
      async exitFullscreen() {
        this.fullscreenElement = null;
      },
    },
    showToast(message) {
      context.toast = message;
    },
    __auditLuxFullscreenBound: prebound,
    button,
    listeners,
    target,
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(fullscreenSource, context, {
    filename: 'KPI.audit.records.lux-fullscreen.js',
  });
  return context;
}

test('audit lux fullscreen binds the fullscreen listener once through the browser adapter', () => {
  const context = createFullscreenContext();

  assert.equal(context.listeners.length, 1);
  assert.equal(context.listeners[0].type, 'fullscreenchange');

  const preboundContext = createFullscreenContext({ prebound: true });
  assert.equal(preboundContext.listeners.length, 0);
});

test('audit lux fullscreen toggle updates button and host state', async () => {
  const context = createFullscreenContext();

  assert.equal(context.getAuditLuxWorkspaceFullscreenButtonHtml().includes('fa-expand'), true);
  await context.toggleAuditLuxWorkspaceFullscreen();
  assert.equal(context.document.fullscreenElement, context.target);
  assert.equal(context.target.classList.contains('is-audit-lux-browser-fullscreen'), true);
  assert.equal(context.button.attributes['aria-pressed'], 'true');
  assert.equal(context.button.icon.className, 'fa-solid fa-compress');

  await context.toggleAuditLuxWorkspaceFullscreen();
  assert.equal(context.document.fullscreenElement, null);
  assert.equal(context.target.classList.contains('is-audit-lux-browser-fullscreen'), false);
  assert.equal(context.button.attributes['aria-pressed'], 'false');
  assert.equal(context.button.icon.className, 'fa-solid fa-expand');
});

test('audit lux fullscreen loads after records browser adapter and does not touch browser globals directly', () => {
  const adapterScript = 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js';
  const fullscreenScript = 'audit/runtime/audit/records/KPI.audit.records.lux-fullscreen.js';
  const adapterHtmlIndex = kpiHtmlSource.indexOf(adapterScript);
  const fullscreenHtmlIndex = kpiHtmlSource.indexOf(fullscreenScript);
  const adapterManifestIndex = manifestSource.indexOf(adapterScript);
  const fullscreenManifestIndex = manifestSource.indexOf(fullscreenScript);

  assert.ok(adapterHtmlIndex >= 0, 'audit records browser adapter loader is missing');
  assert.ok(fullscreenHtmlIndex > adapterHtmlIndex, 'audit lux fullscreen must load after the browser adapter');
  assert.ok(adapterManifestIndex >= 0, 'audit records browser adapter is missing from boot manifest');
  assert.ok(fullscreenManifestIndex > adapterManifestIndex, 'boot manifest must load fullscreen after the browser adapter');
  assert.doesNotMatch(fullscreenSource, directBrowserGlobalPattern);
  assert.match(fullscreenSource, /KpiAuditRecordsBrowserAdapter/);
});
