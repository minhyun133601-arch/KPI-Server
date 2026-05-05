import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const kpiHtmlSource = await fs.readFile(path.join(repoRoot, 'KPI.html'), 'utf8');
const adapterSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.browser-adapter.js'),
  'utf8'
);
const uiActionsSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.ui-actions.js'),
  'utf8'
);
const auditRenderSource = await fs.readFile(
  path.join(repoRoot, 'audit/runtime/audit/records/KPI.audit.records.render.js'),
  'utf8'
);

function createClassList(initial = []) {
  const classes = new Set(initial);
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

function createElement(initialClasses = []) {
  return {
    attributes: {},
    classList: createClassList(initialClasses),
    focused: false,
    focus() {
      this.focused = true;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function createUiActionsContext(elements) {
  const context = {
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
    },
  };
  context['global' + 'This'] = context;
  vm.createContext(context);
  vm.runInContext(adapterSource, context, {
    filename: 'KPI.audit.records.browser-adapter.js',
  });
  vm.runInContext(uiActionsSource, context, {
    filename: 'KPI.audit.records.ui-actions.js',
  });
  return context;
}

test('audit ui actions toggle note panel and focus the note textarea', () => {
  const notePanel = createElement();
  const noteTextarea = createElement();
  const context = createUiActionsContext({
    'audit-note-panel-lux': notePanel,
    'audit-note-lux': noteTextarea,
  });

  context.toggleAuditNote('lux');

  assert.equal(notePanel.classList.contains('open'), true);
  assert.equal(noteTextarea.focused, true);
});

test('audit ui actions keep notice modal and button aria state in sync', () => {
  const noticeModal = createElement();
  const noticeButton = createElement();
  const context = createUiActionsContext({
    'audit-notice-modal-lux': noticeModal,
    'audit-notice-toggle-lux': noticeButton,
  });

  context.toggleAuditNotice('lux');
  assert.equal(noticeModal.classList.contains('is-open'), true);
  assert.equal(noticeModal.attributes['aria-hidden'], 'false');
  assert.equal(noticeButton.classList.contains('is-open'), true);
  assert.equal(noticeButton.attributes['aria-expanded'], 'true');

  context.toggleAuditNotice('lux');
  assert.equal(noticeModal.classList.contains('is-open'), false);
  assert.equal(noticeModal.attributes['aria-hidden'], 'true');
  assert.equal(noticeButton.classList.contains('is-open'), false);
  assert.equal(noticeButton.attributes['aria-expanded'], 'false');
});

test('kpi html loads audit ui actions before audit renderers', () => {
  const actionsIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.ui-actions.js'
  );
  const luxWorkspaceIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.lux-workspace.js'
  );
  const renderIndex = kpiHtmlSource.indexOf(
    'audit/runtime/audit/records/KPI.audit.records.render.js'
  );

  assert.ok(actionsIndex > 0);
  assert.ok(luxWorkspaceIndex > actionsIndex);
  assert.ok(renderIndex > actionsIndex);
  assert.doesNotMatch(auditRenderSource, /function toggleAuditNote/);
  assert.doesNotMatch(auditRenderSource, /function toggleAuditNotice/);
  assert.doesNotMatch(uiActionsSource, /globalThis|window\./);
  assert.match(uiActionsSource, /KpiAuditRecordsBrowserAdapter/);
});
