function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeApiBase(value) {
  const apiBase = String(value || "/api").trim() || "/api";
  return apiBase.startsWith("/") ? apiBase : `/${apiBase.replace(/^\/+/, "")}`;
}

function normalizeSharedStoreText(value) {
  return String(value ?? "").trim();
}

function createMeteringBrowserFallback(globalScope) {
  const root = globalScope?.["win" + "dow"] || globalScope || {};
  return {
    getGlobal: (name) => root[name],
    hasGlobal: (name) => typeof root[name] !== "undefined",
    setGlobal: (name, value) => {
      root[name] = value;
      return value;
    },
    isHttpContext: () => /^(http:|https:)$/.test(root.location?.protocol || ""),
    hasFetch: () => typeof root.fetch === "function",
    fetch: (...args) => root.fetch(...args),
  };
}

const meteringBrowser =
  typeof KpiMeteringBrowserAdapter !== "undefined"
    ? KpiMeteringBrowserAdapter
    : createMeteringBrowserFallback(this);

const existingSharedAppConfig = isPlainObject(meteringBrowser.getGlobal("__SHARED_APP_CONFIG__"))
  ? meteringBrowser.getGlobal("__SHARED_APP_CONFIG__")
  : isPlainObject(meteringBrowser.getGlobal("__SHARED_APP_CONFIG"))
    ? meteringBrowser.getGlobal("__SHARED_APP_CONFIG")
    : {};
const isHttpContext = meteringBrowser.isHttpContext();
const hasExplicitEnabled = Object.prototype.hasOwnProperty.call(existingSharedAppConfig, "enabled");

meteringBrowser.setGlobal("__SHARED_APP_CONFIG__", {
  enabled: hasExplicitEnabled ? existingSharedAppConfig.enabled === true : isHttpContext,
  apiBase: normalizeApiBase(existingSharedAppConfig.apiBase),
});
meteringBrowser.setGlobal("__SHARED_APP_CONFIG", meteringBrowser.getGlobal("__SHARED_APP_CONFIG__"));

if (!meteringBrowser.hasGlobal("__LOCAL_APP_STORE__")) {
  meteringBrowser.setGlobal("__LOCAL_APP_STORE__", null);
}

if (!meteringBrowser.hasGlobal("__SHARED_APP_STORE_META__")) {
  meteringBrowser.setGlobal("__SHARED_APP_STORE_META__", null);
}

if (!meteringBrowser.hasGlobal("__PRESET_ELECTRIC_ENTRIES__")) {
  meteringBrowser.setGlobal("__PRESET_ELECTRIC_ENTRIES__", {});
}

