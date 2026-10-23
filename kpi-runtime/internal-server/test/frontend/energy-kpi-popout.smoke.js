import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../../../sections/kpi/KPI.sections.kpi.energy-popout.js', import.meta.url), 'utf8');
const viewSource = await fs.readFile(new URL('../../../sections/kpi/KPI.sections.kpi.energy-view.js', import.meta.url), 'utf8');

class Element {
  constructor(tag, document) {
    this.tagName = tag.toLowerCase();
    this.ownerDocument = document;
    this.children = [];
    this.attrs = new Map();
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.focusCount = 0;
    this.classList = { add: value => { this.className = `${this.className} ${value}`.trim(); } };
    if (tag === 'template') this.content = new Element('fragment', document);
  }
  setAttribute(name, value) { this.attrs.set(name.toLowerCase(), String(value)); }
  getAttribute(name) { return this.attrs.get(name.toLowerCase()) ?? null; }
  hasAttribute(name) { return this.attrs.has(name.toLowerCase()); }
  removeAttribute(name) { this.attrs.delete(name.toLowerCase()); }
  get attributes() { return Array.from(this.attrs, ([name, value]) => ({ name, value })); }
  set className(value) { this.setAttribute('class', value); }
  get className() { return this.getAttribute('class') || ''; }
  set hidden(value) { if (value) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  get hidden() { return this.hasAttribute('hidden'); }
  set textContent(value) { this.children = []; this.text = String(value); }
  get textContent() { return (this.text || '') + this.children.map(child => child.textContent).join(''); }
  appendChild(child) {
    child.remove();
    child.parentElement = this;
    this.children.push(child);
    return child;
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    this.text = '';
    children.forEach(child => this.appendChild(child));
  }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }
  contains(element) { return element === this || this.children.some(child => child.contains(element)); }
  matches(selector) {
    if (selector === '*') return true;
    if (selector.startsWith('.')) return this.className.split(/\s+/).includes(selector.slice(1));
    if (selector.startsWith('#')) return this.getAttribute('id') === selector.slice(1);
    const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attribute) return this.hasAttribute(attribute[1]) && (attribute[2] === undefined || this.getAttribute(attribute[1]) === attribute[2]);
    return this.tagName === selector;
  }
  querySelectorAll(selector) {
    const selectors = selector.split(',').map(value => value.trim());
    const found = [];
    for (const child of this.children) {
      if (selectors.some(value => child.matches(value))) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  focus() { this.focusCount += 1; this.ownerDocument.activeElement = this; }
  set innerHTML(html) {
    const container = this.content || this;
    container.replaceChildren();
    const stack = [container];
    for (const token of html.match(/<[^>]*>|[^<]+/g) || []) {
      if (token.startsWith('</')) { stack.pop(); continue; }
      if (!token.startsWith('<')) {
        const text = new Element('text', this.ownerDocument);
        text.textContent = token;
        stack.at(-1).appendChild(text);
        continue;
      }
      const tag = token.match(/^<([\w-]+)/)?.[1];
      if (!tag) continue;
      const element = new Element(tag, this.ownerDocument);
      const attributes = token.slice(tag.length + 1).replace(/\/?\s*>$/, '');
      for (const match of attributes.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
        element.setAttribute(match[1], match[2] ?? match[3] ?? match[4] ?? '');
      }
      stack.at(-1).appendChild(element);
      if (!/\/$/.test(attributes) && !['meta', 'link', 'img', 'input', 'br', 'hr'].includes(tag)) stack.push(element);
    }
  }
}

class Document {
  constructor() {
    this.documentElement = new Element('html', this);
    this.head = new Element('head', this);
    this.body = new Element('body', this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.activeElement = this.body;
    this.focused = true;
    this.listeners = new Map();
  }
  get title() { return this.head.querySelector('title')?.textContent || ''; }
  set title(value) {
    let title = this.head.querySelector('title');
    if (!title) {
      title = this.createElement('title');
      this.head.appendChild(title);
    }
    title.textContent = value;
  }
  createElement(tag) { return new Element(tag, this); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  hasFocus() { return this.focused; }
  dispatch(name, target, key) {
    const event = { target, key, prevented: false, preventDefault() { this.prevented = true; } };
    this.listeners.get(name)?.(event);
    return event;
  }
}

function createHarness({ blocked = false, baseURI = 'http://127.0.0.1:3100/KPI.html', styleSheets = [] } = {}) {
  const windows = [];
  const calls = [];
  const events = [];
  const context = vm.createContext({
    URL,
    document: { baseURI, styleSheets },
    open(...args) {
      calls.push(args);
      if (blocked) return null;
      const listeners = new Map();
      const window = {
        document: new Document(), closed: false, focusCount: 0,
        focus() { this.focusCount += 1; },
        close() { this.closed = true; listeners.get('pagehide')?.(); },
        addEventListener(name, listener) { listeners.set(name, listener); },
        navigateAway() { listeners.get('pagehide')?.(); },
      };
      windows.push(window);
      return window;
    },
  });
  vm.runInContext(viewSource, context);
  vm.runInContext(source, context);
  const parts = vm.runInContext('this[Symbol.for("kpi.energy.kpi.parts")]', context);
  const api = parts.createEnergyKpiPopout({
    onPanelChange: key => events.push(['panel', key]),
    onTeamSelect: key => events.push(['team', key]),
    onClosed: () => events.push(['closed']),
  });
  const report = label => parts.buildEnergyKpiReportHtml({
    scopeLabel: label || '전체', monthKeys: ['2026-01'],
    teams: [{ key: 'team-02', label: '2팀' }],
  });
  return { api, windows, calls, events, report, current: () => windows.at(-1), drawer: () => windows.at(-1).document.body.querySelector('[data-energy-kpi-drawer]') };
}

test('opens an independent native window, includes only details and a single absolute stylesheet', () => {
  for (const baseURI of ['http://127.0.0.1:3100/', 'http://127.0.0.1:3100/KPI.html']) {
    const harness = createHarness({ baseURI });
    assert.equal(harness.api.open({ html: harness.report(), key: 'teams' }), true);
    assert.deepEqual(harness.calls[0], ['', '_blank', 'popup=yes,width=820,height=820,resizable=yes,scrollbars=yes']);
    const document = harness.current().document;
    assert.equal(document.title, 'KPI 상세 자료');
    assert.equal(document.documentElement.lang, 'ko');
    assert.match(document.documentElement.className, /energy-kpi-popout-document/);
    assert.equal(document.head.querySelectorAll('link').length, 1);
    assert.equal(document.head.querySelector('link').href, 'http://127.0.0.1:3100/kpi-runtime/app/styles/shell/dashboard/06-energy-kpi.css?v=6');
    assert.equal(document.body.querySelector('[data-energy-kpi-main]'), null);
    assert.equal(harness.drawer().hidden, false);
    assert.equal(document.body.querySelector('[data-energy-kpi-panel-content="teams"]').hidden, false);
    assert.equal(document.body.querySelector('[data-energy-kpi-panel-content="monthly"]').hidden, true);
    assert.equal(document.body.querySelector('[data-energy-kpi-drag-handle]'), null);
    assert.equal(document.body.querySelector('[data-energy-kpi-drag-keyboard]'), null);
    assert.equal(document.body.querySelector('[data-energy-kpi-popout]'), null);
    for (const element of document.body.querySelectorAll('*')) assert.equal(element.attributes.some(attribute => /^on/i.test(attribute.name)), false);
  }
});

test('handles blocked popups, reuses one live window and never focuses it during background updates', () => {
  const blocked = createHarness({ blocked: true });
  assert.equal(blocked.api.open({ html: blocked.report() }), false);
  assert.equal(blocked.api.isOpen(), false);
  assert.equal(blocked.api.update({ html: blocked.report() }), false);
  const harness = createHarness();
  harness.api.open({ html: harness.report() });
  harness.api.update({ html: harness.report('2팀'), key: 'composition' });
  assert.equal(harness.current().focusCount, 1);
  assert.match(harness.drawer().textContent, /2팀/);
  harness.api.open({ html: harness.report(), key: 'conversion' });
  assert.equal(harness.calls.length, 1);
  assert.equal(harness.current().focusCount, 2);
  assert.equal(harness.api.isOpen(), true);
});

test('copies only the loaded KPI stylesheet through nested imports without extra network loading', () => {
  const inaccessible = { get cssRules() { throw new Error('cross origin'); } };
  const target = {
    href: 'http://127.0.0.1:3100/kpi-runtime/app/styles/shell/dashboard/06-energy-kpi.css?v=6',
    cssRules: [{ cssText: '.energy-kpi-drawer { color: navy; }' }, { cssText: '@media (max-width: 900px) { .energy-kpi-drawer { width: 100%; } }' }],
  };
  const shared = { href: '/dashboard.css', cssRules: [{ cssText: '.private-app-style { display: block; }' }, { styleSheet: target }] };
  const harness = createHarness({ styleSheets: [inaccessible, { href: '/app.css', cssRules: [{ styleSheet: shared }] }] });
  assert.equal(harness.api.open({ html: harness.report() }), true);
  const document = harness.current().document;
  assert.equal(document.head.querySelector('link'), null);
  assert.equal(document.head.querySelectorAll('style').length, 1);
  assert.equal(document.head.querySelector('style').textContent, target.cssRules.map(rule => rule.cssText).join('\n'));
  assert.doesNotMatch(document.head.querySelector('style').textContent, /private-app-style/);
  assert.equal(document.title, 'KPI 상세 자료');
});

test('delegates tab, keyboard, and team actions with current accessible panel state', () => {
  const harness = createHarness();
  harness.api.open({ html: harness.report() });
  const document = harness.current().document;
  const tab = document.body.querySelector('[data-energy-kpi-panel-tab="teams"]');
  document.dispatch('click', tab);
  assert.deepEqual(harness.events.at(-1), ['panel', 'teams']);
  assert.equal(tab.getAttribute('aria-selected'), 'true');
  assert.equal(tab.tabIndex, 0);
  assert.equal(document.body.querySelector('[data-energy-kpi-panel-content="teams"]').hidden, false);
  const event = document.dispatch('keydown', tab, 'ArrowRight');
  assert.equal(event.prevented, true);
  assert.deepEqual(harness.events.at(-1), ['panel', 'conversion']);
  assert.equal(document.activeElement.getAttribute('data-energy-kpi-panel-tab'), 'conversion');
  document.dispatch('keydown', document.activeElement, 'Home');
  assert.deepEqual(harness.events.at(-1), ['panel', 'monthly']);
  document.dispatch('click', document.body.querySelector('[data-energy-kpi-team="team-02"]'));
  assert.deepEqual(harness.events.at(-1), ['team', 'team-02']);
});

test('preserves internal scroll and semantic focus across updated scope/date content', () => {
  const harness = createHarness();
  harness.api.open({ html: harness.report(), key: 'monthly' });
  const document = harness.current().document;
  document.body.querySelector('[data-energy-kpi-drawer-scroll]').scrollTop = 170;
  document.body.querySelector('.energy-kpi-monthly-scroll').scrollLeft = 35;
  document.body.querySelector('[data-energy-kpi-panel-tab="monthly"]').focus();
  harness.api.update({ html: harness.report('3팀'), key: 'monthly' });
  assert.equal(document.body.querySelector('[data-energy-kpi-drawer-scroll]').scrollTop, 170);
  assert.equal(document.body.querySelector('.energy-kpi-monthly-scroll').scrollLeft, 35);
  assert.equal(document.activeElement, document.body.querySelector('[data-energy-kpi-panel-tab="monthly"]'));
  assert.match(harness.drawer().textContent, /3팀/);
  document.focused = false;
  harness.api.update({ html: harness.report('2팀'), key: 'monthly' });
  assert.equal(document.body.querySelector('[data-energy-kpi-panel-tab="monthly"]').focusCount, 0);
  assert.equal(harness.current().focusCount, 1);
});

test('invalid periods replace stale tables with an escaped error while remaining closable', () => {
  const harness = createHarness();
  harness.api.open({ html: harness.report() });
  harness.api.update({ error: '<invalid period>', key: 'monthly' });
  const document = harness.current().document;
  assert.equal(document.body.querySelector('table'), null);
  assert.equal(document.body.querySelector('[role="alert"]').textContent, '<invalid period>');
  assert.equal(document.body.querySelector('invalid'), null);
  assert.equal(document.body.querySelector('[data-energy-kpi-popout]'), null);
  document.dispatch('click', document.body.querySelector('[data-energy-kpi-panel-close]'));
  assert.equal(harness.current().closed, true);
  assert.deepEqual(harness.events, [['closed']]);
});

test('native close, Escape and navigation notify once; programmatic close suppresses notification', () => {
  for (const action of ['native', 'escape', 'navigate', 'programmatic']) {
    const harness = createHarness();
    harness.api.open({ html: harness.report() });
    const window = harness.current();
    if (action === 'native') window.close();
    if (action === 'escape') window.document.dispatch('keydown', window.document.body, 'Escape');
    if (action === 'navigate') window.navigateAway();
    if (action === 'programmatic') harness.api.close();
    assert.equal(harness.api.isOpen(), false);
    assert.deepEqual(harness.events, action === 'programmatic' ? [] : [['closed']]);
    window.navigateAway();
    assert.equal(harness.events.length, action === 'programmatic' ? 0 : 1);
  }
});

test('closed or cross-origin windows cannot break main-screen updates and can be reopened', () => {
  const harness = createHarness();
  harness.api.open({ html: harness.report() });
  Object.defineProperty(harness.current(), 'document', { get() { throw new Error('cross origin'); } });
  assert.equal(harness.api.isOpen(), false);
  assert.equal(harness.api.update({ html: harness.report() }), false);
  assert.equal(harness.api.open({ html: harness.report() }), true);
  assert.equal(harness.windows.length, 2);
  harness.current().closed = true;
  assert.equal(harness.api.update({ html: harness.report() }), false);
  assert.equal(harness.api.isOpen(), false);
});

test('strips executable elements and inline handlers from imported details', () => {
  const harness = createHarness();
  harness.api.open({ html: '<div data-energy-kpi-main>do not copy</div><aside data-energy-kpi-drawer onclick="bad()"><script>bad()</script><iframe src="/private"></iframe><link href="/secret"><button data-energy-kpi-panel-close onfocus="bad()">close</button></aside>' });
  assert.equal(harness.drawer().getAttribute('onclick'), null);
  assert.equal(harness.drawer().querySelectorAll('script, iframe, link').length, 0);
  assert.equal(harness.drawer().querySelector('button').getAttribute('onfocus'), null);
  assert.doesNotMatch(harness.current().document.body.textContent, /do not copy|bad\(\)/);
});
