(function registerProductionExtractorBrowserAdapter(globalScope) {
  const root = globalScope?.window || globalScope;
  if (!root || root.ProductionExtractorBrowserAdapter) return;

  function getImportParsingApi() {
    return root.KPIProductionExtractorImportParsing || null;
  }

  function getExportActionsApi() {
    return root.KPIProductionExtractorExportActions || null;
  }

  function getWindowContext() {
    return root;
  }

  function getLocationSearch() {
    return String(root.location?.search || "");
  }

  function isEmbeddedWindow() {
    try {
      return root.self !== root.top;
    } catch (error) {
      return true;
    }
  }

  function addMessageListener(listener) {
    return root.addEventListener?.("message", listener);
  }

  function canPostToParent() {
    return !!root.parent && root.parent !== root;
  }

  function postToParent(payload, target = "*") {
    return root.parent?.postMessage?.(payload, target);
  }

  function requestParentClose() {
    if (!canPostToParent()) return false;
    postToParent({ type: "kpi-production-close" }, "*");
    return true;
  }

  function canGoBack() {
    return Number(root.history?.length) > 1;
  }

  function goBack() {
    return root.history?.back?.();
  }

  root.ProductionExtractorBrowserAdapter = Object.freeze({
    getImportParsingApi,
    getExportActionsApi,
    getWindowContext,
    getLocationSearch,
    isEmbeddedWindow,
    addMessageListener,
    canPostToParent,
    postToParent,
    requestParentClose,
    canGoBack,
    goBack,
  });

  if (globalScope && globalScope !== root) {
    globalScope.ProductionExtractorBrowserAdapter = root.ProductionExtractorBrowserAdapter;
  }
})(globalThis);