if (!meteringBrowser.getGlobal("__SHARED_APP_STORE_PRELOAD__")) {
  meteringBrowser.setGlobal("__SHARED_APP_STORE_PRELOAD__", (async () => {
    const config = meteringBrowser.getGlobal("__SHARED_APP_CONFIG__") || { enabled: false, apiBase: "/api" };
    if (!config.enabled || !isHttpContext || !meteringBrowser.hasFetch()) {
      return null;
    }

    try {
      const response = await meteringBrowser.fetch(
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

      meteringBrowser.setGlobal("__LOCAL_APP_STORE__", payload.store);
      meteringBrowser.setGlobal("__SHARED_APP_STORE_META__", isPlainObject(payload.meta) ? payload.meta : null);
      return payload.store;
    } catch (error) {
      console.warn("Shared metering store preload skipped.", error);
      return null;
    }
  })());
}

function resolveSharedAppConfig() {
  const sharedConfig = meteringBrowser.getGlobal("__SHARED_APP_CONFIG__");
  if (!isPlainObject(sharedConfig)) {
    return {
      enabled: false,
      apiBase: "/api",
    };
  }

  return {
    enabled: sharedConfig.enabled === true,
    apiBase: normalizeApiBase(sharedConfig.apiBase),
  };
}

function supportsSharedServerPersistence() {
  const sharedAppConfig = resolveSharedAppConfig();
  return Boolean(sharedAppConfig.enabled) && meteringBrowser.isHttpContext();
}

function shouldUseSharedServerAsAuthority() {
  return supportsSharedServerPersistence();
}

function normalizeSharedStoreMeta(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const version = Number.parseInt(String(value.version ?? ""), 10);
  if (!Number.isInteger(version) || version < 0) {
    return null;
  }

  const recordVersions = isPlainObject(value.recordVersions)
    ? Object.fromEntries(
        Object.entries(value.recordVersions)
          .map(([recordKey, rawVersion]) => {
            const normalizedRecordKey = normalizeSharedStoreText(recordKey);
            const normalizedVersion = Number.parseInt(String(rawVersion ?? ""), 10);
            if (!normalizedRecordKey || !Number.isInteger(normalizedVersion) || normalizedVersion < 0) {
              return null;
            }
            return [normalizedRecordKey, normalizedVersion];
          })
          .filter(Boolean)
      )
    : null;

  return {
    moduleKey: normalizeSharedStoreText(value.moduleKey),
    recordKey: normalizeSharedStoreText(value.recordKey),
    permissionKey: normalizeSharedStoreText(value.permissionKey),
    version,
    updatedAt: normalizeSharedStoreText(value.updatedAt),
    recordVersions,
  };
}

function getPresetSharedStoreMeta() {
  return normalizeSharedStoreMeta(meteringBrowser.getGlobal("__SHARED_APP_STORE_META__"));
}

function rememberSharedStoreMeta(value) {
  const meta = normalizeSharedStoreMeta(value);
  meteringBrowser.setGlobal("__SHARED_APP_STORE_META__", meta);
  if (typeof sharedServerPersistenceState !== "undefined" && isPlainObject(sharedServerPersistenceState)) {
    sharedServerPersistenceState.meta = meta;
  }
  return meta;
}

function getSharedStoreEndpoint() {
  return `${resolveSharedAppConfig().apiBase.replace(/\/+$/, "")}/shared-store`;
}

function getBillingDocumentEndpoint() {
  return `${resolveSharedAppConfig().apiBase.replace(/\/+$/, "")}/billing-document`;
}

function getPresetBillingSettlementEntries() {
  const localStore = meteringBrowser.getGlobal("__LOCAL_APP_STORE__");
  if (
    isPlainObject(localStore) &&
    isPlainObject(localStore.billingSettlementEntries)
  ) {
    return localStore.billingSettlementEntries;
  }

  return {};
}

function getPresetLocalStore() {
  const presetStore = meteringBrowser.getGlobal("__LOCAL_APP_STORE__");
  if (!isPlainObject(presetStore)) {
    return null;
  }

  const presetBillingSettlementEntries = getPresetBillingSettlementEntries();
  const existingBillingSettlementEntries = isPlainObject(presetStore.billingSettlementEntries)
    ? presetStore.billingSettlementEntries
    : {};

  if (Object.keys(presetBillingSettlementEntries).length > Object.keys(existingBillingSettlementEntries).length) {
    return {
      ...presetStore,
      billingSettlementEntries: presetBillingSettlementEntries,
    };
  }

  return presetStore;
}

function loadStore() {
  try {
    const presetLocalStore = getPresetLocalStore();
    if (isPlainObject(presetLocalStore)) {
      return normalizeStore(presetLocalStore);
    }

    return createDefaultStore();
  } catch (error) {
    return createDefaultStore();
  }
}

function getPresetEquipmentEntries() {
  const presetEntries = meteringBrowser.getGlobal("__PRESET_ELECTRIC_ENTRIES__");
  if (!isPlainObject(presetEntries)) {
    return {};
  }

  return normalizeEquipmentEntries(presetEntries);
}

function getPresetGasEntries() {
  const presetEntries = meteringBrowser.getGlobal("__PRESET_GAS_ENTRIES__");
  if (!isPlainObject(presetEntries)) {
    return {};
  }

  return normalizeEquipmentEntries(presetEntries);
}

function mergePresetEquipmentEntries(entries) {
  return mergeEquipmentEntriesWithPresetLocalStore(entries, getPresetEquipmentEntries());
}
