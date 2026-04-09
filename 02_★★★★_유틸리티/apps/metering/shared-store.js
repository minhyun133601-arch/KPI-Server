function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeApiBase(value) {
  const apiBase = String(value || "/api").trim() || "/api";
  return apiBase.startsWith("/") ? apiBase : `/${apiBase.replace(/^\/+/, "")}`;
}

const existingSharedAppConfig = isPlainObject(window.__SHARED_APP_CONFIG__)
  ? window.__SHARED_APP_CONFIG__
  : isPlainObject(window.__SHARED_APP_CONFIG)
    ? window.__SHARED_APP_CONFIG
    : {};
const isHttpContext = /^(http:|https:)$/.test(window.location.protocol || "");
const hasExplicitEnabled = Object.prototype.hasOwnProperty.call(existingSharedAppConfig, "enabled");

window.__SHARED_APP_CONFIG__ = {
  enabled: hasExplicitEnabled ? existingSharedAppConfig.enabled === true : isHttpContext,
  apiBase: normalizeApiBase(existingSharedAppConfig.apiBase),
};
window.__SHARED_APP_CONFIG = window.__SHARED_APP_CONFIG__;

if (typeof window.__LOCAL_APP_STORE__ === "undefined") {
  window.__LOCAL_APP_STORE__ = null;
}

if (typeof window.__SHARED_APP_STORE_META__ === "undefined") {
  window.__SHARED_APP_STORE_META__ = null;
}

if (typeof window.__PRESET_ELECTRIC_ENTRIES__ === "undefined") {
  window.__PRESET_ELECTRIC_ENTRIES__ = {};
}

if (!window.__SHARED_APP_STORE_PRELOAD__) {
  window.__SHARED_APP_STORE_PRELOAD__ = (async () => {
    const config = window.__SHARED_APP_CONFIG__ || { enabled: false, apiBase: "/api" };
    if (!config.enabled || !isHttpContext || typeof window.fetch !== "function") {
      return null;
    }

    try {
      const response = await window.fetch(
        `${normalizeApiBase(config.apiBase).replace(/\/+$/, "")}/shared-store`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        return null;
      }

      const payload = await response.json().catch(() => null);
      if (!payload?.ok || !isPlainObject(payload.store)) {
        return null;
      }

      window.__LOCAL_APP_STORE__ = payload.store;
      window.__SHARED_APP_STORE_META__ = isPlainObject(payload.meta) ? payload.meta : null;
      return payload.store;
    } catch (error) {
      console.warn("Shared metering store preload skipped.", error);
      return null;
    }
  })();
}
