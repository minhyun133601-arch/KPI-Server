import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const adapterPath = path.join(repoRoot, 'commands/ops-console-app/ops-console/public/app.browser-adapter.js');
const appPath = path.join(repoRoot, 'commands/ops-console-app/ops-console/public/app.js');
const indexPath = path.join(repoRoot, 'commands/ops-console-app/ops-console/public/index.html');
const adapterSource = await fs.readFile(adapterPath, 'utf8');
const appSource = await fs.readFile(appPath, 'utf8');
const indexSource = await fs.readFile(indexPath, 'utf8');

const mockedGlobalKeys = [
  'addEventListener',
  'confirm',
  'fetch',
  'history',
  'localStorage',
  'location',
  'open',
  'setTimeout',
];

function snapshotGlobals() {
  return new Map(
    mockedGlobalKeys.map((key) => [key, {
      exists: Object.hasOwn(globalThis, key),
      value: globalThis[key],
    }])
  );
}

function restoreGlobals(snapshot) {
  for (const [key, entry] of snapshot.entries()) {
    if (entry.exists) {
      globalThis[key] = entry.value;
    } else {
      delete globalThis[key];
    }
  }
}

test('ops console app browser adapter wraps browser APIs used by the app shell', async () => {
  const snapshot = snapshotGlobals();
  const observed = {
    events: [],
    fetch: null,
    opened: null,
    posted: null,
    replaced: null,
    stored: new Map(),
    timeoutMs: null,
  };

  globalThis.addEventListener = (type, listener, options) => {
    observed.events.push({ type, listener, options });
  };
  globalThis.confirm = (message) => message === 'continue';
  globalThis.fetch = async (url, options) => {
    observed.fetch = { url, options };
    return { ok: true };
  };
  globalThis.history = {
    replaceState(state, title, url) {
      observed.replaced = { state, title, url };
    },
  };
  globalThis.localStorage = {
    getItem(key) {
      return observed.stored.get(key) || null;
    },
    setItem(key, value) {
      observed.stored.set(key, value);
    },
  };
  globalThis.location = {
    hash: '#data',
    origin: 'http://127.0.0.1:3215',
    pathname: '/index.html',
    search: '?lang=en',
  };
  globalThis.open = (url, target, features) => {
    observed.opened = { url, target, features };
    return { closed: false };
  };
  globalThis.setTimeout = (callback, ms) => {
    observed.timeoutMs = ms;
    callback();
    return 1;
  };

  try {
    const { OpsConsoleAppBrowserAdapter } = await import(`${pathToFileURL(adapterPath).href}?t=${Date.now()}`);
    const adapter = OpsConsoleAppBrowserAdapter;

    adapter.writeStorageValue('language', 'en');
    assert.equal(adapter.readStorageValue('language'), 'en');
    assert.equal(adapter.confirm('continue'), true);
    assert.equal(adapter.confirm('stop'), false);
    assert.equal(adapter.getLocationHash(), '#data');

    const response = await adapter.fetch('/api/overview', { method: 'GET' });
    assert.equal(response.ok, true);
    assert.deepEqual(observed.fetch, { url: '/api/overview', options: { method: 'GET' } });

    await adapter.delay(25);
    assert.equal(observed.timeoutMs, 25);

    adapter.replaceLocationHash('preview');
    assert.deepEqual(observed.replaced, {
      state: null,
      title: '',
      url: '/index.html?lang=en#preview',
    });

    adapter.openWindow('/login', '_blank', 'noopener,noreferrer');
    assert.deepEqual(observed.opened, {
      url: '/login',
      target: '_blank',
      features: 'noopener,noreferrer',
    });

    adapter.addGlobalEventListener('hashchange', () => {}, { passive: true });
    assert.equal(observed.events[0]?.type, 'hashchange');
    assert.deepEqual(observed.events[0]?.options, { passive: true });

    adapter.postLanguageToFrame({
      contentWindow: {
        postMessage(message, origin) {
          observed.posted = { message, origin };
        },
      },
    }, 'ko');
    assert.deepEqual(observed.posted, {
      message: { type: 'kpi-ops-language', language: 'ko' },
      origin: 'http://127.0.0.1:3215',
    });
  } finally {
    restoreGlobals(snapshot);
  }
});

test('ops console app host routes direct browser access through the adapter', () => {
  assert.match(adapterSource, /export const OpsConsoleAppBrowserAdapter = Object\.freeze/);
  assert.match(appSource, /import \{ OpsConsoleAppBrowserAdapter \} from '\.\/app\.browser-adapter\.js';/);
  assert.match(indexSource, /src="\/app\.js\?v=20260511b" type="module"/);

  assert.doesNotMatch(appSource, /window\.|globalThis|\blocalStorage\b/);
  assert.doesNotMatch(appSource, /(^|[^\w.])fetch\(/);
  assert.match(appSource, /opsBrowser\.fetch/);
  assert.match(appSource, /opsBrowser\.postLanguageToFrame/);
  assert.match(appSource, /opsBrowser\.replaceLocationHash/);
  assert.match(appSource, /opsBrowser\.addGlobalEventListener/);
});
