export const OpsConsoleAppBrowserAdapter = Object.freeze({
  readStorageValue(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  writeStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  fetch(url, options = {}) {
    return fetch(url, options);
  },
  delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  confirm(message) {
    return confirm(message);
  },
  postLanguageToFrame(frame, language) {
    frame?.contentWindow?.postMessage({ type: 'kpi-ops-language', language }, location.origin);
  },
  getLocationHash() {
    return String(location.hash || '');
  },
  replaceLocationHash(hashValue) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${hashValue}`);
  },
  openWindow(url, target, features) {
    return open(url, target, features);
  },
  addGlobalEventListener(type, listener, options) {
    addEventListener(type, listener, options);
  }
});
