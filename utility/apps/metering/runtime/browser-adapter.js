(function registerKpiMeteringBrowserAdapter(globalScope) {
  const root = globalScope?.window || globalScope;
  if (!root || root.KpiMeteringBrowserAdapter) return;

  function getGlobal(name) {
    if (typeof root[name] !== "undefined") {
      return root[name];
    }
    return globalScope && globalScope !== root ? globalScope[name] : undefined;
  }

  function hasGlobal(name) {
    return (
      typeof root[name] !== "undefined" ||
      Boolean(globalScope && globalScope !== root && typeof globalScope[name] !== "undefined")
    );
  }

  function setGlobal(name, value) {
    root[name] = value;
    if (globalScope && globalScope !== root) {
      globalScope[name] = value;
    }
    return value;
  }

  function getLocationProtocol() {
    return String(root.location?.protocol || "");
  }

  function getLocationHref() {
    return String(root.location?.href || "");
  }

  function isHttpContext() {
    return /^(http:|https:)$/.test(getLocationProtocol());
  }

  function hasFetch() {
    return typeof root.fetch === "function";
  }

  function fetchFromRoot(...args) {
    if (!hasFetch()) {
      return Promise.reject(new Error("metering_fetch_unavailable"));
    }
    return root.fetch(...args);
  }

  function alertUser(message) {
    if (typeof root.alert === "function") {
      root.alert(message);
    }
  }

  function confirmUser(message) {
    return typeof root.confirm === "function" ? root.confirm(message) : false;
  }

  function promptUser(message, defaultValue = "") {
    return typeof root.prompt === "function" ? root.prompt(message, defaultValue) : null;
  }

  function openRootWindow(url = "", target = "_blank", features = "") {
    return typeof root.open === "function" ? root.open(url, target, features) : null;
  }

  function showRootDirectoryPicker(...args) {
    return typeof root.showDirectoryPicker === "function"
      ? root.showDirectoryPicker(...args)
      : Promise.resolve(null);
  }

  function setRootTimeout(callback, delay = 0, ...args) {
    if (typeof root.setTimeout !== "function") {
      return null;
    }
    return root.setTimeout(callback, delay, ...args);
  }

  function clearRootTimeout(timeoutId) {
    if (typeof root.clearTimeout === "function") {
      root.clearTimeout(timeoutId);
    }
  }

  function addRootEventListener(...args) {
    if (typeof root.addEventListener === "function") {
      root.addEventListener(...args);
    }
  }

  function removeRootEventListener(...args) {
    if (typeof root.removeEventListener === "function") {
      root.removeEventListener(...args);
    }
  }

  function getStoreUpdateTargets() {
    const targets = [root];
    try {
      if (root.parent && root.parent !== root && !targets.includes(root.parent)) {
        targets.push(root.parent);
      }
    } catch (error) {
      console.warn("Failed to access parent window for metering update notification.", error);
    }

    try {
      if (root.top && root.top !== root && !targets.includes(root.top)) {
        targets.push(root.top);
      }
    } catch (error) {
      console.warn("Failed to access top window for metering update notification.", error);
    }
    return targets;
  }

  root.KpiMeteringBrowserAdapter = Object.freeze({
    getGlobal,
    hasGlobal,
    setGlobal,
    getLocationProtocol,
    getLocationHref,
    isHttpContext,
    hasFetch,
    fetch: fetchFromRoot,
    alert: alertUser,
    confirm: confirmUser,
    prompt: promptUser,
    openWindow: openRootWindow,
    showDirectoryPicker: showRootDirectoryPicker,
    setTimeout: setRootTimeout,
    clearTimeout: clearRootTimeout,
    addEventListener: addRootEventListener,
    removeEventListener: removeRootEventListener,
    getStoreUpdateTargets
  });

  if (globalScope && globalScope !== root) {
    globalScope.KpiMeteringBrowserAdapter = root.KpiMeteringBrowserAdapter;
  }
})(globalThis);
